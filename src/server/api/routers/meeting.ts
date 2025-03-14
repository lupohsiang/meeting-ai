import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { transcriptionQueue } from "~/server/transcription/queue";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const meetingRouter = createTRPCRouter({
  // Get all meetings (for the current user)
  getAll: publicProcedure.query(async ({ ctx }) => {
    // TODO: Filter by current user ID when auth is implemented
    const meetings = await ctx.db.meeting.findMany({
      orderBy: { createdAt: "desc" },
      take: 10, // Limit to 10 most recent meetings
      select: {
        id: true,
        title: true,
        createdAt: true,
        duration: true,
        transcriptionStatus: true,
        todos: {
          select: {
            id: true,
            isComplete: true,
          },
        },
      },
    });

    return meetings;
  }),

  // Get meeting by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: input.id },
        include: { todos: true },
      });

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      // TODO: Add authorization check

      return {
        id: meeting.id,
        title: meeting.title,
        transcript: meeting.transcript,
        transcriptionStatus: meeting.transcriptionStatus,
        createdAt: meeting.createdAt,
        duration: meeting.duration,
        todos: meeting.todos,
      };
    }),

  // Retry transcription
  retryTranscription: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: input.id },
      });

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      // Update meeting status
      await ctx.db.meeting.update({
        where: { id: input.id },
        data: {
          transcriptionStatus: "pending",
          transcript: "", // Clear previous transcript
        },
      });

      // Add to transcription queue
      await transcriptionQueue.addJob({
        id: uuidv4(),
        audioFilePath: meeting.audioFilePath,
        userId: meeting.userId,
        meetingId: meeting.id,
        provider: "openai",
      });

      return { success: true };
    }),

  // Extract to-do items from transcript
  extractTodos: publicProcedure
    .input(
      z.object({
        meetingId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: input.meetingId },
        include: { todos: true },
      });

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      if (meeting.transcriptionStatus !== "completed") {
        throw new Error("Transcript is not yet complete");
      }

      if (!meeting.transcript || meeting.transcript.trim() === "") {
        throw new Error("Transcript is empty");
      }

      try {
        // Use OpenAI to extract todos from the transcript
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Extract all action items and to-dos from the following meeting transcript. 
              Return a JSON object with the format {"todos": [{"description": "Task description", "priority": "High"}, ...]}.
              Set priority as "High", "Medium", or "Low" based on your judgment.
              Only include clear action items, not general discussion points.`,
            },
            {
              role: "user",
              content: meeting.transcript,
            },
          ],
          response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message.content ?? "{}";
        const extractedData = JSON.parse(content) as {
          todos?: Array<{ description: string; priority: string }>;
        };

        if (!extractedData.todos || !Array.isArray(extractedData.todos)) {
          throw new Error("Invalid response format from AI");
        }

        // Delete existing todos for this meeting
        await ctx.db.todo.deleteMany({
          where: { meetingId: meeting.id },
        });

        // Create new todos
        const createdTodos = await Promise.all(
          extractedData.todos.map(
            async (todo: { description: string; priority: string }) => {
              return ctx.db.todo.create({
                data: {
                  description: todo.description,
                  priority: todo.priority || "Medium",
                  meetingId: meeting.id,
                },
              });
            },
          ),
        );

        return {
          success: true,
          todos: createdTodos,
        };
      } catch (error) {
        console.error("Error extracting todos:", error);
        throw new Error(
          `Failed to extract todos: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }),

  // Toggle todo completion
  toggleTodoCompletion: publicProcedure
    .input(
      z.object({
        todoId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const todo = await ctx.db.todo.findUnique({
        where: { id: input.todoId },
      });

      if (!todo) {
        throw new Error("Todo not found");
      }

      const updatedTodo = await ctx.db.todo.update({
        where: { id: input.todoId },
        data: { isComplete: !todo.isComplete },
      });

      return updatedTodo;
    }),

  // Delete meeting and all associated todos
  deleteMeeting: publicProcedure
    .input(
      z.object({
        meetingId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: input.meetingId },
      });

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      // Delete the meeting (todos will be deleted automatically via cascading delete)
      await ctx.db.meeting.delete({
        where: { id: input.meetingId },
      });

      return { success: true };
    }),
});

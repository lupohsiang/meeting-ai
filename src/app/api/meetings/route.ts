import { NextResponse } from "next/server";
import { saveAudioFile } from "~/server/utils/file-storage";
import { db } from "~/server/db";
import { transcriptionQueue } from "~/server/transcription/queue";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    // TODO: Check authentication
    const formData = await request.formData();
    const audioBlob = formData.get("audio") as Blob;
    const duration = Number(formData.get("duration") ?? 0);

    if (!audioBlob) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    // Save the audio file
    const { filename, path } = await saveAudioFile(audioBlob);

    // Create a new meeting record in the database
    const meeting = await db.meeting.create({
      data: {
        title: `Meeting ${new Date().toLocaleString()}`,
        audioFilePath: path,
        duration,
        transcript: "",
        transcriptionStatus: "pending",
        userId: "default", // TODO: Get from auth session
      },
    });

    // Add to transcription queue
    await transcriptionQueue.addJob({
      id: uuidv4(),
      audioFilePath: path,
      userId: meeting.userId,
      meetingId: meeting.id,
    });

    return NextResponse.json({ 
      meetingId: meeting.id, 
      filename,
      message: "Meeting saved and queued for transcription" 
    });
  } catch (error) {
    console.error("Error handling meeting recording:", error);

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes("foreign key")) {
        return NextResponse.json(
          { error: "Invalid user session" },
          { status: 401 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to process recording" },
      { status: 500 },
    );
  }
}

"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { api } from "~/trpc/react";

interface Todo {
  id: string;
  description: string;
  priority: string;
  isComplete: boolean;
  meetingId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TodoSectionProps {
  meetingId: string;
  initialTodos: Todo[];
  transcriptionComplete: boolean;
}

export function TodoSection({ meetingId, initialTodos, transcriptionComplete }: TodoSectionProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [isExtracting, setIsExtracting] = useState(false);
  
  const utils = api.useUtils();
  
  // Toggle todo completion mutation
  const toggleMutation = api.meeting.toggleTodoCompletion.useMutation({
    onSuccess: (updatedTodo) => {
      setTodos((currentTodos) =>
        currentTodos.map((todo) =>
          todo.id === updatedTodo.id ? { ...todo, isComplete: updatedTodo.isComplete } : todo
        )
      );
      toast.success(`Task ${updatedTodo.isComplete ? "completed" : "reopened"}`);
    },
    onError: (error) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });

  // Extract todos mutation
  const extractMutation = api.meeting.extractTodos.useMutation({
    onSuccess: (data) => {
      setTodos(data.todos);
      setIsExtracting(false);
      toast.success("Todo items extracted from transcript");
      // Invalidate queries to ensure data consistency
      void utils.meeting.getById.invalidate({ id: meetingId });
    },
    onError: (error) => {
      setIsExtracting(false);
      toast.error(`Failed to extract todos: ${error.message}`);
    },
  });

  // Handle extract todos button click
  const handleExtractTodos = () => {
    setIsExtracting(true);
    extractMutation.mutate({ meetingId });
  };

  // Handle todo item toggle
  const handleToggleTodo = (todoId: string) => {
    toggleMutation.mutate({ todoId });
  };

  // Get badge color based on priority
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <Card className="w-full bg-white/10 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Action Items</CardTitle>
        {transcriptionComplete && (
          <Button
            onClick={handleExtractTodos}
            disabled={isExtracting}
            variant="outline"
            size="sm"
          >
            {isExtracting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-current"></div>
                Extracting...
              </>
            ) : (
              "Extract Action Items"
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!transcriptionComplete ? (
          <div className="my-4 text-center text-sm text-gray-400">
            Complete the transcription to extract action items
          </div>
        ) : todos.length === 0 ? (
          <div className="my-4 text-center text-sm text-gray-400">
            {isExtracting 
              ? "Analyzing transcript for action items..."
              : "No action items found. Click 'Extract Action Items' to analyze the transcript."}
          </div>
        ) : (
          <ul className="space-y-3">
            {todos.map((todo) => (
              <li
                key={todo.id}
                className={`flex items-center gap-3 rounded-md bg-white/5 p-3 transition-opacity ${
                  todo.isComplete ? "opacity-60" : ""
                }`}
              >
                <Checkbox
                  checked={todo.isComplete}
                  onCheckedChange={() => handleToggleTodo(todo.id)}
                  className="h-5 w-5"
                />
                <div className="flex flex-1 flex-col gap-1">
                  <span className={todo.isComplete ? "line-through" : ""}>
                    {todo.description}
                  </span>
                </div>
                <Badge className={getPriorityColor(todo.priority)}>
                  {todo.priority}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

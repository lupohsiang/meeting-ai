"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip";
import { CheckCircle, Circle, Clock, AlertCircle, CheckSquare } from "lucide-react";

export function MeetingsList() {
  const { data: meetings, isLoading, error } = api.meeting.getAll.useQuery();
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl bg-white/10 p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        <span className="ml-2">Loading meetings...</span>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="rounded-xl bg-white/10 p-8 text-center text-red-300">
        <p>Failed to load meetings: {error.message}</p>
      </div>
    );
  }
  
  // Empty state
  if (!meetings || meetings.length === 0) {
    return (
      <div className="rounded-xl bg-white/10 p-8 text-center">
        <p>No meetings found. Start by recording a new meeting!</p>
      </div>
    );
  }
  
  // Get status icon for transcription status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      default:
        return <Circle className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get status text for transcription status
  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Transcription completed";
      case "failed":
        return "Transcription failed";
      case "processing":
        return "Transcription in progress";
      default:
        return "Waiting to start";
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  };
  
  // List of meetings
  return (
    <div className="rounded-xl bg-white/10 p-6">
      <ul className="divide-y divide-white/10">
        {meetings.map((meeting) => (
          <li key={meeting.id} className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">{meeting.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>{new Date(meeting.createdAt).toLocaleString()}</span>
                  <span>·</span>
                  <span>{formatDuration(meeting.duration)}</span>
                  {meeting.todos && meeting.todos.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <CheckSquare className="h-3.5 w-3.5" />
                        {meeting.todos.filter(todo => todo.isComplete).length}/{meeting.todos.length}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="mr-2">
                        {getStatusIcon(meeting.transcriptionStatus)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getStatusText(meeting.transcriptionStatus)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Link href={`/transcription?meetingId=${meeting.id}`}>
                  <Button size="sm" variant="ghost">
                    View
                  </Button>
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

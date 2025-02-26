"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { api } from "~/trpc/react";
import { TodoSection } from "~/app/_components/todo-section";

interface TranscriptionUIProps {
  meetingId?: string;
}

// Types for transcript status and data
interface Todo {
  id: string;
  description: string;
  priority: "high" | "medium" | "low";
  isComplete: boolean;
}

interface TranscriptionData {
  id: string;
  title: string;
  transcript: string;
  transcriptionStatus: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
  duration: number;
  todos?: Todo[];
}

// ProgressIndicator component for different transcription states
function ProgressIndicator({
  status,
}: {
  status: TranscriptionData["transcriptionStatus"];
}) {
  const getProgressPercentage = () => {
    switch (status) {
      case "pending":
        return 10;
      case "processing":
        return 60;
      case "completed":
        return 100;
      case "failed":
        return 100;
      default:
        return 0;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "pending":
        return "Waiting to start transcription...";
      case "processing":
        return "Transcribing your meeting...";
      case "completed":
        return "Transcription complete!";
      case "failed":
        return "Transcription failed";
      default:
        return "Unknown status";
    }
  };

  const isIndeterminate = status === "pending" || status === "processing";

  return (
    <div className="mb-8 w-full max-w-md" role="alert" aria-live="polite">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">{getStatusMessage()}</span>
        <span className="text-sm font-medium">
          {isIndeterminate
            ? "In progress"
            : status === "completed"
              ? "Complete"
              : "Error"}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full transition-all duration-500 ease-in-out ${
            status === "failed" ? "bg-red-500" : "bg-blue-500"
          } ${isIndeterminate ? "animate-pulse" : ""}`}
          style={{ width: `${getProgressPercentage()}%` }}
          role="progressbar"
          aria-valuenow={getProgressPercentage()}
          aria-valuemin={0}
          aria-valuemax={100}
        ></div>
      </div>
    </div>
  );
}

// Main TranscriptionUI component
export function TranscriptionUI({ meetingId }: TranscriptionUIProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);

  // Use tRPC hooks for data fetching and mutations
  const {
    data: transcriptionData,
    isLoading,
    refetch,
  } = api.meeting.getById.useQuery(
    { id: meetingId || "" },
    {
      enabled: !!meetingId,
      refetchInterval: (data) => {
        // Stop polling if transcription is completed or failed
        if (
          data?.transcriptionStatus === "completed" ||
          data?.transcriptionStatus === "failed"
        ) {
          return false;
        }
        // Otherwise, poll every 3 seconds
        return 3000;
      },
      onError: (err) => {
        setError(err.message);
      },
    },
  );

  // Retry mutation
  const retryMutation = api.meeting.retryTranscription.useMutation({
    onSuccess: () => {
      toast.success("Transcription restarted");
      void refetch();
    },
    onError: (err) => {
      setError(err.message);
      toast.error("Failed to retry transcription");
    },
  });

  // Retry transcription function
  const retryTranscription = async () => {
    if (!meetingId) return;
    retryMutation.mutate({ id: meetingId });
  };

  // If no meeting ID is provided
  if (!meetingId) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4 rounded-lg bg-white/10 p-8 text-center">
        <h2 className="text-xl font-semibold">No Meeting Selected</h2>
        <p>Please select a meeting to view its transcription.</p>
        <Link href="/" className="mt-4">
          <Button>Return to Home</Button>
        </Link>
      </div>
    );
  }

  // Show loading state
  if (isLoading && !transcriptionData) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4 rounded-lg bg-white/10 p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        <p className="text-center text-sm" aria-live="polite">
          Loading transcription data...
        </p>
      </div>
    );
  }

  // Show error state
  if (error && !transcriptionData) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4 rounded-lg bg-red-100/10 p-8 text-center">
        <div className="rounded-full bg-red-100 p-2 text-red-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-red-600">
          Error Loading Transcription
        </h2>
        <p className="text-red-500">{error}</p>
        <div className="mt-4 flex gap-4">
          <Button variant="outline" onClick={() => void refetch()}>
            Try Again
          </Button>
          <Link href="/">
            <Button variant="ghost">Return to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // If we have transcription data
  return (
    <div className="w-full max-w-4xl rounded-lg bg-white/10 p-8">
      {/* Header section */}
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">
          {transcriptionData?.title || "Untitled Meeting"}
        </h2>
        <p className="text-sm text-gray-400">
          {transcriptionData?.createdAt
            ? new Date(transcriptionData.createdAt).toLocaleString()
            : "Unknown date"}
          {transcriptionData?.duration
            ? ` · ${Math.floor(transcriptionData.duration / 60)}:${String(transcriptionData.duration % 60).padStart(2, "0")}`
            : ""}
        </p>
      </div>

      {/* Progress indicator */}
      {transcriptionData && (
        <ProgressIndicator status={transcriptionData.transcriptionStatus} />
      )}

      {/* Transcription results */}
      <div className="mb-8">
        <h3 className="mb-2 text-lg font-medium">Transcription</h3>

        {transcriptionData?.transcriptionStatus === "pending" && (
          <div className="rounded-md bg-gray-800/30 p-4 text-center">
            <p>Transcription is queued and will begin shortly...</p>
          </div>
        )}

        {transcriptionData?.transcriptionStatus === "processing" && (
          <div className="rounded-md bg-blue-800/30 p-4 text-center">
            <div className="mb-2 flex items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
            </div>
            <p>
              Your meeting is being transcribed. This may take a few minutes...
            </p>
          </div>
        )}

        {transcriptionData?.transcriptionStatus === "completed" && (
          <div className="max-h-96 overflow-y-auto rounded-md bg-gray-800/20 p-4">
            {transcriptionData.transcript ? (
              <p className="whitespace-pre-wrap">
                {transcriptionData.transcript}
              </p>
            ) : (
              <p className="text-center italic">
                No transcript content available.
              </p>
            )}
          </div>
        )}

        {transcriptionData?.transcriptionStatus === "failed" && (
          <div className="rounded-md bg-red-800/30 p-4 text-center">
            <p>
              Transcription failed. You can try again with the button below.
            </p>
          </div>
        )}
      </div>

      {/* Todo section */}
      {transcriptionData && (
        <div className="mb-8">
          <TodoSection 
            meetingId={meetingId} 
            initialTodos={transcriptionData.todos || []} 
            transcriptionComplete={transcriptionData.transcriptionStatus === "completed"} 
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          {transcriptionData?.transcriptionStatus === "failed" && (
            <Button
              onClick={() => void retryTranscription()}
              variant="secondary"
              disabled={retryMutation.isPending}
            >
              {retryMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-current"></div>
                  Retrying...
                </>
              ) : (
                "Retry Transcription"
              )}
            </Button>
          )}

          {transcriptionData?.transcriptionStatus === "completed" && (
            <Button
              variant="outline"
              onClick={() => {
                if (transcriptionData.transcript) {
                  navigator.clipboard.writeText(transcriptionData.transcript);
                  toast.success("Transcript copied to clipboard");
                }
              }}
            >
              Copy Transcript
            </Button>
          )}
        </div>

        <Link href="/">
          <Button variant="ghost">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}

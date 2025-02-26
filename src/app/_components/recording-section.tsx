"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AudioRecorder } from "./audio-recorder";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";

export function RecordingSection() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [recentMeetingId, setRecentMeetingId] = useState<string | null>(null);

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    try {
      setIsUploading(true);
      toast.info("Saving recording...");

      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("duration", String(duration));

      const response = await fetch("/api/meetings", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save recording");
      }

      setRecentMeetingId(data.meetingId);
      toast.success("Recording saved! You can now view the transcription.");
      
      // Redirect to transcription page
      router.push(`/transcription?meetingId=${data.meetingId}`);
    } catch (error) {
      console.error("Error saving recording:", error);
      toast.error("Failed to save recording. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-white/10 p-8">
      <h2 className="text-2xl font-bold">Record Meeting</h2>
      <AudioRecorder onRecordingComplete={handleRecordingComplete} />
      
      {/* Show a loading indicator while uploading */}
      {isUploading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-blue-300">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-current"></div>
          <span>Processing recording...</span>
        </div>
      )}
      
      {/* Show link to most recent transcription */}
      {recentMeetingId && !isUploading && (
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/transcription?meetingId=${recentMeetingId}`)}
          >
            View Recent Transcription
          </Button>
        </div>
      )}
    </div>
  );
}

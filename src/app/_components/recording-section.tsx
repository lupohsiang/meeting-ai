"use client";

import { AudioRecorder } from "./audio-recorder";
import { toast } from "sonner";

export function RecordingSection() {
  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    try {
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

      toast.success("Recording saved!");
    } catch (error) {
      console.error("Error saving recording:", error);
      toast.error("Failed to save recording. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-white/10 p-8">
      <h2 className="text-2xl font-bold">Record Meeting</h2>
      <AudioRecorder onRecordingComplete={handleRecordingComplete} />
    </div>
  );
}

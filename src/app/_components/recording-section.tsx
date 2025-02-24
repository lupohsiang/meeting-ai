"use client";

import { AudioRecorder } from "./audio-recorder";
import { toast } from "sonner";

export function RecordingSection() {
  const handleRecordingComplete = async (audioBlob: Blob) => {
    // For testing, we'll just show a success message with the blob size
    toast.success(`Recording completed! File size: ${(audioBlob.size / 1024).toFixed(2)}KB`);
    
    // Later we'll implement:
    // 1. Upload to storage
    // 2. Send for transcription
    // 3. Process with LLM for todo extraction
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl bg-white/10 p-8">
      <h2 className="text-2xl font-bold">Record Meeting</h2>
      <AudioRecorder onRecordingComplete={handleRecordingComplete} />
    </div>
  );
}

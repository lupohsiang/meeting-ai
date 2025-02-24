"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";

interface AudioRecorderProps {
  readonly onRecordingComplete: (audioBlob: Blob) => void;
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      });

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error(
        "Failed to start recording. Please check microphone permissions.",
      );
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Clear timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      setTimer(0);
    }
  }, [isRecording]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="font-mono text-2xl">{formatTime(timer)}</div>
      <Button
        size="lg"
        className={`h-16 w-16 rounded-full p-0 transition-all duration-200 ${
          isRecording
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
        onClick={isRecording ? stopRecording : startRecording}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        <div
          className={`${
            isRecording
              ? "h-6 w-6 rounded bg-white"
              : "h-4 w-4 rounded-full bg-white"
          }`}
        />
      </Button>
      {isRecording && (
        <div className="text-sm text-gray-500">Click to stop recording</div>
      )}
    </div>
  );
}

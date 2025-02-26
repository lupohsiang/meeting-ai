import { z } from "zod";
import type { IOptions } from "nodejs-whisper";

export const MODELS = {
  TINY: "tiny",
  TINY_EN: "tiny.en",
  BASE: "base",
  BASE_EN: "base.en",
  SMALL: "small",
  SMALL_EN: "small.en",
  MEDIUM: "medium",
  MEDIUM_EN: "medium.en",
  LARGE_V1: "large-v1",
  LARGE: "large",
  LARGE_V3: "large-v3-turbo",
} as const;

export const whisperConfig: IOptions = {
  modelName: MODELS.BASE,
  removeWavFileAfterTranscription: false,
  autoDownloadModelName: MODELS.BASE,
  withCuda: false,
  logger: console,
  whisperOptions: {
    outputInText: true,
    outputInSrt: true,
    outputInVtt: true,
    outputInJson: true,
    splitOnWord: true,
    wordTimestamps: true,
    timestamps_length: 20,
  },
} as const;

export const TranscriptionJobSchema = z.object({
  id: z.string(),
  audioFilePath: z.string(),
  userId: z.string(),
  meetingId: z.string(),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  attempts: z.number(),
  error: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TranscriptionJob = z.infer<typeof TranscriptionJobSchema>;

export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1000; // Base delay of 1 second for exponential backoff

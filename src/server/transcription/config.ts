import { z } from "zod";
import type { IOptions } from "nodejs-whisper";
import { openaiConfigSchema, type OpenAIConfig } from "./openai-service";
import { env } from "~/env";

// Define transcription providers
export const TRANSCRIPTION_PROVIDERS = {
  LOCAL_WHISPER: "local_whisper",
  OPENAI: "openai",
} as const;

// Default provider
export const DEFAULT_PROVIDER = TRANSCRIPTION_PROVIDERS.OPENAI;

// Local Whisper models
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

// Configuration for local Whisper
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

// Configuration for OpenAI Whisper
export const openAIConfig: OpenAIConfig = {
  apiKey: env.OPENAI_API_KEY,
  model: "whisper-1",
  responseFormat: "verbose_json",
  temperature: 0,
  timestampGranularities: ["word", "segment"],
};

export const TranscriptionJobSchema = z.object({
  id: z.string(),
  audioFilePath: z.string(),
  userId: z.string(),
  meetingId: z.string(),
  provider: z.enum([TRANSCRIPTION_PROVIDERS.LOCAL_WHISPER, TRANSCRIPTION_PROVIDERS.OPENAI]).optional().default(DEFAULT_PROVIDER),
  status: z.enum(["pending", "processing", "completed", "failed"]),
  attempts: z.number().int().nonnegative(),
  error: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TranscriptionJob = z.infer<typeof TranscriptionJobSchema>;

export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 1000; // Base delay of 1 second for exponential backoff

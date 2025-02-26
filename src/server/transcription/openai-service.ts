import OpenAI from "openai";
import { createReadStream } from "fs";
import { logger } from "~/utils/logger";
import { z } from "zod";
import { type TranscriptionJob } from "./config";
import { type TranscriptionResult } from "./processor";

// OpenAI configuration schema
export const openaiConfigSchema = z.object({
  apiKey: z.string().min(1),
  organization: z.string().optional(),
  model: z.enum(["whisper-1"]).default("whisper-1"),
  language: z.string().optional(), // e.g., 'en', 'zh', etc.
  responseFormat: z
    .enum(["json", "text", "srt", "verbose_json", "vtt"])
    .default("verbose_json"),
  temperature: z.number().min(0).max(1).default(0),
  timestampGranularities: z.array(z.enum(["word", "segment"])).optional(),
});

export type OpenAIConfig = z.infer<typeof openaiConfigSchema>;

/**
 * Transcribes audio using OpenAI Whisper API
 */
export async function transcribeWithOpenAI(
  job: TranscriptionJob,
  config: OpenAIConfig,
): Promise<TranscriptionResult> {
  logger.info(
    `Transcribing file using OpenAI Whisper API: ${job.audioFilePath}`,
  );

  try {
    const openai = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
    });

    // Create file stream
    const file = createReadStream(job.audioFilePath);

    // Request transcription
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: config.model,
      language: config.language,
      response_format: config.responseFormat,
      temperature: config.temperature,
      timestamp_granularities: config.timestampGranularities,
    });

    logger.info(`Transcription completed for job: ${job.id}`);

    // Parse the response based on the requested format
    if (config.responseFormat === "verbose_json") {
      const jsonResponse = transcription as unknown as Record<string, unknown>;

      return {
        text: String(jsonResponse.text || ""),
        json: jsonResponse,
      };
    } else if (config.responseFormat === "json") {
      const jsonResponse = transcription as unknown as Record<string, unknown>;

      return {
        text: String(jsonResponse.text || ""),
        json: jsonResponse,
      };
    } else if (config.responseFormat === "srt") {
      return {
        text: transcription as unknown as string,
        srt: transcription as unknown as string,
      };
    } else if (config.responseFormat === "vtt") {
      return {
        text: transcription as unknown as string,
        vtt: transcription as unknown as string,
      };
    } else {
      // Text format
      return {
        text: transcription as unknown as string,
      };
    }
  } catch (error) {
    logger.error(
      `OpenAI transcription failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

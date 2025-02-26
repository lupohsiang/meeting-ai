import {
  type TranscriptionJob,
  whisperConfig,
  MAX_RETRIES,
  RETRY_DELAY_MS,
} from "./config";
import { nodewhisper } from "nodejs-whisper";
import { logger } from "~/utils/logger";
import { createConsoleAdapter } from "~/utils/logger-adapter";
import { convertToWav } from "~/server/utils/audio-converter";
import path from "path";
import fs from "fs";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface TranscriptionResult {
  text: string;
  srt?: string;
  vtt?: string;
  json?: Record<string, unknown>;
}

export async function processTranscription(
  job: TranscriptionJob,
): Promise<TranscriptionResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      logger.info(
        `Processing transcription job ${job.id}, attempt ${attempt + 1}`,
      );

      // Ensure we have absolute path
      const absolutePath = path.isAbsolute(job.audioFilePath)
        ? job.audioFilePath
        : path.resolve(process.cwd(), job.audioFilePath);

      // Convert audio to WAV if needed
      const wavPath = absolutePath.endsWith('.wav')
        ? absolutePath
        : convertToWav(absolutePath);

      // Process transcription
      await nodewhisper(wavPath, {
        ...whisperConfig,
        logger: createConsoleAdapter(logger),
      });

      // Get output paths
      const basePath = absolutePath.replace(/\.[^/.]+$/, "");
      const outputs = {
        text: `${basePath}.txt`,
        srt: `${basePath}.srt`,
        vtt: `${basePath}.vtt`,
        json: `${basePath}.json`,
      };

      // Read outputs
      const result: TranscriptionResult = {
        text: await readFileIfExists(outputs.text),
      };

      if (whisperConfig.whisperOptions?.outputInSrt)
        result.srt = await readFileIfExists(outputs.srt);

      if (whisperConfig.whisperOptions?.outputInVtt)
        result.vtt = await readFileIfExists(outputs.vtt);

      if (whisperConfig.whisperOptions?.outputInJson)
        result.json = JSON.parse(await readFileIfExists(outputs.json));

      logger.info(`Successfully transcribed job ${job.id}`);
      return result;
    } catch (error) {
      lastError = error as Error;
      logger.error(
        `Transcription attempt ${attempt + 1} failed for job ${job.id}:`,
        error,
      );

      if (attempt < MAX_RETRIES - 1) {
        const delayMs = RETRY_DELAY_MS * Math.pow(2, attempt); // Exponential backoff
        logger.info(`Retrying in ${delayMs}ms...`);
        await delay(delayMs);
      }
    }
  }

  throw new Error(
    `Failed to transcribe after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`,
  );
}

async function readFileIfExists(filePath: string): Promise<string> {
  try {
    return await fs.promises.readFile(filePath, "utf-8");
  } catch (error) {
    logger.warn(`Failed to read output file: ${filePath}`);
    return "";
  }
}

import {
  type TranscriptionJob,
  whisperConfig,
  MAX_RETRIES,
  RETRY_DELAY_MS,
  TRANSCRIPTION_PROVIDERS,
  DEFAULT_PROVIDER,
  openAIConfig,
} from "./config";
import { nodewhisper } from "nodejs-whisper";
import { logger } from "~/utils/logger";
import { createConsoleAdapter } from "~/utils/logger-adapter";
import { convertToWav } from "~/server/utils/audio-converter";
import { transcribeWithOpenAI } from "./openai-service";
import path from "path";
import fs from "fs";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface TranscriptionResult {
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

      // Decide which transcription service to use (default to OpenAI)
      const provider = job.provider || DEFAULT_PROVIDER;
      
      let result: TranscriptionResult;
      
      if (provider === TRANSCRIPTION_PROVIDERS.OPENAI) {
        // Use OpenAI API
        result = await transcribeWithOpenAI(
          { ...job, audioFilePath: wavPath },
          openAIConfig
        );
      } else {
        // Use local Whisper
        // Process transcription
        await nodewhisper(wavPath, {
          ...whisperConfig,
          logger: createConsoleAdapter(logger),
        });
      
        // Get the paths of the output files
        const basePath = wavPath.replace(/\.[^/.]+$/, "");
        const textPath = `${basePath}.txt`;
        const srtPath = `${basePath}.srt`;
        const vttPath = `${basePath}.vtt`;
        const jsonPath = `${basePath}.json`;
        
        // Read the output files
        result = {
          text: fs.existsSync(textPath) ? fs.readFileSync(textPath, "utf8") : "",
          srt: fs.existsSync(srtPath) ? fs.readFileSync(srtPath, "utf8") : undefined,
          vtt: fs.existsSync(vttPath) ? fs.readFileSync(vttPath, "utf8") : undefined,
          json: fs.existsSync(jsonPath)
            ? JSON.parse(fs.readFileSync(jsonPath, "utf8"))
            : undefined,
        };
      }
      
      // Return the transcription result
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

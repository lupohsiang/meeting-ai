import { exec } from "shelljs";
import { logger } from "~/utils/logger";
import path from "path";

/**
 * Convert audio file to WAV format with 16kHz sample rate
 * @param inputPath Path to input audio file
 * @returns Path to converted WAV file
 */
export function convertToWav(inputPath: string): string {
  const outputPath = inputPath.replace(/\.[^/.]+$/, ".wav");
  const command = `ffmpeg -i "${inputPath}" -ar 16000 -ac 1 -c:a pcm_s16le "${outputPath}" -y`;
  
  logger.info(`Converting audio file: ${path.basename(inputPath)} to WAV`);
  
  const result = exec(command, { silent: true });
  
  if (result.code !== 0) {
    throw new Error(`Failed to convert audio file: ${result.stderr}`);
  }
  
  return outputPath;
}

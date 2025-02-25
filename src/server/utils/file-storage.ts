import { createWriteStream, unlink } from "fs";
import { mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const AUDIO_DIR = path.join(UPLOAD_DIR, "audio");
const TRANSCRIPT_DIR = path.join(UPLOAD_DIR, "transcripts");

interface FileUploadResult {
  filename: string;
  path: string;
}

export async function saveAudioFile(blob: Blob): Promise<FileUploadResult> {
  await ensureDirectoryExists(AUDIO_DIR);
  const filename = `${uuidv4()}.webm`;
  const filePath = path.join(AUDIO_DIR, filename);
  
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  return new Promise((resolve, reject) => {
    const writeStream = createWriteStream(filePath);
    writeStream.write(buffer);
    writeStream.end();
    
    writeStream.on("finish", () => {
      resolve({
        filename,
        path: filePath,
      });
    });
    
    writeStream.on("error", (error) => {
      reject(error);
    });
  });
}

export async function saveTranscript(
  meetingId: string,
  transcript: string,
): Promise<FileUploadResult> {
  await ensureDirectoryExists(TRANSCRIPT_DIR);
  const filename = `${meetingId}.txt`;
  const filePath = path.join(TRANSCRIPT_DIR, filename);
  
  return new Promise((resolve, reject) => {
    const writeStream = createWriteStream(filePath);
    writeStream.write(transcript);
    writeStream.end();
    
    writeStream.on("finish", () => {
      resolve({
        filename,
        path: filePath,
      });
    });
    
    writeStream.on("error", (error) => {
      reject(error);
    });
  });
}

export async function deleteFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    unlink(filePath, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

async function ensureDirectoryExists(dir: string): Promise<void> {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    // Ignore error if directory already exists
    if ((error as { code?: string }).code !== "EEXIST") {
      throw error;
    }
  }
}

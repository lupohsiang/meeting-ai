import { createWriteStream, unlink, statSync } from "fs";
import { mkdir, readdir, stat } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Constants for retention policy and storage limits
const AUDIO_RETENTION_DAYS = 365; // 1 year
const MAX_STORAGE_MB = 500; // 500MB total storage limit

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const AUDIO_DIR = path.join(UPLOAD_DIR, "audio");
const TRANSCRIPT_DIR = path.join(UPLOAD_DIR, "transcripts");

interface FileUploadResult {
  filename: string;
  path: string;
  size: number;
}

interface UploadProgress {
  bytesUploaded: number;
  totalBytes: number;
  percentage: number;
}

type ProgressCallback = (progress: UploadProgress) => void;

export async function saveAudioFile(
  blob: Blob,
  onProgress?: ProgressCallback,
): Promise<FileUploadResult> {
  await ensureDirectoryExists(AUDIO_DIR);
  const filename = `${uuidv4()}.webm`;
  const filePath = path.join(AUDIO_DIR, filename);

  // Verify storage space before proceeding
  await verifyStorageSpace(blob.size);

  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const totalBytes = buffer.length;
  let bytesWritten = 0;

  return new Promise((resolve, reject) => {
    const writeStream = createWriteStream(filePath);
    writeStream.write(buffer, () => {
      bytesWritten = totalBytes;
      onProgress?.({
        bytesUploaded: bytesWritten,
        totalBytes,
        percentage: (bytesWritten / totalBytes) * 100,
      });
    });
    writeStream.end();

    writeStream.on("finish", () => {
      void (async () => {
        const stats = await stat(filePath);
        resolve({
          filename,
          path: filePath,
          size: stats.size,
        });
      })();
    });

    writeStream.on("error", (error) => {
      reject(error);
    });
  });
}

export async function saveTranscript(
  meetingId: string,
  transcript: string,
  onProgress?: ProgressCallback,
): Promise<FileUploadResult> {
  await ensureDirectoryExists(TRANSCRIPT_DIR);
  const filename = `${meetingId}.txt`;
  const filePath = path.join(TRANSCRIPT_DIR, filename);

  return new Promise((resolve, reject) => {
    const writeStream = createWriteStream(filePath);
    const totalBytes = Buffer.byteLength(transcript);
    writeStream.write(transcript, () => {
      onProgress?.({
        bytesUploaded: totalBytes,
        totalBytes,
        percentage: 100,
      });
    });
    writeStream.end();

    writeStream.on("finish", () => {
      void (async () => {
        const stats = await stat(filePath);
        resolve({
          filename,
          path: filePath,
          size: stats.size,
        });
      })();
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

async function verifyStorageSpace(requiredBytes: number): Promise<void> {
  const currentUsage = await calculateStorageUsage();
  const maxBytes = MAX_STORAGE_MB * 1024 * 1024;

  if (currentUsage + requiredBytes > maxBytes) {
    throw new Error(
      `Storage limit exceeded. Current usage: ${Math.round(currentUsage / 1024 / 1024)}MB, Limit: ${MAX_STORAGE_MB}MB`,
    );
  }
}

async function calculateStorageUsage(): Promise<number> {
  let totalSize = 0;

  async function calculateDirSize(dir: string): Promise<number> {
    const files = await readdir(dir);
    const sizes = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(dir, file);
        const stats = await stat(filePath);
        return stats.isDirectory()
          ? await calculateDirSize(filePath)
          : stats.size;
      }),
    );
    return sizes.reduce((a, b) => a + b, 0);
  }

  totalSize += await calculateDirSize(UPLOAD_DIR);
  return totalSize;
}

// Retention policy implementation
export async function cleanupOldFiles(): Promise<void> {
  const audioFiles = await readdir(AUDIO_DIR);
  const now = new Date();

  for (const file of audioFiles) {
    const filePath = path.join(AUDIO_DIR, file);
    const stats = await stat(filePath);
    const ageInDays =
      (now.getTime() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);

    if (ageInDays > AUDIO_RETENTION_DAYS) {
      await deleteFile(filePath);
    }
  }
}

import { PrismaClient } from "@prisma/client";
import { type TranscriptionJob } from "./config";
import { processTranscription } from "./processor";
import { logger } from "~/utils/logger";

class TranscriptionQueue {
  private queue: TranscriptionJob[] = [];
  private isProcessing = false;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public async addJob(
    job: Omit<
      TranscriptionJob,
      "status" | "attempts" | "error" | "createdAt" | "updatedAt"
    >,
  ) {
    const newJob: TranscriptionJob = {
      ...job,
      status: "pending",
      attempts: 0,
      error: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.queue.push(newJob);
    logger.info(`Added new transcription job: ${job.id}`);

    if (!this.isProcessing) {
      void this.processQueue();
    }
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    try {
      const job = this.queue[0];
      if (!job || typeof job !== "object" || !("id" in job)) {
        logger.warn("No valid job found in queue despite length check");
        return;
      }
      await this.processJob(job);
    } catch (error) {
      logger.error("Error processing transcription queue:", error);
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        void this.processQueue();
      }
    }
  }

  private async processJob(job: TranscriptionJob) {
    try {
      // Update job status in database
      await this.prisma.meeting.update({
        where: { id: job.meetingId },
        data: { transcriptionStatus: "processing" },
      });

      // Process the transcription
      const result = await processTranscription(job);

      // Update meeting with transcription results
      await this.prisma.meeting.update({
        where: { id: job.meetingId },
        data: {
          transcript: result.text,
          transcriptSrt: result.srt,
          transcriptVtt: result.vtt,
          transcriptJson: result.json as object | null,
          transcriptionStatus: "completed",
        },
      });

      // Remove job from queue
      this.queue.shift();
      logger.info(`Successfully processed transcription job: ${job.id}`);
    } catch (error) {
      logger.error(`Failed to process transcription job: ${job.id}`, error);

      // Update job status in database
      await this.prisma.meeting.update({
        where: { id: job.meetingId },
        data: { transcriptionStatus: "failed" },
      });

      // Remove failed job from queue
      this.queue.shift();
    }
  }

  public getQueueStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      currentJob: this.queue[0] ?? null,
    };
  }
}

// Export a singleton instance
export const transcriptionQueue = new TranscriptionQueue(new PrismaClient());

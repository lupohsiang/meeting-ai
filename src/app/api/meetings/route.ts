import { NextResponse } from "next/server";
import { saveAudioFile } from "~/server/utils/file-storage";
import { db } from "~/server/db";

export async function POST(request: Request) {
  try {
    // TODO: Check authentication
    const formData = await request.formData();
    const audioBlob = formData.get("audio") as Blob;

    if (!audioBlob) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    // Save the audio file
    const { filename, path } = await saveAudioFile(audioBlob);

    // Create a new meeting record in the database
    const meeting = await db.meeting.create({
      data: {
        title: `Meeting ${new Date().toLocaleString()}`,
        audioFilePath: path,
        duration: 0, // Will be updated after processing
        transcript: "", // Will be filled after transcription
        userId: "default",
      },
    });

    return NextResponse.json({ meetingId: meeting.id, filename });
  } catch (error) {
    console.error("Error handling meeting recording:", error);

    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes("foreign key")) {
        return NextResponse.json(
          { error: "Invalid user session" },
          { status: 401 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to process recording" },
      { status: 500 },
    );
  }
}

import { TranscriptionUI } from "~/app/_components/transcription-ui";

export default async function TranscriptionPage({
  searchParams,
}: {
  searchParams: { meetingId?: string };
}) {
  const meetingId = searchParams.meetingId;
  
  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-start gap-8 px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Meeting Transcription</h1>
      <TranscriptionUI meetingId={meetingId} />
    </main>
  );
}

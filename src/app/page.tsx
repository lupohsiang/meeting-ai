import { RecordingSection } from "~/app/_components/recording-section";
import { MeetingsList } from "~/app/_components/meetings-list";
import { auth } from "~/server/auth";
import { HydrateClient } from "~/trpc/server";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-start bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-16 text-white">
        <div className="container flex flex-col items-center justify-center gap-12">
          <h1 className="text-center text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            Meeting <span className="text-[hsl(280,100%,70%)]">AI</span>
          </h1>

          <div className="w-full max-w-3xl">
            <h2 className="mb-6 text-center text-2xl font-bold">
              Record Your Meeting
            </h2>
            <RecordingSection />
          </div>

          {/* Recent Meetings section */}
          <div className="w-full max-w-3xl">
            <h2 className="mb-6 text-center text-2xl font-bold">
              Recent Meetings
            </h2>
            <MeetingsList />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-center text-xl text-white">
                {session && <span>Logged in as {session.user?.name}</span>}
              </p>
              <Link
                href={session ? "/api/auth/signout" : "/api/auth/signin"}
                className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
              >
                {session ? "Sign out" : "Sign in"}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}

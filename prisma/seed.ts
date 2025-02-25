import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean up existing data
  await prisma.todo.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.verificationToken.deleteMany();

  console.log("Cleaned up existing data");

  // Create a test user
  const testUser = await prisma.user.create({
    data: {
      email: "test@example.com",
      name: "Test User",
      id: "default",
      // Note: In production, you'd want to hash passwords properly
      emailVerified: new Date(),
    },
  });

  // Create some sample meetings
  await prisma.meeting.create({
    data: {
      title: "Project Kickoff Meeting",
      date: new Date("2025-02-24T09:00:00Z"),
      duration: 3600, // 1 hour in seconds
      audioFilePath: "/sample/meeting1.wav",
      transcript:
        "This is a sample transcript for the project kickoff meeting...",
      userId: testUser.id,
      todos: {
        create: [
          {
            description: "Create project timeline",
            priority: "High",
            isComplete: false,
          },
          {
            description: "Set up development environment",
            priority: "High",
            isComplete: true,
          },
        ],
      },
    },
  });

  await prisma.meeting.create({
    data: {
      title: "Weekly Team Sync",
      date: new Date("2025-02-24T14:00:00Z"),
      duration: 1800, // 30 minutes in seconds
      audioFilePath: "/sample/meeting2.wav",
      transcript: "This is a sample transcript for the weekly team sync...",
      userId: testUser.id,
      todos: {
        create: [
          {
            description: "Review pull requests",
            priority: "Medium",
            isComplete: false,
          },
          {
            description: "Update documentation",
            priority: "Low",
            isComplete: false,
          },
        ],
      },
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void (async () => {
      await prisma.$disconnect();
    })();
  });

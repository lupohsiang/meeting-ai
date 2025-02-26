-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Meeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL,
    "audioFilePath" TEXT NOT NULL,
    "transcript" TEXT NOT NULL DEFAULT '',
    "transcriptSrt" TEXT,
    "transcriptVtt" TEXT,
    "transcriptJson" TEXT,
    "transcriptionStatus" TEXT NOT NULL DEFAULT 'pending',
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Meeting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Meeting" ("audioFilePath", "createdAt", "date", "duration", "id", "title", "transcript", "updatedAt", "userId") SELECT "audioFilePath", "createdAt", "date", "duration", "id", "title", "transcript", "updatedAt", "userId" FROM "Meeting";
DROP TABLE "Meeting";
ALTER TABLE "new_Meeting" RENAME TO "Meeting";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

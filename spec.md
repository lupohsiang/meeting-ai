# Meeting Transcription & Todo Extraction App - Technical Specification

## 1. Overview

A web application that records meetings, transcribes them, and automatically extracts todo items using LLM technology.

## 2. Technology Stack

- Framework: T3 Stack
  - Next.js
  - TypeScript
  - Tailwind CSS
  - Prisma
  - SQLite (Development) / PostgreSQL (Production)
- Audio Processing: Web Audio API
- Transcription: nodejs-whisper (base model)
- LLM Integration: Token.js with OpenAI GPT-4o-mini
- File Storage: S3-compatible storage (minio/s3rver for development)

## 3. Core Features

### 3.1 Audio Recording

- Implementation: Web Audio API
- Format: WAV file with 16000 Hz frequency
- Recording Interface:
  - Circular button that morphs into square when recording
  - Pulsing animation during recording
  - Timer display (MM:SS format)
- User Limits:
  - Authenticated Users:
    - Unlimited recordings
    - No duration limit per recording
    - Permanent storage
  - Anonymous Users:
    - Maximum 3 recordings
    - 5-minute limit per recording
    - 24-hour storage period
    - 50MB total storage limit

### 3.2 Transcription

- Process: Batch processing after recording completion
- Model: Whisper base model
- Configuration:

```typescript
const whisperConfig = {
  modelName: "base",
  removeWavFileAfterTranscription: false,
  whisperOptions: {
    outputInText: true,
    splitOnWord: true,
  },
};
```

### 3.3 Todo Extraction

- Provider: OpenAI (via Token.js)
- Model: GPT-4o-mini
- Output Format:

```typescript
type Todo = {
  description: string;
  priority: "High" | "Medium" | "Low";
};

type LLMResponse = {
  todos: Todo[];
};
```

## 4. Database Schema

```prisma
model User {
  id       String    @id @default(cuid())
  email    String?   @unique  // Null for anonymous users
  meetings Meeting[]
  isAnonymous Boolean @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Meeting {
  id             String    @id @default(cuid())
  title          String
  date           DateTime  @default(now())
  duration       Int       // in seconds
  audioFilePath  String
  transcript     String
  user           User      @relation(fields: [userId], references: [id])
  userId         String
  todos          Todo[]
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  expiresAt      DateTime? // For anonymous user meetings
}

model Todo {
  id          String   @id @default(cuid())
  description String
  priority    String   // High, Medium, Low
  isComplete  Boolean  @default(false)
  meeting     Meeting  @relation(fields: [meetingId], references: [id])
  meetingId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Anonymous User Limits
const ANONYMOUS_USER_LIMITS = {
  maxMeetings: 3,           // Maximum number of meetings per anonymous user
  maxDurationPerMeeting: 5, // Maximum duration in minutes per meeting
  meetingExpiry: 24,        // Hours before meeting is deleted
  maxStoragePerUser: 50     // Maximum storage in MB per anonymous user
};
```

## 5. File Storage

- Simple local filesystem storage for both development and production
- File Structure:
  - /uploads/audio/: Audio recordings
  - /uploads/transcripts/: Generated transcripts
- File Naming: UUID-based unique filenames
- Retention Policy:
  - Audio files: 1 year
  - Transcripts: Indefinite
  - Todo lists: Stored in database

## 6. API Endpoints

### 6.1 Authentication

```typescript
POST / api / auth / signin;
POST / api / auth / signout;
```

### 6.2 Meetings

```typescript
POST /api/meetings/start    // Initialize recording session
POST /api/meetings/stop     // Stop recording and begin processing
GET /api/meetings          // List all meetings
GET /api/meetings/:id      // Get specific meeting details
DELETE /api/meetings/:id    // Delete meeting and associated data
```

### 6.3 Todos

```typescript
PUT /api/todos/:id/toggle   // Toggle todo completion
DELETE /api/todos/:id       // Delete todo item
```

## 7. Error Handling

### 7.1 Recording Errors

- Browser Compatibility Check
- Microphone Permission Handling
- Storage Space Verification
- Network Connection Monitoring

### 7.2 Transcription Errors

- Retry Logic: 3 attempts with exponential backoff
- Fallback: Store audio file for manual processing
- User Notification: Toast messages for status updates

### 7.3 LLM API Errors

- Retry Logic: 2 attempts
- Fallback: Display transcript without todos
- Error Messages: User-friendly notifications

## 8. Testing Plan

### 8.1 Unit Tests

- Audio recording functions
- Transcription processing
- Todo extraction logic
- Database operations

### 8.2 Integration Tests

- Complete recording flow
- Transcription pipeline
- LLM integration
- File storage operations

### 8.3 E2E Tests

- Full meeting recording and processing
- User authentication flow
- Meeting history management
- Todo management

### 8.4 Performance Tests

- Audio processing performance
- Transcription speed
- API response times
- File upload/download speeds

## 9. Security Considerations

### 9.1 Data Protection

- At-rest encryption for stored files
- Secure audio streaming
- HTTPS-only communication
- Input sanitization

### 9.2 Authentication

- Email-based authentication
- Session management
- Rate limiting
- CSRF protection

## 10. Deployment

### 10.1 Development

```bash
# Environment Setup
npm install
npx prisma generate
npx nodejs-whisper download base

# Local Development
npm run dev
```

### 10.2 Production

- Region: Singapore
- Infrastructure: Docker containers
- Database: PostgreSQL
- Storage: S3-compatible object storage
- SSL/TLS: Required
- Monitoring: Basic metrics and error logging

## 11. Future Considerations

- Multi-user meeting support
- Real-time transcription
- Advanced todo extraction features
- Meeting analytics
- Export functionality

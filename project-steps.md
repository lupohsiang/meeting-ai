I'll help create a detailed implementation plan and break it down into LLM-friendly prompts. Let me analyze the technical specification and create a structured approach.

# Phase 1: Project Foundation & Initial Analysis

Let's break this down into logical phases and then create specific prompts for each step.

## Core Technologies Analysis

1. T3 Stack base requirements
2. Audio recording fundamentals
3. Database schema implementation
4. Authentication flow
5. File storage setup

## Implementation Phases

### Phase A: Project Setup & Basic Structure

1. Initialize T3 Stack project
2. Set up basic routing
3. Implement basic layout
4. Add authentication
5. Set up database

### Phase B: Audio Recording Core

1. Basic audio recording
2. Recording UI implementation
3. File storage integration
4. Audio processing setup

### Phase C: Transcription Integration

1. Whisper integration
2. Transcription processing
3. Error handling
4. Results storage

### Phase D: Todo Extraction

1. LLM integration
2. Todo processing
3. Todo management UI
4. Database integration

### Phase E: Polish & Integration

1. Error handling
2. UI polish
3. Performance optimization
4. Testing implementation

# Detailed Prompts

## Setup Phase Prompts

### Prompt 1: Project Initialization

```text
Create a new T3 Stack project with the following specifications:
- Next.js with App Router
- TypeScript
- Tailwind CSS
- Prisma
- SQLite for development
- Authentication (NextAuth.js)

Include:
1. Basic project structure
2. Essential dependencies
3. Initial configuration files
4. Basic environment setup

The project should follow these constraints:
- Strict TypeScript configuration
- ESLint with recommended rules
- Proper folder structure for scalability
```

### Prompt 2: Database Schema Setup

```text
Implement the initial database schema using Prisma with the following models:
- User
- Meeting
- Todo

Requirements:
1. Follow the schema provided in the technical specification
2. Add proper indexes for performance
3. Include necessary relations
4. Add created_at and updated_at timestamps
5. Implement proper cascade deletion rules

Also create:
1. Initial migration
2. Type definitions
3. Basic database utility functions
```

### Prompt 3: Authentication Implementation

```text
Implement email-based authentication using NextAuth.js with the following features:
1. Sign in/out functionality
2. Protected routes
3. User session management
4. Basic error handling

Requirements:
- Email authentication provider
- Secure session handling
- TypeScript type safety
- Integration with existing database schema
- Basic authentication middleware
```

## Audio Recording Phase Prompts

### Prompt 4: Basic Audio Recording

```text
Implement basic audio recording functionality using Web Audio API:
1. Create AudioContext wrapper
2. Implement MediaRecorder setup
3. Add basic start/stop functionality
4. Handle audio chunks
5. Implement proper cleanup

Requirements:
- TypeScript types for audio handling
- Error handling for permissions
- Memory management
- Browser compatibility checks
```

### Prompt 5: Recording UI

```text
Create the recording interface with the following components:
1. Recording button with morphing animation
2. Timer display
3. Recording status indicator
4. Basic error messages

Requirements:
- Responsive design
- Accessible controls
- Proper state management
- Animation using Tailwind
- Error state handling
```

### Prompt 6: File Storage Integration

```text
Implement file storage functionality:
1. Set up S3 client (development mode)
2. Create upload functionality
3. Implement file retrieval
4. Add cleanup procedures

Include:
- Type-safe file handling
- Error management
- Progress tracking
- Proper file naming
```

## Transcription Phase Prompts

### Prompt 7: Whisper Integration

```text
Set up nodejs-whisper integration:
1. Initialize Whisper configuration
2. Create transcription service
3. Implement job queue
4. Add result handling

Requirements:
- Proper error handling
- Progress tracking
- Type safety
- Resource management
```

### Prompt 8: Transcription UI

```text
Create the transcription interface:
1. Progress indicator
2. Results display
3. Error handling
4. Navigation controls

Features:
- Real-time updates
- Proper loading states
- Error recovery options
- Accessibility support
```

## Todo Extraction Phase Prompts

### Prompt 9: LLM Integration

```text
Implement OpenAI integration for todo extraction:
1. Set up Token.js client
2. Create processing service
3. Implement result parsing
4. Add error handling

Requirements:
- Type safety
- Rate limiting
- Error recovery
- Proper prompt engineering
```

### Prompt 10: Todo Management

```text
Create todo management interface:
1. Todo list display
2. Priority handling
3. Status updates
4. Filtering options

Include:
- Real-time updates
- Optimistic updates
- Error handling
- Proper state management
```

## Integration Phase Prompts

### Prompt 11: Error Handling

```text
Implement comprehensive error handling:
1. Global error boundary
2. API error handling
3. User feedback system
4. Recovery procedures

Requirements:
- Type-safe error handling
- User-friendly messages
- Logging system
- Recovery options
```

### Prompt 12: Testing Setup

```text
Set up testing infrastructure:
1. Unit test configuration
2. Integration test setup
3. E2E test framework
4. Performance testing tools

Include:
- Test utilities
- Mocking services
- CI/CD integration
- Coverage reporting
```

### Prompt 13: Performance Optimization

```text
Implement performance optimizations:
1. Code splitting
2. Asset optimization
3. Caching strategy
4. Loading optimization

Focus on:
- Bundle size
- Load times
- Runtime performance
- Memory usage
```

### Prompt 14: Final Integration

```text
Complete system integration:
1. Route protection
2. Navigation flow
3. State management
4. Error boundaries

Requirements:
- Type safety
- Performance monitoring
- Security checks
- Documentation
```

# Implementation Notes

Each prompt should be executed in order, with each new feature building on previous implementations. Key considerations for each step:

1. Verify functionality before moving to next step
2. Maintain type safety throughout
3. Keep consistent error handling
4. Document all major functions
5. Add tests for new features
6. Maintain proper git workflow

Each implementation should include:

- TypeScript types
- Unit tests
- Documentation
- Error handling
- Performance considerations

The prompts are designed to be iterative, with each building on the previous work. They should be executed in order, with testing and verification at each step.

Would you like me to provide more detailed information about any particular phase or prompt?

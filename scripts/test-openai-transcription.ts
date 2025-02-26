#!/usr/bin/env ts-node
/**
 * Test script for OpenAI transcription
 * 
 * Usage: 
 * pnpm tsx scripts/test-openai-transcription.ts <path-to-audio-file>
 * 
 * Make sure you have the OPENAI_API_KEY in your .env file
 */

import { transcribeWithOpenAI, type OpenAIConfig } from '../src/server/transcription/openai-service';
import { convertToWav } from '../src/server/utils/audio-converter';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();

async function main() {
  // Check if audio file path is provided
  if (process.argv.length < 3) {
    console.error('Please provide an audio file path');
    console.error('Usage: pnpm tsx scripts/test-openai-transcription.ts <path-to-audio-file>');
    process.exit(1);
  }

  // Get audio file path
  const audioFilePath = process.argv[2];
  if (!fs.existsSync(audioFilePath)) {
    console.error(`File not found: ${audioFilePath}`);
    process.exit(1);
  }

  // Convert to WAV if needed
  let wavPath = audioFilePath;
  if (!audioFilePath.endsWith('.wav')) {
    console.log(`Converting ${path.basename(audioFilePath)} to WAV...`);
    wavPath = convertToWav(audioFilePath);
    console.log(`Converted to ${path.basename(wavPath)}`);
  }

  // Create a dummy transcription job
  const job = {
    id: 'test-job',
    audioFilePath: wavPath,
    userId: 'test-user',
    meetingId: 'test-meeting',
    status: 'processing' as const,
    attempts: 0,
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // OpenAI config
  const config: OpenAIConfig = {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'whisper-1',
    responseFormat: 'verbose_json',
    temperature: 0,
    timestampGranularities: ['word', 'segment'],
  };

  // Check if API key is provided
  if (!config.apiKey) {
    console.error('OPENAI_API_KEY not found in .env file');
    process.exit(1);
  }

  console.log('Starting transcription with OpenAI Whisper API...');
  
  try {
    // Transcribe
    const result = await transcribeWithOpenAI(job, config);
    
    // Save results
    const outputDir = path.dirname(wavPath);
    const baseName = path.basename(wavPath, path.extname(wavPath));
    
    // Save text
    fs.writeFileSync(path.join(outputDir, `${baseName}.transcription.txt`), result.text);
    console.log(`Text transcription saved to ${baseName}.transcription.txt`);
    
    // Save JSON if available
    if (result.json) {
      fs.writeFileSync(
        path.join(outputDir, `${baseName}.transcription.json`), 
        JSON.stringify(result.json, null, 2)
      );
      console.log(`JSON result saved to ${baseName}.transcription.json`);
    }
    
    // Print excerpt
    console.log('\nTranscription excerpt:');
    console.log('-------------------');
    console.log(result.text.substring(0, 300) + (result.text.length > 300 ? '...' : ''));
    console.log('-------------------');
    
    console.log('\nTranscription completed successfully!');
  } catch (error) {
    console.error('Transcription failed:');
    console.error(error);
    process.exit(1);
  }
}

main().catch(console.error);

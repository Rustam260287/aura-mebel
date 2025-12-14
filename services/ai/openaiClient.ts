import OpenAI from 'openai';
import { AIConfigError } from './errors';

let client: OpenAI | null = null;

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AIConfigError('OPENAI_API_KEY is not set');
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
}

export const DEFAULT_TEXT_MODEL = 'gpt-4o-mini' as const;

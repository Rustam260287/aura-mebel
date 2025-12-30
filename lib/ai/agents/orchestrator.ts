
import { askAI } from '../core';

export type Intent = 'CATALOG' | 'DESIGN' | 'TECH' | 'GENERAL';

const isIntent = (value: unknown): value is Intent =>
  value === 'CATALOG' || value === 'DESIGN' || value === 'TECH' || value === 'GENERAL';

export async function detectIntent(message: string): Promise<Intent> {
  try {
    const result: any = await askAI({
      key: 'ORCHESTRATOR_CLASSIFY',
      variables: { message },
      responseFormat: 'json',
      model: 'gpt-3.5-turbo'
    });
    
    return isIntent(result?.intent) ? result.intent : 'GENERAL';
  } catch (e) {
    console.error("Orchestrator failed:", e);
    return 'GENERAL'; // Fallback
  }
}

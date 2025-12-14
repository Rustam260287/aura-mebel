
import { askAI } from '../core';

export type Intent = 'CATALOG' | 'DESIGN' | 'TECH' | 'CHANGE_VISUAL' | 'GENERAL';

export async function detectIntent(message: string): Promise<Intent> {
  try {
    const result: any = await askAI({
      key: 'ORCHESTRATOR_CLASSIFY',
      variables: { message },
      responseFormat: 'json',
      model: 'gpt-3.5-turbo'
    });
    
    return result.intent || 'GENERAL';
  } catch (e) {
    console.error("Orchestrator failed:", e);
    return 'GENERAL'; // Fallback
  }
}

'use server';

import { createSession, updateContext } from './state';
import { SupervisorAgent } from './agents/supervisor';
import { AgentMessage, AgentResponse } from './types';

// Entry point for the Client Chat Interface
// Entry point for the Client Chat Interface
export async function submitUserMessage(sessionId: string, formData: FormData): Promise<AgentResponse[]> {
    const text = formData.get('text') as string;
    const image = formData.get('image') as string; // base64

    // 1. Load State (Mock)
    const state = createSession(sessionId);

    // 2. Process
    // Supervisor currently returns a "complex" AgentMessage. We map it to AgentResponse[]
    const rawResponse = await SupervisorAgent.process(
        { text, imageBase64: image || undefined },
        state
    );

    const responses: AgentResponse[] = [];

    // 1. Text part
    if (rawResponse.content) {
        responses.push({
            type: 'text',
            role: 'assistant',
            content: rawResponse.content
        });
    }

    // 2. Component part (Generative UI)
    if (rawResponse.ui) {
        responses.push({
            type: 'component',
            role: 'assistant',
            component: rawResponse.ui.id,
            props: rawResponse.ui.props
        });
    }

    // 3. Attach Suggestions to the last message
    if (responses.length > 0 && (rawResponse as any).suggestions) {
        responses[responses.length - 1].suggestions = (rawResponse as any).suggestions;
    }

    return responses;
}

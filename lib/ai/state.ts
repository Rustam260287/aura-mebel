import { SessionState, AgentMessage } from './types';

// Simple in-memory state for the MVP (In production this would be Redis/Firestore)
const initialContext = {
    selectedProducts: [],
    intent: 'unknown',
};

export const createSession = (sessionId: string): SessionState => ({
    sessionId,
    history: [],
    context: { ...initialContext },
});

export const updateContext = (
    state: SessionState,
    update: Partial<SessionState['context']>
): SessionState => ({
    ...state,
    context: { ...state.context, ...update },
});

export const addToHistory = (
    state: SessionState,
    message: AgentMessage
): SessionState => ({
    ...state,
    history: [...state.history, message],
});

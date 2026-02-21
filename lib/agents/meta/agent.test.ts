import { AssistantState } from './types';
import { MetaAgent } from './agent';
import { AGENT_TIMINGS } from '../../../config/domain';

// Mock AGENT_TIMINGS so time doesn't make tests flaky, 
// or control time passed via payload.
// Let's rely on event.payload.timeOnPage for time testing.

describe('MetaAgent', () => {
    let agent: MetaAgent;

    beforeEach(() => {
        agent = new MetaAgent();
        // Prevent console logs during tests to keep output clean, unless debugging
        jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('initial state should be IDLE', () => {
        expect(agent.getState()).toBe(AssistantState.IDLE);
    });

    test('REQUEST_MANAGER_CONTACT from button should set mode to chat', () => {
        const plan = agent.processEvent({ type: 'REQUEST_MANAGER_CONTACT', payload: { source: 'object_detail_button' } });

        expect(plan.assistant?.mode).toBe('chat');
        // When opened from button, content is explicitly undefined so ChatBubble can use its default greeting
        expect(plan.assistant?.content).toBeUndefined();
    });

    test('DISMISSED_NOTIFICATION should set mode to hidden', () => {
        // First, open it
        agent.processEvent({ type: 'REQUEST_MANAGER_CONTACT', payload: { source: 'object_detail_button' } });

        // Then dismiss
        const plan = agent.processEvent({ type: 'DISMISSED_NOTIFICATION', payload: { type: 'chat_close' } });

        expect(plan.assistant?.mode).toBe('hidden');
        expect(plan.assistant?.content).toBeUndefined();
    });

    test('USER_ENTERED_OBJECT sets state to SELECTING', () => {
        const plan = agent.processEvent({ type: 'USER_ENTERED_OBJECT', payload: { objectId: '123' } });

        expect(plan.session.state).toBe(AssistantState.SELECTING);
        expect(plan.assistant?.mode).toBe('hidden');
    });

    test('AR_STARTED sets state to AR_ACTIVE and mode to hidden', () => {
        const plan = agent.processEvent({ type: 'AR_STARTED' });

        expect(plan.session.state).toBe(AssistantState.AR_ACTIVE);
        expect(plan.assistant?.mode).toBe('hidden');
    });

    test('AR_ENDED transitions state to POST_AR_REFLECTION and suggests sharing', () => {
        // Must mark that AR was opened first to trigger share suggestion
        agent.processEvent({ type: 'AR_STARTED' });

        const plan = agent.processEvent({ type: 'AR_ENDED' });

        expect(plan.session.state).toBe(AssistantState.POST_AR_REFLECTION);
        expect(plan.assistant?.mode).toBe('chat');
        expect(plan.assistant?.content?.notificationType).toBe('SHARE_SUGGESTION');
    });
});

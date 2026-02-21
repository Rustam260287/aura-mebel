import React from 'react';
import { render } from '@testing-library/react';
import { AssistantRenderer } from './AssistantRenderer';
import { useAssistant } from '../../contexts/AssistantContext';
import { AssistantState } from '../../lib/agents/meta/types';

// Mock the context
jest.mock('../../contexts/AssistantContext', () => ({
    useAssistant: jest.fn(),
}));

// Mock the components it renders
jest.mock('./ChatBubble', () => ({
    ChatBubble: () => <div data-testid="chat-bubble">Chat Bubble Component</div>
}));
jest.mock('./Handoff/CuratorCard', () => ({
    CuratorCard: () => <div data-testid="curator-card">Curator Card Component</div>
}));

describe('AssistantRenderer', () => {
    const mockEmitMetaEvent = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return null when assistant is hidden', () => {
        (useAssistant as jest.Mock).mockReturnValue({
            actionPlan: {
                session: { state: AssistantState.IDLE },
                assistant: { mode: 'hidden', content: undefined }
            },
            emitMetaEvent: mockEmitMetaEvent
        });

        const { container } = render(<AssistantRenderer />);
        expect(container.firstChild).toBeNull();
    });

    test('should render ChatBubble when mode is chat, even if content is undefined', () => {
        (useAssistant as jest.Mock).mockReturnValue({
            actionPlan: {
                session: { state: AssistantState.IDLE },
                assistant: { mode: 'chat', content: undefined } // The exact scenario we fixed!
            },
            emitMetaEvent: mockEmitMetaEvent
        });

        const { getByTestId, queryByTestId } = render(<AssistantRenderer />);
        expect(getByTestId('chat-bubble')).toBeInTheDocument();
        expect(queryByTestId('curator-card')).not.toBeInTheDocument();
    });

    test('should render CuratorCard when content type is handoff_card', () => {
        (useAssistant as jest.Mock).mockReturnValue({
            actionPlan: {
                session: { state: AssistantState.IDLE },
                assistant: { mode: 'chat', content: { type: 'handoff_card' } }
            },
            emitMetaEvent: mockEmitMetaEvent
        });

        const { getByTestId, queryByTestId } = render(<AssistantRenderer />);
        expect(getByTestId('curator-card')).toBeInTheDocument();
        expect(queryByTestId('chat-bubble')).not.toBeInTheDocument();
    });
});

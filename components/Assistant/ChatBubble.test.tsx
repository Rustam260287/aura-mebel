import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatBubble } from './ChatBubble';
import { AssistantState } from '../../lib/agents/meta/types';
import { useAssistant } from '../../contexts/AssistantContext';

// Mock contexts
jest.mock('../../contexts/AssistantContext', () => ({
    useAssistant: jest.fn(),
}));

jest.mock('../../lib/journey/client', () => ({
    trackJourneyEvent: jest.fn(),
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('ChatBubble', () => {
    const mockEmitMetaEvent = jest.fn();
    const mockCuratorProfile = {
        displayName: 'Test Curator',
        roleLabel: 'Expert',
        contacts: {
            whatsapp: '12345',
            telegram: 'test_tg'
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useAssistant as jest.Mock).mockReturnValue({
            emitMetaEvent: mockEmitMetaEvent,
            curatorProfile: mockCuratorProfile
        });

        // Mock fetch globally
        global.fetch = jest.fn() as jest.Mock;
    });

    test('renders with default message when no text is provided', () => {
        render(<ChatBubble state={AssistantState.IDLE} />);
        expect(screen.getByText('Test Curator')).toBeInTheDocument();
        expect(screen.getByText('Я могу помочь разобраться со стилем или сочетанием, если хотите.')).toBeInTheDocument();
    });

    test('allows user to type and send a message', async () => {
        // Setup successful fetch mock
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                reply: 'Отличный выбор!',
                handoffRequired: false
            })
        });

        render(<ChatBubble state={AssistantState.IDLE} />);

        // Find input
        const input = screen.getByPlaceholderText(/спросить|задать/i) as HTMLTextAreaElement;

        // Type a message
        fireEvent.change(input, { target: { value: 'Привет, мне нравится этот диван' } });
        expect(input.value).toBe('Привет, мне нравится этот диван');

        // Click send (the button with ChatBubbleLeftRightIcon, which is the second button inside the input area)
        // Let's find button by role or closest identifier. The send button is disabled when input is empty.
        const sendButton = screen.getAllByRole('button').find(b => b.classList.contains('mb-1'));
        expect(sendButton).not.toBeDisabled();

        fireEvent.click(sendButton!);

        // User message should appear immediately (optimistic UI)
        expect(screen.getByText('Привет, мне нравится этот диван')).toBeInTheDocument();

        // Input should be cleared
        expect(input.value).toBe('');

        // Wait for AI reply
        await waitFor(() => {
            expect(screen.getByText('Отличный выбор!')).toBeInTheDocument();
        });
    });

    test('shows HandoffOptions when api returns handoffRequired: true', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                reply: 'По вопросам цены лучше обратиться к куратору.',
                handoffRequired: true
            })
        });

        render(<ChatBubble state={AssistantState.IDLE} />);

        const input = screen.getByPlaceholderText(/спросить|задать/i) as HTMLTextAreaElement;
        fireEvent.change(input, { target: { value: 'Сколько стоит?' } });

        const sendButton = screen.getAllByRole('button').find(b => b.classList.contains('mb-1'));
        fireEvent.click(sendButton!);

        // Message sent
        await waitFor(() => {
            expect(screen.getByText('По вопросам цены лучше обратиться к куратору.')).toBeInTheDocument();
        });

        // HandoffOptions should appear since handoffRequired is true
        expect(screen.getByText('WhatsApp')).toBeInTheDocument();
        expect(screen.getByText('Telegram')).toBeInTheDocument();
    });

    test('closes chat when X is clicked', () => {
        render(<ChatBubble state={AssistantState.IDLE} />);

        // The first button in the component is the close button in the header
        const closeButton = screen.getAllByRole('button')[0];
        fireEvent.click(closeButton);

        // Component should return null when isVisible goes false
        expect(screen.queryByText('Test Curator')).not.toBeInTheDocument();
    });
});

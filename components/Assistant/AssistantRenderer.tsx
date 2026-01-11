'use client';

import React from 'react';
import { useAssistant } from '../../contexts/AssistantContext';
import { AssistantState } from '../../lib/agents/meta/types';
import { ChatBubble } from './ChatBubble';

export const AssistantRenderer: React.FC = () => {
    const { actionPlan } = useAssistant();
    const { session, assistant } = actionPlan;

    // Strict AR Silence
    if (session.state === AssistantState.AR_ACTIVE) {
        return null;
    }

    // Toast for Snapshot
    if (session.state === AssistantState.SNAPSHOT_TAKEN && assistant?.mode === 'toast') {
        return (
            <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-xl border border-gray-100 z-[9999] animate-fade-in-up">
                <div className="flex items-center gap-3">
                    <span className="text-xl">📸</span>
                    <span className="text-sm font-medium text-gray-800">{assistant.content?.message || 'Снимок сохранён'}</span>
                </div>
            </div>
        );
    }

    // Chat Bubble Rendering
    if (assistant?.mode === 'chat' && assistant.content) {
        return (
            <ChatBubble
                text={assistant.content.text}
                content={assistant.content}
                state={session.state}
            />
        );
    }

    return null;
};

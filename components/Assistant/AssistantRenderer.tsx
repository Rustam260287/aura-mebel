'use client';

import React, { useEffect } from 'react';
import { useAssistant } from '../../contexts/AssistantContext';
import { AssistantState } from '../../lib/agents/meta/types';
import { ChatBubble } from './ChatBubble';
import { CuratorCard } from './Handoff/CuratorCard';

export const AssistantRenderer: React.FC = () => {
    const { actionPlan, emitMetaEvent } = useAssistant();
    const { session, assistant } = actionPlan;

    // Handle Share Request
    useEffect(() => {
        if (assistant?.content?.type === 'share_object') {
            const shareData = {
                title: 'Aura Home Design',
                text: 'Посмотри, как эта мебель смотрится в моем интерьере!',
                url: window.location.href
            };

            if (navigator.share) {
                navigator.share(shareData)
                    .then(() => emitMetaEvent({ type: 'RESET' }))
                    .catch((err) => console.log('Share canceled', err));
            } else {
                navigator.clipboard.writeText(window.location.href);
                // Ideally show a toast here, but for now rely on browser UI or rapid follow-up
                alert('Ссылка скопирована!'); // Simple "Swiss Watch" feedback
                emitMetaEvent({ type: 'RESET' });
            }
        }
    }, [assistant?.content]);

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

    // Chat Bubble or Curator Card Rendering
    if (assistant?.mode === 'chat' && assistant.content) {
        if (assistant.content.type === 'handoff' || assistant.content.type === 'handoff_card') {
            return (
                <CuratorCard onClose={() => emitMetaEvent({ type: 'DISMISSED_NOTIFICATION', payload: { type: 'handoff' } })} />
            );
        }

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

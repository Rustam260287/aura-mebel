'use client';

import React, { useState, useEffect } from 'react';
import { AssistantState } from '../../lib/agents/meta/types';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAssistant } from '../../contexts/AssistantContext';

import { HandoffOptions } from './Handoff/HandoffOptions';
import { trackJourneyEvent } from '../../lib/journey/client';

interface ChatBubbleProps {
    text?: string;
    content?: any;
    state: AssistantState;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ text, content, state }) => {
    const { emitMetaEvent } = useAssistant();
    const [isVisible, setIsVisible] = useState(true);
    const [showContactOptions, setShowContactOptions] = useState(false);

    // Re-show when text or content changes
    useEffect(() => {
        setIsVisible(true);
        setShowContactOptions(false);
    }, [text, content]);

    if (!isVisible) return null;

    const isHandoff = content?.type === 'handoff';
    const displayText = isHandoff ? "Хотите обсудить этот вариант с менеджером?" : text;

    const handleContactSelect = (channel: 'whatsapp' | 'telegram' | 'phone') => {
        // Here we would call the backend notification logic
        // For now, simple logging/alert or strict event dispatching
        // notifyManager({ ... }) logic placeholder

        // Track analytics
        trackJourneyEvent({
            type: 'HANDOFF_REQUESTED',
            meta: {
                handoff: {
                    reason: 'contact',
                    channel
                }
            }
        });

        // Hide assistant after selection
        setIsVisible(false);
        // Reset state or show success toast? 
        // MetaAgent could handle HANDOFF_COMPLETED
    };

    return (
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl rounded-tr-sm shadow-2xl border border-white/20 p-4 max-w-[320px] animate-fade-in-up">
                <div className="flex justify-between items-start gap-4 mb-2">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Aura Assistant</h4>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-sm text-gray-800 leading-relaxed font-medium">
                    {displayText}
                </p>

                {state === AssistantState.SELECTING && (
                    <div className="mt-4 flex gap-2">
                        <button
                            className="bg-brand-charcoal text-white text-xs px-4 py-2 rounded-full font-medium hover:bg-black transition-colors"
                            onClick={() => emitMetaEvent({ type: 'VIEW_IN_AR' })}
                        >
                            Примерить в AR
                        </button>
                    </div>
                )}

                {state === AssistantState.POST_AR_REFLECTION && !isHandoff && (
                    <div className="mt-4 flex gap-2">
                        <button
                            className="text-xs text-brand-charcoal underline underline-offset-4 decoration-black/20 hover:decoration-black/50 transition-all font-medium"
                            onClick={() => emitMetaEvent({ type: 'REQUEST_MANAGER_CONTACT', payload: { source: 'bubble_link' } })}
                        >
                            Спросить эксперта
                        </button>
                    </div>
                )}

                {isHandoff && !showContactOptions && (
                    <div className="mt-4 flex gap-2">
                        <button
                            className="bg-gray-100 text-gray-700 text-xs px-4 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors"
                            onClick={() => {
                                // "Save" logic - effectively dismisses handoff for now, maybe triggers generic save
                                setIsVisible(false);
                                emitMetaEvent({ type: 'RESET' }); // Or just close
                            }}
                        >
                            Сохранить
                        </button>
                        <button
                            className="bg-brand-charcoal text-white text-xs px-4 py-2 rounded-full font-medium hover:bg-black transition-colors"
                            onClick={() => setShowContactOptions(true)}
                        >
                            Обсудить
                        </button>
                    </div>
                )}

                {isHandoff && showContactOptions && (
                    <HandoffOptions
                        onSelect={handleContactSelect}
                        onCancel={() => setShowContactOptions(false)}
                    />
                )}
            </div>
        </div>
    );
};

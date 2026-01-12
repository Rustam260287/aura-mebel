'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AssistantState } from '../../lib/agents/meta/types';
import { XMarkIcon, PaperClipIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
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
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Re-show when text or content changes
    useEffect(() => {
        setIsVisible(true);
        setShowContactOptions(false);
    }, [text, content]);

    if (!isVisible) return null;

    const isHandoff = content?.type === 'handoff';
    const isPhotoAnalysis = content?.type === 'photo_analysis';
    const isDeeplinkContext = content?.type === 'object_context' && content.payload?.source === 'deeplink';

    const displayText = isHandoff
        ? "Переключаю на куратора Aura."
        : isDeeplinkContext
            ? "Этот объект был примерен в Aura. Нажмите, чтобы посмотреть в AR."
            : text;

    const handleContactSelect = (channel: 'whatsapp' | 'telegram' | 'phone') => {
        trackJourneyEvent({
            type: 'HANDOFF_REQUESTED',
            meta: { handoff: { reason: 'contact', channel } }
        });
        setIsVisible(false);
        emitMetaEvent({ type: 'RESET' });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewImage(url);
            emitMetaEvent({ type: 'PHOTO_UPLOADED', payload: { file } });
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9991] flex flex-col items-end pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl rounded-tr-sm shadow-2xl border border-white/20 p-4 max-w-[320px] animate-fade-in-up transition-all duration-300 pointer-events-auto">
                <div className="flex justify-between items-start gap-4 mb-2">
                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Aura Assistant</h4>
                    <div className="flex gap-2">
                        {!isHandoff && (
                            <button
                                onClick={() => emitMetaEvent({ type: 'REQUEST_MANAGER_CONTACT', payload: { source: 'user_initiated' } })}
                                className="text-gray-400 hover:text-brand-charcoal transition-colors"
                                title="Написать куратору"
                            >
                                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setIsVisible(false);
                                if (content?.notificationType) {
                                    emitMetaEvent({ type: 'DISMISSED_NOTIFICATION', payload: { type: content.notificationType } });
                                }
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Image Preview */}
                {previewImage && (
                    <div className="mb-3 relative rounded-lg overflow-hidden border border-gray-100">
                        <img src={previewImage} alt="Room context" className="w-full h-32 object-cover" />
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                        >
                            <XMarkIcon className="w-3 h-3" />
                        </button>
                    </div>
                )}

                <p className="text-sm text-gray-800 leading-relaxed font-medium">
                    {displayText}
                </p>

                {/* Actions Area */}
                <div className="mt-4 flex flex-wrap gap-2 items-center">

                    {/* File Upload Trigger */}
                    {!previewImage && !isHandoff && (
                        <div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-gray-400 hover:text-brand-charcoal p-1 rounded-md transition-colors"
                                title="Добавить фото комнаты"
                            >
                                <PaperClipIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {state === AssistantState.SELECTING && (
                        <button
                            className="bg-brand-charcoal text-white text-xs px-4 py-2 rounded-full font-medium hover:bg-black transition-colors"
                            onClick={() => emitMetaEvent({ type: 'VIEW_IN_AR' })}
                        >
                            Примерить в AR
                        </button>
                    )}

                    {isHandoff && !showContactOptions && (
                        <>
                            <button
                                className="bg-gray-100 text-gray-700 text-xs px-4 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors"
                                onClick={() => {
                                    setIsVisible(false);
                                    emitMetaEvent({ type: 'RESET' });
                                }}
                            >
                                Позже
                            </button>
                            <button
                                className="bg-brand-charcoal text-white text-xs px-4 py-2 rounded-full font-medium hover:bg-black transition-colors"
                                onClick={() => setShowContactOptions(true)}
                            >
                                Написать
                            </button>
                        </>
                    )}
                </div>

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

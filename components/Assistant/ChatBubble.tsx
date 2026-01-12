'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AssistantState } from '../../lib/agents/meta/types';
import { XMarkIcon, PaperClipIcon, ChatBubbleLeftRightIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAssistant } from '../../contexts/AssistantContext';

import { HandoffOptions, CuratorContacts } from './Handoff/HandoffOptions';
import { trackJourneyEvent } from '../../lib/journey/client';

interface ChatBubbleProps {
    text?: string;
    content?: any;
    state: AssistantState;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ text, content, state }) => {
    const { emitMetaEvent, curatorProfile } = useAssistant();
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

    const displayName = curatorProfile?.displayName || 'Aura Assistant';
    const roleLabel = curatorProfile?.roleLabel || '';
    const avatarUrl = curatorProfile?.avatarUrl;

    const displayText = isHandoff
        ? `Переключаю на куратора (${displayName}).`
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

    // Prepare contacts from curator profile, or fallback to object structure if types mismatch
    // The CuratorProfile has 'contacts' object: { whatsapp, telegram, phone }
    // HandoffOptions expects CuratorContacts interface
    const currentContacts: CuratorContacts | undefined = curatorProfile?.contacts ? {
        whatsapp: curatorProfile.contacts.whatsapp,
        telegram: curatorProfile.contacts.telegram,
        phone: curatorProfile.contacts.phone
    } : undefined;

    return (
        <div className="fixed bottom-6 right-6 z-[9991] flex flex-col items-end pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl rounded-tr-sm shadow-2xl border border-white/20 p-4 max-w-[320px] animate-fade-in-up transition-all duration-300 pointer-events-auto">
                <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <UserCircleIcon className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-900">{displayName}</h4>
                            {roleLabel && <p className="text-[9px] text-gray-500">{roleLabel}</p>}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {!isHandoff && (
                            <button
                                onClick={() => emitMetaEvent({ type: 'REQUEST_MANAGER_CONTACT', payload: { source: 'user_initiated' } })}
                                className="text-gray-400 hover:text-brand-charcoal transition-colors p-1"
                                title={`Написать (${displayName})`}
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
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            title="Закрыть"
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

                <p className="text-sm text-gray-800 leading-relaxed font-medium pl-10 -mt-2">
                    {displayText}
                </p>

                {/* Actions Area */}
                <div className="mt-4 flex flex-wrap gap-2 items-center pl-10">

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

                    {content?.action === 'contact' && (
                        <button
                            className="bg-brand-charcoal text-white text-xs px-4 py-2 rounded-full font-medium hover:bg-black transition-colors"
                            onClick={() => emitMetaEvent({ type: 'REQUEST_MANAGER_CONTACT', payload: { source: 'suggestion_click' } })}
                        >
                            Написать
                        </button>
                    )}

                    {content?.action === 'share' && (
                        <button
                            className="bg-brand-charcoal text-white text-xs px-4 py-2 rounded-full font-medium hover:bg-black transition-colors"
                            onClick={() => {
                                emitMetaEvent({ type: 'REQUEST_SHARE_OBJECT', payload: { source: 'suggestion_click' } });
                            }}
                        >
                            Поделиться
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
                    <div className="pl-10">
                        <HandoffOptions
                            contacts={currentContacts}
                            onSelect={handleContactSelect}
                            onCancel={() => setShowContactOptions(false)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};


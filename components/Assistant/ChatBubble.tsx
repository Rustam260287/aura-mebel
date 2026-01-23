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
    const [inputText, setInputText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [history, setHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

    // Auto-scroll logic
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Random placeholder (memoized)
    const placeholder = React.useMemo(() => {
        const options = [
            'Спросить о стиле или сочетании…',
            'Задать спокойный вопрос…',
            'Спросить, если есть сомнения…'
        ];
        return options[Math.floor(Math.random() * options.length)];
    }, []);

    // Initialize history with the incoming system message if present
    useEffect(() => {
        if (text) {
            setHistory([{ role: 'assistant', content: text }]);
        } else if (!history.length) {
            setHistory([{
                role: 'assistant',
                content: 'Я могу помочь разобраться со стилем или сочетанием, если хотите.'
            }]);
        }
        setIsVisible(true);
        setShowContactOptions(false);
    }, [text, content]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isSending]);

    if (!isVisible) return null;

    const isHandoff = content?.type === 'handoff' || showContactOptions; // Force handoff UI if active
    const displayName = curatorProfile?.displayName || 'Aura Assistant';
    const roleLabel = curatorProfile?.roleLabel || '';
    const avatarUrl = curatorProfile?.avatarUrl;

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
            // Ideally we'd upload specific file logic here, but for now we just show preview
            // and the user can send it with the text message context if we extended the API.
            // For now, mirroring existing behavior:
            emitMetaEvent({ type: 'PHOTO_UPLOADED', payload: { file } });
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() && !previewImage) return;

        const userMsg = inputText.trim();
        const currentImage = previewImage;

        // Optimistic UI
        setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setInputText('');
        setIsSending(true);

        try {
            const res = await fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMsg,
                    history: history, // Send full history for context
                    imageUrl: currentImage,
                    // We could inject object context here if we had access to the active object in this component
                })
            });

            if (!res.ok) throw new Error('Failed to send');
            const data = await res.json();

            if (data.reply) {
                setHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
            }

            if (data.handoffRequired) {
                setShowContactOptions(true);
            }

        } catch (e) {
            console.error(e);
            setHistory(prev => [...prev, { role: 'assistant', content: 'Что-то пошло не так. Попробуйте позже.' }]);
        } finally {
            setIsSending(false);
            setPreviewImage(null); // Clear image after send
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Prepare contacts
    const currentContacts: CuratorContacts | undefined = curatorProfile?.contacts ? {
        whatsapp: curatorProfile.contacts.whatsapp,
        telegram: curatorProfile.contacts.telegram,
        phone: curatorProfile.contacts.phone
    } : undefined;

    return (
        <div className="fixed bottom-6 right-6 z-[9991] flex flex-col items-end pointer-events-none">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl rounded-tr-sm shadow-2xl border border-white/20 w-[340px] flex flex-col pointer-events-auto overflow-hidden animate-fade-in-up">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex-shrink-0 border border-gray-100 overflow-hidden">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <UserCircleIcon className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 className="text-[11px] uppercase tracking-widest font-bold text-gray-900">{displayName}</h4>
                            <p className="text-[10px] text-gray-500">{roleLabel || 'Support'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setIsVisible(false);
                            if (content?.notificationType) {
                                emitMetaEvent({ type: 'DISMISSED_NOTIFICATION', payload: { type: content.notificationType || 'chat_close' } });
                            }
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="p-4 max-h-[300px] overflow-y-auto space-y-3 bg-gray-50/30">
                    {history.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                                max-w-[85%] text-sm leading-relaxed px-3 py-2 rounded-2xl
                                ${msg.role === 'user'
                                    ? 'bg-brand-charcoal text-white rounded-br-sm'
                                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'}
                            `}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isSending && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-100 px-3 py-2 rounded-2xl rounded-bl-sm shadow-sm flex gap-1 items-center h-9">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Handoff or Input */}
                {isHandoff ? (
                    <div className="p-4 bg-white border-t border-gray-100">
                        <HandoffOptions
                            contacts={currentContacts}
                            onSelect={handleContactSelect}
                            onCancel={() => setShowContactOptions(false)}
                        />
                    </div>
                ) : (
                    <div className="p-3 bg-white border-t border-gray-100">
                        {/* Image Preview */}
                        {previewImage && (
                            <div className="mb-2 relative rounded-md overflow-hidden border border-gray-100 w-fit">
                                <img src={previewImage} alt="Preview" className="h-16 w-auto object-cover" />
                                <button
                                    onClick={() => setPreviewImage(null)}
                                    className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70"
                                >
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        <div className="flex items-end gap-2">
                            {/* File Upload Hidden */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileUpload}
                            />
                            {/* <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-gray-400 hover:text-brand-charcoal pb-2 transition-colors"
                            >
                                <PaperClipIcon className="w-5 h-5" />
                            </button> */}
                            {/* Attachment disabled for 'Quiet' first pass to keep it simple, or keep enabled? 
                                User requested decision support. Visuals help. I will keep it but maybe cleaner. 
                                Actually, enable it.
                            */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="text-gray-400 hover:text-brand-charcoal mb-2"
                                title="Attach photo"
                            >
                                <PaperClipIcon className="w-5 h-5" />
                            </button>

                            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-gray-200 transition-all">
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={placeholder}
                                    className="w-full bg-transparent border-none focus:ring-0 text-sm text-gray-900 placeholder:text-gray-400 resize-none max-h-20 py-0"
                                    rows={1}
                                    style={{ minHeight: '20px' }}
                                />
                            </div>

                            <button
                                onClick={handleSendMessage}
                                disabled={!inputText.trim() && !previewImage || isSending}
                                className={`mb-1 p-2 rounded-full transition-colors ${(!inputText.trim() && !previewImage) || isSending
                                        ? 'text-gray-300'
                                        : 'text-brand-charcoal hover:bg-gray-100'
                                    }`}
                            >
                                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


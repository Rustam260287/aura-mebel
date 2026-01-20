'use client';

import React, { useEffect, useState } from 'react';
import { getOrCreateVisitorId } from '../../lib/analytics/visitorId';
import { trackJourneyEvent } from '../../lib/journey/client';
import { HandoffOptions } from '../Assistant/Handoff/HandoffOptions';

interface PostARBridgeProps {
    objectId: string;
    objectName?: string;
    snapshotUrl?: string; // Canvas capture or fallback image
    arSessionId?: string; // v1.1: Link to AR session
    onClose: () => void;
    onRestart: () => void;
    onSendToManager?: () => void; // v1.1: Override for custom logic (e.g. Agent Chat)
}

type BridgeState = 'saved' | 'share_options' | 'sent';

export const PostARBridge: React.FC<PostARBridgeProps> = ({
    objectId,
    objectName,
    snapshotUrl,
    arSessionId,
    onClose,
    onRestart,
    onSendToManager,
}) => {
    const [state, setState] = useState<BridgeState>('saved');
    const [handoffId, setHandoffId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Create handoff entity on mount
    useEffect(() => {
        const createHandoff = async () => {
            setIsCreating(true);
            try {
                const visitorId = getOrCreateVisitorId();
                const res = await fetch('/api/handoff/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        visitorId,
                        objectId,
                        snapshotUrl,
                        arSessionId, // v1.1
                        source: 'AR',
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    setHandoffId(data.id);
                    trackJourneyEvent({
                        type: 'HANDOFF_CREATED',
                        objectId,
                        meta: { handoffId: data.id },
                    });
                }
            } catch (err) {
                console.error('[PostARBridge] Failed to create handoff:', err);
            } finally {
                setIsCreating(false);
            }
        };

        createHandoff();
    }, [objectId, snapshotUrl]);

    const handleSendToManager = () => {
        if (onSendToManager) {
            onSendToManager();
            return;
        }
        setState('share_options');
    };

    const handleChannelSelect = async (channel: 'whatsapp' | 'telegram' | 'phone') => {
        // Update status to 'sent'
        if (handoffId) {
            try {
                await fetch(`/api/handoff/${handoffId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'sent' }),
                });
                trackJourneyEvent({
                    type: 'HANDOFF_SENT',
                    objectId,
                    meta: { handoffId, channel },
                });
            } catch (err) {
                console.error('[PostARBridge] Failed to update handoff status:', err);
            }
        }

        // Generate share message
        const shareUrl = handoffId
            ? `${window.location.origin}/saved/${handoffId}`
            : window.location.href;

        const message = encodeURIComponent(
            `Здравствуйте. Я посмотрел(а) вариант мебели «${objectName || 'мебель'}» в своей комнате через Aura. Хочу обсудить этот вариант.\n\n${shareUrl}`
        );

        let url = '';
        if (channel === 'whatsapp') {
            url = `https://wa.me/?text=${message}`;
        } else if (channel === 'telegram') {
            url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${message}`;
        }

        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }

        setState('sent');
    };

    const handleCancel = () => {
        setState('saved');
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
                {/* Hero: Snapshot */}
                <div className="relative aspect-[4/3] bg-stone-100">
                    {snapshotUrl ? (
                        <img
                            src={snapshotUrl}
                            alt="AR Scene"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-gray text-sm">
                            Ваш вариант
                        </div>
                    )}

                    {/* Close X (Top Right - Optional backup) */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-soft-black hover:bg-white transition-colors"
                        aria-label="Закрыть"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    {state === 'saved' && (
                        <>
                            <h2 className="text-lg font-semibold text-soft-black mb-1 leading-tight">
                                Предмет сохранён
                            </h2>
                            <p className="text-sm text-muted-gray mb-6">
                                Сохраните результат или примерьте снова
                            </p>

                            {/* Primary: Share / Show to loved ones */}
                            <button
                                onClick={handleSendToManager}
                                disabled={isCreating}
                                className="w-full bg-brand-brown text-white py-4 rounded-xl font-medium shadow-lg hover:bg-brand-charcoal transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="18" cy="5" r="3"></circle>
                                    <circle cx="6" cy="12" r="3"></circle>
                                    <circle cx="18" cy="19" r="3"></circle>
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                </svg>
                                Показать близким
                            </button>

                            {/* Secondary: Try Again */}
                            <button
                                onClick={onRestart}
                                className="w-full mt-3 bg-stone-beige/10 text-soft-black py-3 rounded-xl font-medium hover:bg-stone-beige/20 transition-colors"
                            >
                                Примерить ещё раз
                            </button>

                            {/* Tertiary: Back to Object */}
                            <button
                                onClick={onClose}
                                className="w-full mt-2 text-muted-gray py-2 text-xs hover:text-soft-black/60 transition-colors"
                            >
                                Вернуться к объекту
                            </button>
                        </>
                    )}

                    {state === 'share_options' && (
                        <>
                            <div className="text-lg font-semibold text-soft-black mb-2">
                                Выберите способ
                            </div>
                            <HandoffOptions
                                contacts={{ whatsapp: 'any', telegram: 'any' }} // Will use generic share
                                onSelect={handleChannelSelect}
                                onCancel={handleCancel}
                            />
                        </>
                    )}

                    {state === 'sent' && (
                        <>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span className="text-lg font-semibold text-soft-black">Ссылка создана</span>
                            </div>
                            <p className="text-sm text-muted-gray mb-6">
                                Теперь вы можете отправить её близким
                            </p>

                            <button
                                onClick={onClose}
                                className="w-full bg-brand-brown text-white py-4 rounded-xl font-medium shadow-lg hover:bg-brand-charcoal transition-colors"
                            >
                                Отлично, спасибо
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

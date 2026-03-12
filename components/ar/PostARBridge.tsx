'use client';

import React, { useEffect, useState } from 'react';
import { getOrCreateVisitorId } from '../../lib/analytics/visitorId';
import { trackJourneyEvent } from '../../lib/journey/client';
import { HandoffOptions } from '../Assistant/Handoff/HandoffOptions';
import { createShareLink } from '../../lib/shareClient';

interface PostARBridgeProps {
    objectId: string;
    objectName?: string;
    // v1.1: Snapshot removed
    arSessionId?: string; // Link to AR session
    onClose: () => void;
    onRestart: () => void;
    onSendToManager?: () => void;
}

type BridgeState = 'saved' | 'share_options' | 'sent';

export const PostARBridge: React.FC<PostARBridgeProps> = ({
    objectId,
    objectName,
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
                        // snapshotUrl removed
                        arSessionId,
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
    }, [objectId, arSessionId]);

    const handleSendToManager = () => {
        if (onSendToManager) {
            onSendToManager();
            return;
        }
        setState('share_options');
    };

    const handleChannelSelect = async (channel: 'whatsapp' | 'telegram' | 'max' | 'phone') => {
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
                if (typeof window !== 'undefined' && (window as any).ym) {
                    (window as any).ym(106314786, 'reachGoal', 'handoff_sent');
                }
            } catch (err) {
                console.error('[PostARBridge] Failed to update handoff status:', err);
            }
        }

        // Generate share message
        const shareUrl =
            (await createShareLink({ objectId })) ||
            window.location.href;

        const message = encodeURIComponent(
            `Здравствуйте. Я посмотрел(а) вариант мебели «${objectName || 'мебель'}» в своей комнате через Aura. Хочу обсудить этот вариант.\n\n${shareUrl}`
        );

        let url = '';
        if (channel === 'whatsapp') {
            url = `https://wa.me/?text=${message}`;
        } else if (channel === 'telegram') {
            url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${message}`;
        } else if (channel === 'max') {
            url = `https://max.ru/call?text=${message}`;
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
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Height auto, centered */}
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
                {state === 'saved' && (
                    <>
                        {/* No Image, just Text */}
                        <h2 className="text-2xl font-bold text-soft-black mb-2 leading-tight">
                            Готово
                        </h2>
                        <p className="text-base text-muted-gray mb-8">
                            Вы можете показать этот вариант близким или примерить ещё раз
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
                            className="w-full mt-3 bg-stone-beige/10 text-soft-black py-4 rounded-xl font-medium hover:bg-stone-beige/20 transition-colors"
                        >
                            Примерить ещё раз
                        </button>

                        {/* Tertiary: Back to Object */}
                        <button
                            onClick={onClose}
                            className="w-full mt-4 text-muted-gray py-2 text-sm hover:text-soft-black/60 transition-colors"
                        >
                            Вернуться к объекту
                        </button>
                    </>
                )}

                {state === 'share_options' && (
                    <>
                        <div className="text-lg font-semibold text-soft-black mb-4">
                            Выберите способ
                        </div>
                        <HandoffOptions
                            contacts={{ whatsapp: 'any', telegram: 'any', max: 'any' }}
                            onSelect={handleChannelSelect}
                            onCancel={handleCancel}
                        />
                    </>
                )}

                {state === 'sent' && (
                    <>
                        <div className="flex flex-col items-center justify-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-soft-black">Ссылка создана</span>
                        </div>
                        <p className="text-base text-muted-gray mb-8">
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
    );
};

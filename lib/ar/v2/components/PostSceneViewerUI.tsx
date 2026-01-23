/**
 * PostSceneViewerUI — Post-AR UI shown after returning from Google Scene Viewer
 * 
 * This is a simplified version that doesn't require snapshot/photo.
 * Shows after user returns from Scene Viewer (detected via visibilitychange).
 */

'use client';

import React from 'react';

interface PostSceneViewerUIProps {
    objectId: string;
    objectName?: string;
    /** Duration spent in AR (seconds) */
    durationSec?: number;
    /** Share object link callback */
    onShare: () => void;
    /** Retry AR callback */
    onRetry: () => void;
    /** Close and return to page callback */
    onClose: () => void;
}

export const PostSceneViewerUI: React.FC<PostSceneViewerUIProps> = ({
    objectName,
    onShare,
    onRetry,
    onClose,
}) => {
    return (
        <div className="fixed inset-0 z-[300] flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Bottom Sheet style */}
            <div className="bg-white rounded-t-3xl shadow-2xl max-w-md w-full p-6 pb-8 text-center animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-xl font-semibold text-soft-black mb-1">
                        Примерка завершена
                    </h2>
                    {objectName && (
                        <p className="text-sm text-muted-gray">
                            {objectName}
                        </p>
                    )}
                </div>

                {/* Primary CTA: Share */}
                <button
                    onClick={onShare}
                    className="w-full bg-brand-brown text-white py-4 rounded-xl font-medium shadow-lg hover:bg-brand-charcoal transition-colors flex items-center justify-center gap-2"
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

                {/* Secondary: Retry */}
                <button
                    onClick={onRetry}
                    className="w-full mt-3 bg-stone-beige/10 text-soft-black py-4 rounded-xl font-medium hover:bg-stone-beige/20 transition-colors"
                >
                    Примерить ещё раз
                </button>

                {/* Tertiary: Close */}
                <button
                    onClick={onClose}
                    className="w-full mt-4 text-muted-gray py-2 text-sm hover:text-soft-black/60 transition-colors"
                >
                    Вернуться
                </button>
            </div>
        </div>
    );
};

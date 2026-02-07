/**
 * PostARUI — Premium Post-AR Experience
 * 
 * Shown after user taps "Done" in AR:
 * - Freeze frame of last AR view
 * - Share button (Web Share API)
 * - Save to favorites
 * - Done to close
 */

import React, { useState } from 'react';

interface PostARUIProps {
    objectId: string;
    objectName: string;
    onShare: () => Promise<void>;
    onSave: () => void;
    onDone: () => void;
    isSaved: boolean;
}

export const PostARUI: React.FC<PostARUIProps> = ({
    objectName,
    onShare,
    onSave,
    onDone,
    isSaved,
}) => {
    const [isSharing, setIsSharing] = useState(false);
    const [shareSuccess, setShareSuccess] = useState(false);

    const handleShare = async () => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            await onShare();
            setShareSuccess(true);
            // Haptic feedback
            if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
        } catch {
            // Share cancelled or failed — silent
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none">
            {/* Gradient overlay for text readability */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 40%, transparent 100%)',
                }}
            />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end pointer-events-auto">
                {/* Object name */}
                <div className="px-6 mb-4">
                    <h2 className="text-white text-xl font-medium drop-shadow-lg">
                        {objectName}
                    </h2>
                    <p className="text-white/70 text-sm mt-1">
                        Примерка завершена
                    </p>
                </div>

                {/* Action buttons */}
                <div
                    className="flex gap-3 px-6 pb-safe"
                    style={{
                        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
                    }}
                >
                    {/* Share button */}
                    <button
                        onClick={handleShare}
                        disabled={isSharing}
                        className={`
                            flex-1 py-4 rounded-2xl font-medium text-base
                            flex items-center justify-center gap-2
                            transition-all duration-200
                            ${shareSuccess
                                ? 'bg-green-500 text-white'
                                : 'bg-white/90 backdrop-blur-xl text-soft-black hover:bg-white active:scale-95'
                            }
                        `}
                    >
                        {shareSuccess ? (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Отправлено
                            </>
                        ) : isSharing ? (
                            <span className="animate-pulse">Отправка...</span>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="18" cy="5" r="3"></circle>
                                    <circle cx="6" cy="12" r="3"></circle>
                                    <circle cx="18" cy="19" r="3"></circle>
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                </svg>
                                Поделиться
                            </>
                        )}
                    </button>

                    {/* Save button */}
                    <button
                        onClick={onSave}
                        className={`
                            w-14 h-14 rounded-2xl 
                            flex items-center justify-center
                            transition-all duration-200 active:scale-95
                            ${isSaved
                                ? 'bg-rose-500 text-white'
                                : 'bg-white/20 backdrop-blur-xl text-white hover:bg-white/30'
                            }
                        `}
                        aria-label={isSaved ? 'Сохранено' : 'Сохранить'}
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill={isSaved ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>

                    {/* Done button */}
                    <button
                        onClick={onDone}
                        className="
                            w-14 h-14 rounded-2xl 
                            bg-white/90 backdrop-blur-xl text-soft-black
                            flex items-center justify-center
                            transition-all duration-200 active:scale-95
                            hover:bg-white
                        "
                        aria-label="Готово"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

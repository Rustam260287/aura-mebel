import React, { useState, useEffect } from 'react';
import type { ARStage } from '../types';

interface ARBottomControlsProps {
    stage: ARStage;
    onClose: () => void;
    onScreenshot: () => void;
    onDelete?: () => void;
    hasSelection: boolean;
}

export const ARBottomControls: React.FC<ARBottomControlsProps> = ({
    stage,
    onClose,
    onScreenshot,
    onDelete,
    hasSelection,
}) => {
    // Internal state for "Soft Delete" confirmation
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    // Reset confirmation if selection changes or stage changes
    useEffect(() => {
        setIsConfirmingDelete(false);
    }, [hasSelection, stage]);

    // Visibility Logic: Only show in 'active' stage
    // We keep it mounted but hidden to allow CSS exit animations
    const isVisible = stage === 'active';

    // Handler for Delete
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isConfirmingDelete) {
            onDelete?.();
            setIsConfirmingDelete(false);
        } else {
            setIsConfirmingDelete(true);
            // Haptic feedback (soft)
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(10);
            }
            // Auto-reset after 3s
            setTimeout(() => setIsConfirmingDelete(false), 3000);
        }
    };

    return (
        <div
            className={`
                absolute bottom-[calc(env(safe-area-inset-bottom)+16px)] left-0 right-0 
                px-6 flex items-center justify-between pointer-events-none
                transition-all duration-500 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}
            `}
        >

            {/* Left: Close */}
            <div className={`pointer-events-auto transition-transform active:scale-95 duration-200 ${isVisible ? '' : 'pointer-events-none'}`}>
                <button
                    onClick={onClose}
                    className="w-12 h-12 bg-white/75 backdrop-blur-xl rounded-full flex items-center justify-center text-black/80 shadow-[0_6px_24px_rgba(0,0,0,0.12)] hover:bg-white/90 transition-colors"
                    aria-label="Close AR"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>

            {/* Center: Delete (Context-sensitive) */}
            <div className="pointer-events-auto flex justify-center w-20 relative">
                {hasSelection && onDelete && (
                    <button
                        onClick={handleDeleteClick}
                        className={`
                            h-12 flex items-center justify-center rounded-full shadow-[0_6px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300
                            ${isConfirmingDelete
                                ? 'bg-black/80 text-white w-auto px-6'  // Expanded for confirmation
                                : 'bg-white/75 text-black/80 w-12 hover:bg-white/90' // Neutral default
                            }
                            active:scale-95
                        `}
                        aria-label="Delete Object"
                    >
                        {isConfirmingDelete ? (
                            <span className="text-sm font-medium whitespace-nowrap">Удалить?</span>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                        )}
                    </button>
                )}
            </div>

            {/* Right: Screenshot / Capture */}
            <div className={`pointer-events-auto transition-transform active:scale-95 duration-200 ${isVisible ? '' : 'pointer-events-none'}`}>
                <button
                    onClick={onScreenshot}
                    className="w-12 h-12 bg-white/75 backdrop-blur-xl rounded-full flex items-center justify-center text-black/80 shadow-[0_6px_24px_rgba(0,0,0,0.12)] hover:bg-white/90 transition-colors"
                    aria-label="Take Snapshot"
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

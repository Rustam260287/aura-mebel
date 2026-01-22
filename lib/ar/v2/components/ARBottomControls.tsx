import React from 'react';
import type { ARStage } from '../types';

interface ARBottomControlsProps {
    stage: ARStage;
    onClose: () => void;
}

/**
 * AR Controls v2 — Premium Quiet UX
 * 
 * Close button positioned in TOP-RIGHT corner to avoid:
 * - Dynamic Island conflicts
 * - Notch conflicts
 * - Bottom gesture area conflicts
 * 
 * Always visible when AR is active (placing/active/manipulating stages)
 */
export const ARBottomControls: React.FC<ARBottomControlsProps> = ({
    stage,
    onClose,
}) => {
    // Visibility: Show during AR stages (placing, active, manipulating)
    const isVisible = stage === 'placing' || stage === 'active' || stage === 'manipulating';

    return (
        <>
            {/* Close Button — Fixed Top-Right with Safe Area */}
            <button
                onClick={onClose}
                className={`
                    fixed z-[150] pointer-events-auto
                    w-12 h-12 bg-white/80 backdrop-blur-xl rounded-full 
                    flex items-center justify-center text-black/80 
                    shadow-[0_4px_16px_rgba(0,0,0,0.15)] 
                    hover:bg-white/95 active:scale-95
                    transition-all duration-300 ease-out
                    ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}
                `}
                style={{
                    top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
                    right: '16px',
                }}
                aria-label="Закрыть AR"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            {/* Done Button — Bottom Center (Active stage only) */}
            {stage === 'active' && (
                <div
                    className="fixed z-[150] left-0 right-0 flex justify-center pointer-events-none"
                    style={{
                        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
                    }}
                >
                    <button
                        onClick={onClose}
                        className="pointer-events-auto px-8 py-4 bg-white/90 backdrop-blur-xl rounded-2xl text-soft-black font-medium shadow-lg active:scale-95 transition-transform"
                    >
                        Готово
                    </button>
                </div>
            )}
        </>
    );
};

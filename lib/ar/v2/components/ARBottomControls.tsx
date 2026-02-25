import React from 'react';
import type { ARStage } from '../types';

interface ARBottomControlsProps {
    stage: ARStage;
    onClose: () => void;
    onSnapshot?: () => void;
}

/**
 * AR Controls v3 — Premium Quiet UX
 *
 * - Close (X) button: top-right, always accessible
 * - Done button: bottom-center, premium pill design
 * - Screenshot button: REMOVED per user request
 */
export const ARBottomControls: React.FC<ARBottomControlsProps> = ({
    stage,
    onClose,
}) => {
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

            {/* Done Button — Premium Pill, Bottom Center */}
            {stage === 'active' && (
                <div
                    className="fixed z-[150] left-0 right-0 flex justify-center pointer-events-none"
                    style={{
                        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)',
                    }}
                >
                    <button
                        onClick={onClose}
                        className="
                            pointer-events-auto
                            px-12 py-4
                            bg-white/95 backdrop-blur-2xl
                            rounded-full
                            text-[16px] font-semibold tracking-wide text-soft-black
                            shadow-[0_8px_32px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.08)]
                            active:scale-[0.96] active:shadow-[0_4px_16px_rgba(0,0,0,0.12)]
                            transition-all duration-200 ease-out
                            border border-white/60
                        "
                    >
                        Готово
                    </button>
                </div>
            )}
        </>
    );
};

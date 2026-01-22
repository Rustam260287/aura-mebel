import React from 'react';
import type { ARStage } from '../types';

interface ARBottomControlsProps {
    stage: ARStage;
    onClose: () => void;
}

export const ARBottomControls: React.FC<ARBottomControlsProps> = ({
    stage,
    onClose,
}) => {
    // Visibility Logic: Only show in 'active' stage
    const isVisible = stage === 'active';

    return (
        <div
            className={`
                absolute bottom-[calc(env(safe-area-inset-bottom)+16px)] left-0 right-0 
                px-6 flex items-center justify-center pointer-events-none
                transition-all duration-500 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}
            `}
        >

            {/* Close Button Only */}
            <div className={`pointer-events-auto transition-transform active:scale-95 duration-200 ${isVisible ? '' : 'pointer-events-none'}`}>
                <button
                    onClick={onClose}
                    className="w-14 h-14 bg-white/75 backdrop-blur-xl rounded-full flex items-center justify-center text-black/80 shadow-[0_6px_24px_rgba(0,0,0,0.12)] hover:bg-white/90 transition-colors"
                    aria-label="Close AR"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    );
};

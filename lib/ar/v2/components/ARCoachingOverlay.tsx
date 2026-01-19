import React from 'react';

interface ARCoachingOverlayProps {
    visible: boolean;
    hint?: 'scan' | 'move' | 'tap' | 'light';
}

export const ARCoachingOverlay: React.FC<ARCoachingOverlayProps> = ({ visible, hint = 'scan' }) => {
    if (!visible) return null;

    return (
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center">
            {/* Backdrop for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />

            {/* Animation Container */}
            <div className="relative flex flex-col items-center space-y-6 animate-in fade-in duration-500">

                {/* 1. SCAN ANIMATION */}
                {hint === 'scan' && (
                    <div className="relative w-24 h-24">
                        {/* Phone Icon */}
                        <div className="w-16 h-28 border-4 border-white/90 rounded-[2rem] absolute top-0 left-1/2 -translate-x-1/2 animate-[scan-horizontal_3s_ease-in-out_infinite]">
                            {/* Screen */}
                            <div className="absolute inset-2 bg-white/20 rounded-[1.2rem]" />
                            {/* Camera Notch */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-6 h-1 bg-white/40 rounded-full" />
                        </div>
                        {/* Floor Grid Hint (Static) */}
                        <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-40 h-20 border-t-2 border-white/30 rounded-[50%] scale-x-[2.5] opacity-50" />
                    </div>
                )}

                {/* 2. TAP GESTURE */}
                {hint === 'tap' && (
                    <div className="w-16 h-16 rounded-full border-2 border-white/50 animate-ping opacity-75" />
                )}

                {/* 3. TEXT HINT */}
                <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg max-w-xs text-center">
                    <span className="text-soft-black font-medium text-sm">
                        {hint === 'scan' && 'Плавно поводите телефоном, чтобы найти пол'}
                        {hint === 'move' && 'Попробуйте отойти чуть дальше'}
                        {hint === 'tap' && 'Коснитесь экрана, чтобы поставить'}
                        {hint === 'light' && 'Нужно больше света'}
                    </span>
                </div>
            </div>

            <style jsx>{`
                @keyframes scan-horizontal {
                    0%, 100% { transform: translateX(-50%) rotateY(-15deg) translateX(-20px); }
                    50% { transform: translateX(-50%) rotateY(15deg) translateX(20px); }
                }
            `}</style>
        </div>
    );
};

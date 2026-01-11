import React from 'react';
import Image from 'next/image';
import type { RoomAnalysis } from '../lib/ai/types';

interface AnalysisResultProps {
    imageUrl: string;
    analysis: RoomAnalysis;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ imageUrl, analysis }) => {
    if (!imageUrl) return null;

    return (
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden my-2 border border-gray-100 shadow-sm bg-gray-100">
            <Image
                src={imageUrl}
                alt="Room Analysis"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 400px"
            />

            {/* Thoughts Overlay / Furniture Zones */}
            {analysis.layout_suggestions?.map((item, i) => (
                <div
                    key={i}
                    style={{ left: `${item.x}%`, top: `${item.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-help z-10"
                >
                    {/* Pulsing Dot */}
                    <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-white shadow-sm flex items-center justify-center animate-bounce-slow">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-terracotta" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-white opacity-40 animate-ping-slow" />
                    </div>

                    {/* Label */}
                    <div className="mt-1 px-2 py-1 bg-black/60 text-white text-[10px] rounded-md backdrop-blur font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
                        {item.item}
                    </div>
                </div>
            ))}

            {/* Mood Label Badge */}
            {analysis.mood && (
                <div className="absolute top-3 left-3 px-2 py-1 bg-white/80 backdrop-blur rounded-full text-[10px] font-semibold text-brand-charcoal border border-white/50 shadow-sm">
                    ✨ {analysis.mood}
                </div>
            )}
        </div>
    );
};

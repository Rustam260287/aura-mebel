import React from 'react';

export const ProductCarouselSkeleton = () => (
    <div className="flex gap-3 overflow-hidden py-1 w-full">
        {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[200px] w-[200px] h-[260px] bg-gray-50/50 rounded-2xl flex flex-col p-3 border border-gray-100 flex-shrink-0 animate-pulse">
                <div className="flex-1 bg-gray-200/50 rounded-xl mb-3" />
                <div className="h-3 w-3/4 bg-gray-200/50 rounded mb-1.5" />
                <div className="h-2 w-1/2 bg-gray-100 rounded" />
            </div>
        ))}
    </div>
);

export const AnalysisSkeleton = () => (
    <div className="w-full aspect-[4/3] rounded-2xl bg-gray-50/50 border border-gray-100 overflow-hidden relative shadow-sm my-2">
        {/* Background Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-transparent animate-breathing-glow" />

        {/* Center Loader */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-3">
            <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-brand-terracotta/10" />
                <div className="absolute inset-0 rounded-full border-2 border-t-brand-terracotta border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-brand-charcoal/40 font-medium animate-pulse">
                Анализ пространства
            </span>
        </div>
    </div>
);

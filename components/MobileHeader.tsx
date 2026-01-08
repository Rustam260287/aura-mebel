import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
    ArrowLeftIcon,
    HeartIcon,
    Bars2Icon
} from '@heroicons/react/24/outline';
import { useSaved } from '../contexts/SavedContext';
import { useExperience } from '../contexts/ExperienceContext';

export const MobileHeader = () => {
    const router = useRouter();
    const { isSaved, addToSaved, removeFromSaved } = useSaved();
    const { state: experienceState } = useExperience();

    const [scrolled, setScrolled] = useState(false);
    const [isInvisibleRoute, setIsInvisibleRoute] = useState(false);

    // Detect active object ID based on route query
    // Pattern: /objects/[id]
    const isObjectPage = router.pathname === '/objects/[id]';
    const objectId = typeof router.query.id === 'string' ? router.query.id : null;
    const objectIsSaved = objectId ? isSaved(objectId) : false;

    useEffect(() => {
        // Hidden on AR/3D explicit states (managed by ExperienceContext usually, but for header we check route/state)
        // Also hidden on Admin possibly? Or handled by Admin layout.
        // For now, let's keep it visible on all public pages.
        const hidden = router.pathname === '/404' || router.pathname.startsWith('/admin');
        setIsInvisibleRoute(hidden);
    }, [router.pathname]);

    useEffect(() => {
        const handleScroll = () => {
            // Threshold: 60px (approx height of "ghost" header area or just a bit of scroll)
            setScrolled(window.scrollY > 60);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleHeartClick = () => {
        if (!objectId) return;
        if (objectIsSaved) {
            removeFromSaved(objectId);
        } else {
            addToSaved(objectId);
        }
    };

    // Determine if hidden by Aura Experience State (AR/3D)
    const isExperienceActive = experienceState === 'AR_ACTIVE' || experienceState === 'THREE_D_ACTIVE';

    // Opacity & visibility logic
    // Visible if: Scrolled > 60px AND Not in AR/3D AND Not invisible route
    // EXCEPTION: On non-home pages, maybe we want it visible immediately? 
    // User request: "Появляется только после скролла вниз". Let's stick to that global rule for "quietness".
    // Or maybe on Object Detail it should be present? 
    // "Header отсутствует на первом экране" -> implies Home Page. 
    // "появляется только после скролла вниз" -> Global rule.

    const showHeader = scrolled && !isExperienceActive && !isInvisibleRoute;

    const containerClasses = [
        'fixed top-0 inset-x-0 z-[49]', // z-49 to be under overlays like chat/modals but above content
        'h-14 px-4',
        'flex items-center justify-between',
        'bg-[#F9F8F6]/80 backdrop-blur-md', // Warm white with blur
        'transition-all duration-500 ease-out',
        showHeader ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
    ].join(' ');

    return (
        <header className={containerClasses}>
            {/* Left: Back Action */}
            <div className="flex-1 flex justify-start">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 text-brand-charcoal/80 active:opacity-60 transition-opacity"
                    aria-label="Назад"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Center: Micro-Brand */}
            <div className="flex-0 opacity-60">
                <Link href="/" className="block p-2 active:opacity-80 transition-opacity">
                    {/* Minimal AURA Triangle/A Icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-brand-charcoal">
                        <path d="M12 2L2 22H22L12 2Z" fill="currentColor" />
                    </svg>
                </Link>
            </div>

            {/* Right: Context Action */}
            <div className="flex-1 flex justify-end -mr-2">
                {isObjectPage && objectId ? (
                    <button
                        onClick={handleHeartClick}
                        className="p-2 text-brand-charcoal/80 active:opacity-60 transition-opacity"
                        aria-label={objectIsSaved ? "Убрать из избранного" : "В избранное"}
                    >
                        <HeartIcon className={`w-5 h-5 ${objectIsSaved ? 'fill-current' : ''}`} />
                    </button>
                ) : (
                    <Link href="/saved" className="p-2 text-brand-charcoal/80 active:opacity-60 transition-opacity" aria-label="Меню">
                        <Bars2Icon className="w-5 h-5" />
                    </Link>
                )}
            </div>
        </header>
    );
};

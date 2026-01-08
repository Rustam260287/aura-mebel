"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useExperience } from './ExperienceContext';

type ThemeMode = 'light' | 'focus';

interface ThemeContextType {
    mode: ThemeMode;
    isFocusMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Routes that should always be in "focus" (dark) mode
const FOCUS_ROUTES = ['/wizard', '/redesign'];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const router = useRouter();
    const { state: experienceState } = useExperience();
    const [mode, setMode] = useState<ThemeMode>('light');

    useEffect(() => {
        // Determine if we're in focus mode based on:
        // 1. Experience state (3D or AR active)
        // 2. Route (wizard, redesign)
        const isFocusExperience = experienceState === 'THREE_D_ACTIVE' || experienceState === 'AR_ACTIVE';
        const isFocusRoute = FOCUS_ROUTES.some(r => router.pathname.startsWith(r));

        const shouldBeFocus = isFocusExperience || isFocusRoute;

        setMode(shouldBeFocus ? 'focus' : 'light');
    }, [experienceState, router.pathname]);

    // NOTE: We no longer modify `document.documentElement` here.
    // Focus mode is applied locally by wrapping components in a `dark` class container.

    const value = useMemo(() => ({
        mode,
        isFocusMode: mode === 'focus',
    }), [mode]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

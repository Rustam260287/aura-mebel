import { useMemo } from 'react';
import { isYandexBrowser } from '../browserUtils';

/**
 * 3D configuration hook for browser-adaptive rendering.
 * Automatically downgrades settings for Yandex Browser to improve performance.
 */
export const use3DConfig = () => {
    return useMemo(() => {
        const isYandex = typeof window !== 'undefined' && isYandexBrowser();

        return {
            /** Device pixel ratio limits */
            dpr: isYandex ? [1, 1.5] as [number, number] : [1, 2] as [number, number],

            /** GPU power preference */
            powerPreference: 'high-performance' as const,

            /** Whether to use HDR environment (heavy on Yandex) */
            useEnvironment: !isYandex,

            /** Render loop mode */
            frameloop: isYandex ? ('demand' as const) : ('always' as const),

            /** Browser detected */
            isYandex,
        };
    }, []);
};

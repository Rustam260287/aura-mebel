import { useMemo } from 'react';

/**
 * 3D configuration hook for browser-adaptive rendering.
 */
export const use3DConfig = () => {
    return useMemo(() => {
        return {
            /** Device pixel ratio limits */
            dpr: [1, 2] as [number, number],

            /** GPU power preference */
            powerPreference: 'high-performance' as const,

            /** Whether to use HDR environment */
            useEnvironment: true,

            /** Render loop mode */
            frameloop: 'always' as const,

            /** Browser detected fallback */
            isYandex: false,
        };
    }, []);
};

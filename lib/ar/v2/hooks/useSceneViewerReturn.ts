/**
 * useSceneViewerReturn — Hook to detect return from Google Scene Viewer
 * 
 * When Scene Viewer is opened, the browser loses focus. This hook:
 * 1. Tracks when Scene Viewer was opened (timestamp)
 * 2. Listens for visibilitychange event
 * 3. On return (visible + enough time passed), triggers callback
 */

import { useCallback, useEffect, useRef } from 'react';
import { MIN_BACKGROUND_DURATION_MS } from '../constants';
import { trackJourneyEvent } from '../../../journey/client';

export interface SceneViewerReturnResult {
    /** Duration in seconds spent in Scene Viewer (approximately) */
    durationSec: number;
    /** Object ID that was viewed */
    objectId: string;
}

interface UseSceneViewerReturnOptions {
    /** Called when user returns from Scene Viewer after valid session */
    onReturn: (result: SceneViewerReturnResult) => void;
    /** Object ID being viewed */
    objectId: string;
    /** AR session ID for analytics */
    arSessionId?: string;
}

export function useSceneViewerReturn(options: UseSceneViewerReturnOptions) {
    const { onReturn, objectId, arSessionId } = options;

    const isActiveRef = useRef(false);
    const openedAtRef = useRef<number | null>(null);
    const objectIdRef = useRef(objectId);

    // Keep objectId ref in sync
    useEffect(() => {
        objectIdRef.current = objectId;
    }, [objectId]);

    /**
     * Call this when Scene Viewer is opened
     */
    const markSceneViewerOpened = useCallback(() => {
        isActiveRef.current = true;
        openedAtRef.current = Date.now();
        console.log('[SceneViewerReturn] Marked as active');
    }, []);

    /**
     * Reset the state (e.g., user dismissed Post-AR UI)
     */
    const reset = useCallback(() => {
        isActiveRef.current = false;
        openedAtRef.current = null;
    }, []);

    // Listen for visibility change
    useEffect(() => {
        if (typeof document === 'undefined') return;

        const handleVisibilityChange = () => {
            // Only care about becoming visible
            if (document.visibilityState !== 'visible') return;

            // Only if Scene Viewer was active
            if (!isActiveRef.current || !openedAtRef.current) return;

            const now = Date.now();
            const elapsed = now - openedAtRef.current;

            console.log(`[SceneViewerReturn] Returned after ${elapsed}ms`);

            // Check if enough time has passed (protection against instant failures)
            if (elapsed < MIN_BACKGROUND_DURATION_MS) {
                console.log('[SceneViewerReturn] Too fast, likely failed to open');
                reset();
                return;
            }

            // Valid return from Scene Viewer!
            const durationSec = Math.round(elapsed / 1000);

            // Log analytics
            trackJourneyEvent({
                type: 'FINISH_AR',
                objectId: objectIdRef.current,
                meta: {
                    arSessionId,
                    durationSec,
                    runtime: 'scene_viewer'
                },
            });

            // Trigger callback
            onReturn({
                durationSec,
                objectId: objectIdRef.current,
            });

            // Reset state
            reset();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [arSessionId, onReturn, reset]);

    return {
        markSceneViewerOpened,
        reset,
    };
}

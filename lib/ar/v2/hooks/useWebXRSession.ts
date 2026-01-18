/**
 * useWebXRSession — WebXR session lifecycle management
 */

import { useCallback, useRef, useState } from 'react';
import * as THREE from 'three';

interface UseWebXRSessionResult {
    session: XRSession | null;
    isSupported: boolean | null;
    error: string | null;

    checkSupport: () => Promise<boolean>;
    startSession: (renderer: THREE.WebGLRenderer, overlayRoot: HTMLElement) => Promise<XRSession>;
    endSession: () => Promise<void>;
}

export function useWebXRSession(): UseWebXRSessionResult {
    const [session, setSession] = useState<XRSession | null>(null);
    const [isSupported, setIsSupported] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    const sessionRef = useRef<XRSession | null>(null);

    const checkSupport = useCallback(async (): Promise<boolean> => {
        const xr = (navigator as any)?.xr;
        if (!xr || typeof xr.isSessionSupported !== 'function') {
            setIsSupported(false);
            return false;
        }

        try {
            const supported = await xr.isSessionSupported('immersive-ar');
            setIsSupported(supported);
            return supported;
        } catch (e) {
            console.error('[useWebXRSession] checkSupport error:', e);
            setIsSupported(false);
            return false;
        }
    }, []);

    const startSession = useCallback(async (
        renderer: THREE.WebGLRenderer,
        overlayRoot: HTMLElement
    ): Promise<XRSession> => {
        const xr = (navigator as any)?.xr;
        if (!xr) {
            throw new Error('WebXR not available');
        }

        // Prevent double start
        if (sessionRef.current) {
            return sessionRef.current;
        }

        setError(null);

        try {
            const xrSession = await xr.requestSession('immersive-ar', {
                requiredFeatures: ['hit-test'],
                optionalFeatures: ['dom-overlay', 'local-floor'],
                domOverlay: { root: overlayRoot },
            } as any);

            sessionRef.current = xrSession;
            setSession(xrSession);

            // Setup renderer for XR
            await renderer.xr.setSession(xrSession);

            // IMPORTANT: Set reference space for renderer to ensure stability
            // Prefer 'local-floor' for stable Y=0
            const refSpace = await xrSession.requestReferenceSpace('local-floor')
                .catch(() => xrSession.requestReferenceSpace('local'));
            renderer.xr.setReferenceSpace(refSpace);

            // Handle session end with proper cleanup
            const onEnd = () => {
                sessionRef.current = null;
                setSession(null);
                xrSession.removeEventListener('end', onEnd);
            };
            xrSession.addEventListener('end', onEnd);

            return xrSession;
        } catch (e: any) {
            const message = e?.message || 'Failed to start AR session';
            setError(message);
            throw e;
        }
    }, []);

    const endSession = useCallback(async () => {
        const xrSession = sessionRef.current;
        if (!xrSession) return;

        // Reset error state on clean exit
        setError(null);

        try {
            await xrSession.end();
        } catch (e) {
            console.warn('[useWebXRSession] endSession error:', e);
        }

        sessionRef.current = null;
        setSession(null);
    }, []);

    return {
        session,
        isSupported,
        error,
        checkSupport,
        startSession,
        endSession,
    };
}

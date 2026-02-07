/**
 * useWebXRSession — WebXR session lifecycle management
 * 
 * AURA PRODUCTION BASELINE v1.0
 * ================================
 * - requiredFeatures: [] — EMPTY для максимальной совместимости
 * - optionalFeatures: ['local-floor', 'hit-test', 'dom-overlay', 'light-estimation']
 * - Feature detection через try-catch на соответствующих API
 * - Cascading reference space: local-floor → local → viewer
 * - Fallback placement: 2м перед камерой если hit-test недоступен
 */

import { useCallback, useRef, useState } from 'react';
import * as THREE from 'three';

export type ARSupportReason =
    | 'supported'
    | 'no-webxr'
    | 'no-immersive-ar'
    | 'check-failed'
    | 'session-failed';

export type ReferenceSpaceType = 'local-floor' | 'local' | 'viewer';

interface UseWebXRSessionResult {
    session: XRSession | null;
    isSupported: boolean | null;
    supportReason: ARSupportReason | null;
    error: string | null;
    hasHitTest: boolean;
    hasDomOverlay: boolean;
    hasLightEstimation: boolean;
    referenceSpaceType: ReferenceSpaceType | null;

    checkSupport: () => Promise<{ supported: boolean; reason: ARSupportReason }>;
    startSession: (renderer: THREE.WebGLRenderer, overlayRoot: HTMLElement) => Promise<XRSession>;
    endSession: () => Promise<void>;
}

export function useWebXRSession(): UseWebXRSessionResult {
    const [session, setSession] = useState<XRSession | null>(null);
    const [isSupported, setIsSupported] = useState<boolean | null>(null);
    const [supportReason, setSupportReason] = useState<ARSupportReason | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasHitTest, setHasHitTest] = useState(false);
    const [hasDomOverlay, setHasDomOverlay] = useState(false);
    const [hasLightEstimation, setHasLightEstimation] = useState(false);
    const [referenceSpaceType, setReferenceSpaceType] = useState<ReferenceSpaceType | null>(null);

    const sessionRef = useRef<XRSession | null>(null);

    /**
     * Pre-check AR support BEFORE attempting to start session
     * This prevents the "configuration not supported" error
     */
    const checkSupport = useCallback(async (): Promise<{ supported: boolean; reason: ARSupportReason }> => {
        // 1. WebXR API exists?
        const xr = (navigator as any)?.xr;
        if (!xr || typeof xr.isSessionSupported !== 'function') {
            console.log('[AR] No WebXR API');
            setIsSupported(false);
            setSupportReason('no-webxr');
            return { supported: false, reason: 'no-webxr' };
        }

        // 2. immersive-ar supported?
        try {
            const supported = await xr.isSessionSupported('immersive-ar');
            if (!supported) {
                console.log('[AR] immersive-ar not supported');
                setIsSupported(false);
                setSupportReason('no-immersive-ar');
                return { supported: false, reason: 'no-immersive-ar' };
            }

            console.log('[AR] immersive-ar supported');
            setIsSupported(true);
            setSupportReason('supported');
            return { supported: true, reason: 'supported' };
        } catch (e) {
            console.error('[AR] checkSupport error:', e);
            setIsSupported(false);
            setSupportReason('check-failed');
            return { supported: false, reason: 'check-failed' };
        }
    }, []);

    /**
     * Start AR session with BASELINE configuration
     * 
     * CRITICAL: 
     * - requiredFeatures: ONLY 'local' (safest baseline)
     * - hit-test and dom-overlay are OPTIONAL
     */
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
            console.warn('[AR] Session already active');
            return sessionRef.current;
        }

        setError(null);
        setHasHitTest(false);
        setHasDomOverlay(false);
        setHasLightEstimation(false);
        setReferenceSpaceType(null);

        try {
            console.log('[AR] Requesting session with PRODUCTION BASELINE v1.0...');

            // ✅ AURA PRODUCTION BASELINE v1.0
            const sessionInit: XRSessionInit = {
                // REQUIRED: EMPTY — максимальная совместимость устройств
                requiredFeatures: [],

                // OPTIONAL: Всё опционально с graceful degradation
                optionalFeatures: [
                    'local-floor',       // Floor-relative coordinates
                    'hit-test',          // Surface placement
                    'dom-overlay',       // UI overlay
                    'light-estimation',  // Realistic lighting
                ],

                // DOM Overlay config
                ...(overlayRoot ? { domOverlay: { root: overlayRoot } } : {}),
            } as any;

            const xrSession = await xr.requestSession('immersive-ar', sessionInit);

            console.log('[AR] Session created successfully');

            sessionRef.current = xrSession;
            setSession(xrSession);

            // 1. Check what features are actually available
            const domOverlayState = (xrSession as any).domOverlayState;
            const overlayAvailable = domOverlayState?.type === 'screen';
            setHasDomOverlay(overlayAvailable);
            console.log('[AR] DOM Overlay:', overlayAvailable ? 'available' : 'not available');

            // 2. Reliable Hit-Test check (after session start)
            let hitTestAvailable = false;
            try {
                const viewerSpace = await xrSession.requestReferenceSpace('viewer');
                const hitTestSource = await (xrSession as any).requestHitTestSource({
                    space: viewerSpace,
                });
                if (hitTestSource) {
                    hitTestAvailable = true;
                    // We don't need this source yet, it's just a check. 
                    // Most devices won't allow keeping it if not used immediately in frame loop, 
                    // but we just need to know if the API works.
                    hitTestSource.cancel();
                }
            } catch (err) {
                console.log('[AR] Hit-test testing failed:', err);
                hitTestAvailable = false;
            }
            setHasHitTest(hitTestAvailable);
            console.log('[AR] Hit-test API:', hitTestAvailable ? 'available' : 'not available');

            // Setup renderer for XR
            await renderer.xr.setSession(xrSession);

            // Cascading reference space: local-floor → local → viewer
            let spaceType: ReferenceSpaceType = 'viewer';
            try {
                await xrSession.requestReferenceSpace('local-floor');
                spaceType = 'local-floor';
                console.log('[AR] Reference space: local-floor (ideal)');
            } catch {
                try {
                    await xrSession.requestReferenceSpace('local');
                    spaceType = 'local';
                    console.log('[AR] Reference space: local (no floor)');
                } catch {
                    await xrSession.requestReferenceSpace('viewer');
                    spaceType = 'viewer';
                    console.log('[AR] Reference space: viewer (fallback)');
                }
            }
            setReferenceSpaceType(spaceType);

            // 3. Light estimation check
            let lightEstimationAvailable = false;
            try {
                const lightProbe = await (xrSession as any).requestLightProbe();
                if (lightProbe) {
                    lightEstimationAvailable = true;
                }
            } catch {
                console.log('[AR] Light estimation: not available');
            }
            setHasLightEstimation(lightEstimationAvailable);
            console.log('[AR] Light estimation:', lightEstimationAvailable ? 'available' : 'not available');

            // Handle session end
            const onEnd = () => {
                console.log('[AR] Session ended');
                sessionRef.current = null;
                setSession(null);
                setHasHitTest(false);
                setHasDomOverlay(false);
                setHasLightEstimation(false);
                setReferenceSpaceType(null);
                xrSession.removeEventListener('end', onEnd);
            };
            xrSession.addEventListener('end', onEnd);

            return xrSession;
        } catch (e: any) {
            console.error('[AR] startSession error:', e);

            // Ensure loop is stopped if session failed
            renderer.setAnimationLoop(null);

            // Parse error for user-friendly message
            let message = 'Не удалось запустить AR';
            if (e?.message?.includes('not supported')) {
                message = 'AR не поддерживается на этом устройстве';
            } else if (e?.message?.includes('NotAllowedError')) {
                message = 'Доступ к камере заблокирован';
            }

            setError(message);
            setSupportReason('session-failed');
            throw new Error(message);
        }
    }, []);

    const endSession = useCallback(async () => {
        const xrSession = sessionRef.current;
        if (!xrSession) return;

        console.log('[AR] Ending session...');
        setError(null);

        try {
            await xrSession.end();
        } catch (e) {
            console.warn('[AR] endSession error (non-critical):', e);
        }

        sessionRef.current = null;
        setSession(null);
        setHasHitTest(false);
        setHasDomOverlay(false);
        setHasLightEstimation(false);
        setReferenceSpaceType(null);
    }, []);

    return {
        session,
        isSupported,
        supportReason,
        error,
        hasHitTest,
        hasDomOverlay,
        hasLightEstimation,
        referenceSpaceType,
        checkSupport,
        startSession,
        endSession,
    };
}

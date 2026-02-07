/**
 * useHitTest — WebXR hit-test management with graceful fallback
 * 
 * AURA BASELINE AR
 * ================
 * - hit-test is OPTIONAL (not all devices support it)
 * - If hit-test fails to setup → use fallback placement
 * - Fallback: 1.5m in front of camera, Y=0
 */

import { useCallback, useRef, useState } from 'react';
import * as THREE from 'three';

interface UseHitTestResult {
    /** CRITICAL: Pass the SHARED referenceSpace from useWebXRSession */
    setupHitTest: (session: XRSession, sharedReferenceSpace: XRReferenceSpace) => Promise<boolean>;
    updateReticle: (frame: XRFrame, reticle: THREE.Object3D) => boolean;
    getFallbackPosition: (camera: THREE.Camera) => THREE.Vector3;
    isHitTestAvailable: boolean;
    hasValidHit: boolean;
    cleanup: () => void;
}

export function useHitTest(): UseHitTestResult {
    const hitTestSourceRef = useRef<XRHitTestSource | null>(null);
    const referenceSpaceRef = useRef<XRReferenceSpace | null>(null);
    const [isHitTestAvailable, setIsHitTestAvailable] = useState(false);
    const hasValidHitRef = useRef(false);

    /**
     * Setup hit-test source
     * CRITICAL: Uses the SAME referenceSpace as the renderer for coordinate consistency
     * Returns TRUE if hit-test is available, FALSE if not (graceful fallback)
     */
    const setupHitTest = useCallback(async (
        session: XRSession,
        sharedReferenceSpace: XRReferenceSpace // PASSED FROM PARENT - DO NOT CREATE NEW
    ): Promise<boolean> => {
        // Check if hit-test is supported on this session
        if (!session.requestHitTestSource) {
            console.log('[HitTest] requestHitTestSource not available — using fallback');
            setIsHitTestAvailable(false);
            return false;
        }

        try {
            // CRITICAL: Use the SHARED reference space from parent, NOT a new one
            // This ensures hit-test coordinates match renderer coordinates
            referenceSpaceRef.current = sharedReferenceSpace;
            console.log('[HitTest] Using SHARED reference space from parent');

            // Get viewer space for hit-test ray origin
            const viewerSpace = await session.requestReferenceSpace('viewer');

            // Request hit-test source
            const hitTestSource = await session.requestHitTestSource!({ space: viewerSpace });

            if (!hitTestSource) {
                console.warn('[HitTest] Hit-test source is null — using fallback');
                setIsHitTestAvailable(false);
                return false;
            }

            hitTestSourceRef.current = hitTestSource;
            setIsHitTestAvailable(true);
            console.log('[HitTest] Hit-test source created with shared reference space');
            return true;
        } catch (e) {
            console.warn('[HitTest] Setup failed (non-critical) — using fallback:', e);
            setIsHitTestAvailable(false);
            return false;
        }
    }, []);

    /**
     * Update reticle position from hit-test results
     * Returns TRUE if valid hit found, FALSE otherwise
     */
    const updateReticle = useCallback((frame: XRFrame, reticle: THREE.Object3D): boolean => {
        const hitTestSource = hitTestSourceRef.current;
        const referenceSpace = referenceSpaceRef.current;

        // No hit-test available — hide reticle
        if (!hitTestSource || !referenceSpace) {
            reticle.visible = false;
            hasValidHitRef.current = false;
            return false;
        }

        try {
            const results = frame.getHitTestResults(hitTestSource);

            if (results.length > 0) {
                const pose = results[0].getPose(referenceSpace);
                if (pose) {
                    reticle.visible = true;
                    reticle.matrix.fromArray(pose.transform.matrix);
                    hasValidHitRef.current = true;
                    return true;
                }
            }
        } catch (e) {
            // Hit-test can fail mid-session on some devices
            console.warn('[HitTest] getHitTestResults error:', e);
        }

        reticle.visible = false;
        hasValidHitRef.current = false;
        return false;
    }, []);

    /**
     * Fallback placement position
     * Used when hit-test is not available or no valid hits found
     * 
     * Strategy: 1.5m in front of camera, on ground plane (Y=0)
     */
    const getFallbackPosition = useCallback((camera: THREE.Camera): THREE.Vector3 => {
        // Get camera forward direction
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);

        // Project onto horizontal plane (remove Y component)
        direction.y = 0;
        direction.normalize();

        // Place 1.5m in front of camera
        const position = camera.position.clone();
        position.addScaledVector(direction, 1.5);

        // Force Y=0 (ground level)
        position.y = 0;

        return position;
    }, []);

    /**
     * Cleanup hit-test resources
     */
    const cleanup = useCallback(() => {
        if (hitTestSourceRef.current) {
            try {
                hitTestSourceRef.current.cancel();
            } catch (e) {
                console.warn('[HitTest] cleanup error:', e);
            }
            hitTestSourceRef.current = null;
        }
        referenceSpaceRef.current = null;
        setIsHitTestAvailable(false);
        hasValidHitRef.current = false;
    }, []);

    return {
        setupHitTest,
        updateReticle,
        getFallbackPosition,
        isHitTestAvailable,
        hasValidHit: hasValidHitRef.current,
        cleanup,
    };
}

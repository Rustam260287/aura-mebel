/**
 * useHitTest — WebXR hit-test management
 */

import { useCallback, useRef } from 'react';
import * as THREE from 'three';

interface UseHitTestResult {
    setupHitTest: (session: XRSession) => Promise<void>;
    updateReticle: (frame: XRFrame, reticle: THREE.Object3D) => boolean;
    cleanup: () => void;
}

export function useHitTest(): UseHitTestResult {
    const hitTestSourceRef = useRef<XRHitTestSource | null>(null);
    const referenceSpaceRef = useRef<XRReferenceSpace | null>(null);

    const setupHitTest = useCallback(async (session: XRSession) => {
        try {
            // Get reference spaces
            // Prefer 'local-floor' for stable Y=0 on Android AR
            let localSpace: XRReferenceSpace;
            try {
                localSpace = await session.requestReferenceSpace('local-floor');
            } catch {
                localSpace = await session.requestReferenceSpace('local');
            }
            referenceSpaceRef.current = localSpace;

            const viewerSpace = await session.requestReferenceSpace('viewer');

            // Request hit-test source
            const hitTestSource = await session.requestHitTestSource!({ space: viewerSpace });
            hitTestSourceRef.current = hitTestSource || null;
        } catch (e) {
            console.error('[useHitTest] setup error:', e);
            throw e;
        }
    }, []);

    const updateReticle = useCallback((frame: XRFrame, reticle: THREE.Object3D): boolean => {
        const hitTestSource = hitTestSourceRef.current;
        const referenceSpace = referenceSpaceRef.current;

        if (!hitTestSource || !referenceSpace) {
            reticle.visible = false;
            return false;
        }

        const results = frame.getHitTestResults(hitTestSource);

        if (results.length > 0) {
            const pose = results[0].getPose(referenceSpace);
            if (pose) {
                reticle.visible = true;
                reticle.matrix.fromArray(pose.transform.matrix);
                return true;
            }
        }

        reticle.visible = false;
        return false;
    }, []);

    const cleanup = useCallback(() => {
        if (hitTestSourceRef.current) {
            hitTestSourceRef.current.cancel();
            hitTestSourceRef.current = null;
        }
        referenceSpaceRef.current = null;
    }, []);

    return {
        setupHitTest,
        updateReticle,
        cleanup,
    };
}

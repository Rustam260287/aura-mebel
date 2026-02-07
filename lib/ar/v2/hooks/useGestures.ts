/**
 * useGestures — Touch gesture handling for AR
 */

import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { GestureState, PlacedItem } from '../types';
import { MIN_USER_SCALE, MAX_USER_SCALE, MAX_DRAG_DISTANCE_M, MIN_PINCH_DISTANCE_PX } from '../constants';

interface UseGesturesOptions {
    overlayRef: React.RefObject<HTMLElement | null>;
    anchorRef: React.RefObject<THREE.Group | null>;
    itemsRef: React.RefObject<PlacedItem[]>;
    selectedKeyRef: React.RefObject<string | null>;
    cameraRef: React.RefObject<THREE.Camera | null>;
    rendererRef: React.RefObject<THREE.WebGLRenderer | null>;
    isActive: boolean;
    onSelect: (key: string | null) => void;
    onManipulationChange?: (isManipulating: boolean) => void;
    onGestureStart?: (action: 'drag' | 'scale' | 'rotate') => void;
}

interface UseGesturesResult {
    gestureRef: React.RefObject<GestureState>;
}

// Helpers
const distance2 = (a: Touch, b: Touch) =>
    Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

const angle2 = (a: Touch, b: Touch) =>
    Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX);

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

export function useGestures({
    overlayRef,
    anchorRef,
    itemsRef,
    selectedKeyRef,
    cameraRef,
    rendererRef,
    isActive,
    onSelect,
    onManipulationChange,
    onGestureStart,
}: UseGesturesOptions): UseGesturesResult {
    const gestureRef = useRef<GestureState>({ mode: 'none' });
    const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
    const raycasterRef = useRef(new THREE.Raycaster());
    const tmpVec = useRef(new THREE.Vector3());
    const tmpNdc = useRef(new THREE.Vector2());

    // Smooth interpolation for native-like feel
    // Target position is set immediately, actual position lerps towards it
    const targetPositionRef = useRef<THREE.Vector3 | null>(null);
    const LERP_FACTOR = 0.35; // Higher = more responsive, Lower = smoother (0.25-0.4 feels native)

    // Build ray from touch position
    const buildRay = useCallback((clientX: number, clientY: number): THREE.Raycaster | null => {
        const renderer = rendererRef.current;
        const camera = cameraRef.current;
        if (!renderer || !camera) return null;

        // For WebXR DOM Overlay, coordinates are relative to the viewport (window)
        // NOT the canvas element (which might be scaled/transformed by the XR compositor)
        const x = (clientX / window.innerWidth) * 2 - 1;
        const y = -(clientY / window.innerHeight) * 2 + 1;
        tmpNdc.current.set(x, y);

        // Always use reference camera for consistent raycasting
        // (Anchor is in world space, cameraRef is updated by WebXR manager implicitly or explicitly)
        raycasterRef.current.setFromCamera(tmpNdc.current, camera);
        return raycasterRef.current;
    }, [cameraRef, rendererRef]);

    // Pick item by raycast
    const pickItem = useCallback((clientX: number, clientY: number): string | null => {
        const raycaster = buildRay(clientX, clientY);
        const anchor = anchorRef.current;
        if (!raycaster || !anchor || !anchor.visible) return null;

        const intersects = raycaster.intersectObjects(anchor.children, true);
        for (const hit of intersects) {
            const key = (hit.object as any)?.userData?.itemKey as string | undefined;
            if (key) return key;
        }
        return null;
    }, [buildRay, anchorRef]);

    // Update plane to anchor position
    const updatePlane = useCallback(() => {
        const anchor = anchorRef.current;
        if (!anchor) return;
        anchor.getWorldPosition(tmpVec.current);
        planeRef.current.set(new THREE.Vector3(0, 1, 0), -tmpVec.current.y);
    }, [anchorRef]);

    // Touch handlers
    useEffect(() => {
        const overlay = overlayRef.current;
        if (!overlay) return;

        const onTouchStart = (e: TouchEvent) => {
            if (!isActive) return;
            if (e.touches.length === 0) return;
            e.preventDefault();

            if (e.touches.length === 1) {
                const t = e.touches[0];
                let key = pickItem(t.clientX, t.clientY);

                // Relaxed picking logic:
                // 1. If raycast missed but single object exists → select it
                // 2. If raycast missed but we already have a selection → keep it
                if (!key) {
                    if (itemsRef.current.length === 1) {
                        key = itemsRef.current[0].key;
                    } else if (selectedKeyRef.current) {
                        key = selectedKeyRef.current;
                    }
                }

                // Haptic feedback on new selection
                if (key && key !== selectedKeyRef.current && navigator.vibrate) {
                    navigator.vibrate(15);
                }

                onSelect(key);

                if (!key) {
                    gestureRef.current = { mode: 'none' };
                    return;
                }

                updatePlane();
                const raycaster = buildRay(t.clientX, t.clientY);
                if (!raycaster) return;

                const hit = tmpVec.current;
                if (!raycaster.ray.intersectPlane(planeRef.current, hit)) return;

                const anchor = anchorRef.current;
                if (!anchor) return;
                const local = anchor.worldToLocal(hit.clone());

                const item = itemsRef.current.find(i => i.key === key);
                if (!item) return;

                const offset = item.group.position.clone().sub(local);
                gestureRef.current = { mode: 'drag', pointerId: t.identifier, offsetLocal: offset };
                if (onManipulationChange) onManipulationChange(true);
                if (onGestureStart) onGestureStart('drag');
                return;
            }

            if (e.touches.length >= 2) {
                const [a, b] = [e.touches[0], e.touches[1]];
                let key = selectedKeyRef.current;

                // Auto-select for pinch
                if (!key && itemsRef.current.length === 1) {
                    key = itemsRef.current[0].key;
                    onSelect(key);
                }

                if (!key) return;
                const item = itemsRef.current.find(i => i.key === key);
                if (!item) return;

                gestureRef.current = {
                    mode: 'pinch',
                    startDistance: distance2(a, b),
                    startAngle: angle2(a, b),
                    startUserScale: item.userScale,
                    startRotationY: item.group.rotation.y,
                };
                if (onManipulationChange) onManipulationChange(true);
                // Heuristic: pinch is usually scale, but we track 'scale' as the generic "pinch" action
                if (onGestureStart) onGestureStart('scale');
            }
        };

        const onTouchMove = (e: TouchEvent) => {
            if (!isActive) return;
            if (e.touches.length === 0) return;
            e.preventDefault();

            const g = gestureRef.current;

            // Drag (1 finger)
            if (e.touches.length === 1 && g.mode === 'drag') {
                const t = e.touches[0];
                if (t.identifier !== g.pointerId) return;

                updatePlane();
                const raycaster = buildRay(t.clientX, t.clientY);
                if (!raycaster) return;

                const hit = tmpVec.current;
                if (!raycaster.ray.intersectPlane(planeRef.current, hit)) return;

                const anchor = anchorRef.current;
                if (!anchor) return;
                const local = anchor.worldToLocal(hit.clone());

                const key = selectedKeyRef.current;
                if (!key) return;
                const item = itemsRef.current.find(i => i.key === key);
                if (!item) return;

                const next = local.add(g.offsetLocal);

                // Clamp drag distance
                if (next.length() > MAX_DRAG_DISTANCE_M) {
                    next.setLength(MAX_DRAG_DISTANCE_M);
                }

                // Smooth interpolation for native-like feel
                // Use lerp instead of direct assignment
                const currentX = item.group.position.x;
                const currentZ = item.group.position.z;
                item.group.position.x = currentX + (next.x - currentX) * LERP_FACTOR;
                item.group.position.z = currentZ + (next.z - currentZ) * LERP_FACTOR;
                return;
            }

            // Pinch (2 fingers)
            if (e.touches.length >= 2 && g.mode === 'pinch') {
                const [a, b] = [e.touches[0], e.touches[1]];
                const key = selectedKeyRef.current;
                if (!key) return;
                const item = itemsRef.current.find(i => i.key === key);
                if (!item) return;

                const dist = distance2(a, b);
                if (dist < MIN_PINCH_DISTANCE_PX) return;

                // Smooth scale with lerp for native feel
                const scaleFactor = g.startDistance > 0 ? dist / g.startDistance : 1;
                const targetUserScale = clamp(g.startUserScale * scaleFactor, MIN_USER_SCALE, MAX_USER_SCALE);

                // Lerp scale for smooth feel
                const currentScale = item.userScale;
                const smoothedScale = currentScale + (targetUserScale - currentScale) * LERP_FACTOR;
                item.userScale = smoothedScale;
                item.group.scale.setScalar(item.baseScale * item.userScale);

                // Rotation with Magnetic Snap (45 deg)
                const ang = angle2(a, b);
                const delta = ang - g.startAngle;
                let rawRotation = g.startRotationY - delta;

                // Magnetic Snap with haptic feedback
                const SNAP_ANGLE = Math.PI / 4; // 45 degrees
                const SNAP_THRESHOLD = Math.PI / 24; // ~7.5 degrees

                // Find closest snap point
                const snapTarget = Math.round(rawRotation / SNAP_ANGLE) * SNAP_ANGLE;
                const distToSnap = Math.abs(rawRotation - snapTarget);

                let targetRotation: number;
                if (distToSnap < SNAP_THRESHOLD) {
                    targetRotation = snapTarget;
                    // Haptic on snap (only when just snapped)
                    const wasSnapped = Math.abs(item.group.rotation.y - snapTarget) < 0.01;
                    if (!wasSnapped && navigator.vibrate) {
                        navigator.vibrate(10); // Very short tick
                    }
                } else {
                    targetRotation = rawRotation;
                }

                // Smooth rotation lerp
                const currentRot = item.group.rotation.y;
                item.group.rotation.y = currentRot + (targetRotation - currentRot) * LERP_FACTOR;
            }
        };

        const endGesture = (e: TouchEvent) => {
            // Only reset gesture if ALL fingers are lifted.
            if (e.touches.length === 0) {
                const wasManipulating = gestureRef.current.mode !== 'none';
                gestureRef.current = { mode: 'none' };
                if (wasManipulating && onManipulationChange) {
                    onManipulationChange(false);
                }
            }
        };

        overlay.addEventListener('touchstart', onTouchStart, { passive: false });
        overlay.addEventListener('touchmove', onTouchMove, { passive: false });
        overlay.addEventListener('touchend', endGesture, { passive: true });
        overlay.addEventListener('touchcancel', endGesture, { passive: true });

        return () => {
            overlay.removeEventListener('touchstart', onTouchStart as any);
            overlay.removeEventListener('touchmove', onTouchMove as any);
            overlay.removeEventListener('touchend', endGesture as any);
            overlay.removeEventListener('touchcancel', endGesture as any);
        };
    }, [
        overlayRef,
        isActive,
        pickItem,
        buildRay,
        updatePlane,
        onSelect,
        anchorRef,
        itemsRef,
        selectedKeyRef,
    ]);

    return { gestureRef };
}

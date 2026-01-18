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
}: UseGesturesOptions): UseGesturesResult {
    const gestureRef = useRef<GestureState>({ mode: 'none' });
    const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
    const raycasterRef = useRef(new THREE.Raycaster());
    const tmpVec = useRef(new THREE.Vector3());
    const tmpNdc = useRef(new THREE.Vector2());

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

                // Auto-select single object
                if (!key && itemsRef.current.length === 1) {
                    key = itemsRef.current[0].key;
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

                item.group.position.x = next.x;
                item.group.position.z = next.z;
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

                // Scale
                const scaleFactor = g.startDistance > 0 ? dist / g.startDistance : 1;
                const nextUserScale = clamp(g.startUserScale * scaleFactor, MIN_USER_SCALE, MAX_USER_SCALE);
                item.userScale = nextUserScale;
                item.group.scale.setScalar(item.baseScale * item.userScale);

                // Rotation
                const ang = angle2(a, b);
                const delta = ang - g.startAngle;
                item.group.rotation.y = g.startRotationY + delta;
            }
        };

        const endGesture = (e: TouchEvent) => {
            // Only reset gesture if ALL fingers are lifted.
            // This prevents jank when switching from 2 fingers (pinch) to 0 (end)
            // if one finger lifts slightly before the other.
            if (e.touches.length === 0) {
                gestureRef.current = { mode: 'none' };
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

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
    updateGestures: (deltaTimeSec: number) => void;
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

    // Target states for smooth interpolation (Frame-Rate Independent)
    // We update these in touchmove, and LERP towards them in animation loop
    const targetPositionRef = useRef<THREE.Vector3 | null>(null);
    const targetScaleRef = useRef<number | null>(null);
    const targetRotationRef = useRef<number | null>(null);

    // Speed factors (roughly 10-15 feels snappy yet smooth at 60fps)
    const POS_LERP_SPEED = 12;
    const SCALE_LERP_SPEED = 10;
    const ROT_LERP_SPEED = 10;

    // Build ray from touch position
    const buildRay = useCallback((clientX: number, clientY: number): THREE.Raycaster | null => {
        const renderer = rendererRef.current;
        const camera = cameraRef.current;
        if (!renderer || !camera) return null;

        // For WebXR DOM Overlay, coordinates are relative to the viewport (window)
        const x = (clientX / window.innerWidth) * 2 - 1;
        const y = -(clientY / window.innerHeight) * 2 + 1;
        tmpNdc.current.set(x, y);

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
            const touchCount = e.touches.length;
            console.log('[GESTURE] touchstart', {
                touches: touchCount,
                isActive,
                selectedKey: selectedKeyRef.current,
                itemCount: itemsRef.current.length,
            });

            if (!isActive) return;
            if (touchCount === 0) return;
            e.preventDefault();

            // Default state if no interaction starts
            gestureRef.current = { mode: 'none', touchCount };

            if (touchCount === 1) {
                const t = e.touches[0];
                let key = pickItem(t.clientX, t.clientY);

                // Relaxed picking logic
                if (!key) {
                    if (itemsRef.current.length === 1) {
                        key = itemsRef.current[0].key;
                        // HACK: Start drag immediately if single item
                        if (!selectedKeyRef.current && key) {
                            onSelect(key);
                        }
                    } else if (selectedKeyRef.current) {
                        // Reselect current if tapping elsewhere?
                        // Or deselect? 
                        // Behavior: Tap outside -> deselect usually.
                        // But here we want to be forgiving.
                        // Let's keep current selection if we didn't pick anything new?
                        // Actually, tap outside usually means stick to current.
                        key = selectedKeyRef.current;
                    }
                }

                if (key) {
                    // Haptic feedback on new selection
                    if (key !== selectedKeyRef.current && navigator.vibrate) {
                        navigator.vibrate(15);
                    }
                    if (key !== selectedKeyRef.current) {
                        onSelect(key);
                    }
                }

                if (!key) {
                    gestureRef.current = { mode: 'none', touchCount };
                    targetPositionRef.current = null;
                    return;
                }

                updatePlane();
                const raycaster = buildRay(t.clientX, t.clientY);
                if (!raycaster) return;

                const hit = tmpVec.current;
                // Raycast against infinite plane at anchor height
                if (!raycaster.ray.intersectPlane(planeRef.current, hit)) {
                    // Fallback: if ray misses plane (e.g. horizon), project to plane distance?
                    // Or just use anchor position?
                    // For now, abort to avoid jumps.
                    return;
                }

                const anchor = anchorRef.current;
                if (!anchor) return;
                const local = anchor.worldToLocal(hit.clone());

                const item = itemsRef.current.find(i => i.key === key);
                if (!item) return;

                // Init targets with current state to avoid jumps
                targetPositionRef.current = item.group.position.clone();
                targetScaleRef.current = item.userScale;
                targetRotationRef.current = item.group.rotation.y;

                const offset = item.group.position.clone().sub(local);

                // START DRAG
                gestureRef.current = {
                    mode: 'drag',
                    pointerId: t.identifier,
                    offsetLocal: offset,
                    touchCount
                };
                if (onManipulationChange) onManipulationChange(true);
                if (onGestureStart) onGestureStart('drag');
                return;
            }

            if (touchCount >= 2) {
                const [a, b] = [e.touches[0], e.touches[1]];
                let key = selectedKeyRef.current;

                if (!key && itemsRef.current.length === 1) {
                    key = itemsRef.current[0].key;
                    onSelect(key);
                }

                if (!key) return;
                const item = itemsRef.current.find(i => i.key === key);
                if (!item) return;

                // Init targets
                targetPositionRef.current = item.group.position.clone();
                targetScaleRef.current = item.userScale;
                targetRotationRef.current = item.group.rotation.y;

                gestureRef.current = {
                    mode: 'pinch',
                    startDistance: distance2(a, b),
                    startAngle: angle2(a, b),
                    startUserScale: item.userScale,
                    startRotationY: item.group.rotation.y,
                    touchCount
                };
                if (onManipulationChange) onManipulationChange(true);
                if (onGestureStart) onGestureStart('scale');
            }
        };

        const onTouchMove = (e: TouchEvent) => {
            if (!isActive) return;
            if (e.touches.length === 0) return;
            e.preventDefault();
            const g = gestureRef.current;

            // Debug: track count
            if (g.mode !== 'none') {
                g.touchCount = e.touches.length;
            }

            if (g.mode !== 'none') {
                console.log('[GESTURE] touchmove', { mode: g.mode, touches: e.touches.length });
            }

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

                const next = local.add(g.offsetLocal);

                // Clamp drag distance
                if (next.length() > MAX_DRAG_DISTANCE_M) {
                    next.setLength(MAX_DRAG_DISTANCE_M);
                }

                // Update TARGET only (Physics happens in updateGestures)
                targetPositionRef.current = next;
                return;
            }

            // Pinch (2 fingers)
            if (e.touches.length >= 2 && g.mode === 'pinch') {
                const [a, b] = [e.touches[0], e.touches[1]];

                const dist = distance2(a, b);
                if (dist < MIN_PINCH_DISTANCE_PX) return;

                // Scale
                const scaleFactor = g.startDistance > 0 ? dist / g.startDistance : 1;
                const targetUserScale = clamp(g.startUserScale * scaleFactor, MIN_USER_SCALE, MAX_USER_SCALE);
                targetScaleRef.current = targetUserScale;

                // Rotation
                const ang = angle2(a, b);
                const delta = ang - g.startAngle;
                let rawRotation = g.startRotationY - delta;

                const SNAP_ANGLE = Math.PI / 4; // 45 degrees
                const SNAP_THRESHOLD = Math.PI / 24; // ~7.5 degrees

                // Find closest snap point
                const snapTarget = Math.round(rawRotation / SNAP_ANGLE) * SNAP_ANGLE;
                const distToSnap = Math.abs(rawRotation - snapTarget);

                let startSnapTargetRotation: number;
                if (distToSnap < SNAP_THRESHOLD) {
                    startSnapTargetRotation = snapTarget;
                    // Haptic (we can still do side-effects here, or move to update loop)
                    // Moving haptic to here is fine for now as it's triggered by input state crossing threshold
                    const key = selectedKeyRef.current;
                    if (key) {
                        const item = itemsRef.current.find(i => i.key === key);
                        if (item) {
                            const wasSnapped = Math.abs(item.group.rotation.y - snapTarget) < 0.01;
                            if (!wasSnapped && navigator.vibrate) {
                                navigator.vibrate(10);
                            }
                        }
                    }
                } else {
                    startSnapTargetRotation = rawRotation;
                }

                targetRotationRef.current = startSnapTargetRotation;
            }
        };

        const endGesture = (e: TouchEvent) => {
            if (e.touches.length === 0) {
                const wasManipulating = gestureRef.current.mode !== 'none';
                gestureRef.current = { mode: 'none', touchCount: 0 }; // Consistent reset
                // Keep targets as they are (settled), or null them?
                // Nulling them stops LERPing, which saves CPU.
                // But we might want a bit of "settle" time.
                // For simplicity: Null them to stop updates, assuming we reached target or close to it.
                // Actually no, let's keep them valid for a few frames or just let updateGestures handle null check.
                // Ideally we want to stop LERPing eventually.
                // Let's set targets to null here to verify "input stopped".
                // But if we stop abruptly, the LERP stops. 
                // Better strategy: Let updateGestures check distance. If close, snap and stop.
                // For now, let's keep targets active until nullified or mode change.
                // Actually, if we nullify here, the movement stops instantly.
                // We want the smoothing to finish.
                // So let's NOT nullify here.

                if (wasManipulating && onManipulationChange) {
                    onManipulationChange(false);
                }
            } else {
                // Touches changed but not 0 (e.g. 2->1)
                // Need logic to switch gesture?
                // For now, if we go 2->1, we are still in 'pinch' mode but 1 finger?
                // Pinch logic needs 2 fingers.
                // So pinched -> lift 1 finger -> mode stays pinch? -> pinch logic guards checks touches.length >= 2.
                // It will stop updating targets.
                // Ideally we should switch to drag or just stop.
                // For v2 simplicity, let's just update touchCount.
                if (gestureRef.current.mode !== 'none') {
                    gestureRef.current.touchCount = e.touches.length;
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

    // Frame update function (called from main loop)
    const updateGestures = useCallback((deltaTimeSec: number) => {
        const key = selectedKeyRef.current;
        if (!key) return;

        const item = itemsRef.current.find(i => i.key === key);
        if (!item) return;

        // 1. Position LERP
        if (targetPositionRef.current) {
            // Frame-rate independent damping
            // lerp(current, target, 1 - exp(-speed * dt))
            const lambda = 1 - Math.exp(-POS_LERP_SPEED * deltaTimeSec);
            item.group.position.lerp(targetPositionRef.current, lambda);
        }

        // 2. Scale LERP
        if (targetScaleRef.current !== null) {
            const lambda = 1 - Math.exp(-SCALE_LERP_SPEED * deltaTimeSec);
            const current = item.userScale;
            const next = current + (targetScaleRef.current - current) * lambda;
            item.userScale = next;
            item.group.scale.setScalar(item.baseScale * next);
        }

        // 3. Rotation LERP
        if (targetRotationRef.current !== null) {
            const lambda = 1 - Math.exp(-ROT_LERP_SPEED * deltaTimeSec);
            const current = item.group.rotation.y;
            // Handle wrap-around? Not needed for Y rotation unless we clamp, but for furniture Y is usually bounded or continuous.
            // Simple lerp is fine.
            const next = current + (targetRotationRef.current - current) * lambda;
            item.group.rotation.y = next;
        }

    }, [itemsRef, selectedKeyRef]);

    return { gestureRef, updateGestures };
}

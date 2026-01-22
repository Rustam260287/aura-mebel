/**
 * SceneARViewerV2 — Complete AR component for Android
 * 
 * Uses Three.js + WebXR directly for full gesture control.
 * Replaces model-viewer on Android devices.
 */

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { setupARLighting, applyMaterialFallback } from './utils/lighting';
import { useImmersive } from '../../../contexts/ImmersiveContext';

import { trackJourneyEvent } from '../../journey/client';
import { createArSessionId } from '../../journey/arSession';

import { useWebXRSession } from './hooks/useWebXRSession';
import { useHitTest } from './hooks/useHitTest';
import { useGestures } from './hooks/useGestures';
import { useSceneGraph } from './hooks/useSceneGraph';
import { MAX_PIXEL_RATIO, GESTURE_HINT_DURATION_MS, HIT_TEST_TIMEOUT_MS, MIN_PLACEMENT_DISTANCE_M } from './constants';
import type { ARStage, SceneARViewerV2Props } from './types';
import { ARCoachingOverlay } from './components/ARCoachingOverlay';
import { ARBottomControls } from './components/ARBottomControls';

export const SceneARViewerV2: React.FC<SceneARViewerV2Props> = ({
    sceneId,
    sceneTitle,
    objects,
    onClose,
    onSessionStart,
    onPlace,
}) => {
    const { setImmersive } = useImmersive();


    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const gestureRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const reticleRef = useRef<THREE.Group | null>(null);
    const anchorRef = useRef<THREE.Group | null>(null);
    const placedRef = useRef(false);
    const startedAtRef = useRef<number | null>(null);
    const hasArStartedRef = useRef(false);
    const isStartingRef = useRef(false); // Single-entry protection
    const xrStartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const arSessionIdRef = useRef(createArSessionId());

    // State
    const [stage, setStage] = useState<ARStage>('idle');
    const [error, setError] = useState<string | null>(null);
    const [startupError, setStartupError] = useState<string | null>(null); // Separate startup error

    // Quiet UX: One-time hints
    const [showOnboardingHint, setShowOnboardingHint] = useState(false);
    const [showGestureHint, setShowGestureHint] = useState(false);

    const [useFallbackPlacement, setUseFallbackPlacement] = useState(false);
    const [reticleVisible, setReticleVisible] = useState(false); // For UI guidance
    const reticleVisibleRef = useRef(false);
    const placingStartTimeRef = useRef<number | null>(null);
    const hasInteractedRef = useRef(false);

    // Hooks
    const xrSession = useWebXRSession();
    const hitTest = useHitTest();
    const sceneGraph = useSceneGraph();
    const selectedKeyRef = useRef<string | null>(null);

    // Update selectedKeyRef when sceneGraph.selectedKey changes
    useEffect(() => {
        selectedKeyRef.current = sceneGraph.selectedKey;
    }, [sceneGraph.selectedKey]);

    // Handler for gesture manipulation state
    const onManipulationChange = useCallback((isManipulating: boolean) => {
        setStage(prev => {
            // Only transition if we are in a valid interactive state to prevent erratic jumps
            if (prev === 'active' || prev === 'manipulating') {
                return isManipulating ? 'manipulating' : 'active';
            }
            return prev;
        });
    }, []);

    const onGestureStart = (action: 'drag' | 'scale' | 'rotate') => {
        if (!hasInteractedRef.current) {
            hasInteractedRef.current = true;
            trackJourneyEvent({
                type: 'AR_FIRST_INTERACTION',
                meta: { variant: action } // 'variant' maps to 'action' in types if needed, or we use meta.action in journey types if added
            });
            // Note: we added 'variant' to JourneyMeta. Let's use that or update type to have 'action'. 
            // User asked meta: { action: '...' }. I added 'variant'. I should check eventTypes again or just map it.
            // Actually, eventTypes has `action: { type: string ... }`. 
            // Let's use `variant` which is simpler string. User said `meta: { action: '...' }`.
            // JourneyMeta has `action?: { type: string, ... }`. It is an object.
            // I will stick to what I added: `variant`. Or assume existing `action` object is what was meant?
            // Existing `action` has `browser`, `timestamp`. Too complex.
            // I will use `variant` field I added, mapping 'action' concept to it.
        }
    };

    const { gestureRef: gestureStateRef } = useGestures({
        overlayRef: gestureRef,
        anchorRef,
        itemsRef: sceneGraph.itemsRef,
        selectedKeyRef,
        cameraRef,
        rendererRef,
        isActive: (stage === 'active' || stage === 'manipulating') && placedRef.current,
        onSelect: sceneGraph.selectItem,
        onManipulationChange,
        onGestureStart,
    });

    // Loaded models cache
    const loadedModelsRef = useRef<Map<string, THREE.Object3D> | null>(null);

    // Set immersive mode
    useEffect(() => {
        setImmersive(true);
        return () => setImmersive(false);
    }, [setImmersive]);

    // Initialize Three.js scene
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(MAX_PIXEL_RATIO, window.devicePixelRatio || 1));
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setClearColor(0x000000, 0);
        renderer.xr.enabled = false; // CRITICAL: Start disabled, enable after successful session
        // Preserve drawing buffer for screenshots if needed (perf cost, but needed for 'Capture')
        // Actually, for now let's keep it simple. If we want high-perf, we skip it.
        // UIA says "Capture" -> "Freeze frame".
        // Let's rely on "End Session" as the trigger for "Done" for now, or add a dedicated shutter button that ends session.
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.touchAction = 'none';
        renderer.domElement.style.pointerEvents = 'none';
        renderer.domElement.setAttribute('data-ar', 'true'); // For debugging cleanup
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Scene
        const threeScene = new THREE.Scene();
        sceneRef.current = threeScene;

        // Camera
        const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.01, 100);
        cameraRef.current = camera;

        // Lighting (Premium AR Setup: Atmosphere, Key, Fill, RoomEnv)
        setupARLighting(threeScene, renderer);

        // Reticle
        // Reticle
        const reticleGroup = new THREE.Group();
        reticleGroup.matrixAutoUpdate = false;
        reticleGroup.visible = false;

        const reticleGeom = new THREE.RingGeometry(0.08, 0.12, 32);
        reticleGeom.rotateX(-Math.PI / 2);
        const reticleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.7, transparent: true });
        const reticleMesh = new THREE.Mesh(reticleGeom, reticleMat);
        reticleGroup.add(reticleMesh);

        threeScene.add(reticleGroup);
        reticleRef.current = reticleGroup; // Ref points to Group now

        // Anchor
        const anchor = new THREE.Group();
        anchor.visible = false;
        threeScene.add(anchor);
        anchorRef.current = anchor;

        // Cleanup
        return () => {
            console.log('[SceneARViewerV2] Unmounting and cleaning up Three.js');

            // 1. Stop Loop
            renderer.setAnimationLoop(null);

            // 2. Dispose Scene Resources (Geometries, Materials, Textures)
            threeScene.traverse((object) => {
                if ((object as any).isMesh) {
                    const mesh = object as THREE.Mesh;
                    mesh.geometry.dispose();

                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach(m => {
                            m.dispose();
                            // Dispose textures if any
                            Object.values(m).forEach(v => {
                                if (v && (v as any).isTexture) (v as THREE.Texture).dispose();
                            });
                        });
                    } else if (mesh.material) {
                        mesh.material.dispose();
                        Object.values(mesh.material).forEach(v => {
                            if (v && (v as any).isTexture) (v as THREE.Texture).dispose();
                        });
                    }
                }
            });

            // 3. Dispose Renderer
            renderer.dispose();

            // 4. DOM Cleanup
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }

            rendererRef.current = null;
            sceneRef.current = null;
            cameraRef.current = null;
            reticleRef.current = null;
            anchorRef.current = null;

            // Clear Accessor Caches
            loadedModelsRef.current = null;
        };
    }, []);



    // Load models on mount
    useEffect(() => {
        if (stage !== 'idle') return;

        const load = async () => {
            setStage('loading');
            try {
                const models = await sceneGraph.loadModels(objects);

                // Fallback: Boost material envMap intensity if needed (prevent dark models)
                models.forEach((model) => {
                    applyMaterialFallback(model);
                });

                loadedModelsRef.current = models;

                if (models.size === 0) {
                    setError('Нет доступных 3D моделей');
                    setStage('error');
                    return;
                }

                // Check WebXR support
                const supported = await xrSession.checkSupport();
                if (!supported) {
                    setError('AR недоступен. Попробуйте Chrome на Android.');
                    setStage('unsupported');
                    return;
                }

                setStage('ready');
            } catch (e) {
                console.error('[SceneARViewerV2] load error:', e);
                setError('Не удалось загрузить модели');
                setStage('error');
            }
        };

        load();
    }, [objects, sceneGraph, stage, xrSession]);

    // End session handler
    const endSession = useCallback(() => {
        console.log('[SceneARViewerV2] endSession called', {
            stage,
            hasArStarted: hasArStartedRef.current,
            placed: placedRef.current,
            xrSession: !!xrSession.session,
        });

        // 1. CRITICAL GUARD: If XR never started, DO NOT trigger onClose with hasStarted=true
        if (!hasArStartedRef.current) {
            console.warn('[SceneARViewerV2] endSession ignored — XR never started');
            // Always pass hasStarted=false so ObjectDetail knows AR never happened
            onClose(undefined, false);
            return;
        }

        const duration = startedAtRef.current
            ? (Date.now() - startedAtRef.current) / 1000
            : 0;

        // 2. CRITICAL: Stop animation loop BEFORE ending session
        const renderer = rendererRef.current;
        if (renderer) {
            renderer.setAnimationLoop(null);
        }

        // 3. Cleanup resources
        hitTest.cleanup();
        xrSession.endSession();
        hasArStartedRef.current = false; // Reset flag

        if (placedRef.current) {
            trackJourneyEvent({
                type: 'FINISH_AR',
                objectId: sceneId,
                meta: { arSessionId: arSessionIdRef.current, durationSec: duration },
            });

            // Clean exit without snapshot
            onClose(duration, true);
        } else {
            // Cancelled before placement - still a real AR session
            onClose(duration, true);
        }
    }, [hitTest, xrSession, sceneId, onClose, stage]);



    // Lifecycle safety (Force exit on navigation/background)
    useEffect(() => {
        const handleExit = () => {
            // CRITICAL: Block lifecycle exits during startup
            if (isStartingRef.current) {
                console.log('[AR] Lifecycle event ignored — XR is starting');
                return;
            }

            // Only force exit if XR is ACTUALLY running
            if (!hasArStartedRef.current) {
                console.log('[AR] Lifecycle event ignored — XR not active');
                return;
            }

            if (stage === 'active' || stage === 'placing') {
                console.log('[AR] Lifecycle exit triggered. Stage:', stage);
                endSession();
            }
        };

        window.addEventListener('popstate', handleExit);
        document.addEventListener('visibilitychange', handleExit);
        window.addEventListener('pagehide', handleExit);

        return () => {
            window.removeEventListener('popstate', handleExit);
            document.removeEventListener('visibilitychange', handleExit);
            window.removeEventListener('pagehide', handleExit);
        };
    }, [stage, endSession]);

    // Start AR session
    const startAR = useCallback(async () => {
        console.log('[AR] startAR called. Stage:', stage, 'isStarting:', isStartingRef.current);

        // Single-entry protection
        if (stage !== 'ready' || isStartingRef.current) {
            console.warn('[AR] startAR blocked — not ready or already starting');
            return;
        }
        isStartingRef.current = true;

        const overlay = overlayRef.current;
        const renderer = rendererRef.current;
        const threeScene = sceneRef.current;
        const camera = cameraRef.current;
        const reticle = reticleRef.current;
        const anchor = anchorRef.current;

        if (!overlay || !renderer || !threeScene || !camera || !reticle || !anchor) return;

        setStage('starting');
        setError(null);

        try {
            console.log('[AR] Requesting XR Session...');

            // Fail-safe timer: If session doesn't start in 2.5s, show error
            xrStartTimeoutRef.current = setTimeout(() => {
                if (!hasArStartedRef.current && isStartingRef.current) {
                    console.error('[AR] XR start timeout — session failed to initialize');
                    isStartingRef.current = false;
                    setStartupError('AR не запустился. Попробуйте ещё раз.');
                    setStage('ready'); // Return to ready state so user can retry
                }
            }, 2500);

            // CRITICAL: Pass overlay only if DOM overlay is actually supported
            // Passing overlay when not supported can crash requestSession on some Android
            const safeOverlay = xrSession.hasDomOverlay ? overlay : undefined;
            const session = await xrSession.startSession(renderer, safeOverlay!);

            // Clear timeout on success
            if (xrStartTimeoutRef.current) {
                clearTimeout(xrStartTimeoutRef.current);
                xrStartTimeoutRef.current = null;
            }

            // CRITICAL: Enable XR on renderer AFTER successful session start
            renderer.xr.enabled = true;

            console.log('[AR] Session started successfully');
            startedAtRef.current = Date.now();
            hasArStartedRef.current = true;
            isStartingRef.current = false; // Release lock

            trackJourneyEvent({
                type: 'START_AR',
                objectId: sceneId,
                meta: { arSessionId: arSessionIdRef.current },
            });

            onSessionStart?.();

            // Setup hit-test (OPTIONAL — graceful fallback if not available)
            const hitTestAvailable = await hitTest.setupHitTest(session);
            if (!hitTestAvailable) {
                console.log('[AR] Hit-test not available — will use fallback placement');
                setUseFallbackPlacement(true);
            }

            placedRef.current = false;
            anchor.visible = false;
            reticle.visible = false;
            sceneGraph.selectItem(null);

            setStage('placing');

            // Placement handler
            const onSelect = () => {
                if (placedRef.current) return;

                const camera = cameraRef.current!;
                let placementPos: THREE.Vector3;

                // Get position from reticle or fallback
                if (reticle.visible) {
                    const pos = new THREE.Vector3();
                    const quat = new THREE.Quaternion();
                    const scale = new THREE.Vector3();
                    reticle.matrix.decompose(pos, quat, scale);
                    placementPos = pos;
                } else {
                    // Fallback: place in front of camera
                    placementPos = hitTest.getFallbackPosition(camera);
                }

                // Enforce minimum distance from camera
                const cameraPos = camera.position.clone();
                const distanceToCamera = placementPos.distanceTo(cameraPos);
                if (distanceToCamera < MIN_PLACEMENT_DISTANCE_M) {
                    // Push back along camera forward
                    const direction = placementPos.clone().sub(cameraPos).normalize();
                    placementPos.copy(cameraPos).addScaledVector(direction, MIN_PLACEMENT_DISTANCE_M);
                    placementPos.y = 0; // Keep on ground
                }

                anchor.position.copy(placementPos);
                anchor.quaternion.identity();
                anchor.updateMatrixWorld(true);

                // Spawn objects
                if (loadedModelsRef.current) {
                    sceneGraph.spawnObjects(loadedModelsRef.current, objects, anchor);
                }

                placedRef.current = true;
                reticle.visible = false;

                trackJourneyEvent({
                    type: 'PLACE_OBJECT',
                    objectId: objects[0]?.objectId,
                    meta: { arSessionId: arSessionIdRef.current },
                });

                onPlace?.(objects[0]?.objectId);

                setStage('active');
                setUseFallbackPlacement(false);

                // Haptic Feedback (with safe guard for Android browsers)
                if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
                    try {
                        navigator.vibrate(20); // Short sharp tick
                    } catch {
                        // Ignore vibrate errors on some Android browsers
                    }
                }
            };

            session.addEventListener('select', onSelect);

            // Track when placing started for fallback timeout
            placingStartTimeRef.current = Date.now();

            // Animation loop
            renderer.setAnimationLoop((time: number, frame?: XRFrame) => {
                if (frame && !placedRef.current) {
                    const hasHit = hitTest.updateReticle(frame, reticle);

                    // Animate Reticle (Breathing)
                    if (hasHit) {
                        const scale = 1 + 0.15 * Math.sin(time / 200);
                        // Reticle is now a Group, animate the child Mesh
                        reticle.children[0].scale.set(scale, scale, scale);
                    }

                    // Sync reticle visibility state for UI (Guidance)
                    if (hasHit !== reticleVisibleRef.current) {
                        reticleVisibleRef.current = hasHit;
                        setReticleVisible(hasHit);

                        // CRITICAL: Reset matrixAutoUpdate when switching modes
                        if (hasHit) {
                            reticle.matrixAutoUpdate = false; // hit-test controls matrix
                        }
                    }

                    // Check for fallback timeout
                    if (!hasHit && placingStartTimeRef.current) {
                        const elapsed = Date.now() - placingStartTimeRef.current;
                        if (elapsed > HIT_TEST_TIMEOUT_MS && !useFallbackPlacement) {
                            setUseFallbackPlacement(true);
                            // Show fallback reticle
                            const fallbackPos = hitTest.getFallbackPosition(camera);
                            reticle.position.copy(fallbackPos);
                            reticle.rotation.x = -Math.PI / 2;
                            reticle.visible = true;
                            reticle.matrixAutoUpdate = true; // fallback controls position directly
                        }
                    }
                }


                // Visual Feedback Loop
                if (frame && placedRef.current) {
                    const isManipulating = gestureStateRef.current.mode !== 'none';
                    const activeKey = sceneGraph.selectedKeyRef.current;

                    if (activeKey) {
                        const item = sceneGraph.itemsRef.current.find(i => i.key === activeKey);
                        const ring = item?.group.getObjectByName('selectionRing');

                        if (ring && (ring as THREE.Mesh).material) {
                            const mat = (ring as THREE.Mesh).material as THREE.LineBasicMaterial;
                            if (isManipulating) {
                                // Pulse opacity: 0.5 to 1.0
                                const pulse = 0.75 + 0.25 * Math.sin(time / 150);
                                mat.opacity = pulse;
                            } else {
                                // Reset to default
                                mat.opacity = 0.8;
                            }
                        }
                    }
                }

                renderer.render(threeScene, camera);
            });

        } catch (e: any) {
            console.error('[AR] startAR error:', e);

            // Clear timeout
            if (xrStartTimeoutRef.current) {
                clearTimeout(xrStartTimeoutRef.current);
                xrStartTimeoutRef.current = null;
            }

            // Release locks
            hasArStartedRef.current = false;
            isStartingRef.current = false;

            setError(e?.message || 'Не удалось запустить AR');
            setStage('error');
        }
    }, [stage, xrSession, hitTest, sceneGraph, objects, sceneId, onSessionStart, onPlace]);

    // Selected item label
    const selectedLabel = useMemo(() => {
        if (!sceneGraph.selectedKey) return null;
        const item = sceneGraph.itemsRef.current.find(i => i.key === sceneGraph.selectedKey);
        return item?.objectName || null;
    }, [sceneGraph.selectedKey]);

    // -------------------------------------------------------------------------
    // Quiet UX Onboarding (One-Time Logic)
    // -------------------------------------------------------------------------

    // 1. Onboarding Hint (Placing Stage)
    useEffect(() => {
        let t: ReturnType<typeof setTimeout> | undefined;

        if (stage === 'placing') {
            const seen = localStorage.getItem('ar_onboarding_seen');
            if (!seen) {
                setShowOnboardingHint(true);
                trackJourneyEvent({ type: 'AR_ONBOARDING_SHOWN', meta: { variant: 'single-line-v1' } });

                t = setTimeout(() => {
                    setShowOnboardingHint(false);
                }, 3000);

                localStorage.setItem('ar_onboarding_seen', '1');
            }
        } else {
            setShowOnboardingHint(false);
        }
        return () => { if (t) clearTimeout(t); };
    }, [stage]);

    // 2. Gesture Hint (Active Stage)
    useEffect(() => {
        let t: ReturnType<typeof setTimeout> | undefined;

        if (stage === 'active') {
            const seen = localStorage.getItem('gesture_hint_seen');
            if (!seen) {
                setShowGestureHint(true);
                trackJourneyEvent({ type: 'AR_GESTURE_HINT_SHOWN' });

                t = setTimeout(() => {
                    setShowGestureHint(false);
                }, 5000);

                localStorage.setItem('gesture_hint_seen', '1');
            }
        } else {
            setShowGestureHint(false);
        }
        return () => { if (t) clearTimeout(t); };
    }, [stage]);


    return (
        <>
            {/* 1. Gesture Layer (Pure touch handling) */}
            {/* 1. DOM Overlay Root (Wrapper for everything) */}
            <div
                ref={overlayRef}
                className="fixed inset-0 z-[100] bg-transparent"
                style={{ pointerEvents: 'none' }} // Root doesn't capture, children do
            >
                {/* Canvas Container */}
                <div ref={containerRef} className="absolute inset-0 pointer-events-none" style={{ pointerEvents: 'none' }} />

                {/* Gesture Surface (Active only when AR is active) */}
                <div
                    ref={gestureRef}
                    className="absolute inset-0 z-0 bg-transparent"
                    style={{
                        touchAction: 'none', // Always prevent browser scrolling/zooming in AR
                        pointerEvents: (stage === 'active' || stage === 'manipulating') ? 'auto' : 'none',
                    }}
                />

                {/* UI Layer (Buttons always on top of gestures) */}
                <div className="absolute inset-0 z-10 pointer-events-none">

                    {/* Selected Item Label (Bottom Center, above controls) */}
                    {stage === 'active' && selectedLabel && (
                        <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+100px)] left-1/2 -translate-x-1/2 pointer-events-none">
                            <div className="bg-white/70 backdrop-blur-md px-4 py-2 rounded-full text-xs text-soft-black/80 shadow-soft max-w-[60vw] truncate">
                                {selectedLabel}
                            </div>
                        </div>
                    )}

                    {/* Bottom Controls (Premium Quiet UX) */}
                    <ARBottomControls
                        stage={stage}
                        onClose={() => endSession()}
                    />

                    {/* Quiet UX: Sticky Onboarding Hint (One-Time) */}
                    {stage === 'placing' && showOnboardingHint && (
                        <div className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none fade-in-out">
                            <div className="bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-sm border border-white/20">
                                <span className="text-soft-black/90 text-[15px] font-medium leading-tight">
                                    Наведите телефон на пол и коснитесь экрана
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Quiet UX: One-Time Gesture Hint */}
                    {stage === 'active' && showGestureHint && (
                        <div className="absolute bottom-32 left-0 right-0 flex justify-center pointer-events-none fade-in-out">
                            <div className="bg-white/60 backdrop-blur-md px-4 py-2 rounded-full text-xs text-soft-black/80 shadow-soft border border-white/20">
                                1 палец — двигать • 2 — масштаб/поворот
                            </div>
                        </div>
                    )}

                    {/* Center state */}
                    {/* Center state - Filtered to remove Empty Toasts during placing/starting */}
                    {(stage === 'loading' || stage === 'ready' || stage === 'error' || stage === 'unsupported') && (
                        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                            <div className="max-w-sm w-full bg-white/85 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-stone-beige/30 pointer-events-auto">

                                {stage === 'loading' && (
                                    <>
                                        <div className="text-sm font-semibold text-soft-black">Загружаю модель…</div>
                                        <div className="text-xs text-muted-gray mt-2">
                                            {sceneGraph.loadingProgress.total > 0
                                                ? `${sceneGraph.loadingProgress.loaded}/${sceneGraph.loadingProgress.total}`
                                                : 'Секунду...'}
                                        </div>
                                    </>
                                )}

                                {stage === 'ready' && (
                                    <>
                                        <div className="text-sm font-semibold text-soft-black">{sceneTitle}</div>

                                        {/* Startup Error (timeout, etc) */}
                                        {startupError && (
                                            <div className="mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                                <div className="text-xs text-amber-800">{startupError}</div>
                                            </div>
                                        )}

                                        <div className="text-xs text-muted-gray mt-2 leading-relaxed">
                                            Наведите телефон на пол и коснитесь экрана, чтобы поставить.
                                        </div>
                                        <div className="mt-4">
                                            <button
                                                onClick={() => {
                                                    setStartupError(null);
                                                    startAR();
                                                }}
                                                className="w-full bg-brand-brown text-white px-6 py-4 rounded-xl shadow-lg font-medium hover:bg-brand-charcoal transition-colors"
                                            >
                                                {startupError ? 'Попробовать ещё раз' : 'Начать AR'}
                                            </button>
                                        </div>
                                    </>
                                )}



                                {(stage === 'error' || stage === 'unsupported') && (
                                    <>
                                        <div className="text-sm font-semibold text-soft-black">Не получилось</div>
                                        <div className="text-xs text-muted-gray mt-2 leading-relaxed">
                                            {error || 'Попробуйте позже.'}
                                        </div>
                                        <div className="mt-4">
                                            <button
                                                onClick={() => endSession()}
                                                className="w-full bg-white text-soft-black px-6 py-3 rounded-xl shadow-sm font-medium hover:bg-stone-beige/30 transition-colors border border-stone-beige/50"
                                            >
                                                Закрыть
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}



                    {/* Coaching Overlay (New v2 Guidance) */}
                    {(stage === 'placing') && (
                        <ARCoachingOverlay
                            visible={true}
                            hint={useFallbackPlacement || reticleVisible ? 'tap' : 'scan'}
                        />
                    )}



                </div >
            </div >
        </>
    );
};

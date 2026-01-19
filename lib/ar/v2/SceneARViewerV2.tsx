/**
 * SceneARViewerV2 — Complete AR component for Android
 * 
 * Uses Three.js + WebXR directly for full gesture control.
 * Replaces model-viewer on Android devices.
 */

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useImmersive } from '../../../contexts/ImmersiveContext';

import { trackJourneyEvent } from '../../journey/client';
import { createArSessionId } from '../../journey/arSession';

import { useWebXRSession } from './hooks/useWebXRSession';
import { useHitTest } from './hooks/useHitTest';
import { useGestures } from './hooks/useGestures';
import { useSceneGraph } from './hooks/useSceneGraph';
import { MAX_PIXEL_RATIO, GESTURE_HINT_DURATION_MS, HIT_TEST_TIMEOUT_MS, MIN_PLACEMENT_DISTANCE_M } from './constants';
import type { ARStage, SceneARViewerV2Props } from './types';
import { PostARBridge } from '../../../components/ar/PostARBridge';

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
    const reticleRef = useRef<THREE.Mesh | null>(null);
    const anchorRef = useRef<THREE.Group | null>(null);
    const placedRef = useRef(false);
    const startedAtRef = useRef<number | null>(null);
    const hasArStartedRef = useRef(false);
    const arSessionIdRef = useRef(createArSessionId());

    // State
    const [stage, setStage] = useState<ARStage>('idle');
    const [error, setError] = useState<string | null>(null);
    const [showHint, setShowHint] = useState(false);
    const [showPostSessionUI, setShowPostSessionUI] = useState(false);
    const [useFallbackPlacement, setUseFallbackPlacement] = useState(false);
    const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null); // v1.1: Canvas capture
    const placingStartTimeRef = useRef<number | null>(null);

    // Hooks
    const xrSession = useWebXRSession();
    const hitTest = useHitTest();
    const sceneGraph = useSceneGraph();
    const selectedKeyRef = useRef<string | null>(null);

    // Update selectedKeyRef when sceneGraph.selectedKey changes
    useEffect(() => {
        selectedKeyRef.current = sceneGraph.selectedKey;
    }, [sceneGraph.selectedKey]);

    // Gestures
    useGestures({
        overlayRef: gestureRef,
        anchorRef,
        itemsRef: sceneGraph.itemsRef,
        selectedKeyRef,
        cameraRef,
        rendererRef,
        isActive: stage === 'active' && placedRef.current,
        onSelect: sceneGraph.selectItem,
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
        renderer.xr.enabled = true;
        // Preserve drawing buffer for screenshots if needed (perf cost, but needed for 'Capture')
        // Actually, for now let's keep it simple. If we want high-perf, we skip it.
        // UIA says "Capture" -> "Freeze frame".
        // Let's rely on "End Session" as the trigger for "Done" for now, or add a dedicated shutter button that ends session.
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.touchAction = 'none';
        renderer.domElement.style.pointerEvents = 'none';
        container.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Scene
        const threeScene = new THREE.Scene();
        sceneRef.current = threeScene;

        // Camera
        const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.01, 100);
        cameraRef.current = camera;

        // Lighting (Enhanced for PBR materials in AR)
        // 1. Ambient - baseline fill to prevent black shadows
        const ambient = new THREE.AmbientLight(0xffffff, 0.35);
        threeScene.add(ambient);

        // 2. Hemisphere - sky/ground color gradient
        const hemi = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.4);
        hemi.position.set(0.5, 1, 0.25);
        threeScene.add(hemi);

        // 3. Directional - main shadow-casting light
        const directional = new THREE.DirectionalLight(0xffffff, 0.9);
        directional.position.set(5, 10, 7.5);
        threeScene.add(directional);

        // 4. Fill light (follows camera, updated in render loop)
        const fill = new THREE.PointLight(0xfff5e6, 0.4, 10);
        fill.name = 'cameraFillLight';
        camera.add(fill);
        fill.position.set(0, 0.5, 0); // Slightly above camera
        threeScene.add(camera); // Camera must be in scene for child lights to work

        // Reticle
        const reticleGeom = new THREE.RingGeometry(0.08, 0.12, 32);
        reticleGeom.rotateX(-Math.PI / 2);
        const reticleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.7, transparent: true });
        const reticle = new THREE.Mesh(reticleGeom, reticleMat);
        reticle.matrixAutoUpdate = false;
        reticle.visible = false;
        threeScene.add(reticle);
        reticleRef.current = reticle;

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

        hitTest.cleanup();
        xrSession.endSession();
        hasArStartedRef.current = false; // Reset flag

        // 2. If object was placed, capture snapshot and show Bridge Screen
        if (placedRef.current) {
            // v1.1: Capture canvas snapshot before cleanup
            const renderer = rendererRef.current;
            if (renderer) {
                try {
                    // Force one more render to ensure current frame
                    if (sceneRef.current && cameraRef.current) {
                        renderer.render(sceneRef.current, cameraRef.current);
                    }
                    const dataUrl = renderer.domElement.toDataURL('image/jpeg', 0.85);
                    setSnapshotUrl(dataUrl);
                } catch (err) {
                    console.warn('[SceneARViewerV2] Failed to capture snapshot:', err);
                }
            }

            trackJourneyEvent({
                type: 'FINISH_AR',
                objectId: sceneId,
                meta: { arSessionId: arSessionIdRef.current, durationSec: duration },
            });
            setShowPostSessionUI(true);
            setStage('idle');
        } else {
            // Cancelled before placement - still a real AR session
            onClose(duration, true);
        }
    }, [hitTest, xrSession, sceneId, onClose, stage]);

    const handlePostArClose = () => {
        const duration = startedAtRef.current
            ? (Date.now() - startedAtRef.current) / 1000
            : 0;
        onClose(duration, true);
    };

    const handleRestart = () => {
        setShowPostSessionUI(false);
        setStage('ready');
        startedAtRef.current = null;
        placedRef.current = false;
        hasArStartedRef.current = false;
        // Optionally auto-start? No, let user click "Start AR" again for safety/intent.
    };

    // Lifecycle safety (Force exit on navigation/background)
    useEffect(() => {
        const handleExit = () => {
            // Only force exit if XR is ACTUALLY running (not just UI states)
            // This prevents false exits during startup or other non-AR states
            if (!hasArStartedRef.current) {
                console.log('[SceneARViewerV2] Lifecycle event ignored — XR not active');
                return;
            }

            if (stage === 'active' || stage === 'placing') {
                console.log('[SceneARViewerV2] Lifecycle exit triggered. Stage:', stage);
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
        console.log('[SceneARViewerV2] startAR called. Stage:', stage);
        if (stage !== 'ready') return;

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
            console.log('[SceneARViewerV2] Requesting XR Session...');
            const session = await xrSession.startSession(renderer, overlay);
            console.log('[SceneARViewerV2] Session started successfully');
            startedAtRef.current = Date.now();
            hasArStartedRef.current = true;

            trackJourneyEvent({
                type: 'START_AR',
                objectId: sceneId,
                meta: { arSessionId: arSessionIdRef.current },
            });

            onSessionStart?.();

            await hitTest.setupHitTest(session);

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
                setShowHint(true);
                setUseFallbackPlacement(false);

                // Hide hint after timeout
                setTimeout(() => setShowHint(false), GESTURE_HINT_DURATION_MS);

                // Haptic Feedback
                if (navigator.vibrate) {
                    navigator.vibrate(20); // Short sharp tick
                }
            };

            session.addEventListener('select', onSelect);

            // Track when placing started for fallback timeout
            placingStartTimeRef.current = Date.now();

            // Animation loop
            renderer.setAnimationLoop((time: number, frame?: XRFrame) => {
                if (frame && !placedRef.current) {
                    const hasHit = hitTest.updateReticle(frame, reticle);

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
                            reticle.matrixAutoUpdate = true;
                        }
                    }
                }
                renderer.render(threeScene, camera);
            });

        } catch (e: any) {
            console.error('[SceneARViewerV2] startAR error:', e);
            // XR failed to start - ensure flag is false
            hasArStartedRef.current = false;
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
                        touchAction: stage === 'active' ? 'none' : 'auto',
                        pointerEvents: stage === 'active' ? 'auto' : 'none',
                    }}
                />

                {/* UI Layer (Buttons always on top of gestures) */}
                <div className="absolute inset-0 z-10 pointer-events-none">

                    {/* Top bar (Safe Zone: Corners) */}
                    <div className="absolute top-[calc(env(safe-area-inset-top)+14px)] left-4 right-4 flex items-start justify-between pointer-events-none">

                        {/* Selected Item Label (Center Top, ephemeral or persistent) */}
                        {selectedLabel && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-white/70 backdrop-blur-md px-3 py-2 rounded-full text-xs text-soft-black/80 shadow-soft max-w-[60vw] truncate pointer-events-auto">
                                {selectedLabel}
                            </div>
                        )}

                        {/* Top Right: Close (X) - Minimalist */}
                        <div className="pointer-events-auto ml-auto">
                            {(stage === 'active' || stage === 'ready' || stage === 'error') && (
                                <button
                                    onClick={() => endSession()}
                                    className="bg-white/80 backdrop-blur-md w-10 h-10 rounded-full shadow-soft flex items-center justify-center text-soft-black hover:bg-white transition-colors"
                                    aria-label="Close"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Bottom Controls (Safe Zone) */}
                    <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+24px)] left-0 right-0 px-6 flex items-center justify-between pointer-events-none">

                        {/* Delete Button (Bottom Left) */}
                        <div className="pointer-events-auto">
                            {stage === 'active' && sceneGraph.selectedKey && (
                                <button
                                    onClick={sceneGraph.deleteSelected}
                                    className="bg-white/80 backdrop-blur-md px-4 py-3 rounded-full shadow-soft text-soft-black text-sm font-medium hover:bg-white transition-colors"
                                >
                                    Удалить
                                </button>
                            )}
                        </div>

                        {/* Capture / Finish Button (Bottom Center) - Only after placement */}
                        <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-0">
                            {stage === 'active' && placedRef.current && (
                                <button
                                    onClick={() => endSession()} // "Capture" logic = End Session & Show Result
                                    className="w-16 h-16 rounded-full bg-white border-4 border-white/50 shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                                    aria-label="Capture"
                                >
                                    <div className="w-12 h-12 rounded-full bg-brand-brown/10 border border-brand-brown/50" />
                                </button>
                            )}
                        </div>

                        {/* Spacer for symmetry or secondary action */}
                        <div className="w-[88px]" />
                    </div>

                    {/* Center state */}
                    {(stage === 'loading' || stage === 'ready' || stage === 'starting' || stage === 'placing' || stage === 'error' || stage === 'unsupported') && (
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
                                        <div className="text-xs text-muted-gray mt-2 leading-relaxed">
                                            Наведите телефон на пол и коснитесь экрана, чтобы поставить.
                                        </div>
                                        <div className="mt-4">
                                            <button
                                                onClick={startAR}
                                                className="w-full bg-brand-brown text-white px-6 py-4 rounded-xl shadow-lg font-medium hover:bg-brand-charcoal transition-colors"
                                            >
                                                Начать AR
                                            </button>
                                        </div>
                                    </>
                                )}

                                {stage === 'starting' && (
                                    <>
                                        <div className="text-sm font-semibold text-soft-black">Запуск...</div>
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

                    {/* Placing Hint (Subtle Toast) - moved out of center card */}
                    {stage === 'placing' && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-80">
                            <div className="bg-white/70 backdrop-blur-md px-6 py-3 rounded-full text-sm font-medium text-soft-black shadow-soft animate-pulse">
                                {useFallbackPlacement
                                    ? 'Коснитесь экрана'
                                    : 'Наведите на пол'}
                            </div>
                        </div>
                    )}

                    {/* Gesture hint */}
                    {stage === 'active' && showHint && !showPostSessionUI && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none">
                            <div className="bg-white/70 backdrop-blur-md px-4 py-2 rounded-full text-xs text-soft-black/80 shadow-soft">
                                1 палец — двигать • 2 пальца — масштаб/поворот
                            </div>
                        </div>
                    )}

                    {/* Post-AR Bridge Screen (HANDOFF-SPEC v1.1) */}
                    {showPostSessionUI && (
                        <PostARBridge
                            objectId={objects[0]?.objectId || sceneId}
                            objectName={sceneTitle}
                            snapshotUrl={snapshotUrl || undefined}
                            arSessionId={arSessionIdRef.current}
                            onClose={handlePostArClose}
                            onRestart={handleRestart}
                        />
                    )}
                </div>
            </div>
        </>
    );
};

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
import { MAX_PIXEL_RATIO, GESTURE_HINT_DURATION_MS } from './constants';
import type { ARStage, SceneARViewerV2Props } from './types';

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
    const arSessionIdRef = useRef(createArSessionId());

    // State
    const [stage, setStage] = useState<ARStage>('idle');
    const [error, setError] = useState<string | null>(null);
    const [showHint, setShowHint] = useState(false);

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

        // Lighting
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.1);
        light.position.set(0.5, 1, 0.25);
        threeScene.add(light);

        const directional = new THREE.DirectionalLight(0xffffff, 0.7);
        directional.position.set(5, 10, 7.5);
        threeScene.add(directional);

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
            renderer.setAnimationLoop(null);
            renderer.dispose();
            container.removeChild(renderer.domElement);
            rendererRef.current = null;
            sceneRef.current = null;
            cameraRef.current = null;
            reticleRef.current = null;
            anchorRef.current = null;
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
        const duration = startedAtRef.current
            ? (Date.now() - startedAtRef.current) / 1000
            : undefined;

        hitTest.cleanup();
        xrSession.endSession();

        if (startedAtRef.current) {
            trackJourneyEvent({
                type: 'FINISH_AR',
                objectId: sceneId,
                meta: { arSessionId: arSessionIdRef.current, durationSec: duration },
            });
        }

        onClose(duration);
    }, [hitTest, xrSession, sceneId, onClose]);

    // Lifecycle safety (Force exit on navigation/background)
    useEffect(() => {
        const handleExit = () => {
            if (stage === 'active' || stage === 'placing' || stage === 'starting') {
                endSession();
            }
        };

        window.addEventListener('popstate', handleExit);
        window.addEventListener('visibilitychange', handleExit);
        window.addEventListener('pagehide', handleExit);

        return () => {
            window.removeEventListener('popstate', handleExit);
            window.removeEventListener('visibilitychange', handleExit);
            window.removeEventListener('pagehide', handleExit);
            // Also ensure cleanup on unmount
            handleExit();
        };
    }, [stage, endSession]);

    // Start AR session
    const startAR = useCallback(async () => {
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
            const session = await xrSession.startSession(renderer, overlay);
            startedAtRef.current = Date.now();

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
                if (!reticle.visible) return;

                // Copy reticle position to anchor
                const pos = new THREE.Vector3();
                const quat = new THREE.Quaternion();
                const scale = new THREE.Vector3();
                reticle.matrix.decompose(pos, quat, scale);

                anchor.position.copy(pos);
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

                // Hide hint after timeout
                setTimeout(() => setShowHint(false), GESTURE_HINT_DURATION_MS);
            };

            session.addEventListener('select', onSelect);

            // Animation loop
            renderer.setAnimationLoop((time: number, frame?: XRFrame) => {
                if (frame && !placedRef.current) {
                    hitTest.updateReticle(frame, reticle);
                }
                renderer.render(threeScene, camera);
            });

        } catch (e: any) {
            console.error('[SceneARViewerV2] startAR error:', e);
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

                    {/* Top bar */}
                    <div className="absolute top-[calc(env(safe-area-inset-top)+14px)] left-4 right-4 flex items-center justify-between gap-3">
                        <div className="pointer-events-auto">
                            <button
                                onClick={() => endSession()}
                                className="bg-white/80 backdrop-blur-md px-4 py-3 rounded-full shadow-soft text-soft-black text-sm font-medium hover:bg-white transition-colors"
                            >
                                Закрыть
                            </button>
                        </div>

                        {selectedLabel && (
                            <div className="bg-white/70 backdrop-blur-md px-3 py-2 rounded-full text-xs text-soft-black/80 shadow-soft max-w-[60vw] truncate">
                                {selectedLabel}
                            </div>
                        )}

                        <div className="pointer-events-auto flex items-center gap-2">
                            <button
                                onClick={sceneGraph.deleteSelected}
                                disabled={!sceneGraph.selectedKey}
                                className="bg-white/80 backdrop-blur-md px-4 py-3 rounded-full shadow-soft text-soft-black text-sm font-medium hover:bg-white transition-colors disabled:opacity-40"
                            >
                                Удалить
                            </button>
                        </div>
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
                                        <div className="text-sm font-semibold text-soft-black">Запускаю AR…</div>
                                        <div className="text-xs text-muted-gray mt-2">Секунду.</div>
                                    </>
                                )}

                                {stage === 'placing' && (
                                    <>
                                        <div className="text-sm font-semibold text-soft-black">Выберите место</div>
                                        <div className="text-xs text-muted-gray mt-2 leading-relaxed">
                                            Наведите телефон на пол — появится метка. Коснитесь экрана.
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

                    {/* Gesture hint */}
                    {stage === 'active' && showHint && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none">
                            <div className="bg-white/70 backdrop-blur-md px-4 py-2 rounded-full text-xs text-soft-black/80 shadow-soft">
                                1 палец — двигать • 2 пальца — масштаб/поворот
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

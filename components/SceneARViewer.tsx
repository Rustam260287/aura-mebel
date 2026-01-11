'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { ObjectPublic, ScenePresetPublic } from '../types';
import { useImmersive } from '../contexts/ImmersiveContext';
import { trackJourneyEvent } from '../lib/journey/client';
import { useToast } from '../contexts/ToastContext';
import { createArSessionId } from '../lib/journey/arSession';
import { createArSnapshot } from '../lib/journey/snapshotsClient';

type Stage = 'idle' | 'loading' | 'ready-to-start' | 'starting' | 'placing' | 'active' | 'error' | 'unsupported';

type PlacedItem = {
  key: string;
  objectId: string;
  objectName: string;
  group: THREE.Group;
  baseScale: number;
  userScale: number;
};

type GestureState =
  | { mode: 'none' }
  | {
    mode: 'drag';
    pointerId: number;
    offsetLocal: THREE.Vector3;
  }
  | {
    mode: 'pinch';
    startDistance: number;
    startAngle: number;
    startUserScale: number;
    startRotationY: number;
  };

interface SceneARViewerProps {
  scene: ScenePresetPublic;
  objects: ObjectPublic[];
  onClose: (durationSec?: number) => void;
  onSessionStart?: () => void;
}

const MIN_USER_SCALE = 0.5;
const MAX_USER_SCALE = 2.0;

const toRadians = (deg: number) => (deg * Math.PI) / 180;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const distance2 = (a: Touch, b: Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
const angle2 = (a: Touch, b: Touch) => Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX);

export const SceneARViewer: React.FC<SceneARViewerProps> = ({ scene, objects, onClose, onSessionStart }) => {
  const { setImmersive } = useImmersive();
  const { addToast } = useToast();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const xrSessionRef = useRef<any>(null);
  const hitTestSourceRef = useRef<any>(null);
  const referenceSpaceRef = useRef<any>(null);

  const reticleRef = useRef<THREE.Mesh | null>(null);
  const anchorRef = useRef<THREE.Group | null>(null);

  const placedRef = useRef(false);
  const itemsRef = useRef<PlacedItem[]>([]);
  const selectedKeyRef = useRef<string | null>(null);

  const raycasterRef = useRef(new THREE.Raycaster());
  const tmpNdcRef = useRef(new THREE.Vector2());
  const tmpVec3ARef = useRef(new THREE.Vector3());
  const tmpVec3BRef = useRef(new THREE.Vector3());
  const tmpQuatRef = useRef(new THREE.Quaternion());
  const tmpScaleRef = useRef(new THREE.Vector3());
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  const gestureRef = useRef<GestureState>({ mode: 'none' });
  const touchIdsRef = useRef<number[]>([]);

  const startedAtRef = useRef<number | null>(null);
  const closeOnceRef = useRef(false);
  const arSessionIdRef = useRef<string>(createArSessionId());
  const [isCapturing, setIsCapturing] = useState(false);

  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<{ loaded: number; total: number }>({ loaded: 0, total: 0 });

  const objectsById = useMemo(() => {
    const map = new Map<string, ObjectPublic>();
    for (const o of objects) map.set(o.id, o);
    return map;
  }, [objects]);

  const entries = useMemo(() => {
    return (scene.objects || [])
      .map((entry, index) => {
        const obj = objectsById.get(entry.objectId);
        const glbUrl = obj?.modelGlbUrl;
        return {
          key: `${entry.objectId}:${index}`,
          objectId: entry.objectId,
          objectName: obj?.name || entry.objectId,
          glbUrl: glbUrl || null,
          position: entry.position,
          rotation: entry.rotation,
          scale: entry.scale,
        };
      })
      .filter((e) => Boolean(e.glbUrl));
  }, [objectsById, scene.objects]);

  const endSession = useCallback(
    async (reason: 'user' | 'unmount' | 'session-ended') => {
      if (closeOnceRef.current) return;
      closeOnceRef.current = true;

      setImmersive(false);
      setStage('idle');

      const startedAt = startedAtRef.current;
      const durationSec =
        startedAt != null ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : undefined;

      try {
        const session = xrSessionRef.current;
        xrSessionRef.current = null;
        hitTestSourceRef.current = null;
        referenceSpaceRef.current = null;
        if (session && session.readyState === 'active') {
          await session.end().catch(() => null);
        }
      } catch { }

      try {
        const renderer = rendererRef.current;
        if (renderer) renderer.setAnimationLoop(null);
      } catch { }

      if (reason !== 'unmount' && startedAtRef.current != null) {
        if (durationSec != null) {
          trackJourneyEvent({
            type: 'FINISH_AR',
            objectId: scene.id,
            meta: { durationSec, arSessionId: arSessionIdRef.current },
          });
        } else {
          trackJourneyEvent({ type: 'FINISH_AR', objectId: scene.id, meta: { arSessionId: arSessionIdRef.current } });
        }
      }

      if (reason !== 'unmount') {
        onClose(durationSec);
      }
    },
    [onClose, scene.id, setImmersive],
  );

  useEffect(() => {
    setImmersive(true);
    return () => {
      void endSession('unmount');
    };
  }, [endSession, setImmersive]);

  const loadModels = useCallback(async () => {
    if (entries.length === 0) {
      setError('В этой сцене нет GLB-моделей.');
      setStage('error');
      return new Map<string, THREE.Object3D>();
    }

    setStage('loading');
    setError(null);
    setLoadingProgress({ loaded: 0, total: entries.length });

    const loader = new GLTFLoader();
    const loaded = new Map<string, THREE.Object3D>();

    const uniqueByObjectId = new Map<string, string>();
    for (const e of entries) {
      if (!e.glbUrl) continue;
      if (!uniqueByObjectId.has(e.objectId)) uniqueByObjectId.set(e.objectId, e.glbUrl);
    }

    const unique = Array.from(uniqueByObjectId.entries());
    setLoadingProgress({ loaded: 0, total: unique.length });

    let done = 0;
    await Promise.all(
      unique.map(async ([objectId, glbUrl]) => {
        const proxied = `/api/proxy-model.glb?url=${encodeURIComponent(glbUrl)}`;
        const gltf = await new Promise<THREE.Object3D>((resolve, reject) => {
          loader.load(
            proxied,
            (g) => resolve(g.scene),
            undefined,
            (err) => reject(err),
          );
        });

        loaded.set(objectId, gltf);
        done += 1;
        setLoadingProgress({ loaded: done, total: unique.length });
      }),
    );

    setStage('ready-to-start');
    return loaded;
  }, [entries]);

  const loadedModelsRef = useRef<Map<string, THREE.Object3D>>(new Map());

  useEffect(() => {
    let active = true;
    const init = async () => {
      const xr = (navigator as any).xr as any;
      if (!xr || typeof xr.isSessionSupported !== 'function') {
        setStage('unsupported');
        setError('WebXR недоступен в этом браузере.');
        return;
      }
      try {
        const supported = await xr.isSessionSupported('immersive-ar');
        if (!supported) {
          setStage('unsupported');
          setError('AR-комплекты доступны в Chrome на Android.');
          return;
        }
      } catch {
        setStage('unsupported');
        setError('Не удалось проверить поддержку AR.');
        return;
      }

      try {
        const models = await loadModels();
        if (!active) return;
        loadedModelsRef.current = models;
      } catch (e) {
        if (!active) return;
        console.error(e);
        setStage('error');
        setError('Не удалось загрузить модели. Проверьте ссылки GLB.');
      }
    };

    void init();
    return () => {
      active = false;
    };
  }, [loadModels]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.xr.enabled = true;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';

    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const threeScene = new THREE.Scene();
    sceneRef.current = threeScene;

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.01, 100);
    cameraRef.current = camera;

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.1);
    light.position.set(0.5, 1, 0.25);
    threeScene.add(light);

    const reticleGeo = new THREE.RingGeometry(0.09, 0.12, 32).rotateX(-Math.PI / 2);
    const reticleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.7, transparent: true });
    const reticle = new THREE.Mesh(reticleGeo, reticleMat);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    reticleRef.current = reticle;
    threeScene.add(reticle);

    const anchor = new THREE.Group();
    anchor.visible = false;
    anchorRef.current = anchor;
    threeScene.add(anchor);

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      try {
        renderer.setAnimationLoop(null);
      } catch { }
      try {
        renderer.dispose();
      } catch { }
      try {
        container.removeChild(renderer.domElement);
      } catch { }
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      reticleRef.current = null;
      anchorRef.current = null;
    };
  }, []);

  const buildRayFromClient = useCallback((clientX: number, clientY: number) => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!renderer || !camera) return null;
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    tmpNdcRef.current.set(x, y);

    const activeCamera = (renderer.xr.isPresenting ? (renderer.xr.getCamera() as any) : camera) as THREE.Camera;
    const origin = tmpVec3ARef.current;
    activeCamera.getWorldPosition(origin);

    const dirPoint = tmpVec3BRef.current;
    dirPoint.set(x, y, 0.5).unproject(activeCamera);
    const direction = dirPoint.sub(origin).normalize();

    const raycaster = raycasterRef.current;
    raycaster.ray.origin.copy(origin);
    raycaster.ray.direction.copy(direction);
    raycaster.near = 0.01;
    raycaster.far = 100;
    return raycaster;
  }, []);

  const pickItem = useCallback(
    (clientX: number, clientY: number) => {
      const raycaster = buildRayFromClient(clientX, clientY);
      const anchor = anchorRef.current;
      if (!raycaster || !anchor || !anchor.visible) return null;
      const intersects = raycaster.intersectObjects(anchor.children, true);
      for (const hit of intersects) {
        const key = (hit.object as any)?.userData?.itemKey as string | undefined;
        if (key) return key;
      }
      return null;
    },
    [buildRayFromClient],
  );

  const selectItemByKey = useCallback((key: string | null) => {
    selectedKeyRef.current = key;
    setSelectedKey(key);
  }, []);

  const updatePlaneToAnchor = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const worldPos = tmpVec3ARef.current;
    anchor.getWorldPosition(worldPos);
    // Horizontal plane at anchor height.
    planeRef.current.set(new THREE.Vector3(0, 1, 0), -worldPos.y);
  }, []);

  const normalizeModelForPlacement = useCallback((object: THREE.Object3D) => {
    const root = object.clone(true);
    root.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(root);
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    if (Number.isFinite(size.y) && size.y > 0) {
      root.position.sub(center);
      root.position.y += size.y / 2;
    }
    root.traverse((child) => {
      if ((child as any).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
    return root;
  }, []);

  const spawnScene = useCallback(() => {
    const anchor = anchorRef.current;
    const threeScene = sceneRef.current;
    if (!anchor || !threeScene) return;

    // Clear previous placement (if any)
    for (const item of itemsRef.current) {
      try {
        anchor.remove(item.group);
      } catch { }
    }
    itemsRef.current = [];
    placedRef.current = true;
    selectItemByKey(null);

    anchor.visible = true;
    updatePlaneToAnchor();

    const models = loadedModelsRef.current;

    let index = 0;
    for (const entry of entries) {
      const base = models.get(entry.objectId);
      if (!base) continue;

      const itemGroup = new THREE.Group();
      itemGroup.userData.itemKey = entry.key;

      const normalized = normalizeModelForPlacement(base);
      normalized.traverse((child) => {
        if ((child as any).isMesh) {
          (child as any).userData.itemKey = entry.key;
        }
      });
      itemGroup.add(normalized);

      itemGroup.position.set(entry.position[0], entry.position[1], entry.position[2]);
      itemGroup.rotation.set(
        toRadians(entry.rotation[0]),
        toRadians(entry.rotation[1]),
        toRadians(entry.rotation[2]),
      );

      const baseScale = Number.isFinite(entry.scale) && entry.scale > 0 ? entry.scale : 1;
      itemGroup.scale.setScalar(baseScale);

      anchor.add(itemGroup);

      itemsRef.current.push({
        key: entry.key,
        objectId: entry.objectId,
        objectName: entry.objectName,
        group: itemGroup,
        baseScale,
        userScale: 1,
      });

      index += 1;
    }
  }, [entries, normalizeModelForPlacement, selectItemByKey, updatePlaneToAnchor]);

  const startAr = useCallback(async () => {
    if (stage !== 'ready-to-start') return;
    const xr = (navigator as any).xr as any;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const threeScene = sceneRef.current;
    const reticle = reticleRef.current;
    const anchor = anchorRef.current;
    if (!xr || !renderer || !camera || !threeScene || !reticle || !anchor) return;

    setStage('starting');
    setError(null);
    closeOnceRef.current = false;

    try {
      const session = await xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay', 'local-floor'],
        domOverlay: { root: overlayRef.current || document.body },
      } as any);

      xrSessionRef.current = session;
      startedAtRef.current = Date.now();
      trackJourneyEvent({ type: 'START_AR', objectId: scene.id, meta: { arSessionId: arSessionIdRef.current } });

      onSessionStart?.();

      session.addEventListener('end', () => {
        void endSession('session-ended');
      });

      await renderer.xr.setSession(session);

      const referenceSpace = await session.requestReferenceSpace('local');
      referenceSpaceRef.current = referenceSpace;
      const viewerSpace = await session.requestReferenceSpace('viewer');
      const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
      hitTestSourceRef.current = hitTestSource;

      placedRef.current = false;
      anchor.visible = false;
      reticle.visible = false;
      selectItemByKey(null);
      gestureRef.current = { mode: 'none' };

      setStage('placing');

      const onSelect = () => {
        if (placedRef.current) return;
        if (!reticle.visible) return;
        reticle.matrix.decompose(tmpVec3ARef.current, tmpQuatRef.current, tmpScaleRef.current);
        anchor.position.copy(tmpVec3ARef.current);
        anchor.quaternion.identity();
        anchor.updateMatrixWorld(true);
        spawnScene();
        reticle.visible = false;
        setStage('active');
      };

      session.addEventListener('select', onSelect);

      renderer.setAnimationLoop((time: number, frame?: any) => {
        if (frame && hitTestSourceRef.current && referenceSpaceRef.current) {
          const results = frame.getHitTestResults(hitTestSourceRef.current);
          if (results.length > 0) {
            const pose = results[0].getPose(referenceSpaceRef.current);
            if (pose) {
              reticle.visible = !placedRef.current;
              reticle.matrix.fromArray(pose.transform.matrix);
            }
          } else {
            reticle.visible = false;
          }
        }

        renderer.render(threeScene, camera);
      });
    } catch (e) {
      console.error(e);
      setStage('error');
      setError('Не удалось запустить AR. Попробуйте Chrome на Android.');
    }
  }, [endSession, onSessionStart, scene.id, selectItemByKey, spawnScene, stage]);

  const handleSnapshot = useCallback(async () => {
    if (isCapturing) return;
    if (stage !== 'active') return;
    const renderer = rendererRef.current;
    if (!renderer) return;
    const canvas = renderer.domElement as HTMLCanvasElement | undefined;
    if (!canvas || typeof canvas.toBlob !== 'function') return;

    setIsCapturing(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) => {
        const timeout = window.setTimeout(() => resolve(null), 1800);
        canvas.toBlob(
          (b) => {
            window.clearTimeout(timeout);
            resolve(b);
          },
          'image/jpeg',
          0.9,
        );
      });
      if (!blob) throw new Error('failed to capture canvas');

      await createArSnapshot({
        sessionId: arSessionIdRef.current,
        objectId: scene.id,
        capture: { blob, width: canvas.width, height: canvas.height },
      });
      addToast('Снимок сохранён', 'success', 1600);
    } catch (e) {
      console.warn('[SceneARViewer] snapshot failed:', e);
      addToast('Не удалось сохранить снимок', 'error', 2200);
    } finally {
      setIsCapturing(false);
    }
  }, [addToast, isCapturing, scene.id, stage]);

  const deleteSelected = useCallback(() => {
    const key = selectedKeyRef.current;
    const anchor = anchorRef.current;
    if (!key || !anchor) return;
    const items = itemsRef.current;
    const idx = items.findIndex((i) => i.key === key);
    if (idx === -1) return;
    const [removed] = items.splice(idx, 1);
    try {
      anchor.remove(removed.group);
    } catch { }
    selectItemByKey(null);
  }, [selectItemByKey]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const onTouchStart = (e: TouchEvent) => {
      if (stage !== 'active' && stage !== 'placing') return;
      if (!placedRef.current) return;
      if (e.touches.length === 0) return;
      e.preventDefault();

      // Track touch identifiers for consistent gesture handling.
      touchIdsRef.current = Array.from(e.touches).map((t) => t.identifier);

      if (e.touches.length === 1) {
        const t = e.touches[0];
        const key = pickItem(t.clientX, t.clientY);
        selectItemByKey(key);
        if (!key) {
          gestureRef.current = { mode: 'none' };
          return;
        }

        updatePlaneToAnchor();
        const raycaster = buildRayFromClient(t.clientX, t.clientY);
        if (!raycaster) return;
        const hit = tmpVec3ARef.current;
        if (!raycaster.ray.intersectPlane(planeRef.current, hit)) return;
        const anchor = anchorRef.current;
        if (!anchor) return;
        const local = anchor.worldToLocal(hit.clone());

        const item = itemsRef.current.find((i) => i.key === key);
        if (!item) return;

        const offset = item.group.position.clone().sub(local);
        gestureRef.current = { mode: 'drag', pointerId: t.identifier, offsetLocal: offset };
        return;
      }

      if (e.touches.length >= 2) {
        const a = e.touches[0];
        const b = e.touches[1];
        const key = selectedKeyRef.current;
        if (!key) return;
        const item = itemsRef.current.find((i) => i.key === key);
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
      if (stage !== 'active') return;
      if (!placedRef.current) return;
      if (e.touches.length === 0) return;
      e.preventDefault();

      const g = gestureRef.current;

      if (e.touches.length === 1 && g.mode === 'drag') {
        const t = e.touches[0];
        if (t.identifier !== g.pointerId) return;

        updatePlaneToAnchor();
        const raycaster = buildRayFromClient(t.clientX, t.clientY);
        if (!raycaster) return;
        const hit = tmpVec3ARef.current;
        if (!raycaster.ray.intersectPlane(planeRef.current, hit)) return;

        const anchor = anchorRef.current;
        if (!anchor) return;
        const local = anchor.worldToLocal(hit.clone());

        const key = selectedKeyRef.current;
        if (!key) return;
        const item = itemsRef.current.find((i) => i.key === key);
        if (!item) return;

        const next = local.add(g.offsetLocal);
        item.group.position.x = next.x;
        item.group.position.z = next.z;
        return;
      }

      if (e.touches.length >= 2 && g.mode === 'pinch') {
        const a = e.touches[0];
        const b = e.touches[1];
        const key = selectedKeyRef.current;
        if (!key) return;
        const item = itemsRef.current.find((i) => i.key === key);
        if (!item) return;

        const dist = distance2(a, b);
        const scaleFactor = g.startDistance > 0 ? dist / g.startDistance : 1;
        const nextUserScale = clamp(g.startUserScale * scaleFactor, MIN_USER_SCALE, MAX_USER_SCALE);
        item.userScale = nextUserScale;
        item.group.scale.setScalar(item.baseScale * item.userScale);

        const ang = angle2(a, b);
        const delta = ang - g.startAngle;
        item.group.rotation.y = g.startRotationY + delta;
      }
    };

    const endGesture = () => {
      gestureRef.current = { mode: 'none' };
      touchIdsRef.current = [];
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
  }, [buildRayFromClient, pickItem, selectItemByKey, stage, updatePlaneToAnchor]);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    const onClick = (e: MouseEvent) => {
      if (stage !== 'active') return;
      // Ignore clicks that started on buttons.
      const target = e.target as HTMLElement | null;
      if (target && (target.closest('button') || target.closest('a'))) return;

      const key = pickItem(e.clientX, e.clientY);
      selectItemByKey(key);
    };

    overlay.addEventListener('click', onClick);
    return () => overlay.removeEventListener('click', onClick);
  }, [pickItem, selectItemByKey, stage]);

  const selectedLabel = useMemo(() => {
    if (!selectedKey) return null;
    const item = itemsRef.current.find((i) => i.key === selectedKey);
    return item?.objectName || null;
  }, [selectedKey]);

  return (
    <div ref={overlayRef} className="fixed inset-0 z-[100] bg-black/0" style={{ touchAction: 'none' }}>
      <div ref={containerRef} className="absolute inset-0" />

      {/* Top bar */}
      <div className="absolute top-[calc(env(safe-area-inset-top)+14px)] left-4 right-4 flex items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto">
          <button
            onClick={() => void endSession('user')}
            className="bg-white/80 backdrop-blur-md px-4 py-3 rounded-full shadow-soft text-soft-black text-sm font-medium hover:bg-white transition-colors"
          >
            Закрыть
          </button>
        </div>

        {selectedLabel && (
          <div className="pointer-events-none bg-white/70 backdrop-blur-md px-3 py-2 rounded-full text-xs text-soft-black/80 shadow-soft max-w-[60vw] truncate">
            {selectedLabel}
          </div>
        )}

        <div className="pointer-events-auto flex items-center gap-2">
          {stage === 'active' && (
            <button
              type="button"
              onClick={handleSnapshot}
              aria-label="Сделать снимок"
              disabled={isCapturing}
              className="bg-white/80 backdrop-blur-md p-3 rounded-full shadow-soft hover:bg-white transition-colors disabled:opacity-60"
            >
              <svg className="w-5 h-5 text-soft-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 7h3l2-2h6l2 2h3v12H4V7z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 17a4 4 0 100-8 4 4 0 000 8z"
                />
              </svg>
            </button>
          )}
          <button
            onClick={deleteSelected}
            disabled={!selectedKey}
            className="bg-white/80 backdrop-blur-md px-4 py-3 rounded-full shadow-soft text-soft-black text-sm font-medium hover:bg-white transition-colors disabled:opacity-40"
          >
            Удалить
          </button>
        </div>
      </div>

      {/* Center state */}
      {(stage === 'loading' || stage === 'ready-to-start' || stage === 'starting' || stage === 'placing' || stage === 'error' || stage === 'unsupported') && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center pointer-events-none">
          <div className="max-w-sm w-full bg-white/85 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-stone-beige/30 pointer-events-auto">
            {stage === 'loading' && (
              <>
                <div className="text-sm font-semibold text-soft-black">Загружаю объекты…</div>
                <div className="text-xs text-muted-gray mt-2">
                  {loadingProgress.total > 0
                    ? `${loadingProgress.loaded}/${loadingProgress.total}`
                    : 'Можно спокойно подождать пару секунд.'}
                </div>
              </>
            )}

            {stage === 'ready-to-start' && (
              <>
                <div className="text-sm font-semibold text-soft-black">AR‑примерка комплекта</div>
                <div className="text-xs text-muted-gray mt-2 leading-relaxed">
                  Наведите телефон на пол. Коснитесь экрана, чтобы поставить комплект. Затем можно двигать и масштабировать каждый предмет отдельно.
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => void startAr()}
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
                  Наведите телефон на пол — появится метка. Коснитесь экрана, чтобы поставить комплект.
                </div>
              </>
            )}

            {stage === 'unsupported' && (
              <>
                <div className="text-sm font-semibold text-soft-black">AR сейчас недоступен</div>
                <div className="text-xs text-muted-gray mt-2 leading-relaxed">{error}</div>
                <div className="mt-4">
                  <button
                    onClick={() => void endSession('user')}
                    className="w-full bg-brand-brown text-white px-6 py-4 rounded-xl shadow-lg font-medium hover:bg-brand-charcoal transition-colors"
                  >
                    Закрыть
                  </button>
                </div>
              </>
            )}

            {stage === 'error' && (
              <>
                <div className="text-sm font-semibold text-soft-black">Не получилось</div>
                <div className="text-xs text-muted-gray mt-2 leading-relaxed">{error || 'Попробуйте ещё раз позже.'}</div>
                <div className="mt-4">
                  <button
                    onClick={() => void endSession('user')}
                    className="w-full bg-brand-brown text-white px-6 py-4 rounded-xl shadow-lg font-medium hover:bg-brand-charcoal transition-colors"
                  >
                    Закрыть
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Calm hint while active */}
      {stage === 'active' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-white/70 backdrop-blur-md px-4 py-2 rounded-full text-xs text-soft-black/80 shadow-soft">
            1 палец — двигать • 2 пальца — масштаб/поворот
          </div>
        </div>
      )}
    </div>
  );
};

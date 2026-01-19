/**
 * useSceneGraph — Object management for AR scene
 */

import { useCallback, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { nanoid } from 'nanoid';
import type { PlacedItem, LoadingProgress } from '../types';

interface SceneObject {
    objectId: string;
    name: string;
    modelGlbUrl: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
}

interface UseSceneGraphResult {
    itemsRef: React.RefObject<PlacedItem[]>;
    selectedKey: string | null;
    loadingProgress: LoadingProgress;

    loadModels: (objects: SceneObject[]) => Promise<Map<string, THREE.Object3D>>;
    spawnObjects: (
        loadedModels: Map<string, THREE.Object3D>,
        objects: SceneObject[],
        anchor: THREE.Group
    ) => void;
    selectItem: (key: string | null) => void;
    deleteSelected: () => void;
}

export function useSceneGraph(): UseSceneGraphResult {
    const itemsRef = useRef<PlacedItem[]>([]);
    const selectedKeyRef = useRef<string | null>(null);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>({ loaded: 0, total: 0 });

    const loadModels = useCallback(async (objects: SceneObject[]): Promise<Map<string, THREE.Object3D>> => {
        const models = new Map<string, THREE.Object3D>();
        const loader = new GLTFLoader();

        const validObjects = objects.filter(o => o.modelGlbUrl);
        setLoadingProgress({ loaded: 0, total: validObjects.length });

        let loaded = 0;

        await Promise.all(
            validObjects.map(async (obj) => {
                try {
                    const gltf = await loader.loadAsync(obj.modelGlbUrl);
                    const model = gltf.scene;


                    // Normalize model: center and place on floor
                    model.updateMatrixWorld(true);
                    const bbox = new THREE.Box3().setFromObject(model);
                    const center = bbox.getCenter(new THREE.Vector3());
                    const size = bbox.getSize(new THREE.Vector3());

                    // Calculate normalization scale (to fit ~1 unit initially)
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const normalizationScale = maxDim > 0 ? 1 / maxDim : 1;
                    model.userData.__baseScale = normalizationScale;

                    model.position.sub(center);
                    model.position.y += size.y / 2;

                    // Store reference
                    models.set(obj.objectId, model);

                    loaded++;
                    setLoadingProgress({ loaded, total: validObjects.length });
                } catch (e) {
                    console.error(`[useSceneGraph] Failed to load model ${obj.objectId}:`, e);
                }
            })
        );

        return models;
    }, []);

    const spawnObjects = useCallback((
        loadedModels: Map<string, THREE.Object3D>,
        objects: SceneObject[],
        anchor: THREE.Group
    ) => {
        // Clear existing items
        itemsRef.current.forEach(item => {
            try { anchor.remove(item.group); } catch { }
        });
        itemsRef.current = [];

        objects.forEach((obj, idx) => {
            const model = loadedModels.get(obj.objectId);
            if (!model) return;

            const group = new THREE.Group();

            // Deep clone model with materials
            const clone = model.clone(true);
            clone.traverse((child) => {
                if ((child as any).isMesh) {
                    const mesh = child as THREE.Mesh;
                    // Clone material to allow independent highlighting/opacity
                    if (Array.isArray(mesh.material)) {
                        mesh.material = mesh.material.map(m => m.clone());
                    } else {
                        mesh.material = mesh.material.clone();
                    }
                }
            });
            group.add(clone);

            // Apply transforms
            const pos = obj.position || [0, 0, 0];
            const rot = obj.rotation || [0, 0, 0];

            // Calculate base scale (normalization * user override)
            const baseScale = (model.userData.__baseScale ?? 1) * (obj.scale ?? 1);

            group.position.set(pos[0], pos[1], pos[2]);
            group.rotation.set(
                (rot[0] * Math.PI) / 180,
                (rot[1] * Math.PI) / 180,
                (rot[2] * Math.PI) / 180
            );

            // Initial State for Drop Animation
            // Start at scale 0 and slightly elevated
            group.scale.setScalar(0.01);
            group.position.y += 0.5; // Start 50cm higher

            // Determine final position Y (usually 0 relative to anchor)
            const targetY = pos[1];

            // Tag all meshes with item key for raycasting
            const key = `item-${nanoid()}`;
            group.traverse((child) => {
                child.userData.itemKey = key;
            });

            anchor.add(group);
            anchor.visible = true;

            itemsRef.current.push({
                key,
                objectId: obj.objectId,
                group,
                baseScale: baseScale,
                userScale: 1, // Start logic at 1, visuals animate up
                objectName: obj.name,
            });

            // Trigger Drop Animation
            const startTime = Date.now();
            const animateDrop = () => {
                const now = Date.now();
                const progress = Math.min((now - startTime) / 600, 1); // 600ms duration

                // Spring easing: overshoot slightly
                // c3 = c1 + 1; p(x) = c3 * x^3 - c1 * x^2
                // Or elastic out: 
                const elasticOut = (t: number) => {
                    const p = 0.3;
                    return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
                };

                const ease = elasticOut(progress);

                // Scale up
                const currentScale = baseScale * ease;
                group.scale.setScalar(Math.max(0.01, currentScale));

                // Drop down
                // Simple lerp for position looks solid enough with elastic scale
                const dropProgress = Math.min((now - startTime) / 400, 1); // Drop faster
                const dropEase = 1 - Math.pow(1 - dropProgress, 3); // Cubic out
                group.position.y = pos[1] + 0.5 * (1 - dropEase);

                if (progress < 1) {
                    requestAnimationFrame(animateDrop);
                } else {
                    // Ensure final state
                    group.scale.setScalar(baseScale);
                    group.position.y = targetY;
                }
            };
            requestAnimationFrame(animateDrop);
        });

        // Auto-select first item if single object
        if (itemsRef.current.length === 1) {
            const firstKey = itemsRef.current[0].key;
            selectedKeyRef.current = firstKey;
            setSelectedKey(firstKey);
        }
    }, []);

    const selectItem = useCallback((key: string | null) => {
        selectedKeyRef.current = key;
        setSelectedKey(key);
    }, []);

    const deleteSelected = useCallback(() => {
        const key = selectedKeyRef.current;
        if (!key) return;

        const items = itemsRef.current;
        const idx = items.findIndex(i => i.key === key);
        if (idx < 0) return;

        const [removed] = items.splice(idx, 1);

        // Cleanup resources
        removed.group.parent?.remove(removed.group);
        removed.group.traverse((obj) => {
            if ((obj as any).isMesh) {
                const mesh = obj as THREE.Mesh;
                mesh.geometry.dispose();
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(m => m.dispose());
                } else {
                    mesh.material.dispose();
                }
            }
        });

        selectedKeyRef.current = null;
        setSelectedKey(null);
    }, []);

    return {
        itemsRef,
        selectedKey,
        loadingProgress,
        loadModels,
        spawnObjects,
        selectItem,
        deleteSelected,
    };
}

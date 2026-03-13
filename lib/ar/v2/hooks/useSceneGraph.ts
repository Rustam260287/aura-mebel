/**
 * useSceneGraph — Object management for AR scene
 */

import { useCallback, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { nanoid } from 'nanoid';
import type { PlacedItem, LoadingProgress } from '../types';
import { createContactShadow } from '../utils/contactShadow';

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
    selectedKeyRef: React.MutableRefObject<string | null>;
    selectedKey: string | null;
    loadingProgress: LoadingProgress;

    loadModels: (objects: SceneObject[], signal?: AbortSignal) => Promise<Map<string, THREE.Object3D>>;
    spawnObjects: (
        loadedModels: Map<string, THREE.Object3D>,
        objects: SceneObject[],
        anchor: THREE.Group
    ) => void;
    selectItem: (key: string | null) => void;
    deleteSelected: () => void;
    setItemColor: (key: string, hex: string) => void;
}

export function useSceneGraph(): UseSceneGraphResult {
    const itemsRef = useRef<PlacedItem[]>([]);
    const selectedKeyRef = useRef<string | null>(null);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [loadingProgress, setLoadingProgress] = useState<LoadingProgress>({ loaded: 0, total: 0 });

    const loadModels = useCallback(async (objects: SceneObject[], signal?: AbortSignal): Promise<Map<string, THREE.Object3D>> => {
        const models = new Map<string, THREE.Object3D>();
        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
        loader.setDRACOLoader(dracoLoader);

        const validObjects = objects.filter(o => o.modelGlbUrl);
        setLoadingProgress({ loaded: 0, total: validObjects.length });

        let loaded = 0;

        await Promise.all(
            validObjects.map(async (obj) => {
                try {
                    const res = await fetch(obj.modelGlbUrl, { signal });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const blob = await res.blob();

                    if (signal?.aborted) throw new Error('Aborted');

                    const objectUrl = URL.createObjectURL(blob);
                    let gltf;
                    try {
                        // Use loadAsync with objectUrl so GLTFLoader handles the GLB natively
                        gltf = await loader.loadAsync(objectUrl);
                    } finally {
                        URL.revokeObjectURL(objectUrl);
                    }

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
                } catch (e: any) {
                    if (e.name === 'AbortError' || e.message === 'Aborted' || signal?.aborted) {
                        throw e;
                    }
                    console.error(`[useSceneGraph] Failed to load model ${obj.objectId}:`, e);
                }
            })
        );

        dracoLoader.dispose();

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

            // Add Selection Footprint (rectangular outline based on XZ bounding box)
            const tempBbox = new THREE.Box3().setFromObject(clone);
            const tempSize = tempBbox.getSize(new THREE.Vector3());

            // Footprint dimensions with padding
            const footprintWidth = tempSize.x * 1.1;
            const footprintDepth = tempSize.z * 1.1;
            const cornerRadius = Math.min(footprintWidth, footprintDepth) * 0.08;

            // Create rounded rectangle shape
            const shape = new THREE.Shape();
            const w = footprintWidth / 2;
            const d = footprintDepth / 2;
            const r = cornerRadius;

            shape.moveTo(-w + r, -d);
            shape.lineTo(w - r, -d);
            shape.quadraticCurveTo(w, -d, w, -d + r);
            shape.lineTo(w, d - r);
            shape.quadraticCurveTo(w, d, w - r, d);
            shape.lineTo(-w + r, d);
            shape.quadraticCurveTo(-w, d, -w, d - r);
            shape.lineTo(-w, -d + r);
            shape.quadraticCurveTo(-w, -d, -w + r, -d);

            // Create outline only (not filled)
            const points = shape.getPoints(32);
            const outlineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const outlineMat = new THREE.LineBasicMaterial({
                color: 0xFFF8F0, // Warm white
                transparent: true,
                opacity: 0.8,
            });
            const selectionOutline = new THREE.LineLoop(outlineGeo, outlineMat);
            selectionOutline.rotation.x = -Math.PI / 2;
            selectionOutline.position.y = 0.005; // Slightly above floor
            selectionOutline.name = 'selectionRing'; // Keep name for compatibility
            selectionOutline.visible = false;
            group.add(selectionOutline);

            // Contact Shadow (iOS Quick Look style — soft blob shadow beneath object)
            const contactShadow = createContactShadow(tempSize.x, tempSize.z);
            contactShadow.name = 'contactShadow';
            group.add(contactShadow);

            // Hit Box (Invisible larger box for easier touch selection)
            // 1.5x larger than object to forgive imprecise taps
            const hitGeo = new THREE.BoxGeometry(tempSize.x * 1.5, tempSize.y, tempSize.z * 1.5);
            const hitMat = new THREE.MeshBasicMaterial({
                visible: true, // Must be visible for Raycaster to hit it
                transparent: true,
                opacity: 0.0, // Fully invisible to user
                depthWrite: false,
            });
            const hitBox = new THREE.Mesh(hitGeo, hitMat);
            hitBox.name = 'hitBox';
            // Center the hitbox on the model's bounding box center
            tempBbox.getCenter(hitBox.position);
            group.add(hitBox);

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

            // CRITICAL: Set final scale immediately
            // Pop-in animation is handled at ANCHOR level in XR animation loop
            // DO NOT use requestAnimationFrame here — it conflicts with XR's setAnimationLoop
            group.scale.setScalar(baseScale);

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
                userScale: 1,
                objectName: obj.name,
            });
        });

        // Auto-select first item if single object
        if (itemsRef.current.length === 1) {
            const firstItem = itemsRef.current[0];
            selectedKeyRef.current = firstItem.key;
            setSelectedKey(firstItem.key);
            // Show selection ring
            const ring = firstItem.group.getObjectByName('selectionRing');
            if (ring) ring.visible = true;
        }
    }, []);

    const selectItem = useCallback((key: string | null) => {
        selectedKeyRef.current = key;
        setSelectedKey(key);

        // Toggle selection ring visibility
        itemsRef.current.forEach(item => {
            const ring = item.group.getObjectByName('selectionRing');
            if (ring) {
                ring.visible = item.key === key;
            }
        });
    }, []);

    const setItemColor = useCallback((key: string, hex: string) => {
        const item = itemsRef.current.find(i => i.key === key);
        if (!item) return;

        const color = new THREE.Color(hex);
        item.group.traverse((child) => {
            if (!(child as any).isMesh) return;
            const mesh = child as THREE.Mesh;
            // Skip non-model meshes (hitBox, shadows)
            if (mesh.name === 'hitBox' || mesh.name === 'contactShadow') return;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((mat) => {
                if ((mat as any).isMeshStandardMaterial) {
                    (mat as THREE.MeshStandardMaterial).color.set(color);
                    mat.needsUpdate = true;
                }
            });
        });
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
        selectedKeyRef,
        selectedKey,
        loadingProgress,
        loadModels,
        spawnObjects,
        selectItem,
        deleteSelected,
        setItemColor,
    };
}

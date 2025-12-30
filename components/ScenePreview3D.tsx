'use client';

import React, { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Bounds, Environment, OrbitControls, useGLTF } from '@react-three/drei';
import type { SceneObjectTransform } from '../types';

type ModelRef = {
  id: string;
  modelGlbUrl?: string;
};

type ScenePreviewItem = SceneObjectTransform & {
  instanceKey: string;
  glbUrl: string;
};

const toRadians = (deg: number) => (deg * Math.PI) / 180;

type SceneItemProps = Omit<ScenePreviewItem, 'instanceKey'>;

const SceneItem: React.FC<SceneItemProps> = ({ glbUrl, position, rotation, scale }) => {
  const proxied = useMemo(() => `/api/proxy-model?url=${encodeURIComponent(glbUrl)}`, [glbUrl]);
  const gltf = useGLTF(proxied);
  const scene = useMemo(() => {
    const root = gltf.scene.clone(true);
    root.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(root);
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    // Center on (0,0,0) and put on "floor" (y=0) to reduce origin/pivot issues from DCC tools.
    root.position.sub(center);
    if (Number.isFinite(size.y) && size.y > 0) {
      root.position.y += size.y / 2;
    }
    return root;
  }, [gltf.scene]);

  const rotationRad = useMemo<[number, number, number]>(
    () => [toRadians(rotation[0]), toRadians(rotation[1]), toRadians(rotation[2])],
    [rotation],
  );

  return (
    <group position={position} rotation={rotationRad} scale={[scale, scale, scale]}>
      <primitive object={scene} />
    </group>
  );
};

interface ScenePreview3DProps {
  sceneObjects: SceneObjectTransform[];
  allObjects: ModelRef[];
  className?: string;
}

export const ScenePreview3D: React.FC<ScenePreview3DProps> = ({ sceneObjects, allObjects, className }) => {
  const items = useMemo(() => {
    const map = new Map<string, ModelRef>();
    for (const o of allObjects) map.set(o.id, o);
    return (sceneObjects || [])
      .map((entry, index) => {
        const obj = map.get(entry.objectId);
        const glbUrl = obj?.modelGlbUrl;
        if (!glbUrl) return null;
        return { ...entry, instanceKey: `${entry.objectId}:${index}`, glbUrl } satisfies ScenePreviewItem;
      })
      .filter((v): v is ScenePreviewItem => Boolean(v));
  }, [allObjects, sceneObjects]);

  return (
    <div className={className}>
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 40, near: 0.01, far: 200, position: [0, 1.4, 2.6] }}
        style={{ touchAction: 'pan-y', borderRadius: 16 }}
      >
        <color attach="background" args={['#fbfaf8']} />
        <ambientLight intensity={0.75} />
        <directionalLight position={[3, 5, 2]} intensity={0.9} />

        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.2}>
            <group>
              {items.map(({ instanceKey, ...item }) => (
                <SceneItem key={instanceKey} {...item} />
              ))}
            </group>
          </Bounds>
          <Environment preset="apartment" />
        </Suspense>

        <OrbitControls enablePan enableZoom enableRotate makeDefault />
      </Canvas>
    </div>
  );
};

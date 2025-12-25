import React, { useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

type SizeType = 'compact' | 'standard' | 'grand';
type StyleType = 'soft' | 'modern' | 'classic';

interface FurniturePreviewProps {
  config: {
    type: string;
    size: SizeType;
    style: StyleType;
  };
}

const SCALE_MAP: Record<SizeType, number> = {
  compact: 0.85,
  standard: 1,
  grand: 1.15,
};

const MATERIAL_MAP: Record<StyleType, string> = {
  soft: '#EBE5D9',
  modern: '#7D7D7D',
  classic: '#59443B',
};

const Model = ({ config }: { config: FurniturePreviewProps['config'] }) => {
  const { scene } = useGLTF('/models/sofa_base.glb');
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useMemo(() => {
    const targetScale = SCALE_MAP[config.size];
    clonedScene.scale.set(targetScale, targetScale, targetScale);

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          (mesh.material as THREE.MeshStandardMaterial).color.set(
            MATERIAL_MAP[config.style]
          );
        }
      }
    });
  }, [clonedScene, config]);

  return <primitive object={clonedScene} />;
};

export const FurniturePreview: React.FC<FurniturePreviewProps> = ({ config }) => {
  return (
    <div className="w-full h-full bg-warm-white">
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 40, position: [0, 1.4, 3] }}
        shadows={false}
      >
        <color attach="background" args={['#FAF9F7']} />

        {/* Мягкий нейтральный свет */}
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 4]} intensity={0.6} />

        {/* Спокойное окружение без сцены */}
        <Environment preset="apartment" />

        <Suspense fallback={null}>
          <Model config={config} />
        </Suspense>
      </Canvas>
    </div>
  );
};

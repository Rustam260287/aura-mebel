import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Stage, PresentationControls } from '@react-three/drei';
import * as THREE from 'three';

// Типы из вашего проекта
type SizeType = 'compact' | 'standard' | 'grand';
type StyleType = 'soft' | 'modern' | 'classic';

interface FurniturePreviewProps {
  config: {
    type: string;
    size: SizeType;
    style: StyleType;
  };
}

// Маппинг масштаба (вместо изменения геометрии)
const SCALE_MAP: Record<SizeType, number> = {
  compact: 0.85,
  standard: 1,
  grand: 1.15,
};

// Маппинг материалов (цвета для PBR)
const MATERIAL_MAP: Record<StyleType, string> = {
  soft: '#EBE5D9',   // Светлый беж
  modern: '#7D7D7D', // Серый
  classic: '#59443B', // Шоколад
};

const Model = ({ config }: { config: FurniturePreviewProps['config'] }) => {
  // Загружаем мастер-модель (в реале путь зависит от config.type)
  // Используем плейсхолдер, если модели нет
  const { scene } = useGLTF('/models/sofa_base.glb'); 
  
  // Клонируем сцену, чтобы не мутировать кэш
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Применяем изменения "на лету"
  useMemo(() => {
    const targetScale = SCALE_MAP[config.size];
    clonedScene.scale.set(targetScale, targetScale, targetScale);

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // Простая замена цвета материала (в реале - замена текстур)
        if (mesh.material) {
           // Создаем новый материал или меняем цвет существующего
           (mesh.material as THREE.MeshStandardMaterial).color.set(MATERIAL_MAP[config.style]);
        }
      }
    });
  }, [clonedScene, config]);

  return <primitive object={clonedScene} />;
};

export const FurniturePreview: React.FC<FurniturePreviewProps> = ({ config }) => {
  return (
    <div className="w-full h-full">
      <Canvas dpr={[1, 2]} camera={{ fov: 45 }} shadows>
        <color attach="background" args={['#F0F0F0']} />
        <PresentationControls speed={1.5} global zoom={0.7} polar={[-0.1, Math.PI / 4]}>
          <Stage environment="city" intensity={0.6} contactShadow={{ opacity: 0.7, blur: 2 }}>
            <React.Suspense fallback={null}>
               <Model config={config} />
            </React.Suspense>
          </Stage>
        </PresentationControls>
      </Canvas>
    </div>
  );
};

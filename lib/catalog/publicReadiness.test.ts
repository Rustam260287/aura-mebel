import { isProductionReadyObject, isProductionReadyScene } from './publicReadiness';
import type { ObjectPublic, ScenePresetPublic } from '../../types';

describe('publicReadiness', () => {
  const readyObject: ObjectPublic = {
    id: 'obj-1',
    name: 'Aura Sofa',
    imageUrls: ['https://example.com/sofa.jpg'],
    modelGlbUrl: 'https://example.com/sofa.glb',
    modelUsdzUrl: 'https://example.com/sofa.usdz',
    has3D: true,
    status: 'ready',
  };

  it('accepts production-ready objects', () => {
    expect(isProductionReadyObject(readyObject)).toBe(true);
  });

  it('rejects objects without usable media', () => {
    expect(isProductionReadyObject({ ...readyObject, imageUrls: ['/placeholder.svg'] })).toBe(false);
    expect(isProductionReadyObject({ ...readyObject, modelGlbUrl: undefined, modelUsdzUrl: undefined, has3D: false })).toBe(false);
  });

  it('accepts only scenes fully composed of ready GLB objects', () => {
    const scene: ScenePresetPublic = {
      id: 'scene-1',
      title: 'Living',
      objects: [{ objectId: 'obj-1', position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 }],
    };
    const map = new Map<string, ObjectPublic>([['obj-1', readyObject]]);
    expect(isProductionReadyScene(scene, map)).toBe(true);
    map.set('obj-1', { ...readyObject, modelGlbUrl: undefined });
    expect(isProductionReadyScene(scene, map)).toBe(false);
  });
});

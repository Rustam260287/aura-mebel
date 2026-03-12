import type { ObjectPublic, ScenePresetPublic } from '../../types';

const hasUsableText = (value: string | undefined): boolean => Boolean(value && value.trim());

const hasUsableImage = (value: string | undefined): boolean => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.includes('placeholder')) return false;
  return true;
};

export const isProductionReadyObject = (object: ObjectPublic): boolean => {
  if (object.status !== 'ready') return false;
  if (!hasUsableText(object.id) || !hasUsableText(object.name)) return false;
  if (!Array.isArray(object.imageUrls) || !object.imageUrls.some((url) => hasUsableImage(url))) return false;
  if (!object.has3D && !object.modelGlbUrl && !object.modelUsdzUrl) return false;
  return true;
};

export const isProductionReadySceneObject = (object: ObjectPublic | undefined): object is ObjectPublic => {
  if (!object) return false;
  if (!isProductionReadyObject(object)) return false;
  if (!hasUsableText(object.modelGlbUrl)) return false;
  return true;
};

export const isProductionReadyScene = (
  scene: ScenePresetPublic,
  objectsById: Map<string, ObjectPublic>,
): boolean => {
  if (!hasUsableText(scene.id) || !hasUsableText(scene.title)) return false;
  if (!Array.isArray(scene.objects) || scene.objects.length === 0) return false;
  return scene.objects.every((entry) => isProductionReadySceneObject(objectsById.get(entry.objectId)));
};

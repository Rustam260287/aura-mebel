import type { SceneObjectTransform, ScenePresetAdmin, ScenePresetPublic } from '../types';

type UnknownRecord = Record<string, unknown>;

const asString = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);

const asRecord = (value: unknown): UnknownRecord | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : undefined;

const asNumber = (value: unknown, fallback = 0): number => {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

const asTuple3 = (value: unknown, fallback: [number, number, number]): [number, number, number] => {
  if (!Array.isArray(value) || value.length < 3) return fallback;
  const x = asNumber(value[0], fallback[0]);
  const y = asNumber(value[1], fallback[1]);
  const z = asNumber(value[2], fallback[2]);
  return [x, y, z];
};

const asTransforms = (value: unknown): SceneObjectTransform[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry): SceneObjectTransform | null => {
      const rec = asRecord(entry);
      if (!rec) return null;
      const objectId = asString(rec.objectId).trim();
      if (!objectId) return null;
      const position = asTuple3(rec.position, [0, 0, 0]);
      const rotation = asTuple3(rec.rotation, [0, 0, 0]);
      const scale = asNumber(rec.scale, 1);
      return {
        objectId,
        position,
        rotation,
        scale: Number.isFinite(scale) && scale > 0 ? scale : 1,
      };
    })
    .filter((v): v is SceneObjectTransform => Boolean(v));
};

export const toScenePresetPublic = (data: unknown, id: string): ScenePresetPublic => {
  const record = asRecord(data) ?? {};
  return {
    id,
    title: asString(record.title).trim() || 'Без названия',
    description: asString(record.description).trim() || undefined,
    objects: asTransforms(record.objects),
    coverImageUrl: asString(record.coverImageUrl).trim() || undefined,
    createdAt: asString(record.createdAt).trim() || undefined,
    updatedAt: asString(record.updatedAt).trim() || undefined,
  };
};

export const toScenePresetAdmin = (data: unknown, id: string): ScenePresetAdmin => {
  const record = asRecord(data) ?? {};
  const statusRaw = asString(record.status).trim();
  const status = statusRaw === 'draft' || statusRaw === 'ready' || statusRaw === 'archived' ? statusRaw : undefined;
  return {
    ...toScenePresetPublic(record, id),
    status,
  };
};


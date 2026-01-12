import type { ObjectPublic, ObjectStatus } from '../types';

type UnknownRecord = Record<string, unknown>;

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.length > 0) : [];

const asRecord = (value: unknown): UnknownRecord | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : undefined;

export const toPublicObject = (data: unknown, id: string): ObjectPublic => {
  const record = asRecord(data) ?? {};

  const rawModelGlbUrl = asString(record.modelGlbUrl) || asString(record.model3dUrl);
  const rawModelUsdzUrl = asString(record.modelUsdzUrl) || asString(record.model3dIosUrl);

  const modelsRecord = asRecord(record.models);
  const modelsGlbUrl = asString(modelsRecord?.glb);
  const modelsUsdzUrl = asString(modelsRecord?.usdz);

  const getUrlExtension = (url: string) => {
    const cleaned = url.split('#')[0];
    try {
      const parsed = new URL(cleaned);
      const lastSegment = parsed.pathname.split('/').pop() || '';
      const decoded = decodeURIComponent(lastSegment);
      return decoded.split('.').pop()?.toLowerCase();
    } catch {
      const withoutQuery = cleaned.split('?')[0];
      const lastSegment = withoutQuery.split('/').pop() || '';
      try {
        const decoded = decodeURIComponent(lastSegment);
        return decoded.split('.').pop()?.toLowerCase();
      } catch {
        return lastSegment.split('.').pop()?.toLowerCase();
      }
    }
  };

  const pickGlbUrl = (...candidates: string[]) => {
    for (const candidate of candidates) {
      if (!candidate) continue;
      const ext = getUrlExtension(candidate);
      if (ext === 'usdz') continue;
      return candidate;
    }
    return '';
  };

  const pickUsdzUrl = (...candidates: string[]) => {
    for (const candidate of candidates) {
      if (!candidate) continue;
      const ext = getUrlExtension(candidate);
      if (ext === 'glb') continue;
      return candidate;
    }
    return '';
  };

  const modelGlbUrl = pickGlbUrl(rawModelGlbUrl, modelsGlbUrl);
  const modelUsdzUrl = pickUsdzUrl(rawModelUsdzUrl, modelsUsdzUrl);

  const categoryVal = asString(record.category);
  const typeVal = asString(record.objectType);
  const categoryCheck = (categoryVal || typeVal || '').toLowerCase();

  const SOFT_CATEGORIES = ['мягкая мебель', 'sofa', 'диваны', 'кресла', 'пуфы'];
  const isSoft = SOFT_CATEGORIES.some(c => categoryCheck.includes(c));

  const rawStatus = asString(record.status) as ObjectStatus | '';

  // Soft furniture: respect existing status. Others: force draft.
  // Exception: if rawStatus is explicitly 'draft'/'archived', keep it.
  const status: ObjectStatus = isSoft
    ? (rawStatus === 'draft' || rawStatus === 'archived' ? rawStatus : 'ready')
    : 'draft';

  return {
    id,
    name: asString(record.name),
    category: categoryVal,
    objectType: typeVal || categoryVal || undefined,
    imageUrls: asStringArray(record.imageUrls),
    description: asString(record.description) || undefined,
    modelGlbUrl: modelGlbUrl || undefined,
    modelUsdzUrl: modelUsdzUrl || undefined,
    has3D: Boolean(modelGlbUrl || modelUsdzUrl),
    status,
  };
};

import type { ObjectAdmin, ObjectStatus } from '../types';

type UnknownRecord = Record<string, unknown>;

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.length > 0) : [];

const asRecord = (value: unknown): UnknownRecord | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : undefined;

const normalizeStatus = (value: unknown): ObjectStatus => {
  if (value === 'ready' || value === 'archived' || value === 'draft') return value;
  return 'draft';
};

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

export const toAdminObject = (data: unknown, id: string): ObjectAdmin => {
  const record = asRecord(data) ?? {};

  const rawModelGlbUrl = asString(record.modelGlbUrl) || asString(record.model3dUrl);
  const rawModelUsdzUrl = asString(record.modelUsdzUrl) || asString(record.model3dIosUrl);

  const modelsRecord = asRecord(record.models);
  const modelsGlbUrl = asString(modelsRecord?.glb);
  const modelsUsdzUrl = asString(modelsRecord?.usdz);

  const modelGlbUrl = pickGlbUrl(rawModelGlbUrl, modelsGlbUrl) || undefined;
  const modelUsdzUrl = pickUsdzUrl(rawModelUsdzUrl, modelsUsdzUrl) || undefined;
  const modelProcessing = (asRecord(record.modelProcessing) as any) || undefined;

  return {
    id,
    name: asString(record.name),
    objectType: asString(record.objectType) || asString(record.category) || undefined,
    description: asString(record.description) || undefined,
    status: normalizeStatus(record.status),
    imageUrls: asStringArray(record.imageUrls),
    modelGlbUrl,
    modelUsdzUrl,
    has3D: Boolean(modelGlbUrl || modelUsdzUrl),
    modelProcessing,
    tags: asStringArray(record.tags),
    styleTags: asStringArray(record.styleTags),
    materialTags: asStringArray(record.materialTags),
    colorTags: asStringArray(record.colorTags),
    formTags: asStringArray(record.formTags),
    specs: asRecord(record.specs) as Record<string, string> | undefined,
    upscaledImageUrl: typeof record.upscaledImageUrl === 'string' ? record.upscaledImageUrl : undefined,
    details: typeof record.details === 'object' ? (record.details as any) : undefined,
    isConfigurable: typeof record.isConfigurable === 'boolean' ? record.isConfigurable : undefined,
    configurationOptions: Array.isArray(record.configurationOptions)
      ? (record.configurationOptions as any)
      : undefined,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : undefined,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : undefined,
  };
};

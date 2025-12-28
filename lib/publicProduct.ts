import type { Product } from '../types';

type UnknownRecord = Record<string, unknown>;

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string' && v.length > 0) : [];

const asRecord = (value: unknown): UnknownRecord | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : undefined;

export const toPublicProduct = (data: unknown, id: string): Product => {
  const record = asRecord(data) ?? {};

  const model3dUrl = asString(record.model3dUrl);
  const model3dIosUrl = asString(record.model3dIosUrl);

  return {
    id,
    name: asString(record.name),
    category: asString(record.category),
    imageUrls: asStringArray(record.imageUrls),
    description: asString(record.description),
    seoDescription: typeof record.seoDescription === 'string' ? record.seoDescription : undefined,
    videoUrl: typeof record.videoUrl === 'string' ? record.videoUrl : undefined,
    model3dUrl: model3dUrl || undefined,
    model3dIosUrl: model3dIosUrl || undefined,
    has3D: Boolean(model3dUrl || model3dIosUrl),
    upscaledImageUrl: typeof record.upscaledImageUrl === 'string' ? record.upscaledImageUrl : undefined,
    tags: asStringArray(record.tags),
    styleTags: asStringArray(record.styleTags),
    materialTags: asStringArray(record.materialTags),
    colorTags: asStringArray(record.colorTags),
    formTags: asStringArray(record.formTags),
    specs: asRecord(record.specs) as Record<string, string> | undefined,
    details: typeof record.details === 'object' ? (record.details as any) : undefined,
    isConfigurable: typeof record.isConfigurable === 'boolean' ? record.isConfigurable : undefined,
    configurationOptions: Array.isArray(record.configurationOptions)
      ? (record.configurationOptions as any)
      : undefined,
  };
};


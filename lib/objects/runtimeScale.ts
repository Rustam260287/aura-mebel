const MIN_OBJECT_RUNTIME_SCALE = 0.9;
const MAX_OBJECT_RUNTIME_SCALE = 1.1;

export const normalizeObjectRuntimeScale = (value: unknown): number | null => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.min(MAX_OBJECT_RUNTIME_SCALE, Math.max(MIN_OBJECT_RUNTIME_SCALE, value));
};

export const parseObjectRuntimeScale = (value: unknown): number | null => {
  if (typeof value === 'string') {
    return normalizeObjectRuntimeScale(Number.parseFloat(value));
  }

  if (Array.isArray(value) && value.length > 0) {
    return parseObjectRuntimeScale(value[0]);
  }

  return normalizeObjectRuntimeScale(value);
};

export const formatModelViewerScale = (value: number | null | undefined): string => {
  const normalized = normalizeObjectRuntimeScale(value);
  const scale = normalized ?? 1;
  return `${scale} ${scale} ${scale}`;
};

export interface SavedWizardConfig {
  id: string;
  signature: string;
  objectId: string;
  objectName: string;
  objectImageUrl?: string;
  objectType: string;
  mood: string;
  presence: string;
  scale: number;
  summary: string;
  savedAt: string;
}

export interface SavedRedesign {
  id: string;
  signature: string;
  objectId?: string;
  objectName: string;
  objectImageUrl?: string;
  objectType: string;
  style: string;
  mood: string;
  summary: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  savedAt: string;
}

export type SavedWizardConfigInput = Omit<SavedWizardConfig, 'id' | 'signature' | 'savedAt'>;
export type SavedRedesignInput = Omit<SavedRedesign, 'id' | 'signature' | 'savedAt'>;

const normalizeToken = (value: string | undefined | null): string => (value || '').trim().toLowerCase();

export const buildSavedWizardSignature = (input: SavedWizardConfigInput): string => {
  const scale = Number.isFinite(input.scale) ? input.scale.toFixed(2) : '1.00';
  return [
    normalizeToken(input.objectId),
    normalizeToken(input.objectType),
    normalizeToken(input.presence),
    normalizeToken(input.mood),
    scale,
  ].join(':');
};

export const buildSavedRedesignSignature = (input: SavedRedesignInput): string => {
  return [
    normalizeToken(input.objectId),
    normalizeToken(input.objectType),
    normalizeToken(input.style),
    normalizeToken(input.mood),
    normalizeToken(input.afterImageUrl || input.objectImageUrl),
  ].join(':');
};

export const sanitizeSavedImageUrl = (value: string | undefined | null): string | undefined => {
  if (!value) return undefined;
  const url = value.trim();
  if (!url) return undefined;
  if (url.startsWith('data:') || url.startsWith('blob:')) return undefined;
  return url;
};

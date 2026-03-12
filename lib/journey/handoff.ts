export const HANDOFF_REASONS = ['visual_help', 'fit_question', 'contact'] as const;

export type HandoffReason = (typeof HANDOFF_REASONS)[number];
export type LegacyHandoffReason = 'pricing' | 'purchase';
export type StoredHandoffReason = HandoffReason | LegacyHandoffReason;

export const parseStoredHandoffReason = (value: unknown): StoredHandoffReason | null => {
  if (value === 'visual_help' || value === 'fit_question' || value === 'contact') return value;
  if (value === 'pricing' || value === 'purchase') return value;
  return null;
};

export const normalizeHandoffReason = (value: unknown): HandoffReason | null => {
  const parsed = parseStoredHandoffReason(value);
  if (!parsed) return null;
  if (parsed === 'pricing') return 'visual_help';
  if (parsed === 'purchase') return 'contact';
  return parsed;
};

export const getHandoffReasonLabel = (value: StoredHandoffReason | null): string => {
  if (!value) return '—';
  if (value === 'visual_help') return 'Визуальный вопрос';
  if (value === 'fit_question') return 'Подойдёт в комнате';
  if (value === 'contact') return 'Связь';
  if (value === 'pricing') return 'Стоимость';
  return 'Как заказать';
};

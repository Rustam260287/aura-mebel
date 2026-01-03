import type { VisitorStage } from '../../types';

export const VISITOR_STAGE_ORDER: VisitorStage[] = [
  'VIEW',
  'THREE_D_AR',
  'ACTIVE_TRY',
  'FIXED',
  'READY_TO_TALK',
  'CONTACT_OBTAINED',
  'DIALOGUE',
  'DEAL_CLOSED',
];

export const VISITOR_STAGE_LABEL: Record<VisitorStage, string> = {
  VIEW: 'Просмотр',
  THREE_D_AR: '3D / AR',
  ACTIVE_TRY: 'Активная примерка',
  FIXED: 'Зафиксировал',
  READY_TO_TALK: 'Готов обсудить',
  CONTACT_OBTAINED: 'Контакт получен',
  DIALOGUE: 'Диалог',
  DEAL_CLOSED: 'Сделка',
};

export const normalizeVisitorStage = (value: unknown): VisitorStage | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toUpperCase();
  return (VISITOR_STAGE_ORDER as readonly string[]).includes(trimmed) ? (trimmed as VisitorStage) : null;
};

type InferInput = {
  stageManual?: unknown;
  lastContactAt?: unknown;
  lastHandoffAt?: unknown;
  lastSnapshotAt?: unknown;
  snapshotCount?: unknown;
  savedObjectIds?: unknown;
  lastArAt?: unknown;
  firstArAt?: unknown;
  lastArDurationSec?: unknown;
  last3dAt?: unknown;
  dialogueStartedAt?: unknown;
  dealClosedAt?: unknown;
};

type StageInference = {
  auto: VisitorStage;
  effective: VisitorStage;
  manual: VisitorStage | null;
  reasons: string[];
};

const hasTimestampLike = (value: unknown): boolean => {
  if (!value) return false;
  if (typeof value === 'string') return Boolean(value.trim());
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  if (typeof value === 'object') {
    const maybe = value as { toDate?: () => Date };
    if (typeof maybe.toDate === 'function') return true;
  }
  return false;
};

const countSaved = (value: unknown): number => {
  if (!Array.isArray(value)) return 0;
  return value.filter((v) => typeof v === 'string' && v.trim()).length;
};

const activeArThresholdSec = (): number => {
  const raw = Number(process.env.LABELCOM_STAGE_ACTIVE_AR_SEC || 45);
  return Number.isFinite(raw) && raw > 0 ? raw : 45;
};

export const inferVisitorStage = (data: InferInput): StageInference => {
  const manual = normalizeVisitorStage(data.stageManual);
  const reasons: string[] = [];

  const hasDeal = hasTimestampLike(data.dealClosedAt);
  const hasDialogue = hasTimestampLike(data.dialogueStartedAt);
  const hasContact = hasTimestampLike(data.lastContactAt);
  const hasHandoff = hasTimestampLike(data.lastHandoffAt);
  const snapshotCount =
    typeof data.snapshotCount === 'number' && Number.isFinite(data.snapshotCount) && data.snapshotCount > 0
      ? Math.round(data.snapshotCount)
      : 0;
  const hasSnapshot = snapshotCount > 0 || hasTimestampLike(data.lastSnapshotAt);
  const savedCount = countSaved(data.savedObjectIds);
  const hasSaved = savedCount > 0;
  const hasAr = hasTimestampLike(data.lastArAt) || hasTimestampLike(data.firstArAt) || hasTimestampLike(data.lastArDurationSec);
  const has3d = hasTimestampLike(data.last3dAt);

  let auto: VisitorStage = 'VIEW';

  if (hasDeal) {
    auto = 'DEAL_CLOSED';
    reasons.push('dealClosedAt');
  } else if (hasDialogue) {
    auto = 'DIALOGUE';
    reasons.push('dialogueStartedAt');
  } else if (hasContact) {
    auto = 'CONTACT_OBTAINED';
    reasons.push('lastContactAt');
  } else if (hasHandoff) {
    auto = 'READY_TO_TALK';
    reasons.push('lastHandoffAt');
  } else if (hasSnapshot || hasSaved) {
    auto = 'FIXED';
    if (hasSnapshot) reasons.push('snapshot');
    if (hasSaved) reasons.push('saved');
  } else if (hasAr) {
    const duration =
      typeof data.lastArDurationSec === 'number' && Number.isFinite(data.lastArDurationSec)
        ? data.lastArDurationSec
        : null;
    if (duration != null && duration >= activeArThresholdSec()) {
      auto = 'ACTIVE_TRY';
      reasons.push('arDuration');
    } else {
      auto = 'THREE_D_AR';
      reasons.push('ar');
    }
  } else if (has3d) {
    auto = 'THREE_D_AR';
    reasons.push('3d');
  }

  const effective = manual || auto;
  if (manual) reasons.push('manual');

  return { auto, effective, manual: manual || null, reasons };
};

export const compareStage = (a: VisitorStage, b: VisitorStage): number => {
  return VISITOR_STAGE_ORDER.indexOf(a) - VISITOR_STAGE_ORDER.indexOf(b);
};


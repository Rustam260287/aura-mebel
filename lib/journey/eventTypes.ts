export const JOURNEY_EVENT_TYPES = [
  'VIEW_OBJECT',
  'OPEN_3D',
  'START_AR',
  'FINISH_AR',
  'SAVE_OBJECT',
  'REMOVE_OBJECT',
  'OPEN_SAVED',
  'CONTACT_MANAGER',
  'HANDOFF_REQUESTED',
] as const;

export type JourneyEventType = (typeof JOURNEY_EVENT_TYPES)[number];

export type JourneyPlatform = 'ios' | 'android' | 'web';

export type JourneyMeta = {
  durationSec?: number;
  platform?: JourneyPlatform;
  handoff?: {
    reason: 'pricing' | 'purchase' | 'contact';
    objectId?: string;
    objectName?: string;
    actions: Array<'VIEW_3D' | 'AR_TRY' | 'SAVE'>;
    arDurationSec: number | null;
    lastQuestions: string[];
    timestamp: string;
  };
};

export type JourneyEventInput = {
  type: JourneyEventType;
  objectId?: string;
  meta?: JourneyMeta;
};

export const isJourneyEventType = (value: unknown): value is JourneyEventType => {
  return typeof value === 'string' && (JOURNEY_EVENT_TYPES as readonly string[]).includes(value);
};

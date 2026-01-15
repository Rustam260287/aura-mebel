export const JOURNEY_EVENT_TYPES = [
  'VIEW_OBJECT',
  'OPEN_3D',
  'START_AR',
  'FINISH_AR',
  'AR_SNAPSHOT_CREATED',
  'AR_SNAPSHOT_REQUESTED',
  'AR_SNAPSHOT_SHARED',
  'AR_UNAVAILABLE_WEBXR',
  'AR_UNAVAILABLE_BROWSER',
  'SAVE_OBJECT',
  'REMOVE_OBJECT',
  'OPEN_SAVED',
  'CONTACT_MANAGER',
  'HANDOFF_REQUESTED',
  'BROWSER_LIMITATION_DETECTED',
  'EXTERNAL_BROWSER_ACTION_CLICKED',
  'EXTERNAL_BROWSER_REDIRECT_TRIGGERED',
] as const;

export type JourneyEventType = (typeof JOURNEY_EVENT_TYPES)[number];

export type JourneyPlatform = 'ios' | 'android' | 'web';

export type JourneyMeta = {
  durationSec?: number;
  platform?: JourneyPlatform;
  arSessionId?: string;
  userAgent?: string;
  modelId?: string;
  reason?: string;
  snapshot?: {
    sessionId: string;
    storagePath: string;
    timestamp: number;
    modelId?: string;
    device?: 'android' | 'ios' | 'web';
    arMode?: 'webxr' | 'quick-look' | 'scene-viewer';
    width?: number;
    height?: number;
    orientation?: 'portrait' | 'landscape';
    partnerId?: string;
    url?: string;
  };
  handoff?: {
    reason: 'pricing' | 'purchase' | 'contact';
    objectId?: string;
    objectName?: string;
    actions?: Array<'VIEW_3D' | 'AR_TRY' | 'SAVE'>;
    arDurationSec?: number | null;
    lastQuestions?: string[];
    timestamp?: string;
    channel?: string;
  };
  limitations?: {
    reason: string;
    browser: string;
    platform: string;
    timestamp: string;
  };
  action?: {
    type: string;
    browser: string;
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

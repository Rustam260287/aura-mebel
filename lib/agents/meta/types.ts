export enum AssistantState {
    IDLE = 'IDLE',
    FIRST_VISIT = 'FIRST_VISIT',
    BROWSING = 'BROWSING',
    SELECTING = 'SELECTING',
    HESITATING = 'HESITATING',
    AR_PREPARING = 'AR_PREPARING',
    AR_ACTIVE = 'AR_ACTIVE', // equivalent to AR_SESSION
    SNAPSHOT_TAKEN = 'SNAPSHOT_TAKEN',
    SHARING = 'SHARING',
    POST_AR_REFLECTION = 'POST_AR_REFLECTION',
    READY_TO_CONTACT = 'READY_TO_CONTACT',
    CONTACT_HANDOFF = 'CONTACT_HANDOFF',
}

export type MetaEvent =
    | { type: 'USER_SELECT_OBJECT'; payload?: any }
    | { type: 'VIEW_IN_AR' }
    | { type: 'AR_STARTED' }
    | { type: 'AR_ENDED' }
    | { type: 'SNAPSHOT_TAKEN' }
    | { type: 'OPEN_OBJECT_FROM_DEEPLINK'; payload: { objectId: string } }
    | { type: 'REQUEST_SHARE_OBJECT'; payload: any }
    | { type: 'REQUEST_MANAGER_CONTACT'; payload?: any }
    | { type: 'USER_ENTERED_OBJECT'; payload?: any }
    | { type: 'TIME_TICK'; payload: { timeOnPage: number } }
    | { type: 'OPENED_3D' }
    | { type: 'OPENED_AR' }
    | { type: 'DISMISSED_NOTIFICATION'; payload: { type: string } }
    | { type: 'SCROLLED_GALLERY' }
    | { type: 'PHOTO_UPLOADED'; payload: { file: File } }
    | { type: 'RESET' };

export type NotificationType =
    | 'ONBOARDING_HINT'
    | 'AR_GUIDANCE'
    | 'CONFIDENCE_REINFORCEMENT'
    | 'SOFT_CTA'
    | 'CONTACT_SUGGESTION'
    | 'SHARE_SUGGESTION' // New
    | 'AR_HINT'
    | '3D_HINT'
    | 'SAVE_HINT'
    | 'POST_SHARE_REFLECTION'
    | 'SNAPSHOT_TAKEN';

export interface SessionHistory {
    pageEnterTimestamp: number;
    hasOpened3D: boolean;
    hasOpenedAR: boolean;
    hasShared: boolean; // New
    arRefusals: number;
    galleryScrolled: boolean;
    notificationsShown: Record<string, { shownAt: number; reason: string }>;
}

export interface ActionPlan {
    session: {
        state: AssistantState;
    };
    assistant?: {
        mode: 'chat' | 'toast' | 'hidden';
        content?: any;
        tone?: 'silent' | 'neutral' | 'supportive';
        chatSessionId?: number; // Unique per open, forces remount
    };
}

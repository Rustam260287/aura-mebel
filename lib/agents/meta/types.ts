export enum AssistantState {
    IDLE = 'IDLE',
    BROWSING = 'BROWSING',
    SELECTING = 'SELECTING',
    AR_PREPARING = 'AR_PREPARING',
    AR_ACTIVE = 'AR_ACTIVE',
    SNAPSHOT_TAKEN = 'SNAPSHOT_TAKEN',
    SHARING = 'SHARING',
    POST_AR_REFLECTION = 'POST_AR_REFLECTION',
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

export type NotificationType = 'AR_HINT' | '3D_HINT' | 'SAVE_HINT';

export interface SessionHistory {
    pageEnterTimestamp: number;
    hasOpened3D: boolean;
    hasOpenedAR: boolean;
    arRefusals: number; // Count of times user dismissed AR hint or failed to enter?
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
    };
}

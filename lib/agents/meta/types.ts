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
    | { type: 'REQUEST_MANAGER_CONTACT'; payload?: any }
    | { type: 'RESET' };

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

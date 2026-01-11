import { ActionPlan, AssistantState, MetaEvent } from './types';

export class MetaAgent {
    private currentState: AssistantState = AssistantState.IDLE;
    private sessionHistory: SessionHistory = {
        pageEnterTimestamp: Date.now(),
        hasOpened3D: false,
        hasOpenedAR: false,
        arRefusals: 0,
        galleryScrolled: false,
        notificationsShown: {}
    };

    public processEvent(event: MetaEvent): ActionPlan {
        let nextState = this.currentState;
        let assistantMode: 'chat' | 'toast' | 'hidden' = 'hidden';
        let content: any = undefined;

        // --- 1. Event Tracking & Session History Updates ---
        this.updateSessionHistory(event);

        // --- 2. Core State Machine Transitions ---
        switch (this.currentState) {
            case AssistantState.IDLE:
            case AssistantState.BROWSING:
                if (event.type === 'USER_SELECT_OBJECT' || event.type === 'USER_ENTERED_OBJECT') {
                    nextState = AssistantState.SELECTING;
                } else if (event.type === 'OPEN_OBJECT_FROM_DEEPLINK') {
                    nextState = AssistantState.SELECTING;
                    assistantMode = 'chat';
                    content = {
                        type: 'object_context',
                        payload: { objectId: event.payload.objectId, source: 'deeplink' }
                    };
                }
                break;

            case AssistantState.SELECTING:
                if (event.type === 'VIEW_IN_AR') {
                    nextState = AssistantState.AR_PREPARING;
                } else if (event.type === 'OPENED_3D') {
                    // Stay in SELECTING but track history
                } else if (event.type === 'RESET') {
                    nextState = AssistantState.IDLE;
                }
                break;

            case AssistantState.AR_PREPARING:
                if (event.type === 'AR_STARTED') {
                    nextState = AssistantState.AR_ACTIVE;
                }
                break;

            case AssistantState.AR_ACTIVE:
                if (event.type === 'SNAPSHOT_TAKEN') {
                    nextState = AssistantState.SNAPSHOT_TAKEN;
                } else if (event.type === 'AR_ENDED') {
                    nextState = AssistantState.POST_AR_REFLECTION;
                }
                break;

            case AssistantState.SNAPSHOT_TAKEN:
                if (event.type === 'AR_ENDED') {
                    nextState = AssistantState.POST_AR_REFLECTION;
                } else if (event.type === 'AR_STARTED') {
                    nextState = AssistantState.AR_ACTIVE;
                }
                break;

            case AssistantState.POST_AR_REFLECTION:
                if (event.type === 'USER_SELECT_OBJECT') {
                    nextState = AssistantState.SELECTING;
                } else if (event.type === 'RESET') {
                    nextState = AssistantState.IDLE;
                } else if (event.type === 'REQUEST_MANAGER_CONTACT') {
                    assistantMode = 'chat';
                    content = { type: 'handoff', payload: event.payload };
                } else if (event.type === 'REQUEST_SHARE_OBJECT') {
                    assistantMode = 'hidden';
                    content = { type: 'share_object', payload: event.payload };
                }
                break;

            default:
                break;
        }

        // --- 3. Notification Logic (TIME_TICK, etc.) ---
        // Only override if no explicit active action is taking place
        if (event.type === 'TIME_TICK') {
            const timeOnPage = event.payload.timeOnPage; // Passed from UI or calculated? 
            // Better to use internal calculation if possible, but event payload is safer sync.
            const internalTime = Date.now() - this.sessionHistory.pageEnterTimestamp;
            // Use the max of both to be safe
            const actualTime = Math.max(timeOnPage || 0, internalTime);

            if (this.shouldShowNotification('AR_HINT', actualTime)) {
                assistantMode = 'chat';
                content = {
                    text: "Хочешь посмотреть, как она будет в твоей комнате?",
                    type: 'hint',
                    notificationType: 'AR_HINT'
                };
                this.markNotificationShown('AR_HINT');
            }
        }

        // --- 4. Special Event Responses (Photo, Gallery) ---
        if (event.type === 'PHOTO_UPLOADED') {
            // Photo context response overrides state default
            assistantMode = 'chat';
            content = {
                type: 'photo_analysis',
                text: "Вижу светлую комнату и мягкий свет. Хочешь попробовать поставить сюда модель и посмотреть, как она будет ощущаться?",
                payload: { file: event.payload.file }
            };
        }

        // --- 5. Default Content for States (Fallback) ---
        // If content is still undefined, set default based on state
        if (!content) {
            switch (nextState) {
                case AssistantState.SELECTING:
                    // Silence by default unless interaction happens
                    // assistantMode = 'chat'; 
                    // content = { text: "..." }; 
                    // BUT requirement says "Silence".
                    // Only show introduction if just entered? 
                    // For now, keep it hidden/passive unless DEEPLINK or other trigger initiated it.
                    // If we moved from IDLE -> SELECTING via USER_SELECT_OBJECT, we might stay silent.
                    break;
                case AssistantState.AR_PREPARING:
                    assistantMode = 'toast';
                    content = { message: "Запускаю камеру..." };
                    break;
                case AssistantState.SNAPSHOT_TAKEN:
                    assistantMode = 'toast';
                    content = { message: "✅ Снимок сохранён", action: "share" };
                    break;
                case AssistantState.POST_AR_REFLECTION:
                    // Only set if we just arrived here? 
                    // We need to persist the bubble if user hasn't dismissed it.
                    // However, processEvent is stateless in return, UI holds state? 
                    // No, "MetaAgent returns decisions".
                    // If we are in POST_AR_REFLECTION, we should offer help.
                    assistantMode = 'chat';
                    content = { text: "Если захотите обсудить детали — мы на связи." };
                    break;
            }
        }

        // Handle MANAGER_CONTACT at global level if needed (e.g. from any state)
        if (event.type === 'REQUEST_MANAGER_CONTACT' && !content) {
            assistantMode = 'chat';
            content = { type: 'handoff', payload: event.payload };
        }

        this.currentState = nextState;

        return {
            session: {
                state: nextState,
            },
            assistant: {
                mode: assistantMode,
                content: content,
            },
        };
    }

    private updateSessionHistory(event: MetaEvent) {
        if (event.type === 'USER_ENTERED_OBJECT' || event.type === 'USER_SELECT_OBJECT') {
            // Reset for new object? 
            // "SessionHistory (per session)" - usually implies user session, but "timeOnPage" implies object page.
            // Let's reset page-specific metrics but keep global ones if needed.
            // Requirement: "time on page of model". So reset on object switch.
            this.sessionHistory = {
                ...this.sessionHistory,
                pageEnterTimestamp: Date.now(),
                hasOpened3D: false,
                hasOpenedAR: false,
                notificationsShown: {} // Reset notifications for new object? "Same notification type -> max ONCE per session". 
                // "Session" usually means App Session. If so, don't reset.
                // "Time on page" is specific. 
                // "If user already completed the action -> NEVER show".
                // Recommendation: Keep notificationsShown global (don't reset), but reset timeOnPage.
            };
        } else if (event.type === 'OPENED_3D') {
            this.sessionHistory.hasOpened3D = true;
        } else if (event.type === 'OPENED_AR' || event.type === 'AR_STARTED') {
            this.sessionHistory.hasOpenedAR = true;
        } else if (event.type === 'SCROLLED_GALLERY') {
            this.sessionHistory.galleryScrolled = true;
        } else if (event.type === 'DISMISSED_NOTIFICATION') {
            if (event.payload.type === 'AR_HINT') {
                this.sessionHistory.arRefusals += 1;
            }
            this.sessionHistory.notificationsShown[event.payload.type] = {
                shownAt: Date.now(),
                reason: 'dismissed' // Mark as interacting so we don't show again if not already marked? 
                // Actually logic says "If user dismissed notification -> NEVER retry".
                // We already mark it as shown when we show it.
                // But this confirms refusal.
            };
        }
    }

    private shouldShowNotification(type: NotificationType, timeOnPageMs: number): boolean {
        // 1. Check if already shown
        if (this.sessionHistory.notificationsShown[type]) return false;

        // 2. Logic strictly based on requirements
        if (type === 'AR_HINT') {
            // IF timeOnPage > 12s AND 3D opened AND AR NOT opened AND refusals = 0
            if (timeOnPageMs > 12000
                && this.sessionHistory.hasOpened3D
                && !this.sessionHistory.hasOpenedAR
                && this.sessionHistory.arRefusals === 0) {
                return true;
            }
        }

        return false;
    }

    private markNotificationShown(type: NotificationType) {
        this.sessionHistory.notificationsShown[type] = {
            shownAt: Date.now(),
            reason: 'logic_triggered'
        };
    }

    public getState(): AssistantState {
        return this.currentState;
    }
}

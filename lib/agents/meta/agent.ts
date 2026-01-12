import { ActionPlan, AssistantState, MetaEvent, SessionHistory, NotificationType } from './types';

export class MetaAgent {
    private currentState: AssistantState = AssistantState.IDLE;
    private currentMode: 'chat' | 'toast' | 'hidden' = 'hidden'; // State needed to persist visibility
    private sessionHistory: SessionHistory = {
        // ... (rest initialized in constructor or declaration)
        pageEnterTimestamp: Date.now(),
        hasOpened3D: false,
        hasOpenedAR: false,
        arRefusals: 0,
        galleryScrolled: false,
        notificationsShown: {}
    };

    // Cache last content to persist it across time ticks if chat is open
    private lastContent: any = undefined;

    public processEvent(event: MetaEvent): ActionPlan {
        console.log('[MetaAgent] Processing event:', event.type, (event as any).payload);

        let nextState = this.currentState;
        // Start with current mode/content to persist them by default
        let assistantMode = this.currentMode;
        let content = this.lastContent;

        // Reset content/mode on specific events or state changes if needed?
        // Actually, if we are 'hidden', content doesn't matter.
        // If we are 'chat', we want to keep showing 'content'.

        // --- 1. Event Tracking & Session History Updates ---
        this.updateSessionHistory(event);

        // --- 2. Handle Explicit UI Actions (Open/Close) ---
        if (event.type === 'REQUEST_MANAGER_CONTACT') {
            assistantMode = 'chat';
            content = { type: 'handoff', payload: event.payload };
        } else if (event.type === 'DISMISSED_NOTIFICATION' || event.type === 'RESET') {
            assistantMode = 'hidden';
            content = undefined;
        } else if (event.type === 'REQUEST_SHARE_OBJECT') {
            // Share logic might imply hidden or specific modal, keeping hidden for now as per original code
            assistantMode = 'hidden';
            content = { type: 'share_object', payload: event.payload };
        }

        // --- 3. Core State Machine Transitions ---
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
                } else if (event.type === 'RESET') {
                    nextState = AssistantState.IDLE;
                }
                break;

            case AssistantState.AR_PREPARING:
                if (event.type === 'AR_STARTED') {
                    nextState = AssistantState.AR_ACTIVE;
                }
                // While preparing, enforce toast
                if (nextState === AssistantState.AR_PREPARING) {
                    assistantMode = 'toast';
                    content = { message: "Запускаю камеру..." };
                }
                break;

            case AssistantState.AR_ACTIVE:
                if (event.type === 'SNAPSHOT_TAKEN') {
                    nextState = AssistantState.SNAPSHOT_TAKEN;
                } else if (event.type === 'AR_ENDED') {
                    nextState = AssistantState.POST_AR_REFLECTION;
                }
                // Enforce silence in AR
                if (nextState === AssistantState.AR_ACTIVE) {
                    assistantMode = 'hidden';
                }
                break;

            case AssistantState.SNAPSHOT_TAKEN:
                if (event.type === 'AR_ENDED') {
                    nextState = AssistantState.POST_AR_REFLECTION;
                } else if (event.type === 'AR_STARTED') {
                    nextState = AssistantState.AR_ACTIVE;
                }

                if (nextState === AssistantState.SNAPSHOT_TAKEN) {
                    assistantMode = 'toast';
                    content = { message: "✅ Снимок сохранён", action: "share" };
                }
                break;

            case AssistantState.POST_AR_REFLECTION:
                if (event.type === 'USER_SELECT_OBJECT') {
                    nextState = AssistantState.SELECTING;
                    // Reset mode when moving to new object?
                    assistantMode = 'hidden';
                    content = undefined;
                } else if (event.type === 'RESET') {
                    nextState = AssistantState.IDLE;
                    assistantMode = 'hidden';
                }

                // If we just entered POST_AR_REFLECTION (transition), show prompt
                if (this.currentState !== AssistantState.POST_AR_REFLECTION && nextState === AssistantState.POST_AR_REFLECTION) {
                    assistantMode = 'chat';
                    content = { text: "Если захотите обсудить детали — мы на связи." };
                }
                break;
        }

        // --- 4. Notification Logic (TIME_TICK) ---
        if (event.type === 'TIME_TICK') {
            // Do not interrupt if user is already chatting or in special mode
            // Unless it's a critical notification?
            // For now, only show hints if hidden
            if (assistantMode === 'hidden') {
                const internalTime = Date.now() - this.sessionHistory.pageEnterTimestamp;
                const actualTime = Math.max(event.payload?.timeOnPage || 0, internalTime);

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
        }

        // --- 5. Special Event Responses ---
        if (event.type === 'PHOTO_UPLOADED') {
            assistantMode = 'chat';
            content = {
                type: 'photo_analysis',
                text: "Вижу светлую комнату и мягкий свет. Хочешь попробовать поставить сюда модель и посмотреть, как она будет ощущаться?",
                payload: { file: event.payload.file }
            };
        }

        // Update internal state
        this.currentState = nextState;
        this.currentMode = assistantMode;
        this.lastContent = content;

        const plan: ActionPlan = {
            session: {
                state: nextState,
            },
            assistant: {
                mode: assistantMode,
                content: content,
            },
        };
        // console.log('[MetaAgent] Returning Plan:', assistantMode); // Reduce spam
        return plan;
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

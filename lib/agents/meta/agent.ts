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
        hasShared: false,
        notificationsShown: {}
    };

    // Cache last content to persist it across time ticks if chat is open
    private lastContent: any = undefined;
    private curatorProfile: any = null;

    public setCuratorProfile(profile: any) {
        this.curatorProfile = profile;
        console.log('[MetaAgent] Curator profile set:', profile);
    }

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
            // Use new card type
            content = { type: 'handoff_card', payload: event.payload };
        } else if (event.type === 'DISMISSED_NOTIFICATION') {
            assistantMode = 'hidden';
            content = undefined;
        } else if (event.type === 'RESET') {
            assistantMode = 'hidden';
            content = undefined;
            // Check for Post-Share Reflection
            if (this.sessionHistory.hasShared && !this.sessionHistory.notificationsShown['POST_SHARE_REFLECTION']) {
                assistantMode = 'chat';
                content = {
                    text: "Если появятся вопросы по размерам или доставке — я здесь.",
                    type: 'hint',
                    notificationType: 'POST_SHARE_REFLECTION'
                };
                this.markNotificationShown('POST_SHARE_REFLECTION');
            }
        } else if (event.type === 'USER_SELECT_OBJECT' || event.type === 'USER_ENTERED_OBJECT') {
            nextState = AssistantState.SELECTING;
            assistantMode = 'hidden';
            content = undefined;
        } else if (event.type === 'VIEW_IN_AR') {
            nextState = AssistantState.AR_PREPARING;
            assistantMode = 'hidden';
            content = undefined;
        } else if (event.type === 'AR_STARTED') {
            nextState = AssistantState.AR_ACTIVE;
            assistantMode = 'hidden';
            content = undefined;
        } else if (event.type === 'AR_ENDED') {
            nextState = AssistantState.POST_AR_REFLECTION;
            // Immediate "Share" suggestion
            assistantMode = 'chat';
            content = {
                text: "Классно смотрится! Хотите сохранить или отправить близким?",
                type: 'suggestion',
                notificationType: 'SHARE_SUGGESTION',
                action: 'share'
            };
            this.markNotificationShown('SHARE_SUGGESTION');
        } else if (event.type === 'PHOTO_UPLOADED') {
            assistantMode = 'chat';
            content = {
                type: 'photo_analysis',
                text: "Вижу светлую комнату и мягкий свет. Хочешь попробовать поставить сюда модель и посмотреть, как она будет ощущаться?",
                payload: { file: event.payload.file }
            };
        } else if (event.type === 'REQUEST_SHARE_OBJECT') {
            // Trigger sharing logic in UI (AssistantRenderer)
            assistantMode = 'hidden';
            content = { type: 'share_object', payload: event.payload };
        }

        // ...

        // --- 4. Notification Logic (TIME_TICK) ---
        if (event.type === 'TIME_TICK') {
            const internalTime = Date.now() - this.sessionHistory.pageEnterTimestamp;
            const actualTime = Math.max(event.payload?.timeOnPage || 0, internalTime);

            // Onboarding Hint (First Visit only, e.g. < 5s on page)
            if (actualTime > 2000 && actualTime < 10000 && this.currentState === AssistantState.IDLE) {
                if (this.shouldShowNotification('ONBOARDING_HINT', actualTime)) {
                    assistantMode = 'toast';
                    content = { message: "👆 Проведите пальцем, чтобы вращать", notificationType: 'ONBOARDING_HINT' };
                    this.markNotificationShown('ONBOARDING_HINT');
                }
            }

            // AR Guidance (Stuck in Preparing > 8s)
            if (this.currentState === AssistantState.AR_PREPARING && actualTime > 8000) {
                if (this.shouldShowNotification('AR_GUIDANCE', actualTime)) {
                    assistantMode = 'toast';
                    content = { message: "💡 Наведите камеру на пол и плавно подвигайте", notificationType: 'AR_GUIDANCE' };
                    this.markNotificationShown('AR_GUIDANCE');
                }
            }

            // Transition to HESITATING if idle too long
            if ((this.currentState === AssistantState.SELECTING || this.currentState === AssistantState.BROWSING)
                && actualTime > 15000) { // 15s threshold
                // Determine if we should really switch state or just keep internal track
            }

            // Only show hints if hidden
            if (assistantMode === 'hidden') {
                if (this.shouldShowNotification('SHARE_SUGGESTION', actualTime)) {
                    assistantMode = 'chat';
                    content = {
                        text: "Классно смотрится! Хотите сохранить или отправить близким?",
                        type: 'suggestion',
                        notificationType: 'SHARE_SUGGESTION',
                        action: 'share'
                    };
                    this.markNotificationShown('SHARE_SUGGESTION');
                } else if (this.shouldShowNotification('AR_HINT', actualTime)) {
                    assistantMode = 'chat';
                    content = {
                        text: "Хочешь посмотреть, как она будет в твоей комнате?",
                        type: 'hint',
                        notificationType: 'AR_HINT'
                    };
                    this.markNotificationShown('AR_HINT');
                } else if (this.shouldShowNotification('SOFT_CTA', actualTime)) {
                    assistantMode = 'chat';
                    content = {
                        text: "Эта модель отлично подходит для гостиной. Хотите примерить?",
                        type: 'hint',
                        notificationType: 'SOFT_CTA'
                    };
                    this.markNotificationShown('SOFT_CTA');
                } else if (this.shouldShowNotification('CONTACT_SUGGESTION', actualTime)) {
                    assistantMode = 'chat';

                    const profile = this.curatorProfile || {};
                    const name = profile.managerName || 'Куратор';
                    const isOnline = profile.availabilityStatus === 'online';

                    let text = `Если есть вопросы по размерам или доставке — я на связи.`;
                    if (isOnline) {
                        text = `${name} сейчас онлайн. Могу подсказать по размерам и материалам.`;
                    } else {
                        text = `${name} сейчас офлайн, но вы можете оставить вопрос — я отвечу утром.`;
                    }

                    content = {
                        text: text,
                        type: 'suggestion',
                        notificationType: 'CONTACT_SUGGESTION',
                        action: 'contact'
                    };
                    this.markNotificationShown('CONTACT_SUGGESTION');
                }
            }
        }

        // Final State Update & Return (Unified)
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
        return plan;
    }

    private updateSessionHistory(event: MetaEvent) {
        if (event.type === 'USER_ENTERED_OBJECT' || event.type === 'USER_SELECT_OBJECT') {
            this.sessionHistory = {
                ...this.sessionHistory,
                pageEnterTimestamp: Date.now(),
                hasOpened3D: false,
                hasOpenedAR: false,
                // Do NOT reset notificationsShown globally, but maybe per object we want some re-trigger?
                // For now, adhere to "Swiss Watch" -> don't spam.
                // notificationsShown: {} 
                hasShared: false
            };
        } else if (event.type === 'REQUEST_SHARE_OBJECT') {
            this.sessionHistory.hasShared = true;
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
                reason: 'dismissed'
            };
        }
    }

    private shouldShowNotification(type: NotificationType, timeOnPageMs: number): boolean {
        // 1. Check if already shown
        if (this.sessionHistory.notificationsShown[type]) return false;

        // 2. Logic strictly based on requirements
        if (type === 'ONBOARDING_HINT') {
            // Check local storage to ensure true "First Visit" behavior
            if (typeof window !== 'undefined' && window.localStorage.getItem('aura_onboarding_shown')) {
                return false;
            }
            return true; // Simple check, controlled by time in processEvent
        }

        if (type === 'AR_GUIDANCE') {
            return true; // Controlled by time in processEvent
        }

        if (type === 'SHARE_SUGGESTION') {
            // After AR closed, if not shared yet.
            // But we need to check if AR *was* opened.
            if (this.sessionHistory.hasOpenedAR
                && !this.sessionHistory.hasShared
                && this.currentState !== AssistantState.AR_ACTIVE
                && this.currentState !== AssistantState.AR_PREPARING
            ) {
                return true;
            }
        }
        if (type === 'AR_HINT') {
            // IF timeOnPage > 12s AND 3D opened AND AR NOT opened AND refusals = 0
            if (timeOnPageMs > 12000
                && this.sessionHistory.hasOpened3D
                && !this.sessionHistory.hasOpenedAR
                && this.sessionHistory.arRefusals === 0) {
                return true;
            }
        }

        if (type === 'SOFT_CTA') {
            // If user scrolled gallery AND hasn't opened 3D yet AND time > 20s
            // Encouragement to engage
            if (this.sessionHistory.galleryScrolled
                && !this.sessionHistory.hasOpened3D
                && timeOnPageMs > 20000) {
                return true;
            }
        }

        if (type === 'CONTACT_SUGGESTION') {
            // Prioritize Share. If Share not shown (or dismissed/done), then Contact.
            // If share is pending, return false.
            if (!this.sessionHistory.notificationsShown['SHARE_SUGGESTION']
                && this.sessionHistory.hasOpenedAR
                && !this.sessionHistory.hasShared) {
                return false;
            }

            // If user is clearly hesitating (long time, no AR convert)
            // time > 45s
            if (timeOnPageMs > 45000 && !this.sessionHistory.hasOpenedAR) {
                return true;
            }
            // Also show contact if AR was used but user is lingering after share/dismiss share?
            if (this.sessionHistory.hasOpenedAR && timeOnPageMs > 60000) {
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
        if (type === 'ONBOARDING_HINT' && typeof window !== 'undefined') {
            window.localStorage.setItem('aura_onboarding_shown', 'true');
        }
    }

    public getState(): AssistantState {
        return this.currentState;
    }
}

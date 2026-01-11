import { ActionPlan, AssistantState, MetaEvent } from './types';

export class MetaAgent {
    private currentState: AssistantState = AssistantState.IDLE;

    public processEvent(event: MetaEvent): ActionPlan {
        let nextState = this.currentState;
        let assistantMode: 'chat' | 'toast' | 'hidden' = 'hidden';
        let content: any = undefined;

        switch (this.currentState) {
            case AssistantState.IDLE:
            case AssistantState.BROWSING:
                if (event.type === 'USER_SELECT_OBJECT') {
                    nextState = AssistantState.SELECTING;
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
                break;

            case AssistantState.AR_ACTIVE:
                if (event.type === 'SNAPSHOT_TAKEN') {
                    nextState = AssistantState.SNAPSHOT_TAKEN;
                } else if (event.type === 'AR_ENDED') {
                    nextState = AssistantState.POST_AR_REFLECTION;
                }
                break;

            case AssistantState.SNAPSHOT_TAKEN:
                // Transition usually automatic or via UI confirmation, 
                // but if logic stays here, maybe a timer or explicit continue?
                // For now, if AR still active, it might stay or revert to AR_ACTIVE.
                // If snapshot taken, we show toast.
                // Let's assume user dismisses or takes another action.
                if (event.type === 'AR_ENDED') {
                    nextState = AssistantState.POST_AR_REFLECTION;
                } else if (event.type === 'AR_STARTED') {
                    // Re-entering capture mode
                    nextState = AssistantState.AR_ACTIVE;
                } else if (event.type === 'USER_SELECT_OBJECT') {
                    nextState = AssistantState.SELECTING;
                }
                break;

            case AssistantState.POST_AR_REFLECTION:
                if (event.type === 'USER_SELECT_OBJECT') {
                    nextState = AssistantState.SELECTING;
                } else if (event.type === 'RESET') {
                    nextState = AssistantState.IDLE;
                } else if (event.type === 'REQUEST_MANAGER_CONTACT') {
                    // Logic for Manager Handoff (ActionPlan override)
                    // State stays POST_AR_REFLECTION, but content changes.
                    assistantMode = 'chat';
                    content = {
                        type: 'handoff',
                        payload: event.payload
                    };
                    // Use a special return here or ensure the second switch doesn't overwrite it?
                    // The second switch overwrites 'content' based on 'nextState'.
                    // We should add a check in second switch or move ActionPlan generation logic.
                    // For now, let's modify the second switch to conditionally apply default content.
                }
                break;

            default:
                break;
        }

        // Determine ActionPlan based on NEW state
        // This ensures the plan always matches the state (source of truth)

        switch (nextState) {
            case AssistantState.IDLE:
                assistantMode = 'hidden';
                break;
            case AssistantState.BROWSING:
                assistantMode = 'chat';
                content = { text: "Чем я могу помочь с выбором?" };
                break;
            case AssistantState.SELECTING:
                assistantMode = 'chat';
                content = { text: "Отличный выбор. Хотите примерить в комнате?" };
                // In a real system, this text might come from a GenUI agent, 
                // but MetaAgent dictates it IS a chat moment.
                break;
            case AssistantState.AR_PREPARING:
                assistantMode = 'toast';
                content = { message: "Запускаю камеру..." };
                break;
            case AssistantState.AR_ACTIVE:
                assistantMode = 'hidden';
                break;
            case AssistantState.SNAPSHOT_TAKEN:
                assistantMode = 'toast';
                content = { message: "✅ Снимок сохранён", action: "share" };
                break;
            case AssistantState.POST_AR_REFLECTION:
                assistantMode = 'chat';
                if (!content) {
                    content = { text: "Как вам результат? Сохраним или попробуем что-то еще?" };
                }
                break;
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

    public getState(): AssistantState {
        return this.currentState;
    }
}

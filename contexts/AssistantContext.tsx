'use client';

import React, { createContext, useContext, useState, useMemo, useRef, useCallback } from 'react';
import { MetaAgent } from '../lib/agents/meta/agent';
import { ActionPlan, MetaEvent, AssistantState } from '../lib/agents/meta/types';

interface AssistantContextValue {
    actionPlan: ActionPlan;
    emitMetaEvent: (event: MetaEvent) => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export const AssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // MetaAgent is a logic class, we keep it in a ref to persist across renders
    const metaAgentRef = useRef<MetaAgent>(new MetaAgent());

    // We sync the ActionPlan to state to trigger re-renders
    const [actionPlan, setActionPlan] = useState<ActionPlan>({
        session: { state: AssistantState.IDLE },
        assistant: { mode: 'hidden' },
    });

    const emitMetaEvent = useCallback((event: MetaEvent) => {
        const newPlan = metaAgentRef.current.processEvent(event);
        setActionPlan(newPlan);
    }, []);

    const value = useMemo(
        () => ({
            actionPlan,
            emitMetaEvent,
        }),
        [actionPlan, emitMetaEvent]
    );

    return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
};

export const useAssistant = (): AssistantContextValue => {
    const context = useContext(AssistantContext);
    if (!context) {
        throw new Error('useAssistant must be used within AssistantProvider');
    }
    return context;
};

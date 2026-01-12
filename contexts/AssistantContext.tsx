'use client';

import React, { createContext, useContext, useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { MetaAgent } from '../lib/agents/meta/agent';
import { ActionPlan, MetaEvent, AssistantState } from '../lib/agents/meta/types';

interface AssistantContextValue {
    actionPlan: ActionPlan;
    emitMetaEvent: (event: MetaEvent) => void;
    curatorProfile?: any;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export const AssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // MetaAgent is a logic class, we keep it in a ref to persist across renders
    const metaAgentRef = useRef<MetaAgent>(new MetaAgent());
    const [curatorProfile, setCuratorProfile] = useState<any>(null);

    // We sync the ActionPlan to state to trigger re-renders
    const [actionPlan, setActionPlan] = useState<ActionPlan>({
        session: { state: AssistantState.IDLE },
        assistant: { mode: 'hidden' },
    });

    useEffect(() => {
        fetch('/api/handoff')
            .then((res) => res.json())
            .then((data) => {
                if (data && !data.error) {
                    metaAgentRef.current.setCuratorProfile(data);
                    setCuratorProfile(data);
                }
            })
            .catch((err) => console.error('Failed to fetch curator profile:', err));
    }, []);

    const emitMetaEvent = useCallback((event: MetaEvent) => {
        const newPlan = metaAgentRef.current.processEvent(event);
        setActionPlan(newPlan);
    }, []);

    const value = useMemo(
        () => ({
            actionPlan,
            emitMetaEvent,
            curatorProfile,
        }),
        [actionPlan, emitMetaEvent, curatorProfile]
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

'use client';

import React, { createContext, useContext, useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { MetaAgent } from '../lib/agents/meta/agent';
import { ActionPlan, MetaEvent, AssistantState } from '../lib/agents/meta/types';
import { CuratorProfile } from '../types/curator';

interface AssistantContextValue {
    actionPlan: ActionPlan;
    emitMetaEvent: (event: MetaEvent) => void;
    curatorProfile?: CuratorProfile | null;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export const AssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // MetaAgent is a logic class, we keep it in a ref to persist across renders
    const metaAgentRef = useRef<MetaAgent>(new MetaAgent());
    const [curatorProfile, setCuratorProfile] = useState<CuratorProfile | null>(null);

    // We sync the ActionPlan to state to trigger re-renders
    const [actionPlan, setActionPlan] = useState<ActionPlan>({
        session: { state: AssistantState.IDLE },
        assistant: { mode: 'hidden' },
    });

    useEffect(() => {
        const fetchCurator = async () => {
            try {
                // Fetch the active curator (selected by system logic)
                const res = await fetch('/api/public/curators/active');
                if (res.ok) {
                    const data = await res.json();
                    setCuratorProfile(data);
                    // Also notify the logic layer if needed, though mostly it's for UI
                    metaAgentRef.current.setCuratorProfile(data);
                }
            } catch (err) {
                console.error('Failed to fetch active curator:', err);
            }
        };
        fetchCurator();
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

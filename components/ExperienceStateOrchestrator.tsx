import React, { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useExperience } from '../contexts/ExperienceContext';
import { useAssistant } from '../contexts/AssistantContext';

export const ExperienceStateOrchestrator: React.FC = () => {
  const { state, emitEvent, data } = useExperience();
  const { addToast } = useToast();
  const { emitMetaEvent } = useAssistant();

  // 1. Map ExperienceState to MetaEvent
  useEffect(() => {
    switch (state) {
      case 'OBJECT_VIEW':
        // We keep both USER_SELECT_OBJECT and USER_ENTERED_OBJECT logic?
        // MetaAgent processes USER_SELECT_OBJECT to hide assistant, but USER_ENTERED_OBJECT to reset history.
        emitMetaEvent({ type: 'USER_SELECT_OBJECT', payload: { objectId: data.activeObjectId } });
        break;
      case 'AR_ACTIVE':
        emitMetaEvent({ type: 'AR_STARTED' });
        break;
      case 'AR_EXITED':
        emitMetaEvent({ type: 'AR_ENDED' });
        emitEvent({ type: 'RETURN_TO_BASE' });
        break;
      case 'IDLE':
        emitMetaEvent({ type: 'RESET' });
        break;
    }
  }, [state, emitMetaEvent, emitEvent, data.activeObjectId]);

  // 2. Global Time Tick for Assistant logic (hints, hesitations)
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const timeOnPage = Date.now() - startTime;
      // Only tick if not in AR_ACTIVE to avoid pointless logic processing?
      // Actually, MetaAgent needs ticks to show AR_GUIDANCE.
      emitMetaEvent({ type: 'TIME_TICK', payload: { timeOnPage } });
    }, 1000);

    return () => clearInterval(interval);
  }, [emitMetaEvent]);

  return null;
};

import React, { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useExperience } from '../contexts/ExperienceContext';
import { useAssistant } from '../contexts/AssistantContext';

export const ExperienceStateOrchestrator: React.FC = () => {
  const { state, emitEvent } = useExperience();
  const { addToast } = useToast();
  const { emitMetaEvent } = useAssistant();

  useEffect(() => {
    // Map ExperienceState to MetaEvent
    switch (state) {
      case 'OBJECT_VIEW':
        emitMetaEvent({ type: 'USER_SELECT_OBJECT' });
        break;
      case 'AR_ACTIVE':
        emitMetaEvent({ type: 'AR_STARTED' });
        break;
      case 'AR_EXITED':
        emitMetaEvent({ type: 'AR_ENDED' });
        emitEvent({ type: 'RETURN_TO_BASE' });
        break;
      case 'OBJECT_SAVED':
        emitMetaEvent({ type: 'SNAPSHOT_TAKEN' }); // Assuming save = snapshot for now, or generic save action
        emitEvent({ type: 'RETURN_TO_BASE' });
        break;
      case 'IDLE':
        emitMetaEvent({ type: 'RESET' });
        break;
    }
  }, [state, emitMetaEvent, emitEvent, addToast]);

  return null;
};

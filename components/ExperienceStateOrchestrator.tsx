"use client";

import React, { useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useExperience } from '../contexts/ExperienceContext';

export const ExperienceStateOrchestrator: React.FC = () => {
  const { state, emitEvent } = useExperience();
  const { addToast } = useToast();

  useEffect(() => {
    if (state === 'AR_EXITED') {
      emitEvent({ type: 'RETURN_TO_BASE' });
      return;
    }

    if (state === 'OBJECT_SAVED') {
      addToast('Объект сохранён. Можно сравнить его с другими или вернуться позже.', 'info', 4200);
      emitEvent({ type: 'RETURN_TO_BASE' });
    }
  }, [addToast, emitEvent, state]);

  return null;
};

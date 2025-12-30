'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { trackJourneyEvent } from '../lib/journey/client';
import type { JourneyMeta } from '../lib/journey/eventTypes';

export type ExperienceState =
  | 'IDLE'
  | 'GALLERY_VIEW'
  | 'OBJECT_VIEW'
  | 'THREE_D_ACTIVE'
  | 'AR_ACTIVE'
  | 'AR_EXITED'
  | 'OBJECT_SAVED'
  | 'ASSISTANT_OPEN'
  | 'HANDOFF_REQUESTED';

export type ExperienceData = {
  activeObjectId?: string;
  activeObjectName?: string;
  activeObjectType?: string;
  viewedObjects: string[];
  opened3dForActiveObject: boolean;
  arUsed: boolean;
  lastArDurationSec: number | null;
  savedActiveObject: boolean;
  lastQuestions: string[];
};

type BaseState = 'IDLE' | 'GALLERY_VIEW' | 'OBJECT_VIEW';

type HandoffContext = {
  objectId?: string;
  objectName?: string;
  actions: Array<'VIEW_3D' | 'AR_TRY' | 'SAVE'>;
  arDurationSec: number | null;
  lastQuestions: string[];
  timestamp: string;
};

type ExperienceEvent =
  | { type: 'SET_STATE'; state: ExperienceState }
  | { type: 'RETURN_TO_BASE' }
  | { type: 'ENTER_GALLERY' }
  | { type: 'VIEW_OBJECT'; objectId: string; name?: string; objectType?: string }
  | { type: 'VIEW_3D' }
  | { type: 'ENTER_3D' }
  | { type: 'EXIT_3D' }
  | { type: 'ENTER_AR' }
  | { type: 'EXIT_AR'; durationSec?: number }
  | { type: 'OBJECT_SAVED'; objectId?: string }
  | { type: 'OPEN_ASSISTANT' }
  | { type: 'CLOSE_ASSISTANT' }
  | { type: 'ASSISTANT_QUESTION'; text: string }
  | { type: 'HANDOFF_REQUESTED'; reason: 'pricing' | 'purchase' | 'contact'; lastUserMessage: string };

type ExperienceContextValue = {
  state: ExperienceState;
  data: ExperienceData;
  emitEvent: (event: ExperienceEvent) => void;
  getHandoffContext: (lastUserMessage: string) => { objectId?: string; context: HandoffContext };
};

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

const uniqPush = (list: string[], value: string) => {
  if (!value) return list;
  if (list.includes(value)) return list;
  return [...list, value];
};

const pushQuestion = (list: string[], value: string) => {
  const v = (value || '').trim();
  if (!v) return list;
  return [...list, v].slice(-3);
};

const isSavedObjectId = (objectId: string | undefined): boolean => {
  if (typeof window === 'undefined') return false;
  if (!objectId) return false;
  try {
    const raw = window.localStorage.getItem('label_saved_objects');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.includes(objectId);
  } catch {
    return false;
  }
};

export const ExperienceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ExperienceState>('IDLE');
  const [data, setData] = useState<ExperienceData>({
    viewedObjects: [],
    opened3dForActiveObject: false,
    arUsed: false,
    lastArDurationSec: null,
    savedActiveObject: false,
    lastQuestions: [],
  });

  const stateRef = useRef<ExperienceState>(state);
  const dataRef = useRef<ExperienceData>(data);
  stateRef.current = state;
  dataRef.current = data;

  const baseStateRef = useRef<BaseState>('IDLE');

  const getHandoffContext = useCallback(
    (lastUserMessage: string) => {
      const current = dataRef.current;
      const saved = current.savedActiveObject || isSavedObjectId(current.activeObjectId);
      const actions: Array<'VIEW_3D' | 'AR_TRY' | 'SAVE'> = [];
      if (current.opened3dForActiveObject) actions.push('VIEW_3D');
      if (current.arUsed) actions.push('AR_TRY');
      if (saved) actions.push('SAVE');

      const lastQuestions = pushQuestion(current.lastQuestions, lastUserMessage);
      return {
        objectId: current.activeObjectId,
        context: {
          objectId: current.activeObjectId,
          objectName: current.activeObjectName,
          actions,
          arDurationSec: current.lastArDurationSec,
          lastQuestions,
          timestamp: new Date().toISOString(),
        },
      };
    },
    [],
  );

  const emitEvent = useCallback(
    (event: ExperienceEvent) => {
      const currentState = stateRef.current;
      if (event.type === 'SET_STATE') {
        if (event.state === 'IDLE' || event.state === 'GALLERY_VIEW' || event.state === 'OBJECT_VIEW') {
          baseStateRef.current = event.state;
        }
        setState(event.state);
        return;
      }

      if (event.type === 'RETURN_TO_BASE') {
        setState(baseStateRef.current);
        return;
      }

      if (event.type === 'ENTER_GALLERY') {
        baseStateRef.current = 'GALLERY_VIEW';
        setState('GALLERY_VIEW');
        return;
      }

      if (event.type === 'VIEW_OBJECT') {
        baseStateRef.current = 'OBJECT_VIEW';
        setData((prev) => ({
          ...prev,
          activeObjectId: event.objectId,
          activeObjectName: event.name,
          activeObjectType: event.objectType,
          viewedObjects: uniqPush(prev.viewedObjects, event.objectId),
          savedActiveObject: isSavedObjectId(event.objectId),
          opened3dForActiveObject: false,
          lastArDurationSec: null,
          lastQuestions: [],
        }));
        setState('OBJECT_VIEW');
        return;
      }

      if (event.type === 'VIEW_3D') {
        setData((prev) => ({ ...prev, opened3dForActiveObject: true }));
        return;
      }

      if (event.type === 'ENTER_3D') {
        setState('THREE_D_ACTIVE');
        return;
      }

      if (event.type === 'EXIT_3D') {
        setState(baseStateRef.current || 'OBJECT_VIEW');
        return;
      }

      if (event.type === 'ENTER_AR') {
        setData((prev) => ({ ...prev, arUsed: true }));
        setState('AR_ACTIVE');
        return;
      }

      if (event.type === 'EXIT_AR') {
        baseStateRef.current = 'OBJECT_VIEW';
        const durationSec = event.durationSec;
        if (typeof durationSec === 'number' && Number.isFinite(durationSec) && durationSec >= 0) {
          setData((prev) => ({ ...prev, lastArDurationSec: Math.round(durationSec) }));
        }
        setState('AR_EXITED');
        return;
      }

      if (event.type === 'OBJECT_SAVED') {
        setData((prev) => {
          const objectId = event.objectId || prev.activeObjectId;
          if (!objectId) return prev;
          const isActive = objectId === prev.activeObjectId;
          return {
            ...prev,
            savedActiveObject: isActive ? true : prev.savedActiveObject,
          };
        });
        setState('OBJECT_SAVED');
        return;
      }

      if (event.type === 'OPEN_ASSISTANT') {
        if (currentState === 'THREE_D_ACTIVE' || currentState === 'AR_ACTIVE') return;
        if (currentState === 'GALLERY_VIEW' || currentState === 'OBJECT_VIEW' || currentState === 'IDLE') {
          baseStateRef.current = currentState;
        }
        setState('ASSISTANT_OPEN');
        return;
      }

      if (event.type === 'CLOSE_ASSISTANT') {
        setState(baseStateRef.current);
        return;
      }

      if (event.type === 'ASSISTANT_QUESTION') {
        setData((prev) => ({ ...prev, lastQuestions: pushQuestion(prev.lastQuestions, event.text) }));
        return;
      }

      if (event.type === 'HANDOFF_REQUESTED') {
        const payload = getHandoffContext(event.lastUserMessage);
        trackJourneyEvent({
          type: 'HANDOFF_REQUESTED',
          objectId: payload.objectId,
          meta: {
            handoff: {
              reason: event.reason,
              ...payload.context,
            },
          } satisfies JourneyMeta,
        });
        setState('HANDOFF_REQUESTED');
        return;
      }
    },
    [getHandoffContext],
  );

  const value = useMemo<ExperienceContextValue>(
    () => ({
      state,
      data,
      emitEvent,
      getHandoffContext,
    }),
    [data, emitEvent, getHandoffContext, state],
  );

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>;
};

export const useExperience = (): ExperienceContextValue => {
  const ctx = useContext(ExperienceContext);
  if (!ctx) {
    throw new Error('useExperience must be used within ExperienceProvider');
  }
  return ctx;
};

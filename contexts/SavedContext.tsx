"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { trackJourneyEvent } from '../lib/journey/client';
import { useExperience } from './ExperienceContext';
import {
  buildSavedRedesignSignature,
  buildSavedWizardSignature,
  sanitizeSavedImageUrl,
  type SavedRedesign,
  type SavedRedesignInput,
  type SavedWizardConfig,
  type SavedWizardConfigInput,
} from '../lib/saved/types';

interface SavedContextType {
  savedObjectIds: string[];
  savedWizardConfigs: SavedWizardConfig[];
  savedRedesigns: SavedRedesign[];
  addToSaved: (id: string) => void;
  removeFromSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  saveWizardConfig: (input: SavedWizardConfigInput) => { id: string; isNew: boolean };
  removeWizardConfig: (id: string) => void;
  isWizardConfigSaved: (signature: string) => boolean;
  saveRedesign: (input: SavedRedesignInput) => { id: string; isNew: boolean };
  removeRedesign: (id: string) => void;
  isRedesignSaved: (signature: string) => boolean;
  savedCount: number;
}

const STORAGE_KEY = 'label_saved_objects';
const WIZARD_STORAGE_KEY = 'label_saved_wizard_configs';
const REDESIGN_STORAGE_KEY = 'label_saved_redesigns';
const LEGACY_KEYS = ['aura_wishlist'];
const MAX_WIZARD_ITEMS = 24;
const MAX_REDESIGN_ITEMS = 12;

const SavedContext = createContext<SavedContextType | undefined>(undefined);

const loadStoredArray = <T,>(key: string): T[] => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

const buildLocalId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

export const SavedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedObjectIds, setSavedObjectIds] = useState<string[]>([]);
  const [savedWizardConfigs, setSavedWizardConfigs] = useState<SavedWizardConfig[]>([]);
  const [savedRedesigns, setSavedRedesigns] = useState<SavedRedesign[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const previousSavedIdsRef = useRef<string[] | null>(null);
  const { emitEvent } = useExperience();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSavedObjectIds(JSON.parse(raw));
      } else {
        for (const legacyKey of LEGACY_KEYS) {
          const legacyRaw = window.localStorage.getItem(legacyKey);
          if (legacyRaw) {
            const parsed = JSON.parse(legacyRaw);
            if (Array.isArray(parsed)) {
              setSavedObjectIds(parsed);
              window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            }
            break;
          }
        }
      }
      setSavedWizardConfigs(loadStoredArray<SavedWizardConfig>(WIZARD_STORAGE_KEY));
      setSavedRedesigns(loadStoredArray<SavedRedesign>(REDESIGN_STORAGE_KEY));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedObjectIds));
      } catch (error) {
        console.error(error);
      }
    }
  }, [savedObjectIds, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(savedWizardConfigs));
    } catch (error) {
      console.error(error);
    }
  }, [savedWizardConfigs, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      window.localStorage.setItem(REDESIGN_STORAGE_KEY, JSON.stringify(savedRedesigns));
    } catch (error) {
      console.error(error);
    }
  }, [savedRedesigns, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    const prev = previousSavedIdsRef.current;
    if (!prev) {
      previousSavedIdsRef.current = savedObjectIds;
      return;
    }

    const prevSet = new Set(prev);
    const nextSet = new Set(savedObjectIds);

    for (const id of nextSet) {
      if (!prevSet.has(id)) {
        trackJourneyEvent({ type: 'SAVE_OBJECT', objectId: id });
        if (typeof window !== 'undefined' && (window as any).ym) {
          (window as any).ym(106314786, 'reachGoal', 'add_to_saved');
        }
      }
    }

    for (const id of prevSet) {
      if (!nextSet.has(id)) {
        trackJourneyEvent({ type: 'REMOVE_OBJECT', objectId: id });
      }
    }

    previousSavedIdsRef.current = savedObjectIds;
  }, [savedObjectIds, isLoaded]);


  const addToSaved = useCallback((id: string) => {
    emitEvent({ type: 'OBJECT_SAVED', objectId: id });
    setSavedObjectIds(prev => [...new Set([...prev, id])]);
  }, [emitEvent]);

  const removeFromSaved = useCallback((id: string) => {
    setSavedObjectIds(prev => prev.filter(itemId => itemId !== id));
  }, []);

  const isSaved = useCallback((id: string) => {
    return savedObjectIds.includes(id);
  }, [savedObjectIds]);

  const saveWizardConfig = useCallback((input: SavedWizardConfigInput) => {
    const sanitizedInput: SavedWizardConfigInput = {
      ...input,
      objectImageUrl: sanitizeSavedImageUrl(input.objectImageUrl),
    };
    const signature = buildSavedWizardSignature(sanitizedInput);
    let response = { id: '', isNew: false };

    setSavedWizardConfigs((prev) => {
      const existing = prev.find((item) => item.signature === signature);
      if (existing) {
        response = { id: existing.id, isNew: false };
        return prev;
      }

      const next: SavedWizardConfig = {
        ...sanitizedInput,
        id: buildLocalId('wizard'),
        signature,
        savedAt: new Date().toISOString(),
      };

      response = { id: next.id, isNew: true };
      return [next, ...prev].slice(0, MAX_WIZARD_ITEMS);
    });

    return response;
  }, []);

  const removeWizardConfig = useCallback((id: string) => {
    setSavedWizardConfigs((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const isWizardConfigSaved = useCallback((signature: string) => {
    return savedWizardConfigs.some((item) => item.signature === signature);
  }, [savedWizardConfigs]);

  const saveRedesign = useCallback((input: SavedRedesignInput) => {
    const sanitizedInput: SavedRedesignInput = {
      ...input,
      objectImageUrl: sanitizeSavedImageUrl(input.objectImageUrl),
      beforeImageUrl: sanitizeSavedImageUrl(input.beforeImageUrl),
      afterImageUrl: sanitizeSavedImageUrl(input.afterImageUrl),
    };
    const signature = buildSavedRedesignSignature(sanitizedInput);
    let response = { id: '', isNew: false };

    setSavedRedesigns((prev) => {
      const existing = prev.find((item) => item.signature === signature);
      if (existing) {
        response = { id: existing.id, isNew: false };
        return prev;
      }

      const next: SavedRedesign = {
        ...sanitizedInput,
        id: buildLocalId('redesign'),
        signature,
        savedAt: new Date().toISOString(),
      };

      response = { id: next.id, isNew: true };
      return [next, ...prev].slice(0, MAX_REDESIGN_ITEMS);
    });

    return response;
  }, []);

  const removeRedesign = useCallback((id: string) => {
    setSavedRedesigns((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const isRedesignSaved = useCallback((signature: string) => {
    return savedRedesigns.some((item) => item.signature === signature);
  }, [savedRedesigns]);

  const savedCount = savedObjectIds.length + savedWizardConfigs.length + savedRedesigns.length;

  const contextValue = useMemo(() => ({
    savedObjectIds,
    savedWizardConfigs,
    savedRedesigns,
    addToSaved,
    removeFromSaved,
    isSaved,
    saveWizardConfig,
    removeWizardConfig,
    isWizardConfigSaved,
    saveRedesign,
    removeRedesign,
    isRedesignSaved,
    savedCount
  }), [
    savedObjectIds,
    savedWizardConfigs,
    savedRedesigns,
    addToSaved,
    removeFromSaved,
    isSaved,
    saveWizardConfig,
    removeWizardConfig,
    isWizardConfigSaved,
    saveRedesign,
    removeRedesign,
    isRedesignSaved,
    savedCount
  ]);

  return (
    <SavedContext.Provider value={contextValue}>
      {children}
    </SavedContext.Provider>
  );
};

export const useSaved = () => {
  const context = useContext(SavedContext);
  if (context === undefined) {
    throw new Error('useSaved must be used within a SavedProvider');
  }
  return context;
};

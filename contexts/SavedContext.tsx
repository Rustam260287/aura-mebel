"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { trackJourneyEvent } from '../lib/journey/client';
import { useExperience } from './ExperienceContext';

interface SavedContextType {
  savedObjectIds: string[];
  addToSaved: (id: string) => void;
  removeFromSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  savedCount: number;
}

const STORAGE_KEY = 'label_saved_objects';
const LEGACY_KEYS = ['aura_wishlist'];

const SavedContext = createContext<SavedContextType | undefined>(undefined);

export const SavedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedObjectIds, setSavedObjectIds] = useState<string[]>([]);
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

  const savedCount = savedObjectIds.length;

  const contextValue = useMemo(() => ({
    savedObjectIds,
    addToSaved,
    removeFromSaved,
    isSaved,
    savedCount
  }), [savedObjectIds, addToSaved, removeFromSaved, isSaved, savedCount]);

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

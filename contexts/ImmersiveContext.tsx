'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ImmersiveContextValue = {
  isImmersive: boolean;
  setImmersive: (next: boolean) => void;
};

const ImmersiveContext = createContext<ImmersiveContextValue | null>(null);

export const ImmersiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isImmersive, setIsImmersive] = useState(false);

  const setImmersive = useCallback((next: boolean) => {
    setIsImmersive(next);
  }, []);

  const value = useMemo(() => ({ isImmersive, setImmersive }), [isImmersive, setImmersive]);

  return <ImmersiveContext.Provider value={value}>{children}</ImmersiveContext.Provider>;
};

export const useImmersive = (): ImmersiveContextValue => {
  const ctx = useContext(ImmersiveContext);
  if (!ctx) {
    throw new Error('useImmersive must be used within ImmersiveProvider');
  }
  return ctx;
};


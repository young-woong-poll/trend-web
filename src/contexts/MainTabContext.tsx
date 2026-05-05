'use client';

import { createContext, useContext, type FC, type ReactNode } from 'react';

import type { MainTabKind } from '@/lib/analytics';

interface MainTabContextValue {
  tabKind: MainTabKind;
  tabValue: string;
}

const MainTabContext = createContext<MainTabContextValue | null>(null);

export const MainTabProvider: FC<{ value: MainTabContextValue; children: ReactNode }> = ({
  value,
  children,
}) => <MainTabContext.Provider value={value}>{children}</MainTabContext.Provider>;

export function useMainTabContext(): MainTabContextValue {
  const ctx = useContext(MainTabContext);
  if (!ctx) {
    throw new Error('useMainTabContext must be used within MainTabProvider');
  }
  return ctx;
}

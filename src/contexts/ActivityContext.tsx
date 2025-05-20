
"use client";

import type { ReactNode, Dispatch, SetStateAction } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

interface ActivityContextType {
  lastActivityTimestamp: number | null;
  triggerActivityRefresh: () => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [lastActivityTimestamp, setLastActivityTimestamp] = useState<number | null>(Date.now()); // Initialized

  const triggerActivityRefresh = useCallback(() => {
    console.log("ActivityContext: triggerActivityRefresh called. Old timestamp:", lastActivityTimestamp, "New:", Date.now());
    setLastActivityTimestamp(Date.now());
  }, [lastActivityTimestamp]); // Dependency array ensures useCallback memoizes correctly

  return (
    <ActivityContext.Provider value={{ lastActivityTimestamp, triggerActivityRefresh }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (context === undefined) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
}

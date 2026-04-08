/**
 * AppUpdaterContext
 *
 * Wraps the `useAppUpdater` hook so it's called exactly once at the app root
 * and shared with consumers (currently just SessionMenu) via React Context.
 * This guarantees there's only one ServiceWorkerRegistration listener and
 * one source of truth for the update status across the entire app.
 */

import { createContext, useContext } from 'react';
import { useAppUpdater } from '../../hooks/useAppUpdater';

const AppUpdaterContext = createContext(null);

export function AppUpdaterProvider({ children }) {
  const updater = useAppUpdater();
  return (
    <AppUpdaterContext.Provider value={updater}>
      {children}
    </AppUpdaterContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppUpdaterContext() {
  const ctx = useContext(AppUpdaterContext);
  if (!ctx) {
    throw new Error('useAppUpdaterContext must be used inside AppUpdaterProvider');
  }
  return ctx;
}

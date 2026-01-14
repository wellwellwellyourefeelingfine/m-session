/**
 * Global App Store
 * Manages: current tab, dark mode, app-level preferences
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      // Current active tab
      currentTab: 'home', // 'home' | 'active' | 'journal' | 'tools'
      setCurrentTab: (tab) => set({ currentTab: tab }),

      // Dark mode
      darkMode: false,
      setDarkMode: (enabled) => set({ darkMode: enabled }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      // User preferences
      preferences: {
        autoAdvance: false, // Whether modules auto-advance
        notificationsEnabled: false,
        reduceMotion: false, // Disable animations
        timerSound: false, // Audio alert when timer completes
      },
      setPreference: (key, value) =>
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        })),
    }),
    {
      name: 'mdma-guide-app-state',
    }
  )
);

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
      currentTab: 'active', // 'home' | 'active' | 'journal' | 'tools'
      setCurrentTab: (tab) => set({ currentTab: tab }),

      // Dark mode
      darkMode: false,
      setDarkMode: (enabled) => set({ darkMode: enabled }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      // User preferences
      preferences: {
        glassEffect: true, // Frosted glass effect on header/tab bar
        autoAdvance: false, // Whether modules auto-advance
        notificationsEnabled: false,
        reduceMotion: false, // Disable animations
        timerSound: false, // Audio alert when timer completes
        gongSound: true, // Meditation bell at start/end of meditations
        alternateAppLogo: false, // PNG logo instead of animated text
        autoUpdate: true, // Automatic background app updates (silent install + activation on next cold launch)
      },
      setPreference: (key, value) =>
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        })),

      // Dismissed banners (persisted so they don't reappear)
      dismissedBanners: {},
      dismissBanner: (id) =>
        set((state) => ({
          dismissedBanners: { ...state.dismissedBanners, [id]: true },
        })),
      undismissBanner: (id) =>
        set((state) => {
          const { [id]: _, ...rest } = state.dismissedBanners;
          return { dismissedBanners: rest };
        }),

      // Favorite modules — persisted list of library IDs (survives across sessions)
      favoriteModules: [],
      toggleFavorite: (libraryId) =>
        set((state) => ({
          favoriteModules: state.favoriteModules.includes(libraryId)
            ? state.favoriteModules.filter((id) => id !== libraryId)
            : [...state.favoriteModules, libraryId],
        })),

      // Transient: force-show install prompt from menu (not persisted)
      showInstallPrompt: false,
      setShowInstallPrompt: (show) => set({ showInstallPrompt: show }),

      // Transient: logo animation trigger counter (not persisted)
      logoAnimationTrigger: 0,
      triggerLogoAnimation: () => set((s) => ({ logoAnimationTrigger: s.logoAnimationTrigger + 1 })),

      // Transient: preview activity transition overlay (not persisted)
      // null | 'enter' | 'visible' | 'exit'
      previewOverlay: null,
      setPreviewOverlay: (step) => set({ previewOverlay: step }),
    }),
    {
      name: 'mdma-guide-app-state',
      partialize: (state) => {
        const { showInstallPrompt: _showInstallPrompt, previewOverlay: _previewOverlay, logoAnimationTrigger: _logoAnimationTrigger, ...rest } = state;
        return rest;
      },
    }
  )
);

/**
 * Global App Store
 * Manages: current tab, dark mode, app-level preferences
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { syncAnalyticsOptOut } from '../services/analyticsService';

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
        notificationsEnabled: false,
        reduceMotion: false, // Disable animations
        timerSound: false, // Audio alert when timer completes
        gongSound: true, // Meditation bell at start/end of meditations
        alternateAppLogo: false, // PNG logo instead of animated text
        autoUpdate: true, // Automatic background app updates (silent install + activation on next cold launch)
        readableFont: true, // false = Azeret Mono caps, true = Lora readable serif
        fontSizeAdjustment: 0, // -1 | 0 | 1 | 2 — px shift applied to body text tokens
        defaultVoiceId: 'theo', // Preferred meditation voice for offline-cached assets
        analyticsEnabled: true, // Anonymous usage counts via Plausible (opt-out in Settings)
        region: null, // Helper modal region (null = not yet detected; auto-detected on first load)
      },
      setPreference: (key, value) => {
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        }));
        // Sync Plausible opt-out flag whenever analytics preference changes
        if (key === 'analyticsEnabled') syncAnalyticsOptOut(value);
      },

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
      version: 3,
      partialize: (state) => {
        const { showInstallPrompt: _showInstallPrompt, previewOverlay: _previewOverlay, logoAnimationTrigger: _logoAnimationTrigger, ...rest } = state;
        return rest;
      },
      onRehydrateStorage: () => {
        // After store rehydrates from localStorage, sync the Plausible opt-out
        // flag so it's correct on first page load (before any user interaction).
        return (state) => {
          if (state?.preferences) {
            syncAnalyticsOptOut(state.preferences.analyticsEnabled ?? true);
          }
        };
      },
      migrate: (persistedState, version) => {
        if (!persistedState) return persistedState;
        if (version < 1) {
          // v0 → v1: introduce preferences.defaultVoiceId for alternate meditation voices
          persistedState.preferences = {
            ...(persistedState.preferences || {}),
            defaultVoiceId: persistedState.preferences?.defaultVoiceId ?? 'theo',
          };
        }
        if (version < 2) {
          // v1 → v2: introduce preferences.analyticsEnabled for Plausible opt-out
          persistedState.preferences = {
            ...(persistedState.preferences || {}),
            analyticsEnabled: persistedState.preferences?.analyticsEnabled ?? true,
          };
        }
        if (version < 3) {
          // v2 → v3: introduce preferences.region for region-aware helper modal.
          // Set null so App-level detection runs on next load.
          persistedState.preferences = {
            ...(persistedState.preferences || {}),
            region: persistedState.preferences?.region ?? null,
          };
        }
        return persistedState;
      },
    }
  )
);

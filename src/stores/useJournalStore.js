/**
 * Journal Store
 * Manages journal entries with persistence
 * Supports both manual entries and session-created entries
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Helper to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

// Extract title from content (first line, truncated)
const extractTitle = (content) => {
  if (!content || !content.trim()) return 'Untitled';
  const firstLine = content.split('\n')[0].trim();
  if (firstLine.length > 50) {
    return firstLine.substring(0, 47) + '...';
  }
  return firstLine || 'Untitled';
};

// Extract preview from content (after first line)
const extractPreview = (content) => {
  if (!content) return '';
  const lines = content.split('\n');
  if (lines.length <= 1) return '';
  const preview = lines.slice(1).join(' ').trim();
  if (preview.length > 100) {
    return preview.substring(0, 97) + '...';
  }
  return preview;
};

export const useJournalStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // ENTRIES
      // ============================================
      entries: [],

      // ============================================
      // NAVIGATION STATE (persists across tab switches)
      // ============================================
      navigation: {
        currentView: 'editor', // 'editor' | 'list'
        activeEntryId: null,   // ID of entry being edited, or null for new entry
      },

      // ============================================
      // SETTINGS
      // ============================================
      settings: {
        fontSize: 'medium', // 'small' | 'medium' | 'large'
        fontFamily: 'mono', // 'sans' | 'serif' | 'mono'
        lineHeight: 'normal', // 'compact' | 'normal' | 'relaxed'
      },

      // ============================================
      // ACTIONS
      // ============================================

      // Add a new entry
      addEntry: ({ content = '', source = 'manual', sessionId = null, moduleTitle = null, isEdited = false }) => {
        const now = Date.now();
        const newEntry = {
          id: generateId(),
          content,
          title: extractTitle(content),
          preview: extractPreview(content),
          createdAt: now,
          updatedAt: now,
          source, // 'manual' | 'session'
          sessionId,
          moduleTitle,
          isEdited, // true if entry was created for immediate editing (skips confirmation)
        };

        set((state) => ({
          entries: [newEntry, ...state.entries],
        }));

        return newEntry;
      },

      // Update an existing entry
      updateEntry: (id, content) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  content,
                  title: extractTitle(content),
                  preview: extractPreview(content),
                  updatedAt: Date.now(),
                  isEdited: entry.source === 'session' ? true : entry.isEdited,
                }
              : entry
          ),
        }));
      },

      // Delete an entry
      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        }));
      },

      // Get entry by ID
      getEntryById: (id) => {
        return get().entries.find((entry) => entry.id === id) || null;
      },

      // Get entries by source
      getEntriesBySource: (source) => {
        return get()
          .entries.filter((entry) => entry.source === source)
          .sort((a, b) => b.updatedAt - a.updatedAt);
      },

      // Get session entries
      getSessionEntries: () => {
        return get().getEntriesBySource('session');
      },

      // Get manual entries
      getManualEntries: () => {
        return get().getEntriesBySource('manual');
      },

      // ============================================
      // SETTINGS ACTIONS
      // ============================================

      updateSettings: (updates) => {
        set((state) => ({
          settings: {
            ...state.settings,
            ...updates,
          },
        }));
      },

      setFontSize: (size) => {
        set((state) => ({
          settings: { ...state.settings, fontSize: size },
        }));
      },

      setFontFamily: (family) => {
        set((state) => ({
          settings: { ...state.settings, fontFamily: family },
        }));
      },

      setLineHeight: (height) => {
        set((state) => ({
          settings: { ...state.settings, lineHeight: height },
        }));
      },

      // ============================================
      // NAVIGATION ACTIONS
      // ============================================

      setNavigation: (view, entryId = null) => {
        set({
          navigation: {
            currentView: view,
            activeEntryId: entryId,
          },
        });
      },

      navigateToEditor: (entryId = null) => {
        set({
          navigation: {
            currentView: 'editor',
            activeEntryId: entryId,
          },
        });
      },

      navigateToList: () => {
        set({
          navigation: {
            currentView: 'list',
            activeEntryId: null,
          },
        });
      },
    }),
    {
      name: 'mdma-guide-journal-state',
      version: 2,
      partialize: (state) => {
        // Only persist entries and settings, not transient navigation state
        const { navigation, ...rest } = state;
        return rest;
      },
      migrate: (persistedState, version) => {
        // v1 → v2: added navigation and settings (both have defaults in initial state).
        // Zustand merges initial state with persisted, so just passing through preserves entries.
        if (version < 2) {
          return { ...persistedState };
        }
        return persistedState;
      },
    }
  )
);

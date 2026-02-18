/**
 * Tools Store
 * Manages: tool expansion state (transient UI — not persisted)
 */

import { create } from 'zustand';

export const useToolsStore = create(
  (set, get) => ({
    // Open tools (array of tool IDs)
    openTools: [],

    // Pending section to auto-expand inside a tool (e.g., 'testing' for DosageTool)
    pendingSection: null,
    setPendingSection: (section) => set({ pendingSection: section }),
    clearPendingSection: () => set({ pendingSection: null }),

    toggleTool: (toolId) => {
      const state = get();
      const isOpen = state.openTools.includes(toolId);
      set({
        openTools: isOpen
          ? state.openTools.filter(id => id !== toolId)
          : [...state.openTools, toolId]
      });
    },

    closeTool: (toolId) => {
      const state = get();
      set({ openTools: state.openTools.filter(id => id !== toolId) });
    },

    isToolOpen: (toolId) => {
      const state = get();
      return state.openTools.includes(toolId);
    },

    canCloseTool: () => {
      // All tools can now be closed
      return true;
    },
  })
);

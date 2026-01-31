/**
 * Tools Store
 * Manages: tool expansion state (transient UI — not persisted)
 */

import { create } from 'zustand';

export const useToolsStore = create(
  (set, get) => ({
    // Open tools (array of tool IDs)
    openTools: [],

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

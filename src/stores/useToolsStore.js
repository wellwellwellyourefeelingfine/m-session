/**
 * Tools Store
 * Manages: tool expansion state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useToolsStore = create(
  persist(
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
    }),
    {
      name: 'mdma-guide-tools-state',
    }
  )
);

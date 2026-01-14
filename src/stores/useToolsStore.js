/**
 * Tools Store
 * Manages: active tool, timer state, tool expansion
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

        // If trying to close timer while active, prevent it
        if (isOpen && toolId === 'timer' && state.timerActive) {
          return;
        }

        set({
          openTools: isOpen
            ? state.openTools.filter(id => id !== toolId)
            : [...state.openTools, toolId]
        });
      },

      closeTool: (toolId) => {
        const state = get();
        // Can't close timer while active
        if (toolId === 'timer' && state.timerActive) {
          return;
        }
        set({ openTools: state.openTools.filter(id => id !== toolId) });
      },

      isToolOpen: (toolId) => {
        const state = get();
        return state.openTools.includes(toolId);
      },

      // Timer state
      timerDuration: 0, // Total duration in seconds
      timerRemaining: 0, // Remaining seconds
      timerActive: false,
      timerStartTime: null,

      startTimer: (durationSeconds) => {
        set({
          timerDuration: durationSeconds,
          timerRemaining: durationSeconds,
          timerActive: true,
          timerStartTime: Date.now(),
        });
      },

      pauseTimer: () => {
        const state = get();
        if (state.timerActive) {
          set({ timerActive: false });
        }
      },

      resumeTimer: () => {
        const state = get();
        if (!state.timerActive && state.timerRemaining > 0) {
          // Recalculate timerDuration based on remaining time
          // So when we resume, it continues from where it was paused
          set({
            timerDuration: state.timerRemaining,
            timerActive: true,
            timerStartTime: Date.now(),
          });
        }
      },

      updateTimerRemaining: (remaining) => {
        set({ timerRemaining: Math.max(0, remaining) });
        if (remaining <= 0) {
          set({ timerActive: false });
        }
      },

      resetTimer: () => {
        set({
          timerDuration: 0,
          timerRemaining: 0,
          timerActive: false,
          timerStartTime: null,
        });
      },

      canCloseTool: (toolId) => {
        const state = get();
        // Can close if it's not the timer, or if timer is not active
        return toolId !== 'timer' || !state.timerActive;
      },
    }),
    {
      name: 'mdma-guide-tools-state',
    }
  )
);

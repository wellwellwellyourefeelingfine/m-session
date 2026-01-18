/**
 * useModuleState Hook
 *
 * Manages the overall state machine for a module's lifecycle:
 * - idle: Before the module has started (shows begin button)
 * - active: Module is running (timer, prompts, etc. are active)
 * - paused: Module is paused
 * - completed: Module has finished
 *
 * This hook coordinates between the timer, prompts, and other capabilities.
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * @param {object} config
 * @param {boolean} config.requiresBegin - Whether module shows a begin button first
 * @param {boolean} config.autoComplete - Whether module auto-completes when timer ends
 * @param {function} config.onComplete - Callback when module completes
 * @param {function} config.onSkip - Callback when module is skipped
 */
export function useModuleState({
  requiresBegin = false,
  onComplete,
  onSkip,
}) {
  // Core module state
  const [phase, setPhase] = useState(requiresBegin ? 'idle' : 'active');
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // Sequential prompts state
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  // Derived states
  const isIdle = phase === 'idle';
  const isActive = phase === 'active';
  const isPaused = phase === 'paused';
  const isCompleted = phase === 'completed';

  // Begin the module (transition from idle to active)
  const begin = useCallback(() => {
    setPhase('active');
  }, []);

  // Mark module as completed (internal, before user confirms)
  const markCompleted = useCallback(() => {
    setPhase('completed');
  }, []);

  // User confirms completion and moves on
  const confirmComplete = useCallback(() => {
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  // Skip confirmation flow
  const requestSkip = useCallback(() => {
    setShowSkipConfirm(true);
  }, []);

  const cancelSkip = useCallback(() => {
    setShowSkipConfirm(false);
  }, []);

  const confirmSkip = useCallback(() => {
    setShowSkipConfirm(false);
    if (onSkip) {
      onSkip();
    }
  }, [onSkip]);

  // Direct skip without confirmation
  const skip = useCallback(() => {
    if (onSkip) {
      onSkip();
    }
  }, [onSkip]);

  // Sequential prompts navigation
  const nextPrompt = useCallback((totalPrompts) => {
    if (currentPromptIndex < totalPrompts - 1) {
      setCurrentPromptIndex((prev) => prev + 1);
      return true;
    }
    return false;
  }, [currentPromptIndex]);

  const previousPrompt = useCallback(() => {
    if (currentPromptIndex > 0) {
      setCurrentPromptIndex((prev) => prev - 1);
      return true;
    }
    return false;
  }, [currentPromptIndex]);

  const goToPrompt = useCallback((index) => {
    setCurrentPromptIndex(index);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setPhase(requiresBegin ? 'idle' : 'active');
    setShowSkipConfirm(false);
    setCurrentPromptIndex(0);
  }, [requiresBegin]);

  return {
    // State
    phase,
    isIdle,
    isActive,
    isPaused,
    isCompleted,
    showSkipConfirm,
    currentPromptIndex,

    // Actions
    begin,
    markCompleted,
    confirmComplete,
    requestSkip,
    cancelSkip,
    confirmSkip,
    skip,
    nextPrompt,
    previousPrompt,
    goToPrompt,
    reset,
  };
}

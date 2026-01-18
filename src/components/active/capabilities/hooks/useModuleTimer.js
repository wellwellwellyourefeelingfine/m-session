/**
 * useModuleTimer Hook
 *
 * A robust timer hook for module timing that:
 * - Survives tab switches (timestamp-based)
 * - Supports pause/resume
 * - Persists state to store for tab navigation
 * - Provides multiple timer modes (elapsed, countdown, breathing phases)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSessionStore } from '../../../../stores/useSessionStore';

/**
 * @param {object} config
 * @param {string} config.moduleInstanceId - Unique ID for this module instance
 * @param {string} config.type - Timer type: 'elapsed' | 'countdown' | 'breathing'
 * @param {number} config.duration - Total duration in seconds (for elapsed/countdown)
 * @param {object} config.breathingConfig - Config for breathing mode { inhale, hold, exhale, holdAfterExhale, cycles }
 * @param {boolean} config.autoComplete - Whether to auto-complete when timer ends
 * @param {function} config.onComplete - Callback when timer completes
 */
export function useModuleTimer({
  moduleInstanceId,
  type = 'elapsed',
  duration = 0,
  breathingConfig = null,
  autoComplete = true,
  onComplete,
}) {
  // Get persisted playback state from store
  const meditationPlayback = useSessionStore((state) => state.meditationPlayback);
  const startMeditationPlayback = useSessionStore((state) => state.startMeditationPlayback);
  const pauseMeditationPlayback = useSessionStore((state) => state.pauseMeditationPlayback);
  const resumeMeditationPlayback = useSessionStore((state) => state.resumeMeditationPlayback);
  const resetMeditationPlayback = useSessionStore((state) => state.resetMeditationPlayback);
  const updateMeditationPlayback = useSessionStore((state) => state.updateMeditationPlayback);

  // Check if this timer's playback is active in the store
  const isThisModule = meditationPlayback.moduleInstanceId === moduleInstanceId;
  const hasStarted = isThisModule && meditationPlayback.hasStarted;
  const isPlaying = isThisModule && meditationPlayback.isPlaying;

  // Local state for display
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Breathing-specific state
  const [breathPhase, setBreathPhase] = useState('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [phaseCountdown, setPhaseCountdown] = useState(0);

  // Refs
  const timerRef = useRef(null);
  const breathTimerRef = useRef(null);

  // Calculate elapsed time from store timestamps
  const calculateElapsed = useCallback(() => {
    if (!isThisModule || !meditationPlayback.hasStarted) return 0;

    const { startedAt, accumulatedTime } = meditationPlayback;

    // If paused (startedAt is null when paused), use accumulated time
    if (!startedAt) {
      return accumulatedTime || 0;
    }

    // If playing, calculate from start time plus accumulated
    const now = Date.now();
    const currentSegment = (now - startedAt) / 1000;
    return (accumulatedTime || 0) + currentSegment;
  }, [isThisModule, meditationPlayback]);

  // Initialize elapsed time when mounting or returning to tab
  useEffect(() => {
    if (type !== 'breathing') {
      const elapsed = calculateElapsed();
      setElapsedTime(elapsed);

      // Check if already complete
      if (elapsed >= duration && duration > 0 && hasStarted) {
        setIsComplete(true);
      }
    }
  }, [calculateElapsed, duration, hasStarted, type]);

  // UI update timer for elapsed/countdown modes
  useEffect(() => {
    if (type === 'breathing') return;
    if (!isPlaying || !meditationPlayback.startedAt) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const updateDisplay = () => {
      const now = Date.now();
      const currentSegment = (now - meditationPlayback.startedAt) / 1000;
      const newElapsed = (meditationPlayback.accumulatedTime || 0) + currentSegment;

      setElapsedTime(newElapsed);

      // Check if complete
      if (newElapsed >= duration && duration > 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        setIsComplete(true);

        if (autoComplete) {
          pauseMeditationPlayback();
        }
      }
    };

    // Update immediately
    updateDisplay();

    // Then update every 100ms for smooth display
    timerRef.current = setInterval(updateDisplay, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [type, isPlaying, meditationPlayback.startedAt, meditationPlayback.accumulatedTime, duration, autoComplete, pauseMeditationPlayback]);

  // Breathing timer logic
  useEffect(() => {
    if (type !== 'breathing' || !breathingConfig) return;
    if (!hasStarted || !isPlaying) {
      if (breathTimerRef.current) {
        clearInterval(breathTimerRef.current);
        breathTimerRef.current = null;
      }
      return;
    }

    const getPhaseDuration = (phase) => {
      switch (phase) {
        case 'inhale': return breathingConfig.inhale || 4;
        case 'hold': return breathingConfig.hold || 0;
        case 'exhale': return breathingConfig.exhale || 4;
        case 'holdAfterExhale': return breathingConfig.holdAfterExhale || 0;
        default: return 4;
      }
    };

    const advancePhase = () => {
      let nextPhase;
      let shouldCompleteCycle = false;

      switch (breathPhase) {
        case 'inhale':
          nextPhase = breathingConfig.hold > 0 ? 'hold' : 'exhale';
          break;
        case 'hold':
          nextPhase = 'exhale';
          break;
        case 'exhale':
          if (breathingConfig.holdAfterExhale > 0) {
            nextPhase = 'holdAfterExhale';
          } else {
            nextPhase = 'inhale';
            shouldCompleteCycle = true;
          }
          break;
        case 'holdAfterExhale':
          nextPhase = 'inhale';
          shouldCompleteCycle = true;
          break;
        default:
          nextPhase = 'inhale';
      }

      if (shouldCompleteCycle) {
        const newCount = cycleCount + 1;
        if (newCount >= (breathingConfig.cycles || 8)) {
          // All cycles complete
          setIsComplete(true);
          pauseMeditationPlayback();
          return;
        }
        setCycleCount(newCount);
      }

      setBreathPhase(nextPhase);
      setPhaseCountdown(getPhaseDuration(nextPhase));
    };

    // Initialize countdown if starting fresh
    if (phaseCountdown === 0) {
      setPhaseCountdown(getPhaseDuration(breathPhase));
    }

    // Skip phases with 0 duration
    const currentDuration = getPhaseDuration(breathPhase);
    if (currentDuration === 0) {
      advancePhase();
      return;
    }

    breathTimerRef.current = setInterval(() => {
      setPhaseCountdown((prev) => {
        if (prev <= 1) {
          advancePhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (breathTimerRef.current) {
        clearInterval(breathTimerRef.current);
        breathTimerRef.current = null;
      }
    };
  }, [type, breathingConfig, hasStarted, isPlaying, breathPhase, cycleCount, phaseCountdown, pauseMeditationPlayback]);

  // Start the timer
  const start = useCallback(() => {
    setElapsedTime(0);
    setIsComplete(false);

    if (type === 'breathing') {
      setBreathPhase('inhale');
      setCycleCount(0);
      setPhaseCountdown(breathingConfig?.inhale || 4);
    }

    startMeditationPlayback(moduleInstanceId);
  }, [moduleInstanceId, startMeditationPlayback, type, breathingConfig]);

  // Pause the timer
  const pause = useCallback(() => {
    pauseMeditationPlayback();
  }, [pauseMeditationPlayback]);

  // Resume the timer
  const resume = useCallback(() => {
    resumeMeditationPlayback();
  }, [resumeMeditationPlayback]);

  // Toggle pause/resume
  const togglePause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  // Reset the timer
  const reset = useCallback(() => {
    resetMeditationPlayback();
    setElapsedTime(0);
    setIsComplete(false);

    if (type === 'breathing') {
      setBreathPhase('inhale');
      setCycleCount(0);
      setPhaseCountdown(0);
    }
  }, [resetMeditationPlayback, type]);

  // Complete and cleanup
  const complete = useCallback(() => {
    reset();
    if (onComplete) {
      onComplete();
    }
  }, [reset, onComplete]);

  // Calculate progress percentage
  const progress = duration > 0 ? Math.min((elapsedTime / duration) * 100, 100) : 0;

  // Calculate remaining time for countdown mode
  const remainingTime = Math.max(duration - elapsedTime, 0);

  return {
    // State
    hasStarted,
    isPlaying,
    isComplete,
    elapsedTime,
    remainingTime,
    progress,

    // Breathing-specific
    breathPhase,
    cycleCount,
    phaseCountdown,
    totalCycles: breathingConfig?.cycles || 8,

    // Actions
    start,
    pause,
    resume,
    togglePause,
    reset,
    complete,
  };
}

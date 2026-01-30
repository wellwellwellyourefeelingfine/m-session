/**
 * useMeditationPlayback Hook
 *
 * Shared playback orchestration for all timed meditation modules.
 * Handles audio-text sync, timer, pause/resume, prompt progression,
 * and completion — everything that's identical across meditation types.
 *
 * Each module computes its own timedSequence (via useMemo) and passes
 * it in. This hook handles everything after that.
 *
 * Usage:
 *   const playback = useMeditationPlayback({
 *     meditationId: 'open-awareness',
 *     moduleInstanceId: module.instanceId,
 *     timedSequence,
 *     totalDuration,
 *     onComplete,
 *     onSkip,
 *     onTimerUpdate,
 *   });
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSessionStore } from '../stores/useSessionStore';
import { getMeditationById } from '../content/meditations';
import { useAudioPlayback } from './useAudioPlayback';
import { useWakeLock } from './useWakeLock';

// Constants
const TEXT_FADE_IN_DELAY = 200;           // ms after audio starts before text fades in
const TEXT_FADE_OUT_INTO_SILENCE = 2000;  // ms into silence before text fades out
const PROMPT_DISPLAY_DURATION = 8000;     // ms to show text if no audio (fallback)

export function useMeditationPlayback({
  meditationId,
  moduleInstanceId,
  timedSequence,
  totalDuration,
  onComplete,
  onSkip,
  onTimerUpdate,
}) {
  // Get meditation content
  const meditation = getMeditationById(meditationId);

  // Session store for persistent playback state
  const meditationPlayback = useSessionStore(state => state.meditationPlayback);
  const startMeditationPlayback = useSessionStore(state => state.startMeditationPlayback);
  const pauseMeditationPlayback = useSessionStore(state => state.pauseMeditationPlayback);
  const resumeMeditationPlayback = useSessionStore(state => state.resumeMeditationPlayback);
  const resetMeditationPlayback = useSessionStore(state => state.resetMeditationPlayback);

  // Check if this module's playback is active
  const isThisModule = meditationPlayback.moduleInstanceId === moduleInstanceId;
  const hasStarted = isThisModule && meditationPlayback.hasStarted;
  const isPlaying = isThisModule && meditationPlayback.isPlaying;

  // Prompt display state
  const [currentPromptIndex, setCurrentPromptIndex] = useState(-1);
  const [promptPhase, setPromptPhase] = useState('hidden'); // 'hidden' | 'fading-in' | 'visible' | 'fading-out'
  const [elapsedTime, setElapsedTime] = useState(0);

  // Refs for tracking
  const lastAudioPromptRef = useRef(-1);
  const textFadeTimeoutRef = useRef(null);
  const timerRef = useRef(null);

  // Keep screen awake during active meditation
  useWakeLock(hasStarted && isPlaying);

  // Audio playback hook
  const audio = useAudioPlayback({
    onEnded: () => {
      // Audio finished - fade out text after delay into silence
      if (textFadeTimeoutRef.current) {
        clearTimeout(textFadeTimeoutRef.current);
      }
      textFadeTimeoutRef.current = setTimeout(() => {
        setPromptPhase('fading-out');
      }, TEXT_FADE_OUT_INTO_SILENCE);
    },
    onError: (e) => {
      console.warn('Audio playback error:', e);
      // Continue with text-only fallback - fade out after estimated duration
      if (textFadeTimeoutRef.current) {
        clearTimeout(textFadeTimeoutRef.current);
      }
      textFadeTimeoutRef.current = setTimeout(() => {
        setPromptPhase('fading-out');
      }, PROMPT_DISPLAY_DURATION);
    },
  });

  // Preload first few audio files on mount/sequence change
  useEffect(() => {
    if (timedSequence.length > 0 && meditation?.audio) {
      const firstFewSrcs = timedSequence.slice(0, 3)
        .map(p => p.audioSrc)
        .filter(Boolean);
      audio.preload(firstFewSrcs);
    }
  }, [timedSequence, meditation?.audio, audio]);

  // Timer update effect (timestamp-based for accuracy)
  useEffect(() => {
    if (!isPlaying || !meditationPlayback.startedAt) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const currentSegment = (now - meditationPlayback.startedAt) / 1000;
      const newElapsed = (meditationPlayback.accumulatedTime || 0) + currentSegment;
      setElapsedTime(newElapsed);

      // Check for completion
      if (newElapsed >= totalDuration && totalDuration > 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        pauseMeditationPlayback();
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, meditationPlayback.startedAt, meditationPlayback.accumulatedTime, totalDuration, pauseMeditationPlayback]);

  // Recalculate elapsed on resume (when returning to tab)
  useEffect(() => {
    if (!isThisModule || !meditationPlayback.hasStarted) return;

    const { startedAt, accumulatedTime } = meditationPlayback;

    if (!startedAt) {
      // Paused - use accumulated time
      setElapsedTime(accumulatedTime || 0);
    }
  }, [isThisModule, meditationPlayback.hasStarted, meditationPlayback.startedAt, meditationPlayback.accumulatedTime]);

  // Prompt progression based on elapsed time
  useEffect(() => {
    if (!hasStarted || timedSequence.length === 0) return;

    // Find which prompt should be active
    let targetIndex = -1;
    for (let i = 0; i < timedSequence.length; i++) {
      if (elapsedTime >= timedSequence[i].startTime) {
        targetIndex = i;
      }
    }

    // If we've moved to a new prompt
    if (targetIndex !== currentPromptIndex && targetIndex >= 0) {
      setCurrentPromptIndex(targetIndex);

      // Start audio for new prompt (if not already played)
      if (targetIndex !== lastAudioPromptRef.current) {
        lastAudioPromptRef.current = targetIndex;
        const prompt = timedSequence[targetIndex];

        // Clear any pending fade timeout
        if (textFadeTimeoutRef.current) {
          clearTimeout(textFadeTimeoutRef.current);
          textFadeTimeoutRef.current = null;
        }

        // Try to play audio
        if (prompt.audioSrc && !audio.isMuted) {
          audio.loadAndPlay(prompt.audioSrc);
        }

        // Fade in text after slight delay (audio leads)
        setPromptPhase('hidden');
        setTimeout(() => {
          setPromptPhase('fading-in');
          setTimeout(() => setPromptPhase('visible'), 300);
        }, TEXT_FADE_IN_DELAY);

        // If no audio or muted, set fallback fade-out timer
        if (!prompt.audioSrc || audio.isMuted) {
          textFadeTimeoutRef.current = setTimeout(() => {
            setPromptPhase('fading-out');
          }, PROMPT_DISPLAY_DURATION);
        }

        // Preload next audio
        if (targetIndex + 1 < timedSequence.length) {
          const nextSrc = timedSequence[targetIndex + 1].audioSrc;
          if (nextSrc) audio.preload([nextSrc]);
        }
      }
    }
  }, [elapsedTime, hasStarted, timedSequence, currentPromptIndex, audio]);

  // Report timer state to parent for ModuleStatusBar
  useEffect(() => {
    if (!onTimerUpdate) return;

    const progress = totalDuration > 0 ? Math.min((elapsedTime / totalDuration) * 100, 100) : 0;
    const isComplete = elapsedTime >= totalDuration && totalDuration > 0 && hasStarted;

    onTimerUpdate({
      progress,
      elapsed: elapsedTime,
      total: totalDuration,
      showTimer: hasStarted && !isComplete,
      isPaused: !isPlaying,
    });
  }, [elapsedTime, totalDuration, hasStarted, isPlaying, onTimerUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (textFadeTimeoutRef.current) {
        clearTimeout(textFadeTimeoutRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handlers
  const handleStart = useCallback(() => {
    startMeditationPlayback(moduleInstanceId);
    setElapsedTime(0);
    setCurrentPromptIndex(-1);
    lastAudioPromptRef.current = -1;
    setPromptPhase('hidden');
  }, [moduleInstanceId, startMeditationPlayback]);

  const handlePauseResume = useCallback(() => {
    if (isPlaying) {
      pauseMeditationPlayback();
      audio.pause();
    } else {
      resumeMeditationPlayback();
      // Resume audio if it was playing
      if (audio.currentSrc && !audio.isMuted) {
        audio.resume();
      }
    }
  }, [isPlaying, pauseMeditationPlayback, resumeMeditationPlayback, audio]);

  const handleComplete = useCallback(() => {
    resetMeditationPlayback();
    audio.stop();
    onComplete();
  }, [resetMeditationPlayback, audio, onComplete]);

  const handleSkip = useCallback(() => {
    resetMeditationPlayback();
    audio.stop();
    onSkip();
  }, [resetMeditationPlayback, audio, onSkip]);

  // Derived state
  const isComplete = elapsedTime >= totalDuration && totalDuration > 0 && hasStarted;
  const currentPrompt = timedSequence[currentPromptIndex];

  const getPhase = useCallback(() => {
    if (!hasStarted) return 'idle';
    if (isComplete) return 'completed';
    return 'active';
  }, [hasStarted, isComplete]);

  const getPrimaryButton = useCallback(() => {
    const phase = getPhase();

    if (phase === 'idle') {
      return { label: 'Begin', onClick: handleStart };
    }
    if (phase === 'active') {
      return { label: isPlaying ? 'Pause' : 'Resume', onClick: handlePauseResume };
    }
    if (phase === 'completed') {
      return { label: 'Continue', onClick: handleComplete };
    }
    return null;
  }, [getPhase, isPlaying, handleStart, handlePauseResume, handleComplete]);

  return {
    // State
    meditation,
    hasStarted,
    isPlaying,
    isComplete,
    elapsedTime,
    currentPrompt,
    promptPhase,

    // Audio
    audio,

    // Handlers
    handleStart,
    handlePauseResume,
    handleComplete,
    handleSkip,

    // UI helpers
    getPhase,
    getPrimaryButton,
  };
}

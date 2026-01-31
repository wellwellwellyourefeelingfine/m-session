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

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSessionStore } from '../stores/useSessionStore';
import { getMeditationById } from '../content/meditations';
import { useAudioPlayback } from './useAudioPlayback';
import { useWakeLock } from './useWakeLock';

// Constants
const TEXT_FADE_IN_DELAY = 200;           // ms after audio starts before text fades in
const TEXT_FADE_OUT_INTO_SILENCE = 2000;  // ms into silence before text fades out
const PROMPT_DISPLAY_DURATION = 8000;     // ms to show text if no audio (fallback)

// Gong timing
const GONG_SRC = '/audio/meditation-bell.mp3';
const GONG_VOLUME = 0.66;     // 2/3 of full volume — softer than TTS voice
const GONG_DELAY = 1;         // seconds of silence before gong plays
const GONG_PREAMBLE = 8;      // seconds before first TTS (1s silence + gong ring + 4s pause)

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
  const gongPlayedRef = useRef(false);  // opening gong fired
  const endGongPlayedRef = useRef(false);

  // Preload gong as a blob so playback is instant and artifact-free
  const gongRef = useRef(null);
  const gongBlobUrlRef = useRef(null);
  useEffect(() => {
    let revoked = false;
    fetch(GONG_SRC)
      .then(r => r.blob())
      .then(blob => {
        if (revoked) return;
        gongBlobUrlRef.current = URL.createObjectURL(blob);
      })
      .catch(() => {});
    return () => {
      revoked = true;
      if (gongRef.current) {
        gongRef.current.pause();
        gongRef.current = null;
      }
      if (gongBlobUrlRef.current) {
        URL.revokeObjectURL(gongBlobUrlRef.current);
        gongBlobUrlRef.current = null;
      }
    };
  }, []);

  // Shift the timed sequence forward to make room for the gong preamble.
  // The timer runs from 0; gong plays at GONG_DELAY; first TTS at GONG_PREAMBLE.
  const shiftedSequence = useMemo(() => {
    return timedSequence.map(p => ({
      ...p,
      startTime: p.startTime + GONG_PREAMBLE,
      endTime: p.endTime + GONG_PREAMBLE,
    }));
  }, [timedSequence]);

  const shiftedTotalDuration = totalDuration + GONG_PREAMBLE;

  // Keep screen awake during active meditation
  useWakeLock(hasStarted && isPlaying);

  // Audio playback hook (for TTS prompts only)
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

  // Play gong from preloaded blob — creates a fresh Audio each time
  const playGong = useCallback(() => {
    const url = gongBlobUrlRef.current;
    if (!url) return;
    const el = new Audio(url);
    el.volume = GONG_VOLUME;
    gongRef.current = el;
    el.play().catch(() => {});
  }, []);

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

      // Fire opening gong at GONG_DELAY seconds
      if (!gongPlayedRef.current && newElapsed >= GONG_DELAY) {
        gongPlayedRef.current = true;
        playGong();
      }

      // Check for completion
      if (newElapsed >= shiftedTotalDuration && shiftedTotalDuration > 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        pauseMeditationPlayback();
        if (!endGongPlayedRef.current) {
          endGongPlayedRef.current = true;
          playGong();
        }
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
  }, [isPlaying, meditationPlayback.startedAt, meditationPlayback.accumulatedTime, shiftedTotalDuration, pauseMeditationPlayback, playGong]);

  // Recalculate elapsed on resume (when returning to tab)
  useEffect(() => {
    if (!isThisModule || !meditationPlayback.hasStarted) return;

    const { startedAt, accumulatedTime } = meditationPlayback;

    if (!startedAt) {
      // Paused - use accumulated time
      setElapsedTime(accumulatedTime || 0);
    }
  }, [isThisModule, meditationPlayback.hasStarted, meditationPlayback.startedAt, meditationPlayback.accumulatedTime]);

  // Prompt progression based on elapsed time (uses shiftedSequence)
  // Only triggers audio when actually playing — never while paused.
  useEffect(() => {
    if (!hasStarted || !isPlaying || shiftedSequence.length === 0) return;

    // Find which prompt should be active
    let targetIndex = -1;
    for (let i = 0; i < shiftedSequence.length; i++) {
      if (elapsedTime >= shiftedSequence[i].startTime) {
        targetIndex = i;
      }
    }

    // If we've moved to a new prompt
    if (targetIndex !== currentPromptIndex && targetIndex >= 0) {
      setCurrentPromptIndex(targetIndex);

      // Start audio for new prompt (if not already played)
      if (targetIndex !== lastAudioPromptRef.current) {
        lastAudioPromptRef.current = targetIndex;
        const prompt = shiftedSequence[targetIndex];

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
        if (targetIndex + 1 < shiftedSequence.length) {
          const nextSrc = shiftedSequence[targetIndex + 1].audioSrc;
          if (nextSrc) audio.preload([nextSrc]);
        }
      }
    }
  }, [elapsedTime, hasStarted, isPlaying, shiftedSequence, currentPromptIndex, audio]);

  // Report timer state to parent for ModuleStatusBar
  // (report against original totalDuration so the progress bar isn't affected by preamble)
  useEffect(() => {
    if (!onTimerUpdate) return;

    // Subtract preamble so the user-visible timer starts at 0 after gong
    const userElapsed = Math.max(0, elapsedTime - GONG_PREAMBLE);
    const progress = totalDuration > 0 ? Math.min((userElapsed / totalDuration) * 100, 100) : 0;
    const isComplete = elapsedTime >= shiftedTotalDuration && shiftedTotalDuration > 0 && hasStarted;

    onTimerUpdate({
      progress,
      elapsed: userElapsed,
      total: totalDuration,
      showTimer: hasStarted && !isComplete,
      isPaused: !isPlaying,
    });
  }, [elapsedTime, totalDuration, shiftedTotalDuration, hasStarted, isPlaying, onTimerUpdate]);

  // Cleanup on unmount (gong cleanup is in its own preload effect)
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
    // Start immediately — UI transitions right away
    startMeditationPlayback(moduleInstanceId);
    setElapsedTime(0);
    setCurrentPromptIndex(-1);
    lastAudioPromptRef.current = -1;
    gongPlayedRef.current = false;
    endGongPlayedRef.current = false;
    setPromptPhase('hidden');
  }, [moduleInstanceId, startMeditationPlayback]);

  // Track whether audio was mid-clip when paused so we can resume it
  const audioWasPlayingRef = useRef(false);

  const handlePauseResume = useCallback(() => {
    if (isPlaying) {
      // Remember if audio was actively playing a clip
      audioWasPlayingRef.current = audio.isPlaying;
      pauseMeditationPlayback();
      audio.pause();
      // Also pause gong if it's playing
      if (gongRef.current && !gongRef.current.paused) {
        gongRef.current.pause();
      }
    } else {
      resumeMeditationPlayback();
      // Only resume the Audio element if it was mid-clip when paused.
      // Don't call resume() if it was between clips — prompt progression
      // will handle triggering the next clip when the timer advances.
      if (audioWasPlayingRef.current && audio.currentSrc && !audio.isMuted) {
        audio.resume();
      }
      audioWasPlayingRef.current = false;
    }
  }, [isPlaying, pauseMeditationPlayback, resumeMeditationPlayback, audio]);

  const handleComplete = useCallback(() => {
    resetMeditationPlayback();
    audio.stop();
    onComplete();
  }, [resetMeditationPlayback, audio, onComplete]);

  const handleSkip = useCallback(() => {
    if (gongRef.current) {
      gongRef.current.pause();
      gongRef.current.src = '';
    }
    resetMeditationPlayback();
    audio.stop();
    onSkip();
  }, [resetMeditationPlayback, audio, onSkip]);

  // Derived state
  const isComplete = elapsedTime >= shiftedTotalDuration && shiftedTotalDuration > 0 && hasStarted;
  const currentPrompt = shiftedSequence[currentPromptIndex];

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

/**
 * useMeditationPlayback Hook
 *
 * Shared playback orchestration for all timed meditation modules.
 * Composes a single continuous MP3 blob from TTS clips + silence + gong,
 * then plays it via a single <audio> element for iOS screen-lock resilience.
 *
 * Handles audio-text sync, timer, pause/resume, prompt progression,
 * Media Session API, and completion.
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
import { composeMeditationAudio, revokeMeditationBlobUrl } from '../services/audioComposerService';

// Constants
const TEXT_FADE_IN_DELAY = 200;           // ms after audio starts before text fades in
const TEXT_FADE_OUT_INTO_SILENCE = 2000;  // ms after clip ends before text fades out
const PROMPT_DISPLAY_DURATION = 8000;     // ms to show text if muted (fallback)

// Gong timing (used by the composer)
const GONG_DELAY = 1;         // seconds of silence before gong plays
const GONG_PREAMBLE = 8;      // seconds before first TTS (1s silence + gong ring + pause)

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

  // Composition state
  const [isLoading, setIsLoading] = useState(false);
  const blobUrlRef = useRef(null);
  const promptTimeMapRef = useRef([]);
  const composedDurationRef = useRef(0);

  // Prompt display state
  const [currentPromptIndex, setCurrentPromptIndex] = useState(-1);
  const [promptPhase, setPromptPhase] = useState('hidden'); // 'hidden' | 'fading-in' | 'visible' | 'fading-out'
  const [elapsedTime, setElapsedTime] = useState(0);

  // Refs for tracking
  const lastPromptRef = useRef(-1);
  const textFadeTimeoutRef = useRef(null);
  const rafRef = useRef(null);

  // Audio playback hook (single-source continuous player)
  const audio = useAudioPlayback({
    onEnded: () => {
      // Only handle if we actually loaded a meditation (prevents spurious state changes)
      if (blobUrlRef.current) {
        pauseMeditationPlayback();
      }
    },
    onTimeUpdate: (currentTime) => {
      setElapsedTime(currentTime);
    },
    onError: (e) => {
      // Only log/handle errors for active meditation playback
      if (blobUrlRef.current) {
        console.warn('Audio playback error:', e);
      }
    },
  });

  // Stale-state recovery: if the persisted store says this module has started
  // but we have no blob URL (e.g., after page reload or error), reset playback
  // so the user sees "Begin" instead of a broken "Resume" button.
  useEffect(() => {
    if (hasStarted && !blobUrlRef.current && !isLoading) {
      resetMeditationPlayback();
    }
  }, [hasStarted, isLoading, resetMeditationPlayback]);

  // Set up Media Session API for lock-screen controls.
  // Handlers use audio.isPaused() to read directly from the element, avoiding
  // stale closure issues. isPlaying is intentionally excluded from deps so
  // handlers aren't torn down and re-registered on every play/pause toggle.
  useEffect(() => {
    if (!hasStarted || !meditation || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: meditation.title,
      artist: 'm-session',
      album: 'Guided Meditation',
    });

    navigator.mediaSession.setActionHandler('play', () => {
      if (audio.isPaused()) {
        resumeMeditationPlayback();
        audio.resume();
      }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      if (!audio.isPaused()) {
        pauseMeditationPlayback();
        audio.pause();
      }
    });

    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
      } catch {
        // Some browsers don't support removing handlers
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted, meditation, audio, pauseMeditationPlayback, resumeMeditationPlayback]);

  // Update lock-screen position state so iOS displays duration and progress
  useEffect(() => {
    if (!hasStarted || !('mediaSession' in navigator)) return;
    const composedTotal = composedDurationRef.current;
    if (composedTotal <= 0) return;

    try {
      navigator.mediaSession.setPositionState({
        duration: composedTotal,
        playbackRate: 1,
        position: Math.min(elapsedTime, composedTotal),
      });
    } catch {
      // iOS throws on invalid values; ignore
    }
  }, [hasStarted, elapsedTime]);

  // Prompt progression based on elapsed time (driven by audio.currentTime via onTimeUpdate)
  useEffect(() => {
    if (!hasStarted || !isPlaying || promptTimeMapRef.current.length === 0) return;

    const map = promptTimeMapRef.current;

    // Find which prompt should be active
    let targetIndex = -1;
    for (let i = 0; i < map.length; i++) {
      if (elapsedTime >= map[i].audioTimeStart) {
        targetIndex = i;
      }
    }

    // If we've moved to a new prompt
    if (targetIndex !== currentPromptIndex && targetIndex >= 0) {
      setCurrentPromptIndex(targetIndex);

      if (targetIndex !== lastPromptRef.current) {
        lastPromptRef.current = targetIndex;
        const prompt = map[targetIndex];

        // Clear any pending fade timeout
        if (textFadeTimeoutRef.current) {
          clearTimeout(textFadeTimeoutRef.current);
          textFadeTimeoutRef.current = null;
        }

        // Fade in text after slight delay (audio leads text)
        setPromptPhase('hidden');
        setTimeout(() => {
          setPromptPhase('fading-in');
          setTimeout(() => setPromptPhase('visible'), 300);
        }, TEXT_FADE_IN_DELAY);

        // Schedule text fade-out based on prompt end time
        const timeUntilClipEnd = (prompt.audioTimeEnd - elapsedTime) * 1000;
        const fadeOutDelay = Math.max(0, timeUntilClipEnd) + TEXT_FADE_OUT_INTO_SILENCE;

        // If muted, use fallback display duration instead
        if (audio.isMuted) {
          textFadeTimeoutRef.current = setTimeout(() => {
            setPromptPhase('fading-out');
          }, PROMPT_DISPLAY_DURATION);
        } else {
          textFadeTimeoutRef.current = setTimeout(() => {
            setPromptPhase('fading-out');
          }, fadeOutDelay);
        }
      }
    }
  }, [elapsedTime, hasStarted, isPlaying, currentPromptIndex, audio.isMuted]);

  // Report timer state to parent for ModuleStatusBar
  // (report against original totalDuration so progress bar isn't affected by preamble)
  useEffect(() => {
    if (!onTimerUpdate) return;

    // Subtract preamble so user-visible timer starts at 0 after gong
    const userElapsed = Math.max(0, elapsedTime - GONG_PREAMBLE);
    const progress = totalDuration > 0 ? Math.min((userElapsed / totalDuration) * 100, 100) : 0;
    const composedTotal = composedDurationRef.current;
    const isComplete = elapsedTime >= composedTotal && composedTotal > 0 && hasStarted;

    onTimerUpdate({
      progress,
      elapsed: userElapsed,
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
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      // Revoke blob URL to free memory
      if (blobUrlRef.current) {
        revokeMeditationBlobUrl(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  // Handlers
  const handleStart = useCallback(async () => {
    setIsLoading(true);

    try {
      // Compose the meditation into a single continuous MP3 blob
      const { blobUrl, composedBytes, promptTimeMap, totalDuration: composedTotal } = await composeMeditationAudio(
        timedSequence,
        { gongDelay: GONG_DELAY, gongPreamble: GONG_PREAMBLE }
      );

      // Store refs for playback
      blobUrlRef.current = blobUrl;
      promptTimeMapRef.current = promptTimeMap;
      composedDurationRef.current = composedTotal;

      // Store composed bytes for iOS blob-recreation resume
      audio.storeComposedBytes(composedBytes);

      // Reset display state
      setElapsedTime(0);
      setCurrentPromptIndex(-1);
      lastPromptRef.current = -1;
      setPromptPhase('hidden');

      // Mark as started in store
      startMeditationPlayback(moduleInstanceId);

      // Start playback (within user gesture chain)
      const success = await audio.loadAndPlay(blobUrl);
      if (!success) {
        console.error('[MeditationPlayback] Failed to start audio playback');
        resetMeditationPlayback();
      }
    } catch (err) {
      console.error('[MeditationPlayback] Failed to compose meditation audio:', err);
      resetMeditationPlayback();
    } finally {
      setIsLoading(false);
    }
  }, [timedSequence, moduleInstanceId, startMeditationPlayback, resetMeditationPlayback, audio]);

  // Use audio.isPaused() as the source of truth instead of store's isPlaying.
  // This reads directly from the <audio> element, so it's never stale — even
  // if the booster modal changed the store behind our back, or rapid taps
  // outrun React re-renders.
  const handlePauseResume = useCallback(() => {
    if (!audio.isPaused()) {
      pauseMeditationPlayback();
      audio.pause();
    } else {
      resumeMeditationPlayback();
      audio.resume();
    }
  }, [pauseMeditationPlayback, resumeMeditationPlayback, audio]);

  const handleComplete = useCallback(() => {
    audio.stop();
    resetMeditationPlayback();
    if (blobUrlRef.current) {
      revokeMeditationBlobUrl(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    onComplete();
  }, [resetMeditationPlayback, audio, onComplete]);

  const handleSkip = useCallback(() => {
    audio.stop();
    resetMeditationPlayback();
    if (blobUrlRef.current) {
      revokeMeditationBlobUrl(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    onSkip();
  }, [resetMeditationPlayback, audio, onSkip]);

  // Derived state
  const composedTotal = composedDurationRef.current;
  const isComplete = elapsedTime >= composedTotal && composedTotal > 0 && hasStarted;
  const currentPrompt = promptTimeMapRef.current[currentPromptIndex];

  const getPhase = useCallback(() => {
    if (isLoading) return 'loading';
    if (!hasStarted) return 'idle';
    if (isComplete) return 'completed';
    return 'active';
  }, [isLoading, hasStarted, isComplete]);

  const getPrimaryButton = useCallback(() => {
    const phase = getPhase();

    if (phase === 'idle') {
      return { label: 'Begin', onClick: handleStart };
    }
    if (phase === 'loading') {
      return { label: 'Preparing...', onClick: () => {}, disabled: true };
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
    isLoading,
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

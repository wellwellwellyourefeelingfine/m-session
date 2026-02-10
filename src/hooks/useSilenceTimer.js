/**
 * useSilenceTimer Hook
 *
 * A reusable timer that plays a composed silence audio blob (gong + silence + gong)
 * to keep the audio session alive on iOS even when the screen is locked.
 *
 * Unlike useMeditationPlayback (which handles TTS clips + text sync), this hook
 * is for simple timed modules that need background timer resilience.
 *
 * Features:
 * - Composes gong-bookended silence blob via audioComposerService
 * - Tracks elapsed time via wall-clock (Date.now) — bypasses iOS blob URL currentTime bug
 * - Supports mid-session duration changes via resize()
 * - Integrates with meditationPlayback store (prevents concurrent modules)
 * - Media Session API for iOS lock-screen controls
 * - Stale-state recovery on page reload
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSessionStore } from '../stores/useSessionStore';
import { useAudioPlayback } from './useAudioPlayback';
import { composeSilenceTimer, revokeMeditationBlobUrl } from '../services/audioComposerService';

// Gong timing defaults
const GONG_DELAY = 1;       // seconds of silence before opening gong
const GONG_PREAMBLE = 3;    // total seconds before user-visible timer starts

export function useSilenceTimer({
  moduleInstanceId,
  durationSeconds,
  onComplete,
  onSkip,
  onTimerUpdate,
  title = 'Timer',
}) {
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
  const [elapsedTime, setElapsedTime] = useState(0);
  const blobUrlRef = useRef(null);
  const preambleEndRef = useRef(GONG_PREAMBLE);
  const composedTotalRef = useRef(0);
  const durationSecondsRef = useRef(durationSeconds);
  const isResizingRef = useRef(false);
  const elapsedOffsetRef = useRef(0); // Accumulated elapsed time from before resize

  // Keep duration ref in sync
  durationSecondsRef.current = durationSeconds;

  // Audio playback hook
  const audio = useAudioPlayback({
    onEnded: () => {
      if (blobUrlRef.current) {
        pauseMeditationPlayback();
      }
    },
    onTimeUpdate: (currentTime) => {
      // User-visible elapsed = audio time minus preamble + any offset from previous resizes
      const userElapsed = Math.max(0, currentTime - preambleEndRef.current) + elapsedOffsetRef.current;
      setElapsedTime(userElapsed);
    },
    onError: (e) => {
      if (blobUrlRef.current) {
        console.warn('[SilenceTimer] Audio playback error:', e);
      }
    },
  });

  // Derived state
  const composedTotal = composedTotalRef.current;
  const rawElapsed = audio.getCurrentTime();
  const isComplete = hasStarted && composedTotal > 0 && rawElapsed >= composedTotal - 0.5;

  // Stale-state recovery: if store says started but no blob (page reload), reset
  useEffect(() => {
    if (hasStarted && !blobUrlRef.current && !isLoading) {
      resetMeditationPlayback();
    }
  }, [hasStarted, isLoading, resetMeditationPlayback]);

  // Sync store's isPlaying state to the audio element.
  // Booster modal actions update the store but can't access the audio element.
  useEffect(() => {
    if (!hasStarted || isLoading) return;
    if (isPlaying && audio.isPaused()) {
      audio.resume();
    } else if (!isPlaying && !audio.isPaused()) {
      audio.pause();
    }
  }, [isPlaying, hasStarted, isLoading, audio]);

  // Media Session API for lock-screen controls.
  // Handlers use audio.isPaused() to read directly from the element, avoiding
  // stale closure issues. isPlaying is intentionally excluded from deps so
  // handlers aren't torn down and re-registered on every play/pause toggle.
  useEffect(() => {
    if (!hasStarted || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: 'm-session',
      album: 'Open Space',
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
  }, [hasStarted, title, audio, pauseMeditationPlayback, resumeMeditationPlayback]);

  // Update lock-screen position state so iOS displays duration and progress.
  // Position is the raw audio time (includes preamble) since that's what the
  // audio element is actually playing.
  useEffect(() => {
    if (!hasStarted || !('mediaSession' in navigator)) return;
    const composed = composedTotalRef.current;
    if (composed <= 0) return;

    // Raw audio position = elapsedTime (user-visible) - offset + preamble
    const rawPosition = elapsedTime - elapsedOffsetRef.current + preambleEndRef.current;

    try {
      navigator.mediaSession.setPositionState({
        duration: composed,
        playbackRate: 1,
        position: Math.max(0, Math.min(rawPosition, composed)),
      });
    } catch {
      // iOS throws on invalid values; ignore
    }
  }, [hasStarted, elapsedTime]);

  // Report timer state to parent for ModuleStatusBar
  useEffect(() => {
    if (!onTimerUpdate) return;

    const progress = durationSeconds > 0
      ? Math.min((elapsedTime / durationSeconds) * 100, 100)
      : 0;

    onTimerUpdate({
      progress,
      elapsed: elapsedTime,
      total: durationSeconds,
      showTimer: hasStarted && !isComplete,
      isPaused: !isPlaying,
    });
  }, [elapsedTime, durationSeconds, hasStarted, isPlaying, isComplete, onTimerUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        revokeMeditationBlobUrl(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  // Start: compose blob and begin playback
  const handleStart = useCallback(async () => {
    setIsLoading(true);

    try {
      const { blobUrl, composedBytes, totalDuration, preambleEnd } = await composeSilenceTimer(
        durationSecondsRef.current,
        { gongDelay: GONG_DELAY, gongPreamble: GONG_PREAMBLE }
      );

      blobUrlRef.current = blobUrl;
      preambleEndRef.current = preambleEnd;
      composedTotalRef.current = totalDuration;

      // Store composed bytes for iOS blob-recreation resume
      audio.storeComposedBytes(composedBytes);

      setElapsedTime(0);
      elapsedOffsetRef.current = 0;
      startMeditationPlayback(moduleInstanceId);

      const success = await audio.loadAndPlay(blobUrl);
      if (!success) {
        console.error('[SilenceTimer] Failed to start audio playback');
        resetMeditationPlayback();
      }
    } catch (err) {
      console.error('[SilenceTimer] Failed to compose silence timer:', err);
      resetMeditationPlayback();
    } finally {
      setIsLoading(false);
    }
  }, [moduleInstanceId, startMeditationPlayback, resetMeditationPlayback, audio]);

  // Use audio.isPaused() as the source of truth instead of store's isPlaying.
  // This reads directly from the <audio> element, so it's never stale.
  const handlePauseResume = useCallback(() => {
    if (!audio.isPaused()) {
      pauseMeditationPlayback();
      audio.pause();
    } else {
      resumeMeditationPlayback();
      audio.resume();
    }
  }, [pauseMeditationPlayback, resumeMeditationPlayback, audio]);

  // Complete: stop, cleanup, advance
  const handleComplete = useCallback(() => {
    audio.stop();
    resetMeditationPlayback();
    if (blobUrlRef.current) {
      revokeMeditationBlobUrl(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    onComplete();
  }, [resetMeditationPlayback, audio, onComplete]);

  // Skip: stop, cleanup, skip
  const handleSkip = useCallback(() => {
    console.log('[SilenceTimer] handleSkip called');
    try {
      audio.stop();
      resetMeditationPlayback();
      if (blobUrlRef.current) {
        revokeMeditationBlobUrl(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      console.log('[SilenceTimer] calling onSkip()...');
      onSkip();
      console.log('[SilenceTimer] onSkip() done');
    } catch (err) {
      console.error('[SilenceTimer] handleSkip ERROR:', err);
      try { onSkip(); } catch (e2) { console.error('[SilenceTimer] fallback onSkip ERROR:', e2); }
    }
  }, [resetMeditationPlayback, audio, onSkip]);

  // Resize: re-compose blob for remaining time (no opening gong), preserving elapsed display
  const resize = useCallback(async (newDurationSeconds) => {
    if (!blobUrlRef.current || isResizingRef.current) return;
    isResizingRef.current = true;

    try {
      // Total user-visible elapsed = audio position in current blob (minus preamble) + any prior offset
      const currentAudioTime = audio.getCurrentTime();
      const totalUserElapsed = Math.max(0, currentAudioTime - preambleEndRef.current) + elapsedOffsetRef.current;
      const wasPlaying = !audio.isPaused();

      // Pause during recomposition
      if (wasPlaying) {
        audio.pause();
      }

      const oldBlobUrl = blobUrlRef.current;

      // Compose a new blob with only the REMAINING silence + closing gong.
      // skipOpeningGong=true means no gong/preamble at the start, so the blob
      // begins directly with silence and the user won't hear the gong replay.
      const remainingSeconds = Math.max(0, newDurationSeconds - totalUserElapsed);
      const { blobUrl, composedBytes, totalDuration } = await composeSilenceTimer(
        remainingSeconds,
        { skipOpeningGong: true }
      );

      // Update offset BEFORE loading so onTimeUpdate reads the correct value immediately.
      // New blob starts at position 0, so: displayed elapsed = 0 - 0 + totalUserElapsed = correct.
      elapsedOffsetRef.current = totalUserElapsed;
      preambleEndRef.current = 0;
      blobUrlRef.current = blobUrl;
      composedTotalRef.current = totalDuration;

      // Store new composed bytes for iOS blob-recreation resume
      audio.storeComposedBytes(composedBytes);

      // Load new blob — starts at position 0 (which is the current point in time)
      await audio.loadAndPlay(blobUrl);

      // If we were paused, pause again after loading
      if (!wasPlaying) {
        audio.pause();
      }

      // Revoke old blob URL
      revokeMeditationBlobUrl(oldBlobUrl);
    } catch (err) {
      console.error('[SilenceTimer] Failed to resize:', err);
    } finally {
      isResizingRef.current = false;
    }
  }, [audio]);

  // Phase helper
  const getPhase = useCallback(() => {
    if (isLoading) return 'loading';
    if (!hasStarted) return 'idle';
    if (isComplete) return 'completed';
    return 'active';
  }, [isLoading, hasStarted, isComplete]);

  return {
    // State
    hasStarted,
    isPlaying,
    isLoading,
    isComplete,
    elapsedTime,

    // Audio instance (for mute toggle)
    audio,

    // Handlers
    handleStart,
    handlePauseResume,
    handleComplete,
    handleSkip,
    resize,

    // UI helpers
    getPhase,
  };
}

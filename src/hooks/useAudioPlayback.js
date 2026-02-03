/**
 * useAudioPlayback Hook
 *
 * A single-source continuous audio player for composed meditation blobs.
 * Manages one <audio> element playing a single blob URL from start to finish.
 *
 * Features:
 * - Play/pause/resume a single continuous audio stream
 * - Mute state management (audio keeps playing, just silent)
 * - Time tracking via audio.currentTime with polling fallback
 * - Position preservation across pause/resume (iOS blob URL resilience)
 * - Event callbacks (onEnded, onError, onPlay, onPause, onTimeUpdate)
 * - Blob URL lifecycle (load once, revoke on cleanup)
 *
 * Usage:
 *   const audio = useAudioPlayback({
 *     onEnded: () => console.log('Audio finished'),
 *     onTimeUpdate: (currentTime) => console.log(currentTime),
 *   });
 *
 *   audio.loadAndPlay(blobUrl);
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// Polling interval for timeupdate fallback (ms).
// setInterval is used instead of rAF because rAF stops when iOS backgrounds the page,
// while setInterval continues at a reduced frequency (~1Hz), keeping the timer alive.
const POLL_INTERVAL_MS = 250;

export function useAudioPlayback({ onEnded, onError, onPlay, onPause, onTimeUpdate } = {}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);

  // Store callbacks in refs so event listeners don't churn on every render
  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { onPlayRef.current = onPlay; }, [onPlay]);
  useEffect(() => { onPauseRef.current = onPause; }, [onPause]);
  useEffect(() => { onTimeUpdateRef.current = onTimeUpdate; }, [onTimeUpdate]);

  // Position preservation: tracks the last known good currentTime.
  // Saved continuously during playback and checked after resume to detect iOS resets.
  const savedTimeRef = useRef(0);

  // Polling fallback for unreliable timeupdate on iOS blob URLs
  const pollIntervalRef = useRef(null);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    pollIntervalRef.current = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        const t = audioRef.current.currentTime;
        savedTimeRef.current = t;
        onTimeUpdateRef.current?.(t);
      }
    }, POLL_INTERVAL_MS);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Lazily create the Audio element (preload='none' to prevent empty-src errors)
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'none';
    }
    return audioRef.current;
  }, []);

  // Set up event listeners once
  const listenersAttachedRef = useRef(false);

  const attachListeners = useCallback((audio) => {
    if (listenersAttachedRef.current) return;
    listenersAttachedRef.current = true;

    audio.addEventListener('ended', () => {
      stopPolling();
      setIsPlaying(false);
      onEndedRef.current?.();
    });

    audio.addEventListener('error', () => {
      // Ignore errors when src is empty/unset — these fire spuriously
      // (e.g., when Audio element is created before a blob URL is loaded)
      if (!audio.src || audio.src === '' || audio.src === window.location.href) return;

      stopPolling();
      const errorInfo = {
        code: audio.error?.code,
        message: audio.error?.message || 'Unknown audio error',
      };
      setError(errorInfo);
      setIsPlaying(false);
      setIsLoaded(false);
      onErrorRef.current?.(errorInfo);
    });

    audio.addEventListener('canplaythrough', () => {
      setIsLoaded(true);
      setError(null);
    });

    audio.addEventListener('play', () => {
      setIsPlaying(true);
      onPlayRef.current?.();
    });

    audio.addEventListener('pause', () => {
      setIsPlaying(false);
      onPauseRef.current?.();
    });

    // Native timeupdate — still fires when it can, supplements the polling fallback.
    // Duplicate calls with the same value are harmless (React batches identical setState).
    audio.addEventListener('timeupdate', () => {
      const t = audio.currentTime;
      savedTimeRef.current = t;
      onTimeUpdateRef.current?.(t);
    });
  }, [stopPolling]);

  // Update mute state on audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [stopPolling]);

  // Load a blob URL and begin playback
  const loadAndPlay = useCallback(async (blobUrl) => {
    if (!blobUrl) return false;

    const audio = getAudio();
    attachListeners(audio);

    // Reset position tracking for a new blob
    savedTimeRef.current = 0;
    stopPolling();

    setIsLoaded(false);
    setError(null);

    audio.preload = 'auto';
    audio.src = blobUrl;
    audio.load();

    return new Promise((resolve) => {
      let settled = false;
      const settle = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      const attemptPlay = async () => {
        try {
          await audio.play();
          startPolling();
          settle(true);
        } catch (e) {
          const errorInfo = {
            code: 'PLAY_FAILED',
            message: e.message || 'Failed to play audio',
          };
          setError(errorInfo);
          onErrorRef.current?.(errorInfo);
          settle(false);
        }
      };

      if (audio.readyState >= 3) {
        attemptPlay();
      } else {
        const onCanPlay = () => {
          audio.removeEventListener('canplay', onCanPlay);
          attemptPlay();
        };
        audio.addEventListener('canplay', onCanPlay);

        // Timeout fallback for slow loads
        setTimeout(() => {
          audio.removeEventListener('canplay', onCanPlay);
          attemptPlay();
        }, 5000);
      }
    });
  }, [getAudio, attachListeners, startPolling, stopPolling]);

  // Pause playback — saves position before pausing
  const pause = useCallback(() => {
    if (audioRef.current) {
      savedTimeRef.current = audioRef.current.currentTime;
      audioRef.current.pause();
      stopPolling();
    }
  }, [stopPolling]);

  // Resume from pause — verifies position wasn't reset by iOS
  const resume = useCallback(async () => {
    if (!audioRef.current) return false;
    try {
      const targetTime = savedTimeRef.current;
      await audioRef.current.play();

      // iOS may reset currentTime to 0 when resuming a blob URL after backgrounding.
      // If we had a meaningful position and it got reset, seek back to it.
      if (targetTime > 0.5 && audioRef.current.currentTime < targetTime - 0.5) {
        audioRef.current.currentTime = targetTime;
      }

      startPolling();
      return true;
    } catch {
      return false;
    }
  }, [startPolling]);

  // Stop and reset
  const stop = useCallback(() => {
    stopPolling();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      savedTimeRef.current = 0;
      setIsPlaying(false);
    }
  }, [stopPolling]);

  // Toggle mute (audio keeps playing, just silent — important for time tracking)
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Get current playback time
  const getCurrentTime = useCallback(() => {
    return audioRef.current?.currentTime || 0;
  }, []);

  // Get duration
  const getDuration = useCallback(() => {
    return audioRef.current?.duration || 0;
  }, []);

  // Check if audio element is paused — reads directly from the element, never stale
  const isPaused = useCallback(() => {
    return audioRef.current?.paused ?? true;
  }, []);

  // Seek to position
  const seek = useCallback((time) => {
    if (audioRef.current && isFinite(time)) {
      audioRef.current.currentTime = Math.max(0, Math.min(time, audioRef.current.duration || 0));
      savedTimeRef.current = audioRef.current.currentTime;
    }
  }, []);

  return {
    // State
    isPlaying,
    isLoaded,
    isMuted,
    error,

    // Actions
    loadAndPlay,
    pause,
    resume,
    stop,
    seek,
    toggleMute,
    setMuted: setIsMuted,

    // Getters
    getCurrentTime,
    getDuration,
    isPaused,
  };
}

export default useAudioPlayback;

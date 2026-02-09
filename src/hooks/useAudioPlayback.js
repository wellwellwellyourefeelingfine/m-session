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
import { CBR_BYTES_PER_SECOND, findNextFrameBoundary } from '../services/audioComposerService';

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

  // Position preservation: tracks the last known good absolute currentTime.
  // Saved continuously during playback. After blob recreation, stores absolute time
  // (raw currentTime + timeOffsetRef) so byte-offset calculation is correct.
  const savedTimeRef = useRef(0);

  // For iOS blob-recreation resume: the full composed MP3 bytes.
  // Stored by orchestrator hooks after composition via storeComposedBytes().
  const composedBytesRef = useRef(null);

  // Time offset added to audio.currentTime when reporting to upstream hooks.
  // After blob recreation, audio.currentTime starts at 0 for the sliced blob,
  // but upstream hooks need absolute position in the original composition.
  const timeOffsetRef = useRef(0);

  // Current blob URL for revocation when recreating blobs on resume
  const currentBlobUrlRef = useRef(null);

  // Polling fallback for unreliable timeupdate on iOS blob URLs
  const pollIntervalRef = useRef(null);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    pollIntervalRef.current = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        const t = audioRef.current.currentTime + timeOffsetRef.current;
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
      const t = audio.currentTime + timeOffsetRef.current;
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
      composedBytesRef.current = null;
      timeOffsetRef.current = 0;
    };
  }, [stopPolling]);

  // Load a blob URL and begin playback
  const loadAndPlay = useCallback(async (blobUrl) => {
    if (!blobUrl) return false;

    const audio = getAudio();
    attachListeners(audio);

    // Reset position tracking for a new blob
    savedTimeRef.current = 0;
    timeOffsetRef.current = 0;
    currentBlobUrlRef.current = blobUrl;
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

        // Timeout fallback for slow loads.
        // Guard with `settled` to prevent calling play() twice — on iOS Safari,
        // a redundant play() on an already-playing blob URL can restart from 0.
        setTimeout(() => {
          audio.removeEventListener('canplay', onCanPlay);
          if (!settled) {
            attemptPlay();
          }
        }, 5000);
      }
    });
  }, [getAudio, attachListeners, startPolling, stopPolling]);

  // Pause playback — saves absolute position before pausing
  const pause = useCallback(() => {
    if (audioRef.current) {
      savedTimeRef.current = audioRef.current.currentTime + timeOffsetRef.current;
      audioRef.current.pause();
      stopPolling();
    }
  }, [stopPolling]);

  // Resume from bytes: creates a new blob from the remaining portion of the
  // composed audio. Completely bypasses iOS WebKit blob URL seeking issues.
  const resumeFromBytes = useCallback(async () => {
    const bytes = composedBytesRef.current;
    if (!bytes || !audioRef.current) return false;

    try {
      const absoluteTime = savedTimeRef.current;
      const rawByteOffset = Math.floor(absoluteTime * CBR_BYTES_PER_SECOND);
      const frameAlignedOffset = findNextFrameBoundary(bytes, Math.min(rawByteOffset, bytes.length - 1));

      // Slice remaining bytes (subarray is zero-copy — shares underlying ArrayBuffer)
      const remainingBytes = bytes.subarray(frameAlignedOffset);
      const newBlob = new Blob([remainingBytes], { type: 'audio/mpeg' });
      const newBlobUrl = URL.createObjectURL(newBlob);

      // Revoke old blob URL
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
      }
      currentBlobUrlRef.current = newBlobUrl;

      // Set time offset so onTimeUpdate reports absolute position.
      // audio.currentTime will start at 0 for the new blob.
      timeOffsetRef.current = frameAlignedOffset / CBR_BYTES_PER_SECOND;

      // Load and play the sliced blob
      const audio = audioRef.current;
      audio.preload = 'auto';
      audio.src = newBlobUrl;
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
          } catch {
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

          // Shorter timeout for resume — data is already in memory
          setTimeout(() => {
            audio.removeEventListener('canplay', onCanPlay);
            if (!settled) {
              attemptPlay();
            }
          }, 3000);
        }
      });
    } catch (e) {
      console.warn('[AudioPlayback] resumeFromBytes failed:', e);
      return false;
    }
  }, [startPolling]);

  // Resume from pause — tries seek-before-play first (fast path for desktop and
  // iOS when buffer hasn't been evicted). If iOS resets currentTime to 0 after
  // play(), falls back to blob recreation from composed bytes.
  const resume = useCallback(async () => {
    if (!audioRef.current) return false;

    const absoluteTarget = savedTimeRef.current;

    // For very early positions, just play — no meaningful seeking needed
    if (absoluteTarget <= 0.5) {
      try {
        await audioRef.current.play();
        startPolling();
        return true;
      } catch {
        return false;
      }
    }

    // Fast path: try seek-before-play
    try {
      // Convert absolute target to position within current blob
      const blobTarget = absoluteTarget - timeOffsetRef.current;
      audioRef.current.currentTime = blobTarget;
      await audioRef.current.play();

      // Check if seek survived the play() call
      const actualTime = audioRef.current.currentTime;
      if (actualTime >= blobTarget - 1.0) {
        // Seek worked — start polling and we're done
        startPolling();
        return true;
      }

      // Seek failed (iOS reset currentTime to ~0). Fall back to blob recreation.
      audioRef.current.pause();
    } catch {
      // play() itself failed — try blob recreation
    }

    // Fallback: recreate blob from composed bytes
    if (composedBytesRef.current) {
      return resumeFromBytes();
    }

    return false;
  }, [startPolling, resumeFromBytes]);

  // Stop and reset
  const stop = useCallback(() => {
    stopPolling();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      savedTimeRef.current = 0;
      timeOffsetRef.current = 0;
      setIsPlaying(false);
    }
  }, [stopPolling]);

  // Toggle mute (audio keeps playing, just silent — important for time tracking)
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Get current playback time (absolute, including offset from blob recreation)
  const getCurrentTime = useCallback(() => {
    return (audioRef.current?.currentTime || 0) + timeOffsetRef.current;
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
      savedTimeRef.current = audioRef.current.currentTime + timeOffsetRef.current;
    }
  }, []);

  // Store the raw composed bytes for iOS blob-recreation resume.
  // Called by orchestrator hooks after composing audio.
  const storeComposedBytes = useCallback((bytes) => {
    composedBytesRef.current = bytes;
    timeOffsetRef.current = 0;
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
    storeComposedBytes,

    // Getters
    getCurrentTime,
    getDuration,
    isPaused,
  };
}

export default useAudioPlayback;

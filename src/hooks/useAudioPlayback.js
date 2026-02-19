/**
 * useAudioPlayback Hook
 *
 * A single-source continuous audio player for composed meditation blobs.
 * Manages one <audio> element playing a single blob URL from start to finish.
 *
 * Features:
 * - Play/pause/resume a single continuous audio stream
 * - Mute state management (audio keeps playing, just silent)
 * - Time tracking via wall-clock (Date.now) — bypasses iOS blob URL currentTime bug
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

  // Wall-clock timer: bypasses iOS Safari's broken audio.currentTime for blob URLs.
  // Tracks real elapsed time via Date.now() instead of relying on the audio element.
  const wallStartRef = useRef(0);         // Date.now() when playback started/resumed
  const wallAccumulatedRef = useRef(0);   // seconds accumulated from prior play periods

  const getWallTime = () => {
    if (!wallStartRef.current) return wallAccumulatedRef.current;
    return wallAccumulatedRef.current + (Date.now() - wallStartRef.current) / 1000;
  };

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    wallStartRef.current = Date.now();
    pollIntervalRef.current = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        const t = getWallTime();
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
      // Freeze wall-clock so getCurrentTime() returns the final position
      if (wallStartRef.current) {
        wallAccumulatedRef.current += (Date.now() - wallStartRef.current) / 1000;
        wallStartRef.current = 0;
      }
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

    // Native timeupdate — supplements polling with wall-clock time.
    audio.addEventListener('timeupdate', () => {
      if (!wallStartRef.current) return;
      const t = getWallTime();
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
      wallStartRef.current = 0;
      wallAccumulatedRef.current = 0;
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
    wallStartRef.current = 0;
    wallAccumulatedRef.current = 0;
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

  // Pause playback — accumulates wall-clock time and saves position
  const pause = useCallback(() => {
    if (audioRef.current) {
      // Accumulate wall-clock elapsed before pausing
      if (wallStartRef.current) {
        wallAccumulatedRef.current += (Date.now() - wallStartRef.current) / 1000;
        wallStartRef.current = 0;
      }
      savedTimeRef.current = wallAccumulatedRef.current;
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

  // Resume from pause — uses blob recreation for reliable seeking across all platforms.
  // Direct seeking (currentTime assignment) is unreliable for composed blob URLs:
  // desktop browsers may report success while the decoder starts from position 0,
  // and iOS resets currentTime entirely. Blob recreation bypasses seeking.
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

    // Use blob recreation for reliable resume.
    // Composed blob URLs (headerless MP3 concatenation) don't support reliable
    // seeking — desktop browsers may accept the currentTime assignment but the
    // decoder starts from byte 0. resumeFromBytes() bypasses this entirely by
    // slicing the composed bytes at the pause point and creating a fresh blob.
    if (composedBytesRef.current) {
      return resumeFromBytes();
    }

    // No composed bytes available — try direct seek as last resort
    try {
      const blobTarget = absoluteTarget - timeOffsetRef.current;
      audioRef.current.currentTime = blobTarget;
      await audioRef.current.play();
      startPolling();
      return true;
    } catch {
      return false;
    }
  }, [startPolling, resumeFromBytes]);

  // Stop and reset
  const stop = useCallback(() => {
    stopPolling();
    wallStartRef.current = 0;
    wallAccumulatedRef.current = 0;
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

  // Get current playback time (wall-clock based, not audio.currentTime)
  const getCurrentTime = useCallback(() => {
    return getWallTime();
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

/**
 * useAudioPlayback Hook
 *
 * A single-source continuous audio player for composed meditation blobs.
 * Manages one <audio> element playing a single blob URL from start to finish.
 *
 * Features:
 * - Play/pause/resume a single continuous audio stream
 * - Mute state management (audio keeps playing, just silent)
 * - Time tracking via audio.currentTime
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
      setIsPlaying(false);
      onEndedRef.current?.();
    });

    audio.addEventListener('error', () => {
      // Ignore errors when src is empty/unset — these fire spuriously
      // (e.g., when Audio element is created before a blob URL is loaded)
      if (!audio.src || audio.src === '' || audio.src === window.location.href) return;

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

    audio.addEventListener('timeupdate', () => {
      onTimeUpdateRef.current?.(audio.currentTime);
    });
  }, []);

  // Update mute state on audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Load a blob URL and begin playback
  const loadAndPlay = useCallback(async (blobUrl) => {
    if (!blobUrl) return false;

    const audio = getAudio();
    attachListeners(audio);

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
  }, [getAudio, attachListeners]);

  // Pause playback
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  // Resume from pause
  const resume = useCallback(async () => {
    if (!audioRef.current) return false;
    try {
      await audioRef.current.play();
      return true;
    } catch {
      return false;
    }
  }, []);

  // Stop and reset
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

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

  // Seek to position
  const seek = useCallback((time) => {
    if (audioRef.current && isFinite(time)) {
      audioRef.current.currentTime = Math.max(0, Math.min(time, audioRef.current.duration || 0));
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
  };
}

export default useAudioPlayback;

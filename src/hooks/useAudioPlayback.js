/**
 * useAudioPlayback Hook
 *
 * A reusable hook for managing audio playback in meditation modules.
 *
 * Features:
 * - HTML5 Audio element management
 * - Preloading support for seamless transitions
 * - Play/pause/resume controls
 * - Mute state management
 * - Event callbacks (onEnded, onError, onPlay)
 * - Graceful error handling with fallback support
 *
 * Usage:
 * const audio = useAudioPlayback({
 *   onEnded: () => console.log('Audio finished'),
 *   onError: (e) => console.warn('Audio error', e),
 * });
 *
 * audio.load('/path/to/file.mp3');
 * audio.play();
 */

import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioPlayback({ onEnded, onError, onPlay } = {}) {
  const audioRef = useRef(null);
  const preloadCacheRef = useRef(new Map());
  const pendingPlayRef = useRef(0); // incremented to cancel pending loadAndPlay attempts
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);
  const [currentSrc, setCurrentSrc] = useState(null);

  // Store callbacks in refs so event listeners don't churn on every render
  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);
  const onPlayRef = useRef(onPlay);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { onPlayRef.current = onPlay; }, [onPlay]);

  // Lazily create the Audio element (avoids connecting to audio output until needed)
  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
    }
    return audioRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      preloadCacheRef.current.clear();
    };
  }, []);

  // Set up event listeners once (using refs for callbacks to avoid re-attachment)
  const listenersAttachedRef = useRef(false);

  const attachListeners = useCallback((audio) => {
    if (listenersAttachedRef.current) return;
    listenersAttachedRef.current = true;

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      onEndedRef.current?.();
    });

    audio.addEventListener('error', () => {
      const errorInfo = {
        code: audio.error?.code,
        message: audio.error?.message || 'Unknown audio error',
        src: audioRef.current?.src || null,
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
    });
  }, []);

  // Update mute state on audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Load a new audio source
  const load = useCallback((src) => {
    if (!src) return;
    const audio = getAudio();
    attachListeners(audio);

    setIsLoaded(false);
    setError(null);
    setCurrentSrc(src);
    audio.src = src;
    audio.load();
  }, [getAudio, attachListeners]);

  // Preload audio files using fetch to warm the HTTP/SW cache.
  // This avoids creating Audio elements (which can produce click artifacts
  // on some browsers when they connect to the audio output during decode).
  const preload = useCallback((srcs) => {
    if (!srcs || !Array.isArray(srcs)) return;
    const cache = preloadCacheRef.current;
    const MAX_CACHE = 5;

    srcs.forEach(src => {
      if (!src || cache.has(src)) return;

      // Evict oldest entry if at capacity
      if (cache.size >= MAX_CACHE) {
        const oldest = cache.keys().next().value;
        cache.delete(oldest);
      }

      // Use fetch to pull the file into the browser/SW cache
      // without creating an Audio element or decoding audio data
      fetch(src).catch(() => {});
      cache.set(src, true);
    });
  }, []);

  // Play current audio
  const play = useCallback(async () => {
    if (!audioRef.current) return false;

    try {
      await audioRef.current.play();
      return true;
    } catch (e) {
      // Handle autoplay restrictions or other errors
      const errorInfo = {
        code: 'PLAY_FAILED',
        message: e.message || 'Failed to play audio',
        src: currentSrc,
      };
      setError(errorInfo);
      onErrorRef.current?.(errorInfo);
      return false;
    }
  }, [currentSrc]);

  // Load and play in one step (cancellable via pendingPlayRef generation counter)
  const loadAndPlay = useCallback(async (src) => {
    if (!src) return false;

    // Bump the generation so any previous pending loadAndPlay is stale
    const generation = ++pendingPlayRef.current;

    load(src);

    return new Promise((resolve) => {
      const audio = audioRef.current;
      if (!audio) { resolve(false); return; }

      let settled = false;
      const settle = (value) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      const attemptPlay = async () => {
        // Cancel if a newer loadAndPlay was issued or component unmounted
        if (pendingPlayRef.current !== generation || !audioRef.current) {
          settle(false);
          return;
        }
        try {
          await audioRef.current.play();
          settle(true);
        } catch {
          settle(false);
        }
      };

      // Try immediately if already buffered
      if (audio.readyState >= 3) {
        attemptPlay();
      } else {
        const onCanPlay = () => {
          audio.removeEventListener('canplay', onCanPlay);
          attemptPlay();
        };
        audio.addEventListener('canplay', onCanPlay);

        // Longer timeout for mobile networks
        setTimeout(() => {
          audio.removeEventListener('canplay', onCanPlay);
          attemptPlay();
        }, 3000);
      }
    });
  }, [load]);

  // Pause audio (also cancels any pending loadAndPlay)
  const pause = useCallback(() => {
    pendingPlayRef.current++;
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
    } catch (e) {
      return false;
    }
  }, []);

  // Stop and reset (also cancels any pending loadAndPlay)
  const stop = useCallback(() => {
    pendingPlayRef.current++;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  // Toggle mute
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
    currentSrc,

    // Actions
    load,
    loadAndPlay,
    preload,
    play,
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

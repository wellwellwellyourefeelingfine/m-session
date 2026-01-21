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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState(null);
  const [currentSrc, setCurrentSrc] = useState(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Set up event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    const handleError = (e) => {
      const errorInfo = {
        code: audio.error?.code,
        message: audio.error?.message || 'Unknown audio error',
        src: currentSrc,
      };
      setError(errorInfo);
      setIsPlaying(false);
      setIsLoaded(false);
      onError?.(errorInfo);
    };

    const handleCanPlayThrough = () => {
      setIsLoaded(true);
      setError(null);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [currentSrc, onEnded, onError, onPlay]);

  // Update mute state on audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Load a new audio source
  const load = useCallback((src) => {
    if (!audioRef.current || !src) return;

    setIsLoaded(false);
    setError(null);
    setCurrentSrc(src);
    audioRef.current.src = src;
    audioRef.current.load();
  }, []);

  // Preload multiple audio files (creates temporary Audio objects)
  const preload = useCallback((srcs) => {
    if (!srcs || !Array.isArray(srcs)) return;

    srcs.forEach(src => {
      if (src) {
        const preloadAudio = new Audio();
        preloadAudio.preload = 'auto';
        preloadAudio.src = src;
        // The browser will cache these
      }
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
      onError?.(errorInfo);
      return false;
    }
  }, [currentSrc, onError]);

  // Load and play in one step
  const loadAndPlay = useCallback(async (src) => {
    if (!audioRef.current || !src) return false;

    load(src);

    // Wait a brief moment for load to start, then try to play
    // The 'canplaythrough' event will handle full loading
    return new Promise((resolve) => {
      const audio = audioRef.current;

      const attemptPlay = async () => {
        try {
          await audio.play();
          resolve(true);
        } catch (e) {
          // May need user interaction first on mobile
          resolve(false);
        }
      };

      // Try immediately if already loaded enough
      if (audio.readyState >= 3) {
        attemptPlay();
      } else {
        // Wait for enough data
        const onCanPlay = () => {
          audio.removeEventListener('canplay', onCanPlay);
          attemptPlay();
        };
        audio.addEventListener('canplay', onCanPlay);

        // Timeout fallback
        setTimeout(() => {
          audio.removeEventListener('canplay', onCanPlay);
          attemptPlay();
        }, 500);
      }
    });
  }, [load]);

  // Pause audio
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
    } catch (e) {
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

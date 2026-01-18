/**
 * AudioCapability Component
 *
 * Handles audio playback for modules (placeholder for future implementation):
 * - 'voiceover': Spoken guidance audio
 * - 'ambient': Background sounds/music
 * - 'bells': Interval bells/chimes
 *
 * This component provides the UI controls and infrastructure.
 * Audio playback will be implemented in a future iteration.
 */

import { useState, useCallback } from 'react';

/**
 * @param {object} props
 * @param {object} props.config - Audio capability config
 * @param {string} props.config.type - 'voiceover' | 'ambient' | 'bells'
 * @param {string} props.config.src - Audio source path
 * @param {boolean} props.config.showMuteButton - Show mute/unmute control
 * @param {boolean} props.config.autoPlay - Auto-start audio
 * @param {boolean} props.isActive - Whether audio should be playing
 */
export default function AudioCapability({
  config,
  isActive = false,
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Placeholder for future audio implementation
  // Will use Web Audio API or a library like Howler.js

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Don't render if no config or type
  if (!config || !config.type) {
    return null;
  }

  const { type, showMuteButton = true, src } = config;

  // Don't render controls if audio isn't ready
  // Future: This will check if audio file is loaded
  if (!src && type !== 'bells') {
    return null;
  }

  return (
    <div className="flex justify-center">
      {showMuteButton && (
        <AudioMuteButton
          isMuted={isMuted}
          onToggle={toggleMute}
          isActive={isActive}
        />
      )}

      {/* Future: Audio element or Web Audio context will be managed here */}
      {/* <audio ref={audioRef} src={src} /> */}
    </div>
  );
}

/**
 * Mute/Unmute Button
 */
function AudioMuteButton({ isMuted, onToggle, isActive }) {
  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-full transition-colors duration-200
        ${isActive
          ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          : 'text-[var(--color-text-tertiary)] opacity-50 cursor-not-allowed'
        }`}
      disabled={!isActive}
      aria-label={isMuted ? 'Unmute' : 'Mute'}
    >
      {isMuted ? (
        <MutedIcon />
      ) : (
        <UnmutedIcon />
      )}
    </button>
  );
}

/**
 * Volume/Unmuted Icon
 */
function UnmutedIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

/**
 * Muted Icon
 */
function MutedIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

/**
 * Standalone volume control for direct use
 */
export function VolumeControl({
  isMuted,
  onToggle,
  volume,
  onVolumeChange,
  showSlider = false,
}) {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onToggle}
        className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <MutedIcon /> : <UnmutedIcon />}
      </button>

      {showSlider && onVolumeChange && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={isMuted ? 0 : volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-20 h-1 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer"
        />
      )}
    </div>
  );
}

/**
 * Future: Audio playback hook
 *
 * export function useAudioPlayback({ src, autoPlay, loop }) {
 *   const audioRef = useRef(null);
 *   const [isPlaying, setIsPlaying] = useState(false);
 *   const [currentTime, setCurrentTime] = useState(0);
 *   const [duration, setDuration] = useState(0);
 *
 *   // ... implementation
 *
 *   return {
 *     audioRef,
 *     isPlaying,
 *     currentTime,
 *     duration,
 *     play,
 *     pause,
 *     seek,
 *   };
 * }
 */

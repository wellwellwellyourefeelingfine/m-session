/**
 * GuidedMeditationModule Component
 * Plays a timed meditation with text prompts that fade in/out
 * Supports pause/resume and displays a progress bar
 * State is persisted to survive tab navigation
 * Timer continues running even when tab is inactive (uses timestamp-based calculation)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getModuleById } from '../../../content/modules';
import { useSessionStore } from '../../../stores/useSessionStore';
import {
  getMeditationById,
  calculateSilenceMultiplier,
  generateTimedSequence,
  formatTime,
} from '../../../content/meditations';

export default function GuidedMeditationModule({ module, onComplete, onSkip }) {
  // Get meditation content
  const libraryModule = getModuleById(module.libraryId);
  const meditationId = libraryModule?.meditationId;
  const meditation = meditationId ? getMeditationById(meditationId) : null;

  // Get persisted state from store
  const meditationPlayback = useSessionStore((state) => state.meditationPlayback);
  const startMeditationPlayback = useSessionStore((state) => state.startMeditationPlayback);
  const updateMeditationPlayback = useSessionStore((state) => state.updateMeditationPlayback);
  const pauseMeditationPlayback = useSessionStore((state) => state.pauseMeditationPlayback);
  const resumeMeditationPlayback = useSessionStore((state) => state.resumeMeditationPlayback);
  const resetMeditationPlayback = useSessionStore((state) => state.resetMeditationPlayback);

  // Check if this module's playback is active
  const isThisModule = meditationPlayback.moduleInstanceId === module.instanceId;
  const hasStarted = isThisModule && meditationPlayback.hasStarted;
  const isPlaying = isThisModule && meditationPlayback.isPlaying;

  // Local state for UI
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [promptPhase, setPromptPhase] = useState('visible');
  const [displayedPromptIndex, setDisplayedPromptIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timedSequence, setTimedSequence] = useState([]);
  const [totalDuration, setTotalDuration] = useState(0);

  // Refs
  const timerRef = useRef(null);

  // Calculate silence multiplier and generate timed sequence
  useEffect(() => {
    if (!meditation) return;

    const targetDurationSeconds = module.duration * 60;
    const silenceMultiplier = calculateSilenceMultiplier(meditation.prompts, targetDurationSeconds);
    const sequence = generateTimedSequence(meditation.prompts, silenceMultiplier);

    setTimedSequence(sequence);

    const total = sequence.length > 0
      ? sequence[sequence.length - 1].endTime
      : targetDurationSeconds;
    setTotalDuration(total);
  }, [meditation, module.duration]);

  // Calculate elapsed time from store's startedAt timestamp (runs on mount and when returning to tab)
  useEffect(() => {
    if (!isThisModule || !meditationPlayback.hasStarted) return;

    // Calculate elapsed based on timestamps
    const calculateElapsed = () => {
      const { startedAt, pausedAt, accumulatedTime } = meditationPlayback;

      // If paused (startedAt is null when paused), use accumulated time
      if (!startedAt) {
        return accumulatedTime || 0;
      }

      // If playing, calculate from start time plus any accumulated time from previous pauses
      const now = Date.now();
      const currentSegment = (now - startedAt) / 1000;
      return (accumulatedTime || 0) + currentSegment;
    };

    const newElapsed = calculateElapsed();
    setElapsedTime(newElapsed);
  }, [isThisModule, meditationPlayback.hasStarted, meditationPlayback.startedAt, meditationPlayback.pausedAt, meditationPlayback.accumulatedTime]);

  // UI update timer - only updates display, doesn't track time (timestamp-based)
  useEffect(() => {
    if (!isPlaying || !meditationPlayback.startedAt) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const updateDisplay = () => {
      const now = Date.now();
      const currentSegment = (now - meditationPlayback.startedAt) / 1000;
      const newElapsed = (meditationPlayback.accumulatedTime || 0) + currentSegment;

      setElapsedTime(newElapsed);

      // Check if complete
      if (newElapsed >= totalDuration && totalDuration > 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        pauseMeditationPlayback();
      }
    };

    // Update immediately
    updateDisplay();

    // Then update every 100ms for smooth display
    timerRef.current = setInterval(updateDisplay, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, meditationPlayback.startedAt, meditationPlayback.accumulatedTime, totalDuration, pauseMeditationPlayback]);

  // Prompt progression based on elapsed time
  useEffect(() => {
    if (!hasStarted || timedSequence.length === 0) return;

    // Find which prompt should be showing based on elapsed time
    let targetPromptIndex = 0;
    for (let i = 0; i < timedSequence.length; i++) {
      const prompt = timedSequence[i];
      if (elapsedTime >= prompt.startTime) {
        targetPromptIndex = i;
      }
    }

    // Update displayed prompt if it changed
    if (targetPromptIndex !== displayedPromptIndex) {
      setPromptPhase('fading-out');
      setTimeout(() => {
        setDisplayedPromptIndex(targetPromptIndex);
        setPromptPhase('visible');
      }, 300);
    } else if (promptPhase !== 'visible') {
      setPromptPhase('visible');
    }
  }, [elapsedTime, timedSequence, displayedPromptIndex, hasStarted, promptPhase]);

  // Start meditation
  const handleStart = useCallback(() => {
    startMeditationPlayback(module.instanceId);
    setElapsedTime(0);
    setDisplayedPromptIndex(0);
    setPromptPhase('visible');
  }, [module.instanceId, startMeditationPlayback]);

  // Pause/Resume
  const handlePauseResume = useCallback(() => {
    if (isPlaying) {
      pauseMeditationPlayback();
    } else {
      resumeMeditationPlayback();
    }
  }, [isPlaying, pauseMeditationPlayback, resumeMeditationPlayback]);

  // Handle completion
  const handleComplete = useCallback(() => {
    resetMeditationPlayback();
    onComplete();
  }, [onComplete, resetMeditationPlayback]);

  // Handle skip with confirmation
  const handleSkipConfirm = useCallback(() => {
    resetMeditationPlayback();
    onSkip();
  }, [onSkip, resetMeditationPlayback]);

  // Progress percentage
  const progress = totalDuration > 0 ? Math.min((elapsedTime / totalDuration) * 100, 100) : 0;

  // Check if meditation is complete
  const isComplete = elapsedTime >= totalDuration && totalDuration > 0 && hasStarted;

  // Get current prompt text
  const currentPrompt = timedSequence[displayedPromptIndex];

  // Fallback if no meditation found
  if (!meditation) {
    return (
      <div className="flex flex-col justify-between px-6 pt-8 pb-44 min-h-[60vh]">
        <div className="flex-1 flex items-center justify-center">
          <p className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)]">
            Meditation content not found.
          </p>
        </div>
        <div className="w-full max-w-md mx-auto">
          <button
            onClick={onComplete}
            className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between px-6 pt-8 pb-44 min-h-[60vh]">
      {/* Progress bar at top - fixed position */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[var(--color-border)] z-20">
        <div
          className="h-full bg-[var(--color-text-primary)] transition-all duration-200 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Centered content area */}
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="text-center max-w-sm mx-auto px-4">
          {/* Pre-start screen */}
          {!hasStarted && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-[var(--color-text-primary)]">
                {meditation.title}
              </h2>
              <p className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {meditation.description}
              </p>
              <p className="uppercase tracking-wider text-xs text-[var(--color-text-tertiary)]">
                {module.duration} minutes
              </p>
            </div>
          )}

          {/* Active meditation - prompt display */}
          {hasStarted && !isComplete && currentPrompt && (
            <p
              className={`uppercase tracking-wider text-xs leading-loose transition-opacity duration-300
                ${promptPhase === 'visible' ? 'opacity-100' : 'opacity-0'}`}
            >
              {currentPrompt.text}
            </p>
          )}

          {/* Completion screen */}
          {isComplete && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-[var(--color-text-primary)]">
                Well done.
              </h2>
              <p className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)]">
                Take a moment before moving on.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="w-full max-w-md mx-auto mt-8">
        {/* Pre-start: Begin button */}
        {!hasStarted && (
          <div className="flex justify-center">
            <button
              onClick={handleStart}
              className="px-12 py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
            >
              Begin
            </button>
          </div>
        )}

        {/* During meditation */}
        {hasStarted && !isComplete && (
          <div className="flex flex-col items-center space-y-3">
            {/* Timer */}
            <span className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider">
              {formatTime(elapsedTime)} / {formatTime(totalDuration)}
            </span>
            {/* Pause/Resume button centered, Skip to the right */}
            <div className="relative flex justify-center w-full">
              <button
                onClick={handlePauseResume}
                className="px-6 py-2 border border-[var(--color-border)] text-[var(--color-text-primary)] uppercase tracking-wider text-[10px] hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                {isPlaying ? 'Pause' : 'Resume'}
              </button>
              {/* Skip button - positioned to the right */}
              <button
                onClick={() => setShowSkipConfirm(true)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider hover:text-[var(--color-text-secondary)] transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* After completion */}
        {isComplete && (
          <div className="flex justify-center">
            <button
              onClick={handleComplete}
              className="px-12 py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
            >
              Continue
            </button>
          </div>
        )}
      </div>

      {/* Skip confirmation modal */}
      {showSkipConfirm && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6"
          onClick={() => setShowSkipConfirm(false)}
        >
          <div
            className="bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-xs p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="uppercase tracking-wider text-xs text-center mb-6">
              Are you sure you want to skip this meditation?
            </p>
            <div className="space-y-3">
              <button
                onClick={handleSkipConfirm}
                className="w-full py-3 border border-[var(--color-border)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                Yes, Skip
              </button>
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
              >
                Continue Meditation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

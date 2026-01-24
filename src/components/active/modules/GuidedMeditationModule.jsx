/**
 * GuidedMeditationModule Component
 * Plays a timed meditation with text prompts that fade in/out
 * Supports pause/resume and displays a progress bar
 * State is persisted to survive tab navigation
 * Timer continues running even when tab is inactive (uses timestamp-based calculation)
 *
 * Uses shared UI components:
 * - ModuleControlBar for consistent bottom controls
 * - ModuleLayout for consistent layout structure
 *
 * Reports timer state to parent via onTimerUpdate for ModuleStatusBar display
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { getModuleById } from '../../../content/modules';
import { useSessionStore } from '../../../stores/useSessionStore';
import {
  getMeditationById,
  calculateSilenceMultiplier,
  generateTimedSequence,
} from '../../../content/meditations';
import { useWakeLock } from '../../../hooks/useWakeLock';

// Shared UI components
import ModuleLayout, { CompletionScreen, IdleScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar from '../capabilities/ModuleControlBar';

export default function GuidedMeditationModule({ module, onComplete, onSkip, onTimerUpdate }) {
  // Get meditation content
  const libraryModule = getModuleById(module.libraryId);
  const meditationId = libraryModule?.meditationId;
  const meditation = meditationId ? getMeditationById(meditationId) : null;

  // Get persisted state from store
  const meditationPlayback = useSessionStore((state) => state.meditationPlayback);
  const startMeditationPlayback = useSessionStore((state) => state.startMeditationPlayback);
  const pauseMeditationPlayback = useSessionStore((state) => state.pauseMeditationPlayback);
  const resumeMeditationPlayback = useSessionStore((state) => state.resumeMeditationPlayback);
  const resetMeditationPlayback = useSessionStore((state) => state.resetMeditationPlayback);

  // Check if this module's playback is active
  const isThisModule = meditationPlayback.moduleInstanceId === module.instanceId;
  const hasStarted = isThisModule && meditationPlayback.hasStarted;
  const isPlaying = isThisModule && meditationPlayback.isPlaying;

  // Keep screen awake during active meditation
  useWakeLock(hasStarted && isPlaying);

  // Local state for UI
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
      const { startedAt, accumulatedTime } = meditationPlayback;

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

  // Report timer state to parent for ModuleStatusBar
  useEffect(() => {
    if (!onTimerUpdate) return;

    const progress = totalDuration > 0 ? Math.min((elapsedTime / totalDuration) * 100, 100) : 0;
    const isComplete = elapsedTime >= totalDuration && totalDuration > 0 && hasStarted;

    onTimerUpdate({
      progress,
      elapsed: elapsedTime,
      total: totalDuration,
      showTimer: hasStarted && !isComplete,
      isPaused: !isPlaying,
    });
  }, [elapsedTime, totalDuration, hasStarted, isPlaying, onTimerUpdate]);

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

  // Handle skip
  const handleSkip = useCallback(() => {
    resetMeditationPlayback();
    onSkip();
  }, [onSkip, resetMeditationPlayback]);

  // Progress percentage
  const progress = totalDuration > 0 ? Math.min((elapsedTime / totalDuration) * 100, 100) : 0;

  // Check if meditation is complete
  const isComplete = elapsedTime >= totalDuration && totalDuration > 0 && hasStarted;

  // Get current prompt text
  const currentPrompt = timedSequence[displayedPromptIndex];

  // Determine current phase for control bar
  const getPhase = () => {
    if (!hasStarted) return 'idle';
    if (isComplete) return 'completed';
    return 'active';
  };

  // Get primary button config based on phase
  const getPrimaryButton = () => {
    const phase = getPhase();

    if (phase === 'idle') {
      return {
        label: 'Begin',
        onClick: handleStart,
      };
    }

    if (phase === 'active') {
      return {
        label: isPlaying ? 'Pause' : 'Resume',
        onClick: handlePauseResume,
      };
    }

    if (phase === 'completed') {
      return {
        label: 'Continue',
        onClick: handleComplete,
      };
    }

    return null;
  };

  // Fallback if no meditation found
  if (!meditation) {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <p className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)] text-center">
            Meditation content not found.
          </p>
        </ModuleLayout>
        <ModuleControlBar
          phase="completed"
          primary={{ label: 'Continue', onClick: onComplete }}
          showSkip={false}
        />
      </>
    );
  }

  return (
    <>
      <ModuleLayout
        layout={{ centered: true, maxWidth: 'sm' }}
      >
        {/* Pre-start screen */}
        {!hasStarted && (
          <IdleScreen
            title={meditation.title}
            description={meditation.description}
            duration={module.duration}
          />
        )}

        {/* Active meditation - prompt display */}
        {hasStarted && !isComplete && currentPrompt && (
          <p
            className={`uppercase tracking-wider text-xs leading-loose text-center transition-opacity duration-300
              ${promptPhase === 'visible' ? 'opacity-100' : 'opacity-0'}`}
          >
            {currentPrompt.text}
          </p>
        )}

        {/* Completion screen */}
        {isComplete && (
          <CompletionScreen />
        )}
      </ModuleLayout>

      {/* Fixed control bar above tab bar */}
      <ModuleControlBar
        phase={getPhase()}
        primary={getPrimaryButton()}
        showBack={false}
        showSkip={!isComplete}
        onSkip={handleSkip}
        skipConfirmMessage="Skip this meditation?"
      />
    </>
  );
}

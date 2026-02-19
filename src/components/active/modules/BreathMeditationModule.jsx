/**
 * BreathMeditationModule Component
 *
 * A comprehensive guided breath meditation module featuring:
 * - Animated BreathOrb visualization (toggleable)
 * - Flexible breath pattern sequences with guided text prompts
 * - Duration picker (10, 15, 20, 25, 30 minutes)
 * - Smooth transitions between patterns
 * - Progress reporting to parent
 *
 * Layout:
 * - Orb positioned in upper portion of screen (fixed)
 * - Animated guided text below orb
 * - Control bar at bottom with orb toggle and audio toggle
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getModuleById } from '../../../content/modules';
import {
  generateBreathSequences,
  generateTimedPrompts,
  guidedBreathOrbMeditation,
  getMeditationById,
} from '../../../content/meditations';
import { useWakeLock } from '../../../hooks/useWakeLock';

// Shared UI components
import ModuleControlBar, { SlotButton, VolumeButton } from '../capabilities/ModuleControlBar';
import DurationPicker from '../../shared/DurationPicker';

// Breath-specific components
import BreathOrb from '../capabilities/animations/BreathOrb';
import { useBreathController } from '../hooks/useBreathController';

/**
 * Orb visibility toggle icon
 */
function OrbIcon({ visible }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {visible ? (
        // Eye open - orb visible
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
        </>
      ) : (
        // Eye closed - orb hidden
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  );
}

export default function BreathMeditationModule({ module, onComplete, onSkip, onTimerUpdate }) {
  // Get library module for metadata
  const libraryModule = getModuleById(module.libraryId);

  // Check if module references a meditation content file
  const meditationContentId = module.content?.meditationId || libraryModule?.content?.meditationId;
  const meditationContent = meditationContentId ? getMeditationById(meditationContentId) : null;

  // Check if this is a fixed-duration meditation (like calming breath 15min)
  const isFixedDuration = meditationContent?.isFixedDuration || false;

  // Check if this module has custom sequences (non-guided mode)
  const hasCustomSequences = !!(module.content?.breathSequences || libraryModule?.content?.breathSequences || meditationContent?.segments);

  // Duration state (only used for guided mode with adjustable duration)
  const [selectedDuration, setSelectedDuration] = useState(
    module.duration || libraryModule?.defaultDuration || 10
  );
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  // Convert meditation content segments to breath controller sequences
  const convertSegmentsToSequences = useCallback((segments) => {
    return segments.map(segment => {
      if (segment.type === 'idle') {
        return {
          type: 'idle',
          duration: segment.duration,
          label: segment.label,
        };
      }
      // Breath segment
      return {
        type: 'cycles',
        count: segment.cycles,
        pattern: segment.pattern,
        label: segment.label,
      };
    });
  }, []);

  // Generate sequences and prompts based on duration
  const sequences = useMemo(() => {
    // If meditation content has segments, convert them
    if (meditationContent?.segments) {
      return convertSegmentsToSequences(meditationContent.segments);
    }
    if (hasCustomSequences && !meditationContent) {
      return module.content?.breathSequences || libraryModule?.content?.breathSequences;
    }
    // Use guided breath orb sequences
    return generateBreathSequences(selectedDuration);
  }, [meditationContent, hasCustomSequences, module.content?.breathSequences, libraryModule?.content?.breathSequences, selectedDuration, convertSegmentsToSequences]);

  // Generate simple prompts for custom sequences based on total duration
  const generateSimplePrompts = useCallback((seqs) => {
    // Calculate total duration
    let totalSeconds = 0;
    seqs.forEach(seq => {
      const cycleDuration = (seq.pattern.inhale || 0) + (seq.pattern.hold || 0) +
                            (seq.pattern.exhale || 0) + (seq.pattern.holdAfterExhale || 0);
      if (seq.type === 'cycles') {
        totalSeconds += cycleDuration * seq.count;
      } else if (seq.type === 'duration') {
        totalSeconds += seq.seconds;
      }
    });

    // Simple prompts spread across the meditation
    const prompts = [
      { text: 'Follow the orb with your breath.', timeSeconds: 5 },
      { text: 'Let each exhale release a little more tension.', timeSeconds: 30 },
      { text: 'No need to force anything. Just breathe.', timeSeconds: 60 },
    ];

    // Add prompts at intervals if longer than 2 minutes
    if (totalSeconds > 120) {
      prompts.push({ text: 'Notice how your body feels.', timeSeconds: 90 });
    }
    if (totalSeconds > 180) {
      prompts.push({ text: 'Let your mind settle with each breath.', timeSeconds: 150 });
    }
    if (totalSeconds > 300) {
      prompts.push({ text: 'You\'re doing well. Stay with the breath.', timeSeconds: 240 });
    }

    return prompts.filter(p => p.timeSeconds < totalSeconds - 10);
  }, []);

  const timedPrompts = useMemo(() => {
    // If meditation content has prompts, use them directly
    if (meditationContent?.prompts) {
      // Convert prompts format: { time, text } -> { timeSeconds, text }
      return meditationContent.prompts.map(p => ({
        timeSeconds: p.time,
        text: p.text,
      }));
    }
    if (hasCustomSequences && !meditationContent) {
      // Generate simple prompts for custom sequences
      return generateSimplePrompts(sequences);
    }
    return generateTimedPrompts(selectedDuration);
  }, [meditationContent, hasCustomSequences, selectedDuration, sequences, generateSimplePrompts]);

  // Module state
  const [hasStarted, setHasStarted] = useState(false);
  const [isWaitingForIdleComplete, setIsWaitingForIdleComplete] = useState(false);

  // Visual toggles
  const [isOrbVisible, setIsOrbVisible] = useState(true);
  const [audioVolume, setAudioVolume] = useState(0); // Default 0 (muted) since no audio yet

  // Current prompt state
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [promptVisible, setPromptVisible] = useState(false);
  const lastPromptIndexRef = useRef(-1); // Track which prompt we last showed to prevent re-triggering

  // Track idle animation phase
  const idleAnimationRef = useRef(null);
  const idleStartTimeRef = useRef(null);

  // Initialize breath controller
  const breathController = useBreathController({
    sequences,
    onComplete: () => {
      // Breath sequences completed
    },
    onSequenceChange: (index) => {
      // Could add visual feedback for sequence transitions here
    },
  });

  // Calculate total duration for progress reporting
  const calculateTotalDuration = useCallback(() => {
    // If meditation content has a fixed duration, use it
    if (meditationContent?.duration) {
      return meditationContent.duration;
    }

    let total = 0;
    sequences.forEach(seq => {
      if (seq.type === 'idle') {
        total += seq.duration;
      } else {
        const cycleDuration = (seq.pattern.inhale || 0) + (seq.pattern.hold || 0) +
                              (seq.pattern.exhale || 0) + (seq.pattern.holdAfterExhale || 0);
        if (seq.type === 'cycles') {
          total += cycleDuration * seq.count;
        } else if (seq.type === 'duration') {
          total += seq.seconds;
        }
      }
    });
    return total;
  }, [meditationContent, sequences]);

  // Report timer state to parent for ModuleStatusBar
  useEffect(() => {
    if (!onTimerUpdate) return;

    const totalDuration = calculateTotalDuration();
    const elapsed = (breathController.overallProgress / 100) * totalDuration;

    onTimerUpdate({
      progress: breathController.overallProgress,
      elapsed,
      total: totalDuration,
      showTimer: breathController.hasStarted && !breathController.isComplete,
      isPaused: !breathController.isRunning && breathController.hasStarted && !breathController.isComplete,
    });
  }, [breathController.overallProgress, breathController.hasStarted, breathController.isComplete,
      breathController.isRunning, calculateTotalDuration, onTimerUpdate]);

  // Track prompts based on breath controller's progress
  // Uses a ref to track the last shown prompt index to prevent re-triggering
  useEffect(() => {
    if (!breathController.hasStarted || breathController.isComplete || timedPrompts.length === 0) return;

    // Calculate elapsed time from the breath controller's overall progress
    const totalDuration = calculateTotalDuration();
    const currentTime = (breathController.overallProgress / 100) * totalDuration;

    // Find which prompt should be active based on current time
    let activePromptIndex = -1;
    for (let i = timedPrompts.length - 1; i >= 0; i--) {
      if (timedPrompts[i].timeSeconds <= currentTime) {
        // Check if this prompt is still within its display window (8 seconds)
        const promptAge = currentTime - timedPrompts[i].timeSeconds;
        if (promptAge < 8) {
          activePromptIndex = i;
        }
        break;
      }
    }

    // Only update if we're showing a different prompt than before
    if (activePromptIndex !== lastPromptIndexRef.current) {
      const previousIndex = lastPromptIndexRef.current;
      lastPromptIndexRef.current = activePromptIndex;

      if (activePromptIndex === -1) {
        // No prompt should be showing - fade out current
        setPromptVisible(false);
        setTimeout(() => setCurrentPrompt(null), 300);
      } else if (previousIndex === -1) {
        // Going from no prompt to a prompt - just fade in
        setCurrentPrompt(timedPrompts[activePromptIndex]);
        setPromptVisible(true);
      } else {
        // Transitioning from one prompt to another - fade out, then fade in
        setPromptVisible(false);
        setTimeout(() => {
          setCurrentPrompt(timedPrompts[activePromptIndex]);
          setPromptVisible(true);
        }, 300);
      }
    }
  }, [breathController.hasStarted, breathController.isComplete, breathController.overallProgress, timedPrompts, calculateTotalDuration]);

  // Handle start button - wait for idle animation to reach contracted state
  const handleBegin = useCallback(() => {
    if (isWaitingForIdleComplete) return;

    setIsWaitingForIdleComplete(true);
    idleStartTimeRef.current = Date.now();

    const checkIdlePhase = () => {
      const elapsed = Date.now() - idleStartTimeRef.current;
      const animationDuration = 4000;
      const cycleProgress = (elapsed % animationDuration) / animationDuration;
      const isNearContracted = cycleProgress < 0.1 || cycleProgress > 0.9;

      if (isNearContracted) {
        setHasStarted(true);
        setIsWaitingForIdleComplete(false);
        lastPromptIndexRef.current = -1; // Reset prompt tracking
        breathController.start();
      } else {
        idleAnimationRef.current = requestAnimationFrame(checkIdlePhase);
      }
    };

    idleAnimationRef.current = requestAnimationFrame(checkIdlePhase);
  }, [isWaitingForIdleComplete, breathController]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (idleAnimationRef.current) {
        cancelAnimationFrame(idleAnimationRef.current);
      }
    };
  }, []);

  // Keep screen awake during active meditation
  useWakeLock(hasStarted && breathController.isRunning && !breathController.isComplete);

  // Handle pause/resume
  const handlePauseResume = useCallback(() => {
    if (breathController.isRunning) {
      breathController.pause();
    } else {
      breathController.resume();
    }
  }, [breathController]);

  // Handle module completion
  const handleComplete = useCallback(() => {
    breathController.reset();
    onComplete();
  }, [breathController, onComplete]);

  // Handle skip
  const handleSkip = useCallback(() => {
    breathController.reset();
    onSkip();
  }, [breathController, onSkip]);

  // Handle duration change
  const handleDurationChange = useCallback((newDuration) => {
    setSelectedDuration(newDuration);
  }, []);

  // Determine control phase
  const getControlPhase = () => {
    if (!hasStarted) return 'idle';
    if (breathController.isComplete) return 'completed';
    return 'active';
  };

  // Get primary button config
  const getPrimaryButton = () => {
    const controlPhase = getControlPhase();

    if (controlPhase === 'idle') {
      return {
        label: isWaitingForIdleComplete ? 'Starting...' : 'Begin',
        onClick: handleBegin,
        disabled: isWaitingForIdleComplete,
      };
    }

    if (controlPhase === 'active') {
      return {
        label: breathController.isRunning ? 'Pause' : 'Resume',
        onClick: handlePauseResume,
      };
    }

    if (controlPhase === 'completed') {
      return {
        label: 'Continue',
        onClick: handleComplete,
      };
    }

    return null;
  };

  // Get description text
  const getDescription = () => {
    return module.content?.instructions ||
           libraryModule?.content?.instructions ||
           "Follow the orb with your breath. Let it guide you to a slower, deeper rhythm.";
  };

  // Get current sequence info for display (cycle count and breath pattern)
  const getCurrentSequenceInfo = () => {
    if (!breathController.hasStarted) return null;

    const currentSeq = sequences[breathController.currentSequenceIndex];
    if (!currentSeq) return null;

    // For idle segments, show the label
    if (currentSeq.type === 'idle') {
      return currentSeq.label || 'Free Breathing';
    }

    const pattern = currentSeq.pattern;
    // Only show non-zero values in the pattern (e.g., 4-0-6-0 becomes 4-6)
    const patternParts = [
      pattern.inhale,
      pattern.hold,
      pattern.exhale,
      pattern.holdAfterExhale
    ].filter(val => val > 0);
    const patternStr = patternParts.join('-');

    if (currentSeq.type === 'cycles') {
      return `Cycle ${breathController.currentCycle + 1} / ${currentSeq.count} · ${patternStr}`;
    }

    return `Pattern ${patternStr}`;
  };

  // Left slot: Orb visibility toggle
  const leftSlotContent = hasStarted && !breathController.isComplete ? (
    <SlotButton
      icon={<OrbIcon visible={isOrbVisible} />}
      label={isOrbVisible ? 'Hide orb' : 'Show orb'}
      onClick={() => setIsOrbVisible(!isOrbVisible)}
      active={isOrbVisible}
    />
  ) : null;

  // Right slot: Audio mute toggle
  const rightSlotContent = hasStarted && !breathController.isComplete ? (
    <VolumeButton
      volume={audioVolume}
      onVolumeChange={setAudioVolume}
    />
  ) : null;

  return (
    <>
      {/* Fixed layout container - no scroll, fills available space */}
      <div className="fixed inset-0 flex flex-col items-center px-6 overflow-hidden" style={{ top: 'calc(var(--header-plus-status) + 25px)', bottom: 'var(--bottom-chrome)' }}>
        {/* Sequence info above orb - shows cycle count and pattern */}
        <div className="flex-shrink-0 h-6 flex items-center justify-center">
          {hasStarted && !breathController.isComplete && getCurrentSequenceInfo() && (
            <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider animate-fadeIn">
              {getCurrentSequenceInfo()}
            </p>
          )}
        </div>

        {/* Orb area - always in same position */}
        <div className="flex-shrink-0">
          <div
            className={`relative flex justify-center transition-opacity duration-500 ${
              isOrbVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{ height: '260px' }}
          >
            <BreathOrb
              phase={hasStarted ? breathController.phase : 'inhale'}
              phaseProgress={hasStarted ? breathController.phaseProgress : 0}
              phaseDuration={hasStarted ? breathController.phaseDuration : 4}
              phaseSecondsRemaining={hasStarted ? breathController.phaseSecondsRemaining : 4}
              moonAngle={hasStarted ? breathController.moonAngle : 180}
              isActive={hasStarted && breathController.isRunning && !breathController.isIdleSegment}
              isIdle={!hasStarted || breathController.isIdleSegment}
              size="medium"
            />

            {/* Paused indicator - only during active state */}
            {hasStarted && !breathController.isComplete && (
              <p
                className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider transition-opacity duration-300 ${
                  !breathController.isRunning ? 'opacity-100 animate-pulse' : 'opacity-0'
                }`}
              >
                Paused
              </p>
            )}
          </div>
        </div>

        {/* Text area below orb - content changes based on state */}
        <div className="flex-1 flex flex-col items-center justify-start pt-8 max-w-sm w-full">
          {/* Idle state: Title, description, duration picker */}
          {!hasStarted && (
            <div className="text-center animate-fadeIn">
              <h2 className="text-[var(--color-text-primary)] mb-3">
                {libraryModule?.title || module.title || 'Breath Meditation'}
              </h2>

              <p className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
                {getDescription()}
              </p>

              {/* Duration selector button (only for guided mode, not fixed duration) */}
              {!hasCustomSequences && !isFixedDuration && (
                <button
                  onClick={() => setShowDurationPicker(true)}
                  className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)]
                    hover:border-[var(--color-text-tertiary)] transition-colors"
                >
                  <span className="text-2xl font-light">{selectedDuration}</span>
                  <span className="text-sm ml-1">min</span>
                </button>
              )}

              {/* Show fixed duration display for fixed-duration meditations */}
              {isFixedDuration && meditationContent?.duration && (
                <div className="text-[var(--color-text-tertiary)] text-sm">
                  {Math.floor(meditationContent.duration / 60)} minutes
                </div>
              )}
            </div>
          )}

          {/* Active state: Guided prompts */}
          {hasStarted && !breathController.isComplete && (
            <div
              className={`text-center transition-opacity duration-300 ${
                promptVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {currentPrompt && (
                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                  {currentPrompt.text}
                </p>
              )}
            </div>
          )}

          {/* Completed state */}
          {breathController.isComplete && (
            <div className="text-center animate-fadeIn">
              <h2 className="text-[var(--color-text-primary)] mb-3">
                Well done.
              </h2>
              <p className="uppercase tracking-wider text-[10px] text-[var(--color-text-secondary)]">
                Take a moment to notice how you feel. Your breath is your anchor.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed control bar */}
      <ModuleControlBar
        phase={getControlPhase()}
        primary={getPrimaryButton()}
        showBack={false}
        showSkip={!breathController.isComplete}
        onSkip={handleSkip}
        skipConfirmMessage="Skip this breath meditation?"
        leftSlot={leftSlotContent}
        rightSlot={rightSlotContent}
      />

      {/* Duration picker modal (only for guided mode, not fixed duration) */}
      {!hasCustomSequences && !isFixedDuration && (
        <DurationPicker
          isOpen={showDurationPicker}
          onClose={() => setShowDurationPicker(false)}
          onSelect={handleDurationChange}
          currentDuration={selectedDuration}
          durationSteps={guidedBreathOrbMeditation.durationSteps}
          minDuration={guidedBreathOrbMeditation.minDuration / 60}
          maxDuration={guidedBreathOrbMeditation.maxDuration / 60}
        />
      )}
    </>
  );
}

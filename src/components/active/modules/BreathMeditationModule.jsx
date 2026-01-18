/**
 * BreathMeditationModule Component
 *
 * A comprehensive breath meditation module featuring:
 * - Animated BreathOrb visualization
 * - Flexible breath pattern sequences
 * - Smooth transitions between patterns
 * - Progress reporting to parent
 *
 * Uses shared UI components:
 * - ModuleControlBar for consistent bottom controls
 * - ModuleLayout for consistent layout structure
 *
 * Reports timer state to parent via onTimerUpdate for ModuleStatusBar display
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getModuleById } from '../../../content/modules';

// Shared UI components
import ModuleLayout, { CompletionScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar from '../capabilities/ModuleControlBar';

// Breath-specific components
import BreathOrb from '../capabilities/animations/BreathOrb';
import { useBreathController } from '../hooks/useBreathController';

/**
 * Default breath sequences if none provided
 */
const DEFAULT_SEQUENCES = [
  {
    type: 'cycles',
    count: 8,
    pattern: { inhale: 4, hold: 4, exhale: 4, holdAfterExhale: 0 },
  },
];

export default function BreathMeditationModule({ module, onComplete, onSkip, onTimerUpdate }) {
  // Get library module for metadata
  const libraryModule = getModuleById(module.libraryId);

  // Get breath sequences from module content or use defaults
  const sequences = module.content?.breathSequences ||
                    libraryModule?.content?.breathSequences ||
                    DEFAULT_SEQUENCES;

  // Module state
  const [hasStarted, setHasStarted] = useState(false);
  const [isWaitingForIdleComplete, setIsWaitingForIdleComplete] = useState(false);

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

  // Report timer state to parent for ModuleStatusBar
  useEffect(() => {
    if (!onTimerUpdate) return;

    // Calculate total duration for all sequences
    const calculateTotalDuration = () => {
      let total = 0;
      sequences.forEach(seq => {
        const cycleDuration = (seq.pattern.inhale || 0) + (seq.pattern.hold || 0) +
                              (seq.pattern.exhale || 0) + (seq.pattern.holdAfterExhale || 0);
        if (seq.type === 'cycles') {
          total += cycleDuration * seq.count;
        } else if (seq.type === 'duration') {
          total += seq.seconds;
        }
      });
      return total;
    };

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
      breathController.isRunning, sequences, onTimerUpdate]);

  // Handle start button - wait for idle animation to reach contracted state
  const handleBegin = useCallback(() => {
    if (isWaitingForIdleComplete) return;

    // Start waiting for idle animation to complete to contracted state
    setIsWaitingForIdleComplete(true);
    idleStartTimeRef.current = Date.now();

    // The idle animation is 4s with scale going from 0.68 → 0.75 → 0.68
    // We need to wait until it reaches 0.68 (contracted state)
    // The animation is at 0.68 at 0% and 100% of the cycle
    // We'll check every 50ms and start when we're near the contracted state

    const checkIdlePhase = () => {
      const elapsed = Date.now() - idleStartTimeRef.current;
      const animationDuration = 4000; // 4 seconds
      const cycleProgress = (elapsed % animationDuration) / animationDuration;

      // The animation is at contracted state (scale 0.68) at 0% and 100%
      // It's at expanded state (scale 0.75) at 50%
      // We want to start when we're near 0% or 100% (contracted)
      // Let's consider "near" as within 10% of the cycle endpoints
      const isNearContracted = cycleProgress < 0.1 || cycleProgress > 0.9;

      if (isNearContracted) {
        // Start the breath controller
        setHasStarted(true);
        setIsWaitingForIdleComplete(false);
        breathController.start();
      } else {
        // Keep checking
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

  // Handle stop early
  const handleStop = useCallback(() => {
    breathController.stop();
  }, [breathController]);

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

  // Get current sequence info for display
  const getCurrentSequenceInfo = () => {
    if (!breathController.hasStarted) return null;

    const currentSeq = sequences[breathController.currentSequenceIndex];
    if (!currentSeq) return null;

    const pattern = currentSeq.pattern;
    const patternStr = `${pattern.inhale}-${pattern.hold}-${pattern.exhale}-${pattern.holdAfterExhale}`;

    if (currentSeq.type === 'cycles') {
      return `Cycle ${breathController.currentCycle + 1} / ${currentSeq.count} · Pattern ${patternStr}`;
    }

    return `Pattern ${patternStr}`;
  };

  return (
    <>
      <ModuleLayout
        layout={{ centered: true, maxWidth: 'md' }}
      >
        {/* Idle state */}
        {!hasStarted && (
          <div className="text-center space-y-8 animate-fadeIn">
            <h2 className="text-[var(--color-text-primary)]">
              {libraryModule?.title || module.title}
            </h2>

            <p className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-sm mx-auto">
              {getDescription()}
            </p>

            {/* Idle orb */}
            <div className="flex justify-center py-4">
              <BreathOrb
                phase="inhale"
                phaseProgress={0}
                phaseDuration={4}
                phaseSecondsRemaining={4}
                moonAngle={180}
                isActive={false}
                isIdle={true}
                size="medium"
              />
            </div>
          </div>
        )}

        {/* Active state */}
        {hasStarted && !breathController.isComplete && (
          <div className="text-center animate-fadeIn">
            {/* Sequence info */}
            <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider mb-4">
              {getCurrentSequenceInfo()}
            </p>

            {/* Active orb - fixed height container to prevent layout shift */}
            <div className="relative flex justify-center py-2">
              <BreathOrb
                phase={breathController.phase}
                phaseProgress={breathController.phaseProgress}
                phaseDuration={breathController.phaseDuration}
                phaseSecondsRemaining={breathController.phaseSecondsRemaining}
                moonAngle={breathController.moonAngle}
                isActive={breathController.isRunning}
                isIdle={false}
                size="medium"
              />

              {/* Paused indicator - absolutely positioned below orb */}
              <p
                className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider transition-opacity duration-300 ${
                  !breathController.isRunning ? 'opacity-100 animate-pulse' : 'opacity-0'
                }`}
              >
                Paused
              </p>
            </div>
          </div>
        )}

        {/* Completed state */}
        {breathController.isComplete && (
          <CompletionScreen
            title="Well done."
            message="Take a moment to notice how you feel. Your breath is your anchor."
          />
        )}
      </ModuleLayout>

      {/* Fixed control bar */}
      <ModuleControlBar
        phase={getControlPhase()}
        primary={getPrimaryButton()}
        showBack={false}
        showSkip={!breathController.isComplete}
        onSkip={handleSkip}
        skipConfirmMessage="Skip this breath meditation?"
      />
    </>
  );
}

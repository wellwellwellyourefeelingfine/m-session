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
} from '../../../content/meditations';

// Shared UI components
import ModuleControlBar, { SlotButton, MuteButton } from '../capabilities/ModuleControlBar';
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

  // Check if this module has custom sequences (non-guided mode)
  const hasCustomSequences = !!(module.content?.breathSequences || libraryModule?.content?.breathSequences);

  // Duration state (only used for guided mode)
  const [selectedDuration, setSelectedDuration] = useState(
    module.duration || libraryModule?.defaultDuration || 10
  );
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  // Generate sequences and prompts based on duration
  const sequences = useMemo(() => {
    if (hasCustomSequences) {
      return module.content?.breathSequences || libraryModule?.content?.breathSequences;
    }
    // Use guided breath orb sequences
    return generateBreathSequences(selectedDuration);
  }, [hasCustomSequences, module.content?.breathSequences, libraryModule?.content?.breathSequences, selectedDuration]);

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
    if (hasCustomSequences) {
      // Generate simple prompts for custom sequences
      return generateSimplePrompts(sequences);
    }
    return generateTimedPrompts(selectedDuration);
  }, [hasCustomSequences, selectedDuration, sequences, generateSimplePrompts]);

  // Module state
  const [hasStarted, setHasStarted] = useState(false);
  const [isWaitingForIdleComplete, setIsWaitingForIdleComplete] = useState(false);

  // Visual toggles
  const [isOrbVisible, setIsOrbVisible] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(true); // Default muted since no audio yet

  // Current prompt state
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [promptVisible, setPromptVisible] = useState(false);

  // Track idle animation phase
  const idleAnimationRef = useRef(null);
  const idleStartTimeRef = useRef(null);

  // Track elapsed time for prompts
  const elapsedTimeRef = useRef(0);
  const lastTickRef = useRef(Date.now());

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
  }, [sequences]);

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

  // Track elapsed time and update prompts
  useEffect(() => {
    if (!breathController.isRunning || timedPrompts.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      elapsedTimeRef.current += delta;

      // Find the current prompt based on elapsed time
      const currentTime = elapsedTimeRef.current;

      // Find the most recent prompt that should be showing
      let activePrompt = null;
      for (let i = timedPrompts.length - 1; i >= 0; i--) {
        if (timedPrompts[i].timeSeconds <= currentTime) {
          // Check if this prompt is still "active" (within 8 seconds of start)
          const promptAge = currentTime - timedPrompts[i].timeSeconds;
          if (promptAge < 8) {
            activePrompt = timedPrompts[i];
          }
          break;
        }
      }

      if (activePrompt && activePrompt.text !== currentPrompt?.text) {
        // New prompt - fade out old, then fade in new
        setPromptVisible(false);
        setTimeout(() => {
          setCurrentPrompt(activePrompt);
          setPromptVisible(true);
        }, 300);
      } else if (!activePrompt && currentPrompt) {
        // No active prompt - fade out
        setPromptVisible(false);
        setTimeout(() => setCurrentPrompt(null), 300);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [breathController.isRunning, timedPrompts, currentPrompt]);

  // Reset elapsed time when paused/resumed
  useEffect(() => {
    if (breathController.isRunning) {
      lastTickRef.current = Date.now();
    }
  }, [breathController.isRunning]);

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
        elapsedTimeRef.current = 0;
        lastTickRef.current = Date.now();
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

  // Pause meditation when page/tab loses visibility (user switches apps or tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasStarted && breathController.isRunning) {
        breathController.pause();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasStarted, breathController]);

  // Keep screen awake during active meditation (prevents phone from sleeping)
  const wakeLockRef = useRef(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      // Only request wake lock when meditation is running
      if (hasStarted && breathController.isRunning && !breathController.isComplete) {
        try {
          if ('wakeLock' in navigator) {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
          }
        } catch (err) {
          // Wake lock request failed (e.g., low battery, or not supported)
          // Silently fail - meditation will still work, just screen might dim
          console.debug('Wake lock not available:', err.message);
        }
      } else {
        // Release wake lock when paused or completed
        if (wakeLockRef.current) {
          wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
      }
    };

    requestWakeLock();

    // Cleanup on unmount
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    };
  }, [hasStarted, breathController.isRunning, breathController.isComplete]);

  // Re-acquire wake lock when page becomes visible again (iOS releases it on visibility change)
  useEffect(() => {
    const handleVisibilityForWakeLock = async () => {
      if (!document.hidden && hasStarted && breathController.isRunning && !breathController.isComplete) {
        try {
          if ('wakeLock' in navigator && !wakeLockRef.current) {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
          }
        } catch (err) {
          console.debug('Wake lock re-acquire failed:', err.message);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityForWakeLock);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityForWakeLock);
    };
  }, [hasStarted, breathController.isRunning, breathController.isComplete]);

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

    const pattern = currentSeq.pattern;
    const patternStr = `${pattern.inhale}-${pattern.hold}-${pattern.exhale}-${pattern.holdAfterExhale}`;

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
    <MuteButton
      isMuted={isAudioMuted}
      onToggle={() => setIsAudioMuted(!isAudioMuted)}
    />
  ) : null;

  return (
    <>
      {/* Fixed layout container - no scroll, fills available space */}
      <div className="fixed inset-0 top-[125px] bottom-[120px] flex flex-col items-center px-6 overflow-hidden">
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
              isActive={hasStarted && breathController.isRunning}
              isIdle={!hasStarted}
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

              {/* Duration selector button (only for guided mode) */}
              {!hasCustomSequences && (
                <button
                  onClick={() => setShowDurationPicker(true)}
                  className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)]
                    hover:border-[var(--color-text-tertiary)] transition-colors"
                >
                  <span className="text-2xl font-light">{selectedDuration}</span>
                  <span className="text-sm ml-1">min</span>
                </button>
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

      {/* Duration picker modal (only for guided mode) */}
      {!hasCustomSequences && (
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

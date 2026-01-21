/**
 * useBreathController Hook
 *
 * Manages breath timing and sequencing for breath meditation modules.
 * Supports multiple sequence types (cycle-based, duration-based, and idle) with
 * smooth transitions that never cut off mid-breath.
 *
 * Features:
 * - Flexible breath patterns (inhale-hold-exhale-holdAfterExhale)
 * - Cycle-based sequences (e.g., 5 cycles of 4-4-4-4)
 * - Duration-based sequences (e.g., 1 minute of 5-5-5-0)
 * - Idle sequences (timed periods with no breath guidance)
 * - Graceful sequence transitions (always completes current breath)
 * - Progress tracking for animations
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Breath phases in order
 */
const PHASES = ['inhale', 'hold', 'exhale', 'holdAfterExhale'];

/**
 * Get the duration for a specific phase from a pattern
 */
function getPhaseDuration(pattern, phase) {
  switch (phase) {
    case 'inhale': return pattern.inhale || 0;
    case 'hold': return pattern.hold || 0;
    case 'exhale': return pattern.exhale || 0;
    case 'holdAfterExhale': return pattern.holdAfterExhale || 0;
    default: return 0;
  }
}

/**
 * Get the next phase, skipping phases with 0 duration
 * Returns null if cycle is complete
 */
function getNextPhase(currentPhase, pattern) {
  const currentIndex = PHASES.indexOf(currentPhase);

  for (let i = currentIndex + 1; i < PHASES.length; i++) {
    const nextPhase = PHASES[i];
    if (getPhaseDuration(pattern, nextPhase) > 0) {
      return nextPhase;
    }
  }

  // Cycle complete
  return null;
}

/**
 * Calculate total cycle duration for a pattern
 */
function getCycleDuration(pattern) {
  return (pattern.inhale || 0) + (pattern.hold || 0) +
         (pattern.exhale || 0) + (pattern.holdAfterExhale || 0);
}

/**
 * Calculate the moon angle (0-360) based on current phase and progress
 *
 * Movement: bottom (180°) → left (270°) → top (360°/0°) → right (90°) → bottom (180°)
 * - Inhale: 180° → 360° (bottom to top, via left side)
 * - Hold (after inhale): stays at 0° (top)
 * - Exhale: 0° → 180° (top to bottom, via right side)
 * - Hold (after exhale): stays at 180° (bottom)
 *
 * Note: We use 0° for top position in hold phase to avoid the 360°→0° discontinuity.
 * The moon position is updated every 50ms without CSS transitions, so no jitter occurs.
 */
function calculateMoonAngle(phase, phaseProgress) {
  switch (phase) {
    case 'inhale':
      // 180° → 360° (bottom to top via left)
      return 180 + (phaseProgress * 180);

    case 'hold':
      // Stay at top (0° = 360°)
      return 0;

    case 'exhale':
      // 0° → 180° (top to bottom via right)
      return phaseProgress * 180;

    case 'holdAfterExhale':
      // Stay at bottom
      return 180;

    default:
      return 180;
  }
}

/**
 * @param {Object} config
 * @param {Array} config.sequences - Array of sequence configurations
 * @param {Function} config.onComplete - Called when all sequences complete
 * @param {Function} config.onSequenceChange - Called when moving to next sequence
 */
export function useBreathController({ sequences = [], onComplete, onSequenceChange }) {
  // Current state
  const [phase, setPhase] = useState('inhale');
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState(0);
  const [phaseDuration, setPhaseDuration] = useState(4);

  // Cycle tracking
  const [currentCycle, setCurrentCycle] = useState(0);

  // Sequence tracking
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [sequenceElapsedTime, setSequenceElapsedTime] = useState(0);

  // Control state
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Flag to indicate we should transition after current cycle
  const [pendingSequenceTransition, setPendingSequenceTransition] = useState(false);

  // Refs for timer
  const timerRef = useRef(null);
  const lastTickRef = useRef(Date.now());

  // Get current sequence and pattern
  const currentSequence = sequences[currentSequenceIndex] || null;
  const isIdleSegment = currentSequence?.type === 'idle';
  const currentPattern = currentSequence?.pattern || { inhale: 4, hold: 0, exhale: 4, holdAfterExhale: 0 };

  // Calculate if current sequence should end (for duration-based or idle)
  const shouldSequenceEnd = useCallback(() => {
    if (!currentSequence) return true;

    if (currentSequence.type === 'cycles') {
      return currentCycle >= currentSequence.count;
    }

    if (currentSequence.type === 'duration' || currentSequence.type === 'idle') {
      const targetDuration = currentSequence.type === 'idle'
        ? currentSequence.duration
        : currentSequence.seconds;
      return sequenceElapsedTime >= targetDuration;
    }

    return false;
  }, [currentSequence, currentCycle, sequenceElapsedTime]);

  // Calculate total cycles in current sequence (null for duration-based)
  const totalCyclesInSequence = currentSequence?.type === 'cycles'
    ? currentSequence.count
    : null;

  // Calculate phase progress (0-1)
  const phaseProgress = phaseDuration > 0
    ? Math.max(0, Math.min(1, (phaseDuration - phaseTimeRemaining) / phaseDuration))
    : 0;

  // Calculate moon angle
  const moonAngle = calculateMoonAngle(phase, phaseProgress);

  // Calculate overall progress across all sequences
  const calculateOverallProgress = useCallback(() => {
    if (sequences.length === 0) return 0;

    let totalTime = 0;
    let elapsedTime = 0;

    sequences.forEach((seq, index) => {
      if (seq.type === 'idle') {
        // Idle segments have a fixed duration
        totalTime += seq.duration;

        if (index < currentSequenceIndex) {
          elapsedTime += seq.duration;
        } else if (index === currentSequenceIndex) {
          elapsedTime += sequenceElapsedTime;
        }
      } else if (seq.type === 'cycles') {
        const cycleDur = getCycleDuration(seq.pattern);
        const seqTime = cycleDur * seq.count;
        totalTime += seqTime;

        if (index < currentSequenceIndex) {
          elapsedTime += seqTime;
        } else if (index === currentSequenceIndex) {
          // Add completed cycles
          elapsedTime += cycleDur * currentCycle;

          // Add elapsed time within current cycle based on current phase
          // We need to account for completed phases, not just current phase progress
          const pattern = seq.pattern;
          const phases = ['inhale', 'hold', 'exhale', 'holdAfterExhale'];
          const currentPhaseIndex = phases.indexOf(phase);

          // Add durations of completed phases in current cycle
          for (let p = 0; p < currentPhaseIndex; p++) {
            elapsedTime += pattern[phases[p]] || 0;
          }

          // Add elapsed time in current phase
          elapsedTime += (phaseDuration - phaseTimeRemaining);
        }
      } else if (seq.type === 'duration') {
        totalTime += seq.seconds;

        if (index < currentSequenceIndex) {
          elapsedTime += seq.seconds;
        } else if (index === currentSequenceIndex) {
          elapsedTime += sequenceElapsedTime;
        }
      }
    });

    return totalTime > 0 ? (elapsedTime / totalTime) * 100 : 0;
  }, [sequences, currentSequenceIndex, currentCycle, phase, phaseDuration, phaseTimeRemaining, sequenceElapsedTime]);

  // Transition to next sequence
  const transitionToNextSequence = useCallback(() => {
    const nextSequenceIndex = currentSequenceIndex + 1;

    if (nextSequenceIndex >= sequences.length) {
      // All sequences complete
      setIsRunning(false);
      setIsComplete(true);
      onComplete?.();
      return;
    }

    // Transition to next sequence
    setCurrentSequenceIndex(nextSequenceIndex);
    setCurrentCycle(0);
    setSequenceElapsedTime(0);
    setPendingSequenceTransition(false);

    const nextSeq = sequences[nextSequenceIndex];

    if (nextSeq.type === 'idle') {
      // For idle segments, set phase to 'idle' (no breath animation)
      setPhase('idle');
      setPhaseDuration(nextSeq.duration);
      setPhaseTimeRemaining(nextSeq.duration);
    } else {
      // For breath segments, start with inhale
      const nextPattern = nextSeq.pattern;
      const nextDuration = getPhaseDuration(nextPattern, 'inhale');

      setPhase('inhale');
      setPhaseDuration(nextDuration);
      setPhaseTimeRemaining(nextDuration);
    }

    onSequenceChange?.(nextSequenceIndex);
  }, [currentSequenceIndex, sequences, onComplete, onSequenceChange]);

  // Advance to next phase
  const advancePhase = useCallback(() => {
    // Handle idle segments - they just run down their duration then transition
    if (isIdleSegment) {
      transitionToNextSequence();
      return;
    }

    const nextPhase = getNextPhase(phase, currentPattern);

    if (nextPhase) {
      // Continue to next phase in cycle
      const nextDuration = getPhaseDuration(currentPattern, nextPhase);
      setPhase(nextPhase);
      setPhaseDuration(nextDuration);
      setPhaseTimeRemaining(nextDuration);
    } else {
      // Cycle complete - check if we should transition sequences
      const newCycleCount = currentCycle + 1;
      setCurrentCycle(newCycleCount);

      // Check if sequence should end
      const sequenceShouldEnd = (() => {
        if (!currentSequence) return true;
        if (currentSequence.type === 'cycles') {
          return newCycleCount >= currentSequence.count;
        }
        if (currentSequence.type === 'duration') {
          return sequenceElapsedTime >= currentSequence.seconds;
        }
        return false;
      })();

      if (sequenceShouldEnd || pendingSequenceTransition) {
        // Move to next sequence
        transitionToNextSequence();
      } else {
        // Start new cycle in same sequence
        const nextDuration = getPhaseDuration(currentPattern, 'inhale');
        setPhase('inhale');
        setPhaseDuration(nextDuration);
        setPhaseTimeRemaining(nextDuration);
      }
    }
  }, [phase, currentPattern, currentCycle, currentSequence, isIdleSegment,
      sequenceElapsedTime, pendingSequenceTransition, transitionToNextSequence]);

  // Main timer effect
  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    lastTickRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      // Update sequence elapsed time (for duration-based sequences)
      setSequenceElapsedTime(prev => prev + deltaSeconds);

      // Update phase time remaining
      setPhaseTimeRemaining(prev => {
        const newTime = prev - deltaSeconds;

        if (newTime <= 0) {
          // Phase complete, advance on next tick
          setTimeout(() => advancePhase(), 0);
          return 0;
        }

        return newTime;
      });
    }, 25); // 25ms (40fps) for smooth animation updates

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, advancePhase]);

  // Check for duration-based or idle sequence completion
  useEffect(() => {
    if (!isRunning || !currentSequence) return;

    if (currentSequence.type === 'duration' && sequenceElapsedTime >= currentSequence.seconds) {
      // Mark for transition after current cycle completes
      setPendingSequenceTransition(true);
    }

    // Note: Idle segments are handled directly via timer countdown in phaseTimeRemaining
    // They don't need the pendingSequenceTransition mechanism
  }, [isRunning, currentSequence, sequenceElapsedTime]);

  // Start the breath controller
  const start = useCallback(() => {
    if (sequences.length === 0) return;

    const firstSeq = sequences[0];

    // Handle first sequence being idle
    if (firstSeq.type === 'idle') {
      setPhase('idle');
      setPhaseDuration(firstSeq.duration);
      setPhaseTimeRemaining(firstSeq.duration);
    } else {
      const firstPattern = firstSeq.pattern;
      const firstDuration = getPhaseDuration(firstPattern, 'inhale');

      setPhase('inhale');
      setPhaseDuration(firstDuration);
      setPhaseTimeRemaining(firstDuration);
    }

    setCurrentCycle(0);
    setCurrentSequenceIndex(0);
    setSequenceElapsedTime(0);
    setIsComplete(false);
    setIsRunning(true);
    setHasStarted(true);
    setPendingSequenceTransition(false);
  }, [sequences]);

  // Pause
  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Resume
  const resume = useCallback(() => {
    if (!isComplete) {
      setIsRunning(true);
    }
  }, [isComplete]);

  // Stop
  const stop = useCallback(() => {
    setIsRunning(false);
    setIsComplete(true);
  }, []);

  // Reset
  const reset = useCallback(() => {
    setPhase('inhale');
    setPhaseTimeRemaining(0);
    setPhaseDuration(4);
    setCurrentCycle(0);
    setCurrentSequenceIndex(0);
    setSequenceElapsedTime(0);
    setIsRunning(false);
    setIsComplete(false);
    setHasStarted(false);
    setPendingSequenceTransition(false);
  }, []);

  // Get current segment label (for idle segments)
  const currentSegmentLabel = currentSequence?.label || null;

  return {
    // Current state
    phase,
    phaseProgress,
    phaseDuration,
    phaseSecondsRemaining: Math.ceil(phaseTimeRemaining),
    moonAngle,

    // Current pattern (for UI display)
    currentPattern,

    // Cycle tracking
    currentCycle,
    totalCyclesInSequence,

    // Sequence tracking
    currentSequenceIndex,
    totalSequences: sequences.length,
    isIdleSegment,
    currentSegmentLabel,

    // Elapsed time in current sequence (useful for idle segments)
    sequenceElapsedTime,

    // Overall progress
    overallProgress: calculateOverallProgress(),

    // Status
    isComplete,
    isRunning,
    hasStarted,

    // Controls
    start,
    pause,
    resume,
    stop,
    reset,
  };
}

export default useBreathController;

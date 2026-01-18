/**
 * BreathingModule Component
 * Guides the user through breathing exercises with timed visuals
 *
 * Uses shared UI components:
 * - ModuleControlBar for consistent bottom controls
 * - ModuleLayout for consistent layout structure
 *
 * Reports timer state to parent via onTimerUpdate for ModuleStatusBar display
 */

import { useState, useEffect, useCallback } from 'react';

// Shared UI components
import ModuleLayout, { CompletionScreen, IdleScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar from '../capabilities/ModuleControlBar';

export default function BreathingModule({ module, onComplete, onSkip, onTimerUpdate }) {
  const [phase, setPhase] = useState('inhale'); // 'inhale' | 'hold' | 'exhale' | 'holdAfterExhale'
  const [cycleCount, setCycleCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  // Get timing config from module or use defaults
  const config = module.content?.timerConfig || {
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdAfterExhale: 0,
    cycles: 8,
  };

  const totalCycles = config.cycles || 8;

  // Check if exercise is complete
  const isComplete = hasStarted && !isRunning && cycleCount >= totalCycles;

  // Calculate total duration per cycle
  const cycleDuration = (config.inhale || 4) + (config.hold || 0) + (config.exhale || 4) + (config.holdAfterExhale || 0);
  const totalDuration = cycleDuration * totalCycles;

  // Report timer state to parent for ModuleStatusBar
  useEffect(() => {
    if (!onTimerUpdate) return;

    // Calculate approximate elapsed time based on cycles completed
    const elapsedCycles = cycleCount;
    const elapsed = elapsedCycles * cycleDuration;
    const progress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

    onTimerUpdate({
      progress,
      elapsed,
      total: totalDuration,
      showTimer: isRunning,
      isPaused: false,
    });
  }, [cycleCount, isRunning, cycleDuration, totalDuration, onTimerUpdate]);

  const advancePhase = useCallback(() => {
    switch (phase) {
      case 'inhale':
        if (config.hold > 0) {
          setPhase('hold');
        } else {
          setPhase('exhale');
        }
        break;
      case 'hold':
        setPhase('exhale');
        break;
      case 'exhale':
        if (config.holdAfterExhale > 0) {
          setPhase('holdAfterExhale');
        } else {
          // Complete cycle
          const newCount = cycleCount + 1;
          if (newCount >= totalCycles) {
            setIsRunning(false);
          } else {
            setCycleCount(newCount);
            setPhase('inhale');
          }
        }
        break;
      case 'holdAfterExhale':
        // Complete cycle
        const newCount = cycleCount + 1;
        if (newCount >= totalCycles) {
          setIsRunning(false);
        } else {
          setCycleCount(newCount);
          setPhase('inhale');
        }
        break;
    }
  }, [phase, config, cycleCount, totalCycles]);

  useEffect(() => {
    if (!isRunning) return;

    const getPhaseDuration = () => {
      switch (phase) {
        case 'inhale':
          return config.inhale || 4;
        case 'hold':
          return config.hold || 4;
        case 'exhale':
          return config.exhale || 4;
        case 'holdAfterExhale':
          return config.holdAfterExhale || 0;
        default:
          return 4;
      }
    };

    const duration = getPhaseDuration();
    setCountdown(duration);

    if (duration === 0) {
      // Skip this phase
      advancePhase();
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          advancePhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, isRunning, config, advancePhase]);

  const handleStart = useCallback(() => {
    setHasStarted(true);
    setIsRunning(true);
    setCycleCount(0);
    setPhase('inhale');
  }, []);

  const handleStop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const getPhaseText = () => {
    switch (phase) {
      case 'inhale':
        return 'Breathe in...';
      case 'hold':
        return 'Hold...';
      case 'exhale':
        return 'Breathe out...';
      case 'holdAfterExhale':
        return 'Hold...';
      default:
        return '';
    }
  };

  const getCircleSize = () => {
    switch (phase) {
      case 'inhale':
        return 'scale-100';
      case 'hold':
        return 'scale-100';
      case 'exhale':
        return 'scale-75';
      case 'holdAfterExhale':
        return 'scale-75';
      default:
        return 'scale-75';
    }
  };

  // Determine current phase for control bar
  const getControlPhase = () => {
    if (!hasStarted) return 'idle';
    if (isComplete) return 'completed';
    return 'active';
  };

  // Get primary button config based on phase
  const getPrimaryButton = () => {
    const controlPhase = getControlPhase();

    if (controlPhase === 'idle') {
      return {
        label: 'Begin',
        onClick: handleStart,
      };
    }

    if (controlPhase === 'active') {
      return {
        label: 'Stop Early',
        onClick: handleStop,
      };
    }

    if (controlPhase === 'completed') {
      return {
        label: 'Continue',
        onClick: onComplete,
      };
    }

    return null;
  };

  return (
    <>
      <ModuleLayout
        layout={{ centered: true, maxWidth: 'md' }}
      >
        {/* Idle state: show start screen */}
        {!hasStarted && (
          <IdleScreen
            title={module.title}
            description={module.content?.instructions || "Follow the breathing pattern. Breathe naturally and don't strain."}
          />
        )}

        {/* Active state: breathing exercise */}
        {isRunning && (
          <div className="text-center space-y-6">
            {/* Cycle indicator */}
            <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider">
              Cycle {cycleCount + 1} / {totalCycles}
            </p>

            {/* Breathing circle animation */}
            <div className="flex justify-center py-4">
              <div
                className={`w-32 h-32 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center transition-transform duration-1000 ease-in-out ${getCircleSize()}`}
              >
                <span className="text-lg text-[var(--color-text-primary)]">{countdown}</span>
              </div>
            </div>

            <p className="text-[var(--color-text-primary)] uppercase tracking-wider text-sm">
              {getPhaseText()}
            </p>
          </div>
        )}

        {/* Completed state */}
        {isComplete && (
          <CompletionScreen
            title="Well done."
            message="Take a moment to notice how you feel."
          />
        )}
      </ModuleLayout>

      {/* Fixed control bar above tab bar */}
      <ModuleControlBar
        phase={getControlPhase()}
        primary={getPrimaryButton()}
        showBack={false}
        showSkip={!isComplete}
        onSkip={onSkip}
        skipConfirmMessage="Skip this breathing exercise?"
      />
    </>
  );
}

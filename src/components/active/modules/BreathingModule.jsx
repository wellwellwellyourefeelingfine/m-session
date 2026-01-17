/**
 * BreathingModule Component
 * Guides the user through breathing exercises with timed visuals
 */

import { useState, useEffect } from 'react';

export default function BreathingModule({ module, onComplete, onSkip }) {
  const [phase, setPhase] = useState('inhale'); // 'inhale' | 'hold' | 'exhale' | 'holdAfterExhale'
  const [cycleCount, setCycleCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Get timing config from module or use defaults
  const config = module.content?.timerConfig || {
    inhale: 4,
    hold: 4,
    exhale: 4,
    holdAfterExhale: 0,
    cycles: 8,
  };

  const totalCycles = config.cycles || 8;

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
  }, [phase, isRunning, cycleCount]);

  const advancePhase = () => {
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
          completeCycle();
        }
        break;
      case 'holdAfterExhale':
        completeCycle();
        break;
    }
  };

  const completeCycle = () => {
    const newCount = cycleCount + 1;
    if (newCount >= totalCycles) {
      setIsRunning(false);
    } else {
      setCycleCount(newCount);
      setPhase('inhale');
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    setCycleCount(0);
    setPhase('inhale');
  };

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

  return (
    <div className="flex flex-col justify-between px-6 py-8">
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="text-center space-y-8 max-w-md mx-auto">
          <h2 className="text-[var(--color-text-primary)]">
            {module.title}
          </h2>

          {!isRunning && cycleCount === 0 && (
            <>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                {module.content?.instructions || 'Follow the breathing pattern. Breathe naturally and don\'t strain.'}
              </p>

              <button
                onClick={handleStart}
                className="mt-8 px-8 py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors uppercase tracking-wider"
              >
                Begin
              </button>
            </>
          )}

          {isRunning && (
            <>
              {/* Breathing circle animation */}
              <div className="flex justify-center py-8">
                <div
                  className={`w-32 h-32 rounded-full border-2 border-[var(--color-border)] flex items-center justify-center transition-transform duration-1000 ease-in-out ${getCircleSize()}`}
                >
                  <span className="text-lg text-[var(--color-text-primary)]">{countdown}</span>
                </div>
              </div>

              <p className="text-lg text-[var(--color-text-primary)]">
                {getPhaseText()}
              </p>

              <p className="text-[var(--color-text-tertiary)] text-sm">
                Cycle {cycleCount + 1} of {totalCycles}
              </p>
            </>
          )}

          {!isRunning && cycleCount >= totalCycles && (
            <>
              <div className="py-8">
                <p className="text-[var(--color-text-primary)]">
                  Well done.
                </p>
                <p className="text-[var(--color-text-secondary)] mt-4">
                  Take a moment to notice how you feel.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="w-full max-w-md mx-auto mt-8 space-y-4">
        {(!isRunning && cycleCount >= totalCycles) || !isRunning ? (
          <>
            <button
              onClick={onComplete}
              className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)]
                         uppercase tracking-wider hover:opacity-80 transition-opacity duration-300"
            >
              Continue
            </button>

            <button
              onClick={onSkip}
              className="w-full py-2 text-[var(--color-text-tertiary)] underline"
            >
              Skip
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsRunning(false)}
            className="w-full py-2 text-[var(--color-text-tertiary)] underline"
          >
            Stop Early
          </button>
        )}
      </div>
    </div>
  );
}

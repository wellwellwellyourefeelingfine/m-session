/**
 * TimerCapability Component
 *
 * Renders timer UI based on configuration:
 * - Progress bar at top of screen
 * - Elapsed/remaining time display
 * - Works with useModuleTimer hook
 */

import { formatTime } from '../../../content/meditations';

/**
 * @param {object} props
 * @param {object} props.config - Timer capability config
 * @param {string} props.config.type - 'elapsed' | 'countdown' | 'breathing' | 'hidden'
 * @param {boolean} props.config.showProgress - Show progress bar
 * @param {boolean} props.config.showTimeDisplay - Show MM:SS display
 * @param {object} props.timerState - State from useModuleTimer hook
 * @param {number} props.totalDuration - Total duration in seconds
 */
export default function TimerCapability({
  config,
  timerState,
  totalDuration,
}) {
  if (!config || config.type === 'hidden') {
    return null;
  }

  const {
    elapsedTime,
    remainingTime,
    progress,
    breathPhase,
    cycleCount,
    totalCycles,
    phaseCountdown,
  } = timerState;

  const { showProgress, showTimeDisplay, type } = config;

  // Breathing mode renders differently
  if (type === 'breathing') {
    return (
      <BreathingTimerDisplay
        breathPhase={breathPhase}
        phaseCountdown={phaseCountdown}
        cycleCount={cycleCount}
        totalCycles={totalCycles}
      />
    );
  }

  // Elapsed/Countdown modes
  return (
    <>
      {/* Progress bar - fixed at top */}
      {showProgress && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-[var(--color-border)] z-20">
          <div
            className="h-full bg-[var(--color-text-primary)] transition-all duration-200 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Time display */}
      {showTimeDisplay && (
        <div className="text-center">
          <span className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider">
            {type === 'countdown'
              ? formatTime(remainingTime)
              : `${formatTime(elapsedTime)} / ${formatTime(totalDuration)}`}
          </span>
        </div>
      )}
    </>
  );
}

/**
 * Breathing-specific timer display
 * Shows phase text and cycle progress
 */
function BreathingTimerDisplay({
  breathPhase,
  phaseCountdown,
  cycleCount,
  totalCycles,
}) {
  const getPhaseText = () => {
    switch (breathPhase) {
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

  return (
    <div className="text-center space-y-2">
      <p className="text-lg text-[var(--color-text-primary)]">
        {getPhaseText()}
      </p>
      <p className="text-3xl text-[var(--color-text-primary)] font-light">
        {phaseCountdown}
      </p>
      <p className="text-[var(--color-text-tertiary)] text-sm">
        Cycle {cycleCount + 1} of {totalCycles}
      </p>
    </div>
  );
}

/**
 * Standalone progress bar component for use outside TimerCapability
 */
export function ProgressBar({ progress, className = '' }) {
  return (
    <div className={`fixed top-0 left-0 right-0 h-1 bg-[var(--color-border)] z-20 ${className}`}>
      <div
        className="h-full bg-[var(--color-text-primary)] transition-all duration-200 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/**
 * Standalone time display component
 */
export function TimeDisplay({ elapsed, total, variant = 'elapsed', className = '' }) {
  const display = variant === 'countdown'
    ? formatTime(Math.max(total - elapsed, 0))
    : `${formatTime(elapsed)} / ${formatTime(total)}`;

  return (
    <span className={`text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider ${className}`}>
      {display}
    </span>
  );
}

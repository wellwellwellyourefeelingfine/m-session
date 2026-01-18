/**
 * ModuleProgressBar Component
 *
 * A minimal, fixed-position progress bar at the top of the screen.
 * Shows module progress for timed activities.
 *
 * Features:
 * - Fixed at top of screen
 * - Thin, unobtrusive design
 * - Smooth animation
 * - Optional time display below
 */

import { formatTime } from '../../../content/meditations';

/**
 * @param {object} props
 * @param {number} props.progress - Progress percentage (0-100)
 * @param {boolean} props.visible - Whether to show the bar
 * @param {number} props.elapsed - Elapsed time in seconds (optional)
 * @param {number} props.total - Total duration in seconds (optional)
 * @param {boolean} props.showTime - Show time display
 * @param {boolean} props.isPaused - Whether timer is paused (dims the bar)
 */
export default function ModuleProgressBar({
  progress = 0,
  visible = true,
  elapsed,
  total,
  showTime = false,
  isPaused = false,
}) {
  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      {/* Progress bar track */}
      <div className="h-0.5 bg-[var(--color-border)]">
        {/* Progress bar fill */}
        <div
          className={`h-full bg-[var(--color-text-primary)] transition-all duration-200 ease-linear
            ${isPaused ? 'opacity-50' : 'opacity-100'}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Optional time display */}
      {showTime && elapsed !== undefined && total !== undefined && (
        <div className="flex justify-center pt-3">
          <span className={`text-[10px] uppercase tracking-wider transition-opacity
            ${isPaused ? 'text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-secondary)]'}`}>
            {formatTime(elapsed)} / {formatTime(total)}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Step progress indicator (dots)
 * For sequential modules like grounding
 */
export function StepProgressIndicator({
  total,
  current,
  className = '',
}) {
  return (
    <div className={`flex justify-center space-x-2 ${className}`}>
      {Array.from({ length: total }, (_, index) => (
        <div
          key={index}
          className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
            index === current
              ? 'bg-[var(--color-text-primary)]'
              : index < current
                ? 'bg-[var(--color-text-secondary)]'
                : 'bg-[var(--color-border)]'
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Cycle progress indicator
 * For breathing modules showing current cycle
 */
export function CycleProgressIndicator({
  current,
  total,
  className = '',
}) {
  return (
    <div className={`text-center ${className}`}>
      <span className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider">
        {current} / {total}
      </span>
    </div>
  );
}

/**
 * ModuleStatusBar Component
 *
 * A unified fixed-position status bar that sits below the main header.
 * Provides consistent progress + status across ALL active tab views:
 * active session phases, pre-session, transitions, follow-up, and preview.
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ ══════════════════════════════════ (progress line at top)  │
 * │ Left Label            [Center Content]        Right Content │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Features:
 * - Fixed position below main header
 * - Progress bar at top (filled based on module progress)
 * - Flexible left/center/right content slots
 * - Context-agnostic: labels and content passed as props by the caller
 */

import ModuleProgressBar from './capabilities/ModuleProgressBar';

/**
 * Format seconds to MM:SS or H:MM:SS
 */
// eslint-disable-next-line react-refresh/only-export-components -- shared utility, used by ActiveView
export function formatTime(seconds) {
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * @param {object} props
 * @param {number} props.progress - Module progress percentage (0-100)
 * @param {boolean} props.isPaused - Whether the module is paused (dims the bar)
 * @param {string} props.leftLabel - Label for the left side (e.g., "Phase 1 · Come-Up", "Transition")
 * @param {import('react').ReactNode} [props.centerContent] - Optional center content (timer, elapsed text)
 * @param {import('react').ReactNode} [props.rightContent] - Optional right content (session elapsed, step count, exit button)
 */
export default function ModuleStatusBar({
  progress = 0,
  isPaused = false,
  leftLabel = '',
  centerContent = null,
  rightContent = null,
}) {
  return (
    <>
      <ModuleProgressBar progress={progress} isPaused={isPaused} />
      <div className="fixed left-0 right-0 z-30" style={{ top: 'var(--header-height)' }}>
        {/* Status content */}
        <div className="flex items-center px-4 py-2 gap-3">
          {/* Left: Label */}
          <div className="flex items-center flex-shrink-0">
            <span className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider whitespace-nowrap">
              {leftLabel}
            </span>
          </div>

          {/* Center: Flexible content */}
          <div className="flex-1 flex justify-center min-w-0">
            {centerContent}
          </div>

          {/* Right: Flexible content */}
          {rightContent && (
            <div className="flex-shrink-0">
              {rightContent}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Hook to calculate module status bar height for layout padding
 * Progress bar (2px) + content (py-2 = 8px*2 + text ~14px) + border (1px) ≈ 33px
 * We'll use 36px (h-9) for safety
 */
export const MODULE_STATUS_BAR_HEIGHT = 36; // in pixels

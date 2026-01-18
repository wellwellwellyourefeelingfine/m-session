/**
 * ModuleStatusBar Component
 *
 * A fixed-position status bar that sits below the main header.
 * Provides consistent session/module status across all active tab views.
 *
 * Layout:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ ══════════════════════════════════ (progress line at top)  │
 * │ Phase 1 · Come-Up     [5:34 / 10:00]     Session: 1:23:45  │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Features:
 * - Fixed position below main header (top-16)
 * - Progress bar at top (filled based on module progress)
 * - Left: Phase number and name
 * - Center: Optional module timer (when module has timed progress)
 * - Right: Total session elapsed time
 */

import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';

const PHASE_CONFIG = {
  'come-up': { number: 1, name: 'Come-Up' },
  peak: { number: 2, name: 'Peak' },
  integration: { number: 3, name: 'Integration' },
};

/**
 * Format seconds to MM:SS or H:MM:SS
 */
function formatTime(seconds) {
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
 * Format minutes to display (e.g., "1:23" for 83 minutes)
 */
function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:00`;
  }
  return `${mins}:00`;
}

/**
 * @param {object} props
 * @param {string} props.phase - Current phase: 'come-up' | 'peak' | 'integration'
 * @param {number} props.progress - Module progress percentage (0-100), optional
 * @param {number} props.moduleElapsed - Module elapsed time in seconds, optional
 * @param {number} props.moduleTotal - Module total duration in seconds, optional
 * @param {boolean} props.showModuleTimer - Whether to show the module timer
 * @param {boolean} props.isPaused - Whether the module timer is paused
 */
export default function ModuleStatusBar({
  phase = 'come-up',
  progress = 0,
  moduleElapsed,
  moduleTotal,
  showModuleTimer = false,
  isPaused = false,
}) {
  const [sessionElapsed, setSessionElapsed] = useState('0:00');

  const getElapsedMinutes = useSessionStore((state) => state.getElapsedMinutes);

  // Update session elapsed time every second
  useEffect(() => {
    const updateElapsed = () => {
      const minutes = getElapsedMinutes();
      setSessionElapsed(formatMinutes(minutes));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [getElapsedMinutes]);

  const phaseConfig = PHASE_CONFIG[phase] || PHASE_CONFIG['come-up'];

  return (
    <div className="fixed top-16 left-0 right-0 z-30 bg-[var(--color-bg)]">
      {/* Progress bar at the very top of this component - uses text-primary color (dark in light mode, light in dark mode) */}
      <div className="h-0.5 bg-[var(--color-border)]">
        <div
          className={`h-full transition-all duration-200 ease-linear
            ${isPaused ? 'opacity-50' : 'opacity-100'}`}
          style={{
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Status content */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)]">
        {/* Left: Phase info */}
        <div className="flex items-center space-x-2 min-w-0 flex-shrink-0">
          <span className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider">
            Phase {phaseConfig.number}
          </span>
          <span className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
          <span className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider">
            {phaseConfig.name}
          </span>
        </div>

        {/* Center: Optional module timer */}
        <div className="flex-1 flex justify-center">
          {showModuleTimer && moduleElapsed !== undefined && moduleTotal !== undefined && (
            <span className={`text-[10px] uppercase tracking-wider transition-opacity
              ${isPaused ? 'text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-secondary)]'}`}>
              {formatTime(moduleElapsed)} / {formatTime(moduleTotal)}
            </span>
          )}
        </div>

        {/* Right: Session elapsed time */}
        <div className="flex-shrink-0">
          <span className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider">
            {sessionElapsed}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to calculate module status bar height for layout padding
 * Progress bar (2px) + content (py-2 = 8px*2 + text ~14px) + border (1px) ≈ 33px
 * We'll use 36px (h-9) for safety
 */
export const MODULE_STATUS_BAR_HEIGHT = 36; // in pixels

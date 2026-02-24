/**
 * AltSessionModuleModal Component
 * Shared modal for pre-session and follow-up modules added from the library.
 * Shows module details, duration picker, and Begin button.
 * In follow-up mode: includes time-lock countdown UI.
 * In pre-session mode: modules are always immediately available.
 */

import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useAppStore } from '../../stores/useAppStore';
import { getModuleById } from '../../content/modules';
import DurationPicker from '../shared/DurationPicker';

/**
 * Format countdown time with full details (follow-up mode only)
 */
function formatCountdownDetailed(unlockTime) {
  if (!unlockTime) return { countdown: '', dateTime: '', isUnlocked: true };

  const now = Date.now();
  const remaining = unlockTime - now;
  const unlockDate = new Date(unlockTime);

  if (remaining <= 0) {
    return { countdown: 'Available now', dateTime: '', isUnlocked: true };
  }

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  const countdown = hours > 0
    ? `Available in ${hours}h ${minutes}m`
    : `Available in ${minutes}m`;

  const dateTime = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(unlockDate);

  return { countdown, dateTime, isUnlocked: false };
}

export default function AltSessionModuleModal({ module, onClose, onBegin, mode = 'follow-up' }) {
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  const session = useSessionStore((state) => state.session);
  const updateModuleDuration = useSessionStore((state) => state.updateModuleDuration);
  const setCurrentTab = useAppStore((state) => state.setCurrentTab);

  const libraryModule = getModuleById(module.libraryId);

  // Time-lock logic (follow-up mode only)
  const isPreSession = mode === 'pre-session';
  let isUnlocked = true;
  let countdown = '';
  let dateTime = '';

  if (!isPreSession) {
    const unlockDelayHours = libraryModule?.unlockDelay || 24;
    const closedAt = session?.closedAt;
    const unlockTime = closedAt
      ? closedAt + unlockDelayHours * 60 * 60 * 1000
      : null;
    const result = formatCountdownDetailed(unlockTime);
    isUnlocked = result.isUnlocked;
    countdown = result.countdown;
    dateTime = result.dateTime;
  }

  // Check if module is already completed or in progress
  const isCompleted = module.status === 'completed';
  const isActive = module.status === 'active';

  // Duration picker settings
  const hasVariableDuration = libraryModule?.hasVariableDuration === true;
  const durationSteps = libraryModule?.durationSteps || [10, 15, 20, 25, 30];

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const handleBegin = () => {
    if (onBegin) {
      onBegin(module);
    }
    onClose();
  };

  const defaultDescription = isPreSession
    ? 'A pre-session activity to try before your session begins.'
    : 'A follow-up activity to continue your integration.';

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg)] w-full max-w-md rounded-t-2xl p-6 pb-8 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors p-2 -m-2"
          >
            <span className="text-xl">−</span>
          </button>
        </div>

        {/* Module title */}
        <h3 className="mb-2 text-[var(--color-text-primary)]">
          {module.title}
        </h3>

        {/* Duration - clickable if variable duration */}
        <div className="mb-4">
          {hasVariableDuration && isUnlocked && !isCompleted ? (
            <button
              onClick={() => setShowDurationPicker(true)}
              className="text-[var(--color-text-secondary)] text-sm underline decoration-dotted underline-offset-2 hover:text-[var(--color-text-primary)] transition-colors"
            >
              {formatDuration(module.duration)}
            </button>
          ) : (
            <p className="text-[var(--color-text-tertiary)] text-xs">
              {formatDuration(module.duration)}
            </p>
          )}
        </div>

        {/* Description */}
        <p className="text-[var(--color-text-secondary)] mb-4 leading-relaxed text-sm">
          {libraryModule?.description || defaultDescription}
        </p>

        {/* Locked state: Show countdown (follow-up mode only) */}
        {!isPreSession && !isUnlocked && !isCompleted && (
          <div className="mb-6 text-center py-4 border border-[var(--color-border)] rounded">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-[var(--color-text-tertiary)]">🔒</span>
              <p className="text-[var(--color-text-primary)]">
                {countdown}
              </p>
            </div>
            {dateTime && (
              <p className="text-[var(--color-text-tertiary)] text-xs">
                {dateTime}
              </p>
            )}
          </div>
        )}

        {/* Completed state: Show completion message */}
        {isCompleted && (
          <div className="mb-6 text-center py-4 border border-[var(--color-border)] rounded">
            <p className="text-[var(--color-text-tertiary)]">
              You've already completed this activity.
            </p>
          </div>
        )}

        {/* Active state: Show in progress message */}
        {isActive && (
          <div className="mb-6 text-center py-4 border border-[var(--color-border)] rounded">
            <p className="text-[var(--color-text-secondary)]">
              This activity is currently in progress.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          {isUnlocked && !isCompleted && !isActive && (
            <button
              onClick={handleBegin}
              className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
            >
              Begin
            </button>
          )}
          {isActive && (
            <button
              onClick={() => {
                setCurrentTab('active');
                onClose();
              }}
              className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
            >
              Continue
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs hover:text-[var(--color-text-secondary)] transition-colors"
          >
            {(isUnlocked && !isCompleted) || isActive ? 'Not Now' : 'Close'}
          </button>
        </div>
      </div>

      {/* Duration Picker Modal */}
      {showDurationPicker && (
        <DurationPicker
          isOpen={showDurationPicker}
          onClose={() => setShowDurationPicker(false)}
          onSelect={(newDuration) => {
            updateModuleDuration(module.instanceId, newDuration);
          }}
          currentDuration={module.duration}
          durationSteps={durationSteps}
          minDuration={libraryModule?.minDuration || 10}
          maxDuration={libraryModule?.maxDuration || 30}
        />
      )}
    </div>
  );
}

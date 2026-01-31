/**
 * FollowUpModuleModal Component
 * Modal that appears when user taps a follow-up module
 * Shows different content based on locked/available/completed status
 */

import { useSessionStore } from '../../stores/useSessionStore';
import { FOLLOW_UP_MODULES } from '../followup/content/followUpContent';

/**
 * Format countdown time with full details
 */
function formatCountdownDetailed(unlockTime) {
  if (!unlockTime) return { countdown: '', dateTime: '' };

  const now = Date.now();
  const remaining = unlockTime - now;
  const unlockDate = new Date(unlockTime);

  if (remaining <= 0) {
    return { countdown: 'Available now', dateTime: '' };
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

  return { countdown, dateTime };
}

export default function FollowUpModuleModal({ moduleId, onClose }) {
  const followUp = useSessionStore((state) => state.followUp);
  const startFollowUpModule = useSessionStore((state) => state.startFollowUpModule);

  const module = FOLLOW_UP_MODULES[moduleId];
  const moduleState = followUp.modules[moduleId];
  const unlockTime = followUp.unlockTimes[moduleId];

  const status = moduleState.status;
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';
  const isAvailable = status === 'available';

  const { countdown, dateTime } = formatCountdownDetailed(unlockTime);

  const handleBegin = () => {
    startFollowUpModule(moduleId);
    onClose();
  };

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

        {/* Duration estimate */}
        <p className="text-[var(--color-text-tertiary)] text-xs mb-4">
          {module.duration}
        </p>

        {/* Description based on status */}
        <p className="text-[var(--color-text-secondary)] mb-4 leading-relaxed text-sm">
          {isLocked ? module.lockedDescription : module.description}
        </p>

        {/* Locked state: Show countdown */}
        {isLocked && (
          <div className="mb-6 text-center py-4 border border-[var(--color-border)] rounded">
            <p className="text-[var(--color-text-primary)] mb-1">
              {countdown}
            </p>
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
              You've already completed this module.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          {isAvailable && (
            <button
              onClick={handleBegin}
              className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
            >
              Begin
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs hover:text-[var(--color-text-secondary)] transition-colors"
          >
            {isAvailable ? 'Not Now' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

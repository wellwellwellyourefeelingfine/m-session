/**
 * PeakPhaseCheckIn Component
 * Modal that appears when the user finishes all scheduled peak activities.
 *
 * Shows:
 * - Session elapsed time
 * - Booster timing warning (if applicable)
 * - Option to continue to integration phase
 * - Close button to dismiss and return to open space
 */

import { useSessionStore } from '../../stores/useSessionStore';

// Format elapsed minutes as human-readable string
const formatElapsedTime = (minutes) => {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours !== 1 ? 's' : ''} and ${mins} minute${mins !== 1 ? 's' : ''}`;
};

export default function PeakPhaseCheckIn() {
  // Store subscriptions
  const booster = useSessionStore((state) => state.booster);
  const beginIntegrationTransition = useSessionStore((state) => state.beginIntegrationTransition);
  const dismissPeakCheckIn = useSessionStore((state) => state.dismissPeakCheckIn);
  const getElapsedMinutes = useSessionStore((state) => state.getElapsedMinutes);

  // Computed values
  const elapsedMinutes = getElapsedMinutes();
  const boosterTaken = booster.status === 'taken';
  const minutesSinceBooster = boosterTaken && booster.boosterTakenAt
    ? Math.floor((Date.now() - new Date(booster.boosterTakenAt).getTime()) / (1000 * 60))
    : null;
  const showBoosterWarning = boosterTaken && minutesSinceBooster !== null && minutesSinceBooster < 45;

  // Handle dismiss (return to open space)
  const handleDismiss = () => {
    dismissPeakCheckIn();
  };

  // Handle continue to integration phase
  const handleContinueToIntegration = () => {
    beginIntegrationTransition();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fadeIn"
      onClick={handleDismiss}
    >
      <div
        className="bg-[var(--color-bg)] w-full max-w-md rounded-t-2xl p-6 pb-8 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleDismiss}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors p-2 -m-2"
          >
            <span className="text-xl">−</span>
          </button>
        </div>

        <h3 className="mb-4">End of Peak Phase</h3>

        <p className="text-[var(--color-text-secondary)] mb-4 leading-relaxed">
          You've finished all of your scheduled activities in the peak phase.
        </p>

        <p className="text-[var(--color-text-tertiary)] text-sm mb-6">
          {formatElapsedTime(elapsedMinutes)} have elapsed since you started your session.
        </p>

        {/* Booster timing warning */}
        {showBoosterWarning && (
          <div className="border border-[var(--accent)] bg-[var(--accent-bg)] p-4 mb-6">
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              It's been {minutesSinceBooster} minute{minutesSinceBooster !== 1 ? 's' : ''} since
              you took your booster. You may want to wait and experience the effects before
              moving into the integration phase.
            </p>
          </div>
        )}

        <p className="text-[var(--color-text-secondary)] text-sm mb-6">
          When you're ready, you can continue to the integration phase.
        </p>

        <div className="space-y-3">
          {/* Continue to integration phase */}
          <button
            onClick={handleContinueToIntegration}
            className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
          >
            Continue to Integration Phase
          </button>

          {/* Stay in open space */}
          <button
            onClick={handleDismiss}
            className="w-full py-3 text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Stay in Open Space
          </button>
        </div>
      </div>
    </div>
  );
}

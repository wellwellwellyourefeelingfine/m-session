/**
 * PeakPhaseCheckIn Component
 * Modal that appears when the user finishes all scheduled peak activities.
 *
 * Shows:
 * - Session elapsed time
 * - Booster timing warning (if applicable)
 * - Option to continue to integration phase
 * - Tapping backdrop or "Stay in Open Space" dismisses
 */

import { useState } from 'react';
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
  const booster = useSessionStore((state) => state.booster);
  const beginIntegrationTransition = useSessionStore((state) => state.beginIntegrationTransition);
  const dismissPeakCheckIn = useSessionStore((state) => state.dismissPeakCheckIn);
  const getElapsedMinutes = useSessionStore((state) => state.getElapsedMinutes);

  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const elapsedMinutes = getElapsedMinutes();
  const boosterTaken = booster.status === 'taken';
  const minutesSinceBooster = boosterTaken && booster.boosterTakenAt
    ? Math.floor((Date.now() - booster.boosterTakenAt) / (1000 * 60))
    : null;
  const showBoosterWarning = boosterTaken && minutesSinceBooster !== null && minutesSinceBooster < 45;

  const handleDismiss = () => {
    if (isAnimatingOut) return;
    setIsAnimatingOut(true);
    setTimeout(() => dismissPeakCheckIn(), 350);
  };

  const handleContinueToIntegration = () => {
    if (isAnimatingOut) return;
    setIsAnimatingOut(true);
    setTimeout(() => beginIntegrationTransition(), 350);
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop — fades in/out, tap to dismiss */}
      <div
        className={`absolute inset-0 bg-black/25 ${isAnimatingOut ? 'animate-fadeOut' : 'animate-fadeIn'}`}
        onClick={handleDismiss}
      />

      {/* Panel — slide up on open, slide down on close */}
      <div
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[var(--color-bg)] rounded-t-2xl p-6 pb-8 ${
          isAnimatingOut ? 'animate-slideDownOut' : 'animate-slideUp'
        }`}
      >
        {/* Close button — absolute so the header can sit flush at the top */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors p-2 -m-2"
          aria-label="Dismiss"
        >
          <span className="text-xl">−</span>
        </button>

        <h2
          className="text-xl font-light mb-2 text-center"
          style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
        >
          End of Peak Phase
        </h2>

        <p className="text-[var(--color-text-tertiary)] text-xs mb-6 text-center">
          You are about {formatElapsedTime(elapsedMinutes)} into your session.
        </p>

        <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
          You've finished all of your scheduled activities in the peak phase.
        </p>

        {/* Booster timing warning */}
        {showBoosterWarning && (
          <div className="border border-[var(--accent)] bg-[var(--accent-bg)] p-4 mb-4">
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              It's been {minutesSinceBooster} minute{minutesSinceBooster !== 1 ? 's' : ''} since
              you took your booster. You may want to wait and experience the effects before
              moving into the synthesis phase.
            </p>
          </div>
        )}

        <p className="text-[var(--color-text-secondary)] text-sm mb-6 leading-relaxed">
          When you're ready, you can continue to the synthesis phase.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleContinueToIntegration}
            className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
          >
            Continue to Synthesis Phase
          </button>

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

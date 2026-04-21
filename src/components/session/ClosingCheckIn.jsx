/**
 * ClosingCheckIn Component
 * Consent modal that appears after the last integration module completes
 * Asks user if they're ready to begin the closing ritual
 */

import { useSessionStore } from '../../stores/useSessionStore';
import { OrigamiIcon, CircleSkipIcon } from '../shared/Icons';

export default function ClosingCheckIn() {
  const dismissClosingCheckIn = useSessionStore((state) => state.dismissClosingCheckIn);
  const beginClosingRitual = useSessionStore((state) => state.beginClosingRitual);

  const handleBeginClosing = () => {
    beginClosingRitual();
  };

  const handleStayHere = () => {
    dismissClosingCheckIn();
  };

  return (
    <div
      className="fixed inset-0 bg-black/25 flex items-end justify-center z-50 animate-fadeIn"
      onClick={handleStayHere}
    >
      <div
        className="bg-[var(--color-bg)] w-full max-w-md rounded-t-2xl p-6 pb-8 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <OrigamiIcon size={28} strokeWidth={2.5} className="flex-shrink-0 text-[var(--accent)]" />
            <h3
              className="mb-0 text-lg text-[var(--color-text-primary)]"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              Ready to Close Your Session?
            </h3>
          </div>
          <button
            onClick={handleStayHere}
            className="flex-shrink-0 p-2 -m-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <CircleSkipIcon size={22} />
          </button>
        </div>

        <p className="text-[var(--color-text-secondary)] text-sm mb-4 leading-relaxed">
          You&apos;ve completed your scheduled activities. Would you like to begin the closing ritual?
        </p>

        <p className="text-[var(--color-text-tertiary)] mb-8 text-xs leading-relaxed">
          The closing ritual is a gentle way to honor what you experienced and create a bridge to the days ahead.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleBeginClosing}
            className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
          >
            Begin Closing Ritual
          </button>
          <button
            onClick={handleStayHere}
            className="w-full py-3 text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Not yet, stay here
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ClosingCheckIn Component
 * Consent modal that appears after the last integration module completes
 * Asks user if they're ready to begin the closing ritual
 */

import { useSessionStore } from '../../stores/useSessionStore';
import { CLOSING_CHECKIN_CONTENT } from './transitions/content/closingRitualContent';

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
      className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fadeIn"
      onClick={handleStayHere}
    >
      <div
        className="bg-[var(--color-bg)] w-full max-w-md rounded-t-2xl p-6 pb-8 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end mb-4">
          <button
            onClick={handleStayHere}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors p-2 -m-2"
          >
            <span className="text-xl">−</span>
          </button>
        </div>

        <h3 className="mb-4 text-[var(--color-text-primary)]">
          {CLOSING_CHECKIN_CONTENT.title}
        </h3>

        <p className="text-[var(--color-text-secondary)] mb-4 leading-relaxed">
          {CLOSING_CHECKIN_CONTENT.body}
        </p>

        <p className="text-[var(--color-text-tertiary)] mb-8 text-sm leading-relaxed">
          {CLOSING_CHECKIN_CONTENT.bodySecondary}
        </p>

        <div className="space-y-3">
          <button
            onClick={handleBeginClosing}
            className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
          >
            {CLOSING_CHECKIN_CONTENT.beginButton}
          </button>
          <button
            onClick={handleStayHere}
            className="w-full py-3 text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs hover:text-[var(--color-text-secondary)] transition-colors"
          >
            {CLOSING_CHECKIN_CONTENT.stayButton}
          </button>
        </div>
      </div>
    </div>
  );
}

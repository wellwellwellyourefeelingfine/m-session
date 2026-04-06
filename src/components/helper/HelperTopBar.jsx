/**
 * HelperTopBar
 * Fixed top bar inside the modal: back button (left), header + description (center), close button (right).
 */

import { ChevronLeftIcon, CircleSkipIcon } from '../shared/Icons';

export default function HelperTopBar({ canGoBack, onBack, onClose }) {
  return (
    <div className="flex items-start justify-between px-5 pt-5 pb-3">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="p-1 transition-opacity"
        style={{
          opacity: canGoBack ? 1 : 0.3,
          pointerEvents: canGoBack ? 'auto' : 'none',
        }}
        aria-label="Go back"
      >
        <ChevronLeftIcon size={20} className="text-[var(--color-text-primary)]" />
      </button>

      {/* Center: header + description */}
      <div className="flex-1 text-center px-2">
        <h2
          className="text-2xl mb-1"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none', color: 'var(--color-text-primary)' }}
        >
          What&rsquo;s happening?
        </h2>
        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          You&rsquo;re safe. Take a moment to notice what&rsquo;s coming up for you.
        </p>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="p-1"
        aria-label="Close support menu"
      >
        <CircleSkipIcon size={20} className="text-[var(--color-text-primary)]" />
      </button>
    </div>
  );
}

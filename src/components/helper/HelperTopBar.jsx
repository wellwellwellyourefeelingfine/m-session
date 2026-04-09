/**
 * HelperTopBar
 * Fixed top bar inside the modal: back button (left), header + description (center), close button (right).
 */

import { ChevronLeftIcon, CircleSkipIcon } from '../shared/Icons';

export default function HelperTopBar({ canGoBack, onBack, onClose }) {
  return (
    <div className="flex items-start justify-between px-5 pt-2 pb-0">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="p-1 transition-opacity text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
        style={{
          opacity: canGoBack ? 1 : 0.3,
          pointerEvents: canGoBack ? 'auto' : 'none',
        }}
        aria-label="Go back"
      >
        <ChevronLeftIcon size={20} />
      </button>

      {/* Center: header + description */}
      <div className="flex-1 text-center px-2" style={{ marginTop: '3px' }}>
        <h2
          className="text-2xl"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none', color: 'var(--color-text-primary)', lineHeight: 1, margin: 0 }}
        >
          What&rsquo;s happening?
        </h2>
        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)', marginTop: '6px' }}>
          You&rsquo;re safe. Take a moment to notice what&rsquo;s coming up for you.
        </p>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
        aria-label="Close support menu"
      >
        <CircleSkipIcon size={20} />
      </button>
    </div>
  );
}

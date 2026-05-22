/**
 * HelperTopBar
 * Fixed top bar inside the modal: back button (left), header + description (center), close button (right).
 */

import { ChevronLeftIcon, CircleSkipIcon } from '../shared/Icons';
import { useAppStore } from '../../stores/useAppStore';

export default function HelperTopBar({ canGoBack, onBack, onClose }) {
  const glassEffect = useAppStore((s) => s.preferences?.glassEffect ?? true);
  return (
    <div
      className="flex items-start justify-between px-5 pb-0"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
        background: glassEffect
          ? 'color-mix(in srgb, var(--bg-primary) 60%, transparent)'
          : 'var(--bg-primary)',
        backdropFilter: glassEffect ? 'blur(24px)' : 'none',
        WebkitBackdropFilter: glassEffect ? 'blur(24px)' : 'none',
      }}
    >
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

      {/* Center: header only */}
      <div className="flex-1 text-center px-2" style={{ marginTop: '3px' }}>
        <h2
          className="text-3xl"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none', color: 'var(--color-text-primary)', lineHeight: 1, margin: 0, marginTop: '14px', marginBottom: '8px' }}
        >
          What&rsquo;s happening?
        </h2>
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

/**
 * EmergencyContactPopup
 * Centered modal overlay shown when the user taps the Emergency Contact card
 * inside the helper modal's emergency flow. Offers two reach-out options:
 * Call (tel:) and Text (sms:). Both URL schemes work natively across iOS,
 * Android, and desktop browsers (which prompt for a handler).
 *
 * Renders above HelperModal (z-50) at z-[60].
 */

import { useEffect } from 'react';
import { PhoneIcon } from '../shared/Icons';

export default function EmergencyContactPopup({ name, phone, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const displayName = name || 'Emergency Contact';
  const buttonNameSuffix = name ? ` ${name}` : '';

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] animate-fadeIn px-6"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-sm p-6 animate-slideDown"
        role="dialog"
        aria-modal="true"
        aria-label={`Contact ${displayName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Contact {displayName}
        </h3>
        <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--color-text-secondary)' }}>
          How would you like to reach them?
        </p>

        <div className="space-y-3">
          <a
            href={`tel:${phone}`}
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3 border uppercase tracking-wider text-[11px] transition-colors"
            style={{
              borderColor: 'var(--accent)',
              backgroundColor: 'var(--accent-bg)',
              color: 'var(--color-text-primary)',
            }}
          >
            <PhoneIcon size={14} />
            <span>Call{buttonNameSuffix}</span>
          </a>
          <a
            href={`sms:${phone}`}
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3 border uppercase tracking-wider text-[11px] transition-colors"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            <span>Text{buttonNameSuffix}</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs underline"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

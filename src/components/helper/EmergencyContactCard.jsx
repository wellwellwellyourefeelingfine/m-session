/**
 * EmergencyContactCard
 * Shared bordered card displaying the user's saved emergency contact:
 *   - Name and phone joined as "Name — Phone" (or whichever piece exists)
 *   - Two side-by-side accent buttons: Call (tel:) and Text (sms:)
 *   - Optional Edit/Save toggle in the top-right corner (when an
 *     `onEditToggle` callback is provided by the parent)
 *
 * Used by:
 *   - EmergencyFlow (rating 9–10 result inside the helper modal) — uses
 *     defaults: shows the "Emergency Contact" label, no edit toggle.
 *   - EmergencyContactView (the dedicated contact page reachable from the
 *     wide card on the helper modal's initial step) — passes `hideLabel`
 *     because there's a category-style header above the card, and passes
 *     the `isEditing`/`onEditToggle` props so the toggle renders inside.
 *
 * Pure presentational — no store reads, no state. Tailwind's `no-underline`
 * class plus inline `textDecoration: 'none'` are applied to the Call/Text
 * anchors to override the global `a` underline rule in src/index.css.
 */

import { PhoneIcon, MessageIcon } from '../shared/Icons';

export default function EmergencyContactCard({
  emergencyContact,
  hideLabel = false,
  isEditing,
  onEditToggle,
}) {
  const contactName = emergencyContact?.name?.trim() || '';
  const contactPhone = emergencyContact?.phone?.trim() || '';
  const hasContact = Boolean(contactName || contactPhone);
  const hasPhone = Boolean(contactPhone);

  // Format: "Name — Phone" when both are present, otherwise whichever exists.
  const displayLine = [contactName, contactPhone].filter(Boolean).join(' — ');

  // Button labels include the contact's name when present, falling back to
  // the bare action verb otherwise.
  const callLabel = contactName ? `Call ${contactName}` : 'Call';
  const textLabel = contactName ? `Text ${contactName}` : 'Text';

  const showEditToggle = typeof onEditToggle === 'function';

  // When the edit toggle is present, push in-flow content away from the
  // top-right corner so the absolute toggle doesn't visually collide.
  const editPadRight = showEditToggle ? '48px' : undefined;

  return (
    <div
      className="relative border p-3 space-y-2"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {showEditToggle && (
        <button
          type="button"
          onClick={onEditToggle}
          className="absolute uppercase tracking-wider transition-colors"
          style={{
            top: '8px',
            right: '12px',
            fontSize: '10px',
            color: isEditing ? 'var(--accent)' : 'var(--color-text-tertiary)',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          {isEditing ? 'Save' : 'Edit'}
        </button>
      )}

      {!hideLabel && (
        <p
          className="text-[9px] uppercase tracking-wider text-left"
          style={{
            color: 'var(--color-text-tertiary)',
            paddingRight: editPadRight,
          }}
        >
          Emergency Contact
        </p>
      )}

      {hasContact && (
        <p
          className="text-xs text-left"
          style={{
            color: 'var(--color-text-primary)',
            // Only the FIRST in-flow row needs to clear the absolute toggle.
            // When the label is shown, it takes that role; otherwise it's
            // the display line.
            paddingRight: hideLabel ? editPadRight : undefined,
          }}
        >
          {displayLine}
        </p>
      )}

      {hasPhone ? (
        <div className="flex gap-2">
          <a
            href={`tel:${contactPhone}`}
            className="no-underline flex-1 flex items-center justify-center gap-2 px-3 py-2 border text-[11px] uppercase tracking-wider transition-colors"
            style={{
              borderColor: 'var(--accent)',
              backgroundColor: 'var(--accent-bg)',
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
            }}
          >
            <PhoneIcon size={14} />
            <span>{callLabel}</span>
          </a>
          <a
            href={`sms:${contactPhone}`}
            className="no-underline flex-1 flex items-center justify-center gap-2 px-3 py-2 border text-[11px] uppercase tracking-wider transition-colors"
            style={{
              borderColor: 'var(--accent)',
              backgroundColor: 'var(--accent-bg)',
              color: 'var(--color-text-primary)',
              textDecoration: 'none',
            }}
          >
            <MessageIcon size={14} />
            <span>{textLabel}</span>
          </a>
        </div>
      ) : hasContact ? (
        <p
          className="text-[10px] text-left"
          style={{
            color: 'var(--color-text-tertiary)',
            paddingRight: hideLabel && !hasContact ? editPadRight : undefined,
          }}
        >
          No phone number saved
        </p>
      ) : (
        <p
          className="text-xs text-left"
          style={{
            color: 'var(--color-text-secondary)',
            paddingRight: hideLabel ? editPadRight : undefined,
          }}
        >
          No emergency contact saved
        </p>
      )}
    </div>
  );
}

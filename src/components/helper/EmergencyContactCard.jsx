/**
 * EmergencyContactCard
 * Shared bordered card displaying the user's saved emergency contact:
 *   - Name and phone joined as "Name — Phone" (or whichever piece exists)
 *   - Two side-by-side accent buttons: Call (tel:) and Text (sms:)
 *   - Optional Edit/Save toggle in the top-right corner (when an
 *     `onEditToggle` callback is provided by the parent)
 *
 * The phone number value is also a tap target: tapping it copies the
 * number to the user's clipboard and briefly swaps the displayed value
 * to "Copied" so the user knows the action succeeded. Useful when the
 * user wants to paste the number into their phone manually instead of
 * using the Call/Text shortcut buttons.
 *
 * Used by:
 *   - EmergencyFlow (rating 9–10 result inside the helper modal) — uses
 *     defaults: shows the "Emergency Contact" label, no edit toggle.
 *   - EmergencyContactView (the dedicated contact page reachable from the
 *     wide card on the helper modal's initial step) — passes `hideLabel`
 *     because there's a category-style header above the card, and passes
 *     the `isEditing`/`onEditToggle` props so the toggle renders inside.
 *
 * Tailwind's `no-underline` class plus inline `textDecoration: 'none'` are
 * applied to the Call/Text anchors to override the global `a` underline
 * rule in src/index.css.
 */

import { useState, useEffect, useRef } from 'react';
import { PhoneIcon, MessageIcon } from '../shared/Icons';

const COPIED_FEEDBACK_MS = 1500;

export default function EmergencyContactCard({
  emergencyContact,
  hideLabel = false,
  isEditing,
  onEditToggle,
  // Optional callback fired when the user taps a Call or Text button.
  // The argument is a short label describing the action ("Call <name>" /
  // "Text <name>"), suitable for use in a journal entry. Fired BEFORE the
  // browser navigates to the tel:/sms: link, so it always runs.
  onContactAction,
}) {
  const contactName = emergencyContact?.name?.trim() || '';
  const contactPhone = emergencyContact?.phone?.trim() || '';
  const hasName = Boolean(contactName);
  const hasPhone = Boolean(contactPhone);
  const hasContact = hasName || hasPhone;

  // Tap-to-copy state for the phone number. When the user taps the number,
  // we write it to the clipboard and flip `copied` to true for ~1.5s, which
  // swaps the displayed value to "Copied" so the user gets visual feedback.
  // The timeout ref lets us clear a pending revert if the user re-taps before
  // the first feedback expires.
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopyPhone = async () => {
    if (!contactPhone) return;
    try {
      // Modern path. Falls back gracefully on browsers without async clipboard
      // API by attempting the legacy execCommand approach.
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(contactPhone);
      } else {
        // Legacy fallback. Creates a temporary input, selects the text, and
        // executes a copy command. Used in older browsers and some embedded
        // webviews where the async clipboard API isn't available.
        const tmp = document.createElement('input');
        tmp.value = contactPhone;
        tmp.setAttribute('readonly', '');
        tmp.style.position = 'absolute';
        tmp.style.left = '-9999px';
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        document.body.removeChild(tmp);
      }
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      setCopied(true);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // Silently no-op on failure. The user still has the Call/Text buttons
      // and can read the number visually if clipboard access is denied.
    }
  };

  // Button labels include only the contact's FIRST name when present, so a
  // saved contact like "Joe Dirt" produces "Call Joe" / "Text Joe". Splits
  // on the first whitespace and takes the leading segment. Falls back to
  // the bare action verb when no name is saved.
  const firstName = contactName ? contactName.split(/\s+/)[0] : '';
  const callLabel = firstName ? `Call ${firstName}` : 'Call';
  const textLabel = firstName ? `Text ${firstName}` : 'Text';

  const showEditToggle = typeof onEditToggle === 'function';

  // When the edit toggle is present, push the FIRST in-flow row away from
  // the top-right corner so the absolute toggle doesn't visually collide.
  // The "first row" is whichever element renders first inside the box: the
  // optional gray label, otherwise the NAME row, otherwise the NUMBER row,
  // otherwise the empty-state fallback.
  const editPadRight = showEditToggle ? '48px' : undefined;
  const firstRow = !hideLabel
    ? 'label'
    : hasName
      ? 'name'
      : hasPhone
        ? 'number'
        : 'empty';

  // Shared styles for the gray "NAME:" / "NUMBER:" labels — match the
  // labels above the editable inputs in EmergencyContactView.
  const fieldLabelClass = 'text-[10px] uppercase tracking-wider';
  const fieldLabelStyle = { color: 'var(--color-text-tertiary)' };

  // Shared styles for the value text — DM Serif Text, medium.
  const fieldValueClass = 'text-[17px] leading-tight m-0';
  const fieldValueStyle = {
    fontFamily: "'DM Serif Text', serif",
    textTransform: 'none',
    color: 'var(--color-text-primary)',
  };

  return (
    <div
      className="relative border rounded-md p-3 space-y-2"
      style={{
        borderColor: 'var(--color-border)',
        // When the edit toggle is present (EmergencyContactView), bump the
        // top padding so the small absolute "Edit" pill in the top-right
        // corner has clearance from the name + number row beneath it.
        // Other consumers (EmergencyFlow) leave the toggle off and keep
        // the standard p-3.
        ...(showEditToggle ? { paddingTop: '30px' } : null),
      }}
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

      {(hasName || hasPhone) && (
        // Name on the left, number on the right via justify-between. The
        // groups try to fit on a single line, but if a long name + long
        // number can't both fit horizontally, flex-wrap drops the number
        // group to a second line. Each inner group uses `whitespace-nowrap`
        // so labels and values stay together as a single unbreakable unit
        // — only the wrap point BETWEEN the groups is allowed to break.
        // gap-y-0 + leading-tight on the value text keeps the wrapped
        // fallback as tight as possible (no explicit row gap; the small
        // residual space comes from the line-box descender of the 17px
        // serif text only).
        //
        // The 16px right padding gives the right-aligned number a small
        // visual inset from the card's right edge by default. As the name
        // grows longer, the available width shrinks accordingly, so the
        // wrap point arrives 16px earlier than it would without the inset.
        // The effect: the number "feels" pushed inward when there's room,
        // and the wrap kicks in naturally as the name encroaches — exactly
        // the behavior of a margin that compresses with the layout.
        <div
          className="flex items-baseline justify-between gap-x-3 gap-y-0 flex-wrap"
          style={hasName && hasPhone ? { paddingRight: '16px' } : undefined}
        >
          {hasName && (
            <div className="flex items-baseline gap-1 whitespace-nowrap min-w-0">
              <p className={fieldLabelClass} style={fieldLabelStyle}>
                Name:
              </p>
              <p className={fieldValueClass} style={fieldValueStyle}>
                {contactName}
              </p>
            </div>
          )}

          {hasPhone && (
            <div className="flex items-baseline gap-1 whitespace-nowrap min-w-0">
              <p className={fieldLabelClass} style={fieldLabelStyle}>
                Number:
              </p>
              {/* Tap-to-copy button. The displayed text swaps to "Copied"
                  for ~1.5s after the user taps, providing inline feedback
                  without an extra toast or popover. The button uses
                  transparent background + border + zero padding so it
                  visually reads as plain text — only the cursor change
                  hints at interactivity until tapped. */}
              <button
                type="button"
                onClick={handleCopyPhone}
                aria-label={copied ? 'Number copied to clipboard' : 'Copy number to clipboard'}
                className={`${fieldValueClass} transition-opacity`}
                style={{
                  ...fieldValueStyle,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  // When copied, fade slightly so the swap is visible even
                  // for users who barely glance at the text.
                  color: copied ? 'var(--accent)' : fieldValueStyle.color,
                }}
              >
                {copied ? 'Copied' : contactPhone}
              </button>
            </div>
          )}
        </div>
      )}

      {hasName && !hasPhone && (
        <p
          className="text-[10px] text-left"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          No phone number saved
        </p>
      )}

      {!hasContact && (
        <p
          className="text-xs text-left"
          style={{
            color: 'var(--color-text-secondary)',
            paddingRight: firstRow === 'empty' ? editPadRight : undefined,
          }}
        >
          No emergency contact saved
        </p>
      )}

      {hasPhone && (
        // The visible gap above the buttons isn't margin — it's two invisible
        // layers stacked together: (1) the 17px serif text above uses
        // `leading-tight` which leaves ~4px of line-box descender space below
        // the baseline of the visible glyphs, and (2) each button has `py-2`
        // (8px top padding) before its `items-center`-vertically-centered
        // icon+text. To pull the visible button text closer to the visible
        // field text without clipping descenders or making the buttons feel
        // cramped, we use a negative top margin to overlap into the unused
        // leading space above. -6px collapses the visible gap to roughly 6px,
        // which feels tight without touching either side.
        <div className="flex gap-2" style={{ marginTop: '-14px' }}>
          <a
            href={`tel:${contactPhone}`}
            onClick={() => onContactAction && onContactAction(callLabel)}
            className="no-underline flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-md text-[11px] uppercase tracking-wider transition-colors"
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
            onClick={() => onContactAction && onContactAction(textLabel)}
            className="no-underline flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-md text-[11px] uppercase tracking-wider transition-colors"
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
      )}
    </div>
  );
}

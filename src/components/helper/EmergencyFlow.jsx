/**
 * EmergencyFlow
 * Compact emergency support content rendered inline beneath the rating scale
 * when the user selects a rating of 9 or 10. Designed to fit within the
 * expanded modal alongside the CategoryHeader, prompt, and rating scale.
 *
 * Sections (top to bottom):
 *   1. Reassurance text (agnostic, trusts the user's judgment)
 *   2. Emergency contact card with split Call / Text actions when a phone is saved
 *      (from intake.responses.emergencyContactDetails)
 *   3. Emergency services row (911 / 112)
 *   4. Fireside Project card (psychedelic peer support — call or text)
 */

import { PhoneIcon, MessageIcon } from '../shared/Icons';

export default function EmergencyFlow({ emergencyContact }) {
  const contactName = emergencyContact?.name?.trim() || '';
  const contactPhone = emergencyContact?.phone?.trim() || '';
  const hasContact = Boolean(contactName || contactPhone);
  const hasPhone = Boolean(contactPhone);
  // The Call/Text labels include the contact's name when present, and fall back
  // to the action verb on its own otherwise.
  const callLabel = contactName ? `Call ${contactName}` : 'Call';
  const textLabel = contactName ? `Text ${contactName}` : 'Text';

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Reassurance — agnostic, direct */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        If something feels serious right now, trust that. The options below are here for you. Pick whichever feels most useful.
      </p>

      {/* Emergency contact card — split Call / Text actions when a phone is saved */}
      <div className="border p-3 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
        <p
          className="text-[9px] uppercase tracking-wider text-left"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Emergency Contact
        </p>
        {hasContact && contactName && (
          <p className="text-xs text-left" style={{ color: 'var(--color-text-primary)' }}>
            {contactName}
          </p>
        )}
        {hasPhone ? (
          <div className="flex gap-2">
            <a
              href={`tel:${contactPhone}`}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border text-[11px] uppercase tracking-wider transition-colors"
              style={{
                borderColor: 'var(--accent)',
                backgroundColor: 'var(--accent-bg)',
                color: 'var(--color-text-primary)',
              }}
            >
              <PhoneIcon size={14} />
              <span>{callLabel}</span>
            </a>
            <a
              href={`sms:${contactPhone}`}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border text-[11px] uppercase tracking-wider transition-colors"
              style={{
                borderColor: 'var(--accent)',
                backgroundColor: 'var(--accent-bg)',
                color: 'var(--color-text-primary)',
              }}
            >
              <MessageIcon size={14} />
              <span>{textLabel}</span>
            </a>
          </div>
        ) : hasContact ? (
          <p className="text-[10px] text-left" style={{ color: 'var(--color-text-tertiary)' }}>
            No phone number saved
          </p>
        ) : (
          <p className="text-xs text-left" style={{ color: 'var(--color-text-secondary)' }}>
            No emergency contact saved
          </p>
        )}
      </div>

      {/* Emergency services — compact two-button row */}
      <div className="border p-3 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          Emergency Services
        </p>
        <div className="flex gap-2">
          <a
            href="tel:911"
            className="flex-1 px-3 py-2 border text-center text-[11px] uppercase tracking-wider transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            Call 911 (US)
          </a>
          <a
            href="tel:112"
            className="flex-1 px-3 py-2 border text-center text-[11px] uppercase tracking-wider transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            Call 112 (EU)
          </a>
        </div>
      </div>

      {/* Fireside Project — psychedelic peer support */}
      <div className="border p-3 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          Fireside Project &mdash; Psychedelic Peer Support
        </p>
        <div className="flex gap-2">
          <a
            href="tel:62347373433"
            className="flex-1 px-3 py-2 border text-center text-[11px] uppercase tracking-wider transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            Call
          </a>
          <a
            href="sms:62373&body=FIRESIDE"
            className="flex-1 px-3 py-2 border text-center text-[11px] uppercase tracking-wider transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            Text
          </a>
        </div>
      </div>

    </div>
  );
}

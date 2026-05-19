/**
 * EmergencyFlow
 * Compact emergency support content rendered inline beneath the rating scale
 * when the user selects a rating of 9 or 10. Designed to fit within the
 * expanded modal alongside the CategoryHeader, prompt, and rating scale.
 *
 * Sections (top to bottom):
 *   1. Reassurance text (agnostic, trusts the user's judgment)
 *   2. EmergencyContactCard — shared with EmergencyContactView, shows the
 *      user's saved contact with Name — Phone display and Call/Text buttons.
 *      Suppressed when `hideContactCard` is true (used by EmergencyContactView,
 *      which already shows the contact card at the top of its own page).
 *   3. Emergency services row (911 / 112)
 *   4. Fireside Project card (psychedelic peer support — call or text)
 *
 * The optional `onAction` callback is fired BEFORE the browser navigates to
 * any tel:/sms: link, so the parent can write a journal entry capturing the
 * action. Signature: (label, actionType). `label` is a short human-readable
 * string (may contain the user's contact name — journal use only, NOT safe
 * for analytics). `actionType` is a stable categorical enum:
 * 'saved-contact-call' | 'saved-contact-text' | 'emergency-services-911' |
 * 'emergency-services-112' | 'fireside-call' | 'fireside-text'. Fired for
 * every actionable button.
 */

import EmergencyContactCard from './EmergencyContactCard';

export default function EmergencyFlow({ emergencyContact, onAction, hideContactCard = false }) {
  const reportAction = (label, actionType) => {
    if (typeof onAction === 'function') onAction(label, actionType);
  };

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Reassurance — agnostic, direct */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        If something feels serious right now, trust that. The options below are here for you. Pick whichever feels most useful.
      </p>

      {/* User's saved emergency contact (shared card). Hidden by callers
          that already display the contact card elsewhere on the page. */}
      {!hideContactCard && (
        <EmergencyContactCard
          emergencyContact={emergencyContact}
          onContactAction={reportAction}
        />
      )}

      {/* Emergency services — compact two-button row */}
      <div className="border rounded-md p-3 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          Emergency Services
        </p>
        <div className="flex gap-2">
          <a
            href="tel:911"
            onClick={() => reportAction('Call 911 (US)', 'emergency-services-911')}
            className="no-underline flex-1 px-3 py-2 border rounded-md text-center text-[11px] uppercase tracking-wider transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
          >
            Call 911 (US)
          </a>
          <a
            href="tel:112"
            onClick={() => reportAction('Call 112 (EU)', 'emergency-services-112')}
            className="no-underline flex-1 px-3 py-2 border rounded-md text-center text-[11px] uppercase tracking-wider transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
          >
            Call 112 (EU)
          </a>
        </div>
      </div>

      {/* Fireside Project — psychedelic peer support */}
      <div className="border rounded-md p-3 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          Fireside Project &mdash; Psychedelic Peer Support
        </p>
        <div className="flex gap-2">
          <a
            href="tel:62347373433"
            onClick={() => reportAction('Call Fireside Project', 'fireside-call')}
            className="no-underline flex-1 px-3 py-2 border rounded-md text-center text-[11px] uppercase tracking-wider transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
          >
            Call
          </a>
          <a
            href="sms:62373&body=FIRESIDE"
            onClick={() => reportAction('Text Fireside Project', 'fireside-text')}
            className="no-underline flex-1 px-3 py-2 border rounded-md text-center text-[11px] uppercase tracking-wider transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
          >
            Text
          </a>
        </div>
      </div>

    </div>
  );
}

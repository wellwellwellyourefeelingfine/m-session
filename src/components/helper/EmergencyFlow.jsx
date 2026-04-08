/**
 * EmergencyFlow
 * Compact emergency support content rendered inline beneath the rating scale
 * when the user selects a rating of 9 or 10. Designed to fit within the
 * expanded modal alongside the CategoryHeader, prompt, and rating scale.
 *
 * Sections (top to bottom):
 *   1. Reassurance text (agnostic, trusts the user's judgment)
 *   2. EmergencyContactCard — shared with EmergencyContactView, shows the
 *      user's saved contact with Name — Phone display and Call/Text buttons
 *   3. Emergency services row (911 / 112)
 *   4. Fireside Project card (psychedelic peer support — call or text)
 */

import EmergencyContactCard from './EmergencyContactCard';

export default function EmergencyFlow({ emergencyContact }) {
  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Reassurance — agnostic, direct */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        If something feels serious right now, trust that. The options below are here for you. Pick whichever feels most useful.
      </p>

      {/* User's saved emergency contact (shared card) */}
      <EmergencyContactCard emergencyContact={emergencyContact} />

      {/* Emergency services — compact two-button row */}
      <div className="border p-3 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-[9px] uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          Emergency Services
        </p>
        <div className="flex gap-2">
          <a
            href="tel:911"
            className="no-underline flex-1 px-3 py-2 border text-center text-[11px] uppercase tracking-wider transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
          >
            Call 911 (US)
          </a>
          <a
            href="tel:112"
            className="no-underline flex-1 px-3 py-2 border text-center text-[11px] uppercase tracking-wider transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
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
            className="no-underline flex-1 px-3 py-2 border text-center text-[11px] uppercase tracking-wider transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
          >
            Call
          </a>
          <a
            href="sms:62373&body=FIRESIDE"
            className="no-underline flex-1 px-3 py-2 border text-center text-[11px] uppercase tracking-wider transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
          >
            Text
          </a>
        </div>
      </div>

    </div>
  );
}

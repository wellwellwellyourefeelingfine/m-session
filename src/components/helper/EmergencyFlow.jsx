/**
 * EmergencyFlow
 * Compact emergency support content rendered inline beneath the rating scale
 * when the user selects a rating of 9 or 10. Designed to fit within the
 * expanded modal alongside the CategoryHeader, prompt, and rating scale.
 *
 * Sections (top to bottom):
 *   1. Reassurance text (agnostic, trusts the user's judgment)
 *   2. Emergency contact card (from intake.responses.emergencyContactDetails)
 *   3. Emergency services row (911 / 112)
 *   4. Fireside Project card (psychedelic peer support — call or text)
 */

import { useState } from 'react';
import { PhoneIcon } from '../shared/Icons';
import EmergencyContactPopup from './EmergencyContactPopup';

export default function EmergencyFlow({ emergencyContact }) {
  const [showPopup, setShowPopup] = useState(false);

  const hasContact = emergencyContact?.name || emergencyContact?.phone;
  const hasPhone = Boolean(emergencyContact?.phone);

  // Inner card content shared between the tappable button and the read-only div fallback
  const renderCardContents = () => (
    <>
      <p
        className="text-[9px] uppercase tracking-wider text-left"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        Emergency Contact
      </p>
      {hasContact ? (
        <>
          {emergencyContact.name && (
            <p className="text-xs text-left" style={{ color: 'var(--color-text-primary)' }}>
              {emergencyContact.name}
            </p>
          )}
          {hasPhone ? (
            <div
              className="flex items-center gap-2 w-full px-3 py-2 border text-center justify-center"
              style={{
                borderColor: 'var(--accent)',
                backgroundColor: 'var(--accent-bg)',
                color: 'var(--color-text-primary)',
              }}
            >
              <PhoneIcon size={14} />
              <span className="text-[11px] uppercase tracking-wider">
                Call {emergencyContact.name || 'Emergency Contact'}
              </span>
            </div>
          ) : (
            <p className="text-[10px] text-left" style={{ color: 'var(--color-text-tertiary)' }}>
              No phone number saved
            </p>
          )}
        </>
      ) : (
        <p className="text-xs text-left" style={{ color: 'var(--color-text-secondary)' }}>
          Call your emergency contact
        </p>
      )}
    </>
  );

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Reassurance — agnostic, direct */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        If something feels serious right now, trust that. The options below are here for you &mdash; pick whichever feels most useful.
      </p>

      {/* Emergency contact card — tappable when a phone number is saved */}
      {hasPhone ? (
        <button
          type="button"
          onClick={() => setShowPopup(true)}
          className="w-full border p-3 space-y-2 transition-opacity hover:opacity-80"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {renderCardContents()}
        </button>
      ) : (
        <div className="border p-3 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
          {renderCardContents()}
        </div>
      )}

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

      {showPopup && (
        <EmergencyContactPopup
          name={emergencyContact?.name || ''}
          phone={emergencyContact?.phone || ''}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
}

/**
 * EmergencyFlow
 * Emergency support: reassurance, contact card, emergency services, grounding fallback.
 */

import { PhoneIcon } from '../shared/Icons';

export default function EmergencyFlow({ emergencyContact, onGroundingFallback }) {
  const hasContact = emergencyContact?.name || emergencyContact?.phone;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Reassurance */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        You&rsquo;re going through something really difficult right now. Let&rsquo;s make sure you have the support you need.
      </p>

      {/* Emergency contact card */}
      <div className="border p-4 space-y-3" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          Emergency Contact
        </p>
        {hasContact ? (
          <>
            {emergencyContact.name && (
              <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {emergencyContact.name}
              </p>
            )}
            {emergencyContact.phone ? (
              <a
                href={`tel:${emergencyContact.phone}`}
                className="flex items-center gap-2 w-full px-4 py-3 border text-center justify-center transition-colors"
                style={{
                  borderColor: 'var(--accent)',
                  backgroundColor: 'var(--accent-bg)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <PhoneIcon size={16} />
                <span className="text-xs uppercase tracking-wider">
                  Call {emergencyContact.name || 'Emergency Contact'}
                </span>
              </a>
            ) : (
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                No phone number saved
              </p>
            )}
          </>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Call your emergency contact
          </p>
        )}
      </div>

      {/* Emergency services */}
      <div className="border p-4 space-y-3" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          Emergency Services
        </p>
        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
          If you&rsquo;re in immediate danger or experiencing a medical emergency
        </p>
        <div className="flex gap-2">
          <a
            href="tel:911"
            className="flex-1 px-4 py-3 border text-center text-xs uppercase tracking-wider transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            Call 911 (US)
          </a>
          <a
            href="tel:112"
            className="flex-1 px-4 py-3 border text-center text-xs uppercase tracking-wider transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            Call 112 (EU)
          </a>
        </div>
      </div>

      {/* Grounding fallback */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onGroundingFallback}
          className="text-xs uppercase tracking-wider underline"
          style={{ color: 'var(--accent)' }}
        >
          I want to try grounding first
        </button>
      </div>
    </div>
  );
}

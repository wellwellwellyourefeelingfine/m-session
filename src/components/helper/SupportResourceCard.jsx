/**
 * SupportResourceCard
 * Renders a single support resource card within follow-up triage results.
 * Three visual variants based on `resource.type`:
 *
 *   - 'fireside'          — Fireside Project with Call/Text buttons
 *   - 'emergency-contact' — Saved emergency contact with Call/Text (or fallback copy)
 *   - 'find-therapist'    — Advisory card, no action buttons
 *
 * Action buttons fire `onAction(label)` BEFORE navigating via tel:/sms: links,
 * following the same pattern as EmergencyContactCard and EmergencyFlow.
 */

import { PhoneIcon, MessageIcon } from '../shared/Icons';

export default function SupportResourceCard({ resource, emergencyContact, onAction }) {
  const reportAction = (label) => {
    if (typeof onAction === 'function') onAction(label);
  };

  if (resource.type === 'fireside') {
    return (
      <div className="border rounded-lg p-4 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Talk to someone who gets it
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          The Fireside Project offers free, confidential support for people integrating psychedelic experiences. They're not therapists, but they're trained listeners. Available daily 11am–11pm PT.
        </p>
        <div className="flex gap-2 pt-1">
          <a
            href="tel:+16234737433"
            onClick={() => reportAction('Call Fireside Project')}
            className="no-underline flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border rounded-md text-[11px] uppercase tracking-wider transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
          >
            <PhoneIcon size={12} />
            Call Fireside
          </a>
          <a
            href="sms:+16234737433"
            onClick={() => reportAction('Text Fireside Project')}
            className="no-underline flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border rounded-md text-[11px] uppercase tracking-wider transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
          >
            <MessageIcon size={12} />
            Text Fireside
          </a>
        </div>
      </div>
    );
  }

  if (resource.type === 'emergency-contact') {
    const contactName = emergencyContact?.name?.trim() || '';
    const contactPhone = emergencyContact?.phone?.trim() || '';
    const hasContact = Boolean(contactName || contactPhone);
    const firstName = contactName.split(/\s+/)[0] || '';

    return (
      <div className="border rounded-lg p-4 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Reach out to someone you trust
        </p>
        {hasContact ? (
          <>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Sometimes just talking about what you experienced is the most helpful thing you can do. Your emergency contact already knows about your session.
            </p>
            {contactPhone && (
              <div className="flex gap-2 pt-1">
                <a
                  href={`tel:${contactPhone}`}
                  onClick={() => reportAction(`Call ${contactName || 'Emergency Contact'}`)}
                  className="no-underline flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border rounded-md text-[11px] uppercase tracking-wider transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
                >
                  <PhoneIcon size={12} />
                  {firstName ? `Call ${firstName}` : 'Call'}
                </a>
                <a
                  href={`sms:${contactPhone}`}
                  onClick={() => reportAction(`Text ${contactName || 'Emergency Contact'}`)}
                  className="no-underline flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border rounded-md text-[11px] uppercase tracking-wider transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)', textDecoration: 'none' }}
                >
                  <MessageIcon size={12} />
                  {firstName ? `Text ${firstName}` : 'Text'}
                </a>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Call someone you trust — a friend, partner, or family member who knows what you've been doing.
          </p>
        )}
      </div>
    );
  }

  if (resource.type === 'find-therapist') {
    return (
      <div className="border rounded-lg p-4 space-y-2" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Consider professional support
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          An integration therapist can help you make sense of what came up. Look for someone experienced with psychedelic integration, EMDR, IFS, or somatic work.
        </p>
      </div>
    );
  }

  return null;
}

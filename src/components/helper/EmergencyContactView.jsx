/**
 * EmergencyContactView
 * Page-level view inside the Helper Modal for viewing and editing the user's
 * emergency contact details (name + phone). Reachable via the wide emergency
 * contact card at the bottom of the CategoryGrid on the initial step.
 *
 * Reads from / writes to `intake.responses.emergencyContactDetails` in
 * useSessionStore — the same field captured during intake's `contact-input`
 * question and consumed by EmergencyFlow during a 9–10 rating.
 *
 * Save model: edits auto-persist on blur, so accidental modal dismissal never
 * costs unsaved work. The explicit button is an Undo affordance — it reverts
 * both inputs and the store back to the snapshot taken when this view mounted.
 */

import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { PhoneIcon } from '../shared/Icons';

export default function EmergencyContactView() {
  const emergencyContactDetails = useSessionStore(
    (state) => state.intake?.responses?.emergencyContactDetails
  );
  const updateIntakeResponse = useSessionStore((state) => state.updateIntakeResponse);

  // Snapshot of the saved values at the moment this view mounted.
  // Captured once via a lazy useState initializer so reverting always returns
  // to "what it was when I opened the modal", regardless of how many edits
  // have been auto-saved since. The setter is never called.
  const [initialValues] = useState(() => ({
    name: emergencyContactDetails?.name || '',
    phone: emergencyContactDetails?.phone || '',
  }));

  const [name, setName] = useState(initialValues.name);
  const [phone, setPhone] = useState(initialValues.phone);

  // Auto-save a single field. Reads the latest store state at call time so
  // back-to-back blurs from both fields can't clobber each other.
  const persistField = (field, rawValue) => {
    const trimmed = rawValue.trim();
    const current = useSessionStore.getState().intake?.responses?.emergencyContactDetails || { name: '', phone: '' };
    if ((current[field] || '') === trimmed) return;
    updateIntakeResponse('sectionD', 'emergencyContactDetails', {
      ...current,
      [field]: trimmed,
    });
  };

  const handleNameBlur = () => {
    const trimmed = name.trim();
    if (trimmed !== name) setName(trimmed);
    persistField('name', trimmed);
  };

  const handlePhoneBlur = () => {
    const trimmed = phone.trim();
    if (trimmed !== phone) setPhone(trimmed);
    persistField('phone', trimmed);
  };

  // Undo restores both inputs AND the store to the snapshot taken on mount.
  // We compare against the snapshot rather than against the current store state
  // so the button reflects "have I changed anything since opening this view?".
  const isChangedFromInitial =
    name !== initialValues.name ||
    phone !== initialValues.phone ||
    (emergencyContactDetails?.name || '') !== initialValues.name ||
    (emergencyContactDetails?.phone || '') !== initialValues.phone;

  const handleUndo = () => {
    if (!isChangedFromInitial) return;
    setName(initialValues.name);
    setPhone(initialValues.phone);
    updateIntakeResponse('sectionD', 'emergencyContactDetails', {
      name: initialValues.name,
      phone: initialValues.phone,
    });
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col items-center text-center" style={{ marginTop: '4px' }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          <PhoneIcon size={22} className="text-[var(--accent)]" />
        </div>
        <h3
          className="text-[20px] mt-3"
          style={{
            fontFamily: "'DM Serif Text', serif",
            textTransform: 'none',
            color: 'var(--color-text-primary)',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          Emergency Contact
        </h3>
        <p
          className="text-[10px] uppercase tracking-wider"
          style={{ color: 'var(--color-text-tertiary)', marginTop: '6px' }}
        >
          Someone you trust who can be reached if you need them
        </p>
      </div>

      {/* Editable form */}
      <div className="space-y-4">
        <div className="space-y-1">
          <label
            className="text-[10px] uppercase tracking-wider block"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            placeholder="Enter contact name"
            className="w-full px-4 py-3 border bg-transparent focus:outline-none transition-colors"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        <div className="space-y-1">
          <label
            className="text-[10px] uppercase tracking-wider block"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Phone Number
          </label>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={handlePhoneBlur}
            placeholder="Enter phone number"
            className="w-full px-4 py-3 border bg-transparent focus:outline-none transition-colors"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>
      </div>

      {/* Auto-save status + Undo affordance.
          Edits persist on blur, so the explicit button reverts the form and
          the store back to the snapshot taken when this view opened. */}
      <div className="space-y-2">
        <p
          className="text-[10px] uppercase tracking-wider text-center"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Changes save automatically
        </p>
        <button
          type="button"
          onClick={handleUndo}
          disabled={!isChangedFromInitial}
          className="w-full py-3 border uppercase tracking-wider text-[11px] transition-opacity"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
            backgroundColor: 'transparent',
            opacity: isChangedFromInitial ? 1 : 0.35,
            cursor: isChangedFromInitial ? 'pointer' : 'default',
          }}
        >
          Undo Changes
        </button>
      </div>
    </div>
  );
}

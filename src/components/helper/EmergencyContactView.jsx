/**
 * EmergencyContactView
 * Page-level view inside the Helper Modal for viewing, editing, and annotating
 * the user's emergency contact. Reachable via the wide emergency contact card
 * at the bottom of the CategoryGrid on the initial step.
 *
 * Layout (top to bottom):
 *   1. Wide CategoryHeader-style header — circular PhoneIcon escutcheon
 *      overhanging the top-left, "Emergency Contact" title and description
 *      inside a bordered box. Visually consistent with the per-category
 *      headers shown after a category is selected.
 *   2. EmergencyContactCard — flush beneath the header. Shows the saved
 *      contact with Name — Phone display and accent Call/Text buttons. The
 *      card itself hosts a small Edit/Save toggle in its top-right corner.
 *   3. (Edit mode only) Name + Phone inputs — fade in beneath the card when
 *      the toggle is in edit mode.
 *   4. Emergency Contact Notes textarea — always visible, always editable.
 *
 * Save model: ALL fields auto-persist on blur. The Edit/Save toggle just
 * controls whether the name/phone inputs are visible — it doesn't gate
 * persistence. Tapping Save also flushes any in-progress (unblurred) text
 * before collapsing the inputs, so a user who types and immediately taps
 * Save without blurring loses nothing.
 */

import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { PhoneIcon } from '../shared/Icons';
import EmergencyContactCard from './EmergencyContactCard';

// Header escutcheon dimensions — match CategoryHeader for visual continuity.
const CIRCLE_SIZE = 36;
const CIRCLE_OFFSET = -8;

const NOTES_PLACEHOLDER =
  'My contact is available from 9am to 9pm. They live at 123 Main St. If unavailable, contact Jane at 555-0100.';

export default function EmergencyContactView({ isEditing, onEditToggle }) {
  const emergencyContactDetails = useSessionStore(
    (state) => state.sessionProfile?.emergencyContactDetails
  ) || { name: '', phone: '', notes: '' };
  const updateSessionProfile = useSessionStore((state) => state.updateSessionProfile);

  // Local mirrors so onChange feels immediate. Auto-save on blur (and on
  // Save click) writes through to the store.
  const [name, setName] = useState(emergencyContactDetails.name || '');
  const [phone, setPhone] = useState(emergencyContactDetails.phone || '');
  const [notes, setNotes] = useState(emergencyContactDetails.notes || '');

  // Persist a single field, reading the latest store state at call time so
  // back-to-back blurs from different fields can't clobber each other.
  const persistField = (field, value) => {
    const current =
      useSessionStore.getState().sessionProfile?.emergencyContactDetails
      || { name: '', phone: '', notes: '' };
    if ((current[field] || '') === value) return;
    updateSessionProfile('emergencyContactDetails', {
      ...current,
      [field]: value,
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

  const handleNotesBlur = () => {
    const trimmed = notes.trim();
    if (trimmed !== notes) setNotes(trimmed);
    persistField('notes', trimmed);
  };

  // Edit/Save toggle handler.
  // Save: flush any pending unblurred name/phone edits in a single write,
  //       then collapse the inputs.
  // Edit: re-seed local inputs from the latest store values (in case notes
  //       was saved out-of-band) and expand.
  const handleEditToggle = () => {
    if (isEditing) {
      const trimmedName = name.trim();
      const trimmedPhone = phone.trim();
      const current =
        useSessionStore.getState().sessionProfile?.emergencyContactDetails
        || { name: '', phone: '', notes: '' };
      if (current.name !== trimmedName || current.phone !== trimmedPhone) {
        updateSessionProfile('emergencyContactDetails', {
          ...current,
          name: trimmedName,
          phone: trimmedPhone,
        });
      }
      if (trimmedName !== name) setName(trimmedName);
      if (trimmedPhone !== phone) setPhone(trimmedPhone);
      onEditToggle(false);
    } else {
      setName(emergencyContactDetails.name || '');
      setPhone(emergencyContactDetails.phone || '');
      onEditToggle(true);
    }
  };

  return (
    <div className="animate-fadeIn">
      {/* Header + card paired together with tight spacing so the card sits
          flush beneath the header. */}
      <div className="space-y-2" style={{ marginTop: '4px' }}>
        {/* Wide CategoryHeader-style header */}
        <div
          className="relative w-full border rounded-md flex flex-col items-start"
          style={{
            borderColor: 'var(--color-border)',
            padding: '8px 14px 12px 14px',
          }}
        >
          {/* Circular PhoneIcon escutcheon — overlaps top-left corner */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              width: CIRCLE_SIZE,
              height: CIRCLE_SIZE,
              top: CIRCLE_OFFSET,
              left: CIRCLE_OFFSET,
              borderRadius: '50%',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--bg-primary)',
              zIndex: 1,
            }}
          >
            <PhoneIcon size={26} className="text-[var(--accent)]" />
          </div>
          <p
            className="text-[18px] m-0"
            style={{
              fontFamily: "'DM Serif Text', serif",
              textTransform: 'none',
              lineHeight: 1.2,
              color: 'var(--color-text-primary)',
              paddingLeft: CIRCLE_SIZE + CIRCLE_OFFSET - 5,
            }}
          >
            Emergency Contact
          </p>
          <p
            className="text-[12px] leading-relaxed mt-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Someone you trust who can be reached if you need them
          </p>
        </div>

        {/* Saved contact card with Edit/Save toggle in its top-right corner */}
        <EmergencyContactCard
          emergencyContact={emergencyContactDetails}
          hideLabel
          isEditing={isEditing}
          onEditToggle={handleEditToggle}
        />
      </div>

      {/*
        Animated edit-mode inputs.

        Uses the CSS grid 1fr/0fr trick: when collapsed, the wrapper takes
        zero height (the notes box reflows up smoothly), and when expanded,
        the wrapper grows to its content's natural height (the notes box
        reflows down smoothly). Opacity transitions in parallel so the inputs
        fade in/out as they expand/collapse. Both transitions match the
        modal panel's height transition (350ms cubic-bezier) so all motion
        feels coherent.

        The inner pt-5 + outer mt-5 (on the notes box) symmetrically position
        the inputs 20px below the contact card and 20px above the notes box
        when expanded. When collapsed, only the notes box's mt-5 contributes,
        so the visible gap stays at 20px (not 40px).
      */}
      <div
        className="grid"
        style={{
          gridTemplateRows: isEditing ? '1fr' : '0fr',
          opacity: isEditing ? 1 : 0,
          transition:
            'grid-template-rows 350ms cubic-bezier(0.65, 0, 0.35, 1),' +
            ' opacity 350ms cubic-bezier(0.65, 0, 0.35, 1)',
        }}
        aria-hidden={!isEditing}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-4 pt-5">
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
                tabIndex={isEditing ? 0 : -1}
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
                tabIndex={isEditing ? 0 : -1}
                className="w-full px-4 py-3 border bg-transparent focus:outline-none transition-colors"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notes box — always visible, always editable, auto-saves on blur */}
      <div className="border p-3 space-y-2 mt-5" style={{ borderColor: 'var(--color-border)' }}>
        <p
          className="text-[9px] uppercase tracking-wider text-left"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Emergency Contact Notes
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          rows={5}
          placeholder={NOTES_PLACEHOLDER}
          className="w-full px-3 py-2 border bg-transparent focus:outline-none transition-colors text-xs leading-relaxed resize-none"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>
    </div>
  );
}

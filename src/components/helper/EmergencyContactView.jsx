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
 *   5. "I need more help" expand/collapse button — same pattern as the
 *      triage result step. Tapping it fades in the full EmergencyFlow
 *      (911 / 112 / Fireside Project) beneath the notes box. Tapping again
 *      fades it out.
 *
 * Save model: ALL fields auto-persist on blur. The Edit/Save toggle just
 * controls whether the name/phone inputs are visible — it doesn't gate
 * persistence. Tapping Save also flushes any in-progress (unblurred) text
 * before collapsing the inputs, so a user who types and immediately taps
 * Save without blurring loses nothing.
 */

import { useState, useEffect, useRef } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { PhoneIcon, CirclePlusIcon, CircleSkipIcon } from '../shared/Icons';
import EmergencyContactCard from './EmergencyContactCard';
import EmergencyFlow from './EmergencyFlow';

const FADE_DURATION_MS = 200;

// Header escutcheon dimensions — match CategoryHeader for visual continuity.
const CIRCLE_SIZE = 36;
const CIRCLE_OFFSET = -8;

const NOTES_PLACEHOLDER =
  'My contact is available from 9am to 9pm. They live at 123 Main St. If unavailable, contact Jane at 555-0100.';

export default function EmergencyContactView({
  isEditing,
  onEditToggle,
  onContactAction,
  onEmergencyExpandedChange,
}) {
  const emergencyContactDetails = useSessionStore(
    (state) => state.sessionProfile?.emergencyContactDetails
  ) || { name: '', phone: '', notes: '' };
  const updateSessionProfile = useSessionStore((state) => state.updateSessionProfile);

  // Local mirrors so onChange feels immediate. Auto-save on blur (and on
  // Save click) writes through to the store.
  const [name, setName] = useState(emergencyContactDetails.name || '');
  const [phone, setPhone] = useState(emergencyContactDetails.phone || '');
  const [notes, setNotes] = useState(emergencyContactDetails.notes || '');

  // "I need more help" expand/collapse — three states matching the triage
  // result step's pattern:
  //   'closed'  — button shows a plus icon, no emergency content rendered
  //   'open'    — button shows the close (CircleSkip) icon, EmergencyFlow
  //               mounts and runs animate-fadeIn
  //   'closing' — EmergencyFlow gets opacity 0 with a 200ms transition; once
  //               the timer fires, state moves to 'closed' and EmergencyFlow
  //               unmounts.
  const [emergencyState, setEmergencyState] = useState('closed');
  const emergencyRef = useRef(null);

  // Notes textarea ref + focus state. The save button is shown only while
  // the textarea is focused AND has content, and tapping it dismisses the
  // keyboard by blurring the textarea (which also flushes the auto-save).
  const notesRef = useRef(null);
  const [notesFocused, setNotesFocused] = useState(false);

  // When the user expands "I need more help", smooth-scroll the EmergencyFlow
  // wrapper into view using `block: 'end'` so the BOTTOM of the flow (the
  // Fireside Project card) lands at the bottom of the visible area. Same
  // pattern used by TriageResultStep.
  useEffect(() => {
    if (emergencyState !== 'open') return;
    const id = requestAnimationFrame(() => {
      if (emergencyRef.current) {
        emergencyRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [emergencyState]);

  // Notify the parent whenever the "I need more help" expansion flips
  // visible / hidden, so the modal can grow to its expanded height while
  // the EmergencyFlow is shown. We treat both 'open' and 'closing' as
  // expanded — collapsing the modal during the closing fade-out would
  // leave content visible inside a shrinking container, which looks janky.
  useEffect(() => {
    if (typeof onEmergencyExpandedChange !== 'function') return;
    const expanded = emergencyState === 'open' || emergencyState === 'closing';
    onEmergencyExpandedChange(expanded);
  }, [emergencyState, onEmergencyExpandedChange]);

  const handleNeedMoreHelpToggle = () => {
    if (emergencyState === 'closed') {
      setEmergencyState('open');
    } else if (emergencyState === 'open') {
      setEmergencyState('closing');
      setTimeout(() => setEmergencyState('closed'), FADE_DURATION_MS);
    }
    // 'closing' is a transient state — taps during the fade-out are ignored
  };

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

  const isExpanded = emergencyState === 'open' || emergencyState === 'closing';
  const isClosing = emergencyState === 'closing';

  return (
    <div className="animate-fadeIn">
      {/* Header + card paired together with tight spacing so the card sits
          flush beneath the header. The 8px top margin gives the circular
          PhoneIcon escutcheon (which overhangs the card by 8px) clearance
          to clear the modal's top bar after pt-0 tightened the parent
          scroll container — matching the same offset used in
          TriageStepRunner. */}
      <div className="space-y-2" style={{ marginTop: '8px' }}>
        {/* Wide CategoryHeader-style header */}
        <div
          className="relative w-full border rounded-md flex flex-col items-start"
          style={{
            borderColor: 'var(--color-border)',
            padding: '8px 14px 6px 14px',
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
            It&rsquo;s best practice to contact this person before your session
            and let them know you&rsquo;d like them available just in case.
            Ideally, it&rsquo;s someone who lives nearby.
          </p>
        </div>

        {/* Saved contact card with Edit/Save toggle in its top-right corner */}
        <EmergencyContactCard
          emergencyContact={emergencyContactDetails}
          hideLabel
          isEditing={isEditing}
          onEditToggle={handleEditToggle}
          onContactAction={onContactAction}
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
        // Use `inert` instead of `aria-hidden` because it ALSO blocks focus
        // (per the WAI-ARIA spec, hiding a focused descendant via aria-hidden
        // is an accessibility violation, which the browser warns about when
        // the user clicks the inner Save button to collapse the wrapper).
        // React 19 supports `inert` as a first-class prop.
        inert={!isEditing || undefined}
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
                autoComplete="off"
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
                autoComplete="off"
                tabIndex={isEditing ? 0 : -1}
                className="w-full px-4 py-3 border bg-transparent focus:outline-none transition-colors"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>

            {/* Secondary Save button — small pill beneath the phone input.
                Functionally identical to the Edit/Save toggle in the contact
                card's top-right corner; this is just a more discoverable
                second affordance after the user has finished typing. Sits
                inside the animated grid wrapper so it fades in/out with the
                inputs above it. */}
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={handleEditToggle}
                tabIndex={isEditing ? 0 : -1}
                className="px-5 py-1.5 text-[11px] uppercase tracking-wider transition-opacity"
                style={{
                  color: 'var(--accent)',
                  background: 'transparent',
                  border: '1px solid var(--accent)',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notes box — always visible, always editable, auto-saves on blur.
          When the textarea is focused AND has content, a small "Save"
          affordance fades in at the bottom-center of the box. Tapping it
          blurs the textarea, which dismisses the mobile keyboard and
          flushes the auto-save (handleNotesBlur). The note has technically
          been auto-saving on every keystroke's eventual blur, so this
          button is purely an affordance to let the user feel the save.

          mt-3 (12px) tightens the gap to the contact card above, matching
          the tighter rhythm used throughout the page. rounded-md matches
          the other bordered boxes in the modal. The asymmetric padding
          (12px top, 6px bottom) trims the unused white space below the
          textarea without affecting the visible header-to-textarea gap. */}
      <div
        className="relative border rounded-md space-y-2 mt-2"
        style={{
          borderColor: 'var(--color-border)',
          padding: '12px 12px 6px 12px',
        }}
      >
        <p
          className="text-[9px] uppercase tracking-wider text-left"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Emergency Contact Notes
        </p>
        <textarea
          ref={notesRef}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onFocus={() => setNotesFocused(true)}
          onBlur={() => {
            setNotesFocused(false);
            handleNotesBlur();
          }}
          rows={3}
          placeholder={NOTES_PLACEHOLDER}
          className="w-full px-3 py-2 border bg-transparent focus:outline-none transition-colors text-xs leading-relaxed resize-none"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        {/* Inline Save affordance — fades in when the textarea is focused
            and has content. Absolute-positioned over the bottom of the box
            so it doesn't shift the notes textarea layout. */}
        <button
          type="button"
          // onMouseDown fires BEFORE blur and is cancelable on every modern
          // browser, including iOS Safari which synthesizes mousedown events
          // for taps. We use it (instead of onClick) to call .blur() on the
          // textarea ourselves before the focus shift races the click. We
          // intentionally do NOT add onTouchStart because React attaches
          // touch events as passive listeners, which makes preventDefault
          // a no-op and triggers the "Unable to preventDefault inside passive
          // event listener invocation" warning.
          onMouseDown={(e) => {
            e.preventDefault();
            if (notesRef.current) notesRef.current.blur();
          }}
          aria-label="Save notes"
          className="absolute left-1/2 -translate-x-1/2 px-3 py-1 text-[10px] uppercase tracking-wider transition-opacity"
          style={{
            // bottom matches the parent's new asymmetric bottom padding (6px)
            // so the pill sits just above the bottom border instead of
            // overlapping the textarea's lower edge.
            bottom: '6px',
            color: 'var(--color-text-primary)',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--accent)',
            borderRadius: '4px',
            opacity: notesFocused && notes.trim().length > 0 ? 1 : 0,
            pointerEvents:
              notesFocused && notes.trim().length > 0 ? 'auto' : 'none',
            transitionDuration: '200ms',
          }}
        >
          Save
        </button>
      </div>

      {/* "I need more help" expand/collapse — same pattern as TriageResultStep.
          Reveals the full EmergencyFlow (911 / 112 / Fireside Project) beneath
          the notes when expanded. The contact card with name + Call/Text
          buttons inside EmergencyFlow is redundant on this view (the same
          card is already shown above), but it's a small overlap for the
          benefit of keeping the EmergencyFlow component reusable as-is. */}
      <div className="flex justify-center mt-2">
        <button
          type="button"
          onClick={handleNeedMoreHelpToggle}
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider"
          style={{
            color: 'var(--accent)',
            background: 'transparent',
            border: 'none',
            padding: 0,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
          aria-expanded={isExpanded && !isClosing}
        >
          <span>I need more help</span>
          {isExpanded ? <CircleSkipIcon size={14} /> : <CirclePlusIcon size={14} />}
        </button>
      </div>

      {/* Emergency content — only mounted when expanded or closing.
          We pass `hideContactCard` here because the saved-contact card is
          already displayed at the top of this page, so showing it again
          inside the expanded EmergencyFlow would be redundant. The user
          still gets the reassurance text + 911/112 row + Fireside Project. */}
      {isExpanded && (
        <div
          ref={emergencyRef}
          className={`mt-4 ${isClosing ? 'transition-opacity' : 'animate-fadeIn'}`}
          style={
            isClosing
              ? { opacity: 0, transitionDuration: `${FADE_DURATION_MS}ms` }
              : undefined
          }
        >
          <EmergencyFlow
            emergencyContact={emergencyContactDetails}
            onAction={onContactAction}
            hideContactCard
          />
        </div>
      )}
    </div>
  );
}

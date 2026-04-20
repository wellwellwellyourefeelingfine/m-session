/**
 * EditableDoseBlock — Compact, inline-editable display of the planned dose.
 *
 * Reads `sessionProfile.plannedDosageMg` from the session store. Renders a
 * small label + tight accent box around the value (sized for ~999 mg). Tap
 * the box to edit inline.
 *
 * Layout invariant: the dose box and the button row beneath both occupy the
 * same on-screen space whether the block is in display or edit mode. Save and
 * Cancel are always mounted with reserved height; only their opacity flips, so
 * entering or leaving edit mode never shifts other content on the page.
 *
 * If the user changes the dose to a different value AFTER having recorded an
 * ingestion time, the substance intake state resets — the user re-runs the
 * "I've taken it" + Confirm flow from scratch. Keeps the recorded time
 * coherent with the dose the user actually intends to take.
 *
 * Config:
 *   { type: 'editable-dose' }
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSessionStore } from '../../../../stores/useSessionStore';

const FADE_MS = 300;

export default function EditableDoseBlock() {
  const plannedDosageMg = useSessionStore((s) => s.sessionProfile.plannedDosageMg);
  const ingestionTime = useSessionStore((s) => s.substanceChecklist.ingestionTime);
  const ingestionTimeConfirmed = useSessionStore((s) => s.substanceChecklist.ingestionTimeConfirmed);
  const updateSessionProfile = useSessionStore((s) => s.updateSessionProfile);
  const resetSubstanceIntake = useSessionStore((s) => s.resetSubstanceIntake);

  // Hard lock: once the user has confirmed their ingestion time (via the modal
  // and advanced past this section), dose is read-only. Back-navigating here
  // shows the value but blocks any further changes — both dose and time are
  // committed to the session record at that point.
  const isLocked = ingestionTimeConfirmed;

  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState(() =>
    plannedDosageMg != null ? String(plannedDosageMg) : ''
  );
  // Independently controls Save/Cancel opacity. Lets us fade in on the frame
  // after isEditing flips on, and fade out before isEditing flips off.
  const [actionsVisible, setActionsVisible] = useState(false);

  // Wrapper ref + ref to the latest handleSave for click-outside-to-save.
  const wrapperRef = useRef(null);
  const handleSaveRef = useRef(null);

  // Sync local edit state with the store when not actively editing.
  useEffect(() => {
    if (!isEditing) {
      setEdited(plannedDosageMg != null ? String(plannedDosageMg) : '');
    }
  }, [plannedDosageMg, isEditing]);

  // Drive opacity transition: when isEditing flips on, schedule visible=true
  // on the next frame so the transition has a starting state to animate from.
  useEffect(() => {
    if (isEditing) {
      const id = requestAnimationFrame(() => setActionsVisible(true));
      return () => cancelAnimationFrame(id);
    }
  }, [isEditing]);

  const handleEnterEdit = useCallback(() => {
    if (isLocked) return;
    setIsEditing(true);
  }, [isLocked]);

  // Exit: fade buttons out first, then swap box back to display mode after the
  // fade finishes. Order matters — swapping first would yank the buttons out
  // mid-animation.
  const handleExitEdit = useCallback(() => {
    setActionsVisible(false);
    setTimeout(() => setIsEditing(false), FADE_MS);
  }, []);

  const handleSave = useCallback(() => {
    const parsed = parseInt(edited, 10);
    if (Number.isNaN(parsed) || parsed < 0) return;

    const changed = parsed !== plannedDosageMg;
    updateSessionProfile('plannedDosageMg', parsed);

    // If the dose actually changed AND the user had already recorded their
    // intake, reset the recorded time so the intake flow restarts cleanly.
    if (changed && ingestionTime != null) {
      resetSubstanceIntake();
    }

    handleExitEdit();
  }, [edited, plannedDosageMg, ingestionTime, updateSessionProfile, resetSubstanceIntake, handleExitEdit]);

  const handleCancel = useCallback(() => {
    setEdited(plannedDosageMg != null ? String(plannedDosageMg) : '');
    handleExitEdit();
  }, [plannedDosageMg, handleExitEdit]);

  // Keep a live ref to handleSave so the click-outside listener can call it
  // without re-binding every keystroke (handleSave's deps include `edited`).
  useEffect(() => {
    handleSaveRef.current = handleSave;
  }, [handleSave]);

  // Click outside the block while editing → save (same outcome as Save button).
  // Buttons inside the wrapper handle their own clicks, so Cancel still cancels.
  useEffect(() => {
    if (!isEditing) return undefined;
    const handlePointerDown = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        handleSaveRef.current?.();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isEditing]);

  const displayValue = plannedDosageMg != null ? String(plannedDosageMg) : '—';

  // Shared box class — same dimensions in both display and edit modes so the
  // box, the digits, and the "mg" never shift position when toggling.
  const boxClass = `inline-flex justify-center items-baseline gap-1 px-4 py-2
    border border-[var(--accent)] bg-[var(--accent-bg)]`;
  const numberStyle = {
    fontFamily: 'DM Serif Text, serif',
    textTransform: 'none',
  };

  return (
    <div ref={wrapperRef} className="flex flex-col items-center gap-2">
      <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">
        Your intended dose
      </p>

      {!isEditing && (
        <button
          type="button"
          onClick={handleEnterEdit}
          disabled={isLocked}
          aria-label={isLocked ? `Dose ${displayValue} mg (locked)` : undefined}
          className={`${boxClass} ${
            isLocked ? 'cursor-default' : 'hover:opacity-90 transition-opacity'
          }`}
        >
          <span
            className="text-xl text-[var(--color-text-primary)] w-[3ch] text-center inline-block"
            style={numberStyle}
          >
            {displayValue}
          </span>
          <span
            className="text-xl text-[var(--color-text-primary)]"
            style={numberStyle}
          >
            mg
          </span>
        </button>
      )}

      {isEditing && (
        <div className={boxClass}>
          <input
            type="number"
            value={edited}
            onChange={(e) => setEdited(e.target.value)}
            min="0"
            step="1"
            autoFocus
            className="text-xl text-[var(--color-text-primary)] w-[3ch] text-center
              bg-transparent focus:outline-none p-0 border-0"
            style={numberStyle}
          />
          <span
            className="text-xl text-[var(--color-text-primary)]"
            style={numberStyle}
          >
            mg
          </span>
        </div>
      )}

      {/* Reserved button space — always mounted so entering/leaving edit mode
          never shifts page layout. `inert` on the container disables the whole
          group when not editing (covers focus + clicks + AT; avoids the
          aria-hidden-with-focus warning that an aria-hidden approach causes). */}
      <div
        className="flex justify-center items-baseline gap-2 h-5"
        inert={!isEditing}
      >
        <button
          type="button"
          onClick={handleSave}
          className={`rounded-full border border-[var(--accent)]
            text-[var(--accent)] uppercase tracking-wider text-[9px]
            px-3 py-0.5 transition-opacity duration-300
            hover:bg-[var(--accent-bg)]
            ${actionsVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          Save
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className={`text-[var(--color-text-tertiary)] uppercase tracking-wider text-[8px]
            transition-opacity duration-300
            hover:text-[var(--color-text-secondary)]
            ${actionsVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

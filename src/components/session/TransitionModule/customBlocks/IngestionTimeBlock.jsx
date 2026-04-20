/**
 * IngestionTimeBlock — Combined record + confirm flow for substance intake.
 *
 * State machine driven by the store (so EditableDoseBlock's reset cleanly
 * sends us back to pristine):
 *   - pristine    → box reads "I've taken it", click → record
 *   - recorded    → box shows time (click to edit). A friendly acknowledgment
 *                   text fades in beneath. Continue button (in the control bar)
 *                   is overridden to read "Confirm time" and to open the modal
 *                   instead of advancing directly.
 *   - editing     → box swaps to a time input + inline "Save" button below.
 *                   Continue stays "Confirm time" but is disabled while editing.
 *   - confirming  → confirmation modal overlay
 *   - confirmed   → confirmIngestionTime fires + section auto-advances
 *
 * Layout invariant: the central "box" has fixed dimensions across all states.
 * Pristine, recorded, editing, and confirmed all render into the same grid
 * cell — only opacity flips between layers, so the pristine→recorded transition
 * (and every state change after) is a smooth crossfade with no layout shift.
 *
 * Config:
 *   { type: 'ingestion-time' }
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSessionStore } from '../../../../stores/useSessionStore';
import ConfirmModal from '../../../journal/ConfirmModal';

const BLOCK_KEY = 'ingestion-time';
// Locked dimensions — pristine button and recorded time box share these.
const BOX_STYLE = { width: '10rem', height: '3.25rem' };

export default function IngestionTimeBlock({ context }) {
  const ingestionTime = useSessionStore((s) => s.substanceChecklist.ingestionTime);
  const ingestionTimeConfirmed = useSessionStore((s) => s.substanceChecklist.ingestionTimeConfirmed);
  const recordIngestionTime = useSessionStore((s) => s.recordIngestionTime);
  const confirmIngestionTime = useSessionStore((s) => s.confirmIngestionTime);

  const [isEditing, setIsEditing] = useState(false);
  const [editedTime, setEditedTime] = useState(() => formatTimeForInput(ingestionTime));
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const containerRef = useRef(null);
  const friendlyTextRef = useRef(null);
  const wasPristineRef = useRef(ingestionTime == null);

  // Handlers ─────────────────────────────────────────────────────────────────

  const handleRecord = useCallback(() => {
    recordIngestionTime(Date.now());
  }, [recordIngestionTime]);

  const handleStartEdit = useCallback(() => {
    if (ingestionTimeConfirmed) return;
    setEditedTime(formatTimeForInput(ingestionTime));
    setIsEditing(true);
  }, [ingestionTime, ingestionTimeConfirmed]);

  const handleSaveEdit = useCallback(() => {
    const [h, m] = editedTime.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return;
    const next = new Date();
    next.setHours(h, m, 0, 0);
    recordIngestionTime(next.getTime());
    setIsEditing(false);
  }, [editedTime, recordIngestionTime]);

  const handleConfirmRequest = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  const handleConfirmFinal = useCallback(() => {
    confirmIngestionTime();
    setShowConfirmModal(false);
    requestAnimationFrame(() => {
      context.advanceSection?.();
    });
  }, [confirmIngestionTime, context]);

  const handleEditFromModal = useCallback(() => {
    setShowConfirmModal(false);
    handleStartEdit();
  }, [handleStartEdit]);

  // Box-level click handler. Pristine → record, recorded display → edit.
  // No-op while editing (the input handles its own clicks) or confirmed.
  const handleBoxClick = useCallback(() => {
    if (ingestionTimeConfirmed || isEditing) return;
    if (ingestionTime == null) handleRecord();
    else handleStartEdit();
  }, [ingestionTime, ingestionTimeConfirmed, isEditing, handleRecord, handleStartEdit]);

  // Effects ─────────────────────────────────────────────────────────────────

  // Gate Continue: ready when (recorded and not editing) OR confirmed.
  // Editing returns ready=false so Continue is disabled until inline Save.
  useEffect(() => {
    const isReady = ingestionTimeConfirmed
      || (ingestionTime != null && !isEditing);
    context.reportReady?.(BLOCK_KEY, isReady);
  }, [ingestionTime, ingestionTimeConfirmed, isEditing, context]);

  // Override Continue label + handler when recorded but not yet confirmed.
  // Clear in pristine and confirmed states (default Continue takes over).
  useEffect(() => {
    if (ingestionTime != null && !ingestionTimeConfirmed) {
      context.setPrimaryOverride?.({
        label: 'Confirm time',
        onClick: handleConfirmRequest,
      });
    } else {
      context.setPrimaryOverride?.(null);
    }
  }, [ingestionTime, ingestionTimeConfirmed, handleConfirmRequest, context]);

  // Reset local state when the store resets (e.g. user edits dose).
  useEffect(() => {
    if (ingestionTime == null) {
      setIsEditing(false);
      setShowConfirmModal(false);
      setEditedTime(formatTimeForInput(null));
    }
  }, [ingestionTime]);

  // Smooth-scroll all the way to the bottom of the section's scrollable
  // container on the pristine → recorded transition, so the new friendly text
  // is fully revealed and the user sees everything.
  //
  // Implementation notes:
  //  - We walk up from the block container to find the actual scrollable
  //    ancestor (`overflow-y: auto | scroll`). For TransitionModule that's the
  //    `.flex-1.overflow-auto` wrapper; for MasterModule it's similar. Doing
  //    this manually is more reliable than `scrollIntoView`, whose alignment
  //    heuristics can no-op when the target is even partially visible.
  //  - Double `requestAnimationFrame` lets React commit the new DOM (frame 1)
  //    and the browser do its layout pass (frame 2) before we measure
  //    `scrollHeight`. Without this, scrollHeight can be stale.
  //  - `behavior: 'smooth'` matches the section-advance scroll feel.
  useEffect(() => {
    if (ingestionTime != null && wasPristineRef.current) {
      wasPristineRef.current = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const start = containerRef.current;
          if (!start) return;
          let scrollable = start.parentElement;
          while (scrollable) {
            const overflowY = getComputedStyle(scrollable).overflowY;
            if (overflowY === 'auto' || overflowY === 'scroll') break;
            scrollable = scrollable.parentElement;
          }
          if (!scrollable) return;
          scrollable.scrollTo({
            top: scrollable.scrollHeight,
            behavior: 'smooth',
          });
        });
      });
    }
    if (ingestionTime == null) {
      wasPristineRef.current = true;
    }
  }, [ingestionTime]);

  // Render flags ────────────────────────────────────────────────────────────

  const showPristine = ingestionTime == null;
  const showTime = ingestionTime != null && !isEditing;
  const showInput = ingestionTime != null && isEditing && !ingestionTimeConfirmed;
  const isInteractive = !ingestionTimeConfirmed && !isEditing;
  const showFriendlyText = ingestionTime != null && !ingestionTimeConfirmed;

  return (
    <>
      <div ref={containerRef} className="flex flex-col items-center gap-4">
        {/* Box wrapper — fixed dims; pristine, time, and input stack in the
            same grid cell so transitions between states crossfade in place. */}
        <div
          className={`grid place-items-center
            border border-[var(--accent)] bg-[var(--accent-bg)]
            transition-opacity
            ${isInteractive ? 'cursor-pointer hover:opacity-90' : ''}`}
          style={BOX_STYLE}
          onClick={isInteractive ? handleBoxClick : undefined}
          role={isInteractive ? 'button' : undefined}
          tabIndex={isInteractive ? 0 : undefined}
          onKeyDown={isInteractive ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleBoxClick();
            }
          } : undefined}
        >
          {/* Pristine layer */}
          <span
            className={`col-start-1 row-start-1 uppercase text-xs tracking-wider
              text-[var(--color-text-primary)]
              transition-opacity duration-300
              ${showPristine ? 'opacity-100' : 'opacity-0'}`}
          >
            I&apos;ve taken it
          </span>

          {/* Time layer (recorded display + confirmed) */}
          <span
            className={`col-start-1 row-start-1 text-xl text-[var(--color-text-primary)]
              transition-opacity duration-300
              ${showTime || ingestionTimeConfirmed ? 'opacity-100' : 'opacity-0'}`}
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            {ingestionTime ? formatTimeForDisplay(ingestionTime) : ''}
          </span>

          {/* Input layer (editing) */}
          {showInput && (
            <input
              type="time"
              value={editedTime}
              onChange={(e) => setEditedTime(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="col-start-1 row-start-1 bg-transparent text-xl text-center
                text-[var(--color-text-primary)] focus:outline-none w-full px-4
                animate-fade-in"
              style={{ fontFamily: 'DM Serif Text, serif' }}
            />
          )}
        </div>

        {/* Inline Save — only during editing. Commits the edit, exits edit
            mode, and the control-bar Continue ("Confirm time") re-enables. */}
        {showInput && (
          <button
            type="button"
            onClick={handleSaveEdit}
            className="text-[var(--accent)] uppercase tracking-wider text-xs px-3 py-1
              hover:opacity-80 transition-opacity animate-fade-in"
          >
            Save
          </button>
        )}

        {/* Friendly acknowledgment after recording. Fades in via animate-fade-in
            on first mount. Logistical "you can't change it later" warning lives
            in the modal — keeping this message warm and acknowledging. */}
        {showFriendlyText && (
          <div
            ref={friendlyTextRef}
            className="w-full animate-fade-in mt-2"
          >
            <p
              className="text-[var(--color-text-primary)] text-lg leading-relaxed text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              Your start time is saved.
            </p>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mt-3">
              Take a moment to make sure it looks right.
            </p>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mt-3">
              Tap the time above to adjust if needed.
            </p>
          </div>
        )}
      </div>

      {showConfirmModal && (
        <ConfirmModal
          title="Are you sure this is correct?"
          message="Once you confirm your ingestion time, you won't be able to change it. This is important so we can track how far you are into the effects of your session."
          confirmLabel="Confirm"
          cancelLabel="Edit time"
          onConfirm={handleConfirmFinal}
          onCancel={handleEditFromModal}
        />
      )}
    </>
  );
}

// ── Formatters ───────────────────────────────────────────────────────────────
function formatTimeForDisplay(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatTimeForInput(ms) {
  if (!ms) {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

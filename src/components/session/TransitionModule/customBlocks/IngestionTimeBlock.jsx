/**
 * IngestionTimeBlock — Record or confirm ingestion time.
 *
 * Config:
 *   { type: 'ingestion-time', mode: 'record' }    // "I've Taken It" button
 *   { type: 'ingestion-time', mode: 'confirm' }   // Shows recorded time + confirm/adjust
 *
 * Uses the block readiness API to gate Continue — the user cannot proceed until
 * they've recorded (record mode) or confirmed (confirm mode) their ingestion time.
 */

import { useState, useEffect, useCallback } from 'react';
import { useSessionStore } from '../../../../stores/useSessionStore';

export default function IngestionTimeBlock({ block, context }) {
  const mode = block.mode || 'record';

  const ingestionTime = useSessionStore((s) => s.substanceChecklist.ingestionTime);
  const ingestionTimeConfirmed = useSessionStore((s) => s.substanceChecklist.ingestionTimeConfirmed);
  const recordIngestionTime = useSessionStore((s) => s.recordIngestionTime);
  const confirmIngestionTime = useSessionStore((s) => s.confirmIngestionTime);

  const blockKey = `ingestion-time-${mode}`;

  // ─── Record mode ───────────────────────────────────────────────────────
  if (mode === 'record') {
    return <RecordMode
      blockKey={blockKey}
      ingestionTime={ingestionTime}
      recordIngestionTime={recordIngestionTime}
      context={context}
    />;
  }

  // ─── Confirm mode ──────────────────────────────────────────────────────
  return <ConfirmMode
    blockKey={blockKey}
    ingestionTime={ingestionTime}
    ingestionTimeConfirmed={ingestionTimeConfirmed}
    recordIngestionTime={recordIngestionTime}
    confirmIngestionTime={confirmIngestionTime}
    context={context}
  />;
}

// ── Record Mode ──────────────────────────────────────────────────────────────
function RecordMode({ blockKey, ingestionTime, recordIngestionTime, context }) {
  const alreadyRecorded = ingestionTime != null;

  // Gate Continue until button pressed. If already recorded (resuming),
  // mark ready immediately. No cleanup — ScreensSection resets blockReadiness
  // on screen change, and an unconditional cleanup here was flipping readiness
  // on every re-render (because `context` is a fresh object reference each
  // ScreensSection render), causing an infinite loop.
  useEffect(() => {
    context.reportReady?.(blockKey, alreadyRecorded);
  }, [blockKey, alreadyRecorded, context]);

  const handleClick = useCallback(() => {
    if (alreadyRecorded) return;
    recordIngestionTime(Date.now());
    context.reportReady?.(blockKey, true);
  }, [alreadyRecorded, recordIngestionTime, blockKey, context]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={alreadyRecorded}
      className={`w-full py-4 px-4 border transition-colors uppercase tracking-wider text-xs
        ${alreadyRecorded
          ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)] cursor-default'
          : 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)] hover:opacity-90'
        }`}
    >
      {alreadyRecorded ? '✓ Time recorded' : "I've Taken It"}
    </button>
  );
}

// ── Confirm Mode ─────────────────────────────────────────────────────────────
function ConfirmMode({ blockKey, ingestionTime, ingestionTimeConfirmed, recordIngestionTime, confirmIngestionTime, context }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTime, setEditedTime] = useState(() => formatTimeForInput(ingestionTime));
  const [confirmed, setConfirmed] = useState(ingestionTimeConfirmed);

  // Gate Continue until user confirms. If already confirmed (resuming), ready.
  // See RecordMode comment above — no cleanup, same loop-avoidance reason.
  useEffect(() => {
    context.reportReady?.(blockKey, confirmed);
  }, [blockKey, confirmed, context]);

  const handleConfirm = useCallback(() => {
    confirmIngestionTime();
    setConfirmed(true);
    context.reportReady?.(blockKey, true);
  }, [confirmIngestionTime, blockKey, context]);

  const handleAdjust = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSaveEdit = useCallback(() => {
    // Parse editedTime (HH:MM) into a millisecond timestamp for today
    const [h, m] = editedTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return;
    const now = new Date();
    now.setHours(h, m, 0, 0);
    recordIngestionTime(now.getTime());
    confirmIngestionTime();
    setConfirmed(true);
    setIsEditing(false);
    context.reportReady?.(blockKey, true);
  }, [editedTime, recordIngestionTime, confirmIngestionTime, blockKey, context]);

  if (!ingestionTime) {
    return (
      <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider italic text-center">
        No time recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed text-center">
        We&apos;ve recorded your start time as:
      </p>

      <div className="py-4 px-4 border border-[var(--accent)] bg-[var(--accent-bg)] text-center">
        <p className="text-xl text-[var(--color-text-primary)]" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
          {formatTimeForDisplay(ingestionTime)}
        </p>
      </div>

      {!isEditing && !confirmed && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3 px-4 border border-[var(--accent)] bg-[var(--accent-bg)]
              text-[var(--color-text-primary)] uppercase tracking-wider text-xs
              hover:opacity-90 transition-opacity"
          >
            That&apos;s correct
          </button>
          <button
            type="button"
            onClick={handleAdjust}
            className="w-full py-3 px-4 border border-[var(--color-border)]
              text-[var(--color-text-secondary)] uppercase tracking-wider text-xs
              hover:border-[var(--color-text-tertiary)] transition-colors"
          >
            Adjust time
          </button>
        </div>
      )}

      {isEditing && (
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] text-center">
            What time did you take your substance?
          </label>
          <input
            type="time"
            value={editedTime}
            onChange={(e) => setEditedTime(e.target.value)}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              text-[var(--color-text-primary)] text-center text-base focus:outline-none focus:border-[var(--accent)]"
          />
          <button
            type="button"
            onClick={handleSaveEdit}
            className="w-full py-3 px-4 border border-[var(--accent)] bg-[var(--accent-bg)]
              text-[var(--color-text-primary)] uppercase tracking-wider text-xs
              hover:opacity-90 transition-opacity"
          >
            Confirm
          </button>
        </div>
      )}

      {confirmed && (
        <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider text-center italic">
          Time confirmed. Continue when you&apos;re ready.
        </p>
      )}
    </div>
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

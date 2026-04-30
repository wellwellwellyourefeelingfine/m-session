/**
 * IntentionPromptBlock — Display↔edit textarea bound to
 * sessionProfile.holdingQuestion.
 *
 * Modeled on TouchstonePromptBlock (TransitionModule), but with two
 * deliberate differences for style sheet rule #6 compliance:
 *
 *   1. NO `reportReady` call. Continue is never gated. The user can advance
 *      with an empty draft — empty `handleSave` is a no-op and the section
 *      advances normally.
 *
 *   2. NO `setPrimaryOverride`. Save fires implicitly on textarea blur.
 *      When the user clicks Continue, the textarea blurs first → save
 *      happens (if non-empty) → then the click triggers section advance.
 *      One-click commit. No race window to manage.
 *
 * Two render modes:
 *   - display — accent-bordered button showing the saved intention in DM
 *               Serif italic. Click to re-enter edit mode.
 *   - edit    — textarea, autoFocus when re-entered from display mode.
 *
 * Initial mode is derived from whether sessionProfile.holdingQuestion
 * already has a non-empty value: yes → display; no → edit.
 *
 * Config:
 *   { type: 'intention-prompt',
 *     placeholder: 'Write your intention here...',
 *     rows: 6 }
 */

import { useState, useCallback } from 'react';
import { useSessionStore } from '../../../../../stores/useSessionStore';

export default function IntentionPromptBlock({ block }) {
  const savedValue = useSessionStore((s) => s.sessionProfile?.holdingQuestion);
  const updateSessionProfile = useSessionStore((s) => s.updateSessionProfile);

  const hasSaved = savedValue != null && String(savedValue).trim() !== '';

  const [mode, setMode] = useState(hasSaved ? 'display' : 'edit');
  const [draft, setDraft] = useState(savedValue || '');

  const handleSave = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) return; // empty drafts: no-op (rule #6 — Continue still advances)
    updateSessionProfile('holdingQuestion', trimmed);
    setMode('display');
  }, [draft, updateSessionProfile]);

  const handleEnterEdit = useCallback(() => {
    setDraft(String(savedValue || ''));
    setMode('edit');
  }, [savedValue]);

  if (mode === 'display' && hasSaved) {
    return (
      <button
        type="button"
        onClick={handleEnterEdit}
        className="w-full py-4 px-4 border border-[var(--accent)] bg-[var(--accent-bg)]
          hover:opacity-90 transition-opacity cursor-pointer text-left"
        aria-label="Edit intention"
      >
        <p
          className="text-base text-[var(--color-text-primary)] italic leading-relaxed"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          &ldquo;{savedValue}&rdquo;
        </p>
      </button>
    );
  }

  return (
    <textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={handleSave}
      placeholder={block.placeholder || 'Write your intention here...'}
      rows={block.rows || 6}
      autoFocus={hasSaved}
      className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
        focus:outline-none focus:border-[var(--accent)]
        text-[var(--color-text-primary)] leading-relaxed
        placeholder:text-[var(--color-text-tertiary)]
        resize-none text-sm text-left"
      style={{ textTransform: 'none' }}
    />
  );
}

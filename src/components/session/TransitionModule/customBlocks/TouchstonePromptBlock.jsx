/**
 * TouchstonePromptBlock — Prompt that locks to an accent display on save,
 * and can be re-opened for editing by clicking the display.
 *
 * Two modes:
 *   - edit:    textarea. Continue is overridden to SAVE the draft to the
 *              configured storeField path INSTEAD of advancing the section.
 *   - display: accent-bordered box showing the saved value in DM Serif.
 *              Clicking the box re-opens edit mode (draft initialized from
 *              the saved value). Continue override is cleared, so Continue
 *              advances normally.
 *
 * Initial mode is derived from whether the storeField already has a value —
 * so if the user back-navigates here after having saved, the block shows
 * display mode (and lets them click to edit again).
 *
 * Scrolls to the bottom of the scrollable container on the first unsaved →
 * saved transition so any conditional blocks beneath (e.g. comparison text,
 * expandable-store-display) come smoothly into view.
 *
 * Config:
 *   { type: 'touchstone-prompt',
 *     storeField: 'transitionData.peakTouchstone',
 *     placeholder: 'A word or phrase...',
 *     rows: 3 }
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSessionStore } from '../../../../stores/useSessionStore';

// Delay (ms) before we clear the primary-button override after mode flips to
// 'display'. Prevents a race where the user clicks Continue while in edit
// mode: the textarea's onBlur fires handleSave FIRST (→ mode='display'), and
// without this delay React commits the mode change and clears the override
// before the click event fires — which would let the first Continue press
// fall through to the default section-advance handler.
const OVERRIDE_CLEAR_DELAY_MS = 250;

function resolveStoreValue(path, state) {
  if (!path) return undefined;
  const parts = path.split('.');
  let val = state;
  for (const p of parts) {
    if (val == null) return undefined;
    val = val[p];
  }
  return val;
}

export default function TouchstonePromptBlock({ block, context }) {
  const storeField = block.storeField;
  const savedValue = useSessionStore((s) => resolveStoreValue(storeField, s));
  const updateTransitionData = useSessionStore((s) => s.updateTransitionData);
  const updateSessionProfile = useSessionStore((s) => s.updateSessionProfile);

  const hasSaved = savedValue != null && String(savedValue).trim() !== '';

  // 'edit' or 'display'. Initialized based on whether the store already has
  // a value — e.g., back-nav into a section that's already been saved lands
  // on display mode.
  const [mode, setMode] = useState(hasSaved ? 'display' : 'edit');
  const [draft, setDraft] = useState('');

  const containerRef = useRef(null);
  const prevSavedRef = useRef(hasSaved);

  const BLOCK_KEY = `touchstone-prompt-${storeField}`;

  // Save handler — mirrors the draft to the store at the configured path.
  const handleSave = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const [root, ...rest] = storeField.split('.');
    const restPath = rest.join('.');
    if (root === 'transitionData') {
      updateTransitionData(restPath, trimmed);
    } else if (root === 'sessionProfile') {
      updateSessionProfile(restPath, trimmed);
    }
    setMode('display');
  }, [draft, storeField, updateTransitionData, updateSessionProfile]);

  // Click-to-edit on the saved display — pre-fills draft with the saved value
  // so the user can tweak rather than retype.
  const handleEnterEdit = useCallback(() => {
    setDraft(String(savedValue || ''));
    setMode('edit');
  }, [savedValue]);

  // Gate Continue: disabled until draft has content in edit mode; always
  // enabled in display mode so the second Continue press advances normally.
  useEffect(() => {
    const ready = mode === 'display' ? true : draft.trim().length > 0;
    context.reportReady?.(BLOCK_KEY, ready);
  }, [mode, draft, BLOCK_KEY, context]);

  // Override Continue to SAVE while in edit mode. When mode flips to
  // 'display', DELAY clearing the override to avoid a race with blur-triggered
  // saves — see OVERRIDE_CLEAR_DELAY_MS above.
  useEffect(() => {
    if (mode === 'edit') {
      context.setPrimaryOverride?.({
        label: 'Continue',
        onClick: handleSave,
      });
      return undefined;
    }
    const id = setTimeout(() => {
      context.setPrimaryOverride?.(null);
    }, OVERRIDE_CLEAR_DELAY_MS);
    return () => clearTimeout(id);
  }, [mode, handleSave, context]);

  // Smooth-scroll to the bottom on the first save (unsaved → saved transition)
  // so conditional blocks beneath come into view.
  useEffect(() => {
    if (hasSaved && !prevSavedRef.current) {
      prevSavedRef.current = true;
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
    if (!hasSaved) {
      prevSavedRef.current = false;
    }
  }, [hasSaved]);

  return (
    <div ref={containerRef}>
      {mode === 'display' && hasSaved ? (
        <button
          type="button"
          onClick={handleEnterEdit}
          className="w-full py-4 px-4 border border-[var(--accent)] bg-[var(--accent-bg)]
            hover:opacity-90 transition-opacity animate-fade-in cursor-pointer"
          aria-label="Edit touchstone"
        >
          <p
            className="text-lg text-[var(--color-text-primary)] text-center"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            {savedValue}
          </p>
        </button>
      ) : (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            // Auto-save and flip to display mode when the user clicks off the
            // textarea. Empty drafts are skipped (no-op). Also fires when the
            // user clicks Continue — handleSave is idempotent so the
            // subsequent override click is a no-op.
            if (!draft.trim()) return;
            handleSave();
          }}
          placeholder={block.placeholder || 'A word or phrase...'}
          rows={block.rows || 3}
          autoFocus={hasSaved /* re-editing a saved value — focus immediately */}
          className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
            focus:outline-none focus:border-[var(--accent)]
            text-[var(--color-text-primary)] leading-relaxed
            placeholder:text-[var(--color-text-tertiary)]
            resize-none text-sm"
          style={{ textTransform: 'none' }}
        />
      )}
    </div>
  );
}

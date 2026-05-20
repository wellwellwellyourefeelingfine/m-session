/**
 * IntentionView
 * Page-level view inside the Helper Modal for viewing and editing the user's
 * intention (sessionProfile.holdingQuestion). Reachable via the slim full-width
 * Intention card on the CategoryGrid.
 *
 * Layout (top to bottom):
 *   1. Wide CategoryHeader-style header — circular CompassIcon escutcheon
 *      overhanging the top-left, "Intention" title and description inside a
 *      bordered box. Mirrors EmergencyContactView's header.
 *   2. Accent-bordered card showing the saved intention in italic DM Serif
 *      (display mode). An Edit/Save toggle sits in the card's top-right.
 *   3. (Edit mode only) A textarea fades in beneath the card via the same
 *      CSS grid 1fr/0fr trick used in EmergencyContactView.
 *
 * Save flow:
 *   - Save click writes the trimmed draft to sessionProfile.holdingQuestion.
 *   - If the value actually changed AND is non-empty, also append a new
 *     journal entry so the user has a chronological record of their
 *     intention's evolution across the session.
 *   - Identical re-saves and empty clears do NOT create a journal entry.
 */

import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { CompassIcon } from '../shared/Icons';

const CIRCLE_SIZE = 36;
const CIRCLE_OFFSET = -8;

export default function IntentionView({ isEditing, onEditToggle }) {
  const savedIntention = useSessionStore((s) => s.sessionProfile?.holdingQuestion) || '';
  const sessionId = useSessionStore((s) => s.sessionId);
  const updateSessionProfile = useSessionStore((s) => s.updateSessionProfile);

  const [draft, setDraft] = useState(savedIntention);

  const hasSaved = savedIntention.trim().length > 0;

  const handleEditToggle = () => {
    if (isEditing) {
      const trimmed = draft.trim();
      const previous = (useSessionStore.getState().sessionProfile?.holdingQuestion || '').trim();
      const changed = trimmed !== previous;

      if (changed) {
        updateSessionProfile('holdingQuestion', trimmed);
        if (trimmed.length > 0) {
          useJournalStore.getState().addEntry({
            content: `INTENTION:\n\n${trimmed}`,
            source: 'session',
            sessionId,
            moduleTitle: 'Intention Update',
            isEdited: false,
          });
        }
      }

      if (trimmed !== draft) setDraft(trimmed);
      onEditToggle(false);
    } else {
      setDraft(savedIntention);
      onEditToggle(true);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div style={{ marginTop: '8px' }}>
        {/* Wide CategoryHeader-style header.
            Title + therapeutic description distilled from the
            "Refine Your Intention" intro in intentionSettingV2 — anchors the
            *why* of intention vs. expectation and what makes one good. */}
        <div
          className="relative w-full border rounded-md flex flex-col items-start"
          style={{
            borderColor: 'var(--color-border)',
            padding: '8px 14px 6px 14px',
          }}
        >
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
            <CompassIcon size={26} className="text-[var(--accent)]" />
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
            My Intention
          </p>
          <p
            className="text-[12px] leading-relaxed mt-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            An intention names the direction you want to face during your
            session. The strongest ones describe something you&rsquo;d like to
            move toward, and carry a felt sense beneath the language. Holding
            yours lightly leaves room for the experience to take you somewhere
            you didn&rsquo;t plan.
          </p>
        </div>

        {/* Saved intention card with Edit/Save toggle in its top-right corner */}
        <div
          className="relative w-full border rounded-md mt-3"
          style={{
            borderColor: 'var(--accent)',
            backgroundColor: 'var(--accent-bg)',
            padding: '14px 14px 14px 14px',
            minHeight: '64px',
          }}
        >
          <button
            type="button"
            onClick={handleEditToggle}
            className="absolute top-2 right-2 px-2 py-0.5 text-[10px] uppercase tracking-wider transition-opacity"
            style={{
              color: 'var(--accent)',
              background: 'transparent',
              border: '1px solid var(--accent)',
              borderRadius: '9999px',
              cursor: 'pointer',
            }}
          >
            {isEditing ? 'Save' : 'Edit'}
          </button>

          {hasSaved ? (
            <p
              className="text-[15px] italic leading-relaxed"
              style={{
                fontFamily: "'DM Serif Text', serif",
                textTransform: 'none',
                color: 'var(--color-text-primary)',
                paddingRight: 56,
              }}
            >
              &ldquo;{savedIntention}&rdquo;
            </p>
          ) : (
            <p
              className="text-[12px] leading-relaxed"
              style={{
                color: 'var(--color-text-tertiary)',
                paddingRight: 56,
              }}
            >
              No intention saved yet. Tap Edit to add one.
            </p>
          )}
        </div>

        {/* Unboxed meta description — sits below the accent intention card in
            display mode and collapses + fades out when the user enters edit
            mode, in parallel with the textarea expanding in below. Same grid
            1fr/0fr trick used elsewhere, but inverted state so the two
            swaps share a coherent 350ms transition. */}
        <div
          className="grid"
          style={{
            gridTemplateRows: isEditing ? '0fr' : '1fr',
            opacity: isEditing ? 0 : 1,
            transition:
              'grid-template-rows 350ms cubic-bezier(0.65, 0, 0.35, 1),' +
              ' opacity 350ms cubic-bezier(0.65, 0, 0.35, 1)',
          }}
          inert={isEditing || undefined}
        >
          <div className="min-h-0 overflow-hidden">
            <p
              className="text-[10px] leading-relaxed mt-3 px-6"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Revisit your intention anytime. If it shifts, tap Edit and save
              the new version. The change is added to your journal so you can
              look back at how it evolved.
            </p>
          </div>
        </div>
      </div>

      {/*
        Animated edit-mode textarea. Same CSS grid 1fr/0fr trick used in
        EmergencyContactView — collapses to zero height when not editing,
        grows to natural height when editing. Opacity transitions in parallel
        and `inert` blocks focus while collapsed.
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
        inert={!isEditing || undefined}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-4 pt-5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write your intention here..."
              rows={6}
              autoFocus={isEditing}
              autoComplete="off"
              tabIndex={isEditing ? 0 : -1}
              className="w-full py-3 px-4 border rounded-md bg-transparent
                focus:outline-none focus:border-[var(--accent)]
                text-[var(--color-text-primary)] leading-relaxed
                placeholder:text-[var(--color-text-tertiary)]
                resize-none text-sm text-left"
              style={{
                borderColor: 'var(--color-border)',
                textTransform: 'none',
              }}
            />

            {/* Secondary Save pill — discoverable affordance under the textarea. */}
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
    </div>
  );
}

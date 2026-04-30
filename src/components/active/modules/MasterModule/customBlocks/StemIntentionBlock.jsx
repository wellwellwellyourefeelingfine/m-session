/**
 * StemIntentionBlock — Three independently-collapsible stem rows for the
 * intention-setting writing warm-up. Replaces the OLD module's separate
 * stems-education + stems-interactive pages with a single consolidated UI.
 *
 * Per row:
 *   - prefix     — DM Serif accent label (e.g. "Teach me…")
 *   - example    — italic muted body sentence demonstrating the stem
 *   - "Try it out" — small uppercase mono toggle (CirclePlusIcon ↔ CircleSkipIcon)
 *                    that reveals a single-line input below it
 *   - input      — single-line text field with the stem fragment as placeholder
 *
 * Drafts are LOCAL ONLY — never written to any store or journal. This is
 * intentional and matches OLD behavior: the warm-ups are a thinking aid,
 * not a captured response. The actual intention gets written on the
 * write-intention section (IntentionPromptBlock).
 *
 * The block calls neither `reportReady` nor `setPrimaryOverride` — Continue
 * is never gated regardless of whether the user expanded any rows or typed
 * anything (style sheet rule #6).
 *
 * Config:
 *   {
 *     type: 'stem-intention',
 *     stems: [
 *       { prefix: 'Teach me…', example: '...', placeholder: 'Teach me to…' },
 *       { prefix: 'Show me…',  example: '...', placeholder: 'Show me what…' },
 *       { prefix: 'Help me…',  example: '...', placeholder: 'Help me…' },
 *     ],
 *   }
 */

import { useState } from 'react';
import { CirclePlusIcon, CircleSkipIcon } from '../../../../shared/Icons';

export default function StemIntentionBlock({ block }) {
  const stems = block.stems || [];
  // Independent expand state per row. Drafts are also local.
  const [expanded, setExpanded] = useState(() => stems.map(() => false));
  const [drafts, setDrafts] = useState(() => stems.map(() => ''));

  const toggleRow = (i) => {
    setExpanded((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const setDraft = (i, value) => {
    setDrafts((prev) => prev.map((v, idx) => (idx === i ? value : v)));
  };

  return (
    <div className="space-y-6">
      {stems.map((stem, i) => {
        const Icon = expanded[i] ? CircleSkipIcon : CirclePlusIcon;
        return (
          <div key={i} className="space-y-2">
            <p
              className="text-[var(--accent)] text-lg leading-snug"
              style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
            >
              {stem.prefix}
            </p>
            {stem.example && (
              <p className="text-[var(--color-text-tertiary)] text-sm leading-relaxed italic">
                {stem.example}
              </p>
            )}

            <button
              type="button"
              onClick={() => toggleRow(i)}
              className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]
                hover:text-[var(--color-text-secondary)] transition-colors
                inline-flex items-center gap-2"
              aria-expanded={expanded[i]}
            >
              Try it out
              <Icon size={14} className="text-[var(--color-text-tertiary)]" />
            </button>

            <div
              className="overflow-hidden transition-all duration-300 ease-out"
              style={{
                maxHeight: expanded[i] ? '200px' : '0',
                opacity: expanded[i] ? 1 : 0,
              }}
            >
              <div className="pt-2">
                <input
                  type="text"
                  value={drafts[i]}
                  onChange={(e) => setDraft(i, e.target.value)}
                  placeholder={stem.placeholder}
                  maxLength={120}
                  className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                    focus:outline-none focus:border-[var(--accent)]
                    text-[var(--color-text-primary)] text-sm
                    placeholder:text-[var(--color-text-tertiary)]"
                  style={{ textTransform: 'none' }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

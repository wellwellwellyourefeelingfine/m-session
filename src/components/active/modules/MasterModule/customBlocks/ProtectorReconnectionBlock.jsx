/**
 * ProtectorReconnectionBlock — Part 2 reconnect screen.
 *
 * Subscribes to sessionProfile.protector. Two render branches:
 *
 *   (1) Welcome panel — when Part 1 was completed: shows the saved name,
 *       description, body location, and message in accent color, leading
 *       into the deeper Part 2 work.
 *
 *   (2) Fallback inline form — when no name is saved: lets the user enter
 *       a name + description on the spot. Writes via updateProtector so
 *       Part 2's other screens (with {protectorName} substitution) and
 *       the journal entry have a value to reference.
 *
 * Continue is NEVER gated — physical-journal-compatible, per
 * MasterModuleStyleSheet.md §1 rule 6. If no name is entered, downstream
 * Part 2 token substitution falls back to "your protector" via
 * getProtectorName().
 *
 * Config:
 *   { type: 'protector-reconnection' }
 *   No required fields — the block reads everything from the store.
 */

import { useState } from 'react';
import { useSessionStore } from '../../../../../stores/useSessionStore';

export default function ProtectorReconnectionBlock() {
  const protector = useSessionStore((s) => s.sessionProfile?.protector);
  const updateProtector = useSessionStore((s) => s.updateProtector);

  // Lock the render branch (welcome vs fallback form) to whatever the store
  // had AT MOUNT. Without this, typing into the fallback form would cause
  // the first keystroke to populate sessionProfile.protector.name, the
  // derived hasPart1Data would flip true, and the textarea would unmount
  // mid-edit. Lazy useState initializer captures the value once on first
  // render and never updates after — same effect as a ref but lint-clean.
  const [hasPart1Data] = useState(() => (protector?.name?.trim() || '').length > 0);

  // Local draft state for the fallback form. Initialized from any partial
  // store data so back-nav into the section doesn't lose the entry.
  const [draftName, setDraftName] = useState(protector?.name || '');
  const [draftDescription, setDraftDescription] = useState(protector?.description || '');

  // Persist fallback inputs on change so the saved store reflects what the
  // user has typed, even if they navigate away mid-edit. The store is
  // local Zustand and writes are cheap — keystroke writes are fine.
  const handleNameChange = (value) => {
    setDraftName(value);
    updateProtector('name', value);
  };

  const handleDescriptionChange = (value) => {
    setDraftDescription(value);
    updateProtector('description', value);
  };

  if (hasPart1Data) {
    return (
      <div className="space-y-4">
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          Earlier, you met a protector. You called it:
        </p>
        <p className="text-[var(--accent)] text-base leading-relaxed">
          {protector.name}
        </p>

        {protector.description?.trim() && (
          <>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              You described it as:
            </p>
            <p className="text-[var(--accent)] text-sm leading-relaxed italic">
              {protector.description}
            </p>
          </>
        )}

        {protector.bodyLocation?.trim() && (
          <>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              You felt it in your body:
            </p>
            <p className="text-[var(--accent)] text-sm leading-relaxed">
              {protector.bodyLocation}
            </p>
          </>
        )}

        {protector.message?.trim() && (
          <>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              You said to it:
            </p>
            <p className="text-[var(--accent)] text-sm leading-relaxed">
              {protector.message}
            </p>
          </>
        )}

        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed pt-2">
          Now we're going to go deeper. Not to fix anything, just to understand where it came from, what it&rsquo;s protecting, and what it might need from you.
        </p>
      </div>
    );
  }

  // Fallback: no Part 1 data. Inline naming form, styled per the master-
  // module convention — DM Serif prompt directly above each input rather
  // than a small uppercase-caps label. See MasterModuleStyleSheet.md §4.
  return (
    <div className="space-y-4">
      <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
        Part 1 wasn&rsquo;t completed in this session. We&rsquo;ll do a quick version of the naming step here so you can continue.
      </p>
      <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
        Everyone carries protectors — patterns that formed to keep you safe. An inner critic, a need for control, a habit of shutting down, a reflex to reach for distraction.
      </p>

      <div className="space-y-3 pt-2">
        <p
          className="text-base text-[var(--color-text-primary)]"
          style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
        >
          In a word or short phrase, what would you call your protector?
        </p>
        <input
          type="text"
          value={draftName}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g., The Critic, The Wall, The Fixer..."
          maxLength={80}
          className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
            focus:outline-none focus:border-[var(--accent)]
            text-[var(--color-text-primary)] text-sm text-center
            placeholder:text-[var(--color-text-tertiary)]"
          style={{ textTransform: 'none' }}
        />
      </div>

      <div className="space-y-3 pt-2">
        <p
          className="text-base text-[var(--color-text-primary)]"
          style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
        >
          Briefly describe what it does or how it shows up.
        </p>
        <textarea
          value={draftDescription}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="e.g., It pushes me to be perfect so no one can criticize me first..."
          rows={2}
          className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
            focus:outline-none focus:border-[var(--accent)]
            text-[var(--color-text-primary)] text-sm leading-relaxed
            placeholder:text-[var(--color-text-tertiary)] resize-none"
          style={{ textTransform: 'none' }}
        />
      </div>
    </div>
  );
}

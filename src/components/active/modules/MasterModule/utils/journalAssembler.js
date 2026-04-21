/**
 * journalAssembler
 *
 * Builds a journal entry text string from collected module responses.
 * Always includes prompt questions the user saw (based on conditions), even if
 * they didn't type anything — marks unanswered prompts with "no entry" + timestamp
 * to support users who journal physically.
 *
 * Core block types captured: `prompt`, `selector`.
 * Transition-aware block types captured (when `storeState` is provided):
 *   `body-check-in`, `ingestion-time`, `store-display`.
 *
 * Any block can override its label in the journal via `journalLabel: 'Touchstone'`.
 * The assembler auto-appends a colon to journalLabel-derived labels; prompts with
 * their own natural `prompt` text (e.g. "What brings you here?") render as-is.
 *
 * Dedupe: `store-display` is suppressed if a `prompt` with a matching `storeField`
 * was also emitted, so values like `sessionProfile.holdingQuestion` appear exactly
 * once regardless of how many screens display them.
 *
 * @param {object} params
 * @param {string} params.titlePrefix
 * @param {object[]} params.allScreens - Flat array of all blocks across all sections
 * @param {object} params.responses
 * @param {object} params.selectorValues
 * @param {object} params.selectorJournals
 * @param {object} [params.conditionContext] - { choiceValues, selectorValues, visitedSections, storeState, sessionData }
 * @param {object} [params.storeState] - Full session store snapshot (needed for transition block types)
 * @returns {string} Formatted journal entry text
 */

import evaluateCondition from './evaluateCondition';
import { sensationLabelById, PHASE_LABELS } from '../../../../../content/transitions/somaticSensations';

export function assembleJournalEntry({
  titlePrefix = 'MODULE',
  allScreens = [],
  responses = {},
  selectorValues = {},
  selectorJournals = {},
  conditionContext = null,
  storeState = null,
}) {
  let content = `${titlePrefix}\n`;

  const now = new Date();
  const timestamp = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  // ── Helpers ───────────────────────────────────────────────────────────────

  const isVisible = (block) => {
    if (block.sectionId && conditionContext?.visitedSections) {
      if (!conditionContext.visitedSections.includes(block.sectionId)) return false;
    }
    if (block.condition && conditionContext) {
      if (!evaluateCondition(block.condition, conditionContext)) return false;
    }
    return true;
  };

  // Pass 1: collect storeField paths that WILL be emitted via prompt blocks.
  // Used to suppress redundant `store-display` blocks reading the same value.
  const emittedViaPrompts = new Set();
  allScreens.forEach((block) => {
    if (!isVisible(block)) return;
    if (block.type === 'prompt' && block.storeField) {
      emittedViaPrompts.add(block.storeField);
    }
  });

  // Track storeKeys emitted from store-display so we don't emit the same
  // store value twice when the same display appears on multiple screens.
  const emittedStoreKeys = new Set();

  // Dedupe emitters for block types that can repeat in progressive-reveal
  // sections (same object reference appearing across multiple screens to
  // build the reveal). Without these sets, each appearance would print its
  // prompt/question + response again.
  const emittedPromptIndices = new Set();
  const emittedSelectorKeys = new Set();
  const emittedBodyCheckInPhases = new Set();

  // ── Pass 2: emit content ──────────────────────────────────────────────────

  allScreens.forEach((block) => {
    if (!isVisible(block)) return;

    if (block.type === 'prompt') {
      if (emittedPromptIndices.has(block.promptIndex)) return;
      emittedPromptIndices.add(block.promptIndex);

      // Label: prompt text if present, else journalLabel (with auto colon), else skip label line.
      const naturalLabel = block.prompt;
      const overrideLabel = block.journalLabel ? `${block.journalLabel}:` : '';
      const label = naturalLabel || overrideLabel;
      if (label) content += `\n${label}\n`;
      if (responses[block.promptIndex]?.trim()) {
        content += `${responses[block.promptIndex].trim()}\n`;
      } else {
        content += `[no entry — ${timestamp}]\n`;
      }
      return;
    }

    if (block.type === 'selector') {
      if (emittedSelectorKeys.has(block.key)) return;
      emittedSelectorKeys.add(block.key);

      const label = block.prompt || (block.journalLabel ? `${block.journalLabel}:` : '');
      if (label) content += `\n${label}\n`;
      const selected = selectorValues[block.key];
      if (selected) {
        if (Array.isArray(selected)) {
          const labels = selected.map(
            (id) => block.options.find((o) => o.id === id)?.label || id
          );
          content += `${labels.join(', ')}\n`;
        } else {
          const lbl = block.options.find((o) => o.id === selected)?.label || selected;
          content += `${lbl}\n`;
        }
      }
      if (block.journal && selectorJournals[block.key]?.trim()) {
        content += `${selectorJournals[block.key].trim()}\n`;
      }
      return;
    }

    // ── Transition-aware block types (require storeState) ───────────────────

    if (block.type === 'body-check-in' && storeState) {
      if (block.mode === 'comparison') return;  // read-only overlay, no data to log
      const phase = block.phase || 'opening';
      if (emittedBodyCheckInPhases.has(phase)) return;
      const selected = storeState?.transitionData?.somaticCheckIns?.[phase];
      if (!Array.isArray(selected) || selected.length === 0) return;
      emittedBodyCheckInPhases.add(phase);
      const labels = selected.map(sensationLabelById);
      const defaultLabel = `Body sensations (${PHASE_LABELS[phase] || phase})`;
      const label = block.journalLabel ? block.journalLabel : defaultLabel;
      content += `\n${label}:\n${labels.join(', ')}\n`;
      return;
    }

    if (block.type === 'ingestion-time' && storeState) {
      // Only emit from the `record` block — `confirm` reads the same value.
      if (block.mode && block.mode !== 'record') return;
      const time = storeState?.substanceChecklist?.ingestionTime;
      if (!time) return;
      const formatted = new Date(time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const label = block.journalLabel || 'Substance taken at';
      content += `\n${label}: ${formatted}\n`;
      return;
    }

    if (block.type === 'store-display' && storeState) {
      const key = block.storeKey;
      if (!key) return;
      // Dedupe: suppress if a prompt already captures this path, or if we
      // already emitted the same store-display earlier in the walk.
      if (emittedViaPrompts.has(key) || emittedStoreKeys.has(key)) return;
      const value = resolvePath(key, storeState);
      if (value == null || value === '') return;
      const label = block.journalLabel || defaultLabelFromStoreKey(key);
      content += `\n${label}:\n${value}\n`;
      emittedStoreKeys.add(key);
      return;
    }

    // `touchstone-prompt` writes directly to a store path (block.storeField)
    // rather than into the local `responses` map, so it needs its own emit.
    // Matches the physical-journal-friendly pattern: the label always prints,
    // and an empty value gets the `[no entry — time]` placeholder.
    if (block.type === 'touchstone-prompt' && storeState) {
      const key = block.storeField;
      if (!key) return;
      if (emittedStoreKeys.has(key)) return;
      emittedStoreKeys.add(key);

      const label = block.journalLabel
        ? `${block.journalLabel}:`
        : defaultLabelFromStoreKey(key) + ':';
      content += `\n${label}\n`;

      const value = resolvePath(key, storeState);
      if (value != null && String(value).trim() !== '') {
        content += `${String(value).trim()}\n`;
      } else {
        content += `[no entry — ${timestamp}]\n`;
      }
      return;
    }
  });

  return content.trim();
}

// ── Utilities ────────────────────────────────────────────────────────────────

function resolvePath(path, root) {
  const parts = path.split('.');
  let value = root;
  for (const part of parts) {
    if (value == null || typeof value !== 'object') return undefined;
    value = value[part];
  }
  return value;
}

// Fallback label for store-display when no `journalLabel` is provided.
// Derives a readable label from the final dot-path segment (e.g.
// 'sessionProfile.holdingQuestion' → 'Holding question'). Content authors
// should set `journalLabel` explicitly for any user-facing field.
function defaultLabelFromStoreKey(key) {
  const last = key.split('.').pop() || key;
  // camelCase → space-separated words, first letter capitalised
  const spaced = last.replace(/([A-Z])/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

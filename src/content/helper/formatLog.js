/**
 * Format a Helper Modal interaction as a journal entry string.
 * Fields are omitted when null/undefined.
 *
 * Journal entries are only created when the user actually acts on a category:
 * either by tapping an activity suggestion or by tapping an emergency contact
 * action button (Call/Text on the saved contact, 911/112, or Fireside Project).
 * Browsing categories and trying out ratings without committing to anything
 * does not produce a journal entry.
 *
 * V5 format: in addition to the category, the entry now lists every triage
 * step the user passed through (rating + choice answers) and the phase window
 * they were in at the time, so the journal preserves the full path that led
 * to the chosen activity.
 *
 *   HELPER MODAL
 *
 *   Category: Trauma
 *   Vividness: 6/10
 *   Dual awareness: Somewhat
 *   Phase window: Peak (~95 min)
 *   Activity chosen: Short Grounding
 */

const PHASE_WINDOW_LABELS = {
  'pre-onset': 'Pre-onset',
  'come-up': 'Come-up',
  'early-peak': 'Early peak',
  peak: 'Peak',
  'late-session': 'Late session',
  'post-session': 'Post-session',
};

/**
 * Walk a category's `steps` array against a `triageState` object and emit
 * `[{ label, value }]` pairs in the order the user encountered them.
 *
 * Steps are skipped when:
 *   - The step is a `result` step (no user input to log)
 *   - The step has a `showWhen` predicate that returns false
 *   - The step's id is missing from triageState (the user backed out before answering)
 *
 * Labels come from each step's `journalLabel` field (short noun, e.g.
 * "Vividness") or fall back to a truncated version of the prompt.
 * Values: rating steps render as `${value}/10`; choice steps render the
 * matched option's `label` (or the raw value as a fallback).
 */
export function buildStepResponses(category, triageState) {
  if (!category?.steps || !triageState) return [];
  const responses = [];
  for (const step of category.steps) {
    if (step.type === 'result') continue;
    if (step.showWhen && !step.showWhen(triageState)) continue;
    const value = triageState[step.id];
    if (value === null || value === undefined) continue;
    const label = step.journalLabel || step.prompt || step.id;

    if (step.type === 'rating') {
      responses.push({ label, value: `${value}/10` });
    } else if (step.type === 'choice') {
      const matched = step.options?.find((opt) => opt.value === value);
      responses.push({ label, value: matched?.label || String(value) });
    }
  }
  return responses;
}

export function formatHelperModalLog({
  categoryLabel,
  stepResponses,
  phaseWindow,
  minutesSinceIngestion,
  activityChosen,
  emergencyActionTaken,
}) {
  const lines = ['HELPER MODAL'];
  lines.push('');

  if (categoryLabel) {
    lines.push(`Category: ${categoryLabel}`);
  }

  if (Array.isArray(stepResponses)) {
    for (const { label, value } of stepResponses) {
      lines.push(`${label}: ${value}`);
    }
  }

  if (phaseWindow) {
    const phaseLabel = PHASE_WINDOW_LABELS[phaseWindow] || phaseWindow;
    const minutesPart =
      minutesSinceIngestion !== null && minutesSinceIngestion !== undefined
        ? ` (~${minutesSinceIngestion} min)`
        : '';
    lines.push(`Phase window: ${phaseLabel}${minutesPart}`);
  }

  if (activityChosen) {
    lines.push(`Activity chosen: ${activityChosen}`);
  }

  if (emergencyActionTaken) {
    lines.push(`Emergency action: ${emergencyActionTaken}`);
  }

  return lines.join('\n');
}

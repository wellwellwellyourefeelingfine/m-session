/**
 * Somatic Sensations — single source of truth for the body-check-in options.
 *
 * Consumed by:
 *   - BodyCheckInBlock (rendering the sensation grid + comparison view)
 *   - journalAssembler (resolving IDs to labels when writing session journal entries)
 *
 * 10 options in a 2×5 grid + 1 full-width "Something I can't name" button.
 */

export const SENSATIONS = [
  { id: 'warmth', label: 'Warmth' },
  { id: 'tingling', label: 'Tingling' },
  { id: 'openness', label: 'Openness' },
  { id: 'lightness', label: 'Lightness' },
  { id: 'energy', label: 'Energy' },
  { id: 'softness', label: 'Softness' },
  { id: 'heaviness', label: 'Heaviness' },
  { id: 'stillness', label: 'Stillness' },
  { id: 'expansion', label: 'Expansion' },
  { id: 'tension', label: 'Tension' },
];

export const UNNAMED_SENSATION = { id: 'unnamed', label: "Something I can't name" };

// Phase → user-facing label for the "Body sensations (Opening)" journal header
// and the comparison-mode legend. "integration" is labelled "Synthesis" in the UI.
export const PHASE_LABELS = {
  opening: 'Opening',
  peak: 'Peak',
  integration: 'Synthesis',
  closing: 'Closing',
};

// Resolve a sensation ID to its display label. Handles the unnamed option too.
export function sensationLabelById(id) {
  if (id === UNNAMED_SENSATION.id) return UNNAMED_SENSATION.label;
  return SENSATIONS.find((s) => s.id === id)?.label || id;
}

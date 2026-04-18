/**
 * BodyCheckInBlock — Body sensation check-in, with select + comparison modes.
 *
 * Config:
 *   // Select mode (default):
 *   { type: 'body-check-in', phase: 'opening', prompt: '...', instruction: '...' }
 *
 *   // Comparison mode:
 *   { type: 'body-check-in', mode: 'comparison',
 *     comparisonPhases: ['opening', 'peak'] }
 *
 * Visual spec: each cell is a fixed-height box with a label region on top
 * and a strip region below. Strips are vertical columns arranged left-to-right
 * (leftmost = earliest phase, highest opacity). Empty strips are truly
 * transparent; 1px inter-column separator delineates phases regardless of fill.
 * Sequential fade-in animation (150ms per column).
 */

import { useEffect, useMemo, useState } from 'react';
import { useSessionStore } from '../../../../stores/useSessionStore';

// ── Sensation options (10 + "Something I can't name") ──────────────────────
const SENSATIONS = [
  { id: 'warmth', label: 'Warmth' },
  { id: 'tingling', label: 'Tingling' },
  { id: 'openness', label: 'Openness' },
  { id: 'lightness', label: 'Lightness' },
  { id: 'energy', label: 'Energy' },
  { id: 'softness', label: 'Softness' },
  { id: 'heaviness', label: 'Heaviness' },
  { id: 'stillness', label: 'Stillness' },
  { id: 'expansion', label: 'Expansion' },
];

const UNNAMED_SENSATION = { id: 'unnamed', label: "Something I can't name" };

// ── Opacity tiers by phase count (leftmost = earliest = lightest,
//                                   rightmost = latest = darkest).
// Earlier phases feel fainter/more layered; the current/newest sits in
// full presence. Fixed arrays per N for visual balance — linear scaling
// felt too subtle at N=2.
const OPACITY_TIERS = {
  1: [0.75],
  2: [0.30, 0.75],
  3: [0.25, 0.50, 0.75],
  4: [0.20, 0.40, 0.60, 0.75],
};

// ── Phase labels for the legend ────────────────────────────────────────────
const PHASE_LABELS = {
  'opening': 'Opening',
  'peak': 'Peak',
  'integration': 'Synthesis',    // user-facing name
  'closing': 'Closing',
};

export default function BodyCheckInBlock({ block, context }) {
  const mode = block.mode || 'select';
  if (mode === 'comparison') {
    return <ComparisonMode block={block} />;
  }
  return <SelectMode block={block} context={context} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECT MODE
// ─────────────────────────────────────────────────────────────────────────────

function SelectMode({ block }) {
  const phase = block.phase || 'opening';
  const selected = useSessionStore((s) => s.transitionData?.somaticCheckIns?.[phase] || []);
  const updateTransitionData = useSessionStore((s) => s.updateTransitionData);

  const toggle = (sensationId) => {
    const next = selected.includes(sensationId)
      ? selected.filter((id) => id !== sensationId)
      : [...selected, sensationId];
    updateTransitionData(`somaticCheckIns.${phase}`, next);
  };

  return (
    <div className="space-y-4">
      {block.prompt && (
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed text-center">
          {block.prompt}
        </p>
      )}
      {block.instruction && (
        <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider text-center">
          {block.instruction}
        </p>
      )}

      {/* Main 10-option grid */}
      <div className="grid grid-cols-2 gap-2">
        {SENSATIONS.map((s) => (
          <SensationButton
            key={s.id}
            label={s.label}
            isSelected={selected.includes(s.id)}
            onClick={() => toggle(s.id)}
          />
        ))}
      </div>

      {/* 11th full-width option */}
      <SensationButton
        label={UNNAMED_SENSATION.label}
        isSelected={selected.includes(UNNAMED_SENSATION.id)}
        onClick={() => toggle(UNNAMED_SENSATION.id)}
        fullWidth
      />
    </div>
  );
}

function SensationButton({ label, isSelected, onClick, fullWidth = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-3 px-3 border transition-colors duration-150 ${
        fullWidth ? 'w-full' : ''
      } ${
        isSelected
          ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
          : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-text-tertiary)]'
      }`}
    >
      <span className="text-xs uppercase tracking-wider">{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPARISON MODE
// ─────────────────────────────────────────────────────────────────────────────

function ComparisonMode({ block }) {
  const comparisonPhases = block.comparisonPhases || [];
  const checkIns = useSessionStore((s) => s.transitionData?.somaticCheckIns || {});

  // Build per-phase data with opacity. Opacity scales with position so the
  // oldest phase is faintest and the current/newest is most solid.
  const tierScale = OPACITY_TIERS[comparisonPhases.length] || OPACITY_TIERS[4];
  const phaseData = comparisonPhases.map((phase, i) => ({
    phase,
    label: PHASE_LABELS[phase] || phase,
    selected: checkIns[phase] || [],
    opacity: tierScale[i] ?? 0.75,
  }));

  // Sequential reveal animation — longer duration + bigger stagger than the
  // first pass so the "layering in over time" metaphor reads clearly.
  // Per-column fade = 600ms, stagger = 400ms between columns.
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    const timers = [];
    phaseData.forEach((_, i) => {
      timers.push(setTimeout(() => setRevealed(i + 1), i * 400 + 200));
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparisonPhases.length]);

  // Is the grid entirely empty across all phases?
  const hasAnyData = useMemo(() =>
    phaseData.some((p) => p.selected.length > 0),
    [phaseData]
  );

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex justify-center gap-4 flex-wrap">
        {phaseData.map((p, i) => (
          <div key={p.phase} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 border border-[var(--color-border)]"
              style={{
                backgroundColor: 'var(--accent)',
                opacity: revealed > i ? p.opacity : 0,
                transition: 'opacity 600ms ease-out',
              }}
            />
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
              {p.label}
            </span>
          </div>
        ))}
      </div>

      {/* Main 10-option comparison grid */}
      <div className="grid grid-cols-2 gap-2">
        {SENSATIONS.map((s) => (
          <ComparisonCell
            key={s.id}
            label={s.label}
            phases={phaseData}
            sensationId={s.id}
            revealed={revealed}
          />
        ))}
      </div>

      {/* 11th full-width "Something I can't name" */}
      <ComparisonCell
        label={UNNAMED_SENSATION.label}
        phases={phaseData}
        sensationId={UNNAMED_SENSATION.id}
        revealed={revealed}
        fullWidth
      />

      {!hasAnyData && (
        <p className="text-[var(--color-text-tertiary)] text-xs italic text-center">
          (No sensations were recorded in earlier check-ins.)
        </p>
      )}
    </div>
  );
}

function ComparisonCell({ label, phases, sensationId, revealed, fullWidth = false }) {
  return (
    <div
      className={`relative py-3 px-3 border border-[var(--color-border)] overflow-hidden ${
        fullWidth ? 'w-full' : ''
      }`}
    >
      {/* Invisible placeholder — forces the cell to match select-mode height exactly */}
      <span className="text-xs uppercase tracking-wider block text-center invisible">
        {label}
      </span>

      {/* Label — sits beneath the strip overlay, visible through empty columns */}
      <span
        className="absolute inset-0 flex items-center justify-center
          text-xs uppercase tracking-wider text-[var(--color-text-primary)] px-3"
      >
        {label}
      </span>

      {/* Strip overlay — vertical columns, left = earliest phase, accent fill
          covers the label underneath at each phase's opacity */}
      <div className="absolute inset-0 flex pointer-events-none">
        {phases.map((p, i) => {
          const isSelected = p.selected.includes(sensationId);
          const showFill = revealed > i;
          return (
            <div
              key={p.phase}
              className="flex-1"
              style={{
                backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                opacity: showFill && isSelected ? p.opacity : 0,
                transition: 'opacity 600ms ease-out',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

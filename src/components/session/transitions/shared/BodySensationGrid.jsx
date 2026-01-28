/**
 * BodySensationGrid Component
 * 3x3 multi-select grid for body sensation selection during peak transition
 * Plus an additional full-width "Something I can't name" option
 */

import { BODY_SENSATIONS, UNNAMED_SENSATION } from '../content/peakTransitionContent';

export default function BodySensationGrid({ selected = [], onChange }) {
  const toggleSensation = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-3">
      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-2">
        {BODY_SENSATIONS.map((sensation) => {
          const isSelected = selected.includes(sensation.id);
          return (
            <button
              key={sensation.id}
              type="button"
              onClick={() => toggleSensation(sensation.id)}
              className={`py-3 px-2 border transition-colors duration-150 text-center ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
                  : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              <span className="uppercase tracking-wider text-xs">
                {sensation.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Unnamed option - full width */}
      <button
        type="button"
        onClick={() => toggleSensation(UNNAMED_SENSATION.id)}
        className={`w-full py-3 px-4 border transition-colors duration-150 text-center ${
          selected.includes(UNNAMED_SENSATION.id)
            ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
            : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)]'
        }`}
      >
        <span className="uppercase tracking-wider text-xs">
          {UNNAMED_SENSATION.label}
        </span>
      </button>
    </div>
  );
}

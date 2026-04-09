/**
 * RatingScale
 * 0-10 bubble scale matching the Life Graph milestone rating pattern.
 * Selected button uses the primary text color (filled), unselected uses border-only.
 *
 * Optional props:
 *   - dimmed: when true, unselected bubbles render at ~30% opacity. Used by
 *     the V5 triage runner for "completed but still editable" rating steps.
 *     The selected bubble keeps its full styling. All bubbles remain tappable.
 *   - lowLabel / highLabel: override the default "Not at all" / "Extremely"
 *     labels under the scale.
 */

export default function RatingScale({
  value,
  onChange,
  dimmed = false,
  lowLabel = 'Not at all',
  highLabel = 'Extremely',
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-1">
        {Array.from({ length: 11 }, (_, i) => {
          const isSelected = value === i;
          // Unselected bubbles fade to 30% opacity when the parent has marked
          // this scale as "completed but editable". The selected bubble stays
          // full opacity so the user's choice remains visually anchored.
          const opacity = dimmed && !isSelected ? 0.3 : 1;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className={`w-8 h-8 rounded-full border-2 transition-opacity transition-colors flex items-center justify-center text-[10px] ${
                isSelected
                  ? 'bg-[var(--color-text-primary)] border-[var(--color-text-primary)] text-[var(--color-bg)]'
                  : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-tertiary)]'
              }`}
              style={{ opacity }}
            >
              {i}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between">
        <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
          {lowLabel}
        </span>
        <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
          {highLabel}
        </span>
      </div>
    </div>
  );
}

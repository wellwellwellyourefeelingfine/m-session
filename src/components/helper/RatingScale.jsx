/**
 * RatingScale
 * 0-10 bubble scale matching the Life Graph milestone rating pattern.
 * Selected button uses the primary text color (filled), unselected uses border-only.
 */

export default function RatingScale({ value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-1">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={`w-8 h-8 rounded-full border-2 transition-colors flex items-center justify-center text-[10px] ${
              value === i
                ? 'bg-[var(--color-text-primary)] border-[var(--color-text-primary)] text-[var(--color-bg)]'
                : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-tertiary)]'
            }`}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="flex justify-between">
        <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
          Not at all
        </span>
        <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
          Extremely
        </span>
      </div>
    </div>
  );
}

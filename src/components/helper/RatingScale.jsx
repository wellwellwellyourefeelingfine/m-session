/**
 * RatingScale
 * 0-10 bubble scale matching the Life Graph milestone rating pattern.
 * Triggers onChange after selection with a brief delay.
 */

export default function RatingScale({ value, onChange }) {
  const handleSelect = (rating) => {
    onChange(rating);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-1.5 flex-wrap">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSelect(i)}
            className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs transition-colors duration-75"
            style={{
              borderColor: value === i ? 'var(--accent)' : 'var(--color-border)',
              backgroundColor: value === i ? 'var(--accent)' : 'transparent',
              color: value === i ? 'var(--bg-primary)' : 'var(--color-text-tertiary)',
            }}
          >
            {i}
          </button>
        ))}
      </div>
      <div className="flex justify-between px-1">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          Not at all
        </span>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          Extremely
        </span>
      </div>
    </div>
  );
}

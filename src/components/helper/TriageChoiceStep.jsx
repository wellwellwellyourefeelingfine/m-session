/**
 * TriageChoiceStep
 * Renders a single triage choice step: prompt + a vertical stack of single-select
 * option cards. Used by TriageStepRunner inside the V5 helper modal flow.
 *
 * Visual states:
 *   - Active (no value yet): all cards full opacity, tappable
 *   - Completed (value committed): selected card keeps highlighted border + accent bg,
 *     unselected cards fade to 30% opacity. ALL cards remain tappable so the user
 *     can scroll up and change their mind, which triggers the runner's
 *     retroactive-edit flow.
 *
 * Selection auto-advances after a 400ms delay so the user sees their selection
 * register before the next step fades in. This matches the existing rating
 * scale's interaction pattern.
 */

export default function TriageChoiceStep({
  prompt,
  options,
  value,
  onChange,
  isCompleted = false,
}) {
  return (
    <div className="space-y-4">
      {/* Prompt — same DM Serif Text style as the rating prompt */}
      <p
        className="text-lg leading-snug"
        style={{
          fontFamily: "'DM Serif Text', serif",
          textTransform: 'none',
          color: 'var(--color-text-primary)',
        }}
      >
        {prompt}
      </p>

      {/* Option cards */}
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = value === option.value;
          // When the step is completed and this card is NOT the selected one,
          // dim it to 30% so the user's chosen path stays visually anchored.
          // The card stays tappable in all states.
          const opacity = isCompleted && !isSelected ? 0.3 : 1;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              role="radio"
              aria-checked={isSelected}
              className="w-full text-left border rounded-md px-4 py-3 transition-opacity transition-colors"
              style={{
                borderColor: isSelected ? 'var(--accent)' : 'var(--color-border)',
                backgroundColor: isSelected ? 'var(--accent-bg)' : 'transparent',
                color: 'var(--color-text-primary)',
                opacity,
                minHeight: '44px',
              }}
            >
              <span className="text-sm">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

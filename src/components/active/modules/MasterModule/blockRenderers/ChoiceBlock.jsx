/**
 * ChoiceBlock — Selection checkpoint
 *
 * Renders a prompt + list of options. User selects one, then clicks Continue.
 * If the option has a `route`, ScreensSection handles the cross-section routing.
 * If no route, the selection is just saved for conditional rendering.
 */

export default function ChoiceBlock({ screen, selectedValue, onChoiceSelect }) {
  return (
    <div className="space-y-4">
      {screen.context && (
        <p className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider leading-relaxed">
          {screen.context}
        </p>
      )}

      <p
        className="text-lg text-[var(--color-text-primary)]"
        style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
      >
        {screen.prompt}
      </p>

      <div className="space-y-2">
        {screen.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChoiceSelect(screen.key, option.id)}
            className={`w-full py-3 px-4 border transition-colors duration-150 text-left ${
              selectedValue === option.id
                ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
                : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-text-tertiary)]'
            }`}
          >
            <span className="text-xs uppercase tracking-wider">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

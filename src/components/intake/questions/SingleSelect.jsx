/**
 * SingleSelect Component
 * Radio-style single selection question
 */

export default function SingleSelect({ question, value, onChange }) {
  return (
    <div className="space-y-3">
      <p style={{ color: 'var(--text-primary)' }}>{question.label}</p>
      {question.description && (
        <p style={{ color: 'var(--text-tertiary)' }}>{question.description}</p>
      )}

      <div className="space-y-2">
        {question.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className="w-full text-left px-4 py-3 border transition-colors duration-150"
            style={{
              borderColor: value === option.value ? 'var(--text-primary)' : 'var(--border)',
              backgroundColor: value === option.value ? 'var(--text-primary)' : 'transparent',
              color: value === option.value ? 'var(--bg-primary)' : 'var(--text-primary)',
            }}
          >
            <span className="uppercase tracking-wider">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * MultiSelect Component
 * Checkbox-style multi-selection question
 */

export default function MultiSelect({ question, value = [], onChange }) {
  const toggleOption = (optionValue) => {
    const currentValues = value || [];
    if (currentValues.includes(optionValue)) {
      onChange(currentValues.filter(v => v !== optionValue));
    } else {
      onChange([...currentValues, optionValue]);
    }
  };

  return (
    <div className="space-y-3">
      <p style={{ color: 'var(--text-primary)' }}>{question.label}</p>
      {question.description && (
        <p style={{ color: 'var(--text-tertiary)' }}>{question.description}</p>
      )}

      <div className="space-y-2">
        {question.options.map((option) => {
          const isSelected = (value || []).includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              className="w-full text-left px-4 py-3 border transition-colors duration-150"
              style={{
                borderColor: isSelected ? 'var(--text-primary)' : 'var(--border)',
                backgroundColor: isSelected ? 'var(--text-primary)' : 'transparent',
                color: isSelected ? 'var(--bg-primary)' : 'var(--text-primary)',
              }}
            >
              <span className="uppercase tracking-wider">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

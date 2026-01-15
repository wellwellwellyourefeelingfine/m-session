/**
 * TextInput Component
 * Text input/textarea question
 */

export default function TextInput({ question, value = '', onChange, onContinue }) {
  const isMultiline = question.multiline;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isMultiline && onContinue) {
      onContinue();
    }
  };

  return (
    <div className="space-y-3">
      <p style={{ color: 'var(--text-primary)' }}>{question.label}</p>
      {question.description && (
        <p style={{ color: 'var(--text-tertiary)' }}>{question.description}</p>
      )}

      {isMultiline ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder || ''}
          rows={4}
          className="w-full px-4 py-3 border bg-transparent focus:outline-none transition-colors resize-none"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        />
      ) : (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={question.placeholder || ''}
          className="w-full px-4 py-3 border bg-transparent focus:outline-none transition-colors"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        />
      )}
    </div>
  );
}

/**
 * TimePicker Component
 * Time selection question
 */

export default function TimePicker({ question, value = '', onChange }) {
  return (
    <div className="space-y-3">
      <p style={{ color: 'var(--text-primary)' }}>{question.label}</p>
      {question.description && (
        <p style={{ color: 'var(--text-tertiary)' }}>{question.description}</p>
      )}

      <input
        type="time"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border bg-transparent focus:outline-none transition-colors"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-primary)',
        }}
      />
    </div>
  );
}

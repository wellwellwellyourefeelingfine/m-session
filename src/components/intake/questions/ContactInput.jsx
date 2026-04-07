/**
 * ContactInput Component
 * Two-field contact input (name + phone) for emergency contact details
 */

export default function ContactInput({ question, value, onChange, onContinue, dynamicNote }) {
  const contactValue = value || { name: '', phone: '' };

  const handleFieldChange = (field, fieldValue) => {
    onChange({ ...contactValue, [field]: fieldValue });
  };

  return (
    <div className="space-y-3">
      <p style={{ color: 'var(--text-primary)' }}>{question.label}</p>

      {question.contentBlocks && question.contentBlocks.map((block, i) => {
        if (block.type === 'spacer') {
          return <div key={i} className="flex justify-center"><div className="circle-spacer" /></div>;
        }
        return (
          <p key={i} style={{ color: block.color === 'grey' ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
            {block.text}
          </p>
        );
      })}

      {dynamicNote && (
        <>
          <div className="flex justify-center"><div className="circle-spacer" /></div>
          <p style={{ color: 'var(--text-secondary)' }}>{dynamicNote}</p>
        </>
      )}

      <div className="space-y-3">
        {question.inputs.map((input) => (
          <input
            key={input.field}
            type={input.inputMode === 'tel' ? 'tel' : 'text'}
            inputMode={input.inputMode || 'text'}
            value={contactValue[input.field] || ''}
            onChange={(e) => handleFieldChange(input.field, e.target.value)}
            placeholder={input.placeholder || ''}
            className="w-full px-4 py-3 border bg-transparent focus:outline-none transition-colors"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        ))}
      </div>

      {onContinue && (
        <button
          type="button"
          onClick={onContinue}
          className="w-full py-4 uppercase tracking-wider transition-opacity duration-300 mt-4"
          style={{
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-primary)',
          }}
        >
          Continue
        </button>
      )}
    </div>
  );
}

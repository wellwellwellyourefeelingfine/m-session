/**
 * ContactInput Component
 * Two-field contact input (name + phone) for emergency contact details.
 * Used in the intake flow. Notes can be added later via the helper modal.
 */

import { useState } from 'react';

export default function ContactInput({ question, value, onChange, onContinue }) {
  const [pressed, setPressed] = useState(false);
  const contactValue = value || { name: '', phone: '', notes: '' };

  const handleFieldChange = (field, fieldValue) => {
    onChange({ ...contactValue, [field]: fieldValue });
  };

  return (
    <div className="space-y-3">
      <p
        className="text-lg"
        style={{
          fontFamily: "'DM Serif Text', serif",
          textTransform: 'none',
          color: 'var(--text-primary)',
        }}
      >
        {question.label}
      </p>

      {question.contentBlocks && question.contentBlocks.map((block, i) => {
        if (block.type === 'spacer') {
          return <div key={i} aria-hidden="true" style={{ height: '6px' }} />;
        }
        return (
          <p key={i} style={{ color: block.color === 'grey' ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
            {block.text}
          </p>
        );
      })}

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
          onClick={() => { setPressed(true); onContinue(); }}
          className="w-full py-4 uppercase tracking-wider border transition-colors duration-300 mt-4"
          style={{
            backgroundColor: pressed ? 'var(--text-secondary)' : 'var(--text-primary)',
            color: 'var(--bg-primary)',
            borderColor: pressed ? 'var(--text-secondary)' : 'var(--text-primary)',
          }}
        >
          Continue
        </button>
      )}
    </div>
  );
}

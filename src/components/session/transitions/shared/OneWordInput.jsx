/**
 * OneWordInput Component
 * Single-line text input with character limit for capturing a word/phrase
 * Used in peak transition for the "one word" step
 */

export default function OneWordInput({
  value = '',
  onChange,
  placeholder = "A word for this moment...",
  maxLength = 30,
}) {
  const handleChange = (e) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                   focus:outline-none focus:border-[var(--accent)]
                   text-[var(--color-text-primary)] text-center
                   placeholder:text-[var(--color-text-tertiary)]"
      />
      <div className="text-right">
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}

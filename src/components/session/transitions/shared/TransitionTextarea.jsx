/**
 * TransitionTextarea Component
 * Styled textarea for use in transition flows (closing ritual, integration activities)
 */

export default function TransitionTextarea({
  value = '',
  onChange,
  placeholder = '',
  rows = 4,
  large = false,
  small = false,
}) {
  const actualRows = large ? 6 : small ? 2 : rows;

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={actualRows}
      className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                 focus:outline-none focus:border-[var(--accent)]
                 text-[var(--color-text-primary)] resize-none leading-relaxed
                 placeholder:text-[var(--color-text-tertiary)]"
    />
  );
}

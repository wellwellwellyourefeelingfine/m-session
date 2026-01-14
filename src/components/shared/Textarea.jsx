/**
 * Textarea Component
 * For journal entries and free-form writing
 * Minimal, no border, large comfortable text
 */

export default function Textarea({
  label,
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  rows = 6,
  className = '',
  ...props
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-xs uppercase tracking-wider text-app-gray-600 dark:text-app-gray-400">
          {label}
          {required && <span className="ml-1">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        className="w-full bg-transparent border-none text-lg leading-relaxed resize-none focus:outline-none disabled:opacity-50"
        {...props}
      />
    </div>
  );
}

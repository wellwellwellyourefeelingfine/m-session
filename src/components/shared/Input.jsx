/**
 * Input Component
 * Minimal underline-style input matching Co-Star aesthetic
 */

export default function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  disabled = false,
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
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full bg-transparent border-0 border-b border-app-gray-300 dark:border-app-gray-700 py-3 text-lg focus:outline-none focus:border-app-black dark:focus:border-app-white transition-colors duration-200 disabled:opacity-50"
        {...props}
      />
    </div>
  );
}

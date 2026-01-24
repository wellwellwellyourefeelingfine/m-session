/**
 * Button Component
 * Co-Star inspired - flat, monochrome, uppercase text, square corners
 * Variants: primary (solid), secondary (outlined), text (minimal)
 */

export default function Button({
  children,
  variant = 'primary',
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  ...props
}) {
  const baseStyles = 'touch-target uppercase tracking-wider text-sm transition-opacity duration-300 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[var(--color-text-primary)] text-[var(--color-bg)] px-8 py-4 hover:opacity-80',
    secondary: 'bg-transparent border border-[var(--color-text-primary)] text-[var(--color-text-primary)] px-8 py-4 hover:opacity-80',
    text: 'text-[var(--color-text-tertiary)] underline p-2 hover:opacity-70'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

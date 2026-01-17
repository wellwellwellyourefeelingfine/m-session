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
    primary: 'bg-app-black dark:bg-app-white text-app-white dark:text-app-black px-8 py-4 hover:opacity-80',
    secondary: 'bg-transparent border border-app-black dark:border-app-white text-app-black dark:text-app-white px-8 py-4 hover:opacity-80',
    text: 'text-app-gray-600 dark:text-app-gray-400 underline p-2 hover:opacity-70'
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

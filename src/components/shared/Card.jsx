/**
 * Card Component
 * Flat container with optional border
 * No rounded corners, no shadows - pure Co-Star aesthetic
 */

export default function Card({
  children,
  variant = 'filled',
  className = '',
  ...props
}) {
  const variants = {
    filled: 'bg-app-gray-50 dark:bg-app-gray-950',
    outlined: 'bg-transparent border border-app-gray-200 dark:border-app-gray-800',
    flat: 'bg-transparent'
  };

  return (
    <div
      className={`p-6 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

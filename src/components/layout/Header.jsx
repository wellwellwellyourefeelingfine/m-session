/**
 * Header Component
 * Top bar with app title and settings/dark mode toggle
 */

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-app-gray-200 dark:border-app-gray-800 z-40" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="h-full flex items-center justify-center px-6">
        {/* App Title - DM Serif Text */}
        <h1 className="font-serif text-2xl" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
          Session
        </h1>
      </div>
    </header>
  );
}

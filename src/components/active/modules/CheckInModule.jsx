/**
 * CheckInModule Component
 * Placeholder for check-in prompts during session
 */

export default function CheckInModule({ module, onComplete, onSkip }) {
  return (
    <div className="flex flex-col justify-between px-6 py-8">
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="text-center space-y-8 max-w-md mx-auto">
          <h2 className="text-[var(--color-text-primary)]">
            {module.title}
          </h2>

          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            {module.content?.instructions || 'How are you feeling right now?'}
          </p>

          <p className="text-[var(--color-text-tertiary)]">
            Check-in module - full implementation coming soon
          </p>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto mt-8 space-y-4">
        <button
          onClick={onComplete}
          className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)]
                     uppercase tracking-wider hover:opacity-80 transition-opacity duration-300"
        >
          Continue
        </button>

        <button
          onClick={onSkip}
          className="w-full py-2 text-[var(--color-text-tertiary)] underline"
        >
          Skip
        </button>
      </div>
    </div>
  );
}

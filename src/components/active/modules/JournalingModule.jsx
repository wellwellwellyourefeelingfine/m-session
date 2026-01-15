/**
 * JournalingModule Component
 * Placeholder for journaling/reflection activities
 */

export default function JournalingModule({ module, onComplete, onSkip }) {
  return (
    <div className="flex flex-col justify-between px-6 py-8">
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="text-center space-y-8 max-w-md mx-auto">
          <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
            {module.title}
          </h2>

          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            {module.content?.instructions || 'Take time to write and reflect.'}
          </p>

          {module.content?.prompts && (
            <div className="space-y-4 text-[var(--color-text-secondary)] italic">
              {module.content.prompts.map((prompt, index) => (
                <p key={index}>{prompt}</p>
              ))}
            </div>
          )}

          <p className="text-[var(--color-text-tertiary)]">
            Journaling module - full implementation coming soon
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

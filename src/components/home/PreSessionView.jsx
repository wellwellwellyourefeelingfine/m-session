/**
 * PreSessionView Component
 * Shows generated timeline preview before session starts
 * Allows user to review and start the session
 */

import { useSessionStore } from '../../stores/useSessionStore';

export default function PreSessionView() {
  const timeline = useSessionStore((state) => state.timeline);
  const startSession = useSessionStore((state) => state.startSession);
  const resetSession = useSessionStore((state) => state.resetSession);

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const totalDuration = timeline.reduce((sum, module) => sum + module.duration, 0);

  return (
    <div className="max-w-md mx-auto px-6 py-8">
      <h2 className="mb-2">Your Session Timeline</h2>
      <p className="text-[var(--color-text-secondary)] mb-8">
        Review your personalized timeline below. You can start when ready.
      </p>

      {/* Timeline preview */}
      <div className="space-y-3 mb-8">
        {timeline.map((module, index) => (
          <div
            key={module.id}
            className="flex items-center space-x-4 py-3 border-b border-[var(--color-border)]"
          >
            <div className="text-[var(--color-text-tertiary)] font-mono w-6">
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="text-[var(--color-text-primary)]">
                {module.title}
              </div>
              <div className="text-[var(--color-text-tertiary)]">
                {formatTime(module.duration)}
              </div>
            </div>
            <div className="text-[var(--color-text-tertiary)] uppercase tracking-wider">
              {module.type}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="p-4 border border-[var(--color-border)] mb-8">
        <div className="flex justify-between">
          <span className="text-[var(--color-text-tertiary)]">Total Duration</span>
          <span className="text-[var(--color-text-primary)]">{formatTime(totalDuration)}</span>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[var(--color-text-tertiary)]">Modules</span>
          <span className="text-[var(--color-text-primary)]">{timeline.length}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <p className="text-[var(--accent)] text-xs uppercase tracking-wider text-left leading-tight">
          Note: you&apos;ll be guided through everything, including when to take your substance. Don&apos;t take it yet. Press begin when you&apos;re ready.
        </p>
        <button
          onClick={startSession}
          className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)]
                     uppercase tracking-wider hover:opacity-80 transition-opacity duration-300"
        >
          Begin Session
        </button>

        <button
          onClick={resetSession}
          className="w-full py-2 text-[var(--color-text-tertiary)] underline"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}

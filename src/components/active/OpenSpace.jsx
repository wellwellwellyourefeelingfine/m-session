/**
 * OpenSpace Component
 * Shown when all modules in a phase are completed but time remains
 * Offers the user unstructured time or the option to add activities
 */

import { useSessionStore } from '../../stores/useSessionStore';

const PHASE_MESSAGES = {
  'come-up': {
    title: 'Open Space',
    message: 'You\'ve completed the scheduled activities for the come-up. Continue to rest and allow the experience to unfold naturally.',
    suggestion: 'Simply be present. There\'s nothing you need to do right now.',
  },
  peak: {
    title: 'Open Space',
    message: 'You\'ve completed your planned peak activities. Take this time to rest, listen to music, or follow your inner guidance.',
    suggestion: 'This is a time for open exploration. Trust what arises.',
  },
  integration: {
    title: 'Open Space',
    message: 'You\'ve completed your planned integration activities. Continue to rest and allow insights to settle.',
    suggestion: 'Consider journaling any final thoughts, or simply rest.',
  },
};

export default function OpenSpace({ phase }) {
  const getNextModule = useSessionStore((state) => state.getNextModule);
  const startModule = useSessionStore((state) => state.startModule);
  const transitionToIntegration = useSessionStore((state) => state.transitionToIntegration);
  const endSession = useSessionStore((state) => state.endSession);
  const getElapsedMinutes = useSessionStore((state) => state.getElapsedMinutes);
  const timeline = useSessionStore((state) => state.timeline);

  const elapsedMinutes = getElapsedMinutes();
  const minDuration = timeline.minDuration;
  const canEnd = elapsedMinutes >= minDuration;

  const nextModule = getNextModule();
  const phaseContent = PHASE_MESSAGES[phase] || PHASE_MESSAGES.integration;

  const handleContinueToNext = () => {
    if (nextModule) {
      startModule(nextModule.instanceId);
    }
  };

  const handleTransitionPhase = () => {
    if (phase === 'peak') {
      transitionToIntegration();
    }
  };

  const handleEndSession = () => {
    if (canEnd) {
      endSession();
    }
  };

  return (
    <div className="px-6 py-8 flex flex-col items-center justify-center">
      <div className="max-w-md text-center">
        <p className="uppercase tracking-widest text-[var(--color-text-tertiary)] mb-6">
          {phaseContent.title}
        </p>

        <p className="mb-8 text-[var(--color-text-primary)]">
          {phaseContent.message}
        </p>

        <p className="text-[var(--color-text-secondary)] mb-12">
          {phaseContent.suggestion}
        </p>

        <div className="space-y-4">
          {/* If there's a next module available */}
          {nextModule && (
            <button
              onClick={handleContinueToNext}
              className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors uppercase tracking-wider"
            >
              Continue to {nextModule.title}
            </button>
          )}

          {/* Phase transition button */}
          {phase === 'peak' && (
            <button
              onClick={handleTransitionPhase}
              className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors uppercase tracking-wider"
            >
              Move to Integration Phase
            </button>
          )}

          {/* End session button (only if minimum time reached) */}
          {phase === 'integration' && (
            <button
              onClick={handleEndSession}
              disabled={!canEnd}
              className={`w-full py-4 border transition-colors uppercase tracking-wider ${
                canEnd
                  ? 'border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-tertiary)] cursor-not-allowed'
              }`}
            >
              {canEnd ? 'End Session' : `End Session (available in ${minDuration - elapsedMinutes}m)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ModuleRenderer Component
 * Renders different module types based on module.libraryId or type
 * Routes to appropriate module component
 */

import { useSessionStore } from '../../stores/useSessionStore';
import { getModuleById } from '../../content/modules';
import GroundingModule from './modules/GroundingModule';
import JournalingModule from './modules/JournalingModule';
import MeditationModule from './modules/MeditationModule';
import OpenSpaceModule from './modules/OpenSpaceModule';
import CheckInModule from './modules/CheckInModule';
import BreathingModule from './modules/BreathingModule';

export default function ModuleRenderer({ module }) {
  const completeModule = useSessionStore((state) => state.completeModule);
  const skipModule = useSessionStore((state) => state.skipModule);

  if (!module) return null;

  // Get the library module info for type
  const libraryModule = getModuleById(module.libraryId);
  const moduleType = libraryModule?.type || module.type || 'open-space';

  const handleComplete = () => {
    completeModule(module.instanceId);
  };

  const handleSkip = () => {
    skipModule(module.instanceId);
  };

  const commonProps = {
    module,
    onComplete: handleComplete,
    onSkip: handleSkip,
  };

  // Route to appropriate module component based on type
  switch (moduleType) {
    case 'grounding':
      return <GroundingModule {...commonProps} />;

    case 'journaling':
    case 'light-journaling':
    case 'deep-journaling':
    case 'letter-writing':
      return <JournalingModule {...commonProps} />;

    case 'meditation':
    case 'body-scan-light':
    case 'body-scan-deep':
    case 'open-awareness':
    case 'self-compassion':
      return <MeditationModule {...commonProps} />;

    case 'breathing':
      return <BreathingModule {...commonProps} />;

    case 'open-space':
    case 'gentle-movement':
    case 'music-listening':
    case 'break':
      return <OpenSpaceModule {...commonProps} />;

    case 'check-in':
      return <CheckInModule {...commonProps} />;

    case 'closing-ritual':
    case 'therapy-exercise':
      return <JournalingModule {...commonProps} />;

    case 'parts-work':
      return <JournalingModule {...commonProps} />;

    default:
      // Generic fallback for any module type
      return (
        <div className="flex flex-col justify-between px-6 py-8">
          <div className="flex-1 flex items-center justify-center w-full">
            <div className="text-center space-y-8 max-w-md mx-auto">
              <h2 className="font-serif text-xl text-[var(--color-text-primary)]">
                {module.title}
              </h2>

              {module.content?.instructions && (
                <p className="text-[var(--color-text-secondary)] leading-relaxed">
                  {module.content.instructions}
                </p>
              )}

              {module.content?.prompts && module.content.prompts.length > 0 && (
                <div className="space-y-4 mt-8">
                  {module.content.prompts.map((prompt, index) => (
                    <p key={index} className="text-[var(--color-text-secondary)] italic">
                      {prompt}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-full max-w-md mx-auto mt-8 space-y-4">
            <button
              onClick={handleComplete}
              className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)]
                         uppercase tracking-wider hover:opacity-80 transition-opacity duration-300"
            >
              Continue
            </button>

            <button
              onClick={handleSkip}
              className="w-full py-2 text-[var(--color-text-tertiary)] underline"
            >
              Skip
            </button>
          </div>
        </div>
      );
  }
}

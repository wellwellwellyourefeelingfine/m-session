/**
 * MeditationModule Component
 * Placeholder for meditation and breathing exercises
 *
 * Uses shared UI components:
 * - ModuleControlBar for consistent bottom controls
 * - ModuleLayout for consistent layout structure
 */

// Shared UI components
import ModuleLayout, { ModuleHeader, ModuleContent } from '../capabilities/ModuleLayout';
import ModuleControlBar from '../capabilities/ModuleControlBar';

export default function MeditationModule({ module, onComplete, onSkip, onTimerUpdate }) {
  // Get primary button config
  const getPrimaryButton = () => {
    return {
      label: 'Continue',
      onClick: onComplete,
    };
  };

  return (
    <>
      <ModuleLayout layout={{ centered: true, maxWidth: 'md' }}>
        <ModuleContent centered>
          <ModuleHeader
            title={module.title}
            instructions={module.content?.instructions || 'Find a comfortable position and close your eyes.'}
            centered
          />

          <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">
            Meditation module - full implementation coming soon
          </p>
        </ModuleContent>
      </ModuleLayout>

      {/* Fixed control bar above tab bar */}
      <ModuleControlBar
        phase="simple"
        primary={getPrimaryButton()}
        showBack={false}
        showSkip={true}
        onSkip={onSkip}
        skipConfirmMessage="Skip this meditation?"
      />
    </>
  );
}

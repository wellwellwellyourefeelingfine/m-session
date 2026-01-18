/**
 * CheckInModule Component
 * Placeholder for check-in prompts during session
 *
 * Uses shared UI components:
 * - ModuleControlBar for consistent bottom controls
 * - ModuleLayout for consistent layout structure
 */

// Shared UI components
import ModuleLayout, { ModuleHeader, ModuleContent } from '../capabilities/ModuleLayout';
import ModuleControlBar from '../capabilities/ModuleControlBar';

export default function CheckInModule({ module, onComplete, onSkip, onTimerUpdate }) {
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
            instructions={module.content?.instructions || 'How are you feeling right now?'}
            centered
          />

          <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">
            Check-in module - full implementation coming soon
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
        skipConfirmMessage="Skip this check-in?"
      />
    </>
  );
}

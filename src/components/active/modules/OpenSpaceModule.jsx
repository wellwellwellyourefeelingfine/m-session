/**
 * OpenSpaceModule Component
 * Placeholder for unstructured open space time
 *
 * Uses shared UI components:
 * - ModuleControlBar for consistent bottom controls
 * - ModuleLayout for consistent layout structure
 */

// Shared UI components
import ModuleLayout, { ModuleHeader, ModuleContent } from '../capabilities/ModuleLayout';
import ModuleControlBar from '../capabilities/ModuleControlBar';

export default function OpenSpaceModule({ module, onComplete, onSkip, onTimerUpdate }) {
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
            instructions={module.content?.instructions || 'This is open time. Follow what feels right.'}
            centered
          />

          <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">
            Take as much time as you need.
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
        skipConfirmMessage="Skip this open space?"
      />
    </>
  );
}

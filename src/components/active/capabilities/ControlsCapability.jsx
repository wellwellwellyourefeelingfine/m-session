/**
 * ControlsCapability Component
 *
 * Renders module control buttons based on configuration:
 * - Begin button (before starting)
 * - Pause/Resume button (during activity)
 * - Skip button (with optional confirmation)
 * - Continue button (after completion)
 * - Back button (for sequential prompts)
 */

import { useState } from 'react';

/**
 * @param {object} props
 * @param {object} props.config - Controls capability config
 * @param {string} props.modulePhase - Current module phase: 'idle' | 'active' | 'completed'
 * @param {boolean} props.isPlaying - Whether timer/activity is playing
 * @param {boolean} props.hasContent - Whether there's content to save (for journal)
 * @param {boolean} props.canGoBack - Whether back navigation is available
 * @param {boolean} props.isLastStep - Whether on the last step (for sequential)
 * @param {function} props.onBegin - Called when begin is clicked
 * @param {function} props.onPause - Called when pause is clicked
 * @param {function} props.onResume - Called when resume is clicked
 * @param {function} props.onSkip - Called when skip is confirmed
 * @param {function} props.onComplete - Called when continue is clicked
 * @param {function} props.onBack - Called when back is clicked
 * @param {function} props.onNext - Called when next is clicked (sequential)
 */
export default function ControlsCapability({
  config,
  modulePhase = 'idle',
  isPlaying = false,
  hasContent = false,
  canGoBack = false,
  isLastStep = false,
  onBegin,
  onPause,
  onResume,
  onSkip,
  onComplete,
  onBack,
  onNext,
}) {
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  if (!config) {
    return null;
  }

  const {
    showBeginButton = true,
    beginButtonText = 'Begin',
    showPauseButton = true,
    showSkipButton = true,
    skipConfirmation = false,
    continueButtonText = 'Continue',
    showBackButton = false,
  } = config;

  // Handle skip with optional confirmation
  const handleSkipClick = () => {
    if (skipConfirmation) {
      setShowSkipConfirm(true);
    } else {
      onSkip?.();
    }
  };

  const handleSkipConfirm = () => {
    setShowSkipConfirm(false);
    onSkip?.();
  };

  const handleSkipCancel = () => {
    setShowSkipConfirm(false);
  };

  // Determine button text based on context
  const getContinueText = () => {
    if (hasContent) {
      return 'Save & Continue';
    }
    return continueButtonText;
  };

  const getSkipText = () => {
    if (hasContent) {
      return 'Save & Skip';
    }
    return 'Skip';
  };

  return (
    <>
      <div className="w-full max-w-md mx-auto space-y-4">
        {/* Idle state: Show Begin button */}
        {modulePhase === 'idle' && showBeginButton && (
          <div className="flex justify-center">
            <button
              onClick={onBegin}
              className="px-12 py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)]
                uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
            >
              {beginButtonText}
            </button>
          </div>
        )}

        {/* Active state: Show Pause/Resume and Skip */}
        {modulePhase === 'active' && (
          <div className="flex flex-col items-center space-y-3">
            {showPauseButton && (
              <button
                onClick={isPlaying ? onPause : onResume}
                className="px-6 py-2 border border-[var(--color-border)]
                  text-[var(--color-text-primary)] uppercase tracking-wider text-[10px]
                  hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                {isPlaying ? 'Pause' : 'Resume'}
              </button>
            )}

            {showSkipButton && (
              <button
                onClick={handleSkipClick}
                className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider
                  hover:text-[var(--color-text-secondary)] transition-colors"
              >
                Skip
              </button>
            )}
          </div>
        )}

        {/* Completed state: Show Continue */}
        {modulePhase === 'completed' && (
          <div className="flex justify-center">
            <button
              onClick={onComplete}
              className="px-12 py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)]
                uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
            >
              {getContinueText()}
            </button>
          </div>
        )}

        {/* Sequential navigation: Continue/Complete and Back/Skip */}
        {modulePhase === 'sequential' && (
          <>
            <button
              onClick={isLastStep ? onComplete : onNext}
              className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)]
                uppercase tracking-wider hover:opacity-80 transition-opacity duration-300"
            >
              {isLastStep ? 'Complete' : 'Continue'}
            </button>

            <div className="flex space-x-4">
              {showBackButton && canGoBack && (
                <button
                  onClick={onBack}
                  className="flex-1 py-2 text-[var(--color-text-tertiary)] underline"
                >
                  Back
                </button>
              )}

              {showSkipButton && (
                <button
                  onClick={handleSkipClick}
                  className="flex-1 py-2 text-[var(--color-text-tertiary)] underline"
                >
                  Skip Module
                </button>
              )}
            </div>
          </>
        )}

        {/* Simple mode: Just Continue and Skip */}
        {modulePhase === 'simple' && (
          <>
            <button
              onClick={onComplete}
              className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)]
                uppercase tracking-wider hover:opacity-80 transition-opacity duration-300"
            >
              {getContinueText()}
            </button>

            {showSkipButton && (
              <button
                onClick={handleSkipClick}
                className="w-full py-2 text-[var(--color-text-tertiary)] underline"
              >
                {getSkipText()}
              </button>
            )}
          </>
        )}
      </div>

      {/* Skip confirmation modal */}
      {showSkipConfirm && (
        <SkipConfirmModal
          onConfirm={handleSkipConfirm}
          onCancel={handleSkipCancel}
        />
      )}
    </>
  );
}

/**
 * Skip Confirmation Modal
 */
function SkipConfirmModal({ onConfirm, onCancel, message }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6"
      onClick={onCancel}
    >
      <div
        className="bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-xs p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="uppercase tracking-wider text-xs text-center mb-6">
          {message || 'Are you sure you want to skip this?'}
        </p>
        <div className="space-y-3">
          <button
            onClick={onConfirm}
            className="w-full py-3 border border-[var(--color-border)]
              text-[var(--color-text-primary)] uppercase tracking-wider text-xs
              hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            Yes, Skip
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)]
              uppercase tracking-wider text-xs"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Standalone buttons for direct use
 */

export function PrimaryButton({ children, onClick, disabled = false, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-8 py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)]
        uppercase tracking-wider text-xs hover:opacity-80 transition-opacity
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, disabled = false, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-2 border border-[var(--color-border)]
        text-[var(--color-text-primary)] uppercase tracking-wider text-xs
        hover:bg-[var(--color-bg-secondary)] transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function TextButton({ children, onClick, disabled = false, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`py-2 text-[var(--color-text-tertiary)] underline
        hover:text-[var(--color-text-secondary)] transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export { SkipConfirmModal };

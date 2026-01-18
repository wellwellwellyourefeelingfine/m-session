/**
 * GroundingModule Component
 * Simple grounding and breathing exercises
 * Used for session opening, anxiety, and transitions
 *
 * Uses shared UI components:
 * - ModuleControlBar for consistent bottom controls
 * - ModuleLayout for consistent layout structure
 *
 * Reports step progress to parent via onTimerUpdate for ModuleStatusBar display
 */

import { useState, useCallback, useEffect } from 'react';

// Shared UI components
import ModuleLayout, { ModuleHeader, ModuleContent } from '../capabilities/ModuleLayout';
import ModuleControlBar from '../capabilities/ModuleControlBar';

export default function GroundingModule({ module, onComplete, onSkip, onTimerUpdate }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: module.title,
      content: module.content?.instructions || 'Take a moment to ground yourself in this space.',
    },
    {
      title: 'Notice Your Body',
      content: 'Feel your feet on the ground. Notice where your body is supported. You are safe here.',
    },
    {
      title: 'Breathe Slowly',
      content: 'Breathe in slowly for 4 counts... hold for 4... and out for 6. Let each breath settle you deeper.',
    },
    {
      title: 'Set Your Intention',
      content: "What do you want to remember about why you're here today? Hold that intention gently.",
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep >= steps.length - 1;

  // Report step progress to parent for ModuleStatusBar
  useEffect(() => {
    if (!onTimerUpdate) return;

    const progress = ((currentStep + 1) / steps.length) * 100;

    onTimerUpdate({
      progress,
      elapsed: currentStep + 1,
      total: steps.length,
      showTimer: false, // Steps don't show timer
      isPaused: false,
    });
  }, [currentStep, steps.length, onTimerUpdate]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  }, [currentStep, steps.length, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Get primary button config
  const getPrimaryButton = () => {
    return {
      label: isLastStep ? 'Complete' : 'Continue',
      onClick: handleNext,
    };
  };

  return (
    <>
      <ModuleLayout
        layout={{ centered: true, maxWidth: 'md' }}
      >
        <ModuleContent centered>
          <ModuleHeader
            title={currentStepData.title}
            centered
          />

          <p className="text-[var(--color-text-secondary)] leading-relaxed uppercase tracking-wider text-xs">
            {currentStepData.content}
          </p>
        </ModuleContent>
      </ModuleLayout>

      {/* Fixed control bar above tab bar */}
      <ModuleControlBar
        phase="sequential"
        primary={getPrimaryButton()}
        showBack={currentStep > 0}
        showSkip={true}
        onBack={handlePrevious}
        onSkip={onSkip}
        backConfirmMessage="Go back to the previous step?"
        skipConfirmMessage="Skip this grounding exercise?"
      />
    </>
  );
}

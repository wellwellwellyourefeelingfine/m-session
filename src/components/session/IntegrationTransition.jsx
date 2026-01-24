/**
 * IntegrationTransition Component
 * Supportive transition experience from peak to integration phase
 *
 * Mirrors the structure of PeakTransition:
 * - Multi-step flow with Continue/Skip controls
 * - Progress bar at top
 * - AsciiMoon animation
 * - Elapsed time display
 * - Final step calls transitionToIntegration() to complete the phase change
 *
 * PLACEHOLDER: Step content to be filled in later.
 */

import { useState, useCallback, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';

import ModuleControlBar from '../active/capabilities/ModuleControlBar';
import ModuleProgressBar from '../active/capabilities/ModuleProgressBar';
import AsciiMoon from '../active/capabilities/animations/AsciiMoon';

// Helper to format elapsed time nicely
const formatElapsedTime = (minutes) => {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours !== 1 ? 's' : ''} and ${mins} minute${mins !== 1 ? 's' : ''}`;
};

// Placeholder transition steps — content to be written later
const TRANSITION_STEPS = [
  {
    id: 'acknowledgment',
    content: {
      label: 'Transition',
      title: 'Entering Integration',
      body: "You've moved through the peak of your experience. The intensity may be beginning to soften, and a sense of clarity may be emerging.",
    },
  },
  {
    id: 'whats-ahead',
    content: {
      label: "What's Ahead",
      title: 'The Integration Phase',
      body: "This next phase is about gently processing and reflecting on what you've experienced. There's no rush — let things settle at their own pace.",
    },
  },
  {
    id: 'guidance',
    content: {
      label: 'Guidance',
      title: 'Be Gentle',
      body: "You may feel a natural desire to reflect, journal, or simply rest. Trust what feels right. This is a time for gentle self-care and quiet insight.",
    },
  },
  {
    id: 'hydration',
    content: {
      label: 'Care',
      title: 'Hydrate & Nourish',
      body: "Take a moment to drink some water and have a small snack if you feel ready. Your body has been working hard — give it what it needs.",
      isHydration: true,
    },
  },
  {
    id: 'ready',
    content: {
      label: 'Ready',
      title: 'Begin Integration',
      body: "When you're ready, we'll move into the integration phase of your journey. Take your time.",
      isReady: true,
    },
  },
];

export default function IntegrationTransition() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const transitionToIntegration = useSessionStore((state) => state.transitionToIntegration);
  const getElapsedMinutes = useSessionStore((state) => state.getElapsedMinutes);

  // Update elapsed time every minute
  useEffect(() => {
    setElapsedMinutes(getElapsedMinutes());
    const interval = setInterval(() => {
      setElapsedMinutes(getElapsedMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, [getElapsedMinutes]);

  const currentStep = TRANSITION_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === TRANSITION_STEPS.length - 1;
  const totalSteps = TRANSITION_STEPS.length;

  // Progress percentage
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  const handleNext = useCallback(() => {
    if (isLastStep) {
      transitionToIntegration();
      return;
    }

    setIsVisible(false);
    setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
      setIsVisible(true);
    }, 400);
  }, [isLastStep, transitionToIntegration]);

  const handleSkip = useCallback(() => {
    transitionToIntegration();
  }, [transitionToIntegration]);

  // Render content based on step type
  const renderContent = () => {
    const { content } = currentStep;

    return (
      <div className="text-center space-y-6 animate-fadeIn">
        <h2 className="text-[var(--color-text-primary)]">
          {content.title}
        </h2>
        <p className="leading-relaxed text-[var(--color-text-secondary)]">
          {content.body}
        </p>
        {content.isHydration && (
          <div className="py-4">
            <p className="text-[var(--color-text-tertiary)] text-xs">
              Take your time. Continue when ready.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Get primary button config
  const getPrimaryButton = () => {
    if (isLastStep) {
      return {
        label: 'Begin Integration',
        onClick: handleNext,
      };
    }

    return {
      label: 'Continue',
      onClick: handleNext,
    };
  };

  return (
    <>
      {/* Progress bar at top */}
      <ModuleProgressBar
        progress={progress}
        visible={true}
        showTime={false}
      />

      {/* Fixed layout container - fills space between header and control bar */}
      <div className="fixed top-16 left-0 right-0 bottom-[68px] flex flex-col overflow-hidden">
        {/* Anchored header section - doesn't scroll */}
        <div className="flex-shrink-0 pt-8 pb-4">
          {/* Header: Transition + elapsed time */}
          <div className="text-center mb-4">
            <p className="uppercase tracking-widest text-[10px] text-[var(--color-text-tertiary)]">
              Transition
            </p>
            <p className="text-[var(--color-text-tertiary)] text-xs mt-1">
              {formatElapsedTime(elapsedMinutes)} into session
            </p>
          </div>

          {/* ASCII Moon animation - anchored */}
          <div className="flex justify-center">
            <AsciiMoon />
          </div>
        </div>

        {/* Content area - directly below animation, scrollable if needed */}
        <div className="flex-1 overflow-auto px-6">
          <div
            className={`w-full max-w-md mx-auto transition-opacity duration-400 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Fixed control bar above tab bar */}
      <ModuleControlBar
        phase={isLastStep ? 'completed' : 'active'}
        primary={getPrimaryButton()}
        showBack={false}
        showSkip={!isLastStep}
        onSkip={handleSkip}
        skipConfirmMessage="Skip the transition and go directly to integration?"
      />
    </>
  );
}

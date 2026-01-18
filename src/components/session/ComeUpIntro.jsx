/**
 * ComeUpIntro Component
 * The initial ~10 minute guided introduction at the start of the session
 * Helps the user settle in before the first scheduled module
 *
 * Uses shared UI components:
 * - ModuleControlBar for consistent bottom controls
 * - ModuleProgressBar for progress display
 * - ModuleLayout for consistent layout structure
 */

import { useState, useEffect, useCallback } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';

// Shared UI components
import ModuleLayout from '../active/capabilities/ModuleLayout';
import ModuleControlBar from '../active/capabilities/ModuleControlBar';
import ModuleProgressBar from '../active/capabilities/ModuleProgressBar';

const INTRO_STEPS = [
  {
    id: 'welcome',
    duration: 15, // seconds to auto-advance (or user can click continue)
    content: {
      title: 'Welcome',
      body: 'Your session has begun. Take a deep breath. You are safe. You are supported.',
    },
  },
  {
    id: 'position',
    duration: 20,
    content: {
      title: 'Get Comfortable',
      body: 'Find a comfortable position. Many people prefer lying down with a blanket nearby. Let your body relax into the surface beneath you.',
    },
  },
  {
    id: 'environment',
    duration: 20,
    content: {
      title: 'Your Space',
      body: "Notice your surroundings. You've created a safe container for this experience. Everything you need is here.",
    },
  },
  {
    id: 'breathing-intro',
    duration: 30,
    content: {
      title: 'Settle In',
      body: "Let's take a few breaths together. Breathe in slowly through your nose... and out through your mouth. There's nowhere else to be right now.",
    },
  },
  {
    id: 'breathing-1',
    duration: 8,
    content: {
      title: 'Breathe',
      body: 'Breathe in...',
      isBreathing: true,
    },
  },
  {
    id: 'breathing-2',
    duration: 8,
    content: {
      title: 'Breathe',
      body: 'And breathe out...',
      isBreathing: true,
    },
  },
  {
    id: 'breathing-3',
    duration: 8,
    content: {
      title: 'Breathe',
      body: 'Breathe in...',
      isBreathing: true,
    },
  },
  {
    id: 'breathing-4',
    duration: 8,
    content: {
      title: 'Breathe',
      body: 'And breathe out...',
      isBreathing: true,
    },
  },
  {
    id: 'letting-go',
    duration: 25,
    content: {
      title: 'Let Go',
      body: "Release any tension you're holding. Your jaw. Your shoulders. Your hands. Let gravity do the work.",
    },
  },
  {
    id: 'trust',
    duration: 25,
    content: {
      title: 'Trust the Process',
      body: "Whatever arises is welcome. You don't need to control anything. Simply notice, and let it be.",
    },
  },
  {
    id: 'patience',
    duration: 20,
    content: {
      title: 'Be Patient',
      body: "The medicine will begin working in its own time. Most people feel the first effects between 20-45 minutes. There's no need to rush.",
    },
  },
  {
    id: 'guidance',
    duration: 20,
    content: {
      title: 'Guidance Available',
      body: "We'll be here with you, offering gentle guidance and checking in as you settle into the experience.",
    },
  },
  {
    id: 'ready',
    duration: 0, // User must click to continue
    content: {
      title: 'Ready to Begin',
      body: "When you're ready, we'll move into the first part of your session and check in with how you're feeling.",
      showContinue: true,
    },
  },
];

export default function ComeUpIntro() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(INTRO_STEPS[0].duration);

  const completeIntro = useSessionStore((state) => state.completeIntro);

  const currentStep = INTRO_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === INTRO_STEPS.length - 1;

  const handleNext = useCallback(() => {
    if (isLastStep) {
      completeIntro();
      return;
    }

    setIsVisible(false);
    setTimeout(() => {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setTimeRemaining(INTRO_STEPS[nextIndex].duration);
      setIsVisible(true);
    }, 500);
  }, [isLastStep, currentStepIndex, completeIntro]);

  // Auto-advance timer
  useEffect(() => {
    if (currentStep.duration === 0) return; // Don't auto-advance if duration is 0

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStepIndex, currentStep.duration, handleNext]);

  const handleSkip = useCallback(() => {
    // Skip to the last step (ready step)
    setIsVisible(false);
    setTimeout(() => {
      setCurrentStepIndex(INTRO_STEPS.length - 1);
      setTimeRemaining(0);
      setIsVisible(true);
    }, 500);
  }, []);

  // Progress percentage
  const progress = ((currentStepIndex + 1) / INTRO_STEPS.length) * 100;

  // Get primary button config
  const getPrimaryButton = () => {
    // On the last step, show "Begin Session"
    if (isLastStep) {
      return {
        label: 'Begin Session',
        onClick: handleNext,
      };
    }

    // On steps with auto-advance, show "Continue" to allow skipping ahead
    if (currentStep.duration > 0) {
      return {
        label: 'Continue',
        onClick: handleNext,
      };
    }

    return null;
  };

  return (
    <>
      {/* Progress bar at top */}
      <ModuleProgressBar
        progress={progress}
        visible={true}
        showTime={false}
      />

      <ModuleLayout
        layout={{ centered: true, maxWidth: 'md' }}
        hasProgressBar={true}
      >
        <div
          className={`text-center transition-opacity duration-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {currentStep.content.isBreathing ? (
            // Breathing step - larger, centered text
            <p className="text-lg leading-relaxed text-[var(--color-text-primary)]">
              {currentStep.content.body}
            </p>
          ) : (
            // Regular step
            <div className="space-y-6">
              <p className="uppercase tracking-widest text-[10px] text-[var(--color-text-tertiary)]">
                {currentStep.content.title}
              </p>
              <p className="leading-relaxed text-[var(--color-text-primary)]">
                {currentStep.content.body}
              </p>
            </div>
          )}
        </div>
      </ModuleLayout>

      {/* Fixed control bar above tab bar */}
      <ModuleControlBar
        phase={isLastStep ? 'completed' : 'active'}
        primary={getPrimaryButton()}
        showBack={false}
        showSkip={!isLastStep}
        onSkip={handleSkip}
        skipConfirmMessage="Skip the introduction?"
      />
    </>
  );
}

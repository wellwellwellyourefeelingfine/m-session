/**
 * GroundingModule Component
 * Simple grounding and breathing exercises
 * Used for session opening, anxiety, and transitions
 */

import { useState } from 'react';

export default function GroundingModule({ module, onComplete, onSkip }) {
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
      content: 'What do you want to remember about why you\'re here today? Hold that intention gently.',
    },
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="flex flex-col justify-between px-6 py-8">
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="text-center space-y-8 max-w-md mx-auto">
          <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
            {currentStepData.title}
          </h2>

          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            {currentStepData.content}
          </p>

          {/* Progress indicator */}
          <div className="flex justify-center space-x-2 mt-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  index === currentStep
                    ? 'bg-[var(--color-text-primary)]'
                    : index < currentStep
                      ? 'bg-[var(--color-text-secondary)]'
                      : 'bg-[var(--color-border)]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto mt-8 space-y-4">
        <button
          onClick={handleNext}
          className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)]
                     uppercase tracking-wider hover:opacity-80 transition-opacity duration-300"
        >
          {currentStep < steps.length - 1 ? 'Continue' : 'Complete'}
        </button>

        <div className="flex space-x-4">
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className="flex-1 py-2 text-[var(--color-text-tertiary)] underline"
            >
              Back
            </button>
          )}

          <button
            onClick={onSkip}
            className="flex-1 py-2 text-[var(--color-text-tertiary)] underline"
          >
            Skip Module
          </button>
        </div>
      </div>
    </div>
  );
}

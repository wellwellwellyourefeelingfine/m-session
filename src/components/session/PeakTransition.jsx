/**
 * PeakTransition Component
 * Supportive transition experience from come-up to peak phase
 *
 * Flow:
 * 1. "You've Arrived" - Acknowledgment
 * 2. "One Word" - Single word/phrase capture (optional)
 * 3. "What's Present in Your Body?" - Body sensation multi-select grid
 * 4. "Tune In" - Reassurance after body check-in
 * 5. "Let It Unfold" - Permission & physical prompt
 * 6. "Begin Next Phase" - Final step with button
 *
 * Post-transition uses TransitionBuffer (diamond animation + quote)
 */

import { useState, useCallback, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';

import ModuleControlBar from '../active/capabilities/ModuleControlBar';
import ModuleProgressBar from '../active/capabilities/ModuleProgressBar';
import AsciiMoon from '../active/capabilities/animations/AsciiMoon';
import TransitionBuffer from './TransitionBuffer';

import { BodySensationGrid, OneWordInput } from './transitions/shared';
import {
  PEAK_TRANSITION_STEPS,
  BODY_SENSATIONS,
  UNNAMED_SENSATION,
} from './transitions/content/peakTransitionContent';

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

export default function PeakTransition() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isFadingToBuffer, setIsFadingToBuffer] = useState(false);
  const [showPostBuffer, setShowPostBuffer] = useState(false);

  // Navigation history for back button
  const [stepHistory, setStepHistory] = useState([0]);

  // Local state for captures (synced to store on completion)
  const [bodySensations, setBodySensations] = useState([]);
  const [oneWord, setOneWord] = useState('');

  // Store selectors
  const transitionToPeak = useSessionStore((state) => state.transitionToPeak);
  const updatePeakCapture = useSessionStore((state) => state.updatePeakCapture);
  const getElapsedMinutes = useSessionStore((state) => state.getElapsedMinutes);
  const addEntry = useJournalStore((state) => state.addEntry);

  // Update elapsed time every minute
  useEffect(() => {
    setElapsedMinutes(getElapsedMinutes());
    const interval = setInterval(() => {
      setElapsedMinutes(getElapsedMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, [getElapsedMinutes]);

  const currentStep = PEAK_TRANSITION_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === PEAK_TRANSITION_STEPS.length - 1;
  const totalSteps = PEAK_TRANSITION_STEPS.length;

  // Progress percentage
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  // Save captures and create journal entry
  const saveCaptures = useCallback(() => {
    // Update store
    updatePeakCapture('bodySensations', bodySensations);
    updatePeakCapture('oneWord', oneWord);
    updatePeakCapture('completedAt', new Date());

    // Create journal entry
    const sensationLabels = bodySensations
      .map((id) => {
        if (id === 'unnamed') return UNNAMED_SENSATION.label;
        const sensation = BODY_SENSATIONS.find((s) => s.id === id);
        return sensation?.label;
      })
      .filter(Boolean);

    const journalContent = `PEAK ARRIVAL

Body Sensations: ${sensationLabels.length > 0 ? sensationLabels.join(', ') : 'None selected'}

One Word: ${oneWord || 'Not captured'}
`;

    addEntry({
      content: journalContent,
      source: 'session',
      moduleTitle: 'Peak Transition',
    });
  }, [bodySensations, oneWord, updatePeakCapture, addEntry]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      // Save captures, then fade out entire screen before showing buffer
      saveCaptures();
      setIsFadingToBuffer(true);
      // Wait for fade-out animation to complete before showing buffer
      setTimeout(() => {
        setShowPostBuffer(true);
      }, 500);
      return;
    }

    setIsVisible(false);
    setTimeout(() => {
      setCurrentStepIndex((prev) => {
        const nextIndex = prev + 1;
        setStepHistory((history) => [...history, nextIndex]);
        return nextIndex;
      });
      setIsVisible(true);
    }, 400);
  }, [isLastStep, saveCaptures]);

  const handleBack = useCallback(() => {
    if (currentStepIndex === 0) return;

    setIsVisible(false);
    setTimeout(() => {
      setStepHistory((history) => {
        if (history.length <= 1) return history;
        return history.slice(0, -1);
      });
      setCurrentStepIndex((prev) => Math.max(0, prev - 1));
      setIsVisible(true);
    }, 400);
  }, [currentStepIndex]);

  const handleSkip = useCallback(() => {
    // Save whatever we have, then transition
    saveCaptures();
    transitionToPeak();
  }, [saveCaptures, transitionToPeak]);

  // Called when TransitionBuffer completes
  const handleBufferComplete = useCallback(() => {
    transitionToPeak();
  }, [transitionToPeak]);

  // Render content based on step type
  const renderContent = () => {
    const { content } = currentStep;

    // Body sensation step
    if (content.isBodySensation) {
      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
            <p className="text-[var(--color-text-tertiary)] text-xs">
              {content.instruction}
            </p>
          </div>

          <BodySensationGrid
            selected={bodySensations}
            onChange={setBodySensations}
          />
        </div>
      );
    }

    // One word step
    if (content.isOneWord) {
      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
          </div>

          <OneWordInput
            value={oneWord}
            onChange={setOneWord}
          />

          <p className="text-center text-[var(--color-text-tertiary)] text-xs">
            {content.footer}
          </p>
        </div>
      );
    }

    // Ready step (final "Begin Next Phase" step)
    if (content.isReady) {
      return (
        <div className="text-center space-y-4 animate-fadeIn">
          <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
            {content.title}
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {content.body}
          </p>
          {content.bodySecondary && (
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.bodySecondary}
            </p>
          )}
        </div>
      );
    }

    // Informational steps (arrived, reassurance, unfold)
    // Use gray color for extra lines if useGrayForExtras is set
    const extraColor = content.useGrayForExtras
      ? 'text-[var(--color-text-tertiary)]'
      : 'text-[var(--color-text-secondary)]';

    return (
      <div className="text-center space-y-4 animate-fadeIn">
        <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
          {content.title}
        </h2>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
          {content.body}
        </p>
        {content.bodySecondary && (
          <p className={`${extraColor} text-sm leading-relaxed`}>
            {content.bodySecondary}
          </p>
        )}
        {content.bodyTertiary && (
          <p className={`${extraColor} text-sm leading-relaxed`}>
            {content.bodyTertiary}
          </p>
        )}
        {content.bodyQuaternary && (
          <p className={`${extraColor} text-sm leading-relaxed`}>
            {content.bodyQuaternary}
          </p>
        )}
      </div>
    );
  };

  // Get primary button config
  const getPrimaryButton = () => {
    // If showing post-buffer, no button
    if (showPostBuffer) return null;

    // One word step - show Skip option inline
    if (currentStep.content.isOneWord) {
      return {
        label: 'Continue',
        onClick: handleNext,
      };
    }

    // Last step - "Begin"
    if (isLastStep) {
      return {
        label: 'Begin',
        onClick: handleNext,
      };
    }

    // Regular continue
    return {
      label: 'Continue',
      onClick: handleNext,
    };
  };

  // Determine if back button should be shown
  const showBackButton = () => {
    return currentStepIndex > 0;
  };

  // Post-transition buffer screen using TransitionBuffer component
  if (showPostBuffer) {
    return (
      <div className="fixed inset-0 bg-[var(--color-bg-primary)]">
        <TransitionBuffer onComplete={handleBufferComplete} holdDuration={2500} />
      </div>
    );
  }

  return (
    <div
      className={`transition-opacity duration-500 ${
        isFadingToBuffer ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Progress bar at top */}
      <ModuleProgressBar
        progress={progress}
        visible={true}
        showTime={false}
      />

      {/* Fixed layout container - fills space between header and control bar */}
      <div className="fixed top-16 left-0 right-0 bottom-[68px] flex flex-col overflow-hidden">
        {/* Anchored header section - doesn't scroll */}
        <div className="flex-shrink-0 pt-4 pb-4">
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
            className={`w-full max-w-md mx-auto pb-6 transition-opacity duration-400 ${
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
        showBack={showBackButton()}
        onBack={handleBack}
        backConfirmMessage={null}
        showSkip={!isLastStep && !currentStep.content.isOneWord}
        onSkip={handleSkip}
        skipConfirmMessage="Skip the transition and go directly to peak?"
        secondaryText={currentStep.content.isOneWord ? 'Skip' : null}
        onSecondary={currentStep.content.isOneWord ? handleNext : null}
      />
    </div>
  );
}

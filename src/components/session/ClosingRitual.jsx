/**
 * ClosingRitual Component
 * 8-step closing ritual flow triggered after user consents via ClosingCheckIn
 *
 * Flow:
 * 1. "Honoring This Experience" - Acknowledgment
 * 2. "One Thing About Yourself" - Self-gratitude textarea
 * 3. "A Message Forward" - Future self message textarea
 * 4. "One Thing Different" - Commitment textarea with examples
 * 5. "This Session Is Complete" - Completion message
 * 6. "Before You Go" - Data download
 * 7. "Integration Takes Time" - Integration encouragement
 * 8. "Take Care" - Final step with "Close Session" button
 *
 * After completion: Shows PostCloseScreen animation, then navigates to Home
 */

import { useState, useCallback, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';

import ModuleControlBar from '../active/capabilities/ModuleControlBar';
import ModuleProgressBar from '../active/capabilities/ModuleProgressBar';
import AsciiMoon from '../active/capabilities/animations/AsciiMoon';
import PostCloseScreen from './PostCloseScreen';
import DataDownloadModal from './DataDownloadModal';

import { TransitionTextarea } from './transitions/shared';
import { CLOSING_RITUAL_STEPS } from './transitions/content/closingRitualContent';

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

export default function ClosingRitual() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [showPostCloseAnimation, setShowPostCloseAnimation] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Navigation history for back button
  const [stepHistory, setStepHistory] = useState([0]);

  // Local state for captures
  const [selfGratitude, setSelfGratitude] = useState('');
  const [futureMessage, setFutureMessage] = useState('');
  const [commitment, setCommitment] = useState('');

  // Store selectors
  const updateClosingCapture = useSessionStore((state) => state.updateClosingCapture);
  const completeSession = useSessionStore((state) => state.completeSession);
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

  const currentStep = CLOSING_RITUAL_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === CLOSING_RITUAL_STEPS.length - 1;
  const totalSteps = CLOSING_RITUAL_STEPS.length;

  // Progress percentage
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  // Save captures and create journal entry
  const saveCaptures = useCallback(() => {
    // Update store
    updateClosingCapture('selfGratitude', selfGratitude);
    updateClosingCapture('futureMessage', futureMessage);
    updateClosingCapture('commitment', commitment);
    updateClosingCapture('completedAt', new Date());

    // Create journal entry if there's meaningful content
    const hasContent = selfGratitude.trim() || futureMessage.trim() || commitment.trim();

    if (hasContent) {
      let journalContent = 'CLOSING RITUAL\n\n';

      if (selfGratitude.trim()) {
        journalContent += `Self-Gratitude:\n${selfGratitude}\n\n`;
      }

      if (futureMessage.trim()) {
        journalContent += `Message to Future Self:\n${futureMessage}\n\n`;
      }

      if (commitment.trim()) {
        journalContent += `Commitment:\n${commitment}\n\n`;
      }

      addEntry({
        content: journalContent.trim(),
        source: 'session',
        moduleTitle: 'Closing Ritual',
        tags: ['closing-ritual'],
      });
    }
  }, [selfGratitude, futureMessage, commitment, updateClosingCapture, addEntry]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      // Save captures and complete the session
      saveCaptures();
      completeSession();
      // Show post-close animation instead of static screen
      setShowPostCloseAnimation(true);
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
  }, [isLastStep, saveCaptures, completeSession]);

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
    // Save whatever we have and complete
    saveCaptures();
    completeSession();
    setShowPostCloseAnimation(true);
  }, [saveCaptures, completeSession]);

  // Render content based on step type
  const renderContent = () => {
    const { content } = currentStep;

    // Honoring step (first step)
    if (currentStep.id === 'honoring') {
      return (
        <div className="text-center space-y-4 animate-fadeIn">
          <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
            {content.title}
          </h2>
          <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {content.body}
          </p>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {content.bodySecondary}
          </p>
        </div>
      );
    }

    // Self-gratitude step
    if (content.captureField === 'selfGratitude') {
      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {content.instruction}
            </p>
          </div>

          <TransitionTextarea
            value={selfGratitude}
            onChange={setSelfGratitude}
            placeholder={content.placeholder}
          />

          <p className="text-center text-[var(--color-text-tertiary)] text-xs">
            {content.footer}
          </p>
        </div>
      );
    }

    // Future message step
    if (content.captureField === 'futureMessage') {
      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {content.instruction}
            </p>
          </div>

          <TransitionTextarea
            value={futureMessage}
            onChange={setFutureMessage}
            placeholder={content.placeholder}
            large
          />

          <p className="text-center text-[var(--color-text-tertiary)] text-xs">
            {content.footer}
          </p>
        </div>
      );
    }

    // Commitment step (with examples)
    if (content.captureField === 'commitment') {
      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {content.instruction}
            </p>
          </div>

          <TransitionTextarea
            value={commitment}
            onChange={setCommitment}
            placeholder={content.placeholder}
          />

          {/* Collapsible examples */}
          {content.examples && (
            <div>
              <button
                type="button"
                onClick={() => setShowExamples(!showExamples)}
                className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider hover:text-[var(--color-text-secondary)]"
              >
                {showExamples ? '− Hide examples' : '+ See examples'}
              </button>
              {showExamples && (
                <ul className="mt-3 space-y-2 text-[var(--color-text-tertiary)] text-sm italic">
                  {content.examples.map((example, i) => (
                    <li key={i}>{example}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      );
    }

    // Complete step (step 5 - now just informational)
    if (content.isComplete) {
      return (
        <div className="space-y-4 animate-fadeIn">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {content.body}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.bodySecondary}
            </p>
            <p className="text-[var(--color-text-tertiary)] text-sm leading-relaxed">
              {content.bodyTertiary}
            </p>
          </div>
        </div>
      );
    }

    // Before You Go step (step 6 - data download only)
    if (content.isBeforeYouGo) {
      return (
        <div className="space-y-6 animate-fadeIn pb-4">
          <div className="text-center">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mt-2">
              {content.body}
            </p>
          </div>

          {/* Your Data Section */}
          <div className="space-y-3">
            <h3 className="text-[var(--color-text-primary)] text-sm font-medium">
              {content.dataSection.title}
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.dataSection.body}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.dataSection.instruction}
            </p>
            <button
              type="button"
              onClick={() => setShowDownloadModal(true)}
              className="w-full py-3 border border-[var(--color-text-tertiary)] text-[var(--color-text-primary)] text-sm hover:border-[var(--color-text-primary)] transition-colors"
            >
              {content.dataSection.buttonLabel}
            </button>
          </div>
        </div>
      );
    }

    // Integration Takes Time step (step 7)
    if (content.isIntegrationTime) {
      return (
        <div className="space-y-4 animate-fadeIn">
          <div className="text-center space-y-4">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.bodySecondary}
            </p>
            <p className="text-[var(--color-text-tertiary)] text-xs italic">
              {content.footer}
            </p>
          </div>
        </div>
      );
    }

    // Closing step (final step - Take Care)
    if (content.isClosing) {
      return (
        <div className="text-center space-y-4 animate-fadeIn">
          <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
            {content.title}
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {content.body}
          </p>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {content.bodySecondary}
          </p>
          <p className="text-[var(--color-text-tertiary)] text-sm leading-relaxed">
            {content.bodyTertiary}
          </p>
        </div>
      );
    }

    // Default text-only step
    return (
      <div className="text-center space-y-4 animate-fadeIn">
        <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
          {content.title}
        </h2>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
          {content.body}
        </p>
      </div>
    );
  };

  // Get primary button config
  const getPrimaryButton = () => {
    if (showPostCloseAnimation) return null;

    if (isLastStep) {
      return {
        label: 'Close Session',
        onClick: handleNext,
      };
    }

    return {
      label: 'Continue',
      onClick: handleNext,
    };
  };

  // Determine if back button should be shown
  const showBackButton = () => {
    return currentStepIndex > 0;
  };

  // Show post-close animation screen
  if (showPostCloseAnimation) {
    return <PostCloseScreen />;
  }

  return (
    <>
      {/* Progress bar at top */}
      <ModuleProgressBar
        progress={progress}
        visible={true}
        showTime={false}
      />

      {/* Fixed layout container - fills space between header and tab bar */}
      <div className="fixed left-0 right-0 flex flex-col overflow-hidden" style={{ top: 'var(--header-height)', bottom: 'var(--tabbar-height)' }}>
        {/* Anchored header section - doesn't scroll */}
        <div className="flex-shrink-0 pt-4 pb-4">
          {/* Header: Closing + elapsed time */}
          <div className="text-center mb-4">
            <p className="uppercase tracking-widest text-[10px] text-[var(--color-text-tertiary)]">
              {currentStep.content.label}
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
            className={`w-full max-w-md mx-auto transition-opacity duration-[400ms] ${
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
        showSkip={!isLastStep}
        onSkip={handleSkip}
        skipConfirmMessage="Skip the closing ritual and complete your session?"
      />

      {/* Download Modal */}
      {showDownloadModal && (
        <DataDownloadModal onClose={() => setShowDownloadModal(false)} />
      )}
    </>
  );
}

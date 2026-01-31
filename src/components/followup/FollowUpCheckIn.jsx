/**
 * FollowUpCheckIn Component
 * First follow-up module - A brief check-in about how user is feeling
 *
 * Flow:
 * 1. "How Are You?" - Single-select feeling options
 * 2. Conditional response based on feeling
 * 3. Optional note textarea
 * 4. Complete screen
 */

import { useState, useCallback } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';

import ModuleControlBar from '../active/capabilities/ModuleControlBar';
import ModuleProgressBar from '../active/capabilities/ModuleProgressBar';
import AsciiMoon from '../active/capabilities/animations/AsciiMoon';
import { TransitionTextarea } from '../session/transitions/shared';

import {
  CHECK_IN_FEELINGS,
  CHECK_IN_RESPONSES,
  CHECK_IN_STEPS,
} from './content/followUpContent';

export default function FollowUpCheckIn() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [stepHistory, setStepHistory] = useState([0]);

  // Local state for captures
  const [feeling, setFeeling] = useState(null);
  const [note, setNote] = useState('');

  // Store selectors
  const completeFollowUpModule = useSessionStore((state) => state.completeFollowUpModule);
  const exitFollowUpModule = useSessionStore((state) => state.exitFollowUpModule);
  const followUp = useSessionStore((state) => state.followUp);
  const startFollowUpModule = useSessionStore((state) => state.startFollowUpModule);
  const addEntry = useJournalStore((state) => state.addEntry);

  const currentStep = CHECK_IN_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === CHECK_IN_STEPS.length - 1;
  const totalSteps = CHECK_IN_STEPS.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  // Save captures and create journal entry
  const saveCaptures = useCallback(() => {
    // Create journal entry
    const feelingLabel = CHECK_IN_FEELINGS.find((f) => f.value === feeling)?.label || feeling;

    let journalContent = 'FOLLOW-UP: CHECK-IN\n\n';
    journalContent += `How I'm feeling: ${feelingLabel}\n`;
    if (note.trim()) {
      journalContent += `\nNote:\n${note}`;
    }

    addEntry({
      content: journalContent.trim(),
      source: 'session',
      moduleTitle: 'Follow-Up Check-In',
      tags: ['followup-checkin'],
    });

    // Complete the module
    completeFollowUpModule('checkIn', {
      feeling,
      note: note.trim() || null,
    });
  }, [feeling, note, addEntry, completeFollowUpModule]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      saveCaptures();
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
    if (currentStepIndex === 0) {
      exitFollowUpModule();
      return;
    }

    setIsVisible(false);
    setTimeout(() => {
      setStepHistory((history) => {
        if (history.length <= 1) return history;
        return history.slice(0, -1);
      });
      setCurrentStepIndex((prev) => Math.max(0, prev - 1));
      setIsVisible(true);
    }, 400);
  }, [currentStepIndex, exitFollowUpModule]);

  const handleFeelingSelect = (value) => {
    setFeeling(value);
  };

  const handleContinueToRevisit = () => {
    saveCaptures();
    // If revisit is available, start it
    if (followUp.modules.revisit.status === 'available') {
      startFollowUpModule('revisit');
    }
  };

  // Render content based on step
  const renderContent = () => {
    const { content } = currentStep;

    // Feeling selection step
    if (currentStep.id === 'feeling') {
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

          {/* Feeling options */}
          <div className="space-y-2">
            {CHECK_IN_FEELINGS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleFeelingSelect(option.value)}
                className={`w-full py-3 px-4 border text-left text-sm transition-colors ${
                  feeling === option.value
                    ? 'border-[var(--color-text-primary)] text-[var(--color-text-primary)]'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-tertiary)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Response step (conditional based on feeling)
    if (currentStep.id === 'response') {
      const response = CHECK_IN_RESPONSES[feeling] || CHECK_IN_RESPONSES.mixed;

      return (
        <div className="text-center space-y-4 animate-fadeIn">
          <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {response.text}
          </p>
          {response.textSecondary && (
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {response.textSecondary}
            </p>
          )}
        </div>
      );
    }

    // Note step (optional)
    if (currentStep.id === 'note') {
      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
          </div>

          <TransitionTextarea
            value={note}
            onChange={setNote}
            placeholder={content.placeholder}
          />
        </div>
      );
    }

    // Complete step
    if (currentStep.id === 'complete') {
      const revisitAvailable = followUp.modules.revisit.status === 'available';

      return (
        <div className="text-center space-y-6 animate-fadeIn">
          <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {content.body}
          </p>

          {revisitAvailable && (
            <button
              type="button"
              onClick={handleContinueToRevisit}
              className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider hover:text-[var(--color-text-secondary)]"
            >
              Continue to Revisit →
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  // Get primary button config
  const getPrimaryButton = () => {
    // Feeling step - need to select something
    if (currentStep.id === 'feeling') {
      return {
        label: 'Continue',
        onClick: handleNext,
        disabled: !feeling,
      };
    }

    // Complete step
    if (isLastStep) {
      return {
        label: 'Return Home',
        onClick: handleNext,
      };
    }

    // Note step - can skip
    if (currentStep.id === 'note') {
      return {
        label: 'Continue',
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
      <ModuleProgressBar progress={progress} visible={true} showTime={false} />

      <div className="fixed left-0 right-0 flex flex-col overflow-hidden" style={{ top: 'var(--header-height)', bottom: 'var(--tabbar-height)' }}>
        <div className="flex-shrink-0 pt-4 pb-4">
          <div className="text-center mb-4">
            <p className="uppercase tracking-widest text-[10px] text-[var(--color-text-tertiary)]">
              {currentStep.content.label}
            </p>
          </div>
          <div className="flex justify-center">
            <AsciiMoon />
          </div>
        </div>

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

      <ModuleControlBar
        phase={isLastStep ? 'completed' : 'active'}
        primary={getPrimaryButton()}
        showBack={true}
        onBack={handleBack}
        backConfirmMessage={currentStepIndex === 0 ? 'Exit the check-in?' : null}
        showSkip={currentStep.id === 'note'}
        onSkip={handleNext}
        skipConfirmMessage={null}
        secondaryText={currentStep.id === 'note' ? 'Skip' : null}
        onSecondary={currentStep.id === 'note' ? handleNext : null}
      />
    </>
  );
}

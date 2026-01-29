/**
 * FollowUpRevisit Component
 * Second follow-up module - Revisit session writings with fresh eyes
 *
 * Flow:
 * 1. Introduction
 * 2. Display session writings (intention, future message, commitment)
 * 3. Reflection textarea
 * 4. Complete screen
 */

import { useState, useCallback } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';

import ModuleControlBar from '../active/capabilities/ModuleControlBar';
import ModuleProgressBar from '../active/capabilities/ModuleProgressBar';
import AsciiMoon from '../active/capabilities/animations/AsciiMoon';
import { TransitionTextarea } from '../session/transitions/shared';

import { REVISIT_STEPS } from './content/followUpContent';

export default function FollowUpRevisit() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [stepHistory, setStepHistory] = useState([0]);

  // Local state for captures
  const [reflection, setReflection] = useState('');

  // Store selectors
  const completeFollowUpModule = useSessionStore((state) => state.completeFollowUpModule);
  const exitFollowUpModule = useSessionStore((state) => state.exitFollowUpModule);
  const intake = useSessionStore((state) => state.intake);
  const preSubstanceActivity = useSessionStore((state) => state.preSubstanceActivity);
  const transitionCaptures = useSessionStore((state) => state.transitionCaptures);
  const addEntry = useJournalStore((state) => state.addEntry);

  const currentStep = REVISIT_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === REVISIT_STEPS.length - 1;
  const totalSteps = REVISIT_STEPS.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  // Get session data to display
  const intention = intake?.responses?.holdingQuestion || '';
  const intentionAddition = transitionCaptures?.integration?.editedIntention || '';
  const futureMessage = transitionCaptures?.closing?.futureMessage || '';
  const commitment = transitionCaptures?.closing?.commitment || '';

  // Check if there's any content to display
  const hasContent = intention || intentionAddition || futureMessage || commitment;

  // Save captures and create journal entry
  const saveCaptures = useCallback(() => {
    if (reflection.trim()) {
      let journalContent = 'FOLLOW-UP: REVISIT\n\n';
      journalContent += `Reflection:\n${reflection}`;

      addEntry({
        content: journalContent.trim(),
        source: 'session',
        moduleTitle: 'Follow-Up Revisit',
        tags: ['followup-revisit'],
      });
    }

    // Complete the module
    completeFollowUpModule('revisit', {
      reflection: reflection.trim() || null,
    });
  }, [reflection, addEntry, completeFollowUpModule]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      saveCaptures();
      return;
    }

    // Skip display step if no content
    if (currentStep.id === 'intro' && !hasContent) {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentStepIndex(2); // Jump to reflection step
        setStepHistory((history) => [...history, 2]);
        setIsVisible(true);
      }, 400);
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
  }, [isLastStep, currentStep.id, hasContent, saveCaptures]);

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

  // Render content based on step
  const renderContent = () => {
    const { content } = currentStep;

    // Intro step
    if (currentStep.id === 'intro') {
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
    }

    // Display step - show session writings
    if (currentStep.id === 'display') {
      return (
        <div className="space-y-6 animate-fadeIn">
          {/* Intention */}
          {intention && (
            <div className="space-y-2">
              <h3 className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">
                Your Intention
              </h3>
              <blockquote className="text-[var(--color-text-primary)] text-sm leading-relaxed italic border-l-2 border-[var(--color-text-tertiary)] pl-4">
                "{intention}"
              </blockquote>
              {intentionAddition && (
                <div className="pl-4 mt-2">
                  <p className="text-[var(--color-text-tertiary)] text-xs">
                    What you added during integration:
                  </p>
                  <p className="text-[var(--color-text-secondary)] text-sm italic mt-1">
                    "{intentionAddition}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Future Message */}
          {futureMessage && (
            <div className="space-y-2">
              <h3 className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">
                Message to Your Future Self
              </h3>
              <blockquote className="text-[var(--color-text-primary)] text-sm leading-relaxed italic border-l-2 border-[var(--color-text-tertiary)] pl-4">
                "{futureMessage}"
              </blockquote>
            </div>
          )}

          {/* Commitment */}
          {commitment && (
            <div className="space-y-2">
              <h3 className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">
                Your Commitment
              </h3>
              <blockquote className="text-[var(--color-text-primary)] text-sm leading-relaxed italic border-l-2 border-[var(--color-text-tertiary)] pl-4">
                "{commitment}"
              </blockquote>
            </div>
          )}

          {/* No content message */}
          {!hasContent && (
            <p className="text-[var(--color-text-tertiary)] text-sm text-center italic">
              No writings were captured during your session.
            </p>
          )}
        </div>
      );
    }

    // Reflection step
    if (currentStep.id === 'reflection') {
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

          <TransitionTextarea
            value={reflection}
            onChange={setReflection}
            placeholder={content.placeholder}
            large
          />
        </div>
      );
    }

    // Complete step
    if (currentStep.id === 'complete') {
      return (
        <div className="text-center space-y-4 animate-fadeIn">
          <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {content.body}
          </p>
        </div>
      );
    }

    return null;
  };

  // Get primary button config
  const getPrimaryButton = () => {
    if (isLastStep) {
      return {
        label: 'Return Home',
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

      <div className="fixed top-16 left-0 right-0 bottom-12 flex flex-col overflow-hidden">
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
            className={`w-full max-w-md mx-auto transition-opacity duration-400 ${
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
        backConfirmMessage={currentStepIndex === 0 ? 'Exit the revisit?' : null}
        showSkip={currentStep.id === 'reflection'}
        onSkip={handleNext}
        skipConfirmMessage={null}
        secondaryText={currentStep.id === 'reflection' ? 'Skip' : null}
        onSecondary={currentStep.id === 'reflection' ? handleNext : null}
      />
    </>
  );
}

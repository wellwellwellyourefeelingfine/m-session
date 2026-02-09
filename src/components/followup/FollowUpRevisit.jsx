/**
 * FollowUpRevisit Component
 * Second follow-up module - Revisit session writings with fresh eyes
 *
 * Flow:
 * 1. Introduction (contextual based on check-in feeling)
 * 2. Display session writings (intention, future message, commitment)
 * 3. Reflection textarea
 * 4. Carry-forward prompt
 * 5. Complete screen (with bridge to Integration)
 */

import { useState, useCallback } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';

import ModuleControlBar from '../active/capabilities/ModuleControlBar';
import ModuleProgressBar from '../active/capabilities/ModuleProgressBar';
import AsciiMoon from '../active/capabilities/animations/AsciiMoon';
import { TransitionTextarea } from '../session/transitions/shared';

import { REVISIT_STEPS, REVISIT_FEELING_CONTEXT } from './content/followUpContent';

// Steps where the moon animation appears (sparse/text-only screens)
const MOON_STEPS = new Set(['intro', 'complete']);

export default function FollowUpRevisit() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [stepHistory, setStepHistory] = useState([0]);

  // Local state for captures
  const [reflection, setReflection] = useState('');
  const [carryForward, setCarryForward] = useState('');

  // Store selectors
  const completeFollowUpModule = useSessionStore((state) => state.completeFollowUpModule);
  const exitFollowUpModule = useSessionStore((state) => state.exitFollowUpModule);
  const followUp = useSessionStore((state) => state.followUp);
  const startFollowUpModule = useSessionStore((state) => state.startFollowUpModule);
  const intake = useSessionStore((state) => state.intake);
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

  // Get check-in feeling for contextual intro
  const checkInFeeling = followUp?.modules?.checkIn?.feeling;

  // Save captures and create journal entry
  const saveCaptures = useCallback(() => {
    const hasReflection = reflection.trim();
    const hasCarryForward = carryForward.trim();

    if (hasReflection || hasCarryForward) {
      let journalContent = 'FOLLOW-UP: REVISIT\n\n';
      if (hasReflection) {
        journalContent += `Reflection:\n${reflection}\n`;
      }
      if (hasCarryForward) {
        journalContent += `\nCarrying forward:\n${carryForward}`;
      }

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
      carryForward: carryForward.trim() || null,
    });
  }, [reflection, carryForward, addEntry, completeFollowUpModule]);

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

  const handleContinueToIntegration = () => {
    saveCaptures();
    if (followUp.modules.integration.status === 'available') {
      startFollowUpModule('integration');
    }
  };

  // Render content based on step
  const renderContent = () => {
    const { content } = currentStep;

    // Intro step — with contextual framing from check-in feeling
    if (currentStep.id === 'intro') {
      const contextText = checkInFeeling ? REVISIT_FEELING_CONTEXT[checkInFeeling] : null;

      return (
        <div className="text-center space-y-4 animate-fadeIn">
          <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
            {content.title}
          </h2>
          {contextText ? (
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {contextText}
            </p>
          ) : (
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
          )}
        </div>
      );
    }

    // Display step - show session writings
    if (currentStep.id === 'display') {
      return (
        <div className="space-y-6 animate-fadeIn">
          {intention && (
            <div className="space-y-2">
              <h3 className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">
                Your Intention
              </h3>
              <blockquote className="text-[var(--color-text-primary)] text-sm leading-relaxed italic border-l-2 border-[var(--color-text-tertiary)] pl-4">
                &ldquo;{intention}&rdquo;
              </blockquote>
              {intentionAddition && (
                <div className="pl-4 mt-2">
                  <p className="text-[var(--color-text-tertiary)] text-xs">
                    What you added during integration:
                  </p>
                  <p className="text-[var(--color-text-secondary)] text-sm italic mt-1">
                    &ldquo;{intentionAddition}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}

          {futureMessage && (
            <div className="space-y-2">
              <h3 className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">
                Message to Your Future Self
              </h3>
              <blockquote className="text-[var(--color-text-primary)] text-sm leading-relaxed italic border-l-2 border-[var(--color-text-tertiary)] pl-4">
                &ldquo;{futureMessage}&rdquo;
              </blockquote>
            </div>
          )}

          {commitment && (
            <div className="space-y-2">
              <h3 className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">
                Your Commitment
              </h3>
              <blockquote className="text-[var(--color-text-primary)] text-sm leading-relaxed italic border-l-2 border-[var(--color-text-tertiary)] pl-4">
                &ldquo;{commitment}&rdquo;
              </blockquote>
            </div>
          )}

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

    // Carry-forward step
    if (currentStep.id === 'carry-forward') {
      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
          </div>

          <TransitionTextarea
            value={carryForward}
            onChange={setCarryForward}
            placeholder={content.placeholder}
          />
        </div>
      );
    }

    // Complete step — with bridge to Integration
    if (currentStep.id === 'complete') {
      const integrationAvailable = followUp.modules.integration.status === 'available';

      return (
        <div className="text-center space-y-6 animate-fadeIn">
          <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {content.body}
          </p>

          {integrationAvailable && (
            <button
              type="button"
              onClick={handleContinueToIntegration}
              className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider hover:text-[var(--color-text-secondary)]"
            >
              Continue to Integration →
            </button>
          )}
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

  const showSkip = currentStep.id === 'reflection' || currentStep.id === 'carry-forward';

  return (
    <>
      <ModuleProgressBar progress={progress} visible={true} showTime={false} />

      <div className="fixed left-0 right-0 flex flex-col overflow-hidden" style={{ top: 'var(--header-height)', bottom: 'var(--tabbar-height)' }}>
        <div className="flex-shrink-0 pt-2 pb-1">
          <div className="text-center mb-1">
            <p className="uppercase tracking-widest text-[10px] text-[var(--color-text-tertiary)]">
              {currentStep.content.label}
            </p>
          </div>
          {MOON_STEPS.has(currentStep.id) && (
            <div className="flex justify-center">
              <AsciiMoon />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto px-6">
          <div
            className={`w-full max-w-md mx-auto transition-opacity duration-[400ms] pb-24 ${
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
        showSkip={showSkip}
        onSkip={handleNext}
        skipConfirmMessage={null}
        secondaryText={showSkip ? 'Skip' : null}
        onSecondary={showSkip ? handleNext : null}
      />
    </>
  );
}

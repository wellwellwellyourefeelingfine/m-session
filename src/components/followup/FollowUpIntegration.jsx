/**
 * FollowUpIntegration Component
 * Third follow-up module - Deeper reflection on integration
 *
 * Flow:
 * 1. Introduction ("A Few Days Later")
 * 2. "What's Emerged" textarea
 * 3. Commitment check-in (single-select status)
 * 4. Conditional response based on status
 * 5. Closing text
 * 6. "Follow-Up Complete" screen
 */

import { useState, useCallback } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useAppStore } from '../../stores/useAppStore';

import ModuleControlBar from '../active/capabilities/ModuleControlBar';
import ModuleProgressBar from '../active/capabilities/ModuleProgressBar';
import AsciiMoon from '../active/capabilities/animations/AsciiMoon';
import { TransitionTextarea } from '../session/transitions/shared';

import {
  COMMITMENT_STATUSES,
  COMMITMENT_RESPONSES,
  INTEGRATION_STEPS,
} from './content/followUpContent';

export default function FollowUpIntegration() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [stepHistory, setStepHistory] = useState([0]);

  // Local state for captures
  const [emerged, setEmerged] = useState('');
  const [commitmentStatus, setCommitmentStatus] = useState(null);
  const [commitmentResponse, setCommitmentResponse] = useState('');
  const [forgotChoice, setForgotChoice] = useState(null); // 'yes' | 'no'

  // Store selectors
  const completeFollowUpModule = useSessionStore((state) => state.completeFollowUpModule);
  const exitFollowUpModule = useSessionStore((state) => state.exitFollowUpModule);
  const transitionCaptures = useSessionStore((state) => state.transitionCaptures);
  const setCurrentTab = useAppStore((state) => state.setCurrentTab);
  const addEntry = useJournalStore((state) => state.addEntry);

  const commitment = transitionCaptures?.closing?.commitment || '';

  const currentStep = INTEGRATION_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === INTEGRATION_STEPS.length - 1;
  const totalSteps = INTEGRATION_STEPS.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  // Save captures and create journal entry
  const saveCaptures = useCallback(() => {
    const statusLabel = COMMITMENT_STATUSES.find((s) => s.value === commitmentStatus)?.label || commitmentStatus;

    let journalContent = 'FOLLOW-UP: INTEGRATION\n\n';

    if (emerged.trim()) {
      journalContent += `What's emerged:\n${emerged}\n\n`;
    }

    if (commitmentStatus) {
      journalContent += `Commitment status: ${statusLabel}\n`;
    }

    if (commitmentResponse.trim()) {
      journalContent += `Response:\n${commitmentResponse}\n`;
    }

    addEntry({
      content: journalContent.trim(),
      source: 'session',
      moduleTitle: 'Follow-Up Integration',
      tags: ['followup-integration'],
    });

    // Complete the module
    completeFollowUpModule('integration', {
      emerged: emerged.trim() || null,
      commitmentStatus,
      commitmentResponse: commitmentResponse.trim() || null,
    });
  }, [emerged, commitmentStatus, commitmentResponse, addEntry, completeFollowUpModule]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      saveCaptures();
      return;
    }

    // Skip commitment response step if no input needed
    if (currentStep.id === 'commitment-check') {
      const response = COMMITMENT_RESPONSES[commitmentStatus];
      // Skip response step for 'following' which has no input
      if (commitmentStatus === 'following') {
        setIsVisible(false);
        setTimeout(() => {
          // Skip to closing step (index 4)
          setCurrentStepIndex(4);
          setStepHistory((history) => [...history, 4]);
          setIsVisible(true);
        }, 400);
        return;
      }
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
  }, [isLastStep, currentStep.id, commitmentStatus, saveCaptures]);

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

  const handleViewJournal = () => {
    saveCaptures();
    setCurrentTab('journal');
  };

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

    // Emerged step
    if (currentStep.id === 'emerged') {
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
            value={emerged}
            onChange={setEmerged}
            placeholder={content.placeholder}
            large
          />
        </div>
      );
    }

    // Commitment check step
    if (currentStep.id === 'commitment-check') {
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

          {/* Show commitment if exists */}
          {commitment && (
            <div className="py-3 px-4 border border-[var(--color-border)] rounded">
              <p className="text-[var(--color-text-tertiary)] text-xs mb-1">
                You wrote:
              </p>
              <p className="text-[var(--color-text-primary)] text-sm italic">
                "{commitment}"
              </p>
            </div>
          )}

          {/* Status options */}
          <div className="space-y-2">
            {COMMITMENT_STATUSES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCommitmentStatus(option.value)}
                className={`w-full py-3 px-4 border text-left text-sm transition-colors ${
                  commitmentStatus === option.value
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

    // Commitment response step (conditional)
    if (currentStep.id === 'commitment-response') {
      const response = COMMITMENT_RESPONSES[commitmentStatus] || COMMITMENT_RESPONSES.trying;

      // Special handling for 'forgot' - show commitment and ask if relevant
      if (commitmentStatus === 'forgot') {
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center">
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                {response.text}
              </p>
            </div>

            {commitment && (
              <blockquote className="text-[var(--color-text-primary)] text-sm leading-relaxed italic border-l-2 border-[var(--color-text-tertiary)] pl-4">
                "{commitment}"
              </blockquote>
            )}

            <p className="text-[var(--color-text-secondary)] text-sm text-center">
              {response.followUp}
            </p>

            <div className="space-y-2">
              {response.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForgotChoice(option.value)}
                  className={`w-full py-3 px-4 border text-left text-sm transition-colors ${
                    forgotChoice === option.value
                      ? 'border-[var(--color-text-primary)] text-[var(--color-text-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-tertiary)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {forgotChoice === 'no' && (
              <TransitionTextarea
                value={commitmentResponse}
                onChange={setCommitmentResponse}
                placeholder={response.noInput.placeholder}
              />
            )}
          </div>
        );
      }

      // Standard response with optional input
      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center">
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {response.text}
            </p>
          </div>

          {response.hasInput && (
            <TransitionTextarea
              value={commitmentResponse}
              onChange={setCommitmentResponse}
              placeholder={response.placeholder}
            />
          )}
        </div>
      );
    }

    // Closing step
    if (currentStep.id === 'closing') {
      return (
        <div className="text-center space-y-4 animate-fadeIn">
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {content.body}
          </p>
        </div>
      );
    }

    // Complete step
    if (currentStep.id === 'complete') {
      return (
        <div className="text-center space-y-6 animate-fadeIn">
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

          <button
            type="button"
            onClick={handleViewJournal}
            className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider hover:text-[var(--color-text-secondary)]"
          >
            View Journal
          </button>
        </div>
      );
    }

    return null;
  };

  // Get primary button config
  const getPrimaryButton = () => {
    // Commitment check - need selection
    if (currentStep.id === 'commitment-check') {
      return {
        label: 'Continue',
        onClick: handleNext,
        disabled: !commitmentStatus,
      };
    }

    // Commitment response for 'forgot' - need choice
    if (currentStep.id === 'commitment-response' && commitmentStatus === 'forgot') {
      return {
        label: 'Continue',
        onClick: handleNext,
        disabled: !forgotChoice,
      };
    }

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

  // Determine if skip should be shown
  const showSkipButton = () => {
    return currentStep.id === 'emerged' ||
           (currentStep.id === 'commitment-response' &&
            commitmentStatus !== 'following' &&
            commitmentStatus !== 'forgot');
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
            className={`w-full max-w-md mx-auto transition-opacity duration-[400ms] pb-6 ${
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
        backConfirmMessage={currentStepIndex === 0 ? 'Exit integration reflection?' : null}
        showSkip={showSkipButton()}
        onSkip={handleNext}
        skipConfirmMessage={null}
        secondaryText={showSkipButton() ? 'Skip' : null}
        onSecondary={showSkipButton() ? handleNext : null}
      />
    </>
  );
}

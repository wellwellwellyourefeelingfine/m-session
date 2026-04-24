/**
 * IntakeFlow Component
 * Manages the intake questionnaire as a unified 17-page flow.
 * Pages 1-15 are question pages from the section configs, page 16
 * is privacy/PWA info, and page 17 is the "Ready to Begin" completion
 * screen. All pages share a single fade transition system.
 */

import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import SafetyWarning from './SafetyWarning';
import ModuleProgressBar from '../active/capabilities/ModuleProgressBar';
import LeafDrawV2 from '../active/capabilities/animations/LeafDrawV2';

// Import question configurations
import { sectionAQuestions } from '../../content/intake/sectionA';
import { sectionBQuestions } from '../../content/intake/sectionB';
import { sectionCQuestions } from '../../content/intake/sectionC';
import { sectionDQuestions } from '../../content/intake/sectionD';

// Question components
import SingleSelect from './questions/SingleSelect';
import MultiSelect from './questions/MultiSelect';
import TextInput from './questions/TextInput';
import TimePicker from './questions/TimePicker';
import DosageCalculator from './questions/DosageCalculator';
import ContactInput from './questions/ContactInput';

// Flatten all questions into a single array with section info, plus two
// virtual pages at the end for privacy info and the completion screen.
const allQuestions = [
  ...sectionAQuestions.map(q => ({ ...q, section: 'A', sectionTitle: 'Experience & Context' })),
  ...sectionBQuestions.map(q => ({ ...q, section: 'B', sectionTitle: 'Intention & Focus' })),
  ...sectionCQuestions.map(q => ({ ...q, section: 'C', sectionTitle: 'Session Preferences' })),
  ...sectionDQuestions.map(q => ({ ...q, section: 'D', sectionTitle: 'Safety & Practicality' })),
  // Virtual pages — rendered through the same renderQuestion() switch
  { type: 'privacy-info', field: '_privacy', section: null, sectionTitle: 'Privacy & Best Use' },
  { type: 'completion', field: '_completion', section: null, sectionTitle: null },
];

// Transition timing — all pages use the same fade-out delay so button
// selection feedback (filled black state) is visible before the page
// fades out. The CSS transition duration (300ms via Tailwind's
// duration-300) handles the visual fade; the JS delay controls when
// the content swaps.
const TRANSITION_MS = 350;

// Safety warning messages for health conditions
const HEALTH_WARNINGS = {
  heartConditions: {
    title: 'Important Health Information',
    message: 'MDMA significantly increases heart rate and blood pressure. People with heart conditions face elevated risks including cardiac events. Please consult with a healthcare provider before proceeding, or consider whether this experience is right for you at this time.',
    continueLabel: 'I understand the risks',
  },
  psychiatricHistory: {
    title: 'Important Health Information',
    message: 'MDMA can potentially trigger or exacerbate psychotic episodes in individuals with a history of psychosis or severe psychiatric conditions. Please consult with a mental health professional before proceeding, or consider whether this experience is right for you at this time.',
    continueLabel: 'I understand the risks',
  },
  contraindicatedMedications: {
    title: 'Important Safety Information',
    message: 'The use of any of these medications with MDMA is not advised. Please see the safety information in the toolbar for more info.',
    continueLabel: 'Continue',
  },
  lastMDMAUseRecent: {
    title: 'Important Information',
    message: 'Using MDMA more frequently than every 3 months may reduce its effectiveness due to tolerance. Some research also suggests potential neurotoxicity concerns with frequent use. Consider whether waiting longer might serve you better.',
    continueLabel: 'Continue',
  },
  lastMDMAUseVeryRecent: {
    title: 'Important Safety Information',
    message: 'Using MDMA less than a month after your last use significantly increases health risks and greatly reduces the therapeutic benefit. Serotonin levels need time to replenish. We strongly recommend waiting at least 3 months between uses.',
    continueLabel: 'I understand the risks',
  },
};

export default function IntakeFlow({ onComplete }) {
  const {
    intake,
    sessionProfile,
    updateSessionProfile,
    setIntakeQuestionIndex,
  } = useSessionStore();

  // Use store for question index persistence. Clamp to valid range so
  // that persisted values from older versions (which may have had fewer
  // pages) don't overflow the array.
  const rawIndex = intake.currentQuestionIndex || 0;
  const currentQuestionIndex = Math.min(rawIndex, allQuestions.length - 1);

  const [isVisible, setIsVisible] = useState(true);
  // Tracks whether a black Continue/Generate button has been pressed.
  // Flips true on click to trigger the inverse color flash (white fill,
  // black text/border) during the 300ms pre-delay, then resets when
  // the page index changes.
  const [continuePressed, setContinuePressed] = useState(false);
  const [activeWarning, setActiveWarning] = useState(null);

  // Fade in entire component on initial mount
  const [mountedVisible, setMountedVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMountedVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const setCurrentQuestionIndex = (index) => {
    setIntakeQuestionIndex(index);
  };

  const currentQuestion = allQuestions[currentQuestionIndex];
  const currentValue = sessionProfile[currentQuestion?.field];

  // Reset pressed state whenever the page changes
  useEffect(() => {
    setContinuePressed(false);
  }, [currentQuestionIndex]);

  // Check if current question is answered
  const isCurrentAnswered = () => {
    if (!currentQuestion) return false;
    if (currentQuestion.required === false) return true;
    if (currentQuestion.type === 'multi-select') return currentValue && currentValue.length > 0;
    if (currentQuestion.type === 'text') return true; // Text can be empty for optional
    return currentValue !== null && currentValue !== undefined;
  };

  // Handle answer selection - auto-advance for single-select
  const handleAnswer = (value) => {
    updateSessionProfile(currentQuestion.field, value);

    // Check if this is a health condition question with "yes" answer - show warning
    if (currentQuestion.field === 'heartConditions' && value === 'yes') {
      setActiveWarning('heartConditions');
      return;
    }
    if (currentQuestion.field === 'psychiatricHistory' && value === 'yes') {
      setActiveWarning('psychiatricHistory');
      return;
    }
    if (currentQuestion.field === 'contraindicatedMedications' && value === 'yes') {
      setActiveWarning('contraindicatedMedications');
      return;
    }
    if (currentQuestion.field === 'lastMDMAUse' && value === '1-3-months') {
      setActiveWarning('lastMDMAUseRecent');
      return;
    }
    if (currentQuestion.field === 'lastMDMAUse' && value === 'less-than-1-month') {
      setActiveWarning('lastMDMAUseVeryRecent');
      return;
    }

    // Auto-advance for single-select — the 300ms pre-delay is already
    // baked into goToNextQuestion, so we call it directly.
    if (currentQuestion.type === 'single-select') {
      goToNextQuestion();
    }
  };

  // Handle warning acknowledgment — dismiss the modal, then advance
  // using the same goToNextQuestion timing as every other page.
  const handleWarningAcknowledge = () => {
    setActiveWarning(null);
    goToNextQuestion();
  };

  // Check if a question should be skipped based on its skipWhen or showWhen condition
  // Read fresh state from store to avoid stale closure issues during auto-advance
  const shouldSkipQuestion = (question) => {
    const currentProfile = useSessionStore.getState().sessionProfile;
    // showWhen: function-based — skip if the function returns false
    if (question?.showWhen && !question.showWhen(currentProfile)) return true;
    // skipWhen: object-based — skip if field matches value
    if (!question?.skipWhen) return false;
    const { field, value } = question.skipWhen;
    return currentProfile[field] === value;
  };

  // Navigate to next question with fade animation.
  // Unified — all 17 pages use the same transition pattern:
  //   1. 300ms pre-delay (lets filled button state register visually)
  //   2. setIsVisible(false) starts the CSS opacity fade-out (300ms)
  //   3. After TRANSITION_MS (350ms), swap content and fade back in
  // Every caller — single-select auto-advance, Continue buttons
  // (nav, ContactInput, DosageCalculator), TextInput Enter, warning
  // acknowledgment — all go through this function so timing is
  // consistent across all 17 pages.
  const goToNextQuestion = () => {
    let nextIndex = currentQuestionIndex + 1;
    // Skip questions whose skip condition is met (virtual pages never have skipWhen)
    while (nextIndex < allQuestions.length && shouldSkipQuestion(allQuestions[nextIndex])) {
      nextIndex++;
    }
    if (nextIndex >= allQuestions.length) return; // Can't advance past completion
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentQuestionIndex(nextIndex);
        document.querySelector('main')?.scrollTo({ top: 0 });
        setIsVisible(true);
      }, TRANSITION_MS);
    }, 300);
  };

  // Navigate to previous question with fade animation
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex <= 0) return;
    let prevIndex = currentQuestionIndex - 1;
    // Skip questions whose skipWhen condition is met
    while (prevIndex > 0 && shouldSkipQuestion(allQuestions[prevIndex])) {
      prevIndex--;
    }
    setIsVisible(false);
    setTimeout(() => {
      setCurrentQuestionIndex(prevIndex);
      document.querySelector('main')?.scrollTo({ top: 0 });
      setIsVisible(true);
    }, TRANSITION_MS);
  };

  const handleComplete = () => {
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete();
      }, TRANSITION_MS);
    }, 300);
  };

  // Render the current question/page component
  const renderQuestion = () => {
    if (!currentQuestion) return null;

    // Resolve contentBlocks if it's a function of the session profile. This
    // lets question configs declare conditional content (e.g., a sitter-only
    // note) using the same vocabulary as static contentBlocks. The resolution
    // happens here so leaf question components stay unaware of the function
    // form and continue to receive a plain array.
    const resolvedQuestion = typeof currentQuestion.contentBlocks === 'function'
      ? { ...currentQuestion, contentBlocks: currentQuestion.contentBlocks(sessionProfile) }
      : currentQuestion;

    const commonProps = {
      question: resolvedQuestion,
      value: currentValue,
      onChange: handleAnswer,
    };

    switch (currentQuestion.type) {
      case 'single-select':
        return <SingleSelect {...commonProps} />;
      case 'multi-select':
        return <MultiSelect {...commonProps} />;
      case 'text':
        return <TextInput {...commonProps} onContinue={goToNextQuestion} />;
      case 'time':
        return <TimePicker {...commonProps} />;
      case 'dosage-calculator':
        return <DosageCalculator {...commonProps} onContinue={goToNextQuestion} />;
      case 'contact-input':
        return <ContactInput {...commonProps} onContinue={goToNextQuestion} />;

      case 'privacy-info':
        return (
          <div className="space-y-3">
            <p
              className="text-lg"
              style={{
                fontFamily: "'DM Serif Text', serif",
                textTransform: 'none',
                color: 'var(--text-primary)',
              }}
            >
              This is a Progressive Web App
            </p>

            <p style={{ color: 'var(--text-primary)' }}>
              A PWA works best saved to your home screen. For offline access,
              full screen, and no browser distractions:
            </p>

            <ol className="text-left space-y-1 pl-4" style={{ color: 'var(--text-primary)' }}>
              <li className="list-decimal">Tap the share or menu button in your browser</li>
              <li className="list-decimal">Select <strong>Add to Home Screen</strong></li>
              <li className="list-decimal">Tap <strong>Add</strong> to confirm</li>
            </ol>

            <div aria-hidden="true" style={{ height: '6px' }} />

            <p style={{ color: 'var(--text-tertiary)' }}>
              This app doesn&apos;t use any cookies, trackers, or analytics.
              All of your data is stored locally on your device &mdash; nothing
              is ever sent to any servers.
            </p>
          </div>
        );

      case 'completion':
        return (
          <div>
            <h2
              className="text-center mb-8"
              style={{
                fontFamily: "'DM Serif Text', serif",
                textTransform: 'none',
                fontSize: '1.5rem',
                color: 'var(--text-primary)',
              }}
            >
              Ready to Begin
            </h2>

            <div className="flex justify-center mb-6">
              <LeafDrawV2 />
            </div>

            {(intake.showSafetyWarnings || intake.showMedicationWarning) && (
              <SafetyWarning
                showMedicationWarning={intake.showMedicationWarning}
                showSafetyWarnings={intake.showSafetyWarnings}
              />
            )}

            <div className="mt-8">
              <p
                className="text-lg mb-4"
                style={{
                  fontFamily: "'DM Serif Text', serif",
                  textTransform: 'none',
                  color: 'var(--text-primary)',
                }}
              >
                Your personalized session timeline will be generated based on your responses.
              </p>

              <p className="mb-6" style={{ color: 'var(--text-primary)' }}>
                In the days before your planned session, we recommend reviewing your timeline.
                You can add, remove, or reorder different activities based on the session focus
                you wish to have.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Progress bar — completion page shows 100%, all others show proportional progress
  const progress = currentQuestion?.type === 'completion'
    ? 100
    : ((currentQuestionIndex + 1) / allQuestions.length) * 100;

  // Index of the last real question (before the two virtual pages)
  const lastRealQuestionIndex = allQuestions.length - 3;

  // Determine if the Continue button should be shown and its label
  const isPrivacy = currentQuestion?.type === 'privacy-info';
  const isCompletion = currentQuestion?.type === 'completion';
  const selfAdvancingTypes = ['single-select', 'contact-input', 'dosage-calculator'];
  const isSelfAdvancing = selfAdvancingTypes.includes(currentQuestion?.type);

  // Continue button is always enabled for privacy page (no answer needed)
  const continueEnabled = isPrivacy || isCurrentAnswered() || currentQuestion?.required === false;

  return (
    <>
      <ModuleProgressBar progress={progress} visible={true} />

      <div className="transition-opacity duration-700 ease-out" style={{ opacity: mountedVisible ? 1 : 0 }}>
        <div className="max-w-md mx-auto px-6 pt-6 pb-12">
          {/* Header - section title and page counter */}
          <div className="flex justify-between items-center mb-8">
            <span className="uppercase tracking-wider text-xs text-[var(--color-text-tertiary)]">
              {currentQuestion?.sectionTitle || ''}
            </span>
            {currentQuestion?.sectionTitle && (
              <span className="text-[var(--color-text-tertiary)] text-xs">
                {currentQuestionIndex + 1} of {allQuestions.length}
              </span>
            )}
          </div>

          {/* Current page + navigation with fade animation */}
          <div
            className="transition-opacity duration-300"
            style={{ opacity: isVisible ? 1 : 0 }}
          >
            {/* key forces React to fully unmount/remount the question
                content on each page change, so buttons start with fresh
                DOM elements and no lingering CSS transition state from
                the previous page's gray fill. */}
            <div key={currentQuestionIndex}>
              {renderQuestion()}
            </div>

            {/* Navigation — unified across all 17 pages */}
            <div className="mt-6 space-y-1">
            {/* Continue / Generate button.
                When pressed, the button transitions to the shared
                "pressed" state (dark gray fill, dark gray border,
                white text) — the same target state that single-select
                option buttons transition to when clicked. */}
            {isCompletion ? (
              <button
                type="button"
                onClick={() => { setContinuePressed(true); handleComplete(); }}
                className="w-full py-4 uppercase tracking-wider border transition-colors duration-300"
                style={{
                  backgroundColor: continuePressed ? 'var(--text-secondary)' : 'var(--text-primary)',
                  color: 'var(--bg-primary)',
                  borderColor: continuePressed ? 'var(--text-secondary)' : 'var(--text-primary)',
                }}
              >
                Generate My Timeline
              </button>
            ) : !isSelfAdvancing && (
              <button
                type="button"
                onClick={() => { setContinuePressed(true); goToNextQuestion(); }}
                disabled={!continueEnabled}
                className="w-full py-4 uppercase tracking-wider border transition-colors duration-300"
                style={{
                  backgroundColor: continuePressed
                    ? 'var(--text-secondary)'
                    : continueEnabled
                      ? 'var(--text-primary)'
                      : 'var(--border)',
                  color: continuePressed
                    ? 'var(--bg-primary)'
                    : continueEnabled
                      ? 'var(--bg-primary)'
                      : 'var(--text-tertiary)',
                  borderColor: continuePressed
                    ? 'var(--text-secondary)'
                    : continueEnabled
                      ? 'var(--text-primary)'
                      : 'var(--border)',
                  cursor: continueEnabled
                    ? 'pointer'
                    : 'not-allowed',
                }}
              >
                {currentQuestionIndex === lastRealQuestionIndex ? 'Review & Continue' : 'Continue'}
              </button>
            )}

            {/* Back button */}
            {currentQuestionIndex > 0 && (
              <button
                type="button"
                onClick={goToPreviousQuestion}
                className="w-full py-2 underline"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Back
              </button>
            )}

            {/* Skip button for optional questions */}
            {currentQuestion?.required === false && currentQuestion?.type === 'single-select' && (
              <button
                type="button"
                onClick={goToNextQuestion}
                className="w-full py-2 underline"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Skip
              </button>
            )}
          </div>
          </div>
        </div>

      {/* Health Warning Modal */}
      {activeWarning && HEALTH_WARNINGS[activeWarning] && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50 px-6">
          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-sm p-6">
            <h3
              className="text-lg mb-4"
              style={{
                fontFamily: "'DM Serif Text', serif",
                textTransform: 'none',
                color: 'var(--color-text-primary)',
              }}
            >
              {HEALTH_WARNINGS[activeWarning].title}
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
              {HEALTH_WARNINGS[activeWarning].message}
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleWarningAcknowledge}
                className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
              >
                {HEALTH_WARNINGS[activeWarning].continueLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  // Reset the answer to "no" and close warning
                  updateSessionProfile(currentQuestion.field, 'no');
                  setActiveWarning(null);
                }}
                className="w-full py-2 text-[var(--color-text-tertiary)] text-xs underline"
              >
                Change my answer
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

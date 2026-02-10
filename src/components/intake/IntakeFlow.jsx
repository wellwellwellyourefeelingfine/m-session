/**
 * IntakeFlow Component
 * Manages the 4-section intake questionnaire
 * Shows one question at a time with fade animations
 */

import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import SafetyWarning from './SafetyWarning';
import ModuleProgressBar from '../active/capabilities/ModuleProgressBar';

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

// Flatten all questions into a single array with section info
const allQuestions = [
  ...sectionAQuestions.map(q => ({ ...q, section: 'A', sectionTitle: 'Experience & Context' })),
  ...sectionBQuestions.map(q => ({ ...q, section: 'B', sectionTitle: 'Intention & Focus' })),
  ...sectionCQuestions.map(q => ({ ...q, section: 'C', sectionTitle: 'Session Preferences' })),
  ...sectionDQuestions.map(q => ({ ...q, section: 'D', sectionTitle: 'Safety & Practicality' })),
];

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
    updateIntakeResponse,
    setIntakeQuestionIndex,
  } = useSessionStore();

  // Use store for question index persistence
  const currentQuestionIndex = intake.currentQuestionIndex || 0;
  const [isVisible, setIsVisible] = useState(true);
  const [showCompletionScreen, setShowCompletionScreen] = useState(
    currentQuestionIndex >= allQuestions.length
  );
  const [activeWarning, setActiveWarning] = useState(null); // 'heartConditions' | 'psychiatricHistory' | null

  const setCurrentQuestionIndex = (index) => {
    setIntakeQuestionIndex(index);
  };

  const currentQuestion = allQuestions[currentQuestionIndex];
  const currentValue = intake.responses[currentQuestion?.field];
  const totalQuestions = allQuestions.length;

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
    updateIntakeResponse(currentQuestion.section, currentQuestion.field, value);

    // Check if this is a health condition question with "yes" answer - show warning
    if (currentQuestion.field === 'heartConditions' && value === 'yes') {
      setActiveWarning('heartConditions');
      return; // Don't auto-advance, wait for warning acknowledgment
    }
    if (currentQuestion.field === 'psychiatricHistory' && value === 'yes') {
      setActiveWarning('psychiatricHistory');
      return; // Don't auto-advance, wait for warning acknowledgment
    }
    if (currentQuestion.field === 'contraindicatedMedications' && value === 'yes') {
      setActiveWarning('contraindicatedMedications');
      return; // Don't auto-advance, wait for warning acknowledgment
    }
    if (currentQuestion.field === 'lastMDMAUse' && value === '1-3-months') {
      setActiveWarning('lastMDMAUseRecent');
      return;
    }
    if (currentQuestion.field === 'lastMDMAUse' && value === 'less-than-1-month') {
      setActiveWarning('lastMDMAUseVeryRecent');
      return;
    }

    // Auto-advance after a brief delay for single-select
    if (currentQuestion.type === 'single-select') {
      setTimeout(() => {
        goToNextQuestion();
      }, 300);
    }
  };

  // Handle warning acknowledgment
  const handleWarningAcknowledge = () => {
    setActiveWarning(null);
    setTimeout(() => {
      goToNextQuestion();
    }, 100);
  };

  // Check if a question should be skipped based on its skipWhen condition
  const shouldSkipQuestion = (question) => {
    if (!question?.skipWhen) return false;
    const { field, value } = question.skipWhen;
    return intake.responses[field] === value;
  };

  // Navigate to next question with fade animation
  const goToNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      let nextIndex = currentQuestionIndex + 1;
      // Skip questions whose skipWhen condition is met
      while (nextIndex < totalQuestions && shouldSkipQuestion(allQuestions[nextIndex])) {
        nextIndex++;
      }
      setIsVisible(false);
      if (nextIndex < totalQuestions) {
        setTimeout(() => {
          setCurrentQuestionIndex(nextIndex);
          setIsVisible(true);
        }, 300);
      } else {
        setTimeout(() => {
          setShowCompletionScreen(true);
          setIsVisible(true);
        }, 300);
      }
    } else {
      // All questions done
      setIsVisible(false);
      setTimeout(() => {
        setShowCompletionScreen(true);
        setIsVisible(true);
      }, 300);
    }
  };

  // Navigate to previous question with fade animation
  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      let prevIndex = currentQuestionIndex - 1;
      // Skip questions whose skipWhen condition is met
      while (prevIndex > 0 && shouldSkipQuestion(allQuestions[prevIndex])) {
        prevIndex--;
      }
      setIsVisible(false);
      setTimeout(() => {
        setCurrentQuestionIndex(prevIndex);
        setIsVisible(true);
      }, 300);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 350);
  };

  // Render the current question component
  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const commonProps = {
      question: currentQuestion,
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
      default:
        return null;
    }
  };

  // Show completion screen
  if (showCompletionScreen) {
    return (
      <div
        className="max-w-md mx-auto px-6 py-8 transition-opacity duration-300"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <h2 className="mb-8">Ready to Begin</h2>

        {(intake.showSafetyWarnings || intake.showMedicationWarning) && (
          <SafetyWarning
            showMedicationWarning={intake.showMedicationWarning}
            showSafetyWarnings={intake.showSafetyWarnings}
          />
        )}

        <div className="mt-8">
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Your personalized session timeline will be generated based on your responses.
          </p>

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleComplete}
              className="w-full py-4 uppercase tracking-wider hover:opacity-80 transition-opacity duration-300"
              style={{
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-primary)',
              }}
            >
              Generate My Timeline
            </button>

            <button
              type="button"
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => {
                  setShowCompletionScreen(false);
                  setCurrentQuestionIndex(totalQuestions - 1);
                  setIsVisible(true);
                }, 300);
              }}
              className="w-full py-2 underline"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Back to Review
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <>
      {/* Progress bar at top - lines up with header */}
      <ModuleProgressBar
        progress={progress}
        visible={true}
        showTime={false}
      />

      {/* Main content container - positioned below progress bar */}
      <div className="fixed left-0 right-0 bottom-0 overflow-auto" style={{ top: 'var(--header-height)' }}>
        <div className="max-w-md mx-auto px-6 py-6">
          {/* Header - below progress bar */}
          <div className="flex justify-between items-center mb-8">
            <span className="uppercase tracking-wider text-xs text-[var(--color-text-tertiary)]">
              {currentQuestion?.sectionTitle}
            </span>
            <span className="text-[var(--color-text-tertiary)] text-xs">
              {currentQuestionIndex + 1} of {totalQuestions}
            </span>
          </div>

          {/* Current question with fade animation */}
          <div
            className="transition-opacity duration-300 min-h-[300px]"
            style={{ opacity: isVisible ? 1 : 0 }}
          >
            {renderQuestion()}
          </div>

          {/* Navigation - only show for non-single-select or when showing continue button */}
          <div className="mt-12 space-y-4">
            {/* Continue button for multi-select, text, and time inputs */}
            {currentQuestion?.type !== 'single-select' && (
              <button
                type="button"
                onClick={goToNextQuestion}
                disabled={!isCurrentAnswered() && currentQuestion?.required !== false}
                className="w-full py-4 uppercase tracking-wider transition-opacity duration-300"
                style={{
                  backgroundColor: (isCurrentAnswered() || currentQuestion?.required === false)
                    ? 'var(--text-primary)'
                    : 'var(--border)',
                  color: (isCurrentAnswered() || currentQuestion?.required === false)
                    ? 'var(--bg-primary)'
                    : 'var(--text-tertiary)',
                  cursor: (isCurrentAnswered() || currentQuestion?.required === false)
                    ? 'pointer'
                    : 'not-allowed',
                }}
              >
                {currentQuestionIndex === totalQuestions - 1 ? 'Review & Continue' : 'Continue'}
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6">
          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-sm p-6">
            <h3 className="text-[var(--color-text-primary)] mb-4">
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
                  updateIntakeResponse(currentQuestion.section, currentQuestion.field, 'no');
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
    </>
  );
}

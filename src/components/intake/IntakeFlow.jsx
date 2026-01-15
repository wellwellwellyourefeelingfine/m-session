/**
 * IntakeFlow Component
 * Manages the 4-section intake questionnaire
 * Shows one question at a time with fade animations
 */

import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import SafetyWarning from './SafetyWarning';

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

export default function IntakeFlow() {
  const {
    intake,
    updateIntakeResponse,
    completeIntake,
  } = useSessionStore();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);

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

    // Auto-advance after a brief delay for single-select
    if (currentQuestion.type === 'single-select') {
      setTimeout(() => {
        goToNextQuestion();
      }, 300);
    }
  };

  // Navigate to next question with fade animation
  const goToNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setIsVisible(true);
      }, 300);
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
      setIsVisible(false);
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        setIsVisible(true);
      }, 300);
    }
  };

  const handleComplete = () => {
    completeIntake();
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
        <h2 className="font-serif text-lg mb-8">Ready to Begin</h2>

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

  return (
    <div className="max-w-md mx-auto px-6 py-8">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span
            className="uppercase tracking-wider"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {currentQuestion?.sectionTitle}
          </span>
          <span style={{ color: 'var(--text-tertiary)' }}>
            {currentQuestionIndex + 1} of {totalQuestions}
          </span>
        </div>
        <div className="w-full h-px" style={{ backgroundColor: 'var(--border)' }}>
          <div
            className="h-px transition-all duration-500"
            style={{
              backgroundColor: 'var(--text-primary)',
              width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`
            }}
          />
        </div>
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
  );
}

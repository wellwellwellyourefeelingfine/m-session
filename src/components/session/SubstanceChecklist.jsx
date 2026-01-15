/**
 * SubstanceChecklist Component
 * Pre-session questionnaire about substance readiness
 * Runs after user clicks "Begin Session" but before the actual session starts
 */

import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';

const DOSAGE_FEEDBACK = {
  light: {
    range: '0-75mg',
    label: 'Light',
    description: 'A light dose. Effects will be subtle—gentle mood lift, mild openness. Good if you\'re sensitive to substances or easing in cautiously. You may not reach the full "window" for deeper work.',
  },
  moderate: {
    range: '76-125mg',
    label: 'Moderate (Therapeutic Range)',
    description: 'This is the therapeutic sweet spot. Most guided sessions use doses in this range—enough to open the window without overwhelming. A good balance of depth and manageability.',
  },
  strong: {
    range: '126-150mg',
    label: 'Strong',
    description: 'A strong dose. Expect more intense effects and potentially more physical side effects (jaw tension, temperature swings). Can be harder to stay grounded. Not necessarily more productive than moderate doses.',
  },
  heavy: {
    range: '151mg+',
    label: 'Heavy',
    description: 'This is above typical therapeutic doses. Higher doses increase physical strain and don\'t reliably produce better outcomes. Consider whether a moderate dose might serve you better. If proceeding, extra preparation and support is important.',
  },
};

export default function SubstanceChecklist() {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [editedTime, setEditedTime] = useState('');

  const substanceChecklist = useSessionStore((state) => state.substanceChecklist);
  const updateSubstanceChecklist = useSessionStore((state) => state.updateSubstanceChecklist);
  const recordIngestionTime = useSessionStore((state) => state.recordIngestionTime);
  const confirmIngestionTime = useSessionStore((state) => state.confirmIngestionTime);
  const startSession = useSessionStore((state) => state.startSession);

  const fadeTransition = (callback) => {
    setIsVisible(false);
    setTimeout(() => {
      callback();
      setIsVisible(true);
    }, 300);
  };

  const handleNext = () => {
    fadeTransition(() => setStep(step + 1));
  };

  const handleBack = () => {
    fadeTransition(() => setStep(step - 1));
  };

  const handleTakeSubstance = () => {
    recordIngestionTime(new Date());
    handleNext();
  };

  const handleTimeConfirm = (isCorrect) => {
    if (isCorrect) {
      confirmIngestionTime();
      handleNext();
    } else {
      setShowTimeEdit(true);
    }
  };

  const handleTimeEdit = () => {
    if (editedTime) {
      // Parse the edited time and create a new Date
      const [hours, minutes] = editedTime.split(':').map(Number);
      const newTime = new Date();
      newTime.setHours(hours, minutes, 0, 0);
      recordIngestionTime(newTime);
    }
    confirmIngestionTime();
    setShowTimeEdit(false);
    handleNext();
  };

  const handleBeginSession = () => {
    startSession();
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderStep = () => {
    switch (step) {
      // Step 0: Do you have your MDMA ready?
      case 0:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-xl mb-4">Before We Begin</h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Let's make sure you're ready to start your session.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-[var(--color-text-primary)]">
                Do you have your MDMA substance ready?
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    updateSubstanceChecklist('hasSubstance', true);
                    handleNext();
                  }}
                  className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left px-4"
                >
                  Yes, I have it ready
                </button>
                <button
                  onClick={() => {
                    updateSubstanceChecklist('hasSubstance', false);
                    // Could show a message or redirect
                  }}
                  className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left px-4 text-[var(--color-text-tertiary)]"
                >
                  Not yet
                </button>
              </div>
            </div>
          </div>
        );

      // Step 1: Have you tested your substance?
      case 1:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-xl mb-4">Substance Testing</h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Testing your substance helps ensure safety. We encourage using an at-home testing kit or sending a sample to a lab.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-[var(--color-text-primary)]">
                Have you tested your substance?
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    updateSubstanceChecklist('hasTestedSubstance', true);
                    handleNext();
                  }}
                  className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left px-4"
                >
                  Yes, I've tested it
                </button>
                <button
                  onClick={() => {
                    updateSubstanceChecklist('hasTestedSubstance', false);
                    handleNext();
                  }}
                  className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left px-4"
                >
                  No, but I'm confident in my source
                </button>
              </div>
            </div>

            <p className="text-[var(--color-text-tertiary)] text-sm">
              Testing resources are available in the Tools tab.
            </p>

            <button
              onClick={handleBack}
              className="text-[var(--color-text-tertiary)] underline"
            >
              Back
            </button>
          </div>
        );

      // Step 2: Dosage preparation
      case 2:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-xl mb-4">Dosage</h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Have you weighed and prepared your intended dose?
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-[var(--color-text-primary)]">
                What dose are you planning to take?
              </p>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={substanceChecklist.plannedDosageMg || ''}
                  onChange={(e) => updateSubstanceChecklist('plannedDosageMg', e.target.value)}
                  className="flex-1 py-3 px-4 border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--color-text-primary)]"
                />
                <span className="text-[var(--color-text-secondary)]">mg</span>
              </div>

              {substanceChecklist.dosageFeedback && (
                <div className="mt-6 p-4 border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  <p className="font-medium mb-2">
                    {DOSAGE_FEEDBACK[substanceChecklist.dosageFeedback].range} — {DOSAGE_FEEDBACK[substanceChecklist.dosageFeedback].label}
                  </p>
                  <p className="text-[var(--color-text-secondary)] text-sm">
                    {DOSAGE_FEEDBACK[substanceChecklist.dosageFeedback].description}
                  </p>
                </div>
              )}
            </div>

            <p className="text-[var(--color-text-tertiary)] text-sm">
              Our dosage calculator is available in the Tools tab.
            </p>

            <div className="flex justify-between">
              <button
                onClick={handleBack}
                className="text-[var(--color-text-tertiary)] underline"
              >
                Back
              </button>
              <button
                onClick={() => {
                  updateSubstanceChecklist('hasPreparedDosage', true);
                  handleNext();
                }}
                disabled={!substanceChecklist.plannedDosageMg}
                className={`px-6 py-3 uppercase tracking-wider transition-opacity ${
                  substanceChecklist.plannedDosageMg
                    ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)]'
                    : 'bg-[var(--color-border)] text-[var(--color-text-tertiary)] cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        );

      // Step 3: Prepare setting
      case 3:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-xl mb-4">Prepare Your Space</h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Before taking your substance, take a moment to prepare your environment.
              </p>
            </div>

            <div className="space-y-4 text-[var(--color-text-secondary)]">
              <div className="flex items-start space-x-3">
                <span className="text-[var(--color-text-tertiary)]">•</span>
                <p>Make sure you have water nearby</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-[var(--color-text-tertiary)]">•</span>
                <p>Have a blanket or comfortable clothing ready</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-[var(--color-text-tertiary)]">•</span>
                <p>Set your phone to Do Not Disturb</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-[var(--color-text-tertiary)]">•</span>
                <p>Have your journal or device ready for notes</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-[var(--color-text-tertiary)]">•</span>
                <p>Consider having light snacks available for later</p>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-[var(--color-text-primary)] mb-4">
                When you're ready, take your substance.
              </p>
              <button
                onClick={handleTakeSubstance}
                className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider hover:opacity-80 transition-opacity"
              >
                I've Taken It
              </button>
            </div>

            <button
              onClick={handleBack}
              className="text-[var(--color-text-tertiary)] underline"
            >
              Back
            </button>
          </div>
        );

      // Step 4: Confirm ingestion time
      case 4:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-xl mb-4">Confirm Time</h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                We've recorded that you took your substance at:
              </p>
            </div>

            <div className="text-center py-6">
              <p className="font-serif text-3xl">
                {formatTime(substanceChecklist.ingestionTime)}
              </p>
            </div>

            {!showTimeEdit ? (
              <div className="space-y-4">
                <p className="text-[var(--color-text-primary)]">
                  Is this within 5 minutes of when you actually took it?
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => handleTimeConfirm(true)}
                    className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                  >
                    Yes, that's correct
                  </button>
                  <button
                    onClick={() => handleTimeConfirm(false)}
                    className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-tertiary)]"
                  >
                    No, let me adjust
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[var(--color-text-primary)]">
                  What time did you take your substance?
                </p>
                <input
                  type="time"
                  value={editedTime}
                  onChange={(e) => setEditedTime(e.target.value)}
                  className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--color-text-primary)]"
                />
                <button
                  onClick={handleTimeEdit}
                  disabled={!editedTime}
                  className={`w-full py-4 uppercase tracking-wider transition-opacity ${
                    editedTime
                      ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)]'
                      : 'bg-[var(--color-border)] text-[var(--color-text-tertiary)] cursor-not-allowed'
                  }`}
                >
                  Confirm Time
                </button>
              </div>
            )}
          </div>
        );

      // Step 5: Ready to begin
      case 5:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-xl mb-4">You're Ready</h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Your session will now begin. Find a comfortable position—lying down is often best for the come-up.
              </p>
            </div>

            <div className="p-4 border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <p className="text-[var(--color-text-secondary)] text-sm">
                The first 20-60 minutes are the come-up phase. We'll guide you through settling in and check in with you periodically. There's nothing you need to do except relax and allow the experience to unfold.
              </p>
            </div>

            <button
              onClick={handleBeginSession}
              className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider hover:opacity-80 transition-opacity"
            >
              Begin Session
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-8">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Preparation
          </span>
          <span className="text-[var(--color-text-tertiary)]">
            {step + 1} of 6
          </span>
        </div>
        <div className="w-full bg-[var(--color-border)] h-px">
          <div
            className="bg-[var(--color-text-primary)] h-px transition-all duration-500"
            style={{ width: `${((step + 1) / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Content with fade animation */}
      <div
        className="transition-opacity duration-300"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        {renderStep()}
      </div>
    </div>
  );
}

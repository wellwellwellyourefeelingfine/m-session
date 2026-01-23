/**
 * SubstanceChecklist Component
 * Pre-session preparation questionnaire (5 steps)
 *
 * Step 0: Do you have your MDMA ready?
 * Step 1: Have you tested your substance?
 * Step 2: Dosage preparation (input + feedback)
 * Step 3: Prepare your space (tips)
 * Step 4: Trusted contact & session helper
 *
 * After completion, transitions to PreSessionIntro via substanceChecklistSubPhase
 */

import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { calculateBoosterDose } from '../../stores/useSessionStore';
import AsciiDiamond from '../active/capabilities/animations/AsciiDiamond';

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

  const substanceChecklist = useSessionStore((state) => state.substanceChecklist);
  const updateSubstanceChecklist = useSessionStore((state) => state.updateSubstanceChecklist);
  const setSubstanceChecklistSubPhase = useSessionStore((state) => state.setSubstanceChecklistSubPhase);
  const booster = useSessionStore((state) => state.booster);
  const updateBoosterPrepared = useSessionStore((state) => state.updateBoosterPrepared);

  const showBoosterStep = booster.considerBooster;
  const totalSteps = showBoosterStep ? 6 : 5;

  const BOOSTER_STEP = 3; // Only used when showBoosterStep is true

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

  const handleContinueToIntro = () => {
    fadeTransition(() => setSubstanceChecklistSubPhase('pre-session-intro'));
  };

  const renderStep = () => {
    // Booster prep step (inserted after dosage when applicable)
    if (showBoosterStep && step === BOOSTER_STEP) {
      const boosterDose = substanceChecklist.plannedDosageMg
        ? calculateBoosterDose(substanceChecklist.plannedDosageMg)
        : null;

      return (
        <div className="space-y-8">
          <div>
            <h2 className="text-sm mb-4">Supplemental Dose</h2>
            <p className="text-[var(--color-text-primary)] mb-6">
              Do you have your supplemental dose prepared?
            </p>
          </div>

          {boosterDose && (
            <div className="p-4 border border-[var(--accent)] bg-[var(--accent-bg)]">
              <p className="text-[var(--color-text-secondary)] text-sm">
                Based on your initial dose, your supplemental dose would be approximately{' '}
                <span className="text-[var(--color-text-primary)] font-medium">{boosterDose}mg</span>.
              </p>
              <p className="text-[var(--color-text-tertiary)] text-sm mt-2">
                This is approximately half your initial dose.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => {
                updateBoosterPrepared('yes');
                handleNext();
              }}
              className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left px-4"
            >
              Yes, I have it ready
            </button>
            <button
              onClick={() => {
                updateBoosterPrepared('no');
                handleNext();
              }}
              className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left px-4"
            >
              No, I'll prepare it now
            </button>
            <button
              onClick={() => {
                updateBoosterPrepared('decided-not-to');
                handleNext();
              }}
              className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left px-4 text-[var(--color-text-tertiary)]"
            >
              I've decided not to take a booster
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
    }

    // Map step for non-booster logic
    const displayStep = showBoosterStep && step > BOOSTER_STEP ? step - 1 : step;

    switch (displayStep) {
      // Step 0: Do you have your MDMA ready?
      case 0:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-sm mb-4">Before We Begin</h2>
              <p className="text-[var(--color-text-primary)] mb-6">
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
              <h2 className="text-sm mb-4">Substance Testing</h2>
              <p className="text-[var(--color-text-primary)] mb-6">
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
              <h2 className="text-sm mb-4">Dosage</h2>
              <p className="text-[var(--color-text-primary)] mb-6">
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

      // Step 3: Prepare your space
      case 3:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-sm mb-4">Prepare Your Space</h2>
              <p className="text-[var(--color-text-primary)] mb-6">
                Before taking your substance, take a moment to prepare your environment.
              </p>
            </div>

            <div className="space-y-4 text-[var(--color-text-primary)]">
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

            <div className="flex justify-between pt-4">
              <button
                onClick={handleBack}
                className="text-[var(--color-text-tertiary)] underline"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider hover:opacity-80 transition-opacity"
              >
                Continue
              </button>
            </div>
          </div>
        );

      // Step 4: Trusted Contact & Session Helper
      case 4:
        return (
          <div className="space-y-6 flex flex-col items-center text-center">
            <h2 className="text-sm">Trusted Contact & Support</h2>

            <div className="py-2">
              <AsciiDiamond />
            </div>

            <div className="space-y-6">
              <p className="text-[var(--color-text-primary)]">
                If you haven't already, let someone you trust know your plan. A simple text is enough.
              </p>

              <p className="text-[var(--color-text-primary)]">
                During the session, stay in your prepared space. If things get difficult and you feel the urge to leave, contact this person first.
              </p>

              <p className="text-[var(--color-text-tertiary)]">
                You can access the Session Helper anytime by tapping the &#9786; button.
              </p>
            </div>

            <div className="flex justify-between w-full pt-4">
              <button
                onClick={handleBack}
                className="text-[var(--color-text-tertiary)] underline"
              >
                Back
              </button>
              <button
                onClick={handleContinueToIntro}
                className="px-6 py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider hover:opacity-80 transition-opacity"
              >
                Continue
              </button>
            </div>
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
            {step + 1} of {totalSteps}
          </span>
        </div>
        <div className="w-full bg-[var(--color-border)] h-px">
          <div
            className="bg-[var(--color-text-primary)] h-px transition-all duration-500"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
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

/**
 * PreSubstanceIntention Component
 * 3-step pre-substance intention review module
 *
 * Step 0: Show primary focus reminder from intake
 * Step 1: Touchstone input (word/phrase that captures what feels important)
 * Step 2: Editable intention text
 *
 * Creates two separate journal entries:
 * - Focus entry: "MY SESSION FOCUS: [label]\nMY INITIAL IMPRESSION: [touchstone]"
 * - Intention entry: "INTENTION:\n\n[text]" (persistent — Peak Transition appends to it)
 *
 * Uses ModuleControlBar for consistent navigation:
 * - Back: go back one step (or return to activity menu from step 0)
 * - Skip: return to activity menu without completing
 * - Continue: primary action button
 */

import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import ModuleControlBar from '../active/capabilities/ModuleControlBar';
import ModuleProgressBar from '../active/capabilities/ModuleProgressBar';

const PRIMARY_FOCUS_LABELS = {
  'self-understanding': 'Self-understanding',
  'healing': 'Emotional healing',
  'relationship': 'Relationship exploration',
  'creativity': 'Creativity & insight',
  'open': 'Open exploration',
};

export default function PreSubstanceIntention() {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [touchstoneInput, setTouchstoneInput] = useState('');
  const [intentionText, setIntentionText] = useState(null); // null = not yet initialized

  // Store selectors
  const intake = useSessionStore((state) => state.intake);
  const setSubstanceChecklistSubPhase = useSessionStore(
    (state) => state.setSubstanceChecklistSubPhase
  );
  const completePreSubstanceActivity = useSessionStore(
    (state) => state.completePreSubstanceActivity
  );
  const setTouchstone = useSessionStore((state) => state.setTouchstone);
  const setIntentionJournalEntryId = useSessionStore(
    (state) => state.setIntentionJournalEntryId
  );
  const setFocusJournalEntryId = useSessionStore(
    (state) => state.setFocusJournalEntryId
  );
  const updateIntakeResponse = useSessionStore(
    (state) => state.updateIntakeResponse
  );
  const addEntry = useJournalStore((state) => state.addEntry);

  // Initialize intention text from store on first render
  if (intentionText === null) {
    setIntentionText(intake.responses?.holdingQuestion || '');
  }

  const primaryFocus = intake.responses?.primaryFocus;
  const primaryFocusLabel = PRIMARY_FOCUS_LABELS[primaryFocus] || 'your chosen focus';

  const fadeTransition = (callback) => {
    setIsVisible(false);
    setTimeout(() => {
      callback();
      setIsVisible(true);
    }, 400);
  };

  // Navigation
  const handleBack = () => {
    if (step === 0) {
      // Return to activity menu from first step
      setSubstanceChecklistSubPhase('activity-menu');
    } else {
      fadeTransition(() => setStep(step - 1));
    }
  };

  const handleSkip = () => {
    // Return to activity menu without completing
    setSubstanceChecklistSubPhase('activity-menu');
  };

  // Step handlers
  const handleStep0Continue = () => {
    fadeTransition(() => setStep(1));
  };

  const handleStep1Continue = () => {
    // Save touchstone if provided
    if (touchstoneInput.trim()) {
      setTouchstone(touchstoneInput.trim());
    }

    // Create focus journal entry
    const focusContent = `MY SESSION FOCUS: ${primaryFocusLabel}\nMY INITIAL IMPRESSION: ${touchstoneInput.trim()}`;
    const focusEntry = addEntry({
      content: focusContent,
      source: 'session',
      moduleTitle: 'Pre-Substance - Session Focus',
      isEdited: false,
    });
    setFocusJournalEntryId(focusEntry.id);

    fadeTransition(() => setStep(2));
  };

  const handleStep1Skip = () => {
    // Create focus entry without touchstone
    const focusContent = `MY SESSION FOCUS: ${primaryFocusLabel}\nMY INITIAL IMPRESSION:`;
    const focusEntry = addEntry({
      content: focusContent,
      source: 'session',
      moduleTitle: 'Pre-Substance - Session Focus',
      isEdited: false,
    });
    setFocusJournalEntryId(focusEntry.id);

    fadeTransition(() => setStep(2));
  };

  const handleStep2Continue = () => {
    // Update holdingQuestion in intake store
    updateIntakeResponse('B', 'holdingQuestion', intentionText);

    // Create the persistent intention journal entry
    const intentionContent = `INTENTION:\n\n${intentionText}`;
    const intentionEntry = addEntry({
      content: intentionContent,
      source: 'session',
      moduleTitle: 'Pre-Substance Intention',
      isEdited: false,
    });
    setIntentionJournalEntryId(intentionEntry.id);

    // Mark activity completed and return to menu
    completePreSubstanceActivity('intention');
    setSubstanceChecklistSubPhase('activity-menu');
  };

  // Get primary button config for ModuleControlBar
  const getPrimaryButton = () => {
    if (step === 1) {
      return {
        label: 'Continue',
        onClick: handleStep1Continue,
      };
    }
    if (step === 2) {
      return {
        label: 'Continue',
        onClick: handleStep2Continue,
      };
    }
    return {
      label: 'Continue',
      onClick: handleStep0Continue,
    };
  };

  const renderStep = () => {
    switch (step) {
      // Step 0: Primary Focus Reminder
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              Your Focus
            </h2>
            <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs">
              During your preparation, you said you were drawn to this session for{' '}
              <span className="text-[var(--accent)]">{primaryFocusLabel.toLowerCase()}</span>.
            </p>
            <p className="text-[var(--color-text-tertiary)] leading-relaxed uppercase tracking-wider text-xs">
              Let's take a moment to connect with what brought you here before you begin.
            </p>
          </div>
        );

      // Step 1: Touchstone Input
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              Touchstone
            </h2>
            <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs">
              Is there a word or phrase that captures what feels most important right now?
            </p>
            <p className="text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs">
              This will be available as a touchstone you can return to throughout your session.
            </p>

            <input
              type="text"
              value={touchstoneInput}
              onChange={(e) => setTouchstoneInput(e.target.value)}
              placeholder="A word or phrase..."
              className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--accent)] text-[var(--color-text-primary)]"
            />

            <button
              onClick={handleStep1Skip}
              className="text-[var(--color-text-tertiary)] underline text-xs uppercase tracking-wider"
            >
              Skip
            </button>
          </div>
        );

      // Step 2: Intention Edit
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              Your Intention
            </h2>
            <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs">
              Here is the intention you set during your preparation. Does this still hold true?
            </p>
            <p className="text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs">
              You can edit or add to it if you like.
            </p>

            <textarea
              value={intentionText}
              onChange={(e) => setIntentionText(e.target.value)}
              placeholder="What do you want to explore, heal, or understand?"
              rows={4}
              className="w-full py-3 px-4 border border-[var(--accent)] bg-[var(--accent-bg)] focus:outline-none text-[var(--color-text-primary)] resize-none leading-relaxed"
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Progress percentage
  const progress = ((step + 1) / 3) * 100;

  return (
    <>
      {/* Progress bar at top */}
      <ModuleProgressBar
        progress={progress}
        visible={true}
        showTime={false}
      />

      {/* Content area */}
      <div className="max-w-md mx-auto px-6 pt-14 pb-24">
        <div
          className={`transition-opacity duration-400 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          {renderStep()}
        </div>
      </div>

      {/* Fixed control bar */}
      <ModuleControlBar
        phase="active"
        primary={getPrimaryButton()}
        showBack={true}
        onBack={handleBack}
        backConfirmMessage={step === 0 ? 'Return to the activity menu?' : 'Go back to the previous step?'}
        showSkip={true}
        onSkip={handleSkip}
        skipConfirmMessage="Return to the activity menu?"
      />
    </>
  );
}

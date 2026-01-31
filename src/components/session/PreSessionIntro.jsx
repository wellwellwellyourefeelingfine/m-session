/**
 * PreSessionIntro Component
 * Opening Ritual flow after Substance Checklist
 *
 * 6 main steps + embedded intention sub-flow (3 steps):
 * 0: Arrival
 * 1: Intention menu (intention/breath/skip)
 *    → Intention sub-flow (3 steps): focus reminder, touchstone, intention text
 * 2: Letting Go
 * 3: Take substance ("I've Taken It")
 * 4: Confirm ingestion time
 * 5: Begin session → startSession()
 *
 * Layout: Fixed header + anchored AsciiMoon + fading text content + always-visible controls
 */

import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import ModuleControlBar from '../active/capabilities/ModuleControlBar';
import ModuleProgressBar from '../active/capabilities/ModuleProgressBar';
import AsciiMoon from '../active/capabilities/animations/AsciiMoon';
import TransitionBuffer from './TransitionBuffer';

const TOTAL_STEPS = 6;

const PRIMARY_FOCUS_LABELS = {
  'self-understanding': 'Self-understanding',
  'healing': 'Emotional healing',
  'relationship': 'Relationship exploration',
  'creativity': 'Creativity & insight',
  'open': 'Open exploration',
};

export default function PreSessionIntro() {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false); // Start hidden for entrance fade
  const [hasEnteredView, setHasEnteredView] = useState(false); // Track initial entrance
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [editedTime, setEditedTime] = useState('');
  const [timeConfirmed, setTimeConfirmed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  // Intention sub-flow state
  const [inIntentionFlow, setInIntentionFlow] = useState(false);
  const [intentionStep, setIntentionStep] = useState(0);
  const [touchstoneInput, setTouchstoneInput] = useState('');
  const [intentionText, setIntentionText] = useState(null);

  // Initial entrance fade-in effect
  useEffect(() => {
    if (!hasEnteredView) {
      // Small delay then fade in
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasEnteredView(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasEnteredView]);

  // Store selectors
  const intake = useSessionStore((state) => state.intake);
  const substanceChecklist = useSessionStore((state) => state.substanceChecklist);
  const completedActivities = useSessionStore(
    (state) => state.preSubstanceActivity.completedActivities
  );
  const recordIngestionTime = useSessionStore((state) => state.recordIngestionTime);
  const confirmIngestionTime = useSessionStore((state) => state.confirmIngestionTime);
  const startSession = useSessionStore((state) => state.startSession);
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

  // Initialize intention text from store
  if (intentionText === null) {
    setIntentionText(intake.responses?.holdingQuestion || '');
  }

  const primaryFocus = intake.responses?.primaryFocus;
  const primaryFocusLabel = PRIMARY_FOCUS_LABELS[primaryFocus] || 'your chosen focus';
  const isIntentionCompleted = completedActivities.includes('intention');

  // ============================================
  // NAVIGATION
  // ============================================

  const fadeTransition = (callback) => {
    setIsVisible(false);
    setTimeout(() => {
      callback();
      setIsVisible(true);
    }, 400); // Slightly longer for smoother transitions
  };

  const goToStep = (newStep) => {
    fadeTransition(() => setStep(newStep));
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ============================================
  // BACK NAVIGATION
  // ============================================

  const handleBack = () => {
    if (inIntentionFlow) {
      // Handle intention sub-flow back
      if (intentionStep === 0) {
        fadeTransition(() => setInIntentionFlow(false));
      } else {
        fadeTransition(() => setIntentionStep(intentionStep - 1));
      }
    } else if (step > 0) {
      // Reset time confirmation state when going back from step 5 to step 4
      if (step === 5) {
        setTimeConfirmed(false);
        setShowTimeEdit(false);
      }
      fadeTransition(() => setStep(step - 1));
    }
  };

  // ============================================
  // ACTIVITY MENU LOGIC (Step 1)
  // ============================================

  const handleIntention = () => {
    fadeTransition(() => {
      setInIntentionFlow(true);
      setIntentionStep(0);
    });
  };

  const handleSkipActivities = () => {
    goToStep(2);
  };

  // ============================================
  // INTENTION SUB-FLOW LOGIC
  // ============================================

  const handleIntentionStep0Continue = () => {
    fadeTransition(() => setIntentionStep(1));
  };

  const handleIntentionStep1Continue = () => {
    if (touchstoneInput.trim()) {
      setTouchstone(touchstoneInput.trim());
    }

    const focusContent = `MY SESSION FOCUS: ${primaryFocusLabel}\nMY INITIAL IMPRESSION: ${touchstoneInput.trim()}`;
    const focusEntry = addEntry({
      content: focusContent,
      source: 'session',
      moduleTitle: 'Pre-Substance - Session Focus',
      isEdited: false,
    });
    setFocusJournalEntryId(focusEntry.id);

    fadeTransition(() => setIntentionStep(2));
  };

  const handleIntentionStep1Skip = () => {
    const focusContent = `MY SESSION FOCUS: ${primaryFocusLabel}\nMY INITIAL IMPRESSION:`;
    const focusEntry = addEntry({
      content: focusContent,
      source: 'session',
      moduleTitle: 'Pre-Substance - Session Focus',
      isEdited: false,
    });
    setFocusJournalEntryId(focusEntry.id);

    fadeTransition(() => setIntentionStep(2));
  };

  const handleIntentionStep2Continue = () => {
    updateIntakeResponse('B', 'holdingQuestion', intentionText);

    const intentionContent = `INTENTION:\n\n${intentionText}`;
    const intentionEntry = addEntry({
      content: intentionContent,
      source: 'session',
      moduleTitle: 'Pre-Substance Intention',
      isEdited: false,
    });
    setIntentionJournalEntryId(intentionEntry.id);

    completePreSubstanceActivity('intention');

    fadeTransition(() => {
      setInIntentionFlow(false);
      setStep(2);
    });
  };

  // ============================================
  // SUBSTANCE INTAKE LOGIC (Steps 3-4)
  // ============================================

  const handleTakeSubstance = () => {
    recordIngestionTime(Date.now());
    goToStep(4);
  };

  const handleTimeConfirm = (isCorrect) => {
    if (isCorrect) {
      confirmIngestionTime();
      setTimeConfirmed(true);
    } else {
      setShowTimeEdit(true);
    }
  };

  const handleTimeEdit = () => {
    if (editedTime) {
      const [hours, minutes] = editedTime.split(':').map(Number);
      const newTime = new Date();
      newTime.setHours(hours, minutes, 0, 0);
      recordIngestionTime(newTime.getTime());
    }
    confirmIngestionTime();
    setShowTimeEdit(false);
    setTimeConfirmed(true);
  };

  const handleBeginSession = () => {
    setIsExiting(true);
    // After exit animation, show the TransitionBuffer
    setTimeout(() => {
      setShowTransition(true);
    }, 1500);
  };

  const handleTransitionComplete = () => {
    startSession();
  };

  // ============================================
  // STEP CONTENT RENDERING (Text only, no animation)
  // ============================================

  const renderStepContent = () => {
    // Intention sub-flow takes over rendering
    if (inIntentionFlow) {
      return renderIntentionStepContent();
    }

    switch (step) {
      case 0: return renderStep0Content();
      case 1: return renderStep1Content();
      case 2: return renderStep2Content();
      case 3: return renderStep3Content();
      case 4: return renderStep4Content();
      case 5: return renderStep5Content();
      default: return null;
    }
  };

  // Step 0: Arrival
  const renderStep0Content = () => (
    <div className="space-y-6 text-center">
      <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs">
        Close your eyes for a moment.
      </p>
      <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs">
        Notice your breath. Notice where your body meets the surface beneath you.
      </p>
      <p className="text-[var(--color-text-tertiary)] leading-relaxed uppercase tracking-wider text-xs">
        There's nowhere else to be right now.
      </p>
    </div>
  );

  // Step 1: Intention Menu
  const renderStep1Content = () => (
    <div className="space-y-6">
      {/* Description */}
      <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs text-center">
        Would you like to spend a few minutes with your intention before taking your substance?
      </p>

      {/* Activity buttons */}
      <div className="space-y-3">
        {/* Option 1: Review My Intention */}
        <button
          onClick={handleIntention}
          disabled={isIntentionCompleted}
          className={`w-full py-4 border text-left px-4 transition-colors ${
            isIntentionCompleted
              ? 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] cursor-not-allowed'
              : 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)] hover:opacity-80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-wider text-xs">
              Review My Intention
            </span>
            {isIntentionCompleted && (
              <span className="text-[10px] uppercase tracking-wider">Completed &#10003;</span>
            )}
          </div>
        </button>

        {/* Option 2: Brief Centering Breath (placeholder) */}
        <button
          disabled
          className="w-full py-4 border border-[var(--color-border)] text-[var(--color-text-tertiary)] cursor-not-allowed text-left px-4 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="uppercase tracking-wider text-xs">Brief Centering Breath</span>
            <span className="text-[10px] uppercase tracking-wider">Coming Soon</span>
          </div>
        </button>

        {/* Option 3: Skip */}
        <button
          onClick={handleSkipActivities}
          className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left px-4 text-[var(--color-text-primary)] uppercase tracking-wider text-xs"
        >
          Skip
        </button>
      </div>
    </div>
  );

  // Step 2: Letting Go
  const renderStep2Content = () => (
    <div className="space-y-6 text-center">
      <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs">
        You've prepared. You've set your intention.
      </p>

      <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs">
        Now let it go.
      </p>

      <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs">
        You don't need to direct what happens next or make sure it "works." The MDMA will soften the part of your mind that reacts to difficult thoughts with avoidance or defense.
      </p>

      <p className="text-[var(--color-text-tertiary)] leading-relaxed uppercase tracking-wider text-xs">
        Your only task is to stay present with whatever arises—curious rather than controlling.
      </p>
    </div>
  );

  // Step 3: Take Substance
  const renderStep3Content = () => (
    <div className="space-y-6 text-center">
      <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs">
        When you're ready.
      </p>
      <p className="text-[var(--color-text-tertiary)] leading-relaxed uppercase tracking-wider text-xs">
        There's no rush.
      </p>

      <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs">
        Find a comfortable position. Take your substance with a few sips of water.
      </p>

      <button
        onClick={handleTakeSubstance}
        className="w-full py-4 border border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity mt-4"
      >
        I've Taken It
      </button>
    </div>
  );

  // Step 4: Confirm Time
  const renderStep4Content = () => (
    <div className="space-y-6 text-center">
      <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs">
        We've recorded your start time as:
      </p>

      {/* Time display */}
      <div className="flex justify-center py-2">
        <div className="px-6 py-3 border border-[var(--accent)] bg-[var(--accent-bg)]">
          <span
            className="text-2xl text-[var(--color-text-primary)]"
            style={{ fontFamily: 'DM Serif Text, serif' }}
          >
            {formatTime(substanceChecklist.ingestionTime)}
          </span>
        </div>
      </div>

      {!showTimeEdit && !timeConfirmed ? (
        <div className="space-y-3">
          <button
            onClick={() => handleTimeConfirm(true)}
            className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors uppercase tracking-wider text-xs"
          >
            Yes, that's correct
          </button>
          <button
            onClick={() => handleTimeConfirm(false)}
            className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs"
          >
            Adjust time
          </button>
        </div>
      ) : showTimeEdit ? (
        <div className="space-y-4">
          <p className="text-[var(--color-text-primary)] uppercase tracking-wider text-xs">
            What time did you take your substance?
          </p>
          <input
            type="time"
            value={editedTime}
            onChange={(e) => setEditedTime(e.target.value)}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--accent)] text-[var(--color-text-primary)]"
          />
          <button
            onClick={handleTimeEdit}
            disabled={!editedTime}
            className={`w-full py-4 uppercase tracking-wider text-xs transition-opacity ${
              editedTime
                ? 'border border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
                : 'bg-[var(--color-border)] text-[var(--color-text-tertiary)] cursor-not-allowed'
            }`}
          >
            Confirm
          </button>
        </div>
      ) : (
        <p className="text-[var(--color-text-tertiary)] leading-relaxed uppercase tracking-wider text-xs">
          Time confirmed. Continue when ready.
        </p>
      )}
    </div>
  );

  // Step 5: Begin Session
  const renderStep5Content = () => (
    <div className="space-y-6 text-center">
      <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs">
        The session has begun.
      </p>

      <p className="text-[var(--color-text-tertiary)] leading-relaxed uppercase tracking-wider text-xs">
        For the next 30-60 minutes, the MDMA will come on gradually. There's nothing you need to do.
      </p>
    </div>
  );

  // ============================================
  // INTENTION SUB-FLOW CONTENT
  // ============================================

  const renderIntentionStepContent = () => {
    switch (intentionStep) {
      case 0:
        return (
          <div className="space-y-6 text-center">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              Your Focus
            </h2>
            <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs">
              During your preparation, you said you were drawn to this session for{' '}
              <span className="text-[var(--accent)]">{primaryFocusLabel.toLowerCase()}</span>.
            </p>
            <p className="text-[var(--color-text-tertiary)] leading-relaxed uppercase tracking-wider text-xs">
              Before you begin, take a moment with what brought you here.
            </p>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)] text-center">
              Touchstone
            </h2>
            <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs text-center">
              Is there a word or phrase that captures what feels most important right now?
            </p>
            <p className="text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs text-center">
              This will be available as a touchstone you can return to throughout your session.
            </p>

            <input
              type="text"
              value={touchstoneInput}
              onChange={(e) => setTouchstoneInput(e.target.value)}
              placeholder="A word or phrase..."
              className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--accent)] text-[var(--color-text-primary)]"
            />

            <div className="text-center">
              <button
                onClick={handleIntentionStep1Skip}
                className="text-[var(--color-text-tertiary)] underline text-xs uppercase tracking-wider"
              >
                Skip
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)] text-center">
              Your Intention
            </h2>
            <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs text-center">
              Here is the intention you set during your preparation. Does this still hold true?
            </p>
            <p className="text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs text-center">
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

  // ============================================
  // PRIMARY BUTTON CONFIGURATION
  // ============================================

  const getPrimaryButton = () => {
    // Intention sub-flow
    if (inIntentionFlow) {
      const intentionPrimary = {
        0: { label: 'Continue', onClick: handleIntentionStep0Continue },
        1: { label: 'Continue', onClick: handleIntentionStep1Continue },
        2: { label: 'Continue', onClick: handleIntentionStep2Continue },
      };
      return intentionPrimary[intentionStep];
    }

    // Main flow
    switch (step) {
      case 0:
      case 2:
        return { label: 'Continue', onClick: () => goToStep(step + 1) };

      case 1:
        // Step 1 has inline buttons, but we still show a continue in control bar
        return { label: 'Continue', onClick: handleSkipActivities };

      case 3:
        // Step 3 has inline "I've Taken It" button
        return null;

      case 4:
        if (timeConfirmed) {
          return { label: 'Continue', onClick: () => goToStep(5) };
        }
        return null;

      case 5:
        return { label: 'Begin', onClick: handleBeginSession };

      default:
        return null;
    }
  };

  // ============================================
  // PROGRESS CALCULATION
  // ============================================

  const getProgress = () => {
    if (inIntentionFlow) {
      // Hold at step 1 progress during intention sub-flow
      return ((1 + 1) / TOTAL_STEPS) * 100;
    }
    return ((step + 1) / TOTAL_STEPS) * 100;
  };

  // ============================================
  // RENDER
  // ============================================

  // Show TransitionBuffer after exit animation
  if (showTransition) {
    return <TransitionBuffer onComplete={handleTransitionComplete} />;
  }

  // Determine if we can go back
  const canGoBack = step > 0 || inIntentionFlow;

  return (
    <>
      {/* Progress bar at top */}
      <ModuleProgressBar
        progress={getProgress()}
        visible={!isExiting}
        showTime={false}
      />

      {/* Fixed layout container - fills space between progress bar and control bar */}
      <div className={`fixed left-0 right-0 flex flex-col overflow-hidden transition-opacity duration-700 ${isExiting ? 'opacity-0' : 'opacity-100'}`} style={{ top: 'var(--header-height)', bottom: 'var(--bottom-chrome)' }}>
        {/* Header - below progress bar with proper spacing */}
        <div className="flex-shrink-0 px-6 pt-6 pb-2 flex justify-between items-center">
          <span className="uppercase tracking-wider text-xs text-[var(--color-text-tertiary)]">
            Opening Ritual
          </span>
          <span className="text-[var(--color-text-tertiary)] text-xs">
            {step + 1} of {TOTAL_STEPS}
          </span>
        </div>

        {/* Animation container - fixed height, anchored */}
        {/* Moon fades in on first page entrance, stays visible during transitions, fades out only on exit */}
        <div
          className={`flex-shrink-0 flex justify-center py-4 transition-opacity duration-700 ${hasEnteredView && !isExiting ? 'opacity-100' : 'opacity-0'}`}
        >
          <AsciiMoon />
        </div>

        {/* Content area - scrollable, text fades */}
        <div className="flex-1 overflow-auto px-6 pb-4">
          <div className="max-w-md mx-auto">
            <div
              className={`transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            >
              {renderStepContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Control bar - always visible */}
      {!isExiting && (
        <ModuleControlBar
          phase="active"
          primary={getPrimaryButton()}
          showBack={canGoBack}
          onBack={handleBack}
          backConfirmMessage={null}
        />
      )}
    </>
  );
}

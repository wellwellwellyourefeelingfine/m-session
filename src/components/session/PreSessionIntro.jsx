/**
 * PreSessionIntro Component
 * Pre-session ritual flow after Substance Checklist Part 1
 *
 * 6 main steps + embedded intention sub-flow (3 steps):
 * 0: Arrival (BreathOrb idle)
 * 1: Intention menu (intention/breath/skip)
 *    → Intention sub-flow (3 steps): focus reminder, touchstone, intention text
 * 2: Letting Go (BreathOrb idle)
 * 3: Take substance ("I've Taken It")
 * 4: Confirm ingestion time
 * 5: Begin session → startSession()
 */

import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import ModuleControlBar from '../active/capabilities/ModuleControlBar';
import ModuleProgressBar from '../active/capabilities/ModuleProgressBar';
import BreathOrb from '../active/capabilities/animations/BreathOrb';
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
  const [isVisible, setIsVisible] = useState(true);
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
    }, 300);
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

  const handleIntentionBack = () => {
    if (intentionStep === 0) {
      fadeTransition(() => {
        setInIntentionFlow(false);
      });
    } else {
      fadeTransition(() => setIntentionStep(intentionStep - 1));
    }
  };

  const handleIntentionSkip = () => {
    fadeTransition(() => {
      setInIntentionFlow(false);
    });
  };

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
    recordIngestionTime(new Date());
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
      recordIngestionTime(newTime);
    }
    confirmIngestionTime();
    setShowTimeEdit(false);
    setTimeConfirmed(true);
  };

  const handleBeginSession = () => {
    setIsExiting(true);
    // Text fades over 700ms, moon holds then fades with 700ms delay + 700ms duration
    // After ~2.4s, show the TransitionBuffer
    setTimeout(() => {
      setShowTransition(true);
    }, 2400);
  };

  const handleTransitionComplete = () => {
    startSession();
  };

  // ============================================
  // STEP RENDERING
  // ============================================

  const renderStep = () => {
    // Intention sub-flow takes over rendering
    if (inIntentionFlow) {
      return renderIntentionStep();
    }

    switch (step) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  // Step 0: Arrival
  const renderStep0 = () => (
    <div className="space-y-8 flex flex-col items-center text-center">
      <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs">
        Close your eyes for a moment.
      </p>
      <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs">
        Notice your breath. Notice where your body meets the surface beneath you.
      </p>

      <div className="py-4">
        <BreathOrb isIdle={true} size="medium" />
      </div>

      <p className="text-[var(--color-text-tertiary)] leading-relaxed uppercase tracking-wider text-xs">
        There's nowhere else to be right now.
      </p>
    </div>
  );

  // Step 1: Intention Menu
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Header */}
      <p className="uppercase tracking-wider text-[var(--color-text-tertiary)] text-xs">
        Before You Begin
      </p>

      {/* ASCII Moon */}
      <div className="flex justify-center">
        <AsciiMoon />
      </div>

      {/* Description */}
      <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs">
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
  const renderStep2 = () => (
    <div className="space-y-8 flex flex-col items-center text-center">
      <div className="py-4">
        <BreathOrb isIdle={true} size="medium" />
      </div>

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
  const renderStep3 = () => (
    <div className="space-y-6 flex flex-col items-center text-center">
      <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs">
        When you're ready.
      </p>
      <p className="text-[var(--color-text-tertiary)] leading-relaxed uppercase tracking-wider text-xs">
        There's no rush.
      </p>

      {/* ASCII Moon */}
      <div className="py-4">
        <AsciiMoon />
      </div>

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
  const renderStep4 = () => (
    <div className="space-y-6 flex flex-col items-center text-center">
      <p className="text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs">
        We've recorded your start time as:
      </p>

      {/* Time display */}
      <div className="flex justify-center py-4">
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
      ) : null}
    </div>
  );

  // Step 5: Begin Session
  const renderStep5 = () => (
    <div className="space-y-8 flex flex-col items-center text-center">
      <p className={`text-[var(--color-text-primary)] leading-relaxed uppercase tracking-wider text-xs transition-opacity duration-700 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
        The session has begun.
      </p>

      <div className={`py-4 transition-opacity duration-700 ${isExiting ? 'delay-700 opacity-0' : 'opacity-100'}`}>
        <AsciiMoon />
      </div>

      <p className={`text-[var(--color-text-tertiary)] leading-relaxed uppercase tracking-wider text-xs transition-opacity duration-700 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
        For the next 30-60 minutes, the MDMA will come on gradually. There's nothing you need to do.
      </p>
    </div>
  );

  // ============================================
  // INTENTION SUB-FLOW RENDERING
  // ============================================

  const renderIntentionStep = () => {
    switch (intentionStep) {
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
              Before you begin, take a moment with what brought you here.
            </p>
          </div>
        );

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
              onClick={handleIntentionStep1Skip}
              className="text-[var(--color-text-tertiary)] underline text-xs uppercase tracking-wider"
            >
              Skip
            </button>
          </div>
        );

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

  // ============================================
  // CONTROL BAR CONFIGURATION
  // ============================================

  const getControlBar = () => {
    // Intention sub-flow controls
    if (inIntentionFlow) {
      const intentionPrimary = {
        0: { label: 'Continue', onClick: handleIntentionStep0Continue },
        1: { label: 'Continue', onClick: handleIntentionStep1Continue },
        2: { label: 'Continue', onClick: handleIntentionStep2Continue },
      };

      return (
        <ModuleControlBar
          phase="active"
          primary={intentionPrimary[intentionStep]}
          showBack={true}
          onBack={handleIntentionBack}
          backConfirmMessage={intentionStep === 0 ? 'Return to the activity menu?' : 'Go back to the previous step?'}
          showSkip={true}
          onSkip={handleIntentionSkip}
          skipConfirmMessage="Return to the activity menu?"
        />
      );
    }

    // Steps that use ModuleControlBar
    switch (step) {
      case 0:
      case 2:
        return (
          <ModuleControlBar
            phase="active"
            primary={{ label: 'Continue', onClick: () => goToStep(step + 1) }}
            showBack={step > 0}
            onBack={() => goToStep(step - 1)}
            showSkip={false}
          />
        );

      case 4:
        return timeConfirmed ? (
          <ModuleControlBar
            phase="active"
            primary={{ label: 'Continue', onClick: () => goToStep(5) }}
            showBack={false}
            showSkip={false}
          />
        ) : null;

      case 5:
        return isExiting ? null : (
          <ModuleControlBar
            phase="active"
            primary={{ label: 'Begin', onClick: handleBeginSession }}
            showBack={false}
            showSkip={false}
          />
        );

      // Steps 1, 3: No ModuleControlBar (inline buttons)
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

  return (
    <>
      {/* Progress bar at top */}
      <ModuleProgressBar
        progress={getProgress()}
        visible={!isExiting}
        showTime={false}
      />

      {/* Content area */}
      <div className="max-w-md mx-auto px-6 pt-14 pb-24">
        <div
          className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          {renderStep()}
        </div>
      </div>

      {/* Fixed control bar (conditional) */}
      {getControlBar()}
    </>
  );
}

/**
 * BoosterConsiderationModal Component
 * Modal that slides up from the bottom (similar to ComeUpCheckIn) to guide
 * the user through the booster dose decision at ~90 minutes post-ingestion.
 *
 * Steps:
 * 0: Arrival — context about timing
 * 1: Experience Quality Check
 * 2: Physical Check
 * 3: Trajectory Check
 * 4: Decision Point (take / skip / snooze)
 * 5: Take Confirmation ("I've Taken My Booster")
 * 5b: Time Confirmation
 * 5c: Taken Acknowledgment
 * 6: Skip Confirmation
 *
 * Branching logic:
 * - "Intense" experience → gentle suggestion to skip
 * - "Uncomfortable" physical → gentle suggestion to skip
 * - "Complete"/"Ready to integrate" trajectory → gentle suggestion to skip
 */

import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { calculateBoosterDose } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import AsciiDiamond from '../active/capabilities/animations/AsciiDiamond';

export default function BoosterConsiderationModal() {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [editedTime, setEditedTime] = useState('');
  const [liveMinutes, setLiveMinutes] = useState(0);

  // Store selectors
  const booster = useSessionStore((state) => state.booster);
  const substanceChecklist = useSessionStore((state) => state.substanceChecklist);
  const getElapsedMinutes = useSessionStore((state) => state.getElapsedMinutes);
  const recordBoosterCheckIn = useSessionStore((state) => state.recordBoosterCheckIn);
  const takeBooster = useSessionStore((state) => state.takeBooster);
  const confirmBoosterTime = useSessionStore((state) => state.confirmBoosterTime);
  const skipBooster = useSessionStore((state) => state.skipBooster);
  const snoozeBooster = useSessionStore((state) => state.snoozeBooster);
  const isSnoozeAvailable = useSessionStore((state) => state.isSnoozeAvailable);
  const hideBoosterModal = useSessionStore((state) => state.hideBoosterModal);
  const pauseMeditationPlayback = useSessionStore((state) => state.pauseMeditationPlayback);
  const maximizeBooster = useSessionStore((state) => state.maximizeBooster);

  // Pause active module timer when modal mounts or is maximized
  useEffect(() => {
    if (!booster.isMinimized) {
      const { meditationPlayback } = useSessionStore.getState();
      if (meditationPlayback.isPlaying) {
        pauseMeditationPlayback();
      }
    }
  }, [booster.isMinimized]); // eslint-disable-line react-hooks/exhaustive-deps

  // Determine initial step: if past 150 minutes, show window-expired
  const initialMinutes = getElapsedMinutes();
  const [step, setStep] = useState(() => initialMinutes >= 150 ? 'window-expired' : 0);

  // Reset step only when auto-prompted after snooze timer expires
  // (showBoosterModal sets status to 'prompted' — manual tap via maximizeBooster does not)
  useEffect(() => {
    if (booster.status === 'prompted' && booster.isModalVisible && !booster.isMinimized) {
      const mins = getElapsedMinutes();
      setStep(mins >= 150 ? 'window-expired' : 0);
    }
  }, [booster.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const initialDoseMg = substanceChecklist.plannedDosageMg;
  const calculatedBoosterMg = initialDoseMg ? calculateBoosterDose(initialDoseMg) : null;
  const canSnooze = isSnoozeAvailable();

  // Live-updating minutes since ingestion
  useEffect(() => {
    setLiveMinutes(getElapsedMinutes());
    const interval = setInterval(() => {
      setLiveMinutes(getElapsedMinutes());
    }, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [getElapsedMinutes]);

  const addJournalEntry = useJournalStore((state) => state.addEntry);

  // ============================================
  // JOURNAL ENTRY CREATION
  // ============================================

  const EXPERIENCE_LABELS = {
    'deep-meaningful': 'Deep and meaningful',
    'pleasant-open': 'Pleasant and open',
    'settled': 'Settled but ready to shift',
    'intense': 'Intense',
    'uncertain': 'Uncertain',
  };

  const PHYSICAL_LABELS = {
    'comfortable': 'Comfortable',
    'some-tension': 'Some tension',
    'temperature': 'Temperature fluctuations',
    'noticeable': 'Noticeable physical effects',
    'uncomfortable': 'Uncomfortable',
  };

  const TRAJECTORY_LABELS = {
    'more-to-explore': 'More to explore',
    'middle-of-something': 'In the middle of something',
    'complete': 'Feeling complete',
    'ready-to-integrate': 'Ready to integrate',
  };

  const createBoosterJournalEntry = (decision) => {
    const responses = booster.checkInResponses;
    const lines = [`Booster Check-In — ${liveMinutes} min since ingestion`];
    lines.push('');

    if (responses.experienceQuality) {
      lines.push(`Experience: ${EXPERIENCE_LABELS[responses.experienceQuality] || responses.experienceQuality}`);
    }
    if (responses.physicalState) {
      lines.push(`Body: ${PHYSICAL_LABELS[responses.physicalState] || responses.physicalState}`);
    }
    if (responses.trajectory) {
      lines.push(`Trajectory: ${TRAJECTORY_LABELS[responses.trajectory] || responses.trajectory}`);
    }

    lines.push('');
    if (decision === 'taken') {
      lines.push(`Decision: Took booster (${calculatedBoosterMg}mg)`);
    } else if (decision === 'skipped') {
      lines.push('Decision: Skipped booster');
    }

    addJournalEntry({
      content: lines.join('\n'),
      source: 'session',
      moduleTitle: 'Booster Check-In',
    });
  };

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

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      hideBoosterModal();
    }, 300);
  };

  // ============================================
  // CHECK-IN HANDLERS
  // ============================================

  const handleExperienceSelect = (value) => {
    recordBoosterCheckIn('experienceQuality', value);
    if (value === 'intense') {
      goToStep('branch-intensity');
    } else {
      goToStep(2);
    }
  };

  const handlePhysicalSelect = (value) => {
    recordBoosterCheckIn('physicalState', value);
    if (value === 'uncomfortable') {
      goToStep('branch-discomfort');
    } else {
      goToStep(3);
    }
  };

  const handleTrajectorySelect = (value) => {
    recordBoosterCheckIn('trajectory', value);
    if (value === 'complete' || value === 'ready-to-integrate') {
      goToStep('branch-completion');
    } else {
      goToStep(4);
    }
  };

  // ============================================
  // DECISION HANDLERS
  // ============================================

  const handleTakeDecision = () => {
    goToStep(5);
  };

  const handleSkipDecision = () => {
    goToStep(6);
  };

  const handleSnoozeDecision = () => {
    snoozeBooster();
  };

  const handleTakeConfirm = () => {
    takeBooster(new Date());
    createBoosterJournalEntry('taken');
    goToStep('5b');
  };

  const handleTimeConfirm = (isCorrect) => {
    if (isCorrect) {
      goToStep('5c');
    } else {
      setShowTimeEdit(true);
    }
  };

  const handleTimeEdit = () => {
    if (editedTime) {
      const [hours, minutes] = editedTime.split(':').map(Number);
      const newTime = new Date();
      newTime.setHours(hours, minutes, 0, 0);
      confirmBoosterTime(newTime);
    }
    setShowTimeEdit(false);
    goToStep('5c');
  };

  const handleSkipConfirm = () => {
    createBoosterJournalEntry('skipped');
    skipBooster();
  };

  const handleTakenAcknowledge = () => {
    handleDismiss();
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ============================================
  // STEP RENDERING
  // ============================================

  const renderStep = () => {
    switch (step) {
      case 0: return renderArrival();
      case 1: return renderExperienceCheck();
      case 2: return renderPhysicalCheck();
      case 3: return renderTrajectoryCheck();
      case 4: return renderDecisionPoint();
      case 5: return renderTakeConfirmation();
      case '5b': return renderTimeConfirmation();
      case '5c': return renderTakenAcknowledgment();
      case 6: return renderSkipConfirmation();
      case 'branch-intensity': return renderIntensityBranch();
      case 'branch-discomfort': return renderDiscomfortBranch();
      case 'branch-completion': return renderCompletionBranch();
      case 'window-expired': return renderWindowExpired();
      default: return null;
    }
  };

  // Step 0: Arrival
  const renderArrival = () => (
    <div className="space-y-6">
      <p className="text-[var(--color-text-primary)] leading-relaxed">
        You've been in your session for about {liveMinutes} minutes.
      </p>
      <p className="text-[var(--color-text-primary)] leading-relaxed">
        This is the window where some people choose to take a supplemental dose to extend the experience.
      </p>
      <p className="text-[var(--color-text-secondary)] leading-relaxed">
        Let's check in with how you're feeling.
      </p>
      <button
        onClick={() => goToStep(1)}
        className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
      >
        Continue
      </button>
    </div>
  );

  // Step 1: Experience Quality Check
  const renderExperienceCheck = () => (
    <div className="space-y-6">
      <p className="text-[var(--color-text-primary)] leading-relaxed">
        How would you describe your experience right now?
      </p>
      <div className="space-y-3">
        {[
          { value: 'deep-meaningful', label: 'Deep and meaningful', desc: 'I\'m engaged in important work' },
          { value: 'pleasant-open', label: 'Pleasant and open', desc: 'I feel good, connected' },
          { value: 'settled', label: 'Settled but ready to shift', desc: 'I feel complete with this phase' },
          { value: 'intense', label: 'Intense', desc: 'This is already a lot' },
          { value: 'uncertain', label: 'Uncertain', desc: 'I\'m not sure how to describe it' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => handleExperienceSelect(option.value)}
            className="w-full py-4 px-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left"
          >
            <p className="text-[var(--color-text-primary)]">{option.label}</p>
            <p className="text-[var(--color-text-tertiary)] text-sm">{option.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );

  // Step 2: Physical Check
  const renderPhysicalCheck = () => (
    <div className="space-y-6">
      <p className="text-[var(--color-text-primary)] leading-relaxed">
        How is your body feeling?
      </p>
      <div className="space-y-3">
        {[
          { value: 'comfortable', label: 'Comfortable', desc: 'No significant discomfort' },
          { value: 'some-tension', label: 'Some tension', desc: 'Jaw, shoulders, or elsewhere' },
          { value: 'temperature', label: 'Temperature fluctuations', desc: 'Feeling hot or cold' },
          { value: 'noticeable', label: 'Noticeable physical effects', desc: 'But manageable' },
          { value: 'uncomfortable', label: 'Uncomfortable', desc: 'Significant physical side effects' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => handlePhysicalSelect(option.value)}
            className="w-full py-4 px-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left"
          >
            <p className="text-[var(--color-text-primary)]">{option.label}</p>
            <p className="text-[var(--color-text-tertiary)] text-sm">{option.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );

  // Step 3: Trajectory Check
  const renderTrajectoryCheck = () => (
    <div className="space-y-6">
      <p className="text-[var(--color-text-primary)] leading-relaxed">
        Thinking about your session so far...
      </p>
      <div className="space-y-3">
        {[
          { value: 'more-to-explore', label: 'There\'s more I want to explore', desc: 'I\'d like more time' },
          { value: 'middle-of-something', label: 'I\'m in the middle of something', desc: 'It feels unfinished' },
          { value: 'complete', label: 'I feel complete', desc: 'What needed to happen has happened' },
          { value: 'ready-to-integrate', label: 'I\'m ready to begin integrating', desc: 'To start coming back' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => handleTrajectorySelect(option.value)}
            className="w-full py-4 px-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left"
          >
            <p className="text-[var(--color-text-primary)]">{option.label}</p>
            <p className="text-[var(--color-text-tertiary)] text-sm">{option.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );

  // Step 4: Decision Point
  const renderDecisionPoint = () => (
    <div className="space-y-6">
      <p className="text-[var(--color-text-primary)] leading-relaxed">
        Based on what you've shared, you seem to be in a good place to consider a supplemental dose if you'd like to extend your session.
      </p>

      {/* Dosage info box */}
      <div className="p-4 border border-[var(--accent)] bg-[var(--accent-bg)]">
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider">Your Initial Dose</span>
            <span className="text-[var(--color-text-primary)] text-lg normal-case" style={{ fontFamily: 'DM Serif Text, serif' }}>
              {initialDoseMg}mg
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider">Recommended Booster</span>
            <span className="text-[var(--color-text-primary)] text-lg normal-case" style={{ fontFamily: 'DM Serif Text, serif' }}>
              {calculatedBoosterMg}mg
            </span>
          </div>
        </div>
        <p className="text-[var(--color-text-tertiary)] text-sm mt-3">
          This is approximately half your initial dose.
        </p>
      </div>

      <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
        A booster at this point would extend your session by approximately 1-2 hours.
      </p>

      <p className="text-[var(--color-text-primary)] leading-relaxed">
        What would you like to do?
      </p>

      <div className="space-y-3">
        <button
          onClick={handleTakeDecision}
          className="w-full py-4 px-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left uppercase tracking-wider text-xs"
        >
          Take my booster dose now
        </button>
        <button
          onClick={handleSkipDecision}
          className="w-full py-4 px-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left uppercase tracking-wider text-xs"
        >
          Skip the booster
        </button>
        {canSnooze && (
          <button
            onClick={handleSnoozeDecision}
            className="w-full py-4 px-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left uppercase tracking-wider text-xs"
          >
            Ask me again in 10 minutes
          </button>
        )}
      </div>
    </div>
  );

  // Step 5: Take Confirmation
  const renderTakeConfirmation = () => (
    <div className="space-y-6 flex flex-col items-center text-center">
      <p className="text-[var(--color-text-primary)] leading-relaxed">
        Take your supplemental dose now.
      </p>

      <div className="py-4">
        <AsciiDiamond />
      </div>

      <p className="text-[var(--color-text-secondary)] leading-relaxed">
        Recommended: <span className="text-lg normal-case" style={{ fontFamily: 'DM Serif Text, serif' }}>{calculatedBoosterMg}mg</span>
      </p>

      <p className="text-[var(--color-text-tertiary)] leading-relaxed text-sm">
        Take it with a sip of water, then settle back in.
      </p>

      <button
        onClick={handleTakeConfirm}
        className="w-full py-4 border border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
      >
        I've Taken My Booster
      </button>
      <button
        onClick={handleSkipDecision}
        className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs"
      >
        I decided not to take it
      </button>
    </div>
  );

  // Step 5b: Time Confirmation
  const renderTimeConfirmation = () => (
    <div className="space-y-6 flex flex-col items-center text-center">
      <p className="text-[var(--color-text-primary)] leading-relaxed">
        We've recorded that you took your booster at:
      </p>

      <div className="px-6 py-3 border border-[var(--accent)] bg-[var(--accent-bg)]">
        <span
          className="text-2xl text-[var(--color-text-primary)]"
          style={{ fontFamily: 'DM Serif Text, serif' }}
        >
          {formatTime(booster.boosterTakenAt)}
        </span>
      </div>

      <p className="text-[var(--color-text-secondary)]">Is this correct?</p>

      {!showTimeEdit ? (
        <div className="space-y-3 w-full">
          <button
            onClick={() => handleTimeConfirm(true)}
            className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors uppercase tracking-wider text-xs"
          >
            Yes, that's right
          </button>
          <button
            onClick={() => handleTimeConfirm(false)}
            className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs"
          >
            Adjust time
          </button>
        </div>
      ) : (
        <div className="space-y-4 w-full">
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
      )}
    </div>
  );

  // Step 5c: Taken Acknowledgment
  const renderTakenAcknowledgment = () => (
    <div className="space-y-6">
      <p className="text-[var(--color-text-primary)] leading-relaxed">
        Your booster is recorded.
      </p>
      <p className="text-[var(--color-text-secondary)] leading-relaxed">
        You may notice a gentle return of the opening effects over the next 20-30 minutes.
      </p>
      <p className="text-[var(--color-text-secondary)] leading-relaxed">
        Continue with your session. There's nothing you need to do except allow the experience to unfold.
      </p>
      <button
        onClick={handleTakenAcknowledge}
        className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
      >
        Continue
      </button>
    </div>
  );

  // Step 6: Skip Confirmation
  const renderSkipConfirmation = () => (
    <div className="space-y-6">
      <p className="text-[var(--color-text-primary)] leading-relaxed">
        You've chosen to continue with a single dose.
      </p>
      <p className="text-[var(--color-text-secondary)] leading-relaxed">
        That's a perfectly valid choice. Many meaningful sessions happen with one dose.
      </p>
      <p className="text-[var(--color-text-secondary)] leading-relaxed">
        Continue with your session.
      </p>
      <button
        onClick={handleSkipConfirm}
        className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
      >
        Continue
      </button>
    </div>
  );

  // ============================================
  // BRANCH SCREENS
  // ============================================

  // Branch: Intensity warning
  const renderIntensityBranch = () => (
    <div className="space-y-6">
      <p className="text-[var(--color-text-primary)] leading-relaxed">
        It sounds like you're already working with a lot. There's no need to add more.
      </p>
      <p className="text-[var(--color-text-secondary)] leading-relaxed">
        You can skip the booster and continue with your session.
      </p>
      <div className="space-y-3">
        <button
          onClick={handleSkipDecision}
          className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors uppercase tracking-wider text-xs"
        >
          Skip Booster
        </button>
        <button
          onClick={() => goToStep(2)}
          className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs"
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );

  // Branch: Discomfort warning
  const renderDiscomfortBranch = () => (
    <div className="space-y-6">
      <p className="text-[var(--color-text-primary)] leading-relaxed">
        Physical discomfort is worth paying attention to. A booster would add more substance for your body to process.
      </p>
      <p className="text-[var(--color-text-secondary)] leading-relaxed">
        Consider whether extending feels right given how your body is responding.
      </p>
      <div className="space-y-3">
        <button
          onClick={handleSkipDecision}
          className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors uppercase tracking-wider text-xs"
        >
          Skip Booster
        </button>
        <button
          onClick={() => goToStep(3)}
          className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs"
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );

  // Branch: Completion path
  const renderCompletionBranch = () => (
    <div className="space-y-6">
      <p className="text-[var(--color-text-primary)] leading-relaxed">
        It sounds like this might be a natural place to let the session find its own ending.
      </p>
      <p className="text-[var(--color-text-secondary)] leading-relaxed">
        Trusting that sense of completion is valid.
      </p>
      <div className="space-y-3">
        <button
          onClick={handleSkipDecision}
          className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors uppercase tracking-wider text-xs"
        >
          Skip Booster
        </button>
        <button
          onClick={() => goToStep(4)}
          className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs"
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );

  // Window expired message (past 150 minutes)
  const renderWindowExpired = () => (
    <div className="space-y-6">
      <p className="text-[var(--color-text-primary)] leading-relaxed">
        You've gone past the window in which it's recommended to take a booster. We recommend skipping at this point.
      </p>
      <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
        A booster taken this late is unlikely to have its intended effect and may simply extend side effects.
      </p>
      <div className="space-y-3">
        <button
          onClick={() => {
            skipBooster();
          }}
          className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
        >
          Skip Booster
        </button>
        <button
          onClick={() => {
            goToStep(5);
          }}
          className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs"
        >
          Take It Anyway
        </button>
      </div>
    </div>
  );

  // ============================================
  // RENDER
  // ============================================

  if (!booster.isModalVisible) return null;

  // Minimized state - bar above the control bar (same pattern as ComeUpCheckIn)
  if (booster.isMinimized) {
    return (
      <button
        onClick={maximizeBooster}
        className="fixed bottom-[104px] left-0 right-0 bg-[var(--accent-bg)] border-t border-b border-[var(--accent)] py-3 px-4 flex items-center justify-between z-40"
      >
        <span
          className="text-[var(--color-text-primary)] text-sm"
          style={{ fontFamily: 'DM Serif Text, serif', fontStyle: 'italic' }}
        >
          Booster Check-In
        </span>
        <span className="text-[var(--color-text-tertiary)] text-xs">
          Tap to open
        </span>
      </button>
    );
  }

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-end justify-center z-50 ${isAnimatingOut ? 'animate-fadeOut' : 'animate-fadeIn'}`}
      onClick={snoozeBooster}
    >
      <div
        className={`bg-[var(--color-bg)] w-full max-w-md rounded-t-2xl p-6 pb-8 max-h-[85vh] overflow-y-auto ${isAnimatingOut ? 'animate-slideDownOut' : 'animate-slideUp'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="mb-1 text-[var(--color-text-primary)]">Booster Check-In</h3>
            <p className="text-[var(--color-text-tertiary)] text-sm">
              {liveMinutes} minutes since ingestion
            </p>
          </div>
          <button
            onClick={snoozeBooster}
            className="p-2 -m-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            title="Minimize"
          >
            —
          </button>
        </div>

        {/* Content with fade animation */}
        <div
          className="transition-opacity duration-300"
          style={{ opacity: isVisible ? 1 : 0 }}
        >
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

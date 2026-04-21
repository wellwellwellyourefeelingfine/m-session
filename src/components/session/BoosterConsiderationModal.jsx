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
 * 4: Decision Point (take / edit dose / skip / snooze)
 * 4b: Edit Booster Dose (adjustable input with real-time safety feedback)
 * 5: Take Confirmation ("I've Taken My Booster")
 * 5b: Booster Confirmation (time + dosage summary + what to expect)
 * 6: Skip Confirmation
 *
 * Branching logic:
 * - "Intense" experience → gentle suggestion to skip
 * - "Uncomfortable" physical → gentle suggestion to skip
 * - "Complete"/"Ready to integrate" trajectory → gentle suggestion to skip
 */

import { useState, useEffect, useRef } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { calculateBoosterDose } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import AsciiDiamond from '../active/capabilities/animations/AsciiDiamond';
import { CircleSkipIcon, CirclePlusIcon, FireIcon, ChevronLeftIcon } from '../shared/Icons';

const MODAL_HEIGHT_SHORT = '48vh';
const MODAL_HEIGHT_TALL = '75vh';
const TALL_STEPS = new Set([1, 2, 3, 4, '4b', 5, '5b']);
const getModalHeight = (step) => TALL_STEPS.has(step) ? MODAL_HEIGHT_TALL : MODAL_HEIGHT_SHORT;

export default function BoosterConsiderationModal() {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [editedTime, setEditedTime] = useState('');
  const [liveMinutes, setLiveMinutes] = useState(0);
  const [editingDose, setEditingDose] = useState('');
  const boosterJournalEntryId = useRef(null);

  // Store selectors
  const booster = useSessionStore((state) => state.booster);
  const plannedDosageMg = useSessionStore((state) => state.sessionProfile.plannedDosageMg);
  const getElapsedMinutes = useSessionStore((state) => state.getElapsedMinutes);
  const recordBoosterCheckIn = useSessionStore((state) => state.recordBoosterCheckIn);
  const takeBooster = useSessionStore((state) => state.takeBooster);
  const confirmBoosterTime = useSessionStore((state) => state.confirmBoosterTime);
  const skipBooster = useSessionStore((state) => state.skipBooster);
  const snoozeBooster = useSessionStore((state) => state.snoozeBooster);
  const snoozeBoosterActive = useSessionStore((state) => state.snoozeBoosterActive);
  const isSnoozeAvailable = useSessionStore((state) => state.isSnoozeAvailable);
  const hideBoosterModal = useSessionStore((state) => state.hideBoosterModal);
  const pauseMeditationPlayback = useSessionStore((state) => state.pauseMeditationPlayback);
  const maximizeBooster = useSessionStore((state) => state.maximizeBooster);
  const setBoosterDose = useSessionStore((state) => state.setBoosterDose);

  // Pause active module timer when modal mounts or is maximized
  useEffect(() => {
    if (!booster.isMinimized) {
      const { meditationPlayback } = useSessionStore.getState();
      if (meditationPlayback.isPlaying) {
        pauseMeditationPlayback();
      }
    }
  }, [booster.isMinimized]); // eslint-disable-line react-hooks/exhaustive-deps

  // Determine initial step based on current status
  const initialMinutes = getElapsedMinutes();
  const [step, setStep] = useState(() => {
    // If booster already taken but modal still visible, go straight to confirmation
    if (booster.status === 'taken') return '5b';
    if (initialMinutes >= 150) return 'window-expired';
    return 0;
  });
  const [modalHeight, setModalHeight] = useState(() => getModalHeight(step));
  const [stepHistory, setStepHistory] = useState([]);

  // Reset step only when auto-prompted after snooze timer expires
  // (showBoosterModal sets status to 'prompted' — manual tap via maximizeBooster does not)
  // Note: 'taken' status is handled by the useState initializer above (for remounts).
  // The normal take flow uses goToStep('5b') for a smooth fade transition.
  useEffect(() => {
    if (booster.status === 'prompted' && booster.isModalVisible && !booster.isMinimized) {
      const mins = getElapsedMinutes();
      const newStep = mins >= 150 ? 'window-expired' : 0;
      setStep(newStep);
      setModalHeight(getModalHeight(newStep));
      setStepHistory([]);
    }
  }, [booster.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const initialDoseMg = plannedDosageMg;
  const calculatedBoosterMg = initialDoseMg ? calculateBoosterDose(initialDoseMg) : null;
  const effectiveBoosterMg = booster.boosterDoseMg ?? calculatedBoosterMg;
  const isCustomDose = booster.boosterDoseMg != null && booster.boosterDoseMg !== calculatedBoosterMg;
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
  const updateJournalEntry = useJournalStore((state) => state.updateEntry);

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

  const createBoosterJournalEntry = (decision, takenAt) => {
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
      lines.push(`Decision: Took booster (${effectiveBoosterMg}mg)`);
      lines.push(`Time: ${formatTime(takenAt)}`);
    } else if (decision === 'skipped') {
      lines.push('Decision: Skipped booster');
    }

    const entry = addJournalEntry({
      content: lines.join('\n'),
      source: 'session',
      moduleTitle: 'Booster Check-In',
    });

    if (decision === 'taken') {
      boosterJournalEntryId.current = entry.id;
    }
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
    const targetHeight = getModalHeight(newStep);
    if (targetHeight !== modalHeight) setModalHeight(targetHeight);
    setStepHistory((prev) => [...prev, step]);
    fadeTransition(() => setStep(newStep));
  };

  const goBack = () => {
    if (stepHistory.length === 0) return;
    const prevStep = stepHistory[stepHistory.length - 1];
    const targetHeight = getModalHeight(prevStep);
    if (targetHeight !== modalHeight) setModalHeight(targetHeight);
    setStepHistory((prev) => prev.slice(0, -1));
    fadeTransition(() => setStep(prevStep));
  };

  const handleDismiss = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      hideBoosterModal();
      setIsAnimatingOut(false);
    }, 350);
  };

  // Animate the modal out before calling a store action that hides it.
  const animateOutThen = (action) => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      action();
      setIsAnimatingOut(false);
    }, 350);
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
    animateOutThen(snoozeBoosterActive);
  };

  const handleEditDose = () => {
    setEditingDose(String(effectiveBoosterMg || ''));
    goToStep('4b');
  };

  const handleConfirmDose = () => {
    const parsed = parseInt(editingDose, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setBoosterDose(parsed);
    }
    goToStep(4);
  };

  const handleResetDose = () => {
    setBoosterDose(null);
    setEditingDose(String(calculatedBoosterMg || ''));
  };

  const handleTakeConfirm = () => {
    const now = Date.now();
    takeBooster(now);
    createBoosterJournalEntry('taken', now);
    goToStep('5b');
  };

  const handleInlineTimeEdit = () => {
    if (editedTime) {
      const [hours, minutes] = editedTime.split(':').map(Number);
      const newTime = new Date();
      newTime.setHours(hours, minutes, 0, 0);
      const newTimestamp = newTime.getTime();
      confirmBoosterTime(newTimestamp);

      // Update the journal entry with the corrected time
      if (boosterJournalEntryId.current) {
        const entries = useJournalStore.getState().entries;
        const entry = entries.find(e => e.id === boosterJournalEntryId.current);
        if (entry) {
          const updatedContent = entry.content.replace(
            /Time: .+/,
            `Time: ${formatTime(newTimestamp)}`
          );
          updateJournalEntry(entry.id, updatedContent);
        }
      }
    }
    setShowTimeEdit(false);
  };

  const handleSkipConfirm = () => {
    createBoosterJournalEntry('skipped');
    animateOutThen(skipBooster);
  };

  const handleTakenAcknowledge = () => {
    handleDismiss();
  };

  // Minimize or dismiss — never snooze if booster was already taken
  const handleMinimizeOrSnooze = () => {
    if (booster.status === 'taken') {
      handleDismiss();
    } else {
      animateOutThen(snoozeBooster);
    }
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
      case '4b': return renderEditDose();
      case 5: return renderTakeConfirmation();
      case '5b': return renderBoosterConfirmation();
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
      <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
        You've been in your session for about <span className="text-[var(--accent)]">{liveMinutes} minutes</span>. A supplemental dose taken between 60 and 120 minutes can extend the peak by another hour or two.
      </p>
      <p className="text-[var(--color-text-secondary)] leading-relaxed text-center">
        Let's check in with how you're feeling to see if a booster is the right choice.
      </p>
      <button
        onClick={() => goToStep(1)}
        className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
        style={{ fontFamily: 'Azeret Mono, monospace' }}
      >
        Continue
      </button>
    </div>
  );

  // Step 1: Experience Quality Check
  const renderExperienceCheck = () => (
    <div className="space-y-4">
      <p className="text-[var(--color-text-primary)] text-xl leading-snug" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
        How would you describe your experience right now?
      </p>
      <div className="space-y-2">
        {[
          { value: 'deep-meaningful', label: 'Deep and meaningful', desc: 'I\'m doing important inner work and want more time to stay with it.' },
          { value: 'pleasant-open', label: 'Pleasant and open', desc: 'I feel good, connected, and present.' },
          { value: 'settled', label: 'Settled but ready to shift', desc: 'I feel complete with this part and ready for what\'s next.' },
          { value: 'intense', label: 'Intense', desc: 'A lot is moving through me already.' },
          { value: 'uncertain', label: 'Uncertain', desc: 'I\'m not sure how to describe what I\'m feeling.' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => handleExperienceSelect(option.value)}
            className="w-full py-2 px-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left"
          >
            <p className="text-[var(--color-text-primary)] text-lg leading-tight mb-3" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>{option.label}</p>
            <p className="text-[var(--color-text-tertiary)] text-xs uppercase leading-tight mb-0">{option.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );

  // Step 2: Physical Check
  const renderPhysicalCheck = () => (
    <div className="space-y-4">
      <p className="text-[var(--color-text-primary)] text-xl leading-snug" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
        How is your body feeling?
      </p>
      <div className="space-y-2">
        {[
          { value: 'comfortable', label: 'Comfortable', desc: 'My body feels at ease with no notable side effects.' },
          { value: 'some-tension', label: 'Some tension', desc: 'A bit of jaw clenching, neck tightness, or muscle holding.' },
          { value: 'temperature', label: 'Temperature fluctuations', desc: 'Running warm or cool, sweating or chills.' },
          { value: 'noticeable', label: 'Noticeable physical effects', desc: 'I feel them clearly but they\'re manageable.' },
          { value: 'uncomfortable', label: 'Uncomfortable', desc: 'Side effects are significant and asking for attention.' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => handlePhysicalSelect(option.value)}
            className="w-full py-2 px-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left"
          >
            <p className="text-[var(--color-text-primary)] text-lg leading-tight mb-2" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>{option.label}</p>
            <p className="text-[var(--color-text-tertiary)] text-xs uppercase leading-tight mb-0">{option.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );

  // Step 3: Trajectory Check
  const renderTrajectoryCheck = () => (
    <div className="space-y-4">
      <p className="text-[var(--color-text-primary)] text-xl leading-snug" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
        Thinking about your session so far...
      </p>
      <div className="space-y-2">
        {[
          { value: 'more-to-explore', label: 'There\'s more I want to explore', desc: 'I have unfinished territory and want more time at the peak.' },
          { value: 'middle-of-something', label: 'I\'m in the middle of something', desc: 'A process is unfolding and I don\'t want it to end yet.' },
          { value: 'complete', label: 'I feel complete', desc: 'What needed to happen has happened.' },
          { value: 'ready-to-integrate', label: 'I\'m ready to begin integrating', desc: 'I\'m ready to start the gentle return.' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => handleTrajectorySelect(option.value)}
            className="w-full py-2 px-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left"
          >
            <p className="text-[var(--color-text-primary)] text-lg leading-tight mb-2" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>{option.label}</p>
            <p className="text-[var(--color-text-tertiary)] text-xs uppercase leading-tight mb-0">{option.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );

  // Step 4: Decision Point
  const renderDecisionPoint = () => (
    <div className="space-y-4 -mt-2">
      <p className="text-[var(--color-text-primary)] text-xs leading-relaxed">
        Based on what you've shared, you seem to be in a good place for a supplemental dose. A booster would extend your peak by another hour or two.
      </p>

      {/* Dosage info box */}
      <div className="p-3 border border-[var(--accent)] bg-[var(--accent-bg)]">
        <div className="space-y-1">
          <div className="flex justify-between items-baseline">
            <span className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider">Your Initial Dose:</span>
            <span className="text-[var(--color-text-primary)] text-lg normal-case" style={{ fontFamily: 'DM Serif Text, serif' }}>
              {initialDoseMg}mg
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider">
              {isCustomDose ? 'Your Booster Dose:' : 'Recommended Booster:'}
            </span>
            <span className="text-[var(--color-text-primary)] text-lg normal-case" style={{ fontFamily: 'DM Serif Text, serif' }}>
              {isCustomDose && (
                <span className="text-[var(--color-text-tertiary)] text-xs mr-1" style={{ fontFamily: 'DM Serif Text, serif' }}>edited</span>
              )}
              {effectiveBoosterMg}mg
            </span>
          </div>
        </div>
        {(() => {
          if (!isCustomDose) {
            return (
              <p className="text-[var(--color-text-tertiary)] text-xs mt-2 mb-0">
                This is approximately half your initial dose.
              </p>
            );
          }
          const totalDose = Number(initialDoseMg) + effectiveBoosterMg;
          const lines = [];
          lines.push(`Recommended: ${calculatedBoosterMg}mg (approximately half your initial dose).`);
          if (effectiveBoosterMg < 30) {
            lines.push('This is below the typical minimum of 30mg and may not noticeably extend your experience.');
          } else if (effectiveBoosterMg <= 75) {
            lines.push('You are within the recommended range of 30–75mg.');
          } else {
            lines.push('This exceeds the typical maximum booster of 75mg. Higher doses increase physical strain without proportionally extending the experience.');
          }
          if (totalDose > 200) {
            lines.push(`Your total session dosage of ${totalDose}mg exceeds the 200mg ceiling recommended by most harm reduction guidance.`);
          }
          return (
            <div className="mt-2 space-y-1">
              {lines.map((line, i) => (
                <p key={i} className={`text-xs mb-0 ${
                  line.includes('200mg')
                    ? 'text-red-400'
                    : (i > 0 && effectiveBoosterMg > 75)
                      ? 'text-amber-500'
                      : 'text-[var(--color-text-tertiary)]'
                }`}>
                  {line}
                </p>
              ))}
            </div>
          );
        })()}
      </div>

      <p className="text-[var(--color-text-primary)] text-xl leading-snug" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
        What would you like to do?
      </p>

      <div className="space-y-2">
        <button
          onClick={handleTakeDecision}
          className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'Azeret Mono, monospace' }}
        >
          Take my booster dose now
        </button>
        <button
          onClick={handleEditDose}
          className="w-full py-4 border border-[var(--color-text-primary)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'Azeret Mono, monospace' }}
        >
          Edit my booster dose
        </button>
        <button
          onClick={handleSkipDecision}
          className="w-full py-4 border border-[var(--color-text-primary)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'Azeret Mono, monospace' }}
        >
          Skip the booster
        </button>
        {canSnooze && (
          <button
            onClick={handleSnoozeDecision}
            className="w-full py-4 border border-[var(--color-text-primary)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            Ask me again in 10 minutes
          </button>
        )}
      </div>
    </div>
  );

  // Step 4b: Edit Booster Dose
  const renderEditDose = () => {
    const parsedDose = parseInt(editingDose, 10);
    const isValid = !isNaN(parsedDose) && parsedDose > 0;
    const totalDose = Number(initialDoseMg) + (isValid ? parsedDose : 0);

    // Build feedback messages based on entered dose
    const getFeedback = () => {
      if (!isValid) {
        return [{
          text: 'A booster dose is optional to extend the peak experience of MDMA, and can be taken between 90 and 150 minutes after initial ingestion.',
          style: 'text-[var(--color-text-tertiary)]',
        }];
      }
      const messages = [];

      if (parsedDose < 30) {
        messages.push({
          text: 'This is below the typical minimum of 30mg and may not noticeably extend your experience.',
          style: 'text-[var(--color-text-tertiary)]',
        });
      } else if (parsedDose <= 75) {
        messages.push({
          text: `This is within the standard booster range of 30–75mg. The recommended dose of ${calculatedBoosterMg}mg is approximately half your initial dose.`,
          style: 'text-[var(--color-text-secondary)]',
        });
      } else {
        messages.push({
          text: 'This exceeds the typical maximum booster of 75mg. Higher booster doses increase physical strain without proportionally extending the experience.',
          style: 'text-amber-500',
        });
      }

      if (totalDose > 300) {
        messages.push({
          text: `Your total session dosage of ${totalDose}mg is in the range associated with serious harm including hyperthermia, serotonin syndrome, and cardiac complications.`,
          style: 'text-red-400',
          severe: true,
        });
      } else if (totalDose > 200) {
        messages.push({
          text: `Your total session dosage of ${totalDose}mg exceeds the 200mg ceiling recommended by most harm reduction guidance. This increases neurotoxicity risk and next-day effects.`,
          style: 'text-red-400',
        });
      }

      return messages;
    };

    const feedback = getFeedback();
    const hasSevereWarning = feedback.some(f => f.severe);
    const showResetButton = isValid && parsedDose !== calculatedBoosterMg;

    return (
      <div className="space-y-4">
        <p className="text-[var(--color-text-primary)] text-xl leading-snug" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
          Adjust your booster dose
        </p>

        {/* Symmetrical dose layout: Initial + Booster */}
        <div className="flex items-end space-x-3">
          {/* Initial dose (read-only) */}
          <div className="flex-1 min-w-0 space-y-1">
            <label className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider block text-center">
              Initial Dose
            </label>
            <div className="flex items-center border border-[var(--color-border)] py-3 px-3">
              <span className="text-[var(--color-text-primary)] text-lg normal-case flex-1 text-center" style={{ fontFamily: 'DM Serif Text, serif' }}>
                {initialDoseMg}
              </span>
              <span className="text-[var(--color-text-primary)] text-lg normal-case" style={{ fontFamily: 'DM Serif Text, serif' }}>mg</span>
            </div>
          </div>

          {/* Plus symbol */}
          <div className="pb-3 text-[var(--color-text-secondary)] text-2xl flex-shrink-0" style={{ fontFamily: 'DM Serif Text, serif' }}>
            +
          </div>

          {/* Booster dose input */}
          <div className="flex-1 min-w-0 space-y-1">
            <label className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider block text-center">
              Booster Dose
            </label>
            <div className="flex items-center border border-[var(--color-border)] focus-within:border-[var(--color-text-primary)] py-3 px-3">
              <input
                type="number"
                inputMode="numeric"
                size={1}
                value={editingDose}
                onChange={(e) => setEditingDose(e.target.value)}
                className="flex-1 min-w-0 bg-transparent focus:outline-none text-center text-[var(--color-text-primary)] text-lg"
                style={{ fontFamily: 'DM Serif Text, serif' }}
                placeholder={String(calculatedBoosterMg)}
              />
              <span className="text-[var(--color-text-primary)] text-lg normal-case" style={{ fontFamily: 'DM Serif Text, serif' }}>mg</span>
            </div>
          </div>
        </div>

        <p className="text-[var(--color-text-tertiary)] text-xs text-center mb-0">
          Suggested range: 30–75mg
        </p>

        {/* Feedback messages — always visible to prevent layout collapse */}
        <div className={`p-3 border ${hasSevereWarning ? 'border-red-500/50 bg-red-500/10' : 'border-[var(--color-border)]'}`}>
          <div className="space-y-1">
            {feedback.map((msg, i) => (
              <p key={i} className={`text-xs leading-relaxed mb-0 ${msg.style}`}>
                {msg.text}
              </p>
            ))}
          </div>
        </div>

        {/* Total session dosage — always visible to prevent layout collapse */}
        <div className="p-3 border border-[var(--color-border)]">
          <div className="flex justify-between items-baseline">
            <span className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider">Total Session Dosage:</span>
            <span
              className={`text-lg normal-case ${totalDose > 200 ? 'text-red-400' : 'text-[var(--color-text-primary)]'}`}
              style={{ fontFamily: 'DM Serif Text, serif' }}
            >
              {totalDose}mg
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <button
            onClick={handleConfirmDose}
            disabled={!isValid}
            className={`w-full py-4 uppercase tracking-wider text-xs transition-opacity ${
              isValid
                ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)] hover:opacity-80'
                : 'bg-[var(--color-border)] text-[var(--color-text-tertiary)] cursor-not-allowed'
            }`}
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            Confirm Dose
          </button>
          <button
            onClick={handleResetDose}
            disabled={!showResetButton}
            className={`w-full py-4 border border-[var(--color-text-primary)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs transition-opacity duration-300 ${
              showResetButton ? 'opacity-100 hover:opacity-80' : 'opacity-0 pointer-events-none'
            }`}
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            Reset to Recommended ({calculatedBoosterMg}mg)
          </button>
        </div>
      </div>
    );
  };

  // Step 5: Take Confirmation
  const renderTakeConfirmation = () => (
    <div className="space-y-4">
      <p className="text-[var(--color-text-primary)] text-xl leading-snug text-center" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
        When you're ready,<br />take your booster dose
      </p>

      <div className="py-1 flex justify-center">
        <AsciiDiamond />
      </div>

      <p className="text-[var(--color-text-secondary)] text-center mb-4">
        Your booster dose: <span className="text-[var(--color-text-primary)] text-xl normal-case" style={{ fontFamily: 'DM Serif Text, serif' }}>{effectiveBoosterMg}mg</span>
      </p>

      <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed">
        Take it with a sip of water, then settle back in. Effects typically begin to build within 30 to 45 minutes.
      </p>

      <div className="w-full space-y-2">
        <button
          onClick={handleTakeConfirm}
          className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'Azeret Mono, monospace' }}
        >
          I've Taken My Booster
        </button>
        <button
          onClick={handleEditDose}
          className="w-full py-4 border border-[var(--color-text-primary)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'Azeret Mono, monospace' }}
        >
          Change My Dose
        </button>
        <button
          onClick={handleSkipDecision}
          className="w-full py-4 border border-[var(--color-text-primary)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'Azeret Mono, monospace' }}
        >
          I decided not to take it
        </button>
      </div>
    </div>
  );

  // Step 5b: Booster Confirmation (combined time + dosage summary + what to expect)
  const renderBoosterConfirmation = () => {
    const totalDose = Number(initialDoseMg) + (effectiveBoosterMg || 0);

    return (
      <div className="space-y-3">
        <p className="text-[var(--color-text-primary)] text-xl leading-snug text-center mb-3" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
          Your booster is recorded
        </p>

        <div className="flex justify-center py-1">
          <AsciiDiamond />
        </div>

        {/* Time taken — tappable to edit inline */}
        <div className="text-center">
          <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider mb-1">
            Taken at
          </p>
          {!showTimeEdit ? (
            <button
              onClick={() => setShowTimeEdit(true)}
              className="inline-block px-4 py-2 border border-[var(--accent)] bg-[var(--accent-bg)] hover:opacity-80 transition-opacity"
            >
              <span
                className="text-xl text-[var(--color-text-primary)]"
                style={{ fontFamily: 'DM Serif Text, serif' }}
              >
                {formatTime(booster.boosterTakenAt)}
              </span>
            </button>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <input
                type="time"
                value={editedTime}
                onChange={(e) => setEditedTime(e.target.value)}
                className="py-2 px-3 border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--accent)] text-[var(--color-text-primary)] text-center"
              />
              <button
                onClick={handleInlineTimeEdit}
                disabled={!editedTime}
                className={`py-2 px-4 uppercase tracking-wider text-xs ${
                  editedTime
                    ? 'border border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)] hover:opacity-80 transition-opacity'
                    : 'bg-[var(--color-border)] text-[var(--color-text-tertiary)] cursor-not-allowed'
                }`}
                style={{ fontFamily: 'Azeret Mono, monospace' }}
              >
                Confirm
              </button>
            </div>
          )}
        </div>

        {/* Dosage summary */}
        <div className="p-3 border border-[var(--color-border)] space-y-1">
          <div className="flex justify-between items-baseline">
            <span className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider">Initial Dose</span>
            <span className="text-[var(--color-text-primary)] text-base normal-case" style={{ fontFamily: 'DM Serif Text, serif' }}>
              {initialDoseMg}mg
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider">Booster Dose</span>
            <span className="text-[var(--color-text-primary)] text-base normal-case" style={{ fontFamily: 'DM Serif Text, serif' }}>
              {effectiveBoosterMg}mg
            </span>
          </div>
          <div className="border-t border-[var(--color-border)] pt-1 mt-1 flex justify-between items-baseline">
            <span className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider">Total</span>
            <span className="text-[var(--color-text-primary)] text-base normal-case" style={{ fontFamily: 'DM Serif Text, serif' }}>
              {totalDose}mg
            </span>
          </div>
        </div>

        {/* What to expect */}
        <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed mb-3">
          The booster will begin to take effect within 30 to 45 minutes, extending your peak by another hour or two. Settle back in and let the experience continue to unfold.
        </p>

        <button
          onClick={handleTakenAcknowledge}
          className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'Azeret Mono, monospace' }}
        >
          Continue
        </button>
      </div>
    );
  };

  // Step 6: Skip Confirmation
  const renderSkipConfirmation = () => (
    <div className="space-y-6">
      <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
        You've chosen to continue with a single dose. Some of the most meaningful sessions happen this way.
      </p>
      <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
        Trust where the experience is taking you. The peak will gently soften over the next hour or so as you move toward synthesis.
      </p>
      <button
        onClick={handleSkipConfirm}
        className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
        style={{ fontFamily: 'Azeret Mono, monospace' }}
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
    <div className="space-y-4">
      <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
        It sounds like a lot is already moving through you. Adding more substance often increases overwhelm rather than depth — we'd suggest staying with what's here.
      </p>
      <div className="space-y-2">
        <button
          onClick={handleSkipDecision}
          className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'Azeret Mono, monospace' }}
        >
          Skip Booster
        </button>
        <button
          onClick={() => goToStep(2)}
          className="w-full py-4 border border-[var(--color-text-primary)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'Azeret Mono, monospace' }}
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );

  // Branch: Discomfort warning
  const renderDiscomfortBranch = () => (
    <div className="space-y-4">
      <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
        Physical discomfort is worth paying attention to. A booster adds more substance for your body to metabolize, which can intensify side effects and recovery.
      </p>
      <div className="space-y-2">
        <button
          onClick={handleSkipDecision}
          className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'Azeret Mono, monospace' }}
        >
          Skip Booster
        </button>
        <button
          onClick={() => goToStep(3)}
          className="w-full py-4 border border-[var(--color-text-primary)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'Azeret Mono, monospace' }}
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );

  // Branch: Completion path
  const renderCompletionBranch = () => (
    <div className="space-y-4">
      <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
        This might be a natural place to let the session find its own ending. Honoring completion is often more valuable than extending for its own sake.
      </p>
      <div className="space-y-2">
        <button
          onClick={handleSkipDecision}
          className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'Azeret Mono, monospace' }}
        >
          Skip Booster
        </button>
        <button
          onClick={() => goToStep(4)}
          className="w-full py-4 border border-[var(--color-text-primary)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'Azeret Mono, monospace' }}
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );

  // Window expired message (past 150 minutes)
  const renderWindowExpired = () => (
    <div className="space-y-4">
      <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
        You're past the window where a booster is typically effective. Taken this late, it won't build cleanly onto a softening peak — and is more likely to extend side effects and recovery than the experience itself. We'd suggest skipping at this point.
      </p>
      <div className="space-y-2">
        <button
          onClick={() => animateOutThen(skipBooster)}
          className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'Azeret Mono, monospace' }}
        >
          Skip Booster
        </button>
        <button
          onClick={() => goToStep(5)}
          className="w-full py-4 border border-[var(--color-text-primary)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
          style={{ fontFamily: 'Azeret Mono, monospace' }}
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
        className="fixed left-0 right-0 w-full bg-[var(--accent-bg)] border-t border-b border-[var(--accent)] py-3 px-4 flex items-center justify-between z-40 animate-slideUpSmall"
        style={{ bottom: 'var(--bottom-chrome)' }}
      >
        <div className="flex items-center space-x-3">
          <FireIcon size={20} strokeWidth={2.5} className="text-[var(--accent)]" />
          <span
            className="text-[var(--color-text-primary)] text-base"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            Booster Check-In
          </span>
        </div>
        <CirclePlusIcon size={20} className="text-[var(--color-text-tertiary)]" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop — sibling of the panel so its opacity transition doesn't affect the panel */}
      <div
        className={`absolute inset-0 bg-black/25 ${isAnimatingOut ? 'animate-fadeOut' : 'animate-fadeIn'}`}
        onClick={handleMinimizeOrSnooze}
      />

      {/* Panel — slides up from below, fully opaque the entire time */}
      <div
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[var(--color-bg)] rounded-t-2xl flex flex-col overflow-hidden ${isAnimatingOut ? 'animate-slideDownOut' : 'animate-slideUp'}`}
        style={{ height: modalHeight, transition: 'height 300ms ease-out' }}
      >
        {/* Header — sticky */}
        <div className="relative px-6 pt-4 pb-3">
          {stepHistory.length > 0 && (() => {
            const isCommitted = booster.status === 'taken';
            return (
              <button
                onClick={goBack}
                disabled={isCommitted}
                className={`absolute top-4 left-4 p-2 -m-2 z-10 transition-opacity ${
                  isCommitted
                    ? 'text-[var(--color-text-tertiary)] opacity-30 cursor-not-allowed'
                    : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                }`}
                aria-label="Back"
              >
                <ChevronLeftIcon size={22} />
              </button>
            );
          })()}
          <button
            onClick={handleMinimizeOrSnooze}
            className="absolute top-4 right-4 p-2 -m-2 z-10 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
            aria-label="Minimize"
          >
            <CircleSkipIcon size={22} />
          </button>
          <div className={`flex flex-col items-start text-left ${stepHistory.length > 0 ? 'pl-8' : ''} pr-8`}>
            <div className="flex items-center space-x-2">
              <FireIcon size={24} className="text-[var(--accent)] flex-shrink-0" />
              <h3 className="text-xl text-[var(--color-text-primary)] mb-0" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>Booster Check-In</h3>
            </div>
            <p className="text-[var(--color-text-tertiary)] text-sm mb-0">
              {liveMinutes} minutes since ingestion
            </p>
          </div>
        </div>

        {/* Content — scrollable */}
        <div
          className="overflow-y-auto p-6 pb-8 transition-opacity duration-300"
          style={{ opacity: isVisible ? 1 : 0 }}
        >
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

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

  // Reset step only when auto-prompted after snooze timer expires
  // (showBoosterModal sets status to 'prompted' — manual tap via maximizeBooster does not)
  // Note: 'taken' status is handled by the useState initializer above (for remounts).
  // The normal take flow uses goToStep('5b') for a smooth fade transition.
  useEffect(() => {
    if (booster.status === 'prompted' && booster.isModalVisible && !booster.isMinimized) {
      const mins = getElapsedMinutes();
      setStep(mins >= 150 ? 'window-expired' : 0);
    }
  }, [booster.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const initialDoseMg = substanceChecklist.plannedDosageMg;
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
    skipBooster();
  };

  const handleTakenAcknowledge = () => {
    handleDismiss();
  };

  // Minimize or dismiss — never snooze if booster was already taken
  const handleMinimizeOrSnooze = () => {
    if (booster.status === 'taken') {
      handleDismiss();
    } else {
      snoozeBooster();
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
            <span className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider">
              {isCustomDose ? 'Your Booster Dose' : 'Recommended Booster'}
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
              <p className="text-[var(--color-text-tertiary)] text-sm mt-3">
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
            <div className="mt-3 space-y-1">
              {lines.map((line, i) => (
                <p key={i} className={`text-sm ${
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
          onClick={handleEditDose}
          className="w-full py-4 px-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors text-left uppercase tracking-wider text-xs"
        >
          Edit my booster dose
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

    return (
      <div className="space-y-6">
        <p className="text-[var(--color-text-primary)] leading-relaxed">
          Adjust your booster dose below.
        </p>

        {/* Initial dose (read-only) */}
        <div className="p-4 border border-[var(--color-border)]">
          <div className="flex justify-between items-baseline">
            <span className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider">Initial Dose</span>
            <span className="text-[var(--color-text-primary)] text-lg normal-case" style={{ fontFamily: 'DM Serif Text, serif' }}>
              {initialDoseMg}mg
            </span>
          </div>
        </div>

        {/* Booster dose input */}
        <div className="space-y-2">
          <label className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider block">
            Booster Dose
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              inputMode="numeric"
              value={editingDose}
              onChange={(e) => setEditingDose(e.target.value)}
              className="flex-1 py-3 px-4 border border-[var(--color-border)] bg-transparent focus:outline-none focus:border-[var(--color-text-primary)]"
              placeholder={String(calculatedBoosterMg)}
            />
            <span className="text-[var(--color-text-secondary)]">mg</span>
          </div>
          <p className="text-[var(--color-text-tertiary)] text-xs">
            Suggested range: 30–75mg
          </p>
        </div>

        {/* Feedback messages — always visible to prevent layout collapse */}
        <div className={`p-4 border ${hasSevereWarning ? 'border-red-500/50 bg-red-500/10' : 'border-[var(--color-border)]'}`}>
          <div className="space-y-2">
            {feedback.map((msg, i) => (
              <p key={i} className={`text-sm leading-relaxed ${msg.style}`}>
                {msg.text}
              </p>
            ))}
          </div>
        </div>

        {/* Total session dosage — always visible to prevent layout collapse */}
        <div className="p-4 border border-[var(--color-border)]">
          <div className="flex justify-between items-baseline">
            <span className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider">Total Session Dosage</span>
            <span
              className={`text-lg normal-case ${totalDose > 200 ? 'text-red-400' : 'text-[var(--color-text-primary)]'}`}
              style={{ fontFamily: 'DM Serif Text, serif' }}
            >
              {totalDose}mg
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handleConfirmDose}
            disabled={!isValid}
            className={`w-full py-4 uppercase tracking-wider text-xs transition-opacity ${
              isValid
                ? 'border border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)] hover:opacity-80'
                : 'bg-[var(--color-border)] text-[var(--color-text-tertiary)] cursor-not-allowed'
            }`}
          >
            Confirm Dose
          </button>
          {booster.boosterDoseMg != null && (
            <button
              onClick={handleResetDose}
              className="w-full py-3 text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider hover:text-[var(--color-text-secondary)] transition-colors"
            >
              Reset to Recommended ({calculatedBoosterMg}mg)
            </button>
          )}
        </div>
      </div>
    );
  };

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
        {isCustomDose ? 'Your dose' : 'Recommended'}: <span className="text-lg normal-case" style={{ fontFamily: 'DM Serif Text, serif' }}>{effectiveBoosterMg}mg</span>
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

  // Step 5b: Booster Confirmation (combined time + dosage summary + what to expect)
  const renderBoosterConfirmation = () => {
    const totalDose = Number(initialDoseMg) + (effectiveBoosterMg || 0);

    return (
      <div className="space-y-4">
        <p className="text-[var(--color-text-primary)] leading-relaxed text-center">
          Your booster is recorded.
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
              className="inline-block px-6 py-3 border border-[var(--accent)] bg-[var(--accent-bg)] hover:opacity-80 transition-opacity"
            >
              <span
                className="text-2xl text-[var(--color-text-primary)]"
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
              >
                Confirm
              </button>
            </div>
          )}
        </div>

        {/* Dosage summary */}
        <div className="p-4 border border-[var(--color-border)] space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider">Initial Dose</span>
            <span className="text-[var(--color-text-primary)] text-lg normal-case" style={{ fontFamily: 'DM Serif Text, serif' }}>
              {initialDoseMg}mg
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider">Booster Dose</span>
            <span className="text-[var(--color-text-primary)] text-lg normal-case" style={{ fontFamily: 'DM Serif Text, serif' }}>
              {effectiveBoosterMg}mg
            </span>
          </div>
          <div className="border-t border-[var(--color-border)] pt-2 mt-2 flex justify-between items-baseline">
            <span className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider">Total</span>
            <span className="text-[var(--color-text-primary)] text-lg normal-case" style={{ fontFamily: 'DM Serif Text, serif' }}>
              {totalDose}mg
            </span>
          </div>
        </div>

        {/* What to expect */}
        <div className="space-y-2">
          <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
            It will take approximately 45 minutes for the booster to take effect. After that, expect your peak to extend by another 1–2 hours.
          </p>
          <p className="text-[var(--color-text-tertiary)] leading-relaxed text-xs">
            Continue with your session. There's nothing you need to do except allow the experience to unfold.
          </p>
        </div>

        <button
          onClick={handleTakenAcknowledge}
          className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
        >
          Continue
        </button>
      </div>
    );
  };

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
        className="fixed left-0 right-0 bg-[var(--accent-bg)] border-t border-b border-[var(--accent)] py-3 px-4 flex items-center justify-between z-40"
        style={{ bottom: 'var(--bottom-chrome)' }}
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
      onClick={handleMinimizeOrSnooze}
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
            onClick={handleMinimizeOrSnooze}
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

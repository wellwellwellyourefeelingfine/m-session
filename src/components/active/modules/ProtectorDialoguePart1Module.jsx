/**
 * ProtectorDialoguePart1Module Component
 *
 * "Meeting a Protector" — 10-step IFS guided activity for peak phase.
 * Steps: 3 text pages → breath exercise → meditation (listen/read) →
 * protector naming → feel-toward check (with fork) → body location → message → closing text.
 *
 * Saves protector captures to transitionCaptures.protectorDialogue for Part 2.
 * Creates a journal entry on completion.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useJournalStore } from '../../../stores/useJournalStore';
import {
  PART1_STEPS,
  PART1_LANDING,
  PROTECTOR_EXAMPLES,
  FEEL_TOWARD_OPTIONS,
  FEEL_TOWARD_UNBLENDING_TEXT,
  FEEL_TOWARD_GENTLE_NOTE,
  getProtectorName,
} from '../../../content/modules/protectorDialogueContent';
import {
  getMeditationById,
  generateTimedSequence,
} from '../../../content/meditations';
import { useMeditationPlayback } from '../../../hooks/useMeditationPlayback';
import { useTranscriptModal } from '../../../hooks/useTranscriptModal';
import { useBreathController } from '../hooks/useBreathController';

// Shared UI components
import ModuleLayout from '../capabilities/ModuleLayout';
import ModuleControlBar, { VolumeButton, SlotButton } from '../capabilities/ModuleControlBar';
import useProgressReporter from '../../../hooks/useProgressReporter';
import BreathOrb from '../capabilities/animations/BreathOrb';
import AsciiDiamond from '../capabilities/animations/AsciiDiamond';
import MorphingShapes from '../capabilities/animations/MorphingShapes';
import TranscriptModal, { TranscriptIcon } from '../capabilities/TranscriptModal';

export default function ProtectorDialoguePart1Module({ module, onComplete, onSkip, onProgressUpdate }) {
  // ── Stores ──
  const updateProtectorCapture = useSessionStore((s) => s.updateProtectorCapture);
  const addEntry = useJournalStore((s) => s.addEntry);
  const sessionId = useSessionStore((s) => s.sessionId);

  // ── Idle / landing page ──
  const [hasStarted, setHasStarted] = useState(false);
  const [showIfsInfo, setShowIfsInfo] = useState(false);
  const [isLandingVisible, setIsLandingVisible] = useState(true);

  const handleBegin = useCallback(() => {
    setIsLandingVisible(false);
    setTimeout(() => {
      setHasStarted(true);
    }, 400);
  }, []);

  // ── Step navigation ──
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [_stepHistory, setStepHistory] = useState([0]);

  // ── Protector captures ──
  const [protectorName, setProtectorName] = useState('');
  const [protectorDescription, setProtectorDescription] = useState('');
  const [bodyLocation, setBodyLocation] = useState('');
  const [protectorMessage, setProtectorMessage] = useState('');

  // ── Naming step state ──
  const [showExamples, setShowExamples] = useState(false);

  // ── Feel Toward step (Step 7) sub-phase ──
  const [feelTowardSelection, setFeelTowardSelection] = useState(null);
  const [feelTowardRecheckSelection, setFeelTowardRecheckSelection] = useState(null);
  const [feelTowardSubPhase, setFeelTowardSubPhase] = useState('check'); // 'check' | 'unblending' | 'recheck'

  // ── Breath step (Step 4) sub-phase ──
  const [breathSubPhase, setBreathSubPhase] = useState('pre'); // 'pre' | 'active' | 'post'
  const breathSubPhaseRef = useRef('pre');

  const breathStep = PART1_STEPS[3];
  const breathSequences = breathStep.content.sequences;

  const breathController = useBreathController({
    sequences: breathSequences,
    onComplete: () => {
      if (breathSubPhaseRef.current === 'post') {
        // Already in post mode — silently restart for continuous animation
        setTimeout(() => {
          breathController.reset();
          breathController.start();
        }, 0);
        return;
      }
      // First completion: transition active → post
      setIsVisible(false);
      setTimeout(() => {
        setBreathSubPhase('post');
        breathSubPhaseRef.current = 'post';
        // Restart controller so the orb keeps animating
        breathController.reset();
        breathController.start();
        setIsVisible(true);
      }, 400);
    },
  });

  // ── Meditation step (Step 5) ──
  const [meditationMode, setMeditationMode] = useState(null); // null | 'listen' | 'read'
  const [readPromptIndex, setReadPromptIndex] = useState(0);

  // Transcript modal state
  const { showTranscript, transcriptClosing, handleOpenTranscript, handleCloseTranscript } = useTranscriptModal();

  const meditation = getMeditationById('protector-dialogue');

  // Generate timed sequence for listen mode
  const [timedSequence, meditationTotalDuration] = useMemo(() => {
    if (!meditation) return [[], 0];
    const sequence = generateTimedSequence(meditation.prompts, 1.0, {
      speakingRate: meditation.speakingRate || 90,
      audioConfig: meditation.audio,
    });
    const total = sequence.length > 0 ? sequence[sequence.length - 1].endTime : 0;
    return [sequence, total];
  }, [meditation]);

  // When meditation step completes (listen or read), advance to next module step
  const advanceFromMeditation = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentStepIndex((prev) => {
        const nextIndex = prev + 1;
        setStepHistory((h) => [...h, nextIndex]);
        return nextIndex;
      });
      setMeditationMode(null);
      setReadPromptIndex(0);
      setIsVisible(true);
    }, 400);
  }, []);

  // Meditation playback hook — called unconditionally (React hook rules).
  // onComplete/onSkip advance to next step rather than finishing the module.
  const playback = useMeditationPlayback({
    meditationId: 'protector-dialogue',
    moduleInstanceId: module.instanceId,
    timedSequence,
    totalDuration: meditationTotalDuration,
    onComplete: advanceFromMeditation,
    onSkip: advanceFromMeditation,
    onProgressUpdate,
  });

  // ── Derived values ──
  const currentStep = PART1_STEPS[currentStepIndex];
  const totalSteps = PART1_STEPS.length;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const protectorLabel = getProtectorName(protectorName);
  const meditationStepIndex = PART1_STEPS.findIndex((s) => s.type === 'meditation');

  // ── Progress reporting (step-based for non-meditation steps) ──
  const report = useProgressReporter(onProgressUpdate);

  useEffect(() => {
    if (currentStepIndex !== meditationStepIndex) {
      report.step(currentStepIndex + 1, totalSteps);
    }
  }, [currentStepIndex, totalSteps, meditationStepIndex, report]);

  // ── Step navigation ──
  const advanceStep = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentStepIndex((prev) => {
        const nextIndex = prev + 1;
        setStepHistory((h) => [...h, nextIndex]);
        return nextIndex;
      });
      setIsVisible(true);
    }, 400);
  }, []);

  const goBack = useCallback(() => {
    if (currentStepIndex === 0) return;
    setIsVisible(false);
    setTimeout(() => {
      setStepHistory((h) => (h.length <= 1 ? h : h.slice(0, -1)));
      setCurrentStepIndex((prev) => Math.max(0, prev - 1));
      setIsVisible(true);
    }, 400);
  }, [currentStepIndex]);

  // ── Module completion ──
  const handleModuleComplete = useCallback(() => {
    // Save captures to store
    if (protectorName.trim()) {
      updateProtectorCapture('protectorName', protectorName.trim());
    }
    if (protectorDescription.trim()) {
      updateProtectorCapture('protectorDescription', protectorDescription.trim());
    }
    updateProtectorCapture('feelToward', {
      initial: feelTowardSelection,
      recheck: feelTowardRecheckSelection,
    });
    if (bodyLocation.trim()) {
      updateProtectorCapture('bodyLocation', bodyLocation.trim());
    }
    if (protectorMessage.trim()) {
      updateProtectorCapture('protectorMessage', protectorMessage.trim());
    }
    updateProtectorCapture('completedAt', Date.now());

    // Create journal entry with timestamps for empty fields
    const timestamp = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    let journalContent = 'PROTECTOR DIALOGUE — PART 1\n\n';

    journalContent += `Protector: ${protectorName.trim() || `[no entry — ${timestamp}]`}\n`;
    journalContent += `Description: ${protectorDescription.trim() || `[no entry — ${timestamp}]`}\n\n`;

    if (feelTowardSelection) {
      const label = FEEL_TOWARD_OPTIONS.find((o) => o.id === feelTowardSelection)?.label || feelTowardSelection;
      journalContent += `Feel Toward: ${label}\n\n`;
    }

    journalContent += `Body Location: ${bodyLocation.trim() || `[no entry — ${timestamp}]`}\n\n`;
    journalContent += `Message to Protector:\n${protectorMessage.trim() || `[no entry — ${timestamp}]`}\n`;

    addEntry({
      content: journalContent.trim(),
      source: 'session',
      sessionId,
      moduleTitle: 'Dialogue with a Protector (Part 1)',
    });

    onComplete();
  }, [
    protectorName, protectorDescription, feelTowardSelection, feelTowardRecheckSelection,
    bodyLocation, protectorMessage, updateProtectorCapture, addEntry, sessionId, onComplete,
  ]);

  // ── Restart meditation from the beginning (listen mode) ──
  const handleRestartMeditation = useCallback(() => {
    playback.handleRestart();
  }, [playback]);

  // ── Handle back with step-specific resets ──
  const handleBack = useCallback(() => {
    const step = PART1_STEPS[currentStepIndex];

    // Meditation step: navigate within sub-steps first
    if (step.type === 'meditation') {
      // If meditation is playing in listen mode, restart it
      if (meditationMode === 'listen' && playback.hasStarted) {
        handleRestartMeditation();
        return;
      }
      if (meditationMode === 'read' && readPromptIndex > 0) {
        setReadPromptIndex((i) => i - 1);
        return;
      }
      if (meditationMode !== null) {
        setMeditationMode(null);
        setReadPromptIndex(0);
        return;
      }
    }

    // Feel-toward step: navigate within sub-phases first
    if (step.type === 'feelToward') {
      if (feelTowardSubPhase === 'recheck') {
        setIsVisible(false);
        setTimeout(() => {
          setFeelTowardSubPhase('unblending');
          setFeelTowardRecheckSelection(null);
          setIsVisible(true);
        }, 400);
        return;
      }
      if (feelTowardSubPhase === 'unblending') {
        setIsVisible(false);
        setTimeout(() => {
          setFeelTowardSubPhase('check');
          setIsVisible(true);
        }, 400);
        return;
      }
    }

    // Reset step state when leaving
    if (step.type === 'breath') {
      setBreathSubPhase('pre');
      breathSubPhaseRef.current = 'pre';
      breathController.reset();
    }
    if (step.type === 'meditation') {
      setMeditationMode(null);
      setReadPromptIndex(0);
    }
    if (step.type === 'feelToward') {
      setFeelTowardSubPhase('check');
    }

    goBack();
  }, [currentStepIndex, meditationMode, readPromptIndex, playback.hasStarted, feelTowardSubPhase, breathController, goBack, handleRestartMeditation]);

  // ── Handle module skip ──
  const handleModuleSkip = useCallback(() => {
    breathController.reset();
    onSkip();
  }, [breathController, onSkip]);

  // ── Begin meditation (listen mode) — no fade needed, content stays in place ──
  const handleBeginMeditation = useCallback(() => {
    playback.handleStart();
  }, [playback]);

  // ── Primary button handler ──
  const handlePrimary = useCallback(() => {
    const step = PART1_STEPS[currentStepIndex];

    switch (step.type) {
      case 'text':
        if (isLastStep) {
          setIsVisible(false);
          setTimeout(() => handleModuleComplete(), 400);
        } else {
          advanceStep();
        }
        break;

      case 'breath':
        if (breathSubPhase === 'pre') {
          setIsVisible(false);
          setTimeout(() => {
            setBreathSubPhase('active');
            breathSubPhaseRef.current = 'active';
            breathController.start();
            setIsVisible(true);
          }, 400);
        } else if (breathSubPhase === 'post') {
          // Fade out the post content first, then clean up breath state and advance
          setIsVisible(false);
          setTimeout(() => {
            breathController.reset();
            setBreathSubPhase('pre');
            breathSubPhaseRef.current = 'pre';
            setCurrentStepIndex((prev) => {
              const nextIndex = prev + 1;
              setStepHistory((h) => [...h, nextIndex]);
              return nextIndex;
            });
            setIsVisible(true);
          }, 400);
        } else if (breathSubPhase === 'active') {
          if (breathController.isRunning) {
            breathController.pause();
          } else {
            breathController.resume();
          }
        }
        break;

      case 'meditation':
        if (meditationMode === 'read') {
          if (readPromptIndex < meditation.prompts.length - 1) {
            setReadPromptIndex((i) => i + 1);
          } else {
            advanceFromMeditation();
          }
        }
        // Listen mode primary is handled by playback controls
        break;

      case 'naming':
      case 'textInput':
        if (isLastStep) {
          setIsVisible(false);
          setTimeout(() => handleModuleComplete(), 400);
        } else {
          advanceStep();
        }
        break;

      case 'feelToward': {
        if (feelTowardSubPhase === 'check') {
          const isPositive = FEEL_TOWARD_OPTIONS.find((o) => o.id === feelTowardSelection)?.positive;
          if (isPositive) {
            advanceStep();
          } else {
            setIsVisible(false);
            setTimeout(() => {
              setFeelTowardSubPhase('unblending');
              setIsVisible(true);
            }, 400);
          }
        } else if (feelTowardSubPhase === 'unblending') {
          setIsVisible(false);
          setTimeout(() => {
            setFeelTowardSubPhase('recheck');
            setFeelTowardRecheckSelection(null);
            setIsVisible(true);
          }, 400);
        } else if (feelTowardSubPhase === 'recheck') {
          // Always advance regardless of selection
          advanceStep();
        }
        break;
      }

      default:
        advanceStep();
    }
  }, [
    currentStepIndex, isLastStep, breathSubPhase, meditationMode, readPromptIndex,
    feelTowardSubPhase, feelTowardSelection,
    breathController, meditation, advanceStep, handleModuleComplete, advanceFromMeditation,
  ]);

  // ── Render helpers ──

  /** Render multi-line text from an array of lines, with {protector_name} personalization */
  const renderLines = (lines) => (
    <div className="space-y-0">
      {lines.map((line, i) => {
        if (line === '') return <div key={i} className="h-4" />;
        if (line === '§') return (
          <div key={i} className="flex justify-center my-4">
            <div className="circle-spacer" />
          </div>
        );
        // Replace {protector_name} with accent-colored span
        if (line.includes('{protector_name}')) {
          const parts = line.split('{protector_name}');
          return (
            <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {parts.map((part, j) => (
                <span key={j}>
                  {part}
                  {j < parts.length - 1 && (
                    <span className="text-[var(--accent)]">{protectorLabel}</span>
                  )}
                </span>
              ))}
            </p>
          );
        }
        return (
          <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );

  /** Render multi-line text from a string (split on \n) */
  const renderTextBlock = (text) => renderLines(text.split('\n'));

  // ── Step renderers ──

  const renderTextStep = (step) => {
    // Step 1 (Opening): add serif header
    if (currentStepIndex === 0) {
      return (
        <div className="space-y-4">
          <h2
            className="text-[var(--color-text-primary)] text-xl"
            style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
          >
            Meeting a Protector
          </h2>
          {renderLines(step.content.lines)}
        </div>
      );
    }
    // Last step: add AsciiDiamond animation for finality
    if (isLastStep) {
      return (
        <div className="space-y-4">
          {renderLines(step.content.lines)}
          <div className="flex justify-center pt-2">
            <AsciiDiamond />
          </div>
        </div>
      );
    }
    return renderLines(step.content.lines);
  };

  // Skip just the breathwork step (advance to next step, not skip the whole module)
  const handleSkipBreathwork = useCallback(() => {
    breathController.reset();
    setBreathSubPhase('pre');
    breathSubPhaseRef.current = 'pre';
    advanceStep();
  }, [breathController, advanceStep]);

  // Restart breath from cycle 1
  const handleRestartBreath = useCallback(() => {
    breathController.reset();
    breathController.start();
    setBreathSubPhase('active');
    breathSubPhaseRef.current = 'active';
  }, [breathController]);

  // Skip to free-breathing post phase
  const handleSkipToPostBreath = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      breathController.reset();
      breathController.start();
      setBreathSubPhase('post');
      breathSubPhaseRef.current = 'post';
      setIsVisible(true);
    }, 400);
  }, [breathController]);

  const renderBreathStep = (step) => {
    if (breathSubPhase === 'pre') {
      return (
        <div className="space-y-6">
          {renderTextBlock(step.content.preText)}
          <div className="flex justify-center">
            <button
              onClick={handleSkipBreathwork}
              className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider"
            >
              Skip breathwork
            </button>
          </div>
        </div>
      );
    }

    if (breathSubPhase === 'active') {
      return (
        <div className="flex flex-col items-center justify-center" style={{ minHeight: '50vh' }}>
          <BreathOrb
            phase={breathController.phase}
            phaseProgress={breathController.phaseProgress}
            phaseDuration={breathController.phaseDuration}
            phaseSecondsRemaining={breathController.phaseSecondsRemaining}
            moonAngle={breathController.moonAngle}
            isActive={breathController.isRunning && !breathController.isIdleSegment}
            isIdle={!breathController.hasStarted || breathController.isIdleSegment}
            size="medium"
          />
          {!breathController.isRunning && breathController.hasStarted && !breathController.isComplete && (
            <p className="mt-4 text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider animate-pulse">
              Paused
            </p>
          )}
          <p className="mt-4 text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider">
            Cycle {breathController.currentCycle + 1} / {breathSequences[0].count}
          </p>
          <button
            onClick={handleRestartBreath}
            className="mt-3 text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity"
          >
            Restart
          </button>
          <div className="flex justify-center my-2">
            <div className="circle-spacer" />
          </div>
          <button
            onClick={handleSkipToPostBreath}
            className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity"
          >
            Skip
          </button>
        </div>
      );
    }

    // Post — continuous breathing animation with updated post text
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '50vh' }}>
        <BreathOrb
          phase={breathController.phase}
          phaseProgress={breathController.phaseProgress}
          phaseDuration={breathController.phaseDuration}
          phaseSecondsRemaining={breathController.phaseSecondsRemaining}
          moonAngle={breathController.moonAngle}
          isActive={true}
          isIdle={false}
          hideText={true}
          size="medium"
        />
        <p className="mt-6 text-[var(--color-text-secondary)] text-sm leading-relaxed text-center max-w-xs">
          {step.content.postText}
        </p>
        <button
          onClick={handleRestartBreath}
          className="mt-3 text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity"
        >
          Restart
        </button>
      </div>
    );
  };

  const renderMeditationStep = (step) => {
    // Choice screen
    if (!meditationMode) {
      return (
        <div className="text-center space-y-6">
          <h2
            className="text-[var(--color-text-primary)] text-lg"
            style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
          >
            Guided Meditation
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed max-w-xs mx-auto">
            We recommend listening to this audio meditation, or you can read through it at your own pace.
          </p>
          <div className="flex flex-col gap-3 items-center mt-4">
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => {
                  setMeditationMode('listen');
                  setIsVisible(true);
                }, 400);
              }}
              className="w-48 px-6 py-3 bg-[var(--color-text-primary)] text-white
                uppercase tracking-wider text-xs transition-colors"
            >
              {step.content.listenLabel}
            </button>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => {
                  setMeditationMode('read');
                  setIsVisible(true);
                }, 400);
              }}
              className="w-48 px-6 py-3 border border-[var(--color-border)] text-[var(--color-text-primary)]
                uppercase tracking-wider text-xs hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              {step.content.readLabel}
            </button>
          </div>
        </div>
      );
    }

    if (meditationMode === 'listen') {
      return renderListenMode();
    }

    return renderReadMode();
  };

  const renderListenMode = () => {
    // Loading
    if (playback.isLoading) {
      return (
        <div className="text-center animate-fadeIn">
          <p className="text-[var(--color-text-tertiary)] text-sm uppercase tracking-wider">
            Preparing meditation...
          </p>
        </div>
      );
    }

    // Complete — shown after meditation finishes
    if (playback.isComplete) {
      return (
        <div className="text-center space-y-4 animate-fadeIn">
          <h2 className="text-[var(--color-text-primary)]">Well done.</h2>
          <p className="uppercase tracking-wider text-[10px] text-[var(--color-text-secondary)]">
            Take a moment before we continue.
          </p>
        </div>
      );
    }

    // Unified idle + active view — title and animation stay in place,
    // description cross-fades into prompt text when playback begins
    const isActive = playback.hasStarted;
    return (
      <div className="flex flex-col items-center text-center w-full px-4">
        <h2
          className="font-serif text-2xl text-[var(--color-text-primary)]"
          style={{ textTransform: 'none' }}
        >
          {meditation?.title || 'Guided Meditation'}
        </h2>

        <div className="flex justify-center mt-4">
          <MorphingShapes />
        </div>

        {/* Pause indicator — only during active playback */}
        <div className="h-5 flex items-center justify-center mt-3">
          {isActive && !playback.isPlaying && (
            <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider animate-pulse">
              Paused
            </p>
          )}
        </div>

        {/* Description (idle) cross-fades into prompt text (active) — grid stacking prevents layout shift */}
        <div className="mt-1 px-4 grid" style={{ gridTemplateArea: "'slot'" }}>
          <p
            className={`text-sm leading-relaxed text-[var(--color-text-secondary)] transition-opacity duration-500`}
            style={{ gridArea: 'slot', opacity: isActive ? 0 : 1 }}
          >
            {meditation?.description}
          </p>
          <p
            className={`text-[var(--color-text-secondary)] text-sm leading-relaxed transition-opacity duration-300`}
            style={{
              gridArea: 'slot',
              opacity: isActive && (playback.promptPhase === 'visible' || playback.promptPhase === 'fading-in') ? 1 : 0,
            }}
          >
            {playback.currentPrompt?.text || '\u00A0'}
          </p>
        </div>
      </div>
    );
  };

  const renderReadMode = () => {
    if (!meditation) return null;
    const prompt = meditation.prompts[readPromptIndex];
    return (
      <div className="space-y-6">
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {prompt.text}
        </p>
        <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider text-center">
          {readPromptIndex + 1} / {meditation.prompts.length}
        </p>
      </div>
    );
  };

  const renderNamingStep = (step) => (
    <div className="space-y-6">
      <h2
        className="text-[var(--color-text-primary)] text-lg"
        style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
      >
        {step.content.header}
      </h2>

      {renderTextBlock(step.content.prompt)}

      {/* Name input */}
      <input
        type="text"
        value={protectorName}
        onChange={(e) => setProtectorName(e.target.value)}
        placeholder={step.content.namePlaceholder}
        maxLength={80}
        className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
          focus:outline-none focus:border-[var(--accent)]
          text-[var(--color-text-primary)] text-sm text-center
          placeholder:text-[var(--color-text-tertiary)]"
      />

      {/* Description input */}
      <div>
        <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-2">
          {step.content.descriptionLabel}
        </p>
        <textarea
          value={protectorDescription}
          onChange={(e) => setProtectorDescription(e.target.value)}
          placeholder={step.content.descriptionPlaceholder}
          rows={3}
          className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
            focus:outline-none focus:border-[var(--accent)]
            text-[var(--color-text-primary)] text-sm leading-relaxed
            placeholder:text-[var(--color-text-tertiary)] resize-none"
        />
      </div>

      {/* Collapsible examples */}
      <div>
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="flex items-center gap-1.5 text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider"
        >
          {step.content.examplesLabel}
          <span className="text-[10px] leading-none">{showExamples ? '−' : '+'}</span>
        </button>
        {showExamples && (
          <div className="mt-3 space-y-2 animate-fadeIn">
            {PROTECTOR_EXAMPLES.map((example, i) => (
              <div key={i} className="border border-[var(--color-border)] px-3 py-2">
                <p className="text-[var(--color-text-primary)] text-xs uppercase tracking-wider">
                  {example.name}
                </p>
                <p className="text-[var(--color-text-tertiary)] text-[11px] mt-0.5 normal-case tracking-normal">
                  {example.description}
                </p>
              </div>
            ))}
            <p className="text-[var(--color-text-tertiary)] text-[11px] italic mt-2">
              {step.content.examplesFootnote}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderFeelTowardStep = (step) => {
    // Sub-phase: check (initial selection)
    if (feelTowardSubPhase === 'check') {
      return (
        <div className="space-y-6">
          <h2
            className="text-[var(--color-text-primary)] text-lg"
            style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
          >
            {step.content.checkHeader}
          </h2>
          {renderTextBlock(step.content.checkPrompt)}
          <div className="grid grid-cols-2 gap-2">
            {FEEL_TOWARD_OPTIONS.map((option) => {
              const isSelected = feelTowardSelection === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFeelTowardSelection(isSelected ? null : option.id)}
                  className={`py-3 px-3 border transition-colors duration-150 text-left ${
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
                      : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                  }`}
                >
                  <span className="uppercase tracking-wider text-xs block">
                    {option.label}
                  </span>
                  <span className="text-[10px] block mt-1 opacity-60 normal-case tracking-normal">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Sub-phase: unblending (text page)
    if (feelTowardSubPhase === 'unblending') {
      return renderLines(FEEL_TOWARD_UNBLENDING_TEXT);
    }

    // Sub-phase: recheck
    return (
      <div className="space-y-6">
        {renderTextBlock(step.content.recheckPrompt)}
        <div className="grid grid-cols-2 gap-2">
          {FEEL_TOWARD_OPTIONS.map((option) => {
            const isSelected = feelTowardRecheckSelection === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setFeelTowardRecheckSelection(isSelected ? null : option.id)}
                className={`py-3 px-3 border transition-colors duration-150 text-left ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
                    : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                <span className="uppercase tracking-wider text-xs block">
                  {option.label}
                </span>
                <span className="text-[10px] block mt-1 opacity-60 normal-case tracking-normal">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
        {/* Gentle note if still selecting negative */}
        {feelTowardRecheckSelection && !FEEL_TOWARD_OPTIONS.find((o) => o.id === feelTowardRecheckSelection)?.positive && (
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed italic animate-fadeIn">
            {FEEL_TOWARD_GENTLE_NOTE}
          </p>
        )}
      </div>
    );
  };

  const renderTextInputStep = (step) => {
    const { field, placeholder, prompt, preText, header, multiline } = step.content;
    const value = field === 'bodyLocation' ? bodyLocation : protectorMessage;
    const setValue = field === 'bodyLocation' ? setBodyLocation : setProtectorMessage;

    return (
      <div className="space-y-6">
        {header && (
          <h2
            className="text-[var(--color-text-primary)] text-lg"
            style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
          >
            {header}
          </h2>
        )}
        {renderTextBlock(preText || prompt)}
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] text-sm leading-relaxed
              placeholder:text-[var(--color-text-tertiary)] resize-none"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] text-sm text-center
              placeholder:text-[var(--color-text-tertiary)]"
          />
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep.type) {
      case 'text': return renderTextStep(currentStep);
      case 'breath': return renderBreathStep(currentStep);
      case 'meditation': return renderMeditationStep(currentStep);
      case 'naming': return renderNamingStep(currentStep);
      case 'feelToward': return renderFeelTowardStep(currentStep);
      case 'textInput': return renderTextInputStep(currentStep);
      default: return null;
    }
  };

  // ── Control bar configuration ──

  const getShowBack = () => {
    if (currentStepIndex === 0) return false;
    if (currentStep.type === 'breath' && (breathSubPhase === 'active' || breathSubPhase === 'post')) return false;
    // Show back during meditation listen playback (will restart instead of navigating back)
    return true;
  };

  const getPrimaryConfig = () => {
    // Meditation listen mode — playback controls the primary button
    if (currentStep.type === 'meditation' && meditationMode === 'listen') {
      if (playback.getPhase() === 'idle') {
        return { label: 'Begin', onClick: handleBeginMeditation };
      }
      return playback.getPrimaryButton();
    }

    // Choice screen — no primary button
    if (currentStep.type === 'meditation' && !meditationMode) {
      return null;
    }

    // Naming — disabled until a name is entered
    if (currentStep.type === 'naming' && !protectorName.trim()) {
      return { label: 'Continue', onClick: handlePrimary, disabled: true };
    }

    // Feel-toward — disabled until a selection is made
    if (currentStep.type === 'feelToward') {
      if (feelTowardSubPhase === 'check' && !feelTowardSelection) {
        return { label: 'Continue', onClick: handlePrimary, disabled: true };
      }
      if (feelTowardSubPhase === 'unblending') {
        return { label: 'Continue', onClick: handlePrimary };
      }
      if (feelTowardSubPhase === 'recheck' && !feelTowardRecheckSelection) {
        return { label: 'Continue', onClick: handlePrimary, disabled: true };
      }
    }

    // Breath sub-phases
    if (currentStep.type === 'breath') {
      if (breathSubPhase === 'pre') return { label: 'Begin', onClick: handlePrimary };
      if (breathSubPhase === 'active') {
        return {
          label: breathController.isRunning ? 'Pause' : 'Resume',
          onClick: handlePrimary,
        };
      }
      return { label: 'Continue', onClick: handlePrimary };
    }

    // Read mode — Continue through prompts
    if (currentStep.type === 'meditation' && meditationMode === 'read') {
      const isLast = readPromptIndex >= meditation.prompts.length - 1;
      return { label: isLast ? 'Finish' : 'Continue', onClick: handlePrimary };
    }

    // Last step
    if (isLastStep) return { label: 'Complete', onClick: handlePrimary };

    // Default
    return { label: 'Continue', onClick: handlePrimary };
  };

  const getSkipConfig = () => {
    if (isLastStep) return false;
    // Breath step: hide module skip (pre has inline skip, active/post don't need it)
    if (currentStep.type === 'breath') return false;
    // In listen mode, skip targets the meditation (not the whole module)
    if (currentStep.type === 'meditation' && meditationMode === 'listen' && playback.hasStarted) {
      return true;
    }
    return true;
  };

  const getSkipHandler = () => {
    if (currentStep.type === 'meditation' && meditationMode === 'listen' && playback.hasStarted) {
      return playback.handleSkip;
    }
    return handleModuleSkip;
  };

  const getSkipMessage = () => {
    if (currentStep.type === 'meditation' && meditationMode === 'listen') {
      return 'Skip this meditation?';
    }
    return 'Skip this activity?';
  };

  // Meditation listen mode: volume + transcript button
  const getLeftSlot = () => {
    if (currentStep.type === 'meditation' && meditationMode === 'listen' && playback.hasStarted && !playback.isComplete) {
      return (
        <VolumeButton
          volume={playback.audio.volume}
          onVolumeChange={playback.audio.setVolume}
        />
      );
    }
    return null;
  };

  const getRightSlot = () => {
    if (currentStep.type === 'meditation' && meditationMode === 'listen' && playback.hasStarted && !playback.isComplete) {
      return (
        <SlotButton
          icon={<TranscriptIcon />}
          label="View transcript"
          onClick={handleOpenTranscript}
        />
      );
    }
    return null;
  };

  // ── Landing page (idle) ──
  if (!hasStarted) {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <div className={`flex flex-col items-center px-4 transition-opacity duration-[400ms] ${isLandingVisible ? 'opacity-100' : 'opacity-0'}`}>
            <h2
              className="text-2xl text-[var(--color-text-primary)] mb-2"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              Dialogue with a Protector
            </h2>
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] mb-6">
              Part I
            </p>

            <div className="flex justify-center mb-4">
              <div className="circle-spacer" />
            </div>

            <button
              onClick={() => setShowIfsInfo(!showIfsInfo)}
              className="flex items-center gap-1.5 text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-4"
            >
              {PART1_LANDING.subtitle}
              <span className="text-[10px] leading-none">{showIfsInfo ? '−' : '+'}</span>
            </button>
            {showIfsInfo && (
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4 max-w-sm text-center animate-fadeIn">
                {PART1_LANDING.description}
              </p>
            )}

            <div className="flex justify-center mb-4">
              <div className="circle-spacer" />
            </div>

            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed max-w-sm text-center">
              {PART1_LANDING.goals}
            </p>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="idle"
          primary={{ label: 'Begin', onClick: handleBegin }}
          showBack={false}
          showSkip={true}
          onSkip={onSkip}
          skipConfirmMessage="Skip this activity?"
        />
      </>
    );
  }

  return (
    <>
      <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
        <div className={`pt-6 transition-opacity duration-[400ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div key={`${currentStepIndex}-${feelTowardSubPhase}`} className="animate-fadeIn">
            {renderStepContent()}
          </div>
        </div>
      </ModuleLayout>

      <ModuleControlBar
        phase={isLastStep ? 'completed' : 'active'}
        primary={getPrimaryConfig()}
        showBack={getShowBack()}
        onBack={handleBack}
        backConfirmMessage={currentStep.type === 'meditation' && meditationMode === 'listen' && playback.hasStarted
          ? "Restart this meditation from the beginning?"
          : null
        }
        showSkip={getSkipConfig()}
        onSkip={getSkipHandler()}
        skipConfirmMessage={getSkipMessage()}
        showSeekControls={currentStep.type === 'meditation' && meditationMode === 'listen' && playback.hasStarted && !playback.isComplete && !playback.isLoading}
        onSeekBack={() => playback.handleSeekRelative(-10)}
        onSeekForward={() => playback.handleSeekRelative(10)}
        leftSlot={getLeftSlot()}
        rightSlot={getRightSlot()}
      />

      {/* Transcript modal */}
      <TranscriptModal
        isOpen={showTranscript}
        closing={transcriptClosing}
        onClose={handleCloseTranscript}
        title={meditation?.title || 'Guided Meditation'}
        prompts={meditation?.prompts || []}
      />
    </>
  );
}

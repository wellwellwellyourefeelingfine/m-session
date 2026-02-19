/**
 * ProtectorDialoguePart1Module Component
 *
 * "Meeting a Protector" — 10-step IFS guided activity for peak phase.
 * Steps: 3 text pages → breath exercise → meditation (listen/read) →
 * protector selection → affirmation → body location → message → closing text.
 *
 * Saves protector captures to transitionCaptures.protectorDialogue for Part 2.
 * Creates a journal entry on completion.
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useJournalStore } from '../../../stores/useJournalStore';
import {
  PART1_STEPS,
  PART1_LANDING,
  PROTECTOR_AFFIRMATIONS,
  getProtectorLabel,
} from '../../../content/modules/protectorDialogueContent';
import {
  getMeditationById,
  generateTimedSequence,
} from '../../../content/meditations';
import { useMeditationPlayback } from '../../../hooks/useMeditationPlayback';
import { useBreathController } from '../hooks/useBreathController';

// Shared UI components
import ModuleLayout from '../capabilities/ModuleLayout';
import ModuleControlBar, { VolumeButton, SlotButton } from '../capabilities/ModuleControlBar';
import ModuleProgressBar from '../capabilities/ModuleProgressBar';
import BreathOrb from '../capabilities/animations/BreathOrb';
import AsciiDiamond from '../capabilities/animations/AsciiDiamond';
import MorphingShapes from '../capabilities/animations/MorphingShapes';
import ProtectorSelectionGrid from './shared/ProtectorSelectionGrid';

export default function ProtectorDialoguePart1Module({ module, onComplete, onSkip, onTimerUpdate }) {
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
  const [stepHistory, setStepHistory] = useState([0]);

  // ── Protector captures ──
  const [selectedProtector, setSelectedProtector] = useState(null);
  const [customProtectorName, setCustomProtectorName] = useState('');
  const [bodyLocation, setBodyLocation] = useState('');
  const [protectorMessage, setProtectorMessage] = useState('');

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
  const [showMeditationAnimation, setShowMeditationAnimation] = useState(true);

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
    onTimerUpdate,
  });

  // ── Derived values ──
  const currentStep = PART1_STEPS[currentStepIndex];
  const totalSteps = PART1_STEPS.length;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;
  const protectorLabel = getProtectorLabel(selectedProtector, customProtectorName);

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
    if (selectedProtector) {
      updateProtectorCapture('protectorType', selectedProtector);
      updateProtectorCapture('customProtectorName', customProtectorName);
    }
    if (bodyLocation.trim()) {
      updateProtectorCapture('bodyLocation', bodyLocation.trim());
    }
    if (protectorMessage.trim()) {
      updateProtectorCapture('protectorMessage', protectorMessage.trim());
    }
    updateProtectorCapture('completedAt', Date.now());

    // Create journal entry (only if there's meaningful content)
    let journalContent = 'PROTECTOR DIALOGUE — PART 1\n\n';
    let hasContent = false;

    if (selectedProtector) {
      journalContent += `Protector: ${protectorLabel}\n\n`;
      hasContent = true;
    }
    if (bodyLocation.trim()) {
      journalContent += `Body Location: ${bodyLocation.trim()}\n\n`;
      hasContent = true;
    }
    if (protectorMessage.trim()) {
      journalContent += `Message to Protector:\n${protectorMessage.trim()}\n`;
      hasContent = true;
    }

    if (hasContent) {
      addEntry({
        content: journalContent.trim(),
        source: 'session',
        sessionId,
        moduleTitle: 'Dialogue with a Protector (Part 1)',
      });
    }

    onComplete();
  }, [
    selectedProtector, customProtectorName, bodyLocation, protectorMessage,
    protectorLabel, updateProtectorCapture, addEntry, sessionId, onComplete,
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

    goBack();
  }, [currentStepIndex, meditationMode, readPromptIndex, playback.hasStarted, breathController, goBack, handleRestartMeditation]);

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

      case 'selection':
      case 'affirmation':
      case 'textInput':
        if (isLastStep) {
          handleModuleComplete();
        } else {
          advanceStep();
        }
        break;

      default:
        advanceStep();
    }
  }, [
    currentStepIndex, isLastStep, breathSubPhase, meditationMode, readPromptIndex,
    breathController, meditation, advanceStep, handleModuleComplete, advanceFromMeditation,
  ]);

  // ── Render helpers ──

  /** Render multi-line text from an array of lines (left-aligned, primary color) */
  const renderLines = (lines) => (
    <div className="space-y-0">
      {lines.map((line, i) => {
        if (line === '') return <div key={i} className="h-4" />;
        if (line === '§') return (
          <div key={i} className="flex justify-center my-4">
            <div className="circle-spacer" />
          </div>
        );
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

    // Post — continuous breathing animation without text
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
          Continue breathing here at your own pace for as long as you need. When you're ready, press continue to proceed.
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

  const renderSelectionStep = (step) => (
    <div className="space-y-6">
      {renderTextBlock(step.content.prompt)}
      <ProtectorSelectionGrid
        selected={selectedProtector}
        customLabel={customProtectorName}
        onChange={setSelectedProtector}
        onCustomLabelChange={setCustomProtectorName}
      />
    </div>
  );

  const renderAffirmationStep = () => {
    const affirmation = selectedProtector
      ? PROTECTOR_AFFIRMATIONS[selectedProtector]
      : PROTECTOR_AFFIRMATIONS.other;
    const title = affirmation.title || protectorLabel;

    return (
      <div className="text-center space-y-6">
        <h2
          className="text-[var(--color-text-primary)]"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none', fontSize: '18px' }}
        >
          {title}
        </h2>
        <div className="space-y-0">
          {affirmation.body.split('\n').map((line, i) =>
            line === '' ? (
              <div key={i} className="h-4" />
            ) : (
              <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                {line}
              </p>
            )
          )}
        </div>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed italic">
          {affirmation.closing}
        </p>
      </div>
    );
  };

  const renderTextInputStep = (step) => {
    const { field, placeholder, prompt, multiline } = step.content;
    const value = field === 'bodyLocation' ? bodyLocation : protectorMessage;
    const setValue = field === 'bodyLocation' ? setBodyLocation : setProtectorMessage;

    return (
      <div className="space-y-6">
        {renderTextBlock(prompt)}
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            rows={4}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] text-sm leading-relaxed              placeholder:text-[var(--color-text-tertiary)] resize-none"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] text-sm text-center              placeholder:text-[var(--color-text-tertiary)]"
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
      case 'selection': return renderSelectionStep(currentStep);
      case 'affirmation': return renderAffirmationStep();
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

    // Selection — disabled until a protector is chosen
    if (currentStep.type === 'selection' && !selectedProtector) {
      return { label: 'Continue', onClick: handlePrimary, disabled: true };
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

  // Meditation listen mode: animation toggle + mute button
  const getLeftSlot = () => {
    if (currentStep.type === 'meditation' && meditationMode === 'listen' && playback.hasStarted && !playback.isComplete) {
      return (
        <SlotButton
          icon={<AnimationIcon visible={showMeditationAnimation} />}
          label={showMeditationAnimation ? 'Hide animation' : 'Show animation'}
          onClick={() => setShowMeditationAnimation(!showMeditationAnimation)}
          active={showMeditationAnimation}
        />
      );
    }
    return null;
  };

  const getRightSlot = () => {
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
      <ModuleProgressBar progress={progress} visible={true} showTime={false} />

      <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
        <div className={`pt-6 transition-opacity duration-[400ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div key={currentStepIndex} className="animate-fadeIn">
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
        leftSlot={getLeftSlot()}
        rightSlot={getRightSlot()}
      />
    </>
  );
}

/**
 * Animation toggle icon (eye open/closed)
 */
function AnimationIcon({ visible }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {visible ? (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  );
}

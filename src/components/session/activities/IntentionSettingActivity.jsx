/**
 * IntentionSettingActivity Component
 *
 * A 12-page pre-session flow guiding the user through intention refinement.
 * Pages: welcome → education → optional meditation → self-inquiry (2) →
 * one-thing → stems education → stems interactive → [moon transition] →
 * write intention → reflection (2) → closing.
 *
 * Follows the ProtectorDialoguePart1Module pattern for step navigation
 * and embedded meditation playback.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useJournalStore } from '../../../stores/useJournalStore';
import {
  PROGRESS_STEPS,
  INTENTION_STEPS,
  TERRITORY_OPTIONS,
  FEELING_OPTIONS,
  STEM_INPUTS,
  getWelcomeContent,
} from './intentionSettingContent';
import {
  getMeditationById,
  generateTimedSequence,
} from '../../../content/meditations';
import { useMeditationPlayback } from '../../../hooks/useMeditationPlayback';
import useProgressReporter from '../../../hooks/useProgressReporter';

// Shared UI components
import ModuleLayout from '../../active/capabilities/ModuleLayout';
import MeditationLoadingScreen from '../../active/capabilities/MeditationLoadingScreen';
import ModuleControlBar, { VolumeButton, SlotButton } from '../../active/capabilities/ModuleControlBar';

import AsciiMoon from '../../active/capabilities/animations/AsciiMoon';
import MorphingShapes from '../../active/capabilities/animations/MorphingShapes';
import LeafDrawV2 from '../../active/capabilities/animations/LeafDrawV2';
import TranscriptModal, { TranscriptIcon, FADE_MS } from '../../active/capabilities/TranscriptModal';

// Moon transition step index
const MOON_STEP = 8;

export default function IntentionSettingActivity({ module, onComplete, onSkip, onProgressUpdate }) {
  // ── Stores ──
  const sessionProfile = useSessionStore((s) => s.sessionProfile);
  const updateSessionProfile = useSessionStore((s) => s.updateSessionProfile);
  const completePreSubstanceActivity = useSessionStore((s) => s.completePreSubstanceActivity);
  const sessionId = useSessionStore((s) => s.sessionId);
  const addEntry = useJournalStore((s) => s.addEntry);
  const updateEntry = useJournalStore((s) => s.updateEntry);

  const existingIntention = sessionProfile?.holdingQuestion || '';
  const hasExistingIntention = existingIntention.trim().length > 0;

  // ── Progress reporting ──
  const report = useProgressReporter(onProgressUpdate);

  // ── Step navigation ──
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [_stepHistory, setStepHistory] = useState([0]);

  // ── Meditation sub-flow (Page 3) ──
  const [inMeditation, setInMeditation] = useState(false);

  // ── Transcript modal ──
  const [showTranscript, setShowTranscript] = useState(false);
  const [transcriptClosing, setTranscriptClosing] = useState(false);
  const transcriptCloseTimerRef = useRef(null);

  const handleOpenTranscript = useCallback(() => {
    setShowTranscript(true);
  }, []);

  const handleCloseTranscript = useCallback(() => {
    setTranscriptClosing(true);
    if (transcriptCloseTimerRef.current) clearTimeout(transcriptCloseTimerRef.current);
    transcriptCloseTimerRef.current = setTimeout(() => {
      setShowTranscript(false);
      setTranscriptClosing(false);
    }, FADE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (transcriptCloseTimerRef.current) clearTimeout(transcriptCloseTimerRef.current);
    };
  }, []);

  // ── Self-inquiry selections (local only — not saved to store) ──
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [selectedFeeling, setSelectedFeeling] = useState(null);

  // ── Writing warm-up (local only) ──
  const [teachDraft, setTeachDraft] = useState('');
  const [showDraft, setShowDraft] = useState('');
  const [helpDraft, setHelpDraft] = useState('');

  // ── Moon transition ──
  const [moonPhase, setMoonPhase] = useState('blank'); // 'blank' | 'fading-in' | 'visible' | 'fading-out'
  const moonTimersRef = useRef([]);

  // ── Main intention ──
  const [intentionText, setIntentionText] = useState(existingIntention);

  // ── Reflection edit mode ──
  const [isEditing, setIsEditing] = useState(false);

  // ── Meditation setup (Short Grounding) ──
  const meditation = getMeditationById('short-grounding');

  const [timedSequence, meditationTotalDuration] = useMemo(() => {
    if (!meditation) return [[], 0];
    const sequence = generateTimedSequence(meditation.prompts, 1.0, {
      audioConfig: meditation.audio,
    });
    const total = meditation.fixedDuration || (sequence.length > 0 ? sequence[sequence.length - 1].endTime : 0);
    return [sequence, total];
  }, [meditation]);

  const advanceFromMeditation = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setInMeditation(false);
      setCurrentStepIndex((prev) => {
        const nextIndex = prev + 1;
        setStepHistory((h) => [...h, nextIndex]);
        return nextIndex;
      });
      setIsVisible(true);
    }, 400);
  }, []);

  const playback = useMeditationPlayback({
    meditationId: 'short-grounding',
    moduleInstanceId: module.instanceId,
    timedSequence,
    totalDuration: meditationTotalDuration,
    onComplete: advanceFromMeditation,
    onSkip: advanceFromMeditation,
    onProgressUpdate,
  });

  // ── Derived values ──
  const currentStep = INTENTION_STEPS[currentStepIndex];
  const totalSteps = INTENTION_STEPS.length;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const isMoonStep = currentStep?.type === 'moonTransition';

  // Progress: exclude moon transition step from count
  const effectiveStep = currentStepIndex > MOON_STEP ? currentStepIndex - 1 : currentStepIndex;

  // Report step-based progress to parent when not in meditation
  useEffect(() => {
    if (!inMeditation) {
      report.step(effectiveStep + 1, PROGRESS_STEPS);
    }
  }, [effectiveStep, inMeditation, report]);

  // ── Step navigation ──
  const advanceStep = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentStepIndex((prev) => {
        const nextIndex = prev + 1;
        setStepHistory((h) => [...h, nextIndex]);
        return nextIndex;
      });
      setIsEditing(false);
      setIsVisible(true);
    }, 400);
  }, []);

  const goBack = useCallback(() => {
    if (currentStepIndex === 0) return;
    setIsVisible(false);
    setTimeout(() => {
      setStepHistory((h) => (h.length <= 1 ? h : h.slice(0, -1)));
      setCurrentStepIndex((prev) => Math.max(0, prev - 1));
      setIsEditing(false);
      setIsVisible(true);
    }, 400);
  }, [currentStepIndex]);

  // ── Moon transition auto-advance ──
  useEffect(() => {
    if (currentStep?.type !== 'moonTransition') return;

    setMoonPhase('blank');
    const timers = [];

    timers.push(setTimeout(() => setMoonPhase('fading-in'), 300));
    timers.push(setTimeout(() => setMoonPhase('visible'), 1100));
    // No fade-out — moon stays visible and carries over to intention page
    timers.push(setTimeout(() => {
      setCurrentStepIndex((prev) => {
        const nextIndex = prev + 1;
        setStepHistory((h) => [...h, nextIndex]);
        return nextIndex;
      });
      setIsVisible(true);
    }, 3100));

    moonTimersRef.current = timers;
    return () => timers.forEach(clearTimeout);
  }, [currentStepIndex, currentStep?.type]);

  // ── Save intention to store ──
  const saveIntention = useCallback(() => {
    if (intentionText.trim()) {
      updateSessionProfile('holdingQuestion', intentionText.trim());
    }
  }, [intentionText, updateSessionProfile]);

  // ── Module completion ──
  const handleModuleComplete = useCallback(() => {
    if (intentionText.trim()) {
      updateSessionProfile('holdingQuestion', intentionText.trim());

      const existingEntryId = sessionProfile?.intentionJournalEntryId;
      const content = `INTENTION:\n\n${intentionText.trim()}`;

      // Update the intake-created entry if one exists so we don't duplicate.
      if (existingEntryId) {
        updateEntry(existingEntryId, content);
      } else {
        const entry = addEntry({
          content,
          source: 'session',
          sessionId,
          moduleTitle: 'Pre-Session Intention Setting (OLD)',
          isEdited: false,
        });
        if (entry?.id) {
          updateSessionProfile('intentionJournalEntryId', entry.id);
        }
      }
    }

    completePreSubstanceActivity('intention-setting');
    onComplete();
  }, [intentionText, sessionProfile?.intentionJournalEntryId, updateSessionProfile, addEntry, updateEntry, sessionId, completePreSubstanceActivity, onComplete]);

  // ── Skip handler (saves intention if written) ──
  const handleModuleSkip = useCallback(() => {
    saveIntention();
    onSkip();
  }, [saveIntention, onSkip]);

  // ── Begin meditation ──
  // Standard multi-phase begin: shows MeditationLoadingScreen for the
  // minimum duration during composition, then fades into active playback.
  const handleBeginMeditation = useCallback(() => {
    playback.handleBeginWithTransition();
  }, [playback]);

  // ── Restart meditation ──
  const handleRestartMeditation = useCallback(() => {
    playback.handleRestart();
  }, [playback]);

  // ── Primary button handler ──
  const handlePrimary = useCallback(() => {
    const step = INTENTION_STEPS[currentStepIndex];

    switch (step.type) {
      case 'welcome':
      case 'text':
        advanceStep();
        break;

      case 'meditationOffer':
        // Primary button not used — inline buttons handle this
        break;

      case 'selection':
        advanceStep();
        break;

      case 'writingWarmup':
        // After warm-up, advance to moon transition
        advanceStep();
        break;

      case 'intention':
        // Save intention on continue
        saveIntention();
        advanceStep();
        break;

      case 'reflection':
        // Save any edits
        if (isEditing) {
          saveIntention();
          setIsEditing(false);
        }
        advanceStep();
        break;

      case 'closing':
        setIsVisible(false);
        setTimeout(() => handleModuleComplete(), 400);
        break;

      default:
        advanceStep();
    }
  }, [currentStepIndex, advanceStep, saveIntention, isEditing, handleModuleComplete]);

  // ── Handle back with step-specific logic ──
  const handleBack = useCallback(() => {
    // Meditation sub-flow: navigate within meditation first
    if (inMeditation) {
      if (playback.hasStarted) {
        handleRestartMeditation();
        return;
      }
      // Not started yet — exit meditation mode
      setInMeditation(false);
      return;
    }

    // From intention page (step 9): skip back over moon transition to step 7
    if (currentStepIndex === MOON_STEP + 1) {
      setIsVisible(false);
      setTimeout(() => {
        const targetIndex = MOON_STEP - 1; // step 7 (writing warm-up)
        setCurrentStepIndex(targetIndex);
        setStepHistory((h) => [...h, targetIndex]);
        setIsEditing(false);
        setIsVisible(true);
      }, 400);
      return;
    }

    // If editing on a reflection page, cancel edit
    if (isEditing) {
      setIsEditing(false);
      return;
    }

    goBack();
  }, [currentStepIndex, inMeditation, isEditing, playback.hasStarted, handleRestartMeditation, goBack]);

  // ── Step renderers ──

  const renderWelcomeStep = () => {
    const content = getWelcomeContent(hasExistingIntention);
    return (
      <div className="space-y-6">
        <h2
          className="text-[var(--color-text-primary)] text-xl text-center"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          {content.title}
        </h2>
        <div className="flex justify-center">
          <LeafDrawV2 />
        </div>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.body}
        </p>
      </div>
    );
  };

  const renderTextStep = (step) => {
    const { content } = step;
    const showLeaf = step.id === 'inquiry-one-thing';
    return (
      <div className="space-y-6">
        {content.title && (
          <h2
            className="text-[var(--color-text-primary)] text-xl text-center"
            style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
          >
            {content.title}
          </h2>
        )}
        {showLeaf && (
          <div className="flex justify-center">
            <LeafDrawV2 />
          </div>
        )}
        {content.body && (
          <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {content.body}
          </p>
        )}
        {content.bodySecondary && (
          <>
            {showLeaf && (
              <div className="flex justify-center">
                <div className="circle-spacer" />
              </div>
            )}
            <p className={`text-sm leading-relaxed ${content.example ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}`}>
              {content.bodySecondary}
            </p>
          </>
        )}

        {/* Example block (Intention vs. Expectation page) */}
        {content.example && (
          <div className="space-y-3">
            <div>
              <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider mb-1">
                Expectation
              </p>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed line-through opacity-60">
                &ldquo;{content.example.expectation}&rdquo;
              </p>
            </div>
            <div>
              <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider mb-1">
                Intention
              </p>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed border-l-2 border-[var(--accent)] pl-3">
                &ldquo;{content.example.intention}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* Stems preview (education page) */}
        {content.stems && (
          <div className="flex flex-col items-center gap-2 py-2">
            {content.stems.map((stem, i) => (
              <p
                key={i}
                className="text-[var(--accent)] text-lg"
                style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
              >
                {stem}
              </p>
            ))}
          </div>
        )}

        {content.footer && (
          <>
            <div className="flex justify-center">
              <div className="circle-spacer" />
            </div>
            <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider text-center">
              {content.footer}
            </p>
          </>
        )}
      </div>
    );
  };

  const renderMeditationOfferStep = (step) => {
    const { content } = step;

    // In meditation mode — render the meditation playback
    if (inMeditation) {
      return renderMeditationPlayback();
    }

    // Offer screen — two inline buttons
    return (
      <div className="space-y-6">
        <h2
          className="text-[var(--color-text-primary)] text-xl text-center"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          {content.title}
        </h2>
        <div className="flex justify-center">
          <MorphingShapes />
        </div>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.body}
        </p>
        <p className="text-[var(--color-text-tertiary)] text-sm leading-relaxed">
          {content.bodySecondary}
        </p>

        <div className="flex flex-col gap-3 items-center pt-2">
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => {
                setInMeditation(true);
                setIsVisible(true);
              }, 400);
            }}
            className="w-full py-4 uppercase tracking-wider text-xs hover:opacity-80 transition-opacity duration-300"
            style={{
              backgroundColor: 'var(--text-primary)',
              color: 'var(--bg-primary)',
            }}
          >
            {content.meditationButton}
          </button>
          <button
            onClick={advanceStep}
            className="w-full py-4 border uppercase tracking-wider text-xs hover:opacity-80 transition-opacity duration-300"
            style={{
              borderColor: 'var(--text-primary)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          >
            {content.skipButton}
          </button>
        </div>
      </div>
    );
  };

  const renderMeditationPlayback = () => {
    // Loading — shown for the multi-phase begin's full window. Gating on
    // transitionStage (rather than playback.isLoading) keeps the loading
    // screen up for the standard minimum duration even when composition
    // finishes early.
    if (playback.transitionStage === 'preparing' || playback.transitionStage === 'preparing-leaving') {
      return (
        <MeditationLoadingScreen
          isLeaving={playback.transitionStage === 'preparing-leaving'}
        />
      );
    }

    // Complete
    if (playback.isComplete) {
      return (
        <div className="text-center space-y-4 animate-fadeIn">
          <h2
            className="text-[var(--color-text-primary)]"
            style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
          >
            Well done.
          </h2>
          <p className="uppercase tracking-wider text-[10px] text-[var(--color-text-secondary)]">
            Take a moment before we continue.
          </p>
        </div>
      );
    }

    // Idle + active — title and animation stay, description cross-fades into prompt
    const isActive = playback.hasStarted;
    return (
      <div className="flex flex-col items-center text-center w-full px-4">
        <h2
          className="font-serif text-2xl text-[var(--color-text-primary)]"
          style={{ textTransform: 'none' }}
        >
          {meditation?.title || 'Basic Grounding'}
        </h2>

        <div className="flex justify-center mt-4">
          <MorphingShapes />
        </div>

        {/* Pause indicator */}
        <div className="h-5 flex items-center justify-center mt-3">
          {isActive && !playback.isPlaying && (
            <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider animate-pulse">
              Paused
            </p>
          )}
        </div>

        {/* Description (idle) cross-fades into prompt text (active) */}
        <div className="mt-1 px-4 grid" style={{ gridTemplateArea: "'slot'" }}>
          <p
            className="text-sm leading-relaxed text-[var(--color-text-secondary)] transition-opacity duration-500"
            style={{ gridArea: 'slot', opacity: isActive ? 0 : 1 }}
          >
            {meditation?.description}
          </p>
          <p
            className="text-[var(--color-text-secondary)] text-sm leading-relaxed transition-opacity duration-300"
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

  const renderSelectionStep = (step) => {
    const { content } = step;
    const options = content.optionsKey === 'territory' ? TERRITORY_OPTIONS : FEELING_OPTIONS;
    const selected = content.optionsKey === 'territory' ? selectedTerritory : selectedFeeling;
    const setSelected = content.optionsKey === 'territory' ? setSelectedTerritory : setSelectedFeeling;

    return (
      <div className="space-y-6">
        <h2
          className="text-[var(--color-text-primary)] text-xl text-center"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          {content.title}
        </h2>
        <div className="flex justify-center">
          <LeafDrawV2 />
        </div>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.body}
        </p>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.bodySecondary}
        </p>

        <div className="flex flex-col gap-2 pb-24">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelected(selected === option.value ? null : option.value)}
              className={`w-full py-3 px-4 text-left uppercase tracking-wider text-xs transition-colors ${
                selected === option.value
                  ? 'border border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
                  : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderWritingWarmupStep = (step) => {
    const { content } = step;
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2
            className="text-[var(--color-text-primary)] text-xl"
            style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
          >
            {content.title}
          </h2>
          <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mt-4">
            {content.body}
          </p>
        </div>

        <div className="space-y-5 max-w-sm mx-auto">
          {STEM_INPUTS.map((stem, i) => {
            const value = i === 0 ? teachDraft : i === 1 ? showDraft : helpDraft;
            const setter = i === 0 ? setTeachDraft : i === 1 ? setShowDraft : setHelpDraft;
            return (
              <div key={stem.prefix}>
                <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider mb-2">
                  {stem.prefix}
                </p>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={stem.placeholder}
                  maxLength={120}
                  className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                    focus:outline-none focus:border-[var(--accent)] text-[var(--color-text-primary)]
                    text-sm placeholder:text-[var(--color-text-tertiary)]"
                />
              </div>
            );
          })}
        </div>

        {content.footer && (
          <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider text-center">
            {content.footer}
          </p>
        )}
      </div>
    );
  };

  const renderIntentionStep = (step) => {
    const { content } = step;
    const showBodyText = !hasExistingIntention && !intentionText.trim();

    // Title and AsciiMoon are rendered in the persistent moon area above
    return (
      <div className="space-y-3">
        {showBodyText && (
          <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed">
            {content.bodyNoExisting}
          </p>
        )}

        <textarea
          value={intentionText}
          onChange={(e) => setIntentionText(e.target.value)}
          placeholder={content.placeholder}
          rows={6}
          className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
            focus:outline-none focus:border-[var(--accent)] text-[var(--color-text-primary)]
            text-sm leading-relaxed resize-none placeholder:text-[var(--color-text-tertiary)]
            text-left"
          style={{ textTransform: 'none' }}
        />
      </div>
    );
  };

  const renderReflectionStep = (step) => {
    const { content } = step;
    const hasIntention = intentionText.trim().length > 0;

    return (
      <div className="space-y-6">
        <h2
          className="text-[var(--color-text-primary)] text-xl text-center"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          {content.title}
        </h2>
        <div className="flex justify-center">
          <LeafDrawV2 />
        </div>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.body}
        </p>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.bodySecondary}
        </p>

        {/* Intention display box (only if something was written) */}
        {hasIntention && !isEditing && (
          <>
            <div className="py-4 px-4 border border-[var(--accent)] bg-[var(--accent-bg)] text-left">
              <p
                className="text-[var(--color-text-primary)] text-sm italic leading-relaxed"
                style={{ textTransform: 'none' }}
              >
                &ldquo;{intentionText.trim()}&rdquo;
              </p>
            </div>
            {content.editButton && (
              <div className="text-center">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider underline"
                >
                  {content.editButton}
                </button>
              </div>
            )}
          </>
        )}

        {/* Editable textarea (replaces display box when editing) */}
        {hasIntention && isEditing && (
          <textarea
            value={intentionText}
            onChange={(e) => setIntentionText(e.target.value)}
            rows={4}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)] text-[var(--color-text-primary)]
              text-sm leading-relaxed resize-none text-left"
            style={{ textTransform: 'none' }}
            autoFocus
          />
        )}

        {/* Guidance when no digital intention was written */}
        {!hasIntention && content.bodyNoIntention && (
          <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed">
            ({content.bodyNoIntention})
          </p>
        )}
      </div>
    );
  };

  const renderClosingStep = (step) => {
    const { content } = step;
    const hasIntention = intentionText.trim().length > 0;

    return (
      <div className="space-y-6">
        <h2
          className="text-[var(--color-text-primary)] text-xl text-center"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          {content.title}
        </h2>
        <div className="flex justify-center">
          <LeafDrawV2 />
        </div>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.body}
        </p>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.bodySecondary}
        </p>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          {content.bodyTertiary}
        </p>

        {/* Final intention display (if written) */}
        {hasIntention && (
          <div className="py-4 px-4 border border-[var(--accent)] bg-[var(--accent-bg)] text-left">
            <p
              className="text-[var(--color-text-primary)] text-sm italic leading-relaxed"
              style={{ textTransform: 'none' }}
            >
              &ldquo;{intentionText.trim()}&rdquo;
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep.type) {
      case 'welcome': return renderWelcomeStep();
      case 'text': return renderTextStep(currentStep);
      case 'meditationOffer': return renderMeditationOfferStep(currentStep);
      case 'selection': return renderSelectionStep(currentStep);
      case 'writingWarmup': return renderWritingWarmupStep(currentStep);
      case 'intention': return renderIntentionStep(currentStep);
      case 'reflection': return renderReflectionStep(currentStep);
      case 'closing': return renderClosingStep(currentStep);
      default: return null;
    }
  };

  // ── Control bar configuration ──

  const getShowBack = () => {
    if (currentStepIndex === 0) return false;
    if (isMoonStep) return false;
    // During meditation listen mode — back restarts the meditation
    if (inMeditation && playback.hasStarted && !playback.isComplete) return true;
    return true;
  };

  const getPrimaryConfig = () => {
    // Meditation sub-flow — playback controls. Hide the primary button during
    // every transition stage (idle-leaving / preparing / preparing-leaving)
    // so the user doesn't briefly see a stale "Begin" or "Pause" mid-fade.
    if (inMeditation) {
      if (playback.transitionStage === 'idle') {
        return { label: 'Begin', onClick: handleBeginMeditation };
      }
      if (playback.transitionStage !== 'active') {
        return null;
      }
      return playback.getPrimaryButton();
    }

    // Meditation offer page — no primary (inline buttons)
    if (currentStep.type === 'meditationOffer') {
      return null;
    }

    // Moon transition — no controls
    if (isMoonStep) return null;

    // Last step — Complete
    if (isLastStep) return { label: 'Complete', onClick: handlePrimary };

    // Default — Continue
    return { label: 'Continue', onClick: handlePrimary };
  };

  const getSkipConfig = () => {
    if (isLastStep) return false;
    if (isMoonStep) return false;
    // During meditation listen mode — skip targets the meditation
    if (inMeditation && playback.hasStarted) return true;
    return true;
  };

  const getSkipHandler = () => {
    if (inMeditation && playback.hasStarted) {
      return playback.handleSkip;
    }
    return handleModuleSkip;
  };

  const getSkipMessage = () => {
    if (inMeditation && playback.hasStarted) {
      return 'Skip this meditation?';
    }
    return 'Exit intention setting?';
  };

  const getBackConfirmMessage = () => {
    if (currentStepIndex === 0) return 'Exit intention setting? Your progress won\'t be saved.';
    if (inMeditation && playback.hasStarted) return 'Restart this meditation from the beginning?';
    return null;
  };

  const getLeftSlot = () => {
    if (inMeditation && playback.transitionStage === 'active' && !playback.isComplete) {
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
    if (inMeditation && playback.transitionStage === 'active' && !playback.isComplete) {
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

  // ── Render ──

  // Persistent moon: visible during moon transition and intention steps
  const showPersistentMoon = isMoonStep || currentStep?.type === 'intention';
  const moonOpacity = (() => {
    if (currentStep?.type === 'intention') return 1; // Always visible on intention page
    if (isMoonStep) {
      return (moonPhase === 'fading-in' || moonPhase === 'visible') ? 1 : 0;
    }
    return 0;
  })();

  return (
    <>
      <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
        {/* Persistent moon area — title + moon shared across moon transition & intention page */}
        {showPersistentMoon && (
          <div className={`pt-2 transition-opacity duration-[400ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Title — invisible during moon transition (reserves space), fades in on intention page */}
            <h2
              className="text-[var(--color-text-primary)] text-xl text-center transition-opacity duration-[600ms]"
              style={{
                fontFamily: "'DM Serif Text', serif",
                textTransform: 'none',
                opacity: currentStep?.type === 'intention' ? 1 : 0,
              }}
            >
              My Intention
            </h2>

            {/* Moon animation — fades in during transition, stays visible on intention page */}
            <div
              className="flex justify-center py-4 transition-opacity duration-[800ms]"
              style={{ opacity: moonOpacity }}
            >
              <AsciiMoon />
            </div>
          </div>
        )}

        {/* Step content — inside fade container, excluded during moon transition */}
        <div className={`${showPersistentMoon ? '' : 'pt-2'} transition-opacity duration-[400ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          {!isMoonStep && (
            <div key={currentStepIndex} className="animate-fadeIn">
              {renderStepContent()}
            </div>
          )}
        </div>
      </ModuleLayout>

      {!isMoonStep && (
        <ModuleControlBar
          phase={isLastStep ? 'completed' : 'active'}
          primary={getPrimaryConfig()}
          showBack={getShowBack()}
          onBack={handleBack}
          backConfirmMessage={getBackConfirmMessage()}
          showSkip={getSkipConfig()}
          onSkip={getSkipHandler()}
          skipConfirmMessage={getSkipMessage()}
          leftSlot={getLeftSlot()}
          rightSlot={getRightSlot()}
        />
      )}

      {/* Transcript modal for meditation */}
      <TranscriptModal
        isOpen={showTranscript}
        closing={transcriptClosing}
        onClose={handleCloseTranscript}
        title={meditation?.title || 'Basic Grounding'}
        prompts={meditation?.prompts || []}
      />
    </>
  );
}

/**
 * PendulationModule Component
 *
 * A Somatic Experiencing (Peter Levine) guided practice with branching audio:
 *
 * Phases:
 * 1. idle — module overview + Begin button
 * 2. intro — 6 pre-education screens (step-through)
 * 3. meditation — Section A (core practice, ~21 min)
 * 4. checkpoint-1 — 5-option route: B, C, or D
 * 5. meditation — Section B, C, or D (branching)
 * 6. checkpoint-2 — 4-option route: D, C, or B-Ground (after B only)
 * 7. meditation — auto-advance sections
 * 8. meditation — Section D (always final audio section)
 * 9. debrief — adaptive reflection (5–17 screens based on path)
 * 10. closing — AsciiDiamond + attribution + Complete
 *
 * Key innovation: MeditationSection sub-component with key={sectionKey}
 * forces useMeditationPlayback remount per section — old blob URL revoked
 * on unmount, fresh hook instance on mount.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { pendulationMeditation } from '../../../content/meditations/pendulation';
import { generateTimedSequence } from '../../../content/meditations';
import {
  INTRO_SCREENS,
  SENSATION_VOCABULARY,
  CHECKPOINT_1_OPTIONS,
  CHECKPOINT_2_OPTIONS,
  DEBRIEF_CORE,
  DEBRIEF_FIGHT_FLIGHT,
  DEBRIEF_FREEZE,
  DEBRIEF_CLOSING,
  CLOSING_CONTENT,
} from '../../../content/modules/pendulationContent';
import { useMeditationPlayback } from '../../../hooks/useMeditationPlayback';
import { useTranscriptModal } from '../../../hooks/useTranscriptModal';
import { useJournalStore } from '../../../stores/useJournalStore';
import { useSessionStore } from '../../../stores/useSessionStore';

// Shared UI
import ModuleLayout, { IdleScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar, { VolumeButton, SlotButton } from '../capabilities/ModuleControlBar';
import ModuleProgressBar from '../capabilities/ModuleProgressBar';
import AsciiMoon from '../capabilities/animations/AsciiMoon';
import AsciiDiamond from '../capabilities/animations/AsciiDiamond';
import TranscriptModal, { TranscriptIcon } from '../capabilities/TranscriptModal';

// ─── Constants ──────────────────────────────────────────────────────────────

const FADE_MS = 400;
const SENSATION_CYCLE_MS = 12000;

// Prompt ID prefixes during which sensation vocabulary words appear (Section A only)
const SENSATION_PROMPT_PREFIXES = ['a-track', 'a-activate', 'a-pend'];

// ─── MeditationSection ─────────────────────────────────────────────────────
//
// Mounted with key={sectionKey} — changing key forces unmount/remount,
// revoking old blob URLs and creating a fresh useMeditationPlayback instance.

function MeditationSection({
  sectionKey,
  moduleInstanceId,
  onSectionComplete,
  onModuleSkip,
  onTimerUpdate,
}) {
  const meditation = pendulationMeditation;
  const section = meditation.sections[sectionKey];

  const { showTranscript, transcriptClosing, handleOpenTranscript, handleCloseTranscript } =
    useTranscriptModal();

  // Sensation word cycling state (Section A only)
  const [sensationCategory, setSensationCategory] = useState(0);
  const sensationCategories = useMemo(() => Object.keys(SENSATION_VOCABULARY), []);

  // Generate timed sequence for this section
  const [timedSequence, totalDuration] = useMemo(() => {
    const sequence = generateTimedSequence(section.prompts, 1.0, {
      speakingRate: meditation.speakingRate || 95,
      audioConfig: meditation.audio,
      meditationId: meditation.id,
    });
    const total = sequence.length > 0 ? sequence[sequence.length - 1].endTime : 0;
    return [sequence, total];
  }, [section, meditation]);

  // Opening gong only on first section (A), closing gong only on last section (D)
  const composerOptions = useMemo(() => ({
    skipOpeningGong: sectionKey !== 'a',
    skipClosingGong: sectionKey !== 'd',
  }), [sectionKey]);

  // Playback hook — onComplete/onSkip both advance to next phase
  const playback = useMeditationPlayback({
    meditationId: meditation.id,
    moduleInstanceId,
    timedSequence,
    totalDuration,
    onComplete: onSectionComplete,
    onSkip: onSectionComplete,
    onTimerUpdate,
    composerOptions,
  });

  // Auto-start on mount (Strict Mode guard)
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      playback.handleStart();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sensation word cycling (Section A only, ~12s per category)
  useEffect(() => {
    if (sectionKey !== 'a') return;
    const interval = setInterval(() => {
      setSensationCategory((prev) => (prev + 1) % sensationCategories.length);
    }, SENSATION_CYCLE_MS);
    return () => clearInterval(interval);
  }, [sectionKey, sensationCategories.length]);

  // Show sensation words only during specific prompt phases of Section A
  const showSensationWords =
    sectionKey === 'a' &&
    playback.currentPrompt?.id &&
    SENSATION_PROMPT_PREFIXES.some((prefix) => playback.currentPrompt.id.startsWith(prefix));

  const currentSensationWords = showSensationWords
    ? SENSATION_VOCABULARY[sensationCategories[sensationCategory]]
    : null;

  // ─── Loading state ─────────────────────────────────────────────────

  if (playback.isLoading) {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <div className="text-center animate-fadeIn">
            <p className="text-[var(--color-text-tertiary)] text-sm uppercase tracking-wider">
              Preparing meditation...
            </p>
          </div>
        </ModuleLayout>
        <ModuleControlBar
          phase="idle"
          primary={{ label: 'Loading...', onClick: () => {}, disabled: true }}
          showBack={false}
          showSkip={true}
          onSkip={onModuleSkip}
          skipConfirmMessage="Skip this module?"
        />
      </>
    );
  }

  // ─── Active playback ──────────────────────────────────────────────

  return (
    <>
      <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
        <div
          className="flex flex-col items-center text-center w-full px-4 animate-fadeIn"
          style={{
            alignSelf: 'stretch',
            minHeight: 'calc(100vh - var(--header-plus-status) - var(--bottom-chrome) - 1rem)',
          }}
        >
          {/* Section label */}
          <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider mb-1">
            {section.label}
          </p>

          <h2
            className="text-xl font-light mb-6"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            {meditation.title}
          </h2>

          <AsciiMoon />

          {/* Paused indicator */}
          <div className="h-5 flex items-center justify-center mt-3">
            {!playback.isPlaying && !playback.isComplete && (
              <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider animate-pulse">
                Paused
              </p>
            )}
          </div>

          {/* Prompt text */}
          <p
            className={`mt-1 px-4 text-[var(--color-text-secondary)] text-sm leading-relaxed transition-opacity duration-300 ${
              playback.promptPhase === 'visible' || playback.promptPhase === 'fading-in'
                ? 'opacity-100'
                : 'opacity-0'
            }`}
          >
            {playback.currentPrompt?.text || ''}
          </p>

          {/* Sensation vocabulary cycling (Section A tracking/pendulation phases) */}
          {showSensationWords && currentSensationWords && (
            <div className="mt-6 flex flex-wrap justify-center gap-x-3 gap-y-1 max-w-xs mx-auto animate-fadeIn">
              {currentSensationWords.map((word) => (
                <span
                  key={word}
                  className="text-[var(--color-text-tertiary)] text-xs italic"
                >
                  {word}
                </span>
              ))}
            </div>
          )}
        </div>
      </ModuleLayout>

      <ModuleControlBar
        phase="active"
        primary={playback.getPrimaryButton()}
        showBack={false}
        showSkip={true}
        onSkip={playback.handleSkip}
        skipConfirmMessage="Skip this section?"
        showSeekControls={!playback.isComplete && !playback.isLoading}
        onSeekBack={() => playback.handleSeekRelative(-10)}
        onSeekForward={() => playback.handleSeekRelative(10)}
        leftSlot={
          <VolumeButton
            volume={playback.audio.volume}
            onVolumeChange={playback.audio.setVolume}
          />
        }
        rightSlot={
          <SlotButton
            icon={<TranscriptIcon />}
            label="View transcript"
            onClick={handleOpenTranscript}
          />
        }
      />

      <TranscriptModal
        isOpen={showTranscript}
        closing={transcriptClosing}
        onClose={handleCloseTranscript}
        title={`${meditation.title} — ${section.label}`}
        prompts={section.prompts}
      />
    </>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function PendulationModule({ module, onComplete, onSkip, onTimerUpdate }) {
  // ─── Store integration ──────────────────────────────────────────────

  const addEntry = useJournalStore((state) => state.addEntry);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;
  const updatePendulationCapture = useSessionStore((s) => s.updatePendulationCapture);

  // ─── Phase state ────────────────────────────────────────────────────

  const [phase, setPhase] = useState('idle');
  const [activeSectionKey, setActiveSectionKey] = useState('a');
  const [sectionsCompleted, setSectionsCompleted] = useState([]);

  // Intro state
  const [introStep, setIntroStep] = useState(0);
  const [isIntroVisible, setIsIntroVisible] = useState(true);

  // Checkpoint state
  const [checkpoint1Selection, setCheckpoint1Selection] = useState(null);
  const [checkpoint2Selection, setCheckpoint2Selection] = useState(null);
  const [isCheckpointVisible, setIsCheckpointVisible] = useState(true);

  // Debrief state
  const [debriefStep, setDebriefStep] = useState(0);
  const [isDebriefVisible, setIsDebriefVisible] = useState(true);
  const [debriefData, setDebriefData] = useState({
    // Journal fields
    islandOfSafety: '',
    pendulationExperience: '',
    beforeAfter: '',
    survivalMovement: '',
    freezeExperience: '',
    freezeReflection: '',
    // Choice/multiSelect fields
    completionSignals: [],
    dischargeCompletion: null,
    thawExperience: null,
  });

  // Closing state
  const [isClosingVisible, setIsClosingVisible] = useState(false);

  // Idle leave animation
  const [isLeaving, setIsLeaving] = useState(false);

  // ─── Computed values ────────────────────────────────────────────────

  const isMeditationPhase = phase === 'meditation';
  const isDeepPath = sectionsCompleted.includes('b') || sectionsCompleted.includes('c');

  // Assemble debrief screens based on completed sections
  const debriefScreens = useMemo(() => {
    const screens = [...DEBRIEF_CORE];
    if (sectionsCompleted.includes('b')) screens.push(...DEBRIEF_FIGHT_FLIGHT);
    if (sectionsCompleted.includes('c')) screens.push(...DEBRIEF_FREEZE);
    screens.push(...DEBRIEF_CLOSING);
    return screens;
  }, [sectionsCompleted]);

  // ─── Timer hiding for non-meditation phases ─────────────────────────

  useEffect(() => {
    if (!isMeditationPhase) {
      onTimerUpdate?.({ showTimer: false, progress: 0, elapsed: 0, total: 0, isPaused: false });
    }
  }, [phase, isMeditationPhase, onTimerUpdate]);

  // ─── idle → intro ──────────────────────────────────────────────────

  const handleBegin = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      setPhase('intro');
      setIntroStep(0);
      setIsIntroVisible(true);
      setIsLeaving(false);
    }, FADE_MS);
  }, []);

  // ─── Intro navigation ─────────────────────────────────────────────

  const handleIntroAdvance = useCallback(() => {
    if (introStep < INTRO_SCREENS.length - 1) {
      setIsIntroVisible(false);
      setTimeout(() => {
        setIntroStep((prev) => prev + 1);
        setIsIntroVisible(true);
      }, FADE_MS);
    } else {
      // Last intro screen → start meditation Section A
      setIsIntroVisible(false);
      setTimeout(() => {
        setPhase('meditation');
        setActiveSectionKey('a');
      }, FADE_MS);
    }
  }, [introStep]);

  const handleIntroBack = useCallback(() => {
    if (introStep > 0) {
      setIsIntroVisible(false);
      setTimeout(() => {
        setIntroStep((prev) => prev - 1);
        setIsIntroVisible(true);
      }, FADE_MS);
    }
  }, [introStep]);

  // ─── Section complete handler ─────────────────────────────────────

  const handleSectionComplete = useCallback(() => {
    const section = activeSectionKey;

    // Track completed section
    const newCompleted = [...sectionsCompleted, section];
    setSectionsCompleted(newCompleted);
    updatePendulationCapture('sectionsCompleted', newCompleted);

    switch (section) {
      case 'a':
        setPhase('checkpoint-1');
        setIsCheckpointVisible(true);
        break;
      case 'b':
        setPhase('checkpoint-2');
        setIsCheckpointVisible(true);
        break;
      case 'bGround':
        // Auto-advance to D (key change forces MeditationSection remount)
        setActiveSectionKey('d');
        break;
      case 'c':
        // Auto-advance to D
        setActiveSectionKey('d');
        break;
      case 'd':
        setPhase('debrief');
        setDebriefStep(0);
        setIsDebriefVisible(true);
        break;
      default:
        break;
    }
  }, [activeSectionKey, sectionsCompleted, updatePendulationCapture]);

  // ─── Checkpoint handlers ──────────────────────────────────────────

  const handleCheckpoint1Continue = useCallback(() => {
    if (!checkpoint1Selection) return;

    const option = CHECKPOINT_1_OPTIONS.find((o) => o.id === checkpoint1Selection);
    const route = option?.route || 'd';

    updatePendulationCapture('checkpoint1Response', checkpoint1Selection);

    setIsCheckpointVisible(false);
    setTimeout(() => {
      setActiveSectionKey(route);
      setPhase('meditation');
    }, FADE_MS);
  }, [checkpoint1Selection, updatePendulationCapture]);

  const handleCheckpoint2Continue = useCallback(() => {
    if (!checkpoint2Selection) return;

    const option = CHECKPOINT_2_OPTIONS.find((o) => o.id === checkpoint2Selection);
    const route = option?.route || 'd';

    updatePendulationCapture('checkpoint2Response', checkpoint2Selection);

    setIsCheckpointVisible(false);
    setTimeout(() => {
      setActiveSectionKey(route);
      setPhase('meditation');
    }, FADE_MS);
  }, [checkpoint2Selection, updatePendulationCapture]);

  // ─── Debrief navigation ───────────────────────────────────────────

  const handleDebriefAdvance = useCallback(() => {
    if (debriefStep < debriefScreens.length - 1) {
      setIsDebriefVisible(false);
      setTimeout(() => {
        setDebriefStep((prev) => prev + 1);
        setIsDebriefVisible(true);
      }, FADE_MS);
    } else {
      // Last debrief screen → closing
      setIsDebriefVisible(false);
      setTimeout(() => {
        setPhase('closing');
        setIsClosingVisible(true);
      }, FADE_MS);
    }
  }, [debriefStep, debriefScreens.length]);

  const handleDebriefBack = useCallback(() => {
    if (debriefStep > 0) {
      setIsDebriefVisible(false);
      setTimeout(() => {
        setDebriefStep((prev) => prev - 1);
        setIsDebriefVisible(true);
      }, FADE_MS);
    }
  }, [debriefStep]);

  // ─── Back from closing ────────────────────────────────────────────

  const handleBackToDebrief = useCallback(() => {
    setIsClosingVisible(false);
    setTimeout(() => {
      setPhase('debrief');
      setDebriefStep(debriefScreens.length - 1);
      setIsDebriefVisible(true);
    }, FADE_MS);
  }, [debriefScreens.length]);

  // ─── Journal save ─────────────────────────────────────────────────

  const saveJournalEntries = useCallback(() => {
    const journalFields = [
      { field: 'islandOfSafety', label: 'Your Island of Safety' },
      { field: 'pendulationExperience', label: 'The Pendulation' },
      { field: 'survivalMovement', label: 'The Movement' },
      { field: 'freezeExperience', label: 'The Stillness' },
      { field: 'freezeReflection', label: 'Coming Back' },
      { field: 'beforeAfter', label: 'Before and After' },
    ];

    const entries = journalFields
      .filter(({ field }) => debriefData[field]?.trim())
      .map(({ field, label }) => `${label}\n${debriefData[field].trim()}`);

    if (entries.length === 0) return;

    const content = `PENDULATION\n\n${entries.join('\n\n')}`;

    addEntry({
      content,
      source: 'session',
      sessionId,
      moduleTitle: 'Pendulation',
    });
  }, [debriefData, addEntry, sessionId]);

  // ─── Save captures to store ───────────────────────────────────────

  const saveCapturesToStore = useCallback(() => {
    if (debriefData.completionSignals.length > 0) {
      updatePendulationCapture('completionSignals', debriefData.completionSignals);
    }
    if (debriefData.dischargeCompletion) {
      updatePendulationCapture('dischargeCompletion', debriefData.dischargeCompletion);
    }
    if (debriefData.thawExperience) {
      updatePendulationCapture('thawExperience', debriefData.thawExperience);
    }
    updatePendulationCapture('completedAt', Date.now());
  }, [debriefData, updatePendulationCapture]);

  // ─── Closing complete ─────────────────────────────────────────────

  const handleClosingComplete = useCallback(() => {
    saveJournalEntries();
    saveCapturesToStore();

    setIsClosingVisible(false);
    setTimeout(() => {
      onComplete();
    }, FADE_MS);
  }, [saveJournalEntries, saveCapturesToStore, onComplete]);

  // ─── Module-level skip ────────────────────────────────────────────

  const handleModuleSkip = useCallback(() => {
    saveJournalEntries();
    saveCapturesToStore();
    onSkip();
  }, [saveJournalEntries, saveCapturesToStore, onSkip]);

  // ─── Debrief continue disabled state ──────────────────────────────

  const isDebriefContinueDisabled = useMemo(() => {
    if (debriefStep >= debriefScreens.length) return false;
    const screen = debriefScreens[debriefStep];
    if (screen.type === 'choice' && !debriefData[screen.captureField]) return true;
    return false;
  }, [debriefStep, debriefScreens, debriefData]);

  // ═══════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════

  // ─── idle ──────────────────────────────────────────────────────────

  if (phase === 'idle') {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <div className={`text-center ${isLeaving ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
            <IdleScreen
              title={pendulationMeditation.title}
              description={pendulationMeditation.description}
            />
          </div>
        </ModuleLayout>
        <ModuleControlBar
          phase="idle"
          primary={{ label: 'Begin', onClick: handleBegin }}
          showBack={false}
          showSkip={true}
          onSkip={onSkip}
          skipConfirmMessage="Skip this module?"
        />
      </>
    );
  }

  // ─── intro (6 pre-education screens) ──────────────────────────────

  if (phase === 'intro') {
    const screen = INTRO_SCREENS[introStep];
    const isLast = introStep === INTRO_SCREENS.length - 1;
    const progress = ((introStep + 1) / INTRO_SCREENS.length) * 100;

    return (
      <>
        <ModuleProgressBar progress={progress} visible={true} />

        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div
            className={`pt-2 transition-opacity duration-[400ms] ${
              isIntroVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Label */}
            <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider mb-1 text-center">
              {screen.label}
            </p>

            {/* Title */}
            <h2
              className="text-xl font-light mb-4 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {screen.title}
            </h2>

            {/* Animation */}
            {screen.showAnimation && (
              <div className="flex justify-center mb-4">
                <AsciiMoon />
              </div>
            )}

            {/* Body */}
            <div className="space-y-4">
              {screen.body.map((para, i) => (
                <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                  {para}
                </p>
              ))}
            </div>

            {/* Sensation vocabulary grid (screen 3) */}
            {screen.showSensationGrid && (
              <div className="mt-6 space-y-4">
                {Object.entries(SENSATION_VOCABULARY).map(([category, words]) => (
                  <div key={category}>
                    <p className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider mb-1 capitalize">
                      {category}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {words.map((word) => (
                        <span key={word} className="text-[var(--color-text-tertiary)] text-xs">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            {screen.footer && (
              <p className="text-[var(--color-text-tertiary)] text-xs mt-4 leading-relaxed">
                {screen.footer}
              </p>
            )}
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{
            label: isLast ? 'Begin Meditation' : 'Continue',
            onClick: handleIntroAdvance,
          }}
          showBack={introStep > 0}
          onBack={handleIntroBack}
          showSkip={true}
          onSkip={onSkip}
          skipConfirmMessage="Skip this module?"
        />
      </>
    );
  }

  // ─── meditation (delegates to MeditationSection) ──────────────────

  if (phase === 'meditation') {
    return (
      <MeditationSection
        key={activeSectionKey}
        sectionKey={activeSectionKey}
        moduleInstanceId={module.instanceId}
        onSectionComplete={handleSectionComplete}
        onModuleSkip={handleModuleSkip}
        onTimerUpdate={onTimerUpdate}
      />
    );
  }

  // ─── checkpoint-1 ─────────────────────────────────────────────────

  if (phase === 'checkpoint-1') {
    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div
            className={`pt-6 transition-opacity duration-[400ms] ${
              isCheckpointVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <h2
              className="text-xl font-light mb-2 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              How are you feeling right now?
            </h2>

            <p className="text-[var(--color-text-secondary)] text-xs text-center mb-6">
              There&apos;s no right answer. Your body will guide what comes next.
            </p>

            <div className="space-y-2">
              {CHECKPOINT_1_OPTIONS.map((option) => {
                const isSelected = checkpoint1Selection === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setCheckpoint1Selection(option.id)}
                    className={`w-full text-left px-4 py-3 border transition-colors duration-150 ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent-bg)]'
                        : 'border-[var(--color-border)] bg-transparent hover:border-[var(--color-text-tertiary)]'
                    }`}
                  >
                    <span className="text-[var(--color-text-primary)] text-sm">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{
            label: 'Continue',
            onClick: handleCheckpoint1Continue,
            disabled: !checkpoint1Selection,
          }}
          showBack={false}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── checkpoint-2 ─────────────────────────────────────────────────

  if (phase === 'checkpoint-2') {
    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div
            className={`pt-6 transition-opacity duration-[400ms] ${
              isCheckpointVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <h2
              className="text-xl font-light mb-2 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              How are you feeling now?
            </h2>

            <p className="text-[var(--color-text-secondary)] text-xs text-center mb-6">
              Take a moment to check in with your body.
            </p>

            <div className="space-y-2">
              {CHECKPOINT_2_OPTIONS.map((option) => {
                const isSelected = checkpoint2Selection === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setCheckpoint2Selection(option.id)}
                    className={`w-full text-left px-4 py-3 border transition-colors duration-150 ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent-bg)]'
                        : 'border-[var(--color-border)] bg-transparent hover:border-[var(--color-text-tertiary)]'
                    }`}
                  >
                    <span className="text-[var(--color-text-primary)] text-sm">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{
            label: 'Continue',
            onClick: handleCheckpoint2Continue,
            disabled: !checkpoint2Selection,
          }}
          showBack={false}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── debrief (adaptive multi-screen reflection) ───────────────────

  if (phase === 'debrief') {
    const screen = debriefScreens[debriefStep];
    const progress = ((debriefStep + 1) / debriefScreens.length) * 100;
    const hasTextArea = screen.type === 'journal' || screen.hasJournal;

    return (
      <>
        <ModuleProgressBar progress={progress} visible={true} />

        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div
            className={`pt-2 transition-opacity duration-[400ms] ${
              isDebriefVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ paddingBottom: hasTextArea ? '8rem' : undefined }}
          >
            {/* Label */}
            {screen.label && (
              <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider mb-1 text-center">
                {screen.label}
              </p>
            )}

            {/* Title */}
            <h2
              className="text-xl font-light mb-4 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {screen.title}
            </h2>

            {/* Animation */}
            {screen.showAnimation && (
              <div className="flex justify-center mb-4">
                <AsciiMoon />
              </div>
            )}

            {/* Body paragraphs */}
            {screen.body && (
              <div className="space-y-4">
                {screen.body.map((para, i) => (
                  <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            )}

            {/* ─ Journal ─ */}
            {screen.type === 'journal' && (
              <div className="mt-4">
                {screen.prompt && (
                  <h3
                    className="text-base font-light mb-3 text-center text-[var(--color-text-primary)]"
                    style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                  >
                    {screen.prompt}
                  </h3>
                )}
                <textarea
                  value={debriefData[screen.captureField] || ''}
                  onChange={(e) =>
                    setDebriefData((prev) => ({
                      ...prev,
                      [screen.captureField]: e.target.value,
                    }))
                  }
                  placeholder={screen.placeholder}
                  rows={4}
                  className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                    focus:outline-none focus:border-[var(--accent)]
                    text-[var(--color-text-primary)] text-sm leading-relaxed
                    placeholder:text-[var(--color-text-tertiary)] resize-none"
                />
              </div>
            )}

            {/* ─ Multi-select ─ */}
            {screen.type === 'multiSelect' && (
              <div className="space-y-2 mt-4">
                {screen.options.map((option) => {
                  const selected = (debriefData[screen.captureField] || []).includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setDebriefData((prev) => {
                          const current = prev[screen.captureField] || [];
                          const next = selected
                            ? current.filter((id) => id !== option.id)
                            : [...current, option.id];
                          return { ...prev, [screen.captureField]: next };
                        })
                      }
                      className={`w-full text-left px-4 py-3 border transition-colors duration-150 ${
                        selected
                          ? 'border-[var(--accent)] bg-[var(--accent-bg)]'
                          : 'border-[var(--color-border)] bg-transparent hover:border-[var(--color-text-tertiary)]'
                      }`}
                    >
                      <span className="text-[var(--color-text-primary)] text-sm">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ─ Single choice ─ */}
            {screen.type === 'choice' && (
              <>
                {screen.question && (
                  <p className="text-[var(--color-text-secondary)] text-sm mt-4 mb-2">
                    {screen.question}
                  </p>
                )}
                <div className="space-y-2 mt-2">
                  {screen.options.map((option) => {
                    const selected = debriefData[screen.captureField] === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          setDebriefData((prev) => ({
                            ...prev,
                            [screen.captureField]: option.id,
                          }))
                        }
                        className={`w-full text-left px-4 py-3 border transition-colors duration-150 ${
                          selected
                            ? 'border-[var(--accent)] bg-[var(--accent-bg)]'
                            : 'border-[var(--color-border)] bg-transparent hover:border-[var(--color-text-tertiary)]'
                        }`}
                      >
                        <span className="text-[var(--color-text-primary)] text-sm">
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Optional journal below choice (hybrid screen) */}
                {screen.hasJournal && (
                  <div className="mt-6">
                    <h3
                      className="text-base font-light mb-3 text-center text-[var(--color-text-primary)]"
                      style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                    >
                      {screen.journalPrompt}
                    </h3>
                    <textarea
                      value={debriefData[screen.journalCaptureField] || ''}
                      onChange={(e) =>
                        setDebriefData((prev) => ({
                          ...prev,
                          [screen.journalCaptureField]: e.target.value,
                        }))
                      }
                      placeholder={screen.journalPlaceholder}
                      rows={3}
                      className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                        focus:outline-none focus:border-[var(--accent)]
                        text-[var(--color-text-primary)] text-sm leading-relaxed
                        placeholder:text-[var(--color-text-tertiary)] resize-none"
                    />
                  </div>
                )}
              </>
            )}

            {/* Footer */}
            {screen.footer && (
              <p className="text-[var(--color-text-tertiary)] text-xs mt-4 leading-relaxed">
                {screen.footer}
              </p>
            )}
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{
            label: 'Continue',
            onClick: handleDebriefAdvance,
            disabled: isDebriefContinueDisabled,
          }}
          showBack={debriefStep > 0}
          onBack={handleDebriefBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining reflection?"
        />
      </>
    );
  }

  // ─── closing ──────────────────────────────────────────────────────

  if (phase === 'closing') {
    const footerText = isDeepPath ? CLOSING_CONTENT.footer.deep : CLOSING_CONTENT.footer.default;

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div
            className={`pt-6 transition-opacity duration-[400ms] ${
              isClosingVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <h2 className="text-xl font-light mb-6 text-center text-[var(--color-text-primary)]">
              {CLOSING_CONTENT.title}
            </h2>

            <div className="flex justify-center mb-6">
              <AsciiDiamond />
            </div>

            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed text-center">
              {CLOSING_CONTENT.body}
            </p>

            <div className="flex justify-center my-4">
              <div className="circle-spacer" />
            </div>

            <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed">
              {footerText}
            </p>

            {/* Attribution */}
            <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed mt-6">
              {CLOSING_CONTENT.attribution}
            </p>

            {/* Resources */}
            {CLOSING_CONTENT.resources.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[var(--color-border)] space-y-3">
                <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider">
                  Further Reading
                </p>
                {CLOSING_CONTENT.resources.map((resource, i) => (
                  <div key={i} className="pl-3 border-l border-[var(--color-border)]">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-text-primary)] text-xs underline hover:opacity-70 transition-opacity italic leading-relaxed"
                    >
                      {resource.text}
                    </a>
                    <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed mt-0.5">
                      {resource.note}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="completed"
          primary={{ label: 'Complete', onClick: handleClosingComplete }}
          showBack={true}
          onBack={handleBackToDebrief}
          showSkip={false}
        />
      </>
    );
  }

  // Fallback (should not reach)
  return null;
}

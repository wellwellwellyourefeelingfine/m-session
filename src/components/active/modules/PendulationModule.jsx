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
import { generateTimedSequence, resolveEffectiveVoiceId } from '../../../content/meditations';
import {
  INTRO_SCREENS,
  ACCENT_TERMS,
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
import { useAppStore } from '../../../stores/useAppStore';

// Shared UI
import ModuleLayout, { VoicePill, DurationPill } from '../capabilities/ModuleLayout';
import MeditationLoadingScreen from '../capabilities/MeditationLoadingScreen';
import ModuleControlBar, { VolumeButton, SlotButton } from '../capabilities/ModuleControlBar';
import useProgressReporter from '../../../hooks/useProgressReporter';
import MorphingShapes from '../capabilities/animations/MorphingShapes';
import AsciiMoon from '../capabilities/animations/AsciiMoon';
import AsciiDiamond from '../capabilities/animations/AsciiDiamond';
import TranscriptModal, { TranscriptIcon } from '../capabilities/TranscriptModal';

// ─── Constants ──────────────────────────────────────────────────────────────

const FADE_MS = 400;

// ─── Accent Term Renderer ──────────────────────────────────────────────────
//
// Scans body paragraphs for {key} placeholders and renders them in accent color.
// Same algorithm as FeltSenseModule/TheCycleModule renderContentLines.

function renderBodyWithAccents(paragraphs, textSize = 'text-sm') {
  return paragraphs.map((para, i) => {
    let hasAccent = false;
    for (const key of Object.keys(ACCENT_TERMS)) {
      if (para.includes(`{${key}}`)) { hasAccent = true; break; }
    }

    if (!hasAccent) {
      return (
        <p key={i} className={`text-[var(--color-text-primary)] ${textSize} leading-relaxed`}>
          {para}
        </p>
      );
    }

    const parts = [];
    let remaining = para;
    let partIndex = 0;

    while (remaining.length > 0) {
      let earliest = -1;
      let earliestKey = null;
      for (const key of Object.keys(ACCENT_TERMS)) {
        const idx = remaining.indexOf(`{${key}}`);
        if (idx !== -1 && (earliest === -1 || idx < earliest)) {
          earliest = idx;
          earliestKey = key;
        }
      }

      if (earliest === -1) {
        parts.push(<span key={partIndex++}>{remaining}</span>);
        break;
      }

      if (earliest > 0) {
        parts.push(<span key={partIndex++}>{remaining.substring(0, earliest)}</span>);
      }

      parts.push(
        <span key={partIndex++} className="text-[var(--accent)]">
          {ACCENT_TERMS[earliestKey]}
        </span>
      );

      remaining = remaining.substring(earliest + earliestKey.length + 2);
    }

    return (
      <p key={i} className={`text-[var(--color-text-primary)] ${textSize} leading-relaxed`}>
        {parts}
      </p>
    );
  });
}

// ─── MeditationSection ─────────────────────────────────────────────────────
//
// Mounted with key={sectionKey} — changing key forces unmount/remount,
// revoking old blob URLs and creating a fresh useMeditationPlayback instance.

function MeditationSection({
  sectionKey,
  voiceId,
  moduleInstanceId,
  onSectionComplete,
  onModuleSkip,
  onProgressUpdate,
  onBack,
}) {
  const meditation = pendulationMeditation;
  const section = meditation.sections[sectionKey];

  const { showTranscript, transcriptClosing, handleOpenTranscript, handleCloseTranscript } =
    useTranscriptModal();

  // Generate timed sequence for this section
  const [timedSequence, totalDuration] = useMemo(() => {
    const sequence = generateTimedSequence(section.prompts, 1.0, {
      audioConfig: meditation.audio,
      meditationId: meditation.id,
      voiceId,
    });
    const total = sequence.length > 0 ? sequence[sequence.length - 1].endTime : 0;
    return [sequence, total];
  }, [section, meditation, voiceId]);

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
    onProgressUpdate,
    composerOptions,
  });

  // Auto-start on mount (Strict Mode guard). Uses the multi-phase transition
  // flow so the MeditationLoadingScreen is shown for the standard minimum
  // duration (matches BodyScan, Open Awareness, etc.). idleFadeMs is 0 because
  // the parent already handled the idle fade-out before mounting this section.
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      playback.handleBeginWithTransition({ idleFadeMs: 0 });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Loading state ─────────────────────────────────────────────────
  // transitionStage is 'idle' / 'idle-leaving' / 'preparing' / 'preparing-leaving' / 'active'.
  // Anything before 'active' shows the shared MeditationLoadingScreen; the
  // 'preparing-leaving' stage triggers its fade-out animation.

  if (playback.transitionStage !== 'active') {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <MeditationLoadingScreen
            isLeaving={playback.transitionStage === 'preparing-leaving'}
          />
        </ModuleLayout>
        <ModuleControlBar
          phase="idle"
          primary={{ label: 'Loading...', onClick: () => {}, disabled: true }}
          showBack={!!onBack}
          onBack={onBack}
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
            minHeight: 'var(--meditation-page-min-height)',
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

          <MorphingShapes />

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

        </div>
      </ModuleLayout>

      <ModuleControlBar
        phase="active"
        primary={playback.getPrimaryButton()}
        showBack={!!onBack}
        onBack={onBack}
        backConfirmMessage={
          playback.hasStarted && !playback.isComplete && !playback.isLoading
            ? 'Stop the meditation and go back?'
            : null
        }
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

export default function PendulationModule({ module, onComplete, onSkip, onProgressUpdate }) {
  // ─── Store integration ──────────────────────────────────────────────

  const addEntry = useJournalStore((state) => state.addEntry);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;
  const updatePendulationCapture = useSessionStore((s) => s.updatePendulationCapture);
  const defaultVoiceId = useAppStore((s) => s.preferences?.defaultVoiceId);

  const report = useProgressReporter(onProgressUpdate);

  // ─── Phase state ────────────────────────────────────────────────────

  const [phase, setPhase] = useState('idle');
  const [activeSectionKey, setActiveSectionKey] = useState('a');
  const [sectionsCompleted, setSectionsCompleted] = useState([]);
  const voices = pendulationMeditation.audio?.voices;
  const [selectedVoiceId, setSelectedVoiceId] = useState(() =>
    resolveEffectiveVoiceId(pendulationMeditation.audio, defaultVoiceId)
  );

  // Intro state
  const [introStep, setIntroStep] = useState(0);
  const [isIntroVisible, setIsIntroVisible] = useState(true);

  // Meditation fade state
  const [isMeditationVisible, setIsMeditationVisible] = useState(true);

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
  const [showSources, setShowSources] = useState(false);

  // Idle leave animation
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (phase !== 'idle') return;
    const nextEffective = resolveEffectiveVoiceId(pendulationMeditation.audio, defaultVoiceId);
    if (nextEffective && nextEffective !== selectedVoiceId) {
      setSelectedVoiceId(nextEffective);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- local VoicePill changes should not trigger a reset
  }, [defaultVoiceId, phase]);

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

  // ─── Step-based progress for non-meditation phases ─────────────────

  useEffect(() => {
    if (isMeditationPhase) return; // meditation pushes its own timer progress

    switch (phase) {
      case 'idle':
        report.idle();
        break;
      case 'intro':
        report.step(introStep + 1, INTRO_SCREENS.length);
        break;
      case 'checkpoint-1':
      case 'checkpoint-2':
        report.step(1, 1);
        break;
      case 'debrief':
        report.step(debriefStep + 1, debriefScreens.length);
        break;
      case 'closing':
        report.step(1, 1);
        break;
      default:
        report.idle();
        break;
    }
  }, [phase, isMeditationPhase, introStep, debriefStep, debriefScreens.length, report]);

  // ─── idle → intro ──────────────────────────────────────────────────

  const handleBegin = useCallback(() => {
    useSessionStore.getState().beginModule(module.instanceId);
    setIsLeaving(true);
    setTimeout(() => {
      setPhase('intro');
      setIntroStep(0);
      setIsIntroVisible(true);
      setIsLeaving(false);
    }, FADE_MS);
  }, [module.instanceId]);

  // ─── Intro navigation ─────────────────────────────────────────────

  const handleIntroAdvance = useCallback(() => {
    if (introStep < INTRO_SCREENS.length - 1) {
      setIsIntroVisible(false);
      setTimeout(() => {
        window.scrollTo(0, 0);
        setIntroStep((prev) => prev + 1);
        setIsIntroVisible(true);
      }, FADE_MS);
    } else {
      // Last intro screen → meditation-idle (gives the user a beat to pick
      // voice and confirm duration before composition starts).
      setIsIntroVisible(false);
      setTimeout(() => {
        setPhase('meditation-idle');
      }, FADE_MS);
    }
  }, [introStep]);

  const handleBeginMeditation = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      setPhase('meditation');
      setActiveSectionKey('a');
      setIsLeaving(false);
    }, FADE_MS);
  }, []);

  const handleIntroBack = useCallback(() => {
    if (introStep > 0) {
      setIsIntroVisible(false);
      setTimeout(() => {
        window.scrollTo(0, 0);
        setIntroStep((prev) => prev - 1);
        setIsIntroVisible(true);
      }, FADE_MS);
    } else {
      // First intro step → main idle.
      setIsIntroVisible(false);
      setTimeout(() => {
        setPhase('idle');
        setIsLeaving(false);
        setIsIntroVisible(true);
      }, FADE_MS);
    }
  }, [introStep]);

  // Back from the meditation-idle screen → last intro step.
  const handleMeditationIdleBack = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      setPhase('intro');
      setIntroStep(INTRO_SCREENS.length - 1);
      setIsIntroVisible(true);
      setIsLeaving(false);
    }, FADE_MS);
  }, []);

  // Back from a meditation section's playback → most recent choice screen.
  // The section is mid-playback (NOT in sectionsCompleted yet), so no state
  // reset — just route back. checkpoint2 > checkpoint1 > meditation-idle by
  // recency of user decision.
  const handleSectionBack = useCallback(() => {
    setIsMeditationVisible(false);
    setTimeout(() => {
      if (checkpoint2Selection) {
        setPhase('checkpoint-2');
        setIsCheckpointVisible(true);
      } else if (checkpoint1Selection) {
        setPhase('checkpoint-1');
        setIsCheckpointVisible(true);
      } else {
        setPhase('meditation-idle');
        setIsLeaving(false);
      }
      setIsMeditationVisible(true);
    }, FADE_MS);
  }, [checkpoint1Selection, checkpoint2Selection]);

  // Back from checkpoint-1 → meditation-idle. Section A was completed (in
  // sectionsCompleted); pop it so re-advancing replays cleanly.
  const handleCheckpoint1Back = useCallback(() => {
    setIsCheckpointVisible(false);
    setTimeout(() => {
      setSectionsCompleted([]);
      setPhase('meditation-idle');
      setIsCheckpointVisible(true);
      setIsLeaving(false);
    }, FADE_MS);
  }, []);

  // Back from checkpoint-2 → checkpoint-1. The post-checkpoint-1 section
  // (B) was completed; pop it so the user can re-pick the path.
  const handleCheckpoint2Back = useCallback(() => {
    setIsCheckpointVisible(false);
    setTimeout(() => {
      setSectionsCompleted((prev) => prev.slice(0, -1));
      setPhase('checkpoint-1');
      setIsCheckpointVisible(true);
    }, FADE_MS);
  }, []);

  // ─── Section complete handler ─────────────────────────────────────

  const handleSectionComplete = useCallback(() => {
    const section = activeSectionKey;

    // Track completed section
    const newCompleted = [...sectionsCompleted, section];
    setSectionsCompleted(newCompleted);
    updatePendulationCapture('sectionsCompleted', newCompleted);

    // Fade out meditation before transitioning
    setIsMeditationVisible(false);
    setTimeout(() => {
      window.scrollTo(0, 0);
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
          setActiveSectionKey('d');
          setIsMeditationVisible(true);
          break;
        case 'c':
          setActiveSectionKey('d');
          setIsMeditationVisible(true);
          break;
        case 'd':
          setPhase('debrief');
          setDebriefStep(0);
          setIsDebriefVisible(true);
          break;
        default:
          break;
      }
    }, FADE_MS);
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
      setIsMeditationVisible(true);
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
      setIsMeditationVisible(true);
      setPhase('meditation');
    }, FADE_MS);
  }, [checkpoint2Selection, updatePendulationCapture]);

  // ─── Debrief navigation ───────────────────────────────────────────

  const handleDebriefAdvance = useCallback(() => {
    if (debriefStep < debriefScreens.length - 1) {
      setIsDebriefVisible(false);
      setTimeout(() => {
        window.scrollTo(0, 0);
        setDebriefStep((prev) => prev + 1);
        setIsDebriefVisible(true);
      }, FADE_MS);
    } else {
      // Last debrief screen → closing
      setIsDebriefVisible(false);
      setTimeout(() => {
        window.scrollTo(0, 0);
        setPhase('closing');
        setIsClosingVisible(true);
      }, FADE_MS);
    }
  }, [debriefStep, debriefScreens.length]);

  const handleDebriefBack = useCallback(() => {
    if (debriefStep > 0) {
      setIsDebriefVisible(false);
      setTimeout(() => {
        window.scrollTo(0, 0);
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
    const timestamp = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const journalFields = [
      { field: 'islandOfSafety', label: 'Your Island of Safety' },
      { field: 'pendulationExperience', label: 'The Pendulation' },
      { field: 'survivalMovement', label: 'The Movement' },
      { field: 'freezeExperience', label: 'The Stillness' },
      { field: 'freezeReflection', label: 'Coming Back' },
      { field: 'beforeAfter', label: 'Before and After' },
    ];

    const entries = journalFields
      .map(({ field, label }) => {
        const value = debriefData[field]?.trim();
        return `${label}\n${value || `[no entry — ${timestamp}]`}`;
      });

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
          <div className={`text-center space-y-4 ${isLeaving ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
            <h2
              className="text-2xl text-[var(--color-text-primary)]"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {pendulationMeditation.title}
            </h2>

            <div className="flex justify-center">
              <AsciiMoon />
            </div>

            <p className="tracking-wider text-xs text-[var(--color-text-secondary)] leading-relaxed">
              A guided somatic experiencing practice for working with activation in the nervous system.
            </p>

            <DurationPill display="30 - 50 mins" />
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
    if (!screen) {
      console.warn('PendulationModule: intro phase with out-of-bounds introStep', introStep);
      return null;
    }
    return (
      <>
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
              {renderBodyWithAccents(screen.body)}
            </div>

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
            onClick: handleIntroAdvance,
          }}
          showBack={true}
          onBack={handleIntroBack}
          showSkip={true}
          onSkip={onSkip}
          skipConfirmMessage="Skip this module?"
        />
      </>
    );
  }

  // ─── meditation-idle (voice + duration confirmation before composition) ──

  if (phase === 'meditation-idle') {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <div className={`text-center space-y-4 ${isLeaving ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
            <h2
              className="text-2xl text-[var(--color-text-primary)]"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {pendulationMeditation.title}
            </h2>

            <div className="flex justify-center">
              <AsciiMoon />
            </div>

            <p className="tracking-wider text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Settle in. The guided practice begins when you press play.
            </p>

            <DurationPill display="25 - 45 mins" />

            {Array.isArray(voices) && voices.length >= 1 && (
              <VoicePill
                voices={voices}
                selectedVoiceId={selectedVoiceId}
                onVoiceChange={setSelectedVoiceId}
              />
            )}
          </div>
        </ModuleLayout>
        <ModuleControlBar
          phase="idle"
          primary={{ label: 'Begin', onClick: handleBeginMeditation }}
          showBack={true}
          onBack={handleMeditationIdleBack}
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
      <div className={`transition-opacity duration-[400ms] ${isMeditationVisible ? 'opacity-100' : 'opacity-0'}`}>
        <MeditationSection
          key={`${activeSectionKey}:${selectedVoiceId}`}
          sectionKey={activeSectionKey}
          voiceId={selectedVoiceId}
          moduleInstanceId={module.instanceId}
          onSectionComplete={handleSectionComplete}
          onModuleSkip={handleModuleSkip}
          onProgressUpdate={onProgressUpdate}
          onBack={handleSectionBack}
        />
      </div>
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
          showBack={true}
          onBack={handleCheckpoint1Back}
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
          showBack={true}
          onBack={handleCheckpoint2Back}
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
    const hasTextArea = screen.type === 'journal' || screen.hasJournal;

    return (
      <>
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
                {screen.animationType === 'diamond' ? <AsciiDiamond /> : <AsciiMoon />}
              </div>
            )}

            {/* Body paragraphs */}
            {screen.body && (
              <div className="space-y-4">
                {renderBodyWithAccents(screen.body, hasTextArea ? 'text-xs' : 'text-sm')}
              </div>
            )}

            {/* ─ Journal ─ */}
            {screen.type === 'journal' && (
              <div className="mt-2">
                {screen.prompt && (
                  <h3
                    className="text-lg font-light mb-2 text-left text-[var(--color-text-primary)]"
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
                  <div className="mt-3">
                    <h3
                      className="text-lg font-light mb-2 text-left text-[var(--color-text-primary)]"
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
              <p className="text-[var(--color-text-tertiary)] text-xs mt-4 leading-relaxed text-center">
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
            <h2
              className="text-xl font-light mb-6 text-center text-[var(--color-text-primary)]"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {CLOSING_CONTENT.title}
            </h2>

            <div className="flex justify-center mb-6">
              <AsciiMoon />
            </div>

            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {CLOSING_CONTENT.body}
            </p>

            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mt-6">
              {footerText}
            </p>

            {/* Source material toggle */}
            {CLOSING_CONTENT.resources.length > 0 && (
              <div className="mt-8">
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]
                    hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  <span className="text-sm leading-none">{showSources ? '\u2212' : '+'}</span>
                  {showSources ? 'Hide source material' : 'Show source material'}
                </button>

                <div
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{
                    maxHeight: showSources ? '500px' : '0',
                    opacity: showSources ? 1 : 0,
                  }}
                >
                  <div className="pt-4 space-y-3">
                    <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed">
                      {CLOSING_CONTENT.attribution}
                    </p>

                    <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider mt-4">
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
                </div>
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

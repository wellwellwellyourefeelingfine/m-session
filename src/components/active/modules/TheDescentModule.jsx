/**
 * TheDescentModule Component
 *
 * A guided EFT-based relationship meditation (Part 1 of linked pair).
 * Phases:
 * 1. Idle (mode selection: solo / couple)
 * 2. Audio-guided meditation (useMeditationPlayback)
 * 3. Post-meditation reflection flow (10 screens):
 *    capture → checkin → response → psychoed (×3) →
 *    reflect-surface → reflect-under → reflect-unsaid → closing
 *
 * Two modes:
 * - Solo: journal-based personal reflection on screens 7-9
 * - Couple: discussion prompts with collapsible notepads on screens 7-9
 *
 * Screens 1-6 are shared (with minor couple additions on 1-2).
 * Data saved to transitionCaptures.theDescent for Part 2 (The Cycle).
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  getMeditationById,
  generateTimedSequence,
  estimateMeditationDurationSeconds,
  resolveEffectiveVoiceId,
} from '../../../content/meditations';
import { useMeditationPlayback } from '../../../hooks/useMeditationPlayback';
import { useTranscriptModal } from '../../../hooks/useTranscriptModal';
import { useJournalStore } from '../../../stores/useJournalStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useAppStore } from '../../../stores/useAppStore';

// Reflection content
import {
  QUICK_CAPTURE_SCREEN,
  CHECKIN_HEADER,
  CHECKIN_SUBTEXT,
  CHECKIN_OPTIONS,
  TAILORED_RESPONSES,
  PSYCHOED_SCREENS,
  ACCENT_TERMS,
  CHECKIN_COUPLE_NOTE,
  REFLECT_SURFACE_SCREEN,
  REFLECT_UNDERNEATH_SCREEN,
  REFLECT_UNSAID_SCREEN,
  CLOSING_CONTENT,
} from '../../../content/modules/theDeepDiveReflectionContent';

// Shared UI components
import ModuleLayout, { DurationPill, VoicePill } from '../capabilities/ModuleLayout';
import ModuleControlBar, { VolumeButton, SlotButton } from '../capabilities/ModuleControlBar';
import MorphingShapes from '../capabilities/animations/MorphingShapes';
import AsciiMoon from '../capabilities/animations/AsciiMoon';
import AsciiDiamond from '../capabilities/animations/AsciiDiamond';
import LeafDrawV2 from '../capabilities/animations/LeafDrawV2';
import TranscriptModal, { TranscriptIcon } from '../capabilities/TranscriptModal';

// ─── Constants ──────────────────────────────────────────────────────────────

const FADE_MS = 400;

const POST_MED_PHASES = [
  'capture', 'checkin', 'response',
  'psychoed-1', 'psychoed-2', 'psychoed-3',
  'reflect-surface', 'reflect-under', 'reflect-unsaid', 'closing',
];

// ─── Render helpers ─────────────────────────────────────────────────────────

/**
 * Renders an array of content lines with circle spacer and accent color support.
 * Handles: '§' spacers, '{#N}' numbered items, and accent terms from ACCENT_TERMS map.
 */
function renderContentLines(lines) {
  return (
    <div className="space-y-0">
      {lines.map((line, i) => {
        // Circle spacer
        if (line === '\u00A7') {
          return (
            <div key={i} className="flex justify-center my-4">
              <div className="circle-spacer" />
            </div>
          );
        }

        // Numbered line with accent number
        const numMatch = line.match(/^\{#(\d+)\}\s*(.*)/);
        if (numMatch) {
          return (
            <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              <span className="text-[var(--accent)] font-medium">{numMatch[1]}</span>
              {' \u2014 '}{numMatch[2]}
            </p>
          );
        }

        // Accent term highlighting
        let hasAccent = false;
        for (const key of Object.keys(ACCENT_TERMS)) {
          if (line.includes(`{${key}}`)) {
            hasAccent = true;
            break;
          }
        }

        if (hasAccent) {
          const parts = [];
          let remaining = line;
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
            <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {parts}
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
}

/**
 * Renders numbered discussion steps for couple mode.
 * Accent-colored step numbers + left border, matching TheCycleModule pattern.
 */
function renderSteps(steps) {
  return (
    <div className="space-y-3 mb-4">
      {steps.map((step, i) => (
        <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed pl-4 border-l-2 border-[var(--color-border)]">
          <span className="text-[var(--accent)] font-medium">{i + 1}</span>
          {' \u2014 '}{step}
        </p>
      ))}
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TheDescentModule({ module, onComplete, onSkip, onProgressUpdate }) {
  const meditation = getMeditationById('the-descent');

  // Store integration
  const addEntry = useJournalStore((state) => state.addEntry);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;
  const updateTheDescentCapture = useSessionStore((s) => s.updateTheDescentCapture);
  const moduleItems = useSessionStore((s) => s.modules.items);
  const hasPart2 = useMemo(() => moduleItems.some(m => m.type === 'the-cycle'), [moduleItems]);

  // ─── State ──────────────────────────────────────────────────────────────

  // Module phase
  const [phase, setPhase] = useState('idle');

  // Mode selection (idle phase)
  const [selectedMode, setSelectedMode] = useState(
    meditation?.defaultVariation || 'solo'
  );
  const [isLeaving, setIsLeaving] = useState(false);
  const defaultVoiceId = useAppStore((s) => s.preferences?.defaultVoiceId);
  const voices = meditation?.audio?.voices;
  const [selectedVoiceId, setSelectedVoiceId] = useState(() =>
    resolveEffectiveVoiceId(meditation?.audio, defaultVoiceId)
  );

  // Transcript modal state
  const { showTranscript, transcriptClosing, handleOpenTranscript, handleCloseTranscript } = useTranscriptModal();

  // Post-meditation reflection state
  const [quickCapture, setQuickCapture] = useState('');
  const [checkInSelection, setCheckInSelection] = useState(null);
  const [psychoedStep, setPsychoedStep] = useState(0);
  const [isPhaseVisible, setIsPhaseVisible] = useState(true);
  const [isPsychoedVisible, setIsPsychoedVisible] = useState(true);
  const [isPsychoedHeaderVisible, setIsPsychoedHeaderVisible] = useState(false);

  // Journal values (same keys as Part 2 data contract)
  const [journalValues, setJournalValues] = useState({
    surfaceReaction: '',
    primaryEmotion: '',
    unsaidMessage: '',
  });

  // Couple notepad toggle (matches TheCycleModule pattern)
  const [openNotepads, setOpenNotepads] = useState({});
  const toggleNotepad = useCallback((key) => {
    setOpenNotepads(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ─── Timed sequence (variation assembly) ────────────────────────────────

  const [timedSequence, totalDuration] = useMemo(() => {
    if (!meditation) return [[], 0];

    const clips = meditation.assembleVariation(selectedMode);

    const sequence = generateTimedSequence(clips, 1.0, {
      audioConfig: meditation.audio,
      voiceId: selectedVoiceId,
    });

    const total = sequence.length > 0
      ? sequence[sequence.length - 1].endTime
      : estimateMeditationDurationSeconds(meditation, { variationKey: selectedMode, voiceId: selectedVoiceId });
    return [sequence, total];
  }, [meditation, selectedMode, selectedVoiceId]);

  const displayMinutes = useMemo(() => {
    if (!meditation) return null;
    const seconds = estimateMeditationDurationSeconds(meditation, {
      variationKey: selectedMode,
      voiceId: selectedVoiceId,
    });
    return Math.ceil(seconds / 60);
  }, [meditation, selectedMode, selectedVoiceId]);

  // Transcript prompts for the current mode
  const transcriptPrompts = useMemo(() => {
    if (!meditation) return [];
    return meditation.assembleVariation(selectedMode);
  }, [meditation, selectedMode]);

  const transcriptTitle = meditation
    ? `${meditation.title} (${meditation.variations[selectedMode]?.label || selectedMode})`
    : '';

  // ─── Meditation completion → reflection flow ────────────────────────────

  const handleMeditationComplete = useCallback(() => {
    setPhase('capture');
    setIsPhaseVisible(true);
  }, []);

  const handleMeditationSkip = useCallback(() => {
    setPhase('capture');
    setIsPhaseVisible(true);
  }, []);

  // Shared playback hook
  const playback = useMeditationPlayback({
    meditationId: 'the-descent',
    moduleInstanceId: module.instanceId,
    timedSequence,
    totalDuration,
    onComplete: handleMeditationComplete,
    onSkip: handleMeditationSkip,
    onProgressUpdate,
  });

  // ─── Phase transitions ────────────────────────────────────────────────

  // Hide timer during post-meditation phases
  useEffect(() => {
    if (POST_MED_PHASES.includes(phase)) {
      onProgressUpdate?.({ showTimer: false, progress: 100, elapsed: 0, total: 0, isPaused: false });
    }
  }, [phase, onProgressUpdate]);

  // Track when we enter meditation phase
  useEffect(() => {
    if (playback.hasStarted && !playback.isLoading && phase === 'idle') {
      setPhase('meditation');
    }
  }, [playback.hasStarted, playback.isLoading, phase]);

  useEffect(() => {
    if (playback.hasStarted) return;
    const nextEffective = resolveEffectiveVoiceId(meditation?.audio, defaultVoiceId);
    if (nextEffective && nextEffective !== selectedVoiceId) {
      setSelectedVoiceId(nextEffective);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally not re-running when selectedVoiceId changes locally
  }, [defaultVoiceId, playback.hasStarted, meditation]);

  // Fade out idle screen before starting
  const handleBeginWithTransition = useCallback(() => {
    useSessionStore.getState().beginModule(module.instanceId);
    setIsLeaving(true);
    setTimeout(() => playback.handleStart(), 300);
  }, [playback, module.instanceId]);

  // Restart meditation from the beginning
  const handleRestart = useCallback(() => {
    playback.handleRestart();
    setPhase('idle');
    setIsLeaving(false);
  }, [playback]);

  // ─── Fade transition helper ─────────────────────────────────────────────

  const fadeToPhase = useCallback((nextPhase) => {
    setIsPhaseVisible(false);
    setTimeout(() => {
      document.querySelector('main')?.scrollTo(0, 0);
      setPhase(nextPhase);
      setIsPhaseVisible(true);
    }, FADE_MS);
  }, []);

  // ─── Forward navigation ─────────────────────────────────────────────────

  const handleContinue = useCallback(() => {
    switch (phase) {
      case 'capture':
        fadeToPhase('checkin');
        break;
      case 'checkin':
        fadeToPhase('response');
        break;
      case 'response':
        // Transition into psychoed — fade out, then show header + body
        setIsPhaseVisible(false);
        setTimeout(() => {
          document.querySelector('main')?.scrollTo(0, 0);
          setPhase('psychoed-1');
          setPsychoedStep(0);
          setIsPhaseVisible(true);
          setIsPsychoedHeaderVisible(true);
          setIsPsychoedVisible(true);
        }, FADE_MS);
        break;
      case 'psychoed-1':
      case 'psychoed-2':
        // Step within psychoed — body fades, header stays
        setIsPsychoedVisible(false);
        setTimeout(() => {
          document.querySelector('main')?.scrollTo(0, 0);
          const nextStep = psychoedStep + 1;
          setPsychoedStep(nextStep);
          setPhase(`psychoed-${nextStep + 1}`);
          setIsPsychoedVisible(true);
        }, FADE_MS);
        break;
      case 'psychoed-3':
        // Exit psychoed — fade out header + body, then journal
        setIsPsychoedVisible(false);
        setIsPsychoedHeaderVisible(false);
        setTimeout(() => {
          document.querySelector('main')?.scrollTo(0, 0);
          setPhase('reflect-surface');
          setIsPhaseVisible(true);
        }, FADE_MS);
        break;
      case 'reflect-surface':
        fadeToPhase('reflect-under');
        break;
      case 'reflect-under':
        fadeToPhase('reflect-unsaid');
        break;
      case 'reflect-unsaid':
        fadeToPhase('closing');
        break;
      default:
        break;
    }
  }, [phase, psychoedStep, fadeToPhase]);

  // ─── Back navigation ────────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    switch (phase) {
      case 'checkin':
        fadeToPhase('capture');
        break;
      case 'response':
        fadeToPhase('checkin');
        break;
      case 'psychoed-1':
        // Back from first psychoed → response (header fades out)
        setIsPsychoedVisible(false);
        setIsPsychoedHeaderVisible(false);
        setTimeout(() => {
          document.querySelector('main')?.scrollTo(0, 0);
          setPhase('response');
          setIsPhaseVisible(true);
        }, FADE_MS);
        break;
      case 'psychoed-2':
      case 'psychoed-3':
        // Step back within psychoed
        setIsPsychoedVisible(false);
        setTimeout(() => {
          document.querySelector('main')?.scrollTo(0, 0);
          const prevStep = psychoedStep - 1;
          setPsychoedStep(prevStep);
          setPhase(`psychoed-${prevStep + 1}`);
          setIsPsychoedVisible(true);
        }, FADE_MS);
        break;
      case 'reflect-surface':
        // Back to psychoed (re-enter at last step)
        setIsPhaseVisible(false);
        setTimeout(() => {
          document.querySelector('main')?.scrollTo(0, 0);
          setPhase('psychoed-3');
          setPsychoedStep(2);
          setIsPsychoedVisible(true);
          setIsPsychoedHeaderVisible(true);
        }, FADE_MS);
        break;
      case 'reflect-under':
        fadeToPhase('reflect-surface');
        break;
      case 'reflect-unsaid':
        fadeToPhase('reflect-under');
        break;
      case 'closing':
        fadeToPhase('reflect-unsaid');
        break;
      default:
        break;
    }
  }, [phase, psychoedStep, fadeToPhase]);

  // ─── Journal entry builder ──────────────────────────────────────────────

  const buildJournalContent = useCallback(() => {
    const ts = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const isCouple = selectedMode === 'couple';
    let content = 'THE DEEP DIVE\n';

    content += `\nFirst impressions\n${quickCapture.trim() || `[no entry — ${ts}]`}\n`;

    if (checkInSelection) {
      const option = CHECKIN_OPTIONS.find(o => o.id === checkInSelection);
      content += `\nCheck-in: ${option?.label || checkInSelection}\n`;
    }

    const surfaceLabel = isCouple ? 'Our surface patterns' : 'On the surface';
    content += `\n${surfaceLabel}\n${journalValues.surfaceReaction.trim() || `[no entry — ${ts}]`}\n`;

    const emotionLabel = isCouple ? 'What we heard from each other' : 'Underneath';
    content += `\n${emotionLabel}\n${journalValues.primaryEmotion.trim() || `[no entry — ${ts}]`}\n`;

    const unsaidLabel = isCouple ? 'What was said' : 'The unsaid';
    content += `\n${unsaidLabel}\n${journalValues.unsaidMessage.trim() || `[no entry — ${ts}]`}\n`;

    return content.trim();
  }, [selectedMode, quickCapture, checkInSelection, journalValues]);

  const saveJournalEntry = useCallback(() => {
    const content = buildJournalContent();

    addEntry({
      content,
      source: 'session',
      sessionId,
      moduleTitle: 'The Deep Dive',
    });
  }, [buildJournalContent, addEntry, sessionId]);

  // ─── Capture save ───────────────────────────────────────────────────────

  const saveCaptures = useCallback(() => {
    updateTheDescentCapture('mode', selectedMode);
    if (quickCapture.trim()) {
      updateTheDescentCapture('quickCapture', quickCapture.trim());
    }
    if (checkInSelection) {
      updateTheDescentCapture('checkInResponse', checkInSelection);
    }
    if (journalValues.surfaceReaction.trim()) {
      updateTheDescentCapture('surfaceReaction', journalValues.surfaceReaction.trim());
    }
    if (journalValues.primaryEmotion.trim()) {
      updateTheDescentCapture('primaryEmotion', journalValues.primaryEmotion.trim());
    }
    if (journalValues.unsaidMessage.trim()) {
      updateTheDescentCapture('unsaidMessage', journalValues.unsaidMessage.trim());
    }
    updateTheDescentCapture('completedAt', Date.now());
  }, [selectedMode, quickCapture, checkInSelection, journalValues, updateTheDescentCapture]);

  // ─── Module completion ──────────────────────────────────────────────────

  const handleModuleComplete = useCallback(() => {
    saveJournalEntry();
    saveCaptures();
    setIsPhaseVisible(false);
    setTimeout(() => {
      onComplete();
    }, FADE_MS);
  }, [saveJournalEntry, saveCaptures, onComplete]);

  // ─── Module-level skip (saves partial data) ─────────────────────────────

  const handleModuleSkip = useCallback(() => {
    saveJournalEntry();
    updateTheDescentCapture('mode', selectedMode);
    if (quickCapture.trim()) {
      updateTheDescentCapture('quickCapture', quickCapture.trim());
    }
    if (checkInSelection) {
      updateTheDescentCapture('checkInResponse', checkInSelection);
    }
    if (journalValues.surfaceReaction.trim()) {
      updateTheDescentCapture('surfaceReaction', journalValues.surfaceReaction.trim());
    }
    if (journalValues.primaryEmotion.trim()) {
      updateTheDescentCapture('primaryEmotion', journalValues.primaryEmotion.trim());
    }
    if (journalValues.unsaidMessage.trim()) {
      updateTheDescentCapture('unsaidMessage', journalValues.unsaidMessage.trim());
    }
    onSkip();
  }, [saveJournalEntry, selectedMode, quickCapture, checkInSelection, journalValues, updateTheDescentCapture, onSkip]);

  // ─── Adapted content helpers ────────────────────────────────────────────

  const getSurfacePreamble = () => {
    return checkInSelection === 'stuck'
      ? REFLECT_SURFACE_SCREEN.solo.preamble.stuck
      : REFLECT_SURFACE_SCREEN.solo.preamble.default;
  };

  const getUnderneathPreamble = () => {
    return REFLECT_UNDERNEATH_SCREEN.solo.preamble[checkInSelection] || REFLECT_UNDERNEATH_SCREEN.solo.preamble.softened;
  };

  const getUnderneathPrompt = () => {
    const prompts = REFLECT_UNDERNEATH_SCREEN.solo.journal.prompt;
    if (checkInSelection === 'stuck') return prompts.stuck;
    if (checkInSelection === 'unsure') return prompts.unsure;
    return prompts.default;
  };

  const getUnderneathPlaceholder = () => {
    const placeholders = REFLECT_UNDERNEATH_SCREEN.solo.journal.placeholder;
    if (checkInSelection === 'stuck') return placeholders.stuck;
    if (checkInSelection === 'unsure') return placeholders.unsure;
    return placeholders.default;
  };

  // ─── Fallback ───────────────────────────────────────────────────────────

  if (!meditation) {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <p className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)] text-center">
            Meditation content not found.
          </p>
        </ModuleLayout>
        <ModuleControlBar
          phase="completed"
          primary={{ label: 'Continue', onClick: onComplete }}
          showSkip={false}
        />
      </>
    );
  }

  // ─── Render: Idle phase ───────────────────────────────────────────────

  if (phase === 'idle') {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          {!playback.isLoading ? (
            <div className={`text-center ${isLeaving ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
              <div className="text-center space-y-2 animate-fadeIn">
                <h2
                  className="font-serif text-2xl text-[var(--color-text-primary)]"
                  style={{ textTransform: 'none' }}
                >
                  {meditation.title}
                </h2>
                <p className="uppercase tracking-wider text-xs text-[var(--color-text-tertiary)]">
                  Part I
                </p>
              </div>

              <div className="flex justify-center my-4">
                <AsciiMoon />
              </div>

              <p className="tracking-wider text-xs text-[var(--color-text-secondary)] leading-relaxed mb-6">
                {meditation.description}
              </p>

              {/* Mode selector */}
              <div className="space-y-3 max-w-sm mx-auto">
                {Object.values(meditation.variations).map(v => (
                  <button
                    key={v.key}
                    onClick={() => setSelectedMode(v.key)}
                    className={`w-full text-left px-4 py-3 border transition-colors ${
                      selectedMode === v.key
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                        : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-base text-[var(--color-text-primary)] font-['DM_Serif_Text']">
                          {v.label}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5 uppercase tracking-wider">
                          {v.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Shared duration pill — reflects the currently selected mode,
                  ceil-rounded. */}
              {typeof displayMinutes === 'number' && (
                <DurationPill minutes={displayMinutes} />
              )}

              {Array.isArray(voices) && voices.length >= 1 && (
                <VoicePill
                  voices={voices}
                  selectedVoiceId={selectedVoiceId}
                  onVoiceChange={setSelectedVoiceId}
                />
              )}
            </div>
          ) : (
            <div className="text-center animate-fadeIn">
              <p className="text-[var(--color-text-tertiary)] text-sm uppercase tracking-wider">
                Preparing meditation...
              </p>
            </div>
          )}
        </ModuleLayout>

        <ModuleControlBar
          phase="idle"
          primary={{ label: 'Begin', onClick: playback.isLoading ? () => {} : handleBeginWithTransition }}
          showBack={false}
          showSkip={true}
          onSkip={onSkip}
          skipConfirmMessage="Skip this meditation?"
        />
      </>
    );
  }

  // ─── Render: Meditation phase ─────────────────────────────────────────

  if (phase === 'meditation') {
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
                playback.promptPhase === 'visible' || playback.promptPhase === 'fading-in' ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {playback.currentPrompt?.text || ''}
            </p>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={playback.getPrimaryButton()}
          showBack={true}
          onBack={handleRestart}
          backConfirmMessage="Restart this meditation from the beginning?"
          showSkip={true}
          onSkip={playback.handleSkip}
          skipConfirmMessage="Skip this meditation?"
          showSeekControls={playback.hasStarted && !playback.isComplete && !playback.isLoading}
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

        {/* Transcript modal */}
        <TranscriptModal
          isOpen={showTranscript}
          closing={transcriptClosing}
          onClose={handleCloseTranscript}
          title={transcriptTitle}
          prompts={transcriptPrompts}
        />
      </>
    );
  }

  // ─── Render: Quick Capture ────────────────────────────────────────────

  if (phase === 'capture') {
    const captureContent = selectedMode === 'couple'
      ? QUICK_CAPTURE_SCREEN.couple
      : QUICK_CAPTURE_SCREEN.solo;

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[400ms] ${
            isPhaseVisible ? 'opacity-100' : 'opacity-0'
          }`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-4 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {captureContent.header}
            </h2>

            <div className="flex justify-center mb-4">
              <LeafDrawV2 />
            </div>

            {selectedMode === 'couple' ? (
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-3">
                {captureContent.instruction}
              </p>
            ) : (
              <>
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                  {captureContent.body}
                </p>
                <p className="text-[var(--color-text-tertiary)] text-xs mt-3 mb-1">
                  {captureContent.hint}
                </p>
              </>
            )}

            <div className="mt-2">
              <textarea
                value={quickCapture}
                onChange={(e) => setQuickCapture(e.target.value)}
                placeholder={captureContent.journal.placeholder}
                rows={captureContent.journal.rows}
                className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                  focus:outline-none focus:border-[var(--accent)]
                  text-[var(--color-text-primary)] text-sm leading-relaxed
                  placeholder:text-[var(--color-text-tertiary)] resize-none"
              />
            </div>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={false}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── Render: Check-In ─────────────────────────────────────────────────

  if (phase === 'checkin') {
    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[400ms] ${
            isPhaseVisible ? 'opacity-100' : 'opacity-0'
          }`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-4 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {CHECKIN_HEADER}
            </h2>

            <div className="flex justify-center mb-4">
              <LeafDrawV2 />
            </div>

            <p className="text-[var(--color-text-secondary)] text-sm text-center mb-6">
              {CHECKIN_SUBTEXT}
            </p>

            <div className="space-y-2">
              {CHECKIN_OPTIONS.map((option) => {
                const isSelected = checkInSelection === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setCheckInSelection(option.id)}
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

            {selectedMode === 'couple' && (
              <p className="text-[var(--color-text-tertiary)] text-xs mt-4 italic">
                {CHECKIN_COUPLE_NOTE}
              </p>
            )}
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{
            label: 'Continue',
            onClick: handleContinue,
            disabled: !checkInSelection,
          }}
          showBack={true}
          onBack={handleBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── Render: Tailored Response ────────────────────────────────────────

  if (phase === 'response') {
    const responseContent = TAILORED_RESPONSES[checkInSelection];

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[400ms] ${
            isPhaseVisible ? 'opacity-100' : 'opacity-0'
          }`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-4 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {responseContent?.header}
            </h2>

            <div className="space-y-4">
              {responseContent?.paragraphs.map((para, i) => (
                <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={true}
          onBack={handleBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── Render: Psychoeducation (3 screens with persistent header) ───────

  if (phase === 'psychoed-1' || phase === 'psychoed-2' || phase === 'psychoed-3') {
    const screen = PSYCHOED_SCREENS[psychoedStep];

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className="pt-2">
            {/* Persistent header + animation */}
            <div className={`transition-opacity duration-[400ms] ${
              isPsychoedHeaderVisible ? 'opacity-100' : 'opacity-0'
            }`}>
              <h2
                className="text-xl font-light mb-2 text-center"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                The Deep Dive
              </h2>
              <div className="flex justify-center mb-4">
                <LeafDrawV2 />
              </div>
            </div>

            {/* Body — fades out/in on step change */}
            <div className={`transition-opacity duration-[400ms] ${
              isPsychoedVisible ? 'opacity-100' : 'opacity-0'
            }`} style={{ paddingBottom: '8rem' }}>
              <div key={psychoedStep} className="animate-fadeIn">
                <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-3">
                  {screen.header}
                </p>
                {renderContentLines(screen.lines)}
              </div>
            </div>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={true}
          onBack={handleBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── Render: Reflect — The Surface ────────────────────────────────────

  if (phase === 'reflect-surface') {
    const surfaceContent = selectedMode === 'couple'
      ? REFLECT_SURFACE_SCREEN.couple
      : REFLECT_SURFACE_SCREEN.solo;

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[400ms] ${
            isPhaseVisible ? 'opacity-100' : 'opacity-0'
          }`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-4 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {surfaceContent.header}
            </h2>

            <div className="flex justify-center mb-4">
              <LeafDrawV2 />
            </div>

            {selectedMode === 'solo' ? (
              <>
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-4">
                  {getSurfacePreamble()}
                </p>

                <p className="text-[var(--color-text-primary)] text-lg leading-relaxed mb-3"
                   style={{ textTransform: 'none', fontFamily: 'DM Serif Text, serif' }}>
                  {surfaceContent.journal.prompt}
                </p>

                <textarea
                  value={journalValues.surfaceReaction}
                  onChange={(e) => setJournalValues(prev => ({ ...prev, surfaceReaction: e.target.value }))}
                  placeholder={surfaceContent.journal.placeholder}
                  rows={surfaceContent.journal.rows}
                  className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                    focus:outline-none focus:border-[var(--accent)]
                    text-[var(--color-text-primary)] text-sm leading-relaxed
                    placeholder:text-[var(--color-text-tertiary)] resize-none"
                />
              </>
            ) : (
              <>
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-2">
                  {surfaceContent.instruction}
                </p>

                {renderSteps(surfaceContent.steps)}

                <p className="text-[var(--color-text-tertiary)] text-xs mb-4 italic">
                  {surfaceContent.timeSuggestion}
                </p>

                <button
                  onClick={() => toggleNotepad('reflect-surface')}
                  className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-2"
                >
                  {openNotepads['reflect-surface'] ? '\u25BE Hide notepad' : '\u25B8 Write something down'}
                </button>
                {openNotepads['reflect-surface'] && (
                  <textarea
                    value={journalValues.surfaceReaction}
                    onChange={(e) => setJournalValues(prev => ({ ...prev, surfaceReaction: e.target.value }))}
                    placeholder={surfaceContent.placeholder}
                    rows={surfaceContent.rows}
                    className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                      focus:outline-none focus:border-[var(--accent)]
                      text-[var(--color-text-primary)] text-sm leading-relaxed
                      placeholder:text-[var(--color-text-tertiary)] resize-none animate-fadeIn"
                  />
                )}
              </>
            )}
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={true}
          onBack={handleBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── Render: Reflect — Underneath / What You Heard ────────────────────

  if (phase === 'reflect-under') {
    const underContent = selectedMode === 'couple'
      ? REFLECT_UNDERNEATH_SCREEN.couple
      : REFLECT_UNDERNEATH_SCREEN.solo;

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[400ms] ${
            isPhaseVisible ? 'opacity-100' : 'opacity-0'
          }`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-4 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {underContent.header}
            </h2>

            <div className="flex justify-center mb-4">
              <LeafDrawV2 />
            </div>

            {selectedMode === 'solo' ? (
              <>
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-4">
                  {getUnderneathPreamble()}
                </p>

                <p className="text-[var(--color-text-primary)] text-lg leading-relaxed mb-3"
                   style={{ textTransform: 'none', fontFamily: 'DM Serif Text, serif' }}>
                  {getUnderneathPrompt()}
                </p>

                <textarea
                  value={journalValues.primaryEmotion}
                  onChange={(e) => setJournalValues(prev => ({ ...prev, primaryEmotion: e.target.value }))}
                  placeholder={getUnderneathPlaceholder()}
                  rows={underContent.journal.rows}
                  className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                    focus:outline-none focus:border-[var(--accent)]
                    text-[var(--color-text-primary)] text-sm leading-relaxed
                    placeholder:text-[var(--color-text-tertiary)] resize-none"
                />
              </>
            ) : (
              <>
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-2">
                  {underContent.instruction}
                </p>

                {renderSteps(underContent.steps)}

                <p className="text-[var(--color-text-tertiary)] text-xs mb-4 italic">
                  {underContent.timeSuggestion}
                </p>

                <button
                  onClick={() => toggleNotepad('reflect-under')}
                  className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-2"
                >
                  {openNotepads['reflect-under'] ? '\u25BE Hide notepad' : '\u25B8 Write something down'}
                </button>
                {openNotepads['reflect-under'] && (
                  <textarea
                    value={journalValues.primaryEmotion}
                    onChange={(e) => setJournalValues(prev => ({ ...prev, primaryEmotion: e.target.value }))}
                    placeholder={underContent.placeholder}
                    rows={underContent.rows}
                    className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                      focus:outline-none focus:border-[var(--accent)]
                      text-[var(--color-text-primary)] text-sm leading-relaxed
                      placeholder:text-[var(--color-text-tertiary)] resize-none animate-fadeIn"
                  />
                )}
              </>
            )}
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={true}
          onBack={handleBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── Render: Reflect — The Unsaid / Saying It ────────────────────────

  if (phase === 'reflect-unsaid') {
    const unsaidContent = selectedMode === 'couple'
      ? REFLECT_UNSAID_SCREEN.couple
      : REFLECT_UNSAID_SCREEN.solo;

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[400ms] ${
            isPhaseVisible ? 'opacity-100' : 'opacity-0'
          }`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-4 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {unsaidContent.header}
            </h2>

            <div className="flex justify-center mb-4">
              <LeafDrawV2 />
            </div>

            {selectedMode === 'solo' ? (
              <>
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-4">
                  {unsaidContent.preamble}
                </p>

                <p className="text-[var(--color-text-primary)] text-lg leading-relaxed mb-3"
                   style={{ textTransform: 'none', fontFamily: 'DM Serif Text, serif' }}>
                  {unsaidContent.journal.prompt}
                </p>

                <textarea
                  value={journalValues.unsaidMessage}
                  onChange={(e) => setJournalValues(prev => ({ ...prev, unsaidMessage: e.target.value }))}
                  placeholder={unsaidContent.journal.placeholder}
                  rows={unsaidContent.journal.rows}
                  className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                    focus:outline-none focus:border-[var(--accent)]
                    text-[var(--color-text-primary)] text-sm leading-relaxed
                    placeholder:text-[var(--color-text-tertiary)] resize-none"
                />
              </>
            ) : (
              <>
                <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mb-2">
                  {unsaidContent.instruction}
                </p>

                {renderSteps(unsaidContent.steps)}

                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4 italic">
                  {unsaidContent.note}
                </p>

                <p className="text-[var(--color-text-tertiary)] text-xs mb-4 italic">
                  {unsaidContent.timeSuggestion}
                </p>

                <button
                  onClick={() => toggleNotepad('reflect-unsaid')}
                  className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-2"
                >
                  {openNotepads['reflect-unsaid'] ? '\u25BE Hide notepad' : '\u25B8 Write something down'}
                </button>
                {openNotepads['reflect-unsaid'] && (
                  <textarea
                    value={journalValues.unsaidMessage}
                    onChange={(e) => setJournalValues(prev => ({ ...prev, unsaidMessage: e.target.value }))}
                    placeholder={unsaidContent.placeholder}
                    rows={unsaidContent.rows}
                    className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                      focus:outline-none focus:border-[var(--accent)]
                      text-[var(--color-text-primary)] text-sm leading-relaxed
                      placeholder:text-[var(--color-text-tertiary)] resize-none animate-fadeIn"
                  />
                )}
              </>
            )}
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleContinue }}
          showBack={true}
          onBack={handleBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── Render: Closing ──────────────────────────────────────────────────

  if (phase === 'closing') {
    const modeClosing = selectedMode === 'couple' ? CLOSING_CONTENT.couple : CLOSING_CONTENT.solo;
    const closingLines = hasPart2 ? modeClosing.withPart2 : modeClosing.withoutPart2;

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[400ms] ${
            isPhaseVisible ? 'opacity-100' : 'opacity-0'
          }`} style={{ paddingBottom: '8rem' }}>
            <h2
              className="text-xl font-light mb-4 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {CLOSING_CONTENT.header}
            </h2>

            <div className="flex justify-center mb-6">
              <AsciiDiamond />
            </div>

            {renderContentLines(closingLines)}
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="completed"
          primary={{ label: 'Complete', onClick: handleModuleComplete }}
          showBack={true}
          onBack={handleBack}
          showSkip={false}
        />
      </>
    );
  }

  return null;
}

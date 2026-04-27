/**
 * LeavesOnAStreamModule Component
 *
 * An ACT cognitive defusion meditation with four phases:
 * 1. Audio-guided meditation (useMeditationPlayback — same as OpenAwareness/BodyScan)
 * 2. Post-meditation reflection (6 step-through text screens with circle spacers)
 * 3. Journaling exercise (2 open text prompts saved to journal store)
 * 4. Closing screen (AsciiDiamond animation + summary)
 *
 * Variable duration: 10-20 min meditation via expandable silence + conditional prompts
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  getMeditationById,
  calculateSilenceMultiplier,
  generateTimedSequence,
  resolveEffectiveVoiceId,
} from '../../../content/meditations';
import { useMeditationPlayback } from '../../../hooks/useMeditationPlayback';
import { useTranscriptModal } from '../../../hooks/useTranscriptModal';
import useSyncedDuration from '../../../hooks/useSyncedDuration';
import { useJournalStore } from '../../../stores/useJournalStore';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useAppStore } from '../../../stores/useAppStore';

// Shared UI components
import ModuleLayout, { IdleScreen } from '../capabilities/ModuleLayout';
import MeditationLoadingScreen from '../capabilities/MeditationLoadingScreen';
import ModuleControlBar, { VolumeButton, SlotButton } from '../capabilities/ModuleControlBar';
import MorphingShapes from '../capabilities/animations/MorphingShapes';
import AsciiDiamond from '../capabilities/animations/AsciiDiamond';
import LeafDrawV2 from '../capabilities/animations/LeafDrawV2';
import TranscriptModal, { TranscriptIcon } from '../capabilities/TranscriptModal';
import { EggIcon } from '../../shared/Icons';

// ─── Reflection screen content ──────────────────────────────────────────────
// Uses '§' for circle spacers and '{cognitive_defusion}' for accent highlighting

const REFLECTION_SCREENS = [
  {
    lines: [
      'What you just practiced has a name in psychology: {cognitive_defusion}.',
      '§',
      'It means learning to observe a thought without being captured by it.',
    ],
  },
  {
    lines: [
      'Most of the time, thinking is invisible to us.',
      '§',
      'A thought like \u201cI\u2019m not good enough\u201d doesn\u2019t announce itself as a thought. It becomes the lens we see through, and we never notice it\u2019s there.',
    ],
  },
  {
    lines: [
      'We act on these thoughts, argue with them, or try to push them away. All without recognizing that each one is just a mental event.',
      '§',
      'One more leaf on the water.',
    ],
  },
  {
    lines: [
      'What you practiced by the stream is the alternative: watching thoughts arrive and pass without climbing onto them.',
      '§',
      'The moment you can see a thought as a thought, it loses the authority it had when it was pretending to be a fact.',
    ],
  },
  {
    lines: [
      'You don\u2019t need a meditation or a quiet room to do this.',
      '§',
      'The next time you notice a thought pulling at you, try the same move. Notice it. Name it quietly: \u201cThere\u2019s that worry again.\u201d Then let it sit there without following where it leads.',
    ],
  },
  {
    lines: [
      'This skill gets stronger with practice. Not because you get better at controlling your thoughts, but because you get faster at noticing when one has already carried you away.',
    ],
  },
];

// ─── Render helpers ──────────────────────────────────────────────────────────

/**
 * Renders an array of content lines with circle spacer and accent color support.
 * Follows the ProtectorDialogue renderLines pattern.
 */
function renderReflectionLines(lines) {
  return (
    <div className="space-y-0">
      {lines.map((line, i) => {
        if (line === '§') {
          return (
            <div key={i} className="flex justify-center my-4">
              <div className="circle-spacer" />
            </div>
          );
        }
        if (line.includes('{cognitive_defusion}')) {
          const parts = line.split('{cognitive_defusion}');
          return (
            <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {parts.map((part, j) => (
                <span key={j}>
                  {part}
                  {j < parts.length - 1 && (
                    <span className="text-[var(--accent)]">cognitive defusion</span>
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
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function LeavesOnAStreamModule({ module, onComplete, onSkip, onProgressUpdate }) {
  const meditation = getMeditationById('leaves-on-a-stream');

  // Journal store
  const addEntry = useJournalStore((state) => state.addEntry);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;

  // Derive hasStarted from store (needed before useSyncedDuration call)
  const meditationPlayback = useSessionStore((state) => state.meditationPlayback);
  const hasStartedFromStore = meditationPlayback.moduleInstanceId === module.instanceId && meditationPlayback.hasStarted;

  // Duration (synced with session store)
  const duration = useSyncedDuration(module, { hasStarted: hasStartedFromStore });

  // ─── State ──────────────────────────────────────────────────────────────

  // Module phase: idle → meditation → reflection → journaling → closing
  const [phase, setPhase] = useState('idle');

  // Voice selection — see BodyScanModule for the canonical pattern.
  const defaultVoiceId = useAppStore((s) => s.preferences?.defaultVoiceId);
  const voices = meditation?.audio?.voices;
  const [selectedVoiceId, setSelectedVoiceId] = useState(() =>
    resolveEffectiveVoiceId(meditation?.audio, defaultVoiceId)
  );
  const activeVoiceRef = useRef(selectedVoiceId);

  // Reflection state
  const [reflectionStep, setReflectionStep] = useState(0);
  const [isReflectionVisible, setIsReflectionVisible] = useState(true);
  const [isReflectionHeaderVisible, setIsReflectionHeaderVisible] = useState(false);

  // Journaling state
  const [journalEntry1, setJournalEntry1] = useState('');
  const [journalEntry2, setJournalEntry2] = useState('');
  const [isJournalingVisible, setIsJournalingVisible] = useState(true);

  // Closing state
  const [isClosingVisible, setIsClosingVisible] = useState(false);

  // Transcript modal state
  const { showTranscript, transcriptClosing, handleOpenTranscript, handleCloseTranscript } = useTranscriptModal();

  // ─── Timed sequence (conditional filtering + silence expansion) ─────────

  const [timedSequence, totalDuration] = useMemo(() => {
    if (!meditation) return [[], 0];

    const durationSeconds = duration.selected * 60;

    // Filter out conditional prompts that don't meet duration requirements
    const filteredPrompts = meditation.prompts.filter(prompt => {
      if (!prompt.conditional) return true;
      if (prompt.conditional.minDuration && duration.selected < prompt.conditional.minDuration) {
        return false;
      }
      return true;
    });

    // Calculate silence multiplier — voice-aware so target is met when
    // an alternate voice is selected.
    const silenceMultiplier = calculateSilenceMultiplier(
      filteredPrompts,
      durationSeconds,
      'leaves-on-a-stream',
      selectedVoiceId,
    );

    // Generate timed sequence — voiceId drives audio URL resolution.
    const sequence = generateTimedSequence(filteredPrompts, silenceMultiplier, {
      audioConfig: meditation.audio,
      voiceId: selectedVoiceId,
    });

    const total = sequence.length > 0 ? sequence[sequence.length - 1].endTime : durationSeconds;
    return [sequence, total];
  }, [meditation, duration.selected, selectedVoiceId]);

  // ─── Meditation completion → reflection transition ─────────────────────

  const handleMeditationComplete = useCallback(() => {
    setPhase('reflection');
    setReflectionStep(0);
    setIsReflectionVisible(true);
    setIsReflectionHeaderVisible(true);
  }, []);

  const handleMeditationSkip = useCallback(() => {
    // Skipping during meditation still advances to reflection
    setPhase('reflection');
    setReflectionStep(0);
    setIsReflectionVisible(true);
    setIsReflectionHeaderVisible(true);
  }, []);

  // Shared playback hook — onComplete wired to transition, not module completion
  const playback = useMeditationPlayback({
    meditationId: 'leaves-on-a-stream',
    moduleInstanceId: module.instanceId,
    timedSequence,
    totalDuration,
    onComplete: handleMeditationComplete,
    onSkip: handleMeditationSkip,
    onProgressUpdate,
  });

  // ─── Phase transitions ────────────────────────────────────────────────

  // Hide timer during reflection/journaling/closing
  useEffect(() => {
    if (phase === 'reflection' || phase === 'journaling' || phase === 'closing') {
      onProgressUpdate?.({ showTimer: false, progress: 100, elapsed: 0, total: 0, isPaused: false });
    }
  }, [phase, onProgressUpdate]);

  // Track when we enter meditation phase (playback starts)
  // Gate on !isLoading so the idle block persists during audio composition,
  // preventing a control bar unmount/remount flash.
  useEffect(() => {
    if (playback.hasStarted && !playback.isLoading && phase === 'idle') {
      setPhase('meditation');
    }
  }, [playback.hasStarted, playback.isLoading, phase]);

  // Sync the idle-screen voice pill with the global default preference.
  useEffect(() => {
    if (playback.hasStarted) return;
    const nextEffective = resolveEffectiveVoiceId(meditation?.audio, defaultVoiceId);
    if (nextEffective && nextEffective !== selectedVoiceId) {
      setSelectedVoiceId(nextEffective);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally not re-running when selectedVoiceId changes locally
  }, [defaultVoiceId, playback.hasStarted, meditation]);

  // Begin → idle-leaving → preparing (loading screen) → preparing-leaving →
  // active. Composer reads the voice-aware timedSequence during the loading
  // screen window.
  const handleBeginWithTransition = useCallback(() => {
    activeVoiceRef.current = selectedVoiceId;
    useSessionStore.getState().beginModule(module.instanceId);
    playback.handleBeginWithTransition();
  }, [playback, module.instanceId, selectedVoiceId]);

  // Restart meditation from the beginning
  const handleRestart = useCallback(() => {
    playback.handleRestart();
    setPhase('idle');
  }, [playback]);

  // ─── Reflection navigation ────────────────────────────────────────────

  const handleReflectionContinue = useCallback(() => {
    if (reflectionStep < REFLECTION_SCREENS.length - 1) {
      // Fade out body only → advance → fade in body
      setIsReflectionVisible(false);
      setTimeout(() => {
        setReflectionStep((prev) => prev + 1);
        setIsReflectionVisible(true);
      }, 400);
    } else {
      // Last reflection screen → fade out header + body → transition to journaling
      setIsReflectionVisible(false);
      setIsReflectionHeaderVisible(false);
      setTimeout(() => {
        setPhase('journaling');
      }, 400);
    }
  }, [reflectionStep]);

  const handleReflectionBack = useCallback(() => {
    if (reflectionStep > 0) {
      setIsReflectionVisible(false);
      setTimeout(() => {
        setReflectionStep((prev) => prev - 1);
        setIsReflectionVisible(true);
      }, 400);
    }
  }, [reflectionStep]);

  // ─── Back navigation from journaling/closing ───────────────────────────

  const handleBackToReflection = useCallback(() => {
    setPhase('reflection');
    setReflectionStep(REFLECTION_SCREENS.length - 1);
    setIsReflectionVisible(true);
    setIsReflectionHeaderVisible(true);
  }, []);

  const handleBackToJournaling = useCallback(() => {
    setIsClosingVisible(false);
    setTimeout(() => {
      setPhase('journaling');
    }, 400);
  }, []);

  const handleClosingComplete = useCallback(() => {
    setIsClosingVisible(false);
    setTimeout(() => {
      onComplete();
    }, 400);
  }, [onComplete]);

  // ─── Journaling save & complete ───────────────────────────────────────

  const saveJournalEntry = useCallback(() => {
    const timestamp = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    let content = 'LEAVES ON A STREAM\n';

    content += `\nWhat showed up?\n`;
    content += journalEntry1.trim() ? `${journalEntry1.trim()}\n` : `[no entry — ${timestamp}]\n`;

    content += `\nWhat was it like to let them pass?\n`;
    content += journalEntry2.trim() ? `${journalEntry2.trim()}\n` : `[no entry — ${timestamp}]\n`;

    addEntry({
      content: content.trim(),
      source: 'session',
      sessionId,
      moduleTitle: 'Leaves on a Stream',
    });
  }, [journalEntry1, journalEntry2, addEntry, sessionId]);

  const handleJournalingSave = useCallback(() => {
    saveJournalEntry();
    setIsJournalingVisible(false);
    setTimeout(() => {
      setPhase('closing');
      setIsClosingVisible(true);
      setIsJournalingVisible(true); // Reset for potential back navigation
    }, 400);
  }, [saveJournalEntry]);

  // ─── Module-level skip (saves any journal content) ─────────────────────

  const handleModuleSkip = useCallback(() => {
    saveJournalEntry();
    onSkip();
  }, [saveJournalEntry, onSkip]);

  // ─── Fallback ─────────────────────────────────────────────────────────

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

  // ─── Render: Idle phase (also covers loading to prevent control bar flash) ──

  if (phase === 'idle') {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          {playback.error ? (
            <div className="text-center animate-fadeIn flex flex-col items-center">
              <EggIcon size={48} className="text-[var(--color-text-tertiary)] mb-4" />
              <p className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider">
                Audio not found.
              </p>
            </div>
          ) : (playback.transitionStage === 'idle' || playback.transitionStage === 'idle-leaving') ? (() => {
            const steps = meditation.durationSteps || [];
            const stepIndex = steps.indexOf(duration.selected);
            const canStepBack = stepIndex > 0;
            const canStepForward = stepIndex >= 0 && stepIndex < steps.length - 1;
            const stepTo = (nextIndex) => {
              const next = steps[nextIndex];
              if (typeof next === 'number') duration.setSelected(next);
            };
            const isLeaving = playback.transitionStage === 'idle-leaving';
            return (
              <div className={`text-center ${isLeaving ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
                <IdleScreen
                  title={meditation.title}
                  description={meditation.description}
                  durationMinutes={duration.selected}
                  canStepDurationBack={canStepBack}
                  canStepDurationForward={canStepForward}
                  onDurationStepBack={() => stepTo(stepIndex - 1)}
                  onDurationStepForward={() => stepTo(stepIndex + 1)}
                  voices={voices}
                  selectedVoiceId={selectedVoiceId}
                  onVoiceChange={setSelectedVoiceId}
                />
              </div>
            );
          })() : (playback.transitionStage === 'preparing' || playback.transitionStage === 'preparing-leaving') ? (
            <MeditationLoadingScreen
              isLeaving={playback.transitionStage === 'preparing-leaving'}
            />
          ) : null}
        </ModuleLayout>

        <ModuleControlBar
          phase={playback.getPhase()}
          primary={(() => {
            const ph = playback.getPhase();
            if (ph === 'loading') return { label: 'Loading', loading: true };
            return { label: 'Begin', onClick: handleBeginWithTransition };
          })()}
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
            title={meditation.title}
            prompts={meditation.prompts}
          />
        </>
      );
  }

  // ─── Render: Reflection phase ─────────────────────────────────────────

  if (phase === 'reflection') {
    const screen = REFLECTION_SCREENS[reflectionStep];

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className="pt-2">
            {/* Header + animation — persistent across steps, fades in on first screen, fades out on last */}
            <div className={`transition-opacity duration-[400ms] ${
              isReflectionHeaderVisible ? 'opacity-100' : 'opacity-0'
            }`}>
              <h2
                className="text-xl font-light mb-4 text-center"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                Leaves on a Stream
              </h2>

              <div className="flex justify-center mb-6">
                <LeafDrawV2 />
              </div>
            </div>

            {/* Body text — fades out/in on each step change */}
            <div className={`transition-opacity duration-[400ms] ${isReflectionVisible ? 'opacity-100' : 'opacity-0'}`}>
              <div key={reflectionStep} className="animate-fadeIn">
                {renderReflectionLines(screen.lines)}
              </div>
            </div>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleReflectionContinue }}
          showBack={reflectionStep > 0}
          onBack={handleReflectionBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining reflection and journaling?"
        />
      </>
    );
  }

  // ─── Render: Journaling phase ─────────────────────────────────────────

  if (phase === 'journaling') {
    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm', padding: 'normal' }}>
          <div className={`space-y-6 pt-6 animate-fadeIn transition-opacity duration-[400ms] ${isJournalingVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '8rem' }}>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              Take a few minutes to write about what you noticed. There are no right answers, just what's true for you right now.
            </p>

            <div className="space-y-5">
              {/* Prompt 1 */}
              <div>
                <p className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider mb-1">
                  What showed up?
                </p>
                <textarea
                  value={journalEntry1}
                  onChange={(e) => setJournalEntry1(e.target.value)}
                  placeholder="Thoughts, feelings, or memories that came up..."
                  rows={4}
                  className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                    focus:outline-none focus:border-[var(--accent)]
                    text-[var(--color-text-primary)] text-sm leading-relaxed
                    placeholder:text-[var(--color-text-tertiary)] resize-none"
                />
              </div>

              {/* Prompt 2 */}
              <div>
                <p className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider mb-1">
                  What was it like to let them pass?
                </p>
                <textarea
                  value={journalEntry2}
                  onChange={(e) => setJournalEntry2(e.target.value)}
                  placeholder="What was it like to watch rather than engage..."
                  rows={4}
                  className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                    focus:outline-none focus:border-[var(--accent)]
                    text-[var(--color-text-primary)] text-sm leading-relaxed
                    placeholder:text-[var(--color-text-tertiary)] resize-none"
                />
              </div>
            </div>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{
            label: 'Continue',
            onClick: handleJournalingSave,
          }}
          showBack={true}
          onBack={handleBackToReflection}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip journaling?"
        />
      </>
    );
  }

  // ─── Render: Closing phase ────────────────────────────────────────────

  if (phase === 'closing') {
    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[400ms] ${isClosingVisible ? 'opacity-100' : 'opacity-0'}`}>
            <h2
              className="text-xl font-light mb-6 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              Leaves on a Stream
            </h2>

            <div className="space-y-0">
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                You can return to this exercise anytime. In a quiet moment, on a walk, or in a future session.
              </p>
              <div className="flex justify-center my-4">
                <div className="circle-spacer" />
              </div>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                The stream is always there when you need it.
              </p>
            </div>

            <div className="flex justify-center pt-6">
              <AsciiDiamond />
            </div>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="completed"
          primary={{ label: 'Complete', onClick: handleClosingComplete }}
          showBack={true}
          onBack={handleBackToJournaling}
          showSkip={false}
        />
      </>
    );
  }

  // Should not reach here, but safe fallback
  return null;
}

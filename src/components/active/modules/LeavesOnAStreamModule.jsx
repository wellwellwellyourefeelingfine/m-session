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

import { useState, useMemo, useCallback, useEffect } from 'react';
import { getModuleById } from '../../../content/modules';
import {
  getMeditationById,
  calculateSilenceMultiplier,
  generateTimedSequence,
} from '../../../content/meditations';
import { useMeditationPlayback } from '../../../hooks/useMeditationPlayback';
import { useJournalStore } from '../../../stores/useJournalStore';
import { useSessionStore } from '../../../stores/useSessionStore';

// Shared UI components
import ModuleLayout, { IdleScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar, { VolumeButton, SlotButton } from '../capabilities/ModuleControlBar';
import MorphingShapes from '../capabilities/animations/MorphingShapes';
import AsciiDiamond from '../capabilities/animations/AsciiDiamond';
import LeafDraw from '../capabilities/animations/LeafDraw';
import DurationPicker from '../../shared/DurationPicker';

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

export default function LeavesOnAStreamModule({ module, onComplete, onSkip, onTimerUpdate }) {
  const libraryModule = getModuleById(module.libraryId);
  const meditation = getMeditationById('leaves-on-a-stream');

  // Journal store
  const addEntry = useJournalStore((state) => state.addEntry);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;

  // ─── State ──────────────────────────────────────────────────────────────

  // Module phase: idle → meditation → reflection → journaling → closing
  const [phase, setPhase] = useState('idle');

  // Meditation state
  const [selectedDuration, setSelectedDuration] = useState(
    module.duration || libraryModule?.defaultDuration || 10
  );
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isMeditationCompleteVisible, setIsMeditationCompleteVisible] = useState(true);

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

  // ─── Timed sequence (conditional filtering + silence expansion) ─────────

  const [timedSequence, totalDuration] = useMemo(() => {
    if (!meditation) return [[], 0];

    const durationSeconds = selectedDuration * 60;

    // Filter out conditional prompts that don't meet duration requirements
    const filteredPrompts = meditation.prompts.filter(prompt => {
      if (!prompt.conditional) return true;
      if (prompt.conditional.minDuration && selectedDuration < prompt.conditional.minDuration) {
        return false;
      }
      return true;
    });

    // Calculate silence multiplier for this duration
    const silenceMultiplier = calculateSilenceMultiplier(filteredPrompts, durationSeconds);

    // Generate timed sequence
    const sequence = generateTimedSequence(filteredPrompts, silenceMultiplier, {
      speakingRate: meditation.speakingRate || 150,
      audioConfig: meditation.audio,
    });

    const total = sequence.length > 0 ? sequence[sequence.length - 1].endTime : durationSeconds;
    return [sequence, total];
  }, [meditation, selectedDuration]);

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
    onTimerUpdate,
  });

  // Smooth fade from meditation-complete interstitial → reflection
  const handleContinueToReflection = useCallback(() => {
    setIsMeditationCompleteVisible(false);
    setTimeout(() => {
      playback.handleRestart(); // Hook cleanup (stop audio, revoke blob, reset store)
      setPhase('reflection');
      setReflectionStep(0);
      setIsReflectionVisible(true);
      setIsReflectionHeaderVisible(true);
      setIsMeditationCompleteVisible(true);
    }, 400);
  }, [playback]);

  // ─── Phase transitions ────────────────────────────────────────────────

  // Hide timer during reflection/journaling/closing
  useEffect(() => {
    if (phase === 'reflection' || phase === 'journaling' || phase === 'closing') {
      onTimerUpdate?.({ showTimer: false, progress: 100, elapsed: 0, total: 0, isPaused: false });
    }
  }, [phase, onTimerUpdate]);

  // Track when we enter meditation phase (playback starts)
  // Gate on !isLoading so the idle block persists during audio composition,
  // preventing a control bar unmount/remount flash.
  useEffect(() => {
    if (playback.hasStarted && !playback.isLoading && phase === 'idle') {
      setPhase('meditation');
    }
  }, [playback.hasStarted, playback.isLoading, phase]);

  // Fade out idle screen before starting composition
  const handleBeginWithTransition = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => playback.handleStart(), 300);
  }, [playback]);

  // Restart meditation from the beginning
  const handleRestart = useCallback(() => {
    playback.handleRestart();
    setPhase('idle');
    setIsLeaving(false);
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
    const hasContent = journalEntry1.trim() || journalEntry2.trim();
    if (!hasContent) return;

    let content = 'LEAVES ON A STREAM\n';

    if (journalEntry1.trim()) {
      content += `\nWhat showed up?\n${journalEntry1.trim()}\n`;
    }
    if (journalEntry2.trim()) {
      content += `\nWhat was it like to let them pass?\n${journalEntry2.trim()}\n`;
    }

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
          {!playback.isLoading ? (
            <div className={`text-center ${isLeaving ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
              <IdleScreen
                title={meditation.title}
                description={meditation.description}
              />

              {/* Duration selector */}
              <button
                onClick={() => setShowDurationPicker(true)}
                className="mt-6 px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)]
                  hover:border-[var(--color-text-tertiary)] transition-colors"
              >
                <span className="text-2xl font-light">{selectedDuration}</span>
                <span className="text-sm ml-1">min</span>
              </button>
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

        {!playback.isLoading && (
          <DurationPicker
            isOpen={showDurationPicker}
            onClose={() => setShowDurationPicker(false)}
            onSelect={setSelectedDuration}
            currentDuration={selectedDuration}
            durationSteps={meditation.durationSteps}
            minDuration={meditation.minDuration / 60}
            maxDuration={meditation.maxDuration / 60}
          />
        )}
      </>
    );
  }

  // ─── Render: Meditation phase ─────────────────────────────────────────

  if (phase === 'meditation') {
    // Meditation still active (playing or paused)
    if (!playback.isComplete) {
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

              {showAnimation && (
                <div className="animate-fadeIn">
                  <MorphingShapes />
                </div>
              )}

              {/* Paused indicator */}
              <div className="h-5 flex items-center justify-center mt-3">
                {!playback.isPlaying && (
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
            leftSlot={
              <SlotButton
                icon={<AnimationIcon visible={showAnimation} />}
                label={showAnimation ? 'Hide animation' : 'Show animation'}
                onClick={() => setShowAnimation(!showAnimation)}
                active={showAnimation}
              />
            }
            rightSlot={
              <VolumeButton
                volume={playback.audio.volume}
                onVolumeChange={playback.audio.setVolume}
              />
            }
          />
        </>
      );
    }

    // Meditation completed — interstitial with fade-out transition
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <div className={`text-center space-y-4 transition-opacity duration-[400ms] ${
            isMeditationCompleteVisible ? 'opacity-100' : 'opacity-0'
          }`}>
            <h2
              className="text-xl font-light mb-6"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {meditation.title}
            </h2>
            <p className="uppercase tracking-wider text-[10px] text-[var(--color-text-secondary)]">
              Take a moment before moving on.
            </p>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="completed"
          primary={{ label: 'Continue', onClick: handleContinueToReflection }}
          showBack={false}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the reflection and journaling?"
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
                <LeafDraw />
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

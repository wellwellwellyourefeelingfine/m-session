/**
 * LeavesOnAStreamModule Component
 *
 * An ACT cognitive defusion meditation with three phases:
 * 1. Audio-guided meditation (useMeditationPlayback — same as OpenAwareness/BodyScan)
 * 2. Post-meditation reflection (3 step-through text screens, no audio)
 * 3. Journaling exercise (2 open text prompts saved to journal store)
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
import ModuleControlBar, { MuteButton, SlotButton } from '../capabilities/ModuleControlBar';
import MorphingShapes from '../capabilities/animations/MorphingShapes';
import DurationPicker from '../../shared/DurationPicker';

// ─── Reflection screen content ──────────────────────────────────────────────

const REFLECTION_SCREENS = [
  {
    header: 'What You Just Practiced',
    body: [
      'What you just practiced has a name: cognitive defusion. The name doesn\u2019t matter. What matters is the skill.',
      'Most of the time, we experience our thoughts as if they are reality. A thought like \u201cI\u2019m not good enough\u201d doesn\u2019t feel like a thought. It feels like a fact. We look at the world through it without even realizing it\u2019s there.',
      'What you just practiced is stepping back. Seeing thoughts as thoughts. Mental events that come and go. Not truths you need to act on. Not problems you need to solve right now. Just visitors passing through.',
    ],
  },
  {
    header: 'You Can Do This Anywhere',
    body: [
      'You don\u2019t need a meditation, a special state, or even a quiet room to do this.',
      'The next time you notice a difficult thought pulling at you, you can try the same move. It works for all of them: a worry, a self-criticism, a story about how things should be.',
      'Notice it. Name it gently, even silently: \u201cThere\u2019s that worry again.\u201d And let it be there without following it.',
      'You\u2019re not fighting the thought. You\u2019re not pretending it doesn\u2019t exist. You\u2019re just choosing not to let it steer.',
    ],
  },
  {
    header: 'Thoughts as Visitors',
    body: [
      'Here\u2019s a way to think about it going forward. Your thoughts are visitors in your house, not the house itself. Some are welcome, some aren\u2019t. But none of them are you. You\u2019re the space they pass through.',
      'The practice isn\u2019t about having fewer thoughts or better thoughts. It\u2019s about learning you have a choice in how you relate to the ones that show up.',
    ],
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

export default function LeavesOnAStreamModule({ module, onComplete, onSkip, onTimerUpdate }) {
  const libraryModule = getModuleById(module.libraryId);
  const meditation = getMeditationById('leaves-on-a-stream');

  // Journal store
  const addEntry = useJournalStore((state) => state.addEntry);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;

  // ─── State ──────────────────────────────────────────────────────────────

  // Module phase: idle → meditation → reflection → journaling
  const [phase, setPhase] = useState('idle');

  // Meditation state
  const [selectedDuration, setSelectedDuration] = useState(
    module.duration || libraryModule?.defaultDuration || 10
  );
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  // Reflection state
  const [reflectionStep, setReflectionStep] = useState(0);
  const [isReflectionVisible, setIsReflectionVisible] = useState(true);

  // Journaling state
  const [journalEntry1, setJournalEntry1] = useState('');
  const [journalEntry2, setJournalEntry2] = useState('');

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
  }, []);

  const handleMeditationSkip = useCallback(() => {
    // Skipping during meditation still advances to reflection
    setPhase('reflection');
    setReflectionStep(0);
    setIsReflectionVisible(true);
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

  // ─── Phase transitions ────────────────────────────────────────────────

  // Hide timer during reflection/journaling
  useEffect(() => {
    if (phase === 'reflection' || phase === 'journaling') {
      onTimerUpdate?.({ showTimer: false, progress: 100, elapsed: 0, total: 0, isPaused: false });
    }
  }, [phase, onTimerUpdate]);

  // Track when we enter meditation phase (playback starts)
  useEffect(() => {
    if (playback.hasStarted && phase === 'idle') {
      setPhase('meditation');
    }
  }, [playback.hasStarted, phase]);

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
      // Fade out → advance → fade in
      setIsReflectionVisible(false);
      setTimeout(() => {
        setReflectionStep((prev) => prev + 1);
        setIsReflectionVisible(true);
      }, 400);
    } else {
      // Last reflection screen → transition to journaling
      setIsReflectionVisible(false);
      setTimeout(() => {
        setPhase('journaling');
      }, 400);
    }
  }, [reflectionStep]);

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
    onComplete();
  }, [saveJournalEntry, onComplete]);

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

  // ─── Render: Idle phase ───────────────────────────────────────────────

  if (phase === 'idle' && !playback.isLoading && !playback.hasStarted) {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
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
        </ModuleLayout>

        <ModuleControlBar
          phase="idle"
          primary={{ label: 'Begin', onClick: handleBeginWithTransition }}
          showBack={false}
          showSkip={true}
          onSkip={onSkip}
          skipConfirmMessage="Skip this meditation?"
        />

        <DurationPicker
          isOpen={showDurationPicker}
          onClose={() => setShowDurationPicker(false)}
          onSelect={setSelectedDuration}
          currentDuration={selectedDuration}
          durationSteps={meditation.durationSteps}
          minDuration={meditation.minDuration / 60}
          maxDuration={meditation.maxDuration / 60}
        />
      </>
    );
  }

  // ─── Render: Loading state ────────────────────────────────────────────

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
          phase="loading"
          primary={{ label: 'Preparing...', onClick: () => {}, disabled: true }}
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
                className="text-[var(--color-text-primary)] mb-4"
                style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none', fontSize: '18px', marginTop: 0 }}
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
              <MuteButton
                isMuted={playback.audio.isMuted}
                onToggle={playback.audio.toggleMute}
              />
            }
          />
        </>
      );
    }

    // Meditation completed — brief interstitial before reflection
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <div className="text-center animate-fadeIn space-y-4">
            <h2
              className="text-[var(--color-text-primary)]"
              style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none', fontSize: '18px' }}
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
          primary={playback.getPrimaryButton()}
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
          <div className={`pt-6 transition-opacity duration-[400ms] ${isReflectionVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div key={reflectionStep} className="animate-fadeIn">
              <h2
                className="text-[var(--color-text-primary)] text-xl mb-6"
                style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
              >
                {screen.header}
              </h2>

              <div className="space-y-4">
                {screen.body.map((paragraph, i) => (
                  <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handleReflectionContinue }}
          showBack={false}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining reflection and journaling?"
        />
      </>
    );
  }

  // ─── Render: Journaling phase ─────────────────────────────────────────

  if (phase === 'journaling') {
    const hasContent = journalEntry1.trim() || journalEntry2.trim();

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm', padding: 'normal' }}>
          <div className="space-y-6 animate-fadeIn pt-6" style={{ paddingBottom: '8rem' }}>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
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
                  placeholder="What kinds of thoughts came during the meditation? Was there anything that kept returning, or anything surprising?"
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
                  placeholder="Was it easy or hard to let thoughts float by? Were some thoughts stickier than others? What did you notice about the experience of watching rather than thinking?"
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
            label: 'Save & Continue',
            onClick: handleJournalingSave,
            disabled: !hasContent,
          }}
          showBack={false}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip journaling?"
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

/**
 * StayWithItModule Component
 *
 * A reconsolidation-based guided meditation with seven phases:
 * 1. Audio-guided meditation (useMeditationPlayback — same as OpenAwareness/BodyScan)
 * 2. Check-in selector (5 single-select options)
 * 3. Tailored response (content adapts based on check-in selection)
 * 4. Psychoeducation (7 step-through text screens about reconsolidation)
 * 5. Journaling exercise (3 open text prompts saved to journal store)
 * 6. Closing screen (AsciiDiamond animation + summary)
 *
 * Variable duration: 10-25 min meditation via expandable silence + conditional prompts
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
import AsciiMoon from '../capabilities/animations/AsciiMoon';
import AsciiDiamond from '../capabilities/animations/AsciiDiamond';
import TranscriptModal, { TranscriptIcon } from '../capabilities/TranscriptModal';
import { EggIcon } from '../../shared/Icons';

// ─── Check-in options ───────────────────────────────────────────────────────

const CHECKIN_OPTIONS = [
  { id: 'lighter', label: 'Lighter, like something loosened' },
  { id: 'still-processing', label: 'Still processing, not sure yet' },
  { id: 'heavy', label: 'Heavy or weighed down' },
  { id: 'numb', label: 'Blank or numb' },
  { id: 'activated', label: 'Anxious, restless, or stirred up' },
];

// ─── Tailored response content ──────────────────────────────────────────────

const TAILORED_RESPONSES = {
  lighter: {
    header: 'Something moved',
    paragraphs: [
      'That sense of lightness is often what it feels like when an old pattern loosens its grip. It doesn\u2019t always mean the work is done, but it\u2019s a real signal that something updated. You may notice it continuing to settle over the next few hours or days.',
      'You don\u2019t need to analyze what changed. The shift happened at a level deeper than narrative. Trust it.',
    ],
  },
  'still-processing': {
    header: 'That\u2019s exactly right',
    paragraphs: [
      'Not knowing how you feel after something like this is completely normal. Reconsolidation doesn\u2019t always announce itself in the moment. The shift sometimes only becomes clear hours or days later, once the new pattern has had time to settle.',
      'There\u2019s nothing more you need to do with this right now. Just keep a loose awareness of how you feel over the coming days.',
    ],
  },
  heavy: {
    header: 'Stay with this',
    paragraphs: [
      'Heaviness after turning toward something difficult is not a sign that it didn\u2019t work. It often means you made contact with something real, something your mind has been working to keep at a distance. That contact is the beginning of the process, not the end.',
      'If the weight feels manageable, try to keep some attention on it rather than distracting yourself. This feeling is exactly what needs your presence. If it feels like too much, a grounding exercise or some time with music can help you find your footing before coming back to it.',
    ],
  },
  numb: {
    header: 'Numbness is not nothing',
    paragraphs: [
      'Blankness or numbness can feel like the meditation didn\u2019t land. But numbness is often a signal, not an absence. Your nervous system may still be buffering you from something underneath. The Open MDMA framework calls this dissociation: your brain producing its own opioids to dampen an experience it predicts will be overwhelming.',
      'You haven\u2019t done anything wrong. If you\u2019re up for it, try sitting with the numbness itself for a few more minutes. Treat it like you would any other feeling. It sometimes cracks open into something more specific once you give it steady, patient attention.',
    ],
  },
  activated: {
    header: 'This is your nervous system working',
    paragraphs: [
      'Anxiety, restlessness, or a buzzing intensity after this kind of practice usually means your body entered a fight-or-flight state during the meditation. This happens when you make contact with something your nervous system still registers as a threat, even when you\u2019re objectively safe.',
      'The urge right now might be to move, distract, or do something. If you can, resist that for a moment. The activation itself is workable. Try to stay with the physical sensation of it (the chest tightness, the energy in your limbs, the racing quality) without acting on it. This is the same practice you just did, applied to what\u2019s here right now.',
    ],
  },
};

// ─── Psychoeducation screen content ─────────────────────────────────────────
// Uses '§' for circle spacers and '{schemas}' for accent highlighting

const PSYCHOEDUCATION_SCREENS = [
  {
    header: 'How this works',
    lines: [
      'Your brain is a prediction machine. It builds models of the world: what\u2019s dangerous, who you are, how people will treat you, what you deserve.',
      '§',
      'These predictions run automatically, shaping how you feel and react before you\u2019re even aware of them.',
    ],
  },
  {
    header: '{schemas_header}',
    lines: [
      'These predictions are sometimes called {schemas}. A schema is a deep, automatic belief your brain treats as fact.',
      '\u201cI\u2019m not safe.\u201d',
      '\u201cPeople leave.\u201d',
      '\u201cI\u2019m not enough.\u201d',
      '\u201cI have to perform to be loved.\u201d',
      '§',
      'Schemas aren\u2019t just thoughts. They live in your body. They shape what you notice, what you avoid, and how you feel in situations that trigger them.',
    ],
  },
  {
    header: 'Stuck schemas',
    lines: [
      'Most schemas update naturally as you move through life. But some get stuck. They keep firing long after the original situation has passed.',
      '§',
      'A threat that ended years ago still triggers fear. A belief about yourself that was learned in childhood still runs the show.',
      '§',
      'That\u2019s a lot of what anxiety, depression, and emotional reactivity actually are: schemas that stopped updating.',
    ],
  },
  {
    header: 'The update process',
    lines: [
      'Your brain has a built-in process for updating stuck schemas. It works when two things happen at the same time:',
      '§',
      '{#1} The old schema activates.',
      '{#2} You experience a response that genuinely contradicts it.',
    ],
  },
  {
    header: 'What you just did',
    lines: [
      'That\u2019s what this meditation was for. You activated a schema by turning toward it. And you experienced real safety at the same time.',
      '§',
      'Your nervous system used that contradiction to begin updating the old pattern.',
      '§',
      'The feeling softens not because you forced it, but because your brain received new information.',
    ],
  },
  {
    header: 'This takes time',
    lines: [
      'Some schemas shift in a single sitting. Complex ones, especially those rooted in childhood or built up over years, may need many sessions and sustained attention between them.',
      '§',
      'It\u2019s also common for new schemas to surface after one resolves. That\u2019s not a setback. It\u2019s the next layer becoming accessible, something that was hidden underneath what you just worked through.',
    ],
  },
  {
    header: 'Between sessions',
    lines: [
      'The skill you just practiced does not require a substance. Turning toward a schema and staying with it works anytime.',
      '§',
      'The days and weeks after a session are often when the most progress happens, especially while the afterglow lasts.',
      '§',
      'Notice when your attention avoids certain topics or sensations in daily life. That avoidance is a signal pointing toward something worth turning toward.',
    ],
  },
];

// ─── Render helpers ─────────────────────────────────────────────────────────

/**
 * Renders an array of content lines with circle spacer and accent color support.
 * '§' renders as a single circle spacer.
 * '{schemas}' renders inline text in accent color.
 */
function renderContentLines(lines) {
  return (
    <div className="space-y-0">
      {lines.map((line, i) => {
        // Circle spacer
        if (line === '§') {
          return (
            <div key={i} className="flex justify-center my-4">
              <div className="circle-spacer" />
            </div>
          );
        }
        // Numbered line with accent number — "{#1} text"
        const numMatch = line.match(/^\{#(\d+)\}\s*(.*)/);
        if (numMatch) {
          return (
            <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              <span className="text-[var(--accent)] font-medium">{numMatch[1]}</span>
              {' — '}{numMatch[2]}
            </p>
          );
        }
        // Accent highlighting for "schemas"
        if (line.includes('{schemas}')) {
          const parts = line.split('{schemas}');
          return (
            <p key={i} className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {parts.map((part, j) => (
                <span key={j}>
                  {part}
                  {j < parts.length - 1 && (
                    <span className="text-[var(--accent)]">schemas</span>
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

export default function StayWithItModule({ module, onComplete, onSkip, onProgressUpdate }) {
  const meditation = getMeditationById('stay-with-it');

  // Store integration
  const addEntry = useJournalStore((state) => state.addEntry);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;
  const updateStayWithItCapture = useSessionStore((s) => s.updateStayWithItCapture);

  // Derive hasStarted from store (needed before useSyncedDuration call)
  const meditationPlayback = useSessionStore((state) => state.meditationPlayback);
  const hasStartedFromStore = meditationPlayback.moduleInstanceId === module.instanceId && meditationPlayback.hasStarted;

  // Duration (synced with session store)
  const duration = useSyncedDuration(module, { hasStarted: hasStartedFromStore });

  // ─── State ──────────────────────────────────────────────────────────────

  // Module phase: idle → meditation → checkin → response → psychoeducation → journaling → closing
  const [phase, setPhase] = useState('idle');

  // Voice selection — see BodyScanModule for the canonical pattern.
  const defaultVoiceId = useAppStore((s) => s.preferences?.defaultVoiceId);
  const voices = meditation?.audio?.voices;
  const [selectedVoiceId, setSelectedVoiceId] = useState(() =>
    resolveEffectiveVoiceId(meditation?.audio, defaultVoiceId)
  );
  const activeVoiceRef = useRef(selectedVoiceId);

  // Check-in state
  const [checkInSelection, setCheckInSelection] = useState(null);
  const [isCheckInVisible, setIsCheckInVisible] = useState(true);

  // Tailored response state
  const [isResponseVisible, setIsResponseVisible] = useState(true);

  // Psychoeducation state
  const [psychoedStep, setPsychoedStep] = useState(0);
  const [isPsychoedVisible, setIsPsychoedVisible] = useState(true);
  const [isPsychoedHeaderVisible, setIsPsychoedHeaderVisible] = useState(false);

  // Journaling state
  const [journalEntry1, setJournalEntry1] = useState('');
  const [journalEntry2, setJournalEntry2] = useState('');
  const [journalEntry3, setJournalEntry3] = useState('');
  const [juxtaposition1, setJuxtaposition1] = useState('');
  const [juxtaposition2, setJuxtaposition2] = useState('');
  const [journalingPage, setJournalingPage] = useState(0); // 0 = prompts, 1 = juxtaposition
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

    // Calculate silence multiplier for this duration, using the selected
    // voice's clip durations so the target is met when an alternate voice
    // is picked.
    const silenceMultiplier = calculateSilenceMultiplier(
      filteredPrompts,
      durationSeconds,
      'stay-with-it',
      selectedVoiceId,
    );

    // Generate timed sequence — voiceId here also drives audio URL
    // resolution via resolveVoiceBasePath.
    const sequence = generateTimedSequence(filteredPrompts, silenceMultiplier, {
      audioConfig: meditation.audio,
      voiceId: selectedVoiceId,
    });

    const total = sequence.length > 0 ? sequence[sequence.length - 1].endTime : durationSeconds;
    return [sequence, total];
  }, [meditation, duration.selected, selectedVoiceId]);

  // ─── Meditation completion → check-in transition ────────────────────────

  const handleMeditationComplete = useCallback(() => {
    setPhase('checkin');
    setIsCheckInVisible(true);
  }, []);

  const handleMeditationSkip = useCallback(() => {
    // Skipping during meditation still advances to check-in
    setPhase('checkin');
    setIsCheckInVisible(true);
  }, []);

  // Shared playback hook — onComplete wired to transition, not module completion
  const playback = useMeditationPlayback({
    meditationId: 'stay-with-it',
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
    if (phase === 'checkin' || phase === 'response' || phase === 'psychoeducation' ||
        phase === 'journaling' || phase === 'closing') {
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

  // Sync the idle-screen voice pill with the global default preference
  // (skips once playback has started so an in-flight session isn't
  // disturbed). See BodyScanModule for the canonical pattern.
  useEffect(() => {
    if (playback.hasStarted) return;
    const nextEffective = resolveEffectiveVoiceId(meditation?.audio, defaultVoiceId);
    if (nextEffective && nextEffective !== selectedVoiceId) {
      setSelectedVoiceId(nextEffective);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally not re-running when selectedVoiceId changes locally
  }, [defaultVoiceId, playback.hasStarted, meditation]);

  // Begin → idle-leaving → preparing (loading screen) → preparing-leaving →
  // active. The composer reads the voice-aware timedSequence during the
  // loading screen window.
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

  // ─── Check-in navigation ─────────────────────────────────────────────

  const handleCheckInContinue = useCallback(() => {
    setIsCheckInVisible(false);
    setTimeout(() => {
      setPhase('response');
      setIsResponseVisible(true);
    }, 400);
  }, []);

  // ─── Tailored response navigation ────────────────────────────────────

  const handleResponseContinue = useCallback(() => {
    setIsResponseVisible(false);
    setTimeout(() => {
      setPhase('psychoeducation');
      setPsychoedStep(0);
      setIsPsychoedVisible(true);
      setIsPsychoedHeaderVisible(true);
    }, 400);
  }, []);

  const handleBackToCheckIn = useCallback(() => {
    setIsResponseVisible(false);
    setTimeout(() => {
      setPhase('checkin');
      setIsCheckInVisible(true);
    }, 400);
  }, []);

  // ─── Psychoeducation navigation ──────────────────────────────────────

  const handlePsychoedContinue = useCallback(() => {
    if (psychoedStep < PSYCHOEDUCATION_SCREENS.length - 1) {
      // Fade out body only → advance → fade in body
      setIsPsychoedVisible(false);
      setTimeout(() => {
        setPsychoedStep((prev) => prev + 1);
        setIsPsychoedVisible(true);
      }, 400);
    } else {
      // Last psychoeducation screen → fade out header + body → transition to journaling
      setIsPsychoedVisible(false);
      setIsPsychoedHeaderVisible(false);
      setTimeout(() => {
        setPhase('journaling');
      }, 400);
    }
  }, [psychoedStep]);

  const handlePsychoedBack = useCallback(() => {
    if (psychoedStep > 0) {
      setIsPsychoedVisible(false);
      setTimeout(() => {
        setPsychoedStep((prev) => prev - 1);
        setIsPsychoedVisible(true);
      }, 400);
    } else {
      // At step 0, back goes to response
      setIsPsychoedVisible(false);
      setIsPsychoedHeaderVisible(false);
      setTimeout(() => {
        setPhase('response');
        setIsResponseVisible(true);
      }, 400);
    }
  }, [psychoedStep]);

  // ─── Back navigation from journaling/closing ──────────────────────────

  const handleBackToPsychoeducation = useCallback(() => {
    setPhase('psychoeducation');
    setPsychoedStep(PSYCHOEDUCATION_SCREENS.length - 1);
    setIsPsychoedVisible(true);
    setIsPsychoedHeaderVisible(true);
  }, []);

  const handleBackToJournaling = useCallback(() => {
    setIsClosingVisible(false);
    setTimeout(() => {
      setPhase('journaling');
      setJournalingPage(1); // Return to juxtaposition page
    }, 400);
  }, []);

  const handleJournalingBack = useCallback(() => {
    if (journalingPage === 1) {
      // Juxtaposition → prompts
      setIsJournalingVisible(false);
      setTimeout(() => {
        setJournalingPage(0);
        setIsJournalingVisible(true);
      }, 400);
    } else {
      // Prompts → psychoeducation
      handleBackToPsychoeducation();
    }
  }, [journalingPage, handleBackToPsychoeducation]);

  // ─── Closing complete ─────────────────────────────────────────────────

  const handleClosingComplete = useCallback(() => {
    // Save check-in response to store
    if (checkInSelection) {
      updateStayWithItCapture('checkInResponse', checkInSelection);
      updateStayWithItCapture('completedAt', Date.now());
    }

    setIsClosingVisible(false);
    setTimeout(() => {
      onComplete();
    }, 400);
  }, [checkInSelection, updateStayWithItCapture, onComplete]);

  // ─── Journaling save & complete ───────────────────────────────────────

  const saveJournalEntry = useCallback(() => {
    const timestamp = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    let content = 'STAY WITH IT\n';

    content += `\nWhat was most present during the meditation?\n`;
    content += journalEntry1.trim() ? `${journalEntry1.trim()}\n` : `[no entry — ${timestamp}]\n`;

    content += `\nWas there a moment where your attention pulled away?\n`;
    content += journalEntry2.trim() ? `${journalEntry2.trim()}\n` : `[no entry — ${timestamp}]\n`;

    content += `\nWhat's different now compared to when you started?\n`;
    content += journalEntry3.trim() ? `${journalEntry3.trim()}\n` : `[no entry — ${timestamp}]\n`;

    content += `\nJuxtaposition Exercise\n`;
    content += `Part of me knows... `;
    content += juxtaposition1.trim() ? `${juxtaposition1.trim()}\n` : `[no entry — ${timestamp}]\n`;
    content += `And at the same time, I also know... `;
    content += juxtaposition2.trim() ? `${juxtaposition2.trim()}\n` : `[no entry — ${timestamp}]\n`;

    addEntry({
      content: content.trim(),
      source: 'session',
      sessionId,
      moduleTitle: 'Stay With It',
    });
  }, [journalEntry1, journalEntry2, journalEntry3, juxtaposition1, juxtaposition2, addEntry, sessionId]);

  const handleJournalingContinue = useCallback(() => {
    if (journalingPage === 0) {
      // Prompts page → juxtaposition page
      setIsJournalingVisible(false);
      setTimeout(() => {
        setJournalingPage(1);
        setIsJournalingVisible(true);
      }, 400);
    } else {
      // Juxtaposition page → save + closing
      saveJournalEntry();
      setIsJournalingVisible(false);
      setTimeout(() => {
        setPhase('closing');
        setIsClosingVisible(true);
        setIsJournalingVisible(true); // Reset for potential back navigation
        setJournalingPage(0); // Reset for potential back navigation
      }, 400);
    }
  }, [journalingPage, saveJournalEntry]);

  // ─── Module-level skip (saves any journal content + check-in) ──────────

  const handleModuleSkip = useCallback(() => {
    saveJournalEntry();
    // Save check-in if user got past that phase
    if (checkInSelection) {
      updateStayWithItCapture('checkInResponse', checkInSelection);
      updateStayWithItCapture('completedAt', Date.now());
    }
    onSkip();
  }, [saveJournalEntry, checkInSelection, updateStayWithItCapture, onSkip]);

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

  // ─── Render: Check-in phase ───────────────────────────────────────────

  if (phase === 'checkin') {
    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 transition-opacity duration-[400ms] ${isCheckInVisible ? 'opacity-100' : 'opacity-0'}`}>
            <h2
              className="text-xl font-light mb-2 text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              How are you feeling right now?
            </h2>

            <p className="text-[var(--color-text-secondary)] text-xs text-center mb-6">
              There&apos;s no right answer. Just pick whichever feels closest.
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
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{
            label: 'Continue',
            onClick: handleCheckInContinue,
            disabled: !checkInSelection,
          }}
          showBack={false}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── Render: Tailored response phase ──────────────────────────────────

  if (phase === 'response') {
    const responseContent = TAILORED_RESPONSES[checkInSelection];

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className={`pt-6 animate-fadeIn transition-opacity duration-[400ms] ${isResponseVisible ? 'opacity-100' : 'opacity-0'}`}>
            <h2
              className="text-xl font-light mb-6 text-center"
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
          primary={{ label: 'Continue', onClick: handleResponseContinue }}
          showBack={true}
          onBack={handleBackToCheckIn}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content?"
        />
      </>
    );
  }

  // ─── Render: Psychoeducation phase ────────────────────────────────────

  if (phase === 'psychoeducation') {
    const screen = PSYCHOEDUCATION_SCREENS[psychoedStep];

    // Render screen header — handle accent color for "Schemas"
    const renderScreenHeader = () => {
      if (!screen.header) return null;
      if (screen.header === '{schemas_header}') {
        return (
          <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-3">
            a new handle
          </p>
        );
      }
      return (
        <p className="text-[var(--color-text-secondary)] text-xs uppercase tracking-wider mb-3">
          {screen.header}
        </p>
      );
    };

    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm' }}>
          <div className="pt-2">
            {/* Header + animation — persistent across steps */}
            <div className={`transition-opacity duration-[400ms] ${
              isPsychoedHeaderVisible ? 'opacity-100' : 'opacity-0'
            }`}>
              <h2
                className="text-xl font-light mb-2 text-center"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                Stay With It
              </h2>

              <div className="flex justify-center mb-4">
                <AsciiMoon />
              </div>
            </div>

            {/* Body text — fades out/in on each step change */}
            <div className={`transition-opacity duration-[400ms] ${isPsychoedVisible ? 'opacity-100' : 'opacity-0'}`}>
              <div key={psychoedStep} className="animate-fadeIn">
                {renderScreenHeader()}
                {renderContentLines(screen.lines)}
              </div>
            </div>
          </div>
        </ModuleLayout>

        <ModuleControlBar
          phase="active"
          primary={{ label: 'Continue', onClick: handlePsychoedContinue }}
          showBack={true}
          onBack={handlePsychoedBack}
          showSkip={true}
          onSkip={handleModuleSkip}
          skipConfirmMessage="Skip the remaining content and journaling?"
        />
      </>
    );
  }

  // ─── Render: Journaling phase ─────────────────────────────────────────

  if (phase === 'journaling') {
    // Page 0: Three journaling prompts
    if (journalingPage === 0) {
      return (
        <>
          <ModuleLayout layout={{ centered: false, maxWidth: 'sm', padding: 'normal' }}>
            <div className={`space-y-6 pt-6 animate-fadeIn transition-opacity duration-[400ms] ${isJournalingVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '8rem' }}>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                Take a moment to write. Whatever comes to mind. No need for complete sentences.
              </p>

              <div className="space-y-5">
                {/* Prompt 1 */}
                <div>
                  <p className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider mb-1">
                    What was most present for you during the meditation?
                  </p>
                  <textarea
                    value={journalEntry1}
                    onChange={(e) => setJournalEntry1(e.target.value)}
                    placeholder="Describe what came up, even if it's hard to put into words..."
                    rows={3}
                    className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                      focus:outline-none focus:border-[var(--accent)]
                      text-[var(--color-text-primary)] text-sm leading-relaxed
                      placeholder:text-[var(--color-text-tertiary)] resize-none"
                  />
                </div>

                {/* Prompt 2 */}
                <div>
                  <p className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider mb-1">
                    Was there a moment where your attention pulled away, went blank, or wanted to be somewhere else?
                  </p>
                  <textarea
                    value={journalEntry2}
                    onChange={(e) => setJournalEntry2(e.target.value)}
                    placeholder="Any moments of blankness, restlessness, distraction, or checking out..."
                    rows={3}
                    className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                      focus:outline-none focus:border-[var(--accent)]
                      text-[var(--color-text-primary)] text-sm leading-relaxed
                      placeholder:text-[var(--color-text-tertiary)] resize-none"
                  />
                </div>

                {/* Prompt 3 */}
                <div>
                  <p className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider mb-1">
                    What&apos;s different now compared to when you started? What stayed the same?
                  </p>
                  <textarea
                    value={journalEntry3}
                    onChange={(e) => setJournalEntry3(e.target.value)}
                    placeholder="What shifted, what stayed, what you'd like to revisit..."
                    rows={3}
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
              onClick: handleJournalingContinue,
            }}
            showBack={true}
            onBack={handleJournalingBack}
            showSkip={true}
            onSkip={handleModuleSkip}
            skipConfirmMessage="Skip journaling?"
          />
        </>
      );
    }

    // Page 1: Juxtaposition Exercise
    return (
      <>
        <ModuleLayout layout={{ centered: false, maxWidth: 'sm', padding: 'normal' }}>
          <div className={`space-y-0 pt-6 animate-fadeIn transition-opacity duration-[400ms] ${isJournalingVisible ? 'opacity-100' : 'opacity-0'}`} style={{ paddingBottom: '8rem' }}>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              Sometimes, after turning toward a difficult feeling, you find yourself holding two things that both feel true: an old knowing and a newer one that doesn&apos;t quite fit with it.
            </p>

            <div className="flex justify-center my-4">
              <div className="circle-spacer" />
            </div>

            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              That tension is not a problem. It&apos;s the conditions under which deep patterns actually change.
            </p>
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed mt-4">
              If you&apos;re holding something like that right now, see if you can put both sides into words.
            </p>

            <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed mt-4 mb-6">
              If nothing like this is present, skip this and come back to it whenever.
            </p>

            <div className="space-y-5">
              <div>
                <p className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider mb-1">
                  Part of me knows...
                </p>
                <textarea
                  value={juxtaposition1}
                  onChange={(e) => setJuxtaposition1(e.target.value)}
                  rows={3}
                  className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                    focus:outline-none focus:border-[var(--accent)]
                    text-[var(--color-text-primary)] text-sm leading-relaxed
                    placeholder:text-[var(--color-text-tertiary)] resize-none"
                />
              </div>

              <div>
                <p className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider mb-1">
                  And at the same time, I also know...
                </p>
                <textarea
                  value={juxtaposition2}
                  onChange={(e) => setJuxtaposition2(e.target.value)}
                  rows={3}
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
            onClick: handleJournalingContinue,
          }}
          showBack={true}
          onBack={handleJournalingBack}
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
              Well done.
            </h2>

            <div className="flex justify-center mb-6">
              <AsciiDiamond />
            </div>

            <div className="space-y-0">
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                What you just practiced is the most direct form of this work. Everything else, the breathing exercises, the body scans, the journaling, the frameworks, is in service of what you did here: feeling something fully and letting it update.
              </p>
              <div className="flex justify-center my-4">
                <div className="circle-spacer" />
              </div>
              <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
                This skill is yours now. You can use it anytime, with or without the substance. Whenever a feeling arises that you&apos;d normally avoid, you have the option of turning toward it instead.
              </p>
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

/**
 * OpenAwarenessModule Component
 *
 * A Vipassana-inspired guided meditation with:
 * - Pre-recorded TTS audio for each prompt
 * - Text that fades in shortly after audio begins
 * - Variable duration support (10-30 minutes)
 * - Conditional prompts for longer sessions (20+ min)
 * - Graceful fallback to text-only if audio unavailable
 *
 * Audio-Text Synchronization:
 * - Audio starts immediately when prompt triggers
 * - Text fades in 200ms after audio starts (audio "leads")
 * - Text fades out 2 seconds into silence period
 * - Falls back to estimated timing if audio unavailable
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getModuleById } from '../../../content/modules';
import { useSessionStore } from '../../../stores/useSessionStore';
import {
  getMeditationById,
  calculateSilenceMultiplier,
} from '../../../content/meditations';
import { useAudioPlayback } from '../../../hooks/useAudioPlayback';
import { useWakeLock } from '../../../hooks/useWakeLock';

// Shared UI components
import ModuleLayout, { CompletionScreen, IdleScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar, { MuteButton } from '../capabilities/ModuleControlBar';
import DurationPicker from '../../shared/DurationPicker';

// Constants
const TEXT_FADE_IN_DELAY = 200;           // ms after audio starts before text fades in
const TEXT_FADE_OUT_INTO_SILENCE = 2000;  // ms into silence before text fades out
const SPEAKING_RATE = 150;                // words per minute (fallback timing)
const PROMPT_DISPLAY_DURATION = 8000;     // ms to show text if no audio (fallback)

export default function OpenAwarenessModule({ module, onComplete, onSkip, onTimerUpdate }) {
  // Get meditation content
  const libraryModule = getModuleById(module.libraryId);
  const meditation = getMeditationById('open-awareness');

  // Session store for persistent playback state
  const meditationPlayback = useSessionStore(state => state.meditationPlayback);
  const startMeditationPlayback = useSessionStore(state => state.startMeditationPlayback);
  const pauseMeditationPlayback = useSessionStore(state => state.pauseMeditationPlayback);
  const resumeMeditationPlayback = useSessionStore(state => state.resumeMeditationPlayback);
  const resetMeditationPlayback = useSessionStore(state => state.resetMeditationPlayback);

  // Duration selection
  const [selectedDuration, setSelectedDuration] = useState(
    module.duration || libraryModule?.defaultDuration || 10
  );
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  // Check if this module's playback is active
  const isThisModule = meditationPlayback.moduleInstanceId === module.instanceId;
  const hasStarted = isThisModule && meditationPlayback.hasStarted;
  const isPlaying = isThisModule && meditationPlayback.isPlaying;

  // Prompt display state
  const [currentPromptIndex, setCurrentPromptIndex] = useState(-1);
  const [promptPhase, setPromptPhase] = useState('hidden'); // 'hidden' | 'fading-in' | 'visible' | 'fading-out'
  const [elapsedTime, setElapsedTime] = useState(0);

  // Refs for tracking
  const lastAudioPromptRef = useRef(-1);
  const textFadeTimeoutRef = useRef(null);
  const timerRef = useRef(null);

  // Keep screen awake during active meditation
  useWakeLock(hasStarted && isPlaying);

  // Audio playback hook
  const audio = useAudioPlayback({
    onEnded: () => {
      // Audio finished - fade out text after delay into silence
      if (textFadeTimeoutRef.current) {
        clearTimeout(textFadeTimeoutRef.current);
      }
      textFadeTimeoutRef.current = setTimeout(() => {
        setPromptPhase('fading-out');
      }, TEXT_FADE_OUT_INTO_SILENCE);
    },
    onError: (e) => {
      console.warn('Audio playback error:', e);
      // Continue with text-only fallback - fade out after estimated duration
      if (textFadeTimeoutRef.current) {
        clearTimeout(textFadeTimeoutRef.current);
      }
      textFadeTimeoutRef.current = setTimeout(() => {
        setPromptPhase('fading-out');
      }, PROMPT_DISPLAY_DURATION);
    },
  });

  // Filter prompts based on selected duration and generate timed sequence
  const [timedSequence, totalDuration] = useMemo(() => {
    if (!meditation) return [[], 0];

    const durationMinutes = selectedDuration;
    const durationSeconds = durationMinutes * 60;

    // Filter out conditional prompts that don't meet duration requirements
    const filteredPrompts = meditation.prompts.filter(prompt => {
      if (!prompt.conditional) return true;
      if (prompt.conditional.minDuration && durationMinutes < prompt.conditional.minDuration) {
        return false;
      }
      return true;
    });

    // Calculate silence multiplier for this duration
    const silenceMultiplier = calculateSilenceMultiplier(filteredPrompts, durationSeconds);

    // Generate timed sequence
    let currentTime = 0;
    const sequence = filteredPrompts.map(prompt => {
      const wordCount = prompt.text.split(' ').length;
      const speakingDuration = (wordCount / SPEAKING_RATE) * 60;

      let silenceDuration = prompt.baseSilenceAfter;
      if (prompt.silenceExpandable) {
        const expanded = prompt.baseSilenceAfter * silenceMultiplier;
        silenceDuration = Math.min(expanded, prompt.silenceMax || expanded);
      }

      const entry = {
        id: prompt.id,
        text: prompt.text,
        startTime: currentTime,
        speakingDuration,
        silenceDuration,
        endTime: currentTime + speakingDuration + silenceDuration,
        audioSrc: meditation.audio
          ? `${meditation.audio.basePath}${prompt.id}.${meditation.audio.format}`
          : null,
      };

      currentTime = entry.endTime;
      return entry;
    });

    const total = sequence.length > 0 ? sequence[sequence.length - 1].endTime : durationSeconds;

    return [sequence, total];
  }, [meditation, selectedDuration]);

  // Preload first few audio files on mount/duration change
  useEffect(() => {
    if (timedSequence.length > 0 && meditation?.audio) {
      const firstFewSrcs = timedSequence.slice(0, 3)
        .map(p => p.audioSrc)
        .filter(Boolean);
      audio.preload(firstFewSrcs);
    }
  }, [timedSequence, meditation?.audio, audio]);

  // Timer update effect (timestamp-based for accuracy)
  useEffect(() => {
    if (!isPlaying || !meditationPlayback.startedAt) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const currentSegment = (now - meditationPlayback.startedAt) / 1000;
      const newElapsed = (meditationPlayback.accumulatedTime || 0) + currentSegment;
      setElapsedTime(newElapsed);

      // Check for completion
      if (newElapsed >= totalDuration && totalDuration > 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        pauseMeditationPlayback();
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, meditationPlayback.startedAt, meditationPlayback.accumulatedTime, totalDuration, pauseMeditationPlayback]);

  // Recalculate elapsed on resume (when returning to tab)
  useEffect(() => {
    if (!isThisModule || !meditationPlayback.hasStarted) return;

    const { startedAt, accumulatedTime } = meditationPlayback;

    if (!startedAt) {
      // Paused - use accumulated time
      setElapsedTime(accumulatedTime || 0);
    }
  }, [isThisModule, meditationPlayback.hasStarted, meditationPlayback.startedAt, meditationPlayback.accumulatedTime]);

  // Prompt progression based on elapsed time
  useEffect(() => {
    if (!hasStarted || timedSequence.length === 0) return;

    // Find which prompt should be active
    let targetIndex = -1;
    for (let i = 0; i < timedSequence.length; i++) {
      if (elapsedTime >= timedSequence[i].startTime) {
        targetIndex = i;
      }
    }

    // If we've moved to a new prompt
    if (targetIndex !== currentPromptIndex && targetIndex >= 0) {
      setCurrentPromptIndex(targetIndex);

      // Start audio for new prompt (if not already played)
      if (targetIndex !== lastAudioPromptRef.current) {
        lastAudioPromptRef.current = targetIndex;
        const prompt = timedSequence[targetIndex];

        // Clear any pending fade timeout
        if (textFadeTimeoutRef.current) {
          clearTimeout(textFadeTimeoutRef.current);
          textFadeTimeoutRef.current = null;
        }

        // Try to play audio
        if (prompt.audioSrc && !audio.isMuted) {
          audio.loadAndPlay(prompt.audioSrc);
        }

        // Fade in text after slight delay (audio leads)
        setPromptPhase('hidden');
        setTimeout(() => {
          setPromptPhase('fading-in');
          setTimeout(() => setPromptPhase('visible'), 300);
        }, TEXT_FADE_IN_DELAY);

        // If no audio or muted, set fallback fade-out timer
        if (!prompt.audioSrc || audio.isMuted) {
          textFadeTimeoutRef.current = setTimeout(() => {
            setPromptPhase('fading-out');
          }, PROMPT_DISPLAY_DURATION);
        }

        // Preload next audio
        if (targetIndex + 1 < timedSequence.length) {
          const nextSrc = timedSequence[targetIndex + 1].audioSrc;
          if (nextSrc) audio.preload([nextSrc]);
        }
      }
    }
  }, [elapsedTime, hasStarted, timedSequence, currentPromptIndex, audio]);

  // Report timer state to parent for ModuleStatusBar
  useEffect(() => {
    if (!onTimerUpdate) return;

    const progress = totalDuration > 0 ? Math.min((elapsedTime / totalDuration) * 100, 100) : 0;
    const isComplete = elapsedTime >= totalDuration && totalDuration > 0 && hasStarted;

    onTimerUpdate({
      progress,
      elapsed: elapsedTime,
      total: totalDuration,
      showTimer: hasStarted && !isComplete,
      isPaused: !isPlaying,
    });
  }, [elapsedTime, totalDuration, hasStarted, isPlaying, onTimerUpdate]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (textFadeTimeoutRef.current) {
        clearTimeout(textFadeTimeoutRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Handlers
  const handleStart = useCallback(() => {
    startMeditationPlayback(module.instanceId);
    setElapsedTime(0);
    setCurrentPromptIndex(-1);
    lastAudioPromptRef.current = -1;
    setPromptPhase('hidden');
  }, [module.instanceId, startMeditationPlayback]);

  const handlePauseResume = useCallback(() => {
    if (isPlaying) {
      pauseMeditationPlayback();
      audio.pause();
    } else {
      resumeMeditationPlayback();
      // Resume audio if it was playing
      if (audio.currentSrc && !audio.isMuted) {
        audio.resume();
      }
    }
  }, [isPlaying, pauseMeditationPlayback, resumeMeditationPlayback, audio]);

  const handleComplete = useCallback(() => {
    resetMeditationPlayback();
    audio.stop();
    onComplete();
  }, [resetMeditationPlayback, audio, onComplete]);

  const handleSkip = useCallback(() => {
    resetMeditationPlayback();
    audio.stop();
    onSkip();
  }, [resetMeditationPlayback, audio, onSkip]);

  const handleDurationChange = useCallback((newDuration) => {
    setSelectedDuration(newDuration);
  }, []);

  // Determine phases
  const isComplete = elapsedTime >= totalDuration && totalDuration > 0 && hasStarted;
  const currentPrompt = timedSequence[currentPromptIndex];

  const getPhase = () => {
    if (!hasStarted) return 'idle';
    if (isComplete) return 'completed';
    return 'active';
  };

  const getPrimaryButton = () => {
    const phase = getPhase();

    if (phase === 'idle') {
      return { label: 'Begin', onClick: handleStart };
    }
    if (phase === 'active') {
      return { label: isPlaying ? 'Pause' : 'Resume', onClick: handlePauseResume };
    }
    if (phase === 'completed') {
      return { label: 'Continue', onClick: handleComplete };
    }
    return null;
  };

  // Fallback if no meditation found
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

  // Render
  return (
    <>
      <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
        {/* Idle state */}
        {!hasStarted && (
          <div className="text-center animate-fadeIn">
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
        )}

        {/* Active state - prompt display */}
        {hasStarted && !isComplete && (
          <div className="text-center px-4">
            {/* Paused indicator */}
            {!isPlaying && (
              <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider mb-4 animate-pulse">
                Paused
              </p>
            )}

            {/* Prompt text */}
            <p
              className={`text-[var(--color-text-secondary)] text-sm leading-relaxed transition-opacity duration-300 ${
                promptPhase === 'visible' || promptPhase === 'fading-in' ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {currentPrompt?.text || ''}
            </p>
          </div>
        )}

        {/* Completed state */}
        {isComplete && <CompletionScreen />}
      </ModuleLayout>

      {/* Control bar */}
      <ModuleControlBar
        phase={getPhase()}
        primary={getPrimaryButton()}
        showSkip={!isComplete}
        onSkip={handleSkip}
        skipConfirmMessage="Skip this meditation?"
        rightSlot={
          hasStarted && !isComplete ? (
            <MuteButton
              isMuted={audio.isMuted}
              onToggle={audio.toggleMute}
            />
          ) : null
        }
      />

      {/* Duration picker modal */}
      <DurationPicker
        isOpen={showDurationPicker}
        onClose={() => setShowDurationPicker(false)}
        onSelect={handleDurationChange}
        currentDuration={selectedDuration}
        durationSteps={meditation.durationSteps}
        minDuration={meditation.minDuration / 60}
        maxDuration={meditation.maxDuration / 60}
      />
    </>
  );
}

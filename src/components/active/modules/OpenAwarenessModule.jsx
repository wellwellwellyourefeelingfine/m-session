/**
 * OpenAwarenessModule Component
 *
 * A Vipassana-inspired guided meditation with:
 * - Pre-recorded TTS audio for each prompt
 * - Variable duration support (10-30 minutes)
 * - Conditional prompts for longer sessions (20+ min)
 * - Audio-text sync via shared useMeditationPlayback hook
 */

import { useState, useMemo } from 'react';
import { getModuleById } from '../../../content/modules';
import {
  getMeditationById,
  calculateSilenceMultiplier,
  generateTimedSequence,
} from '../../../content/meditations';
import { useMeditationPlayback } from '../../../hooks/useMeditationPlayback';

// Shared UI components
import ModuleLayout, { CompletionScreen, IdleScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar, { MuteButton, SlotButton } from '../capabilities/ModuleControlBar';
import MorphingShapes from '../capabilities/animations/MorphingShapes';
import DurationPicker from '../../shared/DurationPicker';

export default function OpenAwarenessModule({ module, onComplete, onSkip, onTimerUpdate }) {
  const libraryModule = getModuleById(module.libraryId);
  const meditation = getMeditationById('open-awareness');

  // Duration selection
  const [selectedDuration, setSelectedDuration] = useState(
    module.duration || libraryModule?.defaultDuration || 10
  );
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);

  // Build timed sequence (unique to this module: conditional filtering + silence expansion)
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

  // Shared playback hook handles timer, audio-text sync, prompt progression, etc.
  const playback = useMeditationPlayback({
    meditationId: 'open-awareness',
    moduleInstanceId: module.instanceId,
    timedSequence,
    totalDuration,
    onComplete,
    onSkip,
    onTimerUpdate,
  });

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

  return (
    <>
      <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
        {/* Idle state */}
        {!playback.hasStarted && (
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

        {/* Active state - title, animation, prompt display */}
        {playback.hasStarted && !playback.isComplete && (
          <div className="flex flex-col items-center text-center px-4 pt-8">
            {/* Fixed top section: title + animation */}
            <h2 className="text-[var(--color-text-primary)] mb-6">
              {meditation.title}
            </h2>

            {showAnimation && (
              <div className="mb-8 animate-fadeIn">
                <MorphingShapes size={64} strokeWidth={1} duration={8} />
              </div>
            )}

            {/* Spacer to push prompt text down */}
            <div className="flex-1 min-h-[80px]" />

            {/* Prompt text area - fixed position, doesn't affect layout above */}
            <div className="w-full">
              {/* Paused indicator */}
              {!playback.isPlaying && (
                <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider mb-4 animate-pulse">
                  Paused
                </p>
              )}

              <p
                className={`text-[var(--color-text-secondary)] text-sm leading-relaxed transition-opacity duration-300 ${
                  playback.promptPhase === 'visible' || playback.promptPhase === 'fading-in' ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {playback.currentPrompt?.text || ''}
              </p>
            </div>
          </div>
        )}

        {/* Completed state */}
        {playback.isComplete && <CompletionScreen />}
      </ModuleLayout>

      {/* Control bar */}
      <ModuleControlBar
        phase={playback.getPhase()}
        primary={playback.getPrimaryButton()}
        showSkip={!playback.isComplete}
        onSkip={playback.handleSkip}
        skipConfirmMessage="Skip this meditation?"
        leftSlot={
          playback.hasStarted && !playback.isComplete ? (
            <SlotButton
              icon={<AnimationIcon visible={showAnimation} />}
              label={showAnimation ? 'Hide animation' : 'Show animation'}
              onClick={() => setShowAnimation(!showAnimation)}
              active={showAnimation}
            />
          ) : null
        }
        rightSlot={
          playback.hasStarted && !playback.isComplete ? (
            <MuteButton
              isMuted={playback.audio.isMuted}
              onToggle={playback.audio.toggleMute}
            />
          ) : null
        }
      />

      {/* Duration picker modal */}
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

/**
 * SimpleGroundingModule Component
 *
 * A brief guided grounding meditation with:
 * - 31 pre-recorded TTS audio prompts
 * - Fixed duration (~5 minutes 15 seconds)
 * - No silence expansion, no duration picker, no variations
 * - Audio-text sync via shared useMeditationPlayback hook
 */

import { useState, useMemo } from 'react';
import {
  getMeditationById,
  generateTimedSequence,
} from '../../../content/meditations';
import { useMeditationPlayback } from '../../../hooks/useMeditationPlayback';

// Shared UI components
import ModuleLayout, { CompletionScreen, IdleScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar, { MuteButton, SlotButton } from '../capabilities/ModuleControlBar';
import MorphingShapes from '../capabilities/animations/MorphingShapes';

export default function SimpleGroundingModule({ module, onComplete, onSkip, onTimerUpdate }) {
  const meditation = getMeditationById('simple-grounding');
  const [showAnimation, setShowAnimation] = useState(true);

  // Build timed sequence (fixed duration, no silence expansion — multiplier = 1.0)
  const [timedSequence, totalDuration] = useMemo(() => {
    if (!meditation) return [[], 0];

    const sequence = generateTimedSequence(meditation.prompts, 1.0, {
      speakingRate: meditation.speakingRate || 95,
      audioConfig: meditation.audio,
    });

    // Use the fixed duration for the timer
    return [sequence, meditation.fixedDuration];
  }, [meditation]);

  // Shared playback hook handles timer, audio-text sync, prompt progression, etc.
  const playback = useMeditationPlayback({
    meditationId: 'simple-grounding',
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

            {/* Fixed duration display */}
            <p className="mt-6 text-[var(--color-text-tertiary)] text-sm">
              ~{Math.round(meditation.fixedDuration / 60)} min
            </p>
          </div>
        )}

        {/* Active state — title, animation, prompt display */}
        {playback.hasStarted && !playback.isComplete && (
          <div
            className="relative w-full px-4"
            style={{
              alignSelf: 'stretch',
              minHeight: 'calc(100vh - var(--header-plus-status) - var(--bottom-chrome) - 1rem)',
            }}
          >
            {/* Anchored top section: title + animation — absolutely positioned, never shifts */}
            <div className="flex flex-col items-center text-center">
              <h2
                className="text-[var(--color-text-primary)] mb-4"
                style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none', fontSize: '18px', marginTop: 0 }}
              >
                {meditation.title}
              </h2>

              {showAnimation && (
                <div className="animate-fadeIn">
                  <MorphingShapes size={128} duration={8} />
                </div>
              )}
            </div>

            {/* Prompt text area — centered in remaining space, doesn't affect top elements */}
            <div className="absolute left-0 right-0 px-4 text-center" style={{ top: '55%', transform: 'translateY(-50%)' }}>
              {/* Paused indicator — fixed height so it doesn't shift layout */}
              <div className="h-6 flex items-center justify-center mb-2">
                {!playback.isPlaying && (
                  <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider animate-pulse">
                    Paused
                  </p>
                )}
              </div>

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

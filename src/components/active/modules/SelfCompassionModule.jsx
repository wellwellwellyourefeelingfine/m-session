/**
 * SelfCompassionModule Component
 *
 * A guided self-compassion meditation with 3 variations:
 * - Default: Core practice (~11 min)
 * - Relationship: Core + extending compassion to another (~15 min)
 * - Going Deeper: Core + bringing compassion to something specific (~14 min)
 *
 * Fixed duration per variation (no silence expansion).
 * Variation selector replaces the duration picker.
 * Audio-text sync via shared useMeditationPlayback hook.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  getMeditationById,
  generateTimedSequence,
} from '../../../content/meditations';
import { useMeditationPlayback } from '../../../hooks/useMeditationPlayback';

// Shared UI components
import ModuleLayout, { CompletionScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar, { VolumeButton, SlotButton } from '../capabilities/ModuleControlBar';
import MorphingShapes from '../capabilities/animations/MorphingShapes';

export default function SelfCompassionModule({ module, onComplete, onSkip, onTimerUpdate }) {
  const meditation = getMeditationById('self-compassion');

  // Variation selection (replaces duration picker)
  const [selectedVariation, setSelectedVariation] = useState(
    meditation?.defaultVariation || 'default'
  );
  const [showAnimation, setShowAnimation] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  // Assemble clips for selected variation and generate timed sequence
  const [timedSequence, totalDuration] = useMemo(() => {
    if (!meditation) return [[], 0];

    const clips = meditation.assembleVariation(selectedVariation);
    const variationMeta = meditation.variations[selectedVariation];

    // Generate timed sequence (no silence expansion — multiplier = 1.0)
    const sequence = generateTimedSequence(clips, 1.0, {
      speakingRate: meditation.speakingRate || 150,
      audioConfig: meditation.audio,
    });

    // Use the rounded duration for the timer (pads with trailing silence)
    return [sequence, variationMeta.duration];
  }, [meditation, selectedVariation]);

  // Shared playback hook handles timer, audio-text sync, prompt progression, etc.
  const playback = useMeditationPlayback({
    meditationId: 'self-compassion',
    moduleInstanceId: module.instanceId,
    timedSequence,
    totalDuration,
    onComplete,
    onSkip,
    onTimerUpdate,
  });

  // Fade out idle screen before starting composition
  const handleBeginWithTransition = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => playback.handleStart(), 300);
  }, [playback]);

  // Restart meditation from the beginning
  const handleRestart = useCallback(() => {
    playback.handleRestart();
    setIsLeaving(false);
  }, [playback]);

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
        {/* Idle state — variation selector */}
        {!playback.hasStarted && !playback.isLoading && (
          <div className={`text-center ${isLeaving ? 'animate-fadeOut' : 'animate-fadeIn'}`} style={{ marginTop: '-4rem' }}>
            <div className="text-center space-y-4 animate-fadeIn">
              <h2
                className="font-serif text-2xl text-[var(--color-text-primary)]"
                style={{ textTransform: 'none' }}
              >
                {meditation.title}
              </h2>
              <p className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {meditation.description}
              </p>
            </div>

            {/* Variation selector */}
            <div className="mt-6 space-y-3 max-w-sm mx-auto">
              {Object.values(meditation.variations).map(v => (
                <button
                  key={v.key}
                  onClick={() => setSelectedVariation(v.key)}
                  className={`w-full text-left px-4 py-3 border transition-colors ${
                    selectedVariation === v.key
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--color-text-primary)]">
                        {v.label}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 normal-case tracking-normal font-['DM_Serif_Text']">
                        {v.description}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--color-text-tertiary)] ml-3 flex-shrink-0 mt-0.5">
                      ~{Math.round(v.duration / 60)} min
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading state — composing meditation audio */}
        {playback.isLoading && (
          <div className="text-center animate-fadeIn">
            <p className="text-[var(--color-text-tertiary)] text-sm uppercase tracking-wider">
              Preparing meditation...
            </p>
          </div>
        )}

        {/* Active state — title, animation, paused indicator, prompt display */}
        {playback.hasStarted && !playback.isComplete && (
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

            {/* Paused indicator — below shapes with minimal gap */}
            <div className="h-5 flex items-center justify-center mt-3">
              {!playback.isPlaying && (
                <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider animate-pulse">
                  Paused
                </p>
              )}
            </div>

            {/* Prompt text — below paused indicator */}
            <p
              className={`mt-1 px-4 text-[var(--color-text-secondary)] text-sm leading-relaxed transition-opacity duration-300 ${
                playback.promptPhase === 'visible' || playback.promptPhase === 'fading-in' ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {playback.currentPrompt?.text || ''}
            </p>
          </div>
        )}

        {/* Completed state */}
        {playback.isComplete && (
          <div className="animate-fadeIn">
            <CompletionScreen />
          </div>
        )}
      </ModuleLayout>

      {/* Control bar */}
      <ModuleControlBar
        phase={playback.getPhase()}
        primary={playback.getPhase() === 'idle' || playback.isLoading
          ? { label: 'Begin', onClick: handleBeginWithTransition }
          : playback.getPrimaryButton()
        }
        showBack={playback.hasStarted && !playback.isComplete && !playback.isLoading}
        onBack={handleRestart}
        backConfirmMessage="Restart this meditation from the beginning?"
        showSkip={!playback.isComplete}
        onSkip={playback.handleSkip}
        skipConfirmMessage="Skip this meditation?"
        leftSlot={
          playback.hasStarted && !playback.isComplete && !playback.isLoading ? (
            <SlotButton
              icon={<AnimationIcon visible={showAnimation} />}
              label={showAnimation ? 'Hide animation' : 'Show animation'}
              onClick={() => setShowAnimation(!showAnimation)}
              active={showAnimation}
            />
          ) : null
        }
        rightSlot={
          playback.hasStarted && !playback.isComplete && !playback.isLoading ? (
            <VolumeButton
              volume={playback.audio.volume}
              onVolumeChange={playback.audio.setVolume}
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

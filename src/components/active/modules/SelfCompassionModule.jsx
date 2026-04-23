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

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  getMeditationById,
  generateTimedSequence,
} from '../../../content/meditations';
import { useMeditationPlayback } from '../../../hooks/useMeditationPlayback';
import { useTranscriptModal } from '../../../hooks/useTranscriptModal';
import { useSessionStore } from '../../../stores/useSessionStore';

// Shared UI components
import ModuleLayout, { CompletionScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar, { VolumeButton, SlotButton } from '../capabilities/ModuleControlBar';
import MorphingShapes from '../capabilities/animations/MorphingShapes';
import TranscriptModal, { TranscriptIcon } from '../capabilities/TranscriptModal';
import { EggIcon } from '../../shared/Icons';

export default function SelfCompassionModule({ module, onComplete, onSkip, onProgressUpdate }) {
  const meditation = getMeditationById('self-compassion');

  // Variation selection (replaces duration picker)
  const [selectedVariation, setSelectedVariation] = useState(
    meditation?.defaultVariation || 'default'
  );
  const [isLeaving, setIsLeaving] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  // Transcript modal state
  const { showTranscript, transcriptClosing, handleOpenTranscript, handleCloseTranscript } = useTranscriptModal();

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

  // Transcript prompts and title for the current variation
  const transcriptPrompts = useMemo(() => {
    if (!meditation) return [];
    return meditation.assembleVariation(selectedVariation);
  }, [meditation, selectedVariation]);

  const transcriptTitle = meditation
    ? `${meditation.title} (${meditation.variations[selectedVariation]?.label || selectedVariation})`
    : '';

  // Shared playback hook handles timer, audio-text sync, prompt progression, etc.
  const playback = useMeditationPlayback({
    meditationId: 'self-compassion',
    moduleInstanceId: module.instanceId,
    timedSequence,
    totalDuration,
    onComplete,
    onSkip,
    onProgressUpdate,
  });

  // Fade out idle screen before starting composition
  const handleBeginWithTransition = useCallback(() => {
    useSessionStore.getState().beginModule(module.instanceId);
    setIsLeaving(true);
    setTimeout(() => playback.handleStart(), 300);
  }, [playback, module.instanceId]);

  // Restart meditation from the beginning
  const handleRestart = useCallback(() => {
    playback.handleRestart();
    setIsLeaving(false);
    setShowCompletion(false);
  }, [playback]);

  // Transition from completed meditation screen → CompletionScreen
  const handleContinueToCompletion = useCallback(() => {
    setShowCompletion(true);
  }, []);

  // Final completion — cleanup + advance to next module
  const handleFinalComplete = useCallback(() => {
    playback.handleComplete();
  }, [playback]);

  // Hide timer when entering CompletionScreen
  useEffect(() => {
    if (showCompletion) {
      onProgressUpdate?.({ showTimer: false, progress: 100, elapsed: 0, total: 0, isPaused: false });
    }
  }, [showCompletion, onProgressUpdate]);

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
        {/* Error — audio files missing or failed to load */}
        {playback.error && (
          <div className="text-center animate-fadeIn flex flex-col items-center">
            <EggIcon size={48} className="text-[var(--color-text-tertiary)] mb-4" />
            <p className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider">
              Audio not found.
            </p>
          </div>
        )}

        {/* Idle state — variation selector */}
        {!playback.error && !playback.hasStarted && !playback.isLoading && (
          <div className={`text-center ${isLeaving ? 'animate-fadeOut' : 'animate-fadeIn'}`} style={{ marginTop: '-2rem' }}>
            <div className="text-center space-y-2">
              <h2
                className="text-2xl text-[var(--color-text-primary)]"
                style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
              >
                {meditation.title}
              </h2>
              <p className="text-left text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {meditation.description}
              </p>
            </div>

            {/* Variation selector */}
            <div className="mt-3 space-y-1.5 max-w-sm mx-auto">
              {Object.values(meditation.variations).map(v => (
                <button
                  key={v.key}
                  onClick={() => setSelectedVariation(v.key)}
                  className={`w-full text-left px-4 pt-2 pb-1 border transition-colors ${
                    selectedVariation === v.key
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                      : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--color-text-primary)] font-['DM_Serif_Text'] leading-snug">
                        {v.label}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider leading-tight">
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

        {/* Active/completed state — title, animation, paused indicator, prompt display */}
        {playback.hasStarted && !showCompletion && (
          <div
            className="flex flex-col items-center text-center w-full px-4 animate-fadeIn"
            style={{
              alignSelf: 'stretch',
              minHeight: 'calc(100vh - var(--header-plus-status) - var(--bottom-chrome) - 1rem)',
            }}
          >
            <h2
              className="text-xl font-light text-[var(--color-text-primary)] mb-4"
              style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none', marginTop: 0 }}
            >
              {meditation.title}
            </h2>

            <MorphingShapes />

            {/* Paused indicator — below shapes with minimal gap */}
            <div className="h-5 flex items-center justify-center mt-3">
              {!playback.isPlaying && !playback.isComplete && (
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

        {/* Completed state — "Well done." screen after Continue */}
        {showCompletion && (
          <div className="animate-fadeIn">
            <CompletionScreen />
          </div>
        )}
      </ModuleLayout>

      {/* Control bar */}
      <ModuleControlBar
        phase={playback.getPhase()}
        primary={
          showCompletion
            ? { label: 'Complete', onClick: handleFinalComplete }
            : !playback.hasStarted || playback.isLoading
              ? { label: 'Begin', onClick: handleBeginWithTransition }
              : playback.isComplete
                ? { label: 'Continue', onClick: handleContinueToCompletion }
                : playback.getPrimaryButton()
        }
        showBack={playback.hasStarted && !playback.isComplete && !playback.isLoading && !showCompletion}
        onBack={handleRestart}
        backConfirmMessage="Restart this meditation from the beginning?"
        showSkip={!playback.isComplete && !showCompletion}
        onSkip={playback.handleSkip}
        skipConfirmMessage="Skip this meditation?"
        showSeekControls={playback.hasStarted && !playback.isComplete && !playback.isLoading && !showCompletion}
        onSeekBack={() => playback.handleSeekRelative(-10)}
        onSeekForward={() => playback.handleSeekRelative(10)}
        leftSlot={
          playback.hasStarted && !playback.isComplete && !playback.isLoading && !showCompletion ? (
            <VolumeButton
              volume={playback.audio.volume}
              onVolumeChange={playback.audio.setVolume}
            />
          ) : null
        }
        rightSlot={
          playback.hasStarted && !playback.isComplete && !playback.isLoading && !showCompletion ? (
            <SlotButton
              icon={<TranscriptIcon />}
              label="View transcript"
              onClick={handleOpenTranscript}
            />
          ) : null
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

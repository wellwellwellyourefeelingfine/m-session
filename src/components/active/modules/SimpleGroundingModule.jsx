/**
 * SimpleGroundingModule Component
 *
 * A brief guided grounding meditation with:
 * - 31 pre-recorded TTS audio prompts
 * - Fixed duration (~5 minutes 15 seconds)
 * - No silence expansion, no duration picker, no variations
 * - Audio-text sync via shared useMeditationPlayback hook
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  getMeditationById,
  generateTimedSequence,
} from '../../../content/meditations';
import { getModuleById } from '../../../content/modules/library';
import { useMeditationPlayback } from '../../../hooks/useMeditationPlayback';
import { useTranscriptModal } from '../../../hooks/useTranscriptModal';
import { useSessionStore } from '../../../stores/useSessionStore';

// Shared UI components
import ModuleLayout, { CompletionScreen, IdleScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar, { VolumeButton, SlotButton } from '../capabilities/ModuleControlBar';
import MorphingShapes from '../capabilities/animations/MorphingShapes';
import WaveLoop from '../capabilities/animations/WaveLoop';
import TranscriptModal, { TranscriptIcon } from '../capabilities/TranscriptModal';

// Optional idle-screen animations, opted into via `meditation.idleAnimation`.
// When undefined, IdleScreen falls back to its default (AsciiMoon).
const IDLE_ANIMATIONS = {
  wave: WaveLoop,
};

export default function SimpleGroundingModule({ module, onComplete, onSkip, onProgressUpdate }) {
  const libraryModule = getModuleById(module.libraryId);
  const meditationId = libraryModule?.meditationId || 'simple-grounding';
  const meditation = getMeditationById(meditationId);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  // Transcript modal state
  const { showTranscript, transcriptClosing, handleOpenTranscript, handleCloseTranscript } = useTranscriptModal();

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
    meditationId,
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
        {/* Idle state */}
        {!playback.hasStarted && !playback.isLoading && (() => {
          const IdleAnimationComp = meditation.idleAnimation
            ? IDLE_ANIMATIONS[meditation.idleAnimation]
            : null;
          return (
            <div className={`text-center ${isLeaving ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
              <IdleScreen
                title={meditation.title}
                description={meditation.description}
                animation={IdleAnimationComp ? <IdleAnimationComp /> : undefined}
              />

              {/* Fixed duration display */}
              <p className="mt-6 text-[var(--color-text-tertiary)] text-sm">
                ~{Math.round(meditation.fixedDuration / 60)} min
              </p>
            </div>
          );
        })()}

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
              className="text-[var(--color-text-primary)] mb-4"
              style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none', fontSize: '18px', marginTop: 0 }}
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
        title={meditation.title}
        prompts={meditation.prompts}
      />
    </>
  );
}

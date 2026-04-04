/**
 * BodyScanModule Component
 *
 * A progressive body scan meditation with:
 * - 54 pre-recorded TTS audio prompts
 * - Variable duration support (10 or 15 minutes)
 * - Silence expansion concentrated in later body regions
 * - Audio-text sync via shared useMeditationPlayback hook
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  getMeditationById,
  calculateSilenceMultiplier,
  generateTimedSequence,
} from '../../../content/meditations';
import { useMeditationPlayback } from '../../../hooks/useMeditationPlayback';
import { useTranscriptModal } from '../../../hooks/useTranscriptModal';
import useSyncedDuration from '../../../hooks/useSyncedDuration';
import { useSessionStore } from '../../../stores/useSessionStore';

// Shared UI components
import ModuleLayout, { CompletionScreen, IdleScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar, { VolumeButton, SlotButton } from '../capabilities/ModuleControlBar';
import MorphingShapes from '../capabilities/animations/MorphingShapes';
import DurationPicker from '../../shared/DurationPicker';
import TranscriptModal, { TranscriptIcon } from '../capabilities/TranscriptModal';

export default function BodyScanModule({ module, onComplete, onSkip, onProgressUpdate }) {
  const meditation = getMeditationById('body-scan');

  // Derive hasStarted from store (needed before useSyncedDuration call)
  const meditationPlayback = useSessionStore((state) => state.meditationPlayback);
  const hasStarted = meditationPlayback.moduleInstanceId === module.instanceId && meditationPlayback.hasStarted;

  // Duration (synced with session store)
  const duration = useSyncedDuration(module, { hasStarted });
  const [isLeaving, setIsLeaving] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  // Transcript modal state
  const { showTranscript, transcriptClosing, handleOpenTranscript, handleCloseTranscript } = useTranscriptModal();

  // Build timed sequence (all 54 prompts always play, silence expansion for later regions)
  const [timedSequence, totalDuration] = useMemo(() => {
    if (!meditation) return [[], 0];

    const durationSeconds = duration.selected * 60;

    // Calculate silence multiplier for this duration
    const silenceMultiplier = calculateSilenceMultiplier(meditation.prompts, durationSeconds, meditation.speakingRate, 'body-scan');

    // Generate timed sequence
    const sequence = generateTimedSequence(meditation.prompts, silenceMultiplier, {
      speakingRate: meditation.speakingRate || 150,
      audioConfig: meditation.audio,
    });

    const total = sequence.length > 0 ? sequence[sequence.length - 1].endTime : durationSeconds;
    return [sequence, total];
  }, [meditation, duration.selected]);

  // Shared playback hook handles timer, audio-text sync, prompt progression, etc.
  const playback = useMeditationPlayback({
    meditationId: 'body-scan',
    moduleInstanceId: module.instanceId,
    timedSequence,
    totalDuration,
    onComplete,
    onSkip,
    onProgressUpdate,
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
        {!playback.hasStarted && !playback.isLoading && (
          <div className={`text-center ${isLeaving ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
            <IdleScreen
              title={meditation.title}
              description={meditation.description}
            />

            {/* Duration selector */}
            <button
              onClick={() => duration.setShowPicker(true)}
              className="mt-6 px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)]
                hover:border-[var(--color-text-tertiary)] transition-colors"
            >
              <span className="text-2xl font-light">{duration.selected}</span>
              <span className="text-sm ml-1">min</span>
            </button>
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

      {/* Duration picker modal */}
      <DurationPicker
        isOpen={duration.showPicker}
        onClose={() => duration.setShowPicker(false)}
        onSelect={duration.setSelected}
        currentDuration={duration.selected}
        durationSteps={meditation.durationSteps}
        minDuration={meditation.minDuration / 60}
        maxDuration={meditation.maxDuration / 60}
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

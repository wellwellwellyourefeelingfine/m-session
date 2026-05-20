/**
 * MettaHeartModule Component
 *
 * A 10-phase loving-kindness meditation with:
 * - 86 pre-recorded TTS audio prompts
 * - Fixed duration (~29 minutes, silence-tuned)
 * - No silence expansion, no duration picker
 * - Audio-text sync via shared useMeditationPlayback hook
 *
 * Voice + idle-pill wiring mirrors SimpleGroundingModule: the selected voice
 * flows into generateTimedSequence (driving audioSrc URLs) and into the
 * voice-aware idle-screen duration estimate via estimateMeditationDurationSeconds.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  getMeditationById,
  generateTimedSequence,
  resolveEffectiveVoiceId,
  estimateMeditationDurationSeconds,
} from '../../../content/meditations';
import { useMeditationPlayback } from '../../../hooks/useMeditationPlayback';
import { useTranscriptModal } from '../../../hooks/useTranscriptModal';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useAppStore } from '../../../stores/useAppStore';

// Shared UI components
import ModuleLayout, { CompletionScreen, IdleScreen } from '../capabilities/ModuleLayout';
import MeditationLoadingScreen from '../capabilities/MeditationLoadingScreen';
import ModuleControlBar, { VolumeButton, SlotButton } from '../capabilities/ModuleControlBar';
import MorphingShapes from '../capabilities/animations/MorphingShapes';
import TranscriptModal, { TranscriptIcon } from '../capabilities/TranscriptModal';
import { EggIcon } from '../../shared/Icons';

export default function MettaHeartModule({ module, onComplete, onSkip, onProgressUpdate }) {
  const meditation = getMeditationById('metta-heart');
  const [showCompletion, setShowCompletion] = useState(false);

  // Voice selection — initialized from the global default preference,
  // overridable on the idle screen. Snapshotted to a ref when Begin is
  // pressed so mid-session changes don't affect the in-flight session.
  const defaultVoiceId = useAppStore((s) => s.preferences?.defaultVoiceId);
  const voices = meditation?.audio?.voices;
  const [selectedVoiceId, setSelectedVoiceId] = useState(() =>
    resolveEffectiveVoiceId(meditation?.audio, defaultVoiceId)
  );
  const activeVoiceRef = useRef(selectedVoiceId);

  // Transcript modal state
  const { showTranscript, transcriptClosing, handleOpenTranscript, handleCloseTranscript } = useTranscriptModal();

  // Build timed sequence (fixed duration, no silence expansion — multiplier = 1.0).
  // Rebuilds when the idle-selected voice changes so the audioSrc URLs point at the right folder.
  const [timedSequence, totalDuration] = useMemo(() => {
    if (!meditation) return [[], 0];

    const sequence = generateTimedSequence(meditation.prompts, 1.0, {
      audioConfig: meditation.audio,
      voiceId: selectedVoiceId,
    });

    // Voice-aware total: the sequence's last endTime reflects the actual
    // composed audio length for the selected voice. Falls back to
    // meditation.fixedDuration if the sequence is empty (defensive).
    const total = sequence.length > 0
      ? sequence[sequence.length - 1].endTime
      : meditation.fixedDuration;
    return [sequence, total];
  }, [meditation, selectedVoiceId]);

  // Idle-screen duration estimate — voice-aware so it reflects the currently
  // selected voice rather than the hardcoded fixedDuration. Once playback
  // starts, the progress bar uses the exact composed-blob duration instead.
  const durationMinutes = useMemo(() => {
    if (!meditation) return null;
    const seconds = estimateMeditationDurationSeconds(meditation, { voiceId: selectedVoiceId });
    return Math.ceil(seconds / 60);
  }, [meditation, selectedVoiceId]);

  // Shared playback hook handles timer, audio-text sync, prompt progression, etc.
  const playback = useMeditationPlayback({
    meditationId: 'metta-heart',
    moduleInstanceId: module.instanceId,
    timedSequence,
    totalDuration,
    onComplete,
    onSkip,
    onProgressUpdate,
  });

  // Sync the idle-screen voice pill with the global default voice preference.
  // The store's `defaultVoiceId` only updates when the user commits a change
  // in Settings, so this effect fires at that moment and never during rapid
  // Settings toggling. Skipped once playback has started so in-flight sessions
  // aren't disturbed.
  useEffect(() => {
    if (playback.hasStarted) return;
    const nextEffective = resolveEffectiveVoiceId(meditation?.audio, defaultVoiceId);
    if (nextEffective && nextEffective !== selectedVoiceId) {
      setSelectedVoiceId(nextEffective);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally not re-running when selectedVoiceId changes locally
  }, [defaultVoiceId, playback.hasStarted, meditation]);

  // Begin → idle-leaving → preparing (loading screen) → preparing-leaving →
  // active. Snapshots the selected voice so toggling the pill mid-session
  // doesn't change the audio that's composing/playing.
  const handleBeginWithTransition = useCallback(() => {
    activeVoiceRef.current = selectedVoiceId;
    useSessionStore.getState().beginModule(module.instanceId);
    playback.handleBeginWithTransition();
  }, [playback, module.instanceId, selectedVoiceId]);

  // Restart meditation from the beginning
  const handleRestart = useCallback(() => {
    playback.handleRestart();
    setShowCompletion(false);
  }, [playback]);

  // Transition from completed meditation screen → CompletionScreen.
  // Two-phase: await the hook's active-leaving fade, then flip showCompletion
  // so CompletionScreen fades in cleanly afterwards.
  const handleContinueToCompletion = useCallback(async () => {
    const ok = await playback.handleContinueToCompletionWithTransition();
    if (ok) setShowCompletion(true);
  }, [playback]);

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

        {/* Idle state — also shown during 'idle-leaving' with a fadeOut class */}
        {!playback.error &&
          !playback.hasStarted &&
          (playback.transitionStage === 'idle' || playback.transitionStage === 'idle-leaving') && (() => {
            const isLeaving = playback.transitionStage === 'idle-leaving';
            return (
              <div className={`text-center ${isLeaving ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
                <IdleScreen
                  title={meditation.title}
                  description={meditation.description}
                  voices={voices}
                  selectedVoiceId={selectedVoiceId}
                  onVoiceChange={setSelectedVoiceId}
                  durationMinutes={durationMinutes}
                />
              </div>
            );
          })()}

        {/* Loading state — fades in on 'preparing', out on 'preparing-leaving'.
            The composer fetches and assembles the chosen voice's audio during
            this window. */}
        {(playback.transitionStage === 'preparing' || playback.transitionStage === 'preparing-leaving') && (
          <MeditationLoadingScreen
            isLeaving={playback.transitionStage === 'preparing-leaving'}
          />
        )}

        {/* Active/completed state — title, animation, paused indicator, prompt
            display. Visible during 'active' and 'active-leaving' (the latter
            applies fadeOut on Continue → Well Done). Same gate-broadening shape
            as the idle block above. */}
        {playback.hasStarted && !showCompletion &&
          (playback.transitionStage === 'active' || playback.transitionStage === 'active-leaving') && (
          <div
            className={`flex flex-col items-center text-center w-full px-4 ${
              playback.transitionStage === 'active-leaving' ? 'animate-fadeOut' : 'animate-fadeIn'
            }`}
            style={{
              alignSelf: 'stretch',
              minHeight: 'var(--meditation-page-min-height)',
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
        primary={(() => {
          if (showCompletion) return { label: 'Complete', onClick: handleFinalComplete };
          const phase = playback.getPhase();
          if (phase === 'idle') return { label: 'Begin', onClick: handleBeginWithTransition };
          if (phase === 'loading') return { label: 'Loading', loading: true };
          if (playback.isComplete) return { label: 'Continue', onClick: handleContinueToCompletion };
          return playback.getPrimaryButton();
        })()}
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

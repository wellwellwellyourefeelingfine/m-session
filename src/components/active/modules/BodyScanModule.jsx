/**
 * BodyScanModule Component
 *
 * A progressive body scan meditation with:
 * - 54 pre-recorded TTS audio prompts
 * - Variable duration support (10 or 15 minutes)
 * - Silence expansion concentrated in later body regions
 * - Voice selector when the meditation declares multiple voices
 * - Audio-text sync via shared useMeditationPlayback hook
 *
 * Voice + loading-screen wiring mirrors SimpleGroundingModule. The selected
 * voice flows into both the silence-multiplier solver and the audio path
 * resolution, so picking Rachel actually plays Rachel's clips and the
 * solver targets the right total length using Rachel's clip durations.
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
import { useSessionStore } from '../../../stores/useSessionStore';
import { useAppStore } from '../../../stores/useAppStore';

// Shared UI components
import ModuleLayout, { CompletionScreen, IdleScreen } from '../capabilities/ModuleLayout';
import MeditationLoadingScreen from '../capabilities/MeditationLoadingScreen';
import ModuleControlBar, { VolumeButton, SlotButton } from '../capabilities/ModuleControlBar';
import MorphingShapes from '../capabilities/animations/MorphingShapes';
import TranscriptModal, { TranscriptIcon } from '../capabilities/TranscriptModal';
import { EggIcon } from '../../shared/Icons';

export default function BodyScanModule({ module, onComplete, onSkip, onProgressUpdate }) {
  const meditation = getMeditationById('body-scan');

  // Derive hasStarted from store (needed before useSyncedDuration call)
  const meditationPlayback = useSessionStore((state) => state.meditationPlayback);
  const hasStarted = meditationPlayback.moduleInstanceId === module.instanceId && meditationPlayback.hasStarted;

  // Duration (synced with session store)
  const duration = useSyncedDuration(module, { hasStarted });
  const [showCompletion, setShowCompletion] = useState(false);

  // Voice selection — initialized from the global default preference,
  // overridable on the idle pill. The selected voice flows into both the
  // silence-multiplier solver (so the target duration math uses the right
  // clip lengths) and generateTimedSequence (so audio URLs point at the
  // chosen voice's subfolder).
  const defaultVoiceId = useAppStore((s) => s.preferences?.defaultVoiceId);
  const voices = meditation?.audio?.voices;
  const [selectedVoiceId, setSelectedVoiceId] = useState(() =>
    resolveEffectiveVoiceId(meditation?.audio, defaultVoiceId)
  );
  const activeVoiceRef = useRef(selectedVoiceId);

  // Transcript modal state
  const { showTranscript, transcriptClosing, handleOpenTranscript, handleCloseTranscript } = useTranscriptModal();

  // Build timed sequence (all 54 prompts always play, silence expansion for
  // later regions). Voice-aware: rebuilds when the idle-pill cycles voices
  // so the solver and audio URLs both reflect the chosen voice.
  const [timedSequence, totalDuration] = useMemo(() => {
    if (!meditation) return [[], 0];

    const durationSeconds = duration.selected * 60;

    // Calculate silence multiplier for this duration, using the selected
    // voice's clip durations. Without voiceId, the solver would fall back
    // to the default voice and the meditation could run several seconds
    // over target when an alternate voice is selected.
    const silenceMultiplier = calculateSilenceMultiplier(
      meditation.prompts,
      durationSeconds,
      'body-scan',
      selectedVoiceId,
    );

    // Generate timed sequence — voiceId here also drives audio URL
    // resolution via resolveVoiceBasePath.
    const sequence = generateTimedSequence(meditation.prompts, silenceMultiplier, {
      audioConfig: meditation.audio,
      voiceId: selectedVoiceId,
    });

    const total = sequence.length > 0 ? sequence[sequence.length - 1].endTime : durationSeconds;
    return [sequence, total];
  }, [meditation, duration.selected, selectedVoiceId]);

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

  // Sync the idle-screen voice pill with the global default preference.
  // The store's `defaultVoiceId` only updates when the user commits a
  // change in Settings, so this fires at that moment and never during
  // rapid Settings toggling. Skipped once playback has started so an
  // in-flight session isn't disturbed.
  useEffect(() => {
    if (playback.hasStarted) return;
    const nextEffective = resolveEffectiveVoiceId(meditation?.audio, defaultVoiceId);
    if (nextEffective && nextEffective !== selectedVoiceId) {
      setSelectedVoiceId(nextEffective);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally not re-running when selectedVoiceId changes locally
  }, [defaultVoiceId, playback.hasStarted, meditation]);

  // Begin → idle-leaving → preparing (loading screen) → preparing-leaving →
  // active. The composer reads the current `timedSequence`, which is
  // voice-aware, so the loading screen is the moment the chosen voice's
  // audio gets fetched and assembled. Replaces the legacy 300ms setTimeout
  // pattern, which had no per-voice composition step.
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

        {/* Idle state — visible during 'idle' and 'idle-leaving' (the latter
            applies the fadeOut class). */}
        {!playback.error
          && !playback.hasStarted
          && (playback.transitionStage === 'idle' || playback.transitionStage === 'idle-leaving')
          && (() => {
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
            display. Gated on transitionStage === 'active' so the loading screen
            finishes fading out before this fades in (sequential, not overlapping). */}
        {playback.hasStarted && !showCompletion && playback.transitionStage === 'active' && (
          <div
            className="flex flex-col items-center text-center w-full px-4 animate-fadeIn"
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

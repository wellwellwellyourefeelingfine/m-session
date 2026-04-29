/**
 * MeditationSection — Audio-synced meditation via useMeditationPlayback
 *
 * Wraps the existing meditation infrastructure:
 * - useMeditationPlayback for audio-text sync
 * - useSyncedDuration for variable duration
 * - Variation selector for meditations with multiple versions (e.g., self-compassion)
 * - Voice selector when the meditation declares multiple voices — pill lives
 *   on this section's idle so the user picks the voice immediately before
 *   audio composition. Begin → MeditationLoadingScreen composes the chosen
 *   voice's clips, then fades to playback.
 * - MorphingShapes animation during playback
 * - VolumeButton left slot, TranscriptModal right slot
 * - ±10s seek controls
 *
 * On playback completion → onSectionComplete (not module completion).
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  getMeditationById,
  calculateSilenceMultiplier,
  generateTimedSequence,
  resolveEffectiveVoiceId,
  estimateMeditationDurationSeconds,
} from '../../../../../content/meditations';
import { useMeditationPlayback } from '../../../../../hooks/useMeditationPlayback';
import { useTranscriptModal } from '../../../../../hooks/useTranscriptModal';
import useSyncedDuration from '../../../../../hooks/useSyncedDuration';
import { useAppStore } from '../../../../../stores/useAppStore';

import ModuleLayout, { IdleScreen, DurationPill } from '../../../capabilities/ModuleLayout';
import MeditationLoadingScreen from '../../../capabilities/MeditationLoadingScreen';
import ModuleControlBar, { VolumeButton, SlotButton } from '../../../capabilities/ModuleControlBar';
import TranscriptModal, { TranscriptIcon } from '../../../capabilities/TranscriptModal';
import { EggIcon } from '../../../../shared/Icons';
import { HeaderBlock, MeditationAudioBlock } from '../blockRenderers';

export default function MeditationSection({
  section,
  module,
  onSectionComplete,
  onProgressUpdate,
  canGoBackToPreviousSection = false,
  onBackToPreviousSection,
}) {
  const meditationId = section.meditationId;
  const meditation = getMeditationById(meditationId);
  const showTranscriptOption = section.showTranscript !== false;
  const showSeekControls = section.showSeekControls !== false;

  // Determine idle screen mode: variations OR variable duration OR fixed
  const hasVariations = !!(meditation?.variations && meditation?.assembleVariation);
  const hasVariableDuration = !hasVariations && meditation?.durationSteps?.length > 1;

  // Variation state (for meditations with multiple versions)
  const [selectedVariation, setSelectedVariation] = useState(
    meditation?.defaultVariation || 'default'
  );

  // Voice selection — initialized from the global default preference, overridable
  // on the idle screen. The selected voice flows into generateTimedSequence so the
  // composer fetches the right clip URLs when Begin starts loading.
  const defaultVoiceId = useAppStore((s) => s.preferences?.defaultVoiceId);
  const voices = meditation?.audio?.voices;
  const [selectedVoiceId, setSelectedVoiceId] = useState(() =>
    resolveEffectiveVoiceId(meditation?.audio, defaultVoiceId)
  );

  // Duration sync (for variable-duration meditations without variations)
  const duration = useSyncedDuration(module, { hasStarted: false });

  // Transcript modal
  const transcript = useTranscriptModal();

  // Build timed sequence — variation-aware and voice-aware. Rebuilds when the
  // voice pill is cycled so audio URLs point to the chosen voice's folder.
  const [timedSequence, totalDuration] = useMemo(() => {
    if (!meditation) return [[], 0];

    // Variation meditation — assembleVariation picks the clip array, multiplier 1.0.
    if (hasVariations) {
      const clips = meditation.assembleVariation(selectedVariation);

      const sequence = generateTimedSequence(clips, 1.0, {
        audioConfig: meditation.audio,
        meditationId,
        voiceId: selectedVoiceId,
      });
      const total = sequence.length > 0
        ? sequence[sequence.length - 1].endTime
        : estimateMeditationDurationSeconds(meditation, {
            voiceId: selectedVoiceId,
            variationKey: selectedVariation,
          });
      return [sequence, total];
    }

    // Variable-duration meditation — silences expand via calculateSilenceMultiplier
    // to hit duration.selected * 60 (capped per-prompt by silenceMax).
    if (hasVariableDuration) {
      const durationSeconds = duration.selected * 60;

      // Filter conditional prompts based on selected duration
      const prompts = meditation.prompts.filter((p) => {
        if (p.conditional?.minDuration && duration.selected < p.conditional.minDuration) return false;
        return true;
      });

      const silenceMultiplier = calculateSilenceMultiplier(
        prompts, durationSeconds, meditationId, selectedVoiceId
      );
      const sequence = generateTimedSequence(prompts, silenceMultiplier, {
        audioConfig: meditation.audio,
        meditationId,
        voiceId: selectedVoiceId,
      });
      const total = sequence.length > 0 ? sequence[sequence.length - 1].endTime : durationSeconds;
      return [sequence, total];
    }

    // Fixed-duration single-clip meditation (e.g. Protector Dialogue, transitions).
    // Mirrors SimpleGroundingModule.jsx — multiplier 1.0, prompts as authored.
    // duration.selected is intentionally ignored: that value is the outer
    // master-module slot's pill, not a target for this meditation's audio.
    const sequence = generateTimedSequence(meditation.prompts, 1.0, {
      audioConfig: meditation.audio,
      meditationId,
      voiceId: selectedVoiceId,
    });
    const total = sequence.length > 0
      ? sequence[sequence.length - 1].endTime
      : estimateMeditationDurationSeconds(meditation, { voiceId: selectedVoiceId });
    return [sequence, total];
  }, [meditation, hasVariations, hasVariableDuration, selectedVariation, duration.selected, meditationId, selectedVoiceId]);

  // Get current variation's prompts for the transcript modal
  const transcriptPrompts = useMemo(() => {
    if (!meditation) return [];
    if (hasVariations) {
      return meditation.assembleVariation(selectedVariation);
    }
    return meditation.prompts || [];
  }, [meditation, hasVariations, selectedVariation]);

  // Playback hook — both onComplete and onSkip advance to the next section
  const playback = useMeditationPlayback({
    meditationId,
    moduleInstanceId: module.instanceId,
    timedSequence,
    totalDuration,
    onComplete: onSectionComplete,
    onSkip: onSectionComplete,
    onProgressUpdate,
    composerOptions: section.composerOptions,
  });

  // Sync the idle-screen voice pill with the global default preference. The
  // store's `defaultVoiceId` only updates when the user commits a change in
  // Settings, so this fires at that moment and never during rapid toggling.
  // Skipped once playback has started so an in-flight session isn't disturbed.
  useEffect(() => {
    if (playback.hasStarted) return;
    const nextEffective = resolveEffectiveVoiceId(meditation?.audio, defaultVoiceId);
    if (nextEffective && nextEffective !== selectedVoiceId) {
      setSelectedVoiceId(nextEffective);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally not re-running when selectedVoiceId changes locally
  }, [defaultVoiceId, playback.hasStarted, meditation]);

  // Begin → idle-leaving → preparing (loading screen) → preparing-leaving → active.
  // The composer reads the current `timedSequence`, which is voice-aware, so
  // the loading screen is the moment the chosen voice's audio is fetched.
  // Once preparing starts, the idle pill is unmounted so voice changes are
  // inert — the closure captures the timedSequence at Begin time.
  const handleBeginWithTransition = useCallback(() => {
    playback.handleBeginWithTransition();
  }, [playback]);

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
          primary={{ label: 'Continue', onClick: onSectionComplete }}
          showSkip={false}
        />
      </>
    );
  }

  // Display duration for idle screen — voice-aware ceil estimate via the
  // shared estimateMeditationDurationSeconds helper, matching the formula
  // used by every other module (SimpleGrounding, FeltSense, SelfCompassion,
  // TheDescent). Includes the gong overhead so the pill is an upper-bound
  // on the actual blob duration the user will hear. For variable-duration
  // meditations, show the user's picked step exactly.
  const displayDuration = hasVariableDuration
    ? duration.selected
    : Math.ceil(
        estimateMeditationDurationSeconds(meditation, {
          voiceId: selectedVoiceId,
          variationKey: hasVariations ? selectedVariation : null,
        }) / 60
      );

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

        {/* Idle — before starting meditation. Visible during 'idle' and
            'idle-leaving' (the latter applies the fadeOut class). */}
        {!playback.error &&
          !playback.hasStarted &&
          (playback.transitionStage === 'idle' || playback.transitionStage === 'idle-leaving') && (
          <div className={`text-center ${playback.transitionStage === 'idle-leaving' ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
            <IdleScreen
              title={meditation.title}
              description={meditation.description}
              durationMinutes={displayDuration}
              voices={voices}
              selectedVoiceId={selectedVoiceId}
              onVoiceChange={setSelectedVoiceId}
            />

            {/* Variation selector (e.g., self-compassion, felt-sense) */}
            {hasVariations && (
              <div className="mt-6 space-y-3 max-w-sm mx-auto">
                {Object.values(meditation.variations).map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setSelectedVariation(v.key)}
                    className={`w-full text-left px-4 py-3 border transition-colors ${
                      selectedVariation === v.key
                        ? 'border-[var(--accent)] bg-[var(--accent-bg)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--color-text-primary)]">
                          {v.label}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 normal-case tracking-normal"
                          style={{ fontFamily: 'DM Serif Text, serif' }}>
                          {v.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Duration pill with arrows (for variable-duration meditations without variations) */}
            {hasVariableDuration && (() => {
              const steps = meditation.durationSteps || [];
              const stepIndex = steps.indexOf(duration.selected);
              const canStepBack = stepIndex > 0;
              const canStepForward = stepIndex >= 0 && stepIndex < steps.length - 1;
              const stepTo = (nextIndex) => {
                const next = steps[nextIndex];
                if (typeof next === 'number') duration.setSelected(next);
              };
              return (
                <div className="mt-6 flex justify-center">
                  <DurationPill
                    minutes={duration.selected}
                    showArrows={true}
                    canStepBack={canStepBack}
                    canStepForward={canStepForward}
                    onStepBack={() => stepTo(stepIndex - 1)}
                    onStepForward={() => stepTo(stepIndex + 1)}
                  />
                </div>
              );
            })()}
          </div>
        )}

        {/* Loading state — composing meditation audio for the chosen voice.
            Fades in on 'preparing', out on 'preparing-leaving'. */}
        {(playback.transitionStage === 'preparing' || playback.transitionStage === 'preparing-leaving') && (
          <MeditationLoadingScreen
            isLeaving={playback.transitionStage === 'preparing-leaving'}
          />
        )}

        {/* Active + Completed — header and animation stay visible until user clicks Continue.
            Gated on transitionStage === 'active' so the loading screen finishes fading
            out before this fades in (sequential, not overlapping). */}
        {playback.hasStarted && playback.transitionStage === 'active' && (
          <div
            className="flex flex-col items-center text-center w-full px-4 animate-fadeIn"
            style={{
              alignSelf: 'stretch',
              minHeight: 'var(--meditation-page-min-height)',
            }}
          >
            <HeaderBlock
              block={{
                title: meditation.title,
                titleClassName: 'text-xl font-light mb-2 text-center',
                animation: section.animation || 'morphing-shapes',
                animationProps: { size: 120 },
              }}
            />
            {!playback.isComplete && (
              <MeditationAudioBlock
                isPlaying={playback.isPlaying}
                promptPhase={playback.promptPhase}
                currentPromptText={playback.currentPrompt?.text}
              />
            )}
            {playback.isComplete && (
              <p className="text-[var(--color-text-secondary)] text-sm uppercase tracking-wider mt-4">
                Take a moment before moving on.
              </p>
            )}
          </div>
        )}

      </ModuleLayout>

      <ModuleControlBar
        phase={playback.getPhase()}
        primary={(() => {
          const phase = playback.getPhase();
          if (phase === 'idle') return { label: 'Begin', onClick: handleBeginWithTransition };
          if (phase === 'loading') return { label: 'Loading', loading: true };
          if (playback.isComplete) return { label: 'Continue', onClick: () => { playback.handleComplete(); } };
          return playback.getPrimaryButton();
        })()}
        showBack={canGoBackToPreviousSection && Boolean(onBackToPreviousSection)}
        onBack={onBackToPreviousSection}
        backConfirmMessage={
          playback.hasStarted && !playback.isComplete && !playback.isLoading
            ? 'Stop the meditation and go back?'
            : null
        }
        showSkip={!playback.isComplete}
        onSkip={() => { playback.handleSkip(); }}
        skipConfirmMessage="Skip this meditation?"
        showSeekControls={showSeekControls && playback.hasStarted && !playback.isComplete && !playback.isLoading}
        onSeekBack={() => playback.handleSeekRelative(-10)}
        onSeekForward={() => playback.handleSeekRelative(10)}
        leftSlot={
          playback.hasStarted && !playback.isComplete ? (
            // Wrapping div makes the slot content fade in when it mounts
            // (on meditation start) rather than snapping to full opacity.
            <div className="animate-fadeIn">
              <VolumeButton volume={playback.audio.volume} onVolumeChange={playback.audio.setVolume} />
            </div>
          ) : null
        }
        rightSlot={
          showTranscriptOption && playback.hasStarted && !playback.isComplete ? (
            <div className="animate-fadeIn">
              <SlotButton icon={<TranscriptIcon />} label="View transcript" onClick={transcript.handleOpenTranscript} />
            </div>
          ) : null
        }
      />

      {/* Transcript modal */}
      {showTranscriptOption && (
        <TranscriptModal
          isOpen={transcript.showTranscript}
          closing={transcript.transcriptClosing}
          onClose={transcript.handleCloseTranscript}
          title={meditation.title}
          prompts={transcriptPrompts}
        />
      )}
    </>
  );
}

/**
 * MeditationSection — Audio-synced meditation via useMeditationPlayback
 *
 * Wraps the existing meditation infrastructure:
 * - useMeditationPlayback for audio-text sync
 * - useSyncedDuration for variable duration
 * - Variation selector for meditations with multiple versions (e.g., self-compassion)
 * - MorphingShapes animation during playback
 * - VolumeButton left slot, TranscriptModal right slot
 * - ±10s seek controls
 *
 * On playback completion → onSectionComplete (not module completion).
 */

import { useState, useMemo, useCallback } from 'react';
import {
  getMeditationById,
  calculateSilenceMultiplier,
  generateTimedSequence,
} from '../../../../../content/meditations';
import { useMeditationPlayback } from '../../../../../hooks/useMeditationPlayback';
import { useTranscriptModal } from '../../../../../hooks/useTranscriptModal';
import useSyncedDuration from '../../../../../hooks/useSyncedDuration';

import ModuleLayout, { IdleScreen } from '../../../capabilities/ModuleLayout';
import ModuleControlBar, { VolumeButton, SlotButton } from '../../../capabilities/ModuleControlBar';
import DurationPicker from '../../../../shared/DurationPicker';
import TranscriptModal, { TranscriptIcon } from '../../../capabilities/TranscriptModal';
import { HeaderBlock, MeditationAudioBlock } from '../blockRenderers';

export default function MeditationSection({
  section,
  module,
  onSectionComplete,
  onSkip: _onSkip,
  onProgressUpdate,
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

  // Duration sync (for variable-duration meditations without variations)
  const duration = useSyncedDuration(module, { hasStarted: false });
  const [selectedDuration, setSelectedDuration] = useState(
    module.duration || meditation?.defaultDuration || 10
  );
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  // Transcript modal
  const transcript = useTranscriptModal();

  // Build timed sequence — variation-aware
  const [timedSequence, totalDuration] = useMemo(() => {
    if (!meditation) return [[], 0];

    // If meditation has variations, use assembleVariation to get the clip array
    if (hasVariations) {
      const clips = meditation.assembleVariation(selectedVariation);
      const variationMeta = meditation.variations[selectedVariation];
      const fixedDuration = variationMeta?.duration || selectedDuration * 60;

      const sequence = generateTimedSequence(clips, 1.0, {
        speakingRate: meditation.speakingRate || 150,
        audioConfig: meditation.audio,
        meditationId,
      });
      const total = sequence.length > 0 ? sequence[sequence.length - 1].endTime : fixedDuration;
      return [sequence, total];
    }

    // Standard variable-duration meditation
    const durationSeconds = selectedDuration * 60;

    // Filter conditional prompts based on selected duration
    const prompts = meditation.prompts.filter((p) => {
      if (p.conditional?.minDuration && selectedDuration < p.conditional.minDuration) return false;
      return true;
    });

    const silenceMultiplier = calculateSilenceMultiplier(
      prompts, durationSeconds, meditation.speakingRate || 150, meditationId
    );
    const sequence = generateTimedSequence(prompts, silenceMultiplier, {
      speakingRate: meditation.speakingRate || 150,
      audioConfig: meditation.audio,
      meditationId,
    });
    const total = sequence.length > 0 ? sequence[sequence.length - 1].endTime : durationSeconds;
    return [sequence, total];
  }, [meditation, hasVariations, selectedVariation, selectedDuration, meditationId]);

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

  // Display duration for idle screen
  const displayDuration = hasVariations
    ? Math.round((meditation.variations[selectedVariation]?.duration || 0) / 60)
    : selectedDuration;

  // Fade transition state for idle → active
  const [isLeaving, setIsLeaving] = useState(false);

  // Begin with fade transition
  const handleBeginWithTransition = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => playback.handleStart(), 400);
  }, [playback]);

  return (
    <>
      <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
        {/* Idle — before starting meditation */}
        {!playback.hasStarted && !playback.isLoading && (
          <div className={`text-center ${isLeaving ? 'animate-fadeOut' : 'animate-fadeIn'}`}>
            <IdleScreen
              title={meditation.title}
              description={meditation.description}
              duration={displayDuration}
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
                        <p className="text-sm text-[var(--color-text-primary)]">
                          {v.label}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 normal-case tracking-normal"
                          style={{ fontFamily: 'DM Serif Text, serif' }}>
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
            )}

            {/* Duration selector (for variable-duration meditations without variations) */}
            {hasVariableDuration && (
              <button
                onClick={() => setShowDurationPicker(true)}
                className="mt-6 px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)]
                  hover:border-[var(--color-text-tertiary)] transition-colors"
              >
                <span className="text-2xl font-light">{selectedDuration}</span>
                <span className="text-sm ml-1">min</span>
              </button>
            )}
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

        {/* Active + Completed — header and animation stay visible until user clicks Continue */}
        {playback.hasStarted && (
          <div
            className="flex flex-col items-center text-center w-full px-4 animate-fadeIn"
            style={{
              alignSelf: 'stretch',
              minHeight: 'calc(100vh - var(--header-plus-status) - var(--bottom-chrome) - 1rem)',
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
        primary={
          playback.isComplete
            ? { label: 'Continue', onClick: () => { playback.handleComplete(); } }
            : !playback.hasStarted || playback.isLoading
              ? { label: 'Begin', onClick: handleBeginWithTransition }
              : playback.getPrimaryButton()
        }
        showSkip={!playback.isComplete}
        onSkip={() => { playback.handleSkip(); }}
        skipConfirmMessage="Skip this meditation?"
        showSeekControls={showSeekControls && playback.hasStarted && !playback.isComplete && !playback.isLoading}
        onSeekBack={() => playback.handleSeekRelative(-10)}
        onSeekForward={() => playback.handleSeekRelative(10)}
        leftSlot={
          playback.hasStarted && !playback.isComplete ? (
            <VolumeButton volume={playback.audio.volume} onVolumeChange={playback.audio.setVolume} />
          ) : null
        }
        rightSlot={
          showTranscriptOption && playback.hasStarted && !playback.isComplete ? (
            <SlotButton icon={<TranscriptIcon />} label="View transcript" onClick={transcript.handleOpenTranscript} />
          ) : null
        }
      />

      {/* Duration picker (variable-duration meditations only) */}
      {hasVariableDuration && meditation.durationSteps && (
        <DurationPicker
          isOpen={showDurationPicker}
          onClose={() => setShowDurationPicker(false)}
          onSelect={(val) => { setSelectedDuration(val); duration.handleChange(val); }}
          currentDuration={selectedDuration}
          durationSteps={meditation.durationSteps}
          minDuration={meditation.minDuration ? meditation.minDuration / 60 : undefined}
          maxDuration={meditation.maxDuration ? meditation.maxDuration / 60 : undefined}
        />
      )}

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

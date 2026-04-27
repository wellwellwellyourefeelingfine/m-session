/**
 * OpenSpaceModule Component
 *
 * Unstructured open time with a timer and AsciiMoon animation.
 * Matches the visual style of the end-of-phase OpenSpace page:
 * serif title + AsciiMoon + content below (top-anchored layout).
 *
 * Features:
 * - DurationPill with arrows (5–60 min) for both idle and mid-session adjustment
 * - Mid-session arrows respect an elapsed-time floor so the user can't shorten
 *   the meditation below what they've already played
 * - Silence audio blob timer (gong + silence + gong) for iOS background resilience
 * - AsciiMoon animation throughout
 * - Auto-completes when blob finishes playing
 * - Pause/Resume support
 */

import { useState, useCallback, useMemo } from 'react';
import { getModuleById } from '../../../content/modules';
import { useSessionStore } from '../../../stores/useSessionStore';
import useSyncedDuration from '../../../hooks/useSyncedDuration';
import { useSilenceTimer } from '../../../hooks/useSilenceTimer';

// Shared UI components
import ModuleControlBar, { VolumeButton } from '../capabilities/ModuleControlBar';
import { DurationPill } from '../capabilities/ModuleLayout';
import AlarmPrompt from '../../shared/AlarmPrompt';
import AsciiMoon from '../capabilities/animations/AsciiMoon';

const DURATION_STEPS = [5, 10, 15, 20, 30, 45, 60];

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function OpenSpaceModule({ module, onComplete, onSkip, onProgressUpdate }) {
  const libraryModule = getModuleById(module.libraryId);

  // Derive hasStarted from store (needed before useSyncedDuration call)
  const meditationPlayback = useSessionStore((state) => state.meditationPlayback);
  const hasStarted = meditationPlayback.moduleInstanceId === module.instanceId && meditationPlayback.hasStarted;

  // Duration (synced with session store)
  const duration = useSyncedDuration(module, { hasStarted });

  // Local UI state
  const [showAlarmPrompt, setShowAlarmPrompt] = useState(false);

  const totalDurationSeconds = duration.selected * 60;

  // Silence timer hook — replaces the old setInterval + Date.now() timer
  const timer = useSilenceTimer({
    moduleInstanceId: module.instanceId,
    durationSeconds: totalDurationSeconds,
    onComplete,
    onSkip,
    onProgressUpdate,
    title: 'Open Space',
  });

  // Minimum duration when timer is running: next step above elapsed time
  const minDurationWhileRunning = useMemo(() => {
    if (!timer.hasStarted) return 5;
    const elapsedMinutes = timer.elapsedTime / 60;
    const step = DURATION_STEPS.find((s) => s > elapsedMinutes);
    return step || DURATION_STEPS[DURATION_STEPS.length - 1];
  }, [timer.hasStarted, timer.elapsedTime]);

  // Duration change handler — syncs via hook + resizes blob if timer is running
  const handleDurationChange = useCallback((newDuration) => {
    duration.handleChange(newDuration);
    if (timer.hasStarted && !timer.isComplete) {
      timer.resize(newDuration * 60);
    }
  }, [duration, timer]);

  // Step navigation for the DurationPill arrows. In active state, the floor is
  // bumped up to `minDurationWhileRunning` so the user can't shorten the
  // meditation below what they've already played.
  const stepIndex = DURATION_STEPS.indexOf(duration.selected);
  const minDuration = timer.hasStarted ? minDurationWhileRunning : 5;
  const canStepBack = stepIndex > 0 && DURATION_STEPS[stepIndex - 1] >= minDuration;
  const canStepForward = stepIndex >= 0 && stepIndex < DURATION_STEPS.length - 1;
  const stepTo = (nextIndex) => {
    const next = DURATION_STEPS[nextIndex];
    if (typeof next === 'number') handleDurationChange(next);
  };

  // Begin: start timer directly (background audio handles alerting)
  const handleBegin = useCallback(() => {
    useSessionStore.getState().beginModule(module.instanceId);
    timer.handleStart();
  }, [timer, module.instanceId]);

  // Control bar phase
  const getControlPhase = () => {
    const phase = timer.getPhase();
    if (phase === 'loading') return 'idle';
    return phase;
  };

  // Primary button config
  const getPrimaryButton = () => {
    const phase = timer.getPhase();

    if (phase === 'idle') {
      return { label: 'Begin', onClick: handleBegin };
    }

    if (phase === 'loading') {
      return { label: 'Preparing...', onClick: () => {}, disabled: true };
    }

    if (phase === 'active') {
      return {
        label: timer.isPlaying ? 'Pause' : 'Resume',
        onClick: timer.handlePauseResume,
      };
    }

    if (phase === 'completed') {
      return { label: 'Continue', onClick: timer.handleComplete };
    }

    return null;
  };

  return (
    <>
      {/* Layout matches OpenSpace.jsx: top-anchored with px-6 py-8, centered horizontally */}
      <div className="px-6 py-8 flex flex-col items-center">
        <div className="max-w-md text-center">

          {/* Idle state */}
          {!timer.hasStarted && (
            <div className="animate-fadeIn">
              {/* Title — matches OpenSpace.jsx */}
              <h2
                className="text-2xl mb-6"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                Open Space
              </h2>

              {/* Moon animation — matches OpenSpace.jsx */}
              <div className="flex justify-center mb-8">
                <AsciiMoon />
              </div>

              {/* Duration pill with arrows — idle state */}
              <div className="mb-6">
                <DurationPill
                  minutes={duration.selected}
                  showArrows={true}
                  canStepBack={canStepBack}
                  canStepForward={canStepForward}
                  onStepBack={() => stepTo(stepIndex - 1)}
                  onStepForward={() => stepTo(stepIndex + 1)}
                />
              </div>

              {/* Description */}
              <p className="text-[var(--color-text-secondary)] mb-10">
                {libraryModule?.content?.instructions || 'This is open time. Rest, move, listen to music, or simply be. Follow your inner guidance.'}
              </p>
            </div>
          )}

          {/* Active state */}
          {timer.hasStarted && !timer.isComplete && (
            <div className="animate-fadeIn">
              {/* Title — matches OpenSpace.jsx */}
              <h2
                className="text-2xl mb-6"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                Open Space
              </h2>

              {/* Moon animation — matches OpenSpace.jsx */}
              <div className="flex justify-center mb-8">
                <AsciiMoon />
              </div>

              {/* Elapsed time — display only */}
              <p className="text-2xl font-light text-[var(--color-text-secondary)]">
                {formatTime(timer.elapsedTime)}
              </p>

              {/* Duration pill with arrows — adjust mid-session.
                  canStepBack respects the elapsed-time floor so the user can't
                  shorten below what they've already played. */}
              <div className="mt-4">
                <DurationPill
                  minutes={duration.selected}
                  showArrows={true}
                  canStepBack={canStepBack}
                  canStepForward={canStepForward}
                  onStepBack={() => stepTo(stepIndex - 1)}
                  onStepForward={() => stepTo(stepIndex + 1)}
                />
              </div>

              {/* Set external timer link */}
              <div className="mt-4">
                <button
                  onClick={() => setShowAlarmPrompt(true)}
                  className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  + set external timer
                </button>
              </div>
            </div>
          )}

          {/* Completed state — same layout, timer shows final time */}
          {timer.isComplete && (
            <div className="animate-fadeIn">
              <h2
                className="text-2xl mb-6"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                Open Space
              </h2>

              <div className="flex justify-center mb-8">
                <AsciiMoon />
              </div>

              <div className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] inline-block">
                <span className="text-2xl font-light">{formatTime(totalDurationSeconds)}</span>
                <span className="text-xs ml-2 text-[var(--color-text-tertiary)]">/ {duration.selected}m</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control bar */}
      <ModuleControlBar
        phase={getControlPhase()}
        primary={getPrimaryButton()}
        showBack={false}
        showSkip={!timer.isComplete}
        onSkip={timer.handleSkip}
        skipConfirmMessage="Skip this open space?"
        rightSlot={
          timer.hasStarted ? (
            <VolumeButton
              volume={timer.audio.volume}
              onVolumeChange={timer.audio.setVolume}
            />
          ) : null
        }
      />

      {/* Alarm prompt — shown on Begin and via "+ set external timer" */}
      <AlarmPrompt
        isOpen={showAlarmPrompt}
        onProceed={() => setShowAlarmPrompt(false)}
        durationMinutes={duration.selected}
        activityName="Open Space"
        hasBackgroundAudio
      />
    </>
  );
}

/**
 * OpenSpaceModule Component
 *
 * Unstructured open time with a timer and AsciiMoon animation.
 * Matches the visual style of the end-of-phase OpenSpace page:
 * serif title + AsciiMoon + content below (top-anchored layout).
 *
 * Features:
 * - Duration picker (5–60 min) with elapsed-time floor constraint
 * - Silence audio blob timer (gong + silence + gong) for iOS background resilience
 * - AsciiMoon animation throughout
 * - Tap timer to adjust duration mid-session (re-composes blob)
 * - Auto-completes when blob finishes playing
 * - Pause/Resume support
 */

import { useState, useCallback, useMemo } from 'react';
import { getModuleById } from '../../../content/modules';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useSilenceTimer } from '../../../hooks/useSilenceTimer';

// Shared UI components
import ModuleControlBar, { MuteButton } from '../capabilities/ModuleControlBar';
import DurationPicker from '../../shared/DurationPicker';
import AlarmPrompt from '../../shared/AlarmPrompt';
import AsciiMoon from '../capabilities/animations/AsciiMoon';

const DURATION_STEPS = [5, 10, 15, 20, 30, 45, 60];

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function OpenSpaceModule({ module, onComplete, onSkip, onTimerUpdate }) {
  const libraryModule = getModuleById(module.libraryId);
  const updateModuleDuration = useSessionStore((state) => state.updateModuleDuration);

  // Local UI state
  const [selectedDuration, setSelectedDuration] = useState(
    module.duration || libraryModule?.defaultDuration || 20
  );
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showAlarmPrompt, setShowAlarmPrompt] = useState(false);

  const totalDurationSeconds = selectedDuration * 60;

  // Silence timer hook — replaces the old setInterval + Date.now() timer
  const timer = useSilenceTimer({
    moduleInstanceId: module.instanceId,
    durationSeconds: totalDurationSeconds,
    onComplete,
    onSkip,
    onTimerUpdate,
    title: 'Open Space',
  });

  // Minimum duration when timer is running: next step above elapsed time
  const minDurationWhileRunning = useMemo(() => {
    if (!timer.hasStarted) return 5;
    const elapsedMinutes = timer.elapsedTime / 60;
    const step = DURATION_STEPS.find((s) => s > elapsedMinutes);
    return step || DURATION_STEPS[DURATION_STEPS.length - 1];
  }, [timer.hasStarted, timer.elapsedTime]);

  // Duration change handler — resizes blob if timer is running
  const handleDurationChange = useCallback((newDuration) => {
    setSelectedDuration(newDuration);
    updateModuleDuration(module.instanceId, newDuration);
    if (timer.hasStarted && !timer.isComplete) {
      timer.resize(newDuration * 60);
    }
  }, [module.instanceId, updateModuleDuration, timer]);

  // Begin: start timer directly (background audio handles alerting)
  const handleBegin = useCallback(() => {
    timer.handleStart();
  }, [timer]);

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

              {/* Duration picker button */}
              <div className="mb-6">
                <button
                  onClick={() => setShowDurationPicker(true)}
                  className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)]
                    hover:border-[var(--color-text-tertiary)] transition-colors"
                >
                  <span className="text-2xl font-light">{selectedDuration}</span>
                  <span className="text-sm ml-1">min</span>
                </button>
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

              {/* Elapsed timer — tap to adjust duration */}
              <button
                onClick={() => setShowDurationPicker(true)}
                className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)]
                  hover:border-[var(--color-text-tertiary)] transition-colors"
              >
                <span className="text-2xl font-light">{formatTime(timer.elapsedTime)}</span>
                <span className="text-xs ml-2 text-[var(--color-text-tertiary)]">/ {selectedDuration}m</span>
              </button>

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
                <span className="text-xs ml-2 text-[var(--color-text-tertiary)]">/ {selectedDuration}m</span>
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
            <MuteButton
              isMuted={timer.audio.isMuted}
              onToggle={timer.audio.toggleMute}
            />
          ) : null
        }
      />

      {/* Duration picker modal — minDuration constrained by elapsed time when running */}
      <DurationPicker
        isOpen={showDurationPicker}
        onClose={() => setShowDurationPicker(false)}
        onSelect={handleDurationChange}
        currentDuration={selectedDuration}
        durationSteps={DURATION_STEPS}
        minDuration={timer.hasStarted ? minDurationWhileRunning : 5}
        maxDuration={60}
      />

      {/* Alarm prompt — shown on Begin and via "+ set external timer" */}
      <AlarmPrompt
        isOpen={showAlarmPrompt}
        onProceed={() => setShowAlarmPrompt(false)}
        durationMinutes={selectedDuration}
        activityName="Open Space"
        hasBackgroundAudio
      />
    </>
  );
}

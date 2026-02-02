/**
 * ModuleShell Component
 *
 * The main component that assembles capabilities into a complete module.
 * Instead of writing custom components for each module type, the ModuleShell
 * reads the module's capabilities configuration and composes the appropriate
 * capability components.
 *
 * This is the "generic module renderer" - modules that don't need custom
 * logic can be rendered entirely through their capabilities config.
 *
 * Reports timer state to parent via onTimerUpdate for ModuleStatusBar display.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { getModuleById } from '../../../content/modules';
import {
  getMeditationById,
  calculateSilenceMultiplier,
  generateTimedSequence,
} from '../../../content/meditations';
import { useWakeLock } from '../../../hooks/useWakeLock';
import AlarmPrompt from '../../shared/AlarmPrompt';

// Capabilities
import PromptsCapability from './PromptsCapability';
import AnimationCapability from './AnimationCapability';
import AudioCapability from './AudioCapability';
import InputCapability, { useJournalContent } from './InputCapability';
import ModuleLayout, { CompletionScreen, IdleScreen } from './ModuleLayout';
import ModuleControlBar from './ModuleControlBar';

// Hooks
import { useModuleTimer } from './hooks/useModuleTimer';
import { useModuleState } from './hooks/useModuleState';

// Utilities
import { mergeCapabilities } from './index';

/**
 * @param {object} props
 * @param {object} props.module - Module instance from session store
 * @param {function} props.onComplete - Called when module completes
 * @param {function} props.onSkip - Called when module is skipped
 * @param {function} props.onTimerUpdate - Called to update timer state in parent
 */
export default function ModuleShell({ module, onComplete, onSkip, onTimerUpdate }) {
  // Get library module for metadata and capabilities
  const libraryModule = getModuleById(module.libraryId);

  // Determine capability category for defaults
  const getCapabilityCategory = () => {
    const type = libraryModule?.type || module.type;

    if (['journaling', 'light-journaling', 'deep-journaling', 'letter-writing', 'parts-work'].includes(type)) {
      return 'journaling';
    }
    return 'simple';
  };

  // Merge capabilities with defaults
  const capabilities = useMemo(() => {
    return mergeCapabilities(libraryModule?.capabilities, getCapabilityCategory());
  }, [libraryModule]);

  // Determine if this module needs a begin button
  const requiresBegin = capabilities.controls?.showBeginButton ?? false;

  // Initialize module state
  const moduleState = useModuleState({
    requiresBegin,
    onComplete,
    onSkip,
  });

  // Journal content (for journaling modules)
  const journal = useJournalContent({
    moduleTitle: module.title,
    saveToJournal: capabilities.input?.saveToJournal ?? true,
  });

  // Calculate duration for timer
  const durationSeconds = useMemo(() => {
    return (module.duration || libraryModule?.defaultDuration || 10) * 60;
  }, [module.duration, libraryModule]);

  // For timed prompts (guided meditation), generate the sequence
  const [timedSequence, totalDuration] = useMemo(() => {
    if (capabilities.prompts?.type !== 'timed') {
      return [[], durationSeconds];
    }

    // Get meditation content if available
    const meditationId = libraryModule?.meditationId;
    const meditation = meditationId ? getMeditationById(meditationId) : null;

    if (!meditation) {
      return [[], durationSeconds];
    }

    const silenceMultiplier = calculateSilenceMultiplier(meditation.prompts, durationSeconds);
    const sequence = generateTimedSequence(meditation.prompts, silenceMultiplier);

    const total = sequence.length > 0
      ? sequence[sequence.length - 1].endTime
      : durationSeconds;

    return [sequence, total];
  }, [capabilities.prompts?.type, libraryModule, durationSeconds]);

  // Initialize timer if needed
  const timerState = useModuleTimer({
    moduleInstanceId: module.instanceId,
    type: capabilities.timer?.type || 'elapsed',
    duration: totalDuration,
    breathingConfig: module.content?.timerConfig || libraryModule?.content?.timerConfig,
    autoComplete: capabilities.timer?.autoComplete ?? true,
    onComplete: () => moduleState.markCompleted(),
  });

  // Wake lock: keep screen on for visual-attention modules (not away-from-screen modules)
  const isAwayFromScreen = capabilities.timer?.awayFromScreen ?? false;
  useWakeLock(
    !isAwayFromScreen && !!capabilities.timer && timerState.hasStarted && timerState.isPlaying
  );

  // Alarm prompt state for away-from-screen modules
  const [showAlarmPrompt, setShowAlarmPrompt] = useState(false);

  // Report timer state to parent for ModuleStatusBar
  useEffect(() => {
    if (!onTimerUpdate) return;

    const progressPercent = capabilities.timer && totalDuration > 0
      ? (timerState.elapsedTime / totalDuration) * 100
      : 0;

    const showTimer = capabilities.timer?.showProgress && timerState.hasStarted && !timerState.isComplete;

    onTimerUpdate({
      progress: progressPercent,
      elapsed: timerState.elapsedTime,
      total: totalDuration,
      showTimer: showTimer,
      isPaused: !timerState.isPlaying,
    });
  }, [timerState.elapsedTime, totalDuration, timerState.hasStarted, timerState.isComplete, timerState.isPlaying, capabilities.timer, onTimerUpdate]);

  // Handle begin
  const handleBegin = useCallback(() => {
    if (isAwayFromScreen) {
      setShowAlarmPrompt(true);
    } else {
      moduleState.begin();
      if (capabilities.timer) {
        timerState.start();
      }
    }
  }, [moduleState, capabilities.timer, timerState, isAwayFromScreen]);

  // Handle alarm prompt dismissal (proceed into module)
  const handleAlarmProceed = useCallback(() => {
    setShowAlarmPrompt(false);
    moduleState.begin();
    if (capabilities.timer) {
      timerState.start();
    }
  }, [moduleState, capabilities.timer, timerState]);

  // Handle completion
  const handleComplete = useCallback(() => {
    // Save journal if applicable
    if (capabilities.input?.type === 'journal') {
      journal.save();
    }

    // Reset timer
    timerState.reset();

    // Call parent completion
    onComplete();
  }, [capabilities.input, journal, timerState, onComplete]);

  // Handle skip
  const handleSkip = useCallback(() => {
    // Save journal if applicable (even on skip)
    if (capabilities.input?.type === 'journal' && journal.hasContent) {
      journal.save();
    }

    // Reset timer
    timerState.reset();

    // Call parent skip
    onSkip();
  }, [capabilities.input, journal, timerState, onSkip]);

  // Get prompts from module content
  const prompts = module.content?.prompts || libraryModule?.content?.prompts || [];

  // Sequential prompts: build steps array
  const sequentialSteps = useMemo(() => {
    if (capabilities.prompts?.type !== 'sequential') return [];

    // For grounding-style modules, create steps from content
    const steps = [
      {
        title: module.title,
        text: module.content?.instructions || libraryModule?.content?.instructions || '',
      },
    ];

    // Add any additional prompts as steps
    prompts.forEach((prompt, index) => {
      if (typeof prompt === 'string') {
        steps.push({ title: `Step ${index + 2}`, text: prompt });
      } else {
        steps.push(prompt);
      }
    });

    return steps;
  }, [capabilities.prompts?.type, module, libraryModule, prompts]);

  // Determine module phase for controls
  const getControlPhase = () => {
    if (moduleState.isIdle) return 'idle';
    if (moduleState.isCompleted || timerState.isComplete) return 'completed';
    if (capabilities.prompts?.type === 'sequential') return 'sequential';
    if (capabilities.timer) return 'active';
    if (capabilities.input) return 'simple';
    return 'simple';
  };

  // Get primary button configuration based on phase
  const getPrimaryButton = () => {
    const phase = getControlPhase();
    const controls = capabilities.controls || {};

    if (phase === 'idle' && controls.showBeginButton) {
      return {
        label: controls.beginButtonText || 'Begin',
        onClick: handleBegin,
      };
    }

    if (phase === 'active') {
      if (controls.showPauseButton) {
        return {
          label: timerState.isPlaying ? 'Pause' : 'Resume',
          onClick: timerState.isPlaying ? timerState.pause : timerState.resume,
        };
      }
      return null;
    }

    if (phase === 'sequential') {
      const isLast = moduleState.currentPromptIndex >= sequentialSteps.length - 1;
      return {
        label: isLast ? 'Complete' : 'Continue',
        onClick: isLast ? handleComplete : () => {
          const hasMore = moduleState.nextPrompt(sequentialSteps.length);
          if (!hasMore) handleComplete();
        },
      };
    }

    if (phase === 'completed' || phase === 'simple') {
      return {
        label: journal.hasContent ? 'Save & Continue' : (controls.continueButtonText || 'Continue'),
        onClick: handleComplete,
      };
    }

    return null;
  };

  // Render based on current state
  return (
    <>
      <ModuleLayout
        layout={capabilities.layout}
      >
        {/* Idle state: show start screen */}
        {moduleState.isIdle && (
          <IdleScreen
            title={libraryModule?.title || module.title}
            description={libraryModule?.description || module.content?.instructions}
            duration={module.duration}
          />
        )}

        {/* Active state: show main content */}
        {moduleState.isActive && !timerState.isComplete && (
          <>
            {/* Animation (breathing circle, orb, etc.) */}
            {capabilities.animation && (
              <AnimationCapability
                config={capabilities.animation}
                breathPhase={timerState.breathPhase}
                countdown={timerState.phaseCountdown}
                isActive={timerState.isPlaying || timerState.hasStarted}
              />
            )}

            {/* Prompts display */}
            {capabilities.prompts && (
              <PromptsCapability
                config={capabilities.prompts}
                title={module.title}
                instructions={module.content?.instructions || libraryModule?.content?.instructions}
                prompts={
                  capabilities.prompts.type === 'sequential'
                    ? sequentialSteps
                    : prompts
                }
                currentIndex={moduleState.currentPromptIndex}
                elapsedTime={timerState.elapsedTime}
                timedSequence={timedSequence}
              />
            )}

            {/* Audio controls */}
            {capabilities.audio && (
              <AudioCapability
                config={capabilities.audio}
                isActive={timerState.isPlaying}
              />
            )}

            {/* Input (journal, checkin) */}
            {capabilities.input && (
              <InputCapability
                config={capabilities.input}
                moduleTitle={module.title}
                value={journal.content}
                onChange={journal.setContent}
              />
            )}
          </>
        )}

        {/* Completed state: show completion screen */}
        {(moduleState.isCompleted || timerState.isComplete) && (
          <CompletionScreen />
        )}
      </ModuleLayout>

      {/* Fixed control bar above tab bar */}
      <ModuleControlBar
        phase={getControlPhase()}
        primary={getPrimaryButton()}
        showBack={capabilities.controls?.showBackButton && moduleState.currentPromptIndex > 0}
        showSkip={capabilities.controls?.showSkipButton ?? true}
        onBack={() => moduleState.previousPrompt()}
        onSkip={handleSkip}
        backConfirmMessage="Go back to the previous step?"
        skipConfirmMessage="Skip this module?"
      />

      {/* Alarm prompt for away-from-screen modules */}
      {isAwayFromScreen && (
        <AlarmPrompt
          isOpen={showAlarmPrompt}
          onProceed={handleAlarmProceed}
          durationMinutes={module.duration || libraryModule?.defaultDuration || 10}
          activityName={libraryModule?.title || module.title}
        />
      )}
    </>
  );
}

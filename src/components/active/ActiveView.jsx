/**
 * ActiveView Component
 * Active session display - shows current phase and module
 * Handles substance checklist, intro, check-ins, and module rendering
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSessionStore, shouldShowBooster } from '../../stores/useSessionStore';
import { useAppStore } from '../../stores/useAppStore';
import ModuleRenderer from './ModuleRenderer';
import ModuleStatusBar, { formatTime } from './ModuleStatusBar';
import SubstanceChecklist from '../session/SubstanceChecklist';
import ComeUpCheckIn from '../session/ComeUpCheckIn';
import BoosterConsiderationModal from '../session/BoosterConsiderationModal';
import PeakPhaseCheckIn from '../session/PeakPhaseCheckIn';
import ClosingCheckIn from '../session/ClosingCheckIn';
import TransitionModule from '../session/TransitionModule/TransitionModule';
import { openingRitualConfig } from '../../content/transitions/openingRitualConfig';
import { peakTransitionConfig } from '../../content/transitions/peakTransitionConfig';
import { peakToIntegrationConfig } from '../../content/transitions/peakToIntegrationConfig';
import { closingRitualConfig } from '../../content/transitions/closingRitualConfig';
import OpenSpace from './OpenSpace';
import AsciiMoon from './capabilities/animations/AsciiMoon';
import ActiveEmptyState from './ActiveEmptyState';

const PHASE_CONFIG = {
  'come-up': { number: 1, name: 'Come-Up' },
  peak: { number: 2, name: 'Peak' },
  integration: { number: 3, name: 'Synthesis' },
};

// How long the status-bar + module subtree fades out before the store
// action that unmounts it fires. Lets both bars (ModuleStatusBar rendered
// here + ModuleControlBar rendered by the module) dissolve together instead
// of disappearing in a single frame when the module completes.
const MODULE_EXIT_FADE_MS = 500;

export default function ActiveView() {
  const [isVisible, setIsVisible] = useState(false);
  const [followUpNow, setFollowUpNow] = useState(Date.now());
  const [sessionElapsed, setSessionElapsed] = useState('0:00');
  // Tracks which module instance is mid-fade-out so the wrapping fade div
  // can drop to opacity 0 before the store swap unmounts it.
  const [moduleExitingId, setModuleExitingId] = useState(null);

  // Unified module progress state (passed up from modules via onProgressUpdate)
  const [moduleProgressState, setModuleProgressState] = useState({
    progress: 0,
    mode: 'idle',
    elapsed: 0,
    total: 0,
    showTimer: false,
    isPaused: false,
    currentStep: 0,
    totalSteps: 0,
  });

  const sessionPhase = useSessionStore((state) => state.sessionPhase);
  const timeline = useSessionStore((state) => state.timeline);
  const comeUpCheckIn = useSessionStore((state) => state.comeUpCheckIn);
  const phaseTransitions = useSessionStore((state) => state.phaseTransitions);
  const transitionData = useSessionStore((state) => state.transitionData);
  const booster = useSessionStore((state) => state.booster);
  const peakCheckIn = useSessionStore((state) => state.peakCheckIn);
  const closingCheckIn = useSessionStore((state) => state.closingCheckIn);
  const substanceChecklist = useSessionStore((state) => state.substanceChecklist);
  const followUp = useSessionStore((state) => state.followUp);
  const activePreSessionModule = useSessionStore((state) => state.activePreSessionModule);
  const completePreSessionModule = useSessionStore((state) => state.completePreSessionModule);
  const exitPreSessionModule = useSessionStore((state) => state.exitPreSessionModule);
  const abandonModule = useSessionStore((state) => state.abandonModule);
  const completeModule = useSessionStore((state) => state.completeModule);
  const skipModule = useSessionStore((state) => state.skipModule);
  const startPreSessionModule = useSessionStore((state) => state.startPreSessionModule);
  const getCurrentModule = useSessionStore((state) => state.getCurrentModule);
  const getNextModule = useSessionStore((state) => state.getNextModule);
  const startModule = useSessionStore((state) => state.startModule);
  const showBoosterModal = useSessionStore((state) => state.showBoosterModal);
  const expireBooster = useSessionStore((state) => state.expireBooster);
  const endComeUpCheckInSnooze = useSessionStore((state) => state.endComeUpCheckInSnooze);
  // Subscribe to modules state to trigger re-renders when modules are added/changed

  const _modules = useSessionStore((state) => state.modules);
  const inOpenSpace = _modules.inOpenSpace;
  const currentModule = getCurrentModule();
  const nextModule = getNextModule();
  const currentPhase = timeline.currentPhase;
  const activeTransition = phaseTransitions?.activeTransition;
  const boosterCheckRef = useRef(null);

  // Live countdown for follow-up phase lock
  useEffect(() => {
    if (sessionPhase !== 'completed' || !followUp?.phaseUnlockTime || Date.now() >= followUp.phaseUnlockTime) return;
    const interval = setInterval(() => setFollowUpNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [sessionPhase, followUp?.phaseUnlockTime]);

  // Trigger fade-in when component mounts
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Fade out the current module's status+control bar wrapper, then fire the
  // store action that actually unmounts the module. Used by complete / skip
  // handlers so the bars dissolve together over MODULE_EXIT_FADE_MS instead
  // of vanishing in a single frame when currentModule changes.
  const fadeOutThenDo = useCallback((instanceId, action) => {
    if (!instanceId) {
      action();
      return;
    }
    setModuleExitingId(instanceId);
    setTimeout(() => {
      action();
      setModuleExitingId(null);
    }, MODULE_EXIT_FADE_MS);
  }, []);

  // Update session elapsed time every second (during active session)
  const ingestionTime = substanceChecklist.ingestionTime;
  useEffect(() => {
    if (sessionPhase !== 'active' || !ingestionTime) return;
    const updateElapsed = () => {
      const elapsedSeconds = Math.floor((Date.now() - ingestionTime) / 1000);
      setSessionElapsed(formatTime(elapsedSeconds));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [sessionPhase, ingestionTime]);

  // Reset module progress state when module changes
  useEffect(() => {
    if (!currentModule) {
      setModuleProgressState({
        progress: 0,
        mode: 'idle',
        elapsed: 0,
        total: 0,
        showTimer: false,
        isPaused: false,
        currentStep: 0,
        totalSteps: 0,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only reset on instance change, not full object
  }, [currentModule?.instanceId]);

  // Booster timing check - polls every 60 seconds during active session
  useEffect(() => {
    if (sessionPhase !== 'active') return;
    if (!booster.considerBooster) return;
    if (booster.status === 'taken' || booster.status === 'skipped' || booster.status === 'expired') return;

    const checkBooster = () => {
      const ingestionTime = substanceChecklist.ingestionTime;
      if (!ingestionTime) return;

      const minutesSinceDose = (Date.now() - ingestionTime) / (1000 * 60);

      // Hard expire at 180 minutes — remove minimized bar and full modal
      if (minutesSinceDose >= 180) {
        expireBooster();
        return;
      }

      // Don't trigger new prompts if modal/bar is already showing
      if (booster.isModalVisible) return;

      // Expire silently if past 150min without any prior interaction
      if (minutesSinceDose >= 150) {
        expireBooster();
        return;
      }

      // Check if we should show the prompt
      if (shouldShowBooster(booster, substanceChecklist, comeUpCheckIn)) {
        showBoosterModal();
      }
    };

    // Check immediately
    checkBooster();

    // Then poll every 60 seconds
    boosterCheckRef.current = setInterval(checkBooster, 60000);

    return () => {
      if (boosterCheckRef.current) {
        clearInterval(boosterCheckRef.current);
        boosterCheckRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- specific properties listed, full objects too broad
  }, [sessionPhase, booster.considerBooster, booster.status, booster.isModalVisible, booster.nextPromptAt, substanceChecklist.ingestionTime, comeUpCheckIn, showBoosterModal, expireBooster]);

  // Come-up check-in snooze poll. Surfaces the "How are you feeling?" bar (not the modal)
  // once `comeUpCheckIn.nextPromptAt` has elapsed. Same mechanism handles both the initial
  // 10-min appearance (seeded by startComeUpPhase) and post-snooze re-appearance after the
  // user dismisses the modal. Won't interrupt an active module — module completion has its
  // own path via completeModule/skipModule.
  useEffect(() => {
    if (sessionPhase !== 'active' || currentPhase !== 'come-up') return;

    const checkSnooze = () => {
      const { comeUpCheckIn: c, modules } = useSessionStore.getState();
      if (c.isVisible) return;
      if (!c.nextPromptAt || Date.now() < c.nextPromptAt) return;
      if (modules.currentModuleInstanceId) return;
      endComeUpCheckInSnooze();
    };

    checkSnooze();
    const id = setInterval(checkSnooze, 60000);
    return () => clearInterval(id);
  }, [sessionPhase, currentPhase, endComeUpCheckInSnooze]);

  // Auto-start next module when appropriate
  useEffect(() => {
    // Don't auto-start if:
    // - Not in active phase
    // - Already have a current module
    // - Peak check-in modal is showing (user must dismiss it first)
    // - User is in open space mode (completed modules, resting intentionally)
    if (sessionPhase !== 'active') return;
    if (currentModule) return;
    if (peakCheckIn.isVisible) return;
    if (inOpenSpace) return; // Don't auto-start when in open space

    // Start next module if available
    // Note: The check-in modal overlay naturally blocks user interaction,
    // so the module can be "started" in the background while the modal shows
    if (nextModule) {
      startModule(nextModule.instanceId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- inOpenSpace aliased from _modules.inOpenSpace which is in deps
  }, [sessionPhase, currentModule, nextModule, startModule, peakCheckIn.isVisible, _modules.inOpenSpace]);

  // Handler to update module progress state (called by modules via onProgressUpdate)
  // Memoized with useCallback to prevent infinite loops in child useEffects
  const handleProgressUpdate = useCallback((progressState) => {
    setModuleProgressState((prev) => {
      // Only update if values actually changed to prevent unnecessary re-renders
      if (
        prev.progress === progressState.progress &&
        prev.mode === progressState.mode &&
        prev.elapsed === progressState.elapsed &&
        prev.total === progressState.total &&
        prev.showTimer === progressState.showTimer &&
        prev.isPaused === progressState.isPaused &&
        prev.currentStep === progressState.currentStep &&
        prev.totalSteps === progressState.totalSteps
      ) {
        return prev;
      }
      return progressState;
    });
  }, []);

  const substanceChecklistSubPhase = useSessionStore(
    (state) => state.preSubstanceActivity.substanceChecklistSubPhase
  );

  const renderSubstanceChecklistRouter = () => {
    switch (substanceChecklistSubPhase) {
      case 'pre-session-intro':
        return <TransitionModule config={openingRitualConfig} />;
      case 'part1':
      default:
        return <SubstanceChecklist />;
    }
  };

  // Build center content for active session status bar
  const buildTimerCenterContent = () => {
    if (moduleProgressState.showTimer && moduleProgressState.mode === 'timer') {
      return (
        <span className={`text-[10px] uppercase tracking-wider whitespace-nowrap transition-opacity
          ${moduleProgressState.isPaused ? 'text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-secondary)]'}`}>
          {formatTime(moduleProgressState.elapsed)} / {formatTime(moduleProgressState.total)}
        </span>
      );
    }
    return null;
  };

  // Build phase label for active session
  const buildPhaseLabel = (phase) => {
    const config = PHASE_CONFIG[phase] || PHASE_CONFIG['come-up'];
    return `Phase ${config.number} · ${config.name}`;
  };

  const renderContent = () => {
    // If a transition is mid-overlay, keep rendering its TransitionModule even
    // after sessionPhase / activeTransition has advanced. This lets the exit
    // overlay keep running (fading out) while the new phase state is already
    // live — avoids a stale-state flash when the overlay reveals. The transition's
    // lifecycle ends when clearActiveNavigation() fires in handleExitComplete,
    // which nulls activeNavigation.transitionId and falls through to the normal
    // phase-based rendering below.
    const overlayTransitionId = transitionData?.activeNavigation?.transitionId;
    if (overlayTransitionId === 'opening-ritual') return <TransitionModule config={openingRitualConfig} />;
    if (overlayTransitionId === 'peak-transition') return <TransitionModule config={peakTransitionConfig} />;
    if (overlayTransitionId === 'peak-to-integration') return <TransitionModule config={peakToIntegrationConfig} />;
    if (overlayTransitionId === 'closing-ritual') return <TransitionModule config={closingRitualConfig} />;

    // Check for active pre-session module (renders in Active tab before session starts)
    if (activePreSessionModule) {
      const preSessionModule = _modules.items.find((m) => m.instanceId === activePreSessionModule);
      if (preSessionModule) {
        const isExiting = moduleExitingId === preSessionModule.instanceId;
        return (
          <div className="relative">
            {/* Keyed fade wrapper — see fadeOutThenDo for the full pattern. */}
            <div
              key={preSessionModule.instanceId}
              className={`transition-opacity duration-500 ${isExiting ? '' : 'animate-fadeIn'}`}
              style={{ opacity: isExiting ? 0 : 1, pointerEvents: isExiting ? 'none' : 'auto' }}
            >
              <ModuleStatusBar
                progress={moduleProgressState.progress}
                isPaused={moduleProgressState.isPaused}
                leftLabel="Pre-Session"
                centerContent={buildTimerCenterContent()}
                rightContent={
                  <button
                    onClick={() => exitPreSessionModule()}
                    className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    Exit
                  </button>
                }
              />
              <div className="pt-9">
                <ModuleRenderer
                  module={preSessionModule}
                  onProgressUpdate={handleProgressUpdate}
                  onComplete={() => fadeOutThenDo(preSessionModule.instanceId, () => completePreSessionModule(preSessionModule.instanceId))}
                  onSkip={() => fadeOutThenDo(preSessionModule.instanceId, () => abandonModule(preSessionModule.instanceId))}
                />
              </div>
            </div>
          </div>
        );
      }
    }

    switch (sessionPhase) {
      case 'not-started':
      case 'intake':
        return <ActiveEmptyState />;

      case 'pre-session': {
        // Intake complete, timeline generated ��� show Pre-Session Active Page
        const setCurrentTab = useAppStore.getState().setCurrentTab;

        // Find the first resumable pre-session module (active first, then upcoming)
        const resumableModule = _modules.items
          .filter((m) => m.phase === 'pre-session' && (m.status === 'active' || m.status === 'upcoming'))
          .sort((a, b) => {
            if (a.status === 'active' && b.status !== 'active') return -1;
            if (b.status === 'active' && a.status !== 'active') return 1;
            return a.order - b.order;
          })[0];

        return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
            <h2
              className="text-2xl mb-8 text-[var(--color-text-primary)]"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              Pre-Session
            </h2>
            <div className="mb-8">
              <AsciiMoon />
            </div>
            <button
              onClick={() => resumableModule
                ? startPreSessionModule(resumableModule.instanceId)
                : setCurrentTab('home')
              }
              className="mb-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] px-6 py-3 text-xs uppercase tracking-wider hover:opacity-80 transition-opacity"
            >
              Continue Pre-Session Activity
            </button>
            <button
              onClick={() => setCurrentTab('home')}
              className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider leading-relaxed max-w-[16rem] text-center hover:text-[var(--color-text-secondary)] transition-colors"
            >
              Click the <span className="text-[var(--accent)]">Begin Session</span> button at the bottom of your timeline when you're ready for the main session.
            </button>
          </div>
        );
      }

      case 'substance-checklist':
        return renderSubstanceChecklistRouter();

      case 'active':
        return renderActiveSession();

      case 'paused':
        return (
          <div className="min-h-[60vh] flex items-center justify-center px-6">
            <div className="text-center space-y-8">
              <p className="text-[var(--color-text-primary)]">
                Session paused.
              </p>
              <p className="text-[var(--color-text-tertiary)] max-w-sm mx-auto">
                Take your time. Resume from the Home tab when you're ready to continue.
              </p>
            </div>
          </div>
        );

      case 'completed': {
        // If a follow-up library module is actively running, render it
        if (currentModule && currentModule.phase === 'follow-up') {
          const isExiting = moduleExitingId === currentModule.instanceId;
          return (
            <div className="relative">
              <div
                key={currentModule.instanceId}
                className={`transition-opacity duration-500 ${isExiting ? '' : 'animate-fadeIn'}`}
                style={{ opacity: isExiting ? 0 : 1, pointerEvents: isExiting ? 'none' : 'auto' }}
              >
                <ModuleStatusBar
                  progress={moduleProgressState.progress}
                  isPaused={moduleProgressState.isPaused}
                  leftLabel="Follow-up"
                  centerContent={buildTimerCenterContent()}
                  rightContent={
                    <span className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider whitespace-nowrap">
                      {sessionElapsed}
                    </span>
                  }
                />

                <div className="pt-9">
                  <ModuleRenderer
                    module={currentModule}
                    onProgressUpdate={handleProgressUpdate}
                    onComplete={() => fadeOutThenDo(currentModule.instanceId, () => completeModule(currentModule.instanceId))}
                    onSkip={() => fadeOutThenDo(currentModule.instanceId, () => abandonModule(currentModule.instanceId))}
                  />
                </div>
              </div>
            </div>
          );
        }

        // Follow-up landing page (mirrors the pre-session landing page)
        const isPhaseLocked = followUp?.phaseUnlockTime && followUpNow < followUp.phaseUnlockTime;

        // Find the next available follow-up module (from library modules added to timeline)
        const nextFollowUpModule = !isPhaseLocked
          ? _modules.items
              .filter((m) => m.phase === 'follow-up' && (m.status === 'active' || m.status === 'upcoming'))
              .sort((a, b) => a.order - b.order)[0]
          : null;

        // Active countdown clock for locked phase
        let countdownClock = '';
        if (isPhaseLocked) {
          const remaining = followUp.phaseUnlockTime - followUpNow;
          const hours = Math.floor(remaining / (60 * 60 * 1000));
          const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
          const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
          countdownClock = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
            <h2
              className="text-2xl mb-4 text-[var(--color-text-primary)]"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              Follow-Up
            </h2>
            <div className="mb-6">
              <AsciiMoon />
            </div>
            {isPhaseLocked ? (
              <>
                <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider mb-2">
                  Available in
                </p>
                <p
                  className="text-3xl text-[var(--color-text-primary)] mb-4"
                  style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                >
                  {countdownClock}
                </p>
                <p
                  className="text-[var(--color-text-secondary)] text-[10px] uppercase tracking-wider leading-relaxed max-w-[16rem] text-center"
                >
                  The follow-up phase is time-locked to give you space to rest after your session. You can add activities to your timeline in the meantime.
                </p>
              </>
            ) : (
              <>
                {nextFollowUpModule ? (
                  <button
                    onClick={() => startModule(nextFollowUpModule.instanceId)}
                    className="mb-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] px-6 py-3 text-xs uppercase tracking-wider hover:opacity-80 transition-opacity"
                  >
                    Continue Follow-Up Activity
                  </button>
                ) : null}
                <p
                  className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider leading-relaxed max-w-[16rem] text-center"
                >
                  Your notes are saved in the Journal tab. You can add follow-up activities from your timeline.
                </p>
              </>
            )}
          </div>
        );
      }

      default:
        return (
          <div className="min-h-[60vh] flex items-center justify-center px-6">
            <p className="text-[var(--color-text-secondary)] text-center">
              Something went wrong. Please return to the Home tab.
            </p>
          </div>
        );
    }
  };

  const renderActiveSession = () => {
    // Check for active phase transitions first — all four use the unified TransitionModule
    if (activeTransition === 'come-up-to-peak') {
      return <TransitionModule config={peakTransitionConfig} />;
    }
    if (activeTransition === 'peak-to-integration') {
      return <TransitionModule config={peakToIntegrationConfig} />;
    }
    if (activeTransition === 'session-closing') {
      return <TransitionModule config={closingRitualConfig} />;
    }

    const sessionElapsedContent = (
      <span className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider whitespace-nowrap">
        {sessionElapsed}
      </span>
    );

    // Come-up phase: modules with check-in
    if (currentPhase === 'come-up') {
      const isExiting = currentModule && moduleExitingId === currentModule.instanceId;
      return (
        <div className="relative">
          {/* Keyed fade wrapper — see fadeOutThenDo for the full pattern.
              Key falls back to 'open-space' when no module so the wrapper
              still remounts (and re-fires animate-fadeIn) on module ↔ OpenSpace
              transitions. */}
          <div
            key={currentModule?.instanceId ?? 'open-space'}
            className={`transition-opacity duration-500 ${isExiting ? '' : 'animate-fadeIn'}`}
            style={{ opacity: isExiting ? 0 : 1, pointerEvents: isExiting ? 'none' : 'auto' }}
          >
            {/* Fixed status bar below main header */}
            <ModuleStatusBar
              progress={moduleProgressState.progress}
              isPaused={moduleProgressState.isPaused}
              leftLabel={buildPhaseLabel('come-up')}
              centerContent={buildTimerCenterContent()}
              rightContent={sessionElapsedContent}
            />

            {/* Content area with padding for status bar (h-9 = 36px) */}
            <div className="pt-9">
              {currentModule ? (
                <ModuleRenderer
                  module={currentModule}
                  onProgressUpdate={handleProgressUpdate}
                  onComplete={() => fadeOutThenDo(currentModule.instanceId, () => completeModule(currentModule.instanceId))}
                  onSkip={() => fadeOutThenDo(currentModule.instanceId, () => skipModule(currentModule.instanceId))}
                />
              ) : (
                <OpenSpace phase="come-up" />
              )}
            </div>
          </div>

          {/* Check-in modal (minimized or expanded) */}
          {comeUpCheckIn.isVisible && <ComeUpCheckIn />}

          {/* Booster consideration modal */}
          {booster.isModalVisible && <BoosterConsiderationModal />}
        </div>
      );
    }

    // Peak and Integration phases: Standard module flow
    const isExiting = currentModule && moduleExitingId === currentModule.instanceId;
    return (
      <div className="relative">
        {/* Keyed fade wrapper — see fadeOutThenDo for the full pattern. */}
        <div
          key={currentModule?.instanceId ?? 'open-space'}
          className={`transition-opacity duration-500 ${isExiting ? '' : 'animate-fadeIn'}`}
          style={{ opacity: isExiting ? 0 : 1, pointerEvents: isExiting ? 'none' : 'auto' }}
        >
          {/* Fixed status bar below main header */}
          <ModuleStatusBar
            progress={moduleProgressState.progress}
            isPaused={moduleProgressState.isPaused}
            leftLabel={buildPhaseLabel(currentPhase)}
            centerContent={buildTimerCenterContent()}
            rightContent={sessionElapsedContent}
          />

          {/* Content area with padding for status bar (h-9 = 36px) */}
          <div className="pt-9">
            {currentModule ? (
              <ModuleRenderer
                module={currentModule}
                onProgressUpdate={handleProgressUpdate}
                onComplete={() => fadeOutThenDo(currentModule.instanceId, () => completeModule(currentModule.instanceId))}
                onSkip={() => fadeOutThenDo(currentModule.instanceId, () => skipModule(currentModule.instanceId))}
              />
            ) : (
              <OpenSpace phase={currentPhase} />
            )}
          </div>
        </div>

        {/* Peak phase check-in modal */}
        {peakCheckIn.isVisible && <PeakPhaseCheckIn />}

        {/* Closing check-in modal (integration phase) */}
        {closingCheckIn.isVisible && <ClosingCheckIn />}

        {/* Booster consideration modal */}
        {booster.isModalVisible && <BoosterConsiderationModal />}
      </div>
    );
  };

  return (
    <div className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {renderContent()}
    </div>
  );
}

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
import ModuleProgressBar from './capabilities/ModuleProgressBar';
import SubstanceChecklist from '../session/SubstanceChecklist';
import PreSessionIntro from '../session/PreSessionIntro';
import ComeUpCheckIn from '../session/ComeUpCheckIn';
import PeakTransition from '../session/PeakTransition';
import BoosterConsiderationModal from '../session/BoosterConsiderationModal';
import PeakPhaseCheckIn from '../session/PeakPhaseCheckIn';
import IntegrationTransition from '../session/IntegrationTransition';
import ClosingCheckIn from '../session/ClosingCheckIn';
import ClosingRitual from '../session/ClosingRitual';
import OpenSpace from './OpenSpace';
import AsciiMoon from './capabilities/animations/AsciiMoon';
import ActiveEmptyState from './ActiveEmptyState';
import FollowUpCheckIn from '../followup/FollowUpCheckIn';
import FollowUpRevisit from '../followup/FollowUpRevisit';
import FollowUpIntegration from '../followup/FollowUpIntegration';
import FollowUpValuesCompass from '../followup/FollowUpValuesCompass';

export default function ActiveView() {
  const [isVisible, setIsVisible] = useState(false);

  // Module timer state (passed up from modules via context or prop drilling)
  const [moduleTimerState, setModuleTimerState] = useState({
    progress: 0,
    elapsed: 0,
    total: 0,
    showTimer: false,
    isPaused: false,
  });

  const sessionPhase = useSessionStore((state) => state.sessionPhase);
  const timeline = useSessionStore((state) => state.timeline);
  const comeUpCheckIn = useSessionStore((state) => state.comeUpCheckIn);
  const phaseTransitions = useSessionStore((state) => state.phaseTransitions);
  const booster = useSessionStore((state) => state.booster);
  const peakCheckIn = useSessionStore((state) => state.peakCheckIn);
  const closingCheckIn = useSessionStore((state) => state.closingCheckIn);
  const substanceChecklist = useSessionStore((state) => state.substanceChecklist);
  const activeFollowUpModule = useSessionStore((state) => state.activeFollowUpModule);
  const activePreSessionModule = useSessionStore((state) => state.activePreSessionModule);
  const completePreSessionModule = useSessionStore((state) => state.completePreSessionModule);
  const skipPreSessionModule = useSessionStore((state) => state.skipPreSessionModule);
  const exitPreSessionModule = useSessionStore((state) => state.exitPreSessionModule);
  const startPreSessionModule = useSessionStore((state) => state.startPreSessionModule);
  const getCurrentModule = useSessionStore((state) => state.getCurrentModule);
  const getNextModule = useSessionStore((state) => state.getNextModule);
  const startModule = useSessionStore((state) => state.startModule);
  const showBoosterModal = useSessionStore((state) => state.showBoosterModal);
  const expireBooster = useSessionStore((state) => state.expireBooster);
  // Subscribe to modules state to trigger re-renders when modules are added/changed
   
  const _modules = useSessionStore((state) => state.modules);
  const inOpenSpace = _modules.inOpenSpace;
  const currentModule = getCurrentModule();
  const nextModule = getNextModule();
  const currentPhase = timeline.currentPhase;
  const activeTransition = phaseTransitions?.activeTransition;
  const boosterCheckRef = useRef(null);

  // Trigger fade-in when component mounts
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Reset module timer state when module changes
  useEffect(() => {
    if (!currentModule) {
      setModuleTimerState({
        progress: 0,
        elapsed: 0,
        total: 0,
        showTimer: false,
        isPaused: false,
      });
    }
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
  }, [sessionPhase, booster.considerBooster, booster.status, booster.isModalVisible, booster.nextPromptAt, substanceChecklist.ingestionTime, comeUpCheckIn, showBoosterModal, expireBooster]);

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
  }, [sessionPhase, currentModule, nextModule, startModule, peakCheckIn.isVisible, _modules.inOpenSpace]);

  // Handler to update module timer state (called by modules)
  // Memoized with useCallback to prevent infinite loops in child useEffects
  const handleModuleTimerUpdate = useCallback((timerState) => {
    setModuleTimerState((prev) => {
      // Only update if values actually changed to prevent unnecessary re-renders
      if (
        prev.progress === timerState.progress &&
        prev.elapsed === timerState.elapsed &&
        prev.total === timerState.total &&
        prev.showTimer === timerState.showTimer &&
        prev.isPaused === timerState.isPaused
      ) {
        return prev;
      }
      return timerState;
    });
  }, []);

  const substanceChecklistSubPhase = useSessionStore(
    (state) => state.preSubstanceActivity.substanceChecklistSubPhase
  );

  const renderSubstanceChecklistRouter = () => {
    switch (substanceChecklistSubPhase) {
      case 'pre-session-intro':
        return <PreSessionIntro />;
      case 'part1':
      default:
        return <SubstanceChecklist />;
    }
  };

  const renderContent = () => {
    // Check for active follow-up modules first (rendered in Active tab)
    if (activeFollowUpModule === 'checkIn') return <FollowUpCheckIn />;
    if (activeFollowUpModule === 'revisit') return <FollowUpRevisit />;
    if (activeFollowUpModule === 'integration') return <FollowUpIntegration />;
    if (activeFollowUpModule === 'valuesCompassFollowUp') return <FollowUpValuesCompass />;

    // Check for active pre-session module (renders in Active tab before session starts)
    if (activePreSessionModule) {
      const preSessionModule = _modules.items.find((m) => m.instanceId === activePreSessionModule);
      if (preSessionModule) {
        return (
          <div className="relative">
            {/* Shared progress bar - overlaps header border */}
            <ModuleProgressBar progress={moduleTimerState.progress} isPaused={moduleTimerState.isPaused} />
            {/* Pre-Session indicator bar with optional timer */}
            <div className="fixed left-0 right-0 z-30 bg-[var(--color-bg)]" style={{ top: 'var(--header-height)' }}>
              <div className="flex items-center px-4 py-2 gap-3">
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] flex-shrink-0">
                  Pre-Session
                </span>
                {/* Center: module timer */}
                <div className="flex-1 flex justify-center min-w-0">
                  {moduleTimerState.showTimer && (
                    <span className={`text-[10px] uppercase tracking-wider whitespace-nowrap transition-opacity
                      ${moduleTimerState.isPaused ? 'text-[var(--color-text-tertiary)]' : 'text-[var(--color-text-secondary)]'}`}>
                      {formatTime(moduleTimerState.elapsed)} / {formatTime(moduleTimerState.total)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (sessionPhase === 'not-started') {
                      const { setPreviewOverlay } = useAppStore.getState();
                      setPreviewOverlay('enter');
                      setTimeout(() => setPreviewOverlay('visible'), 20);
                      setTimeout(() => {
                        exitPreSessionModule();
                        setTimeout(() => setPreviewOverlay('exit'), 100);
                        setTimeout(() => setPreviewOverlay(null), 500);
                      }, 420);
                    } else {
                      exitPreSessionModule();
                    }
                  }}
                  className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors flex-shrink-0"
                >
                  Exit
                </button>
              </div>
            </div>
            <div className="pt-9">
              <ModuleRenderer
                module={preSessionModule}
                onTimerUpdate={handleModuleTimerUpdate}
                onComplete={() => {
                  if (sessionPhase === 'not-started') {
                    const { setPreviewOverlay, setCurrentTab } = useAppStore.getState();
                    setPreviewOverlay('enter');
                    setTimeout(() => setPreviewOverlay('visible'), 20);
                    setTimeout(() => {
                      completePreSessionModule(preSessionModule.instanceId);
                      setCurrentTab('home');
                      setTimeout(() => setPreviewOverlay('exit'), 100);
                      setTimeout(() => setPreviewOverlay(null), 500);
                    }, 420);
                  } else {
                    completePreSessionModule(preSessionModule.instanceId);
                  }
                }}
                onSkip={() => {
                  if (sessionPhase === 'not-started') {
                    const { setPreviewOverlay, setCurrentTab } = useAppStore.getState();
                    setPreviewOverlay('enter');
                    setTimeout(() => setPreviewOverlay('visible'), 20);
                    setTimeout(() => {
                      skipPreSessionModule(preSessionModule.instanceId);
                      setCurrentTab('home');
                      setTimeout(() => setPreviewOverlay('exit'), 100);
                      setTimeout(() => setPreviewOverlay(null), 500);
                    }, 420);
                  } else {
                    skipPreSessionModule(preSessionModule.instanceId);
                  }
                }}
              />
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
        // Intake complete, timeline generated — show Pre-Session Active Page
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

      case 'completed':
        return (
          <div className="min-h-[60vh] flex items-center justify-center px-6">
            <div className="text-center space-y-8">
              <p className="text-[var(--color-text-secondary)]">
                Session complete.
              </p>
              <p className="text-[var(--color-text-tertiary)] max-w-sm mx-auto">
                Take time to rest and integrate. Your notes are saved in the Journal tab.
              </p>
            </div>
          </div>
        );

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
    // Check for active phase transitions first
    if (activeTransition === 'come-up-to-peak') {
      return <PeakTransition />;
    }
    if (activeTransition === 'peak-to-integration') {
      return <IntegrationTransition />;
    }
    if (activeTransition === 'session-closing') {
      return <ClosingRitual />;
    }

    // Come-up phase: modules with check-in
    if (currentPhase === 'come-up') {
      return (
        <div className="relative">
          {/* Fixed status bar below main header */}
          <ModuleStatusBar
            phase="come-up"
            progress={moduleTimerState.progress}
            moduleElapsed={moduleTimerState.elapsed}
            moduleTotal={moduleTimerState.total}
            showModuleTimer={moduleTimerState.showTimer}
            isPaused={moduleTimerState.isPaused}
          />

          {/* Content area with padding for status bar (h-9 = 36px) */}
          <div className="pt-9">
            {currentModule ? (
              <ModuleRenderer
                module={currentModule}
                onTimerUpdate={handleModuleTimerUpdate}
              />
            ) : (
              <OpenSpace phase="come-up" />
            )}
          </div>

          {/* Check-in modal (minimized or expanded) */}
          {comeUpCheckIn.isVisible && <ComeUpCheckIn />}

          {/* Booster consideration modal */}
          {booster.isModalVisible && <BoosterConsiderationModal />}
        </div>
      );
    }

    // Peak and Integration phases: Standard module flow
    return (
      <div className="relative">
        {/* Fixed status bar below main header */}
        <ModuleStatusBar
          phase={currentPhase}
          progress={moduleTimerState.progress}
          moduleElapsed={moduleTimerState.elapsed}
          moduleTotal={moduleTimerState.total}
          showModuleTimer={moduleTimerState.showTimer}
          isPaused={moduleTimerState.isPaused}
        />

        {/* Content area with padding for status bar (h-9 = 36px) */}
        <div className="pt-9">
          {currentModule ? (
            <ModuleRenderer
              module={currentModule}
              onTimerUpdate={handleModuleTimerUpdate}
            />
          ) : (
            <OpenSpace phase={currentPhase} />
          )}
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

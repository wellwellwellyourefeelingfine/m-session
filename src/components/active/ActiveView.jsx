/**
 * ActiveView Component
 * Active session display - shows current phase and module
 * Handles substance checklist, intro, check-ins, and module rendering
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSessionStore, shouldShowBooster } from '../../stores/useSessionStore';
import { useAppStore } from '../../stores/useAppStore';
import ModuleRenderer from './ModuleRenderer';
import ModuleStatusBar from './ModuleStatusBar';
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
import PhilosophyContent from '../shared/PhilosophyContent';
import FollowUpCheckIn from '../followup/FollowUpCheckIn';
import FollowUpRevisit from '../followup/FollowUpRevisit';
import FollowUpIntegration from '../followup/FollowUpIntegration';

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
  const getCurrentModule = useSessionStore((state) => state.getCurrentModule);
  const getNextModule = useSessionStore((state) => state.getNextModule);
  const startModule = useSessionStore((state) => state.startModule);
  const showBoosterModal = useSessionStore((state) => state.showBoosterModal);
  const expireBooster = useSessionStore((state) => state.expireBooster);
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

      const minutesSinceDose = (Date.now() - new Date(ingestionTime).getTime()) / (1000 * 60);

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
      if (shouldShowBooster(booster, substanceChecklist)) {
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
  }, [sessionPhase, booster.considerBooster, booster.status, booster.isModalVisible, booster.nextPromptAt, substanceChecklist.ingestionTime, showBoosterModal, expireBooster]);

  // Auto-start next module when appropriate
  useEffect(() => {
    // Don't auto-start if:
    // - Not in active phase
    // - Already have a current module
    // - Peak check-in modal is showing (user must dismiss it first)
    if (sessionPhase !== 'active') return;
    if (currentModule) return;
    if (peakCheckIn.isVisible) return;

    // Start next module if available
    // Note: The check-in modal overlay naturally blocks user interaction,
    // so the module can be "started" in the background while the modal shows
    if (nextModule) {
      startModule(nextModule.instanceId);
    }
  }, [sessionPhase, currentModule, nextModule, startModule, peakCheckIn.isVisible]);

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

    switch (sessionPhase) {
      case 'not-started':
      case 'intake':
      case 'pre-session': {
        const setCurrentTab = useAppStore.getState().setCurrentTab;
        return (
          <div className="flex flex-col items-center px-6 pt-2 pb-12 gap-6">
            <button
              onClick={() => setCurrentTab('home')}
              className="border border-[var(--accent)] bg-[var(--accent-bg)] px-5 py-2.5 text-[var(--color-text-secondary)] text-center hover:opacity-70 transition-opacity uppercase tracking-wider text-xs"
            >
              Complete your intake on the Home tab to begin your session.
            </button>
            <AsciiMoon />
            <div className="max-w-xl w-full">
              <h1 className="text-xl font-serif text-center mb-8 text-[var(--color-text-primary)]">
                Core Philosophy
              </h1>
              <PhilosophyContent />
            </div>
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

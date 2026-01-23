/**
 * ActiveView Component
 * Active session display - shows current phase and module
 * Handles substance checklist, intro, check-ins, and module rendering
 */

import { useState, useEffect, useCallback } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useAppStore } from '../../stores/useAppStore';
import ModuleRenderer from './ModuleRenderer';
import ModuleStatusBar from './ModuleStatusBar';
import SubstanceChecklist from '../session/SubstanceChecklist';
import PreSessionIntro from '../session/PreSessionIntro';
import ComeUpCheckIn from '../session/ComeUpCheckIn';
import PeakTransition from '../session/PeakTransition';
import OpenSpace from './OpenSpace';
import AsciiMoon from './capabilities/animations/AsciiMoon';
import PhilosophyContent from '../shared/PhilosophyContent';

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
  const getCurrentModule = useSessionStore((state) => state.getCurrentModule);
  const getNextModule = useSessionStore((state) => state.getNextModule);
  const startModule = useSessionStore((state) => state.startModule);
  const currentModule = getCurrentModule();
  const nextModule = getNextModule();
  const currentPhase = timeline.currentPhase;
  const activeTransition = phaseTransitions?.activeTransition;

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

  // Auto-start next module when appropriate
  useEffect(() => {
    // Don't auto-start if:
    // - Not in active phase
    // - Already have a current module
    if (sessionPhase !== 'active') return;
    if (currentModule) return;

    // Start next module if available
    // Note: The check-in modal overlay naturally blocks user interaction,
    // so the module can be "started" in the background while the modal shows
    if (nextModule) {
      startModule(nextModule.instanceId);
    }
  }, [sessionPhase, currentModule, nextModule, startModule]);

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
      </div>
    );
  };

  return (
    <div className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {renderContent()}
    </div>
  );
}

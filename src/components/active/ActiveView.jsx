/**
 * ActiveView Component
 * Active session display - shows current phase and module
 * Handles substance checklist, intro, check-ins, and module rendering
 */

import { useState, useEffect, useCallback } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import ModuleRenderer from './ModuleRenderer';
import ModuleStatusBar from './ModuleStatusBar';
import SubstanceChecklist from '../session/SubstanceChecklist';
import ComeUpIntro from '../session/ComeUpIntro';
import ComeUpCheckIn from '../session/ComeUpCheckIn';
import OpenSpace from './OpenSpace';
import AsciiMoon from './capabilities/animations/AsciiMoon';

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
  const getCurrentModule = useSessionStore((state) => state.getCurrentModule);
  const getNextModule = useSessionStore((state) => state.getNextModule);
  const startModule = useSessionStore((state) => state.startModule);
  const currentModule = getCurrentModule();
  const nextModule = getNextModule();
  const currentPhase = timeline.currentPhase;

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
    // - Waiting for check-in (during come-up)
    // - Intro not completed (during come-up)
    if (sessionPhase !== 'active') return;
    if (currentModule) return;

    // During come-up phase
    if (currentPhase === 'come-up') {
      // Don't start module if intro isn't done
      if (!comeUpCheckIn.introCompleted) return;
      // Don't start module if waiting for check-in response
      if (comeUpCheckIn.waitingForCheckIn) return;
    }

    // Start next module if available
    if (nextModule) {
      startModule(nextModule.instanceId);
    }
  }, [sessionPhase, currentModule, nextModule, currentPhase, comeUpCheckIn.introCompleted, comeUpCheckIn.waitingForCheckIn, startModule]);

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

  const renderContent = () => {
    switch (sessionPhase) {
      case 'not-started':
      case 'intake':
      case 'pre-session':
        return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 gap-8">
            <p className="text-[var(--color-text-secondary)] text-center">
              Complete your intake on the Home tab to begin your session.
            </p>
            <AsciiMoon />
          </div>
        );

      case 'substance-checklist':
        return <SubstanceChecklist />;

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
    // Come-up phase: Show intro first, then modules with check-in
    if (currentPhase === 'come-up') {
      // Show intro if not completed (no status bar during intro)
      if (!comeUpCheckIn.introCompleted) {
        return <ComeUpIntro />;
      }

      // After intro, render module or open space with status bar
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
            ) : nextModule ? (
              // Waiting for check-in before next module
              <div className="pt-20 px-6 flex items-center justify-center min-h-[40vh]">
                <p className="text-center text-[var(--color-text-tertiary)]">
                  Complete the check-in to continue...
                </p>
              </div>
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

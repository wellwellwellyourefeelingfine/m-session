/**
 * ActiveView Component
 * Active session display - shows current phase and module
 * Handles substance checklist, intro, check-ins, and module rendering
 */

import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import ModuleRenderer from './ModuleRenderer';
import SubstanceChecklist from '../session/SubstanceChecklist';
import ComeUpIntro from '../session/ComeUpIntro';
import ComeUpCheckIn from '../session/ComeUpCheckIn';
import OpenSpace from './OpenSpace';
import PhaseHeader from './PhaseHeader';

export default function ActiveView() {
  const [isVisible, setIsVisible] = useState(false);

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

  const renderContent = () => {
    switch (sessionPhase) {
      case 'not-started':
      case 'intake':
      case 'pre-session':
        return (
          <div className="min-h-[60vh] flex items-center justify-center px-6">
            <p className="text-[var(--color-text-secondary)] text-center">
              Complete your intake on the Home tab to begin your session.
            </p>
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
      // Show intro if not completed
      if (!comeUpCheckIn.introCompleted) {
        return <ComeUpIntro />;
      }

      // After intro, render module or open space
      return (
        <div className="relative">
          <PhaseHeader phase="come-up" />

          {currentModule ? (
            <ModuleRenderer module={currentModule} />
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

          {/* Check-in modal (minimized or expanded) */}
          {comeUpCheckIn.isVisible && <ComeUpCheckIn />}
        </div>
      );
    }

    // Peak and Integration phases: Standard module flow
    return (
      <div className="relative">
        <PhaseHeader phase={currentPhase} />

        {currentModule ? (
          <ModuleRenderer module={currentModule} />
        ) : (
          <OpenSpace phase={currentPhase} />
        )}
      </div>
    );
  };

  return (
    <div className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {renderContent()}
    </div>
  );
}

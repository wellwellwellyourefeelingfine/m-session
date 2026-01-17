/**
 * HomeView Component
 * Timeline and session overview
 * Shows intake → timeline editor → session progress
 * Note: Substance checklist and ComeUpIntro are shown in ActiveView
 */

import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useAppStore } from '../../stores/useAppStore';
import IntakeFlow from '../intake/IntakeFlow';
import TimelineEditor from '../timeline/TimelineEditor';

export default function HomeView() {
  const [isVisible, setIsVisible] = useState(false);
  const sessionPhase = useSessionStore((state) => state.sessionPhase);
  const startIntake = useSessionStore((state) => state.startIntake);
  const startSubstanceChecklist = useSessionStore((state) => state.startSubstanceChecklist);
  const resetSession = useSessionStore((state) => state.resetSession);
  const setCurrentTab = useAppStore((state) => state.setCurrentTab);

  // Handle Begin Session - starts substance checklist and navigates to Active tab
  const handleBeginSession = () => {
    startSubstanceChecklist();
    setCurrentTab('active');
  };

  // Trigger fade-in when component mounts
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const renderContent = () => {
    switch (sessionPhase) {
      case 'not-started':
        return (
          <div className="max-w-md mx-auto px-6 py-8 text-center">
            <h2 className="mb-6">Welcome</h2>
            <p className="mb-8 leading-relaxed text-[var(--color-text-secondary)]">
              This guide will help you create a personalized session focused on self-understanding and personal growth.
            </p>
            <p className="mb-8 text-[var(--color-text-tertiary)]">
              We'll start with a brief questionnaire to understand your intentions and preferences.
            </p>
            <button
              type="button"
              onClick={startIntake}
              className="w-full py-4 uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 bg-[var(--color-text-primary)] text-[var(--color-bg)]"
            >
              Begin Intake
            </button>
          </div>
        );

      case 'intake':
        return <IntakeFlow />;

      case 'pre-session':
        return (
          <TimelineEditor
            onBeginSession={handleBeginSession}
          />
        );

      // Substance checklist now shows in Active tab - redirect user there
      case 'substance-checklist':
        return (
          <div className="max-w-md mx-auto px-6 py-8 text-center">
            <p className="mb-6 text-[var(--color-text-secondary)]">
              Your session is starting. Go to the Active tab to continue.
            </p>
            <button
              type="button"
              onClick={() => setCurrentTab('active')}
              className="w-full py-4 uppercase tracking-wider hover:opacity-80 transition-opacity duration-300 bg-[var(--color-text-primary)] text-[var(--color-bg)]"
            >
              Go to Active
            </button>
          </div>
        );

      case 'active':
      case 'paused':
        return <TimelineEditor isActiveSession={true} />;

      case 'completed':
        return (
          <div className="max-w-md mx-auto px-6 py-8 text-center">
            <h2 className="mb-6">Session Complete</h2>
            <p className="mb-8 text-[var(--color-text-secondary)]">
              Take some time to rest and integrate your experience. Your journal entries are available in the Journal tab.
            </p>
            <button
              type="button"
              onClick={resetSession}
              className="w-full py-2 underline text-[var(--color-text-tertiary)]"
            >
              Start New Session
            </button>
          </div>
        );

      default:
        return (
          <div className="max-w-md mx-auto px-6 py-8 text-center">
            <p className="text-[var(--color-text-secondary)]">
              Something went wrong. Please refresh and try again.
            </p>
          </div>
        );
    }
  };

  return (
    <div className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {renderContent()}
    </div>
  );
}

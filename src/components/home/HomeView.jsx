/**
 * HomeView Component
 * Timeline and session overview
 * Shows intake → timeline editor → session progress
 * After completion: Shows frozen timeline + follow-up section
 * Note: Substance checklist and PreSessionIntro are shown in ActiveView
 */

import { useState, useEffect, useRef } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useAppStore } from '../../stores/useAppStore';
import IntakeFlow from '../intake/IntakeFlow';
import TimelineEditor from '../timeline/TimelineEditor';
import LeafDraw from '../active/capabilities/animations/LeafDraw';
import LeafDrawBig from '../active/capabilities/animations/LeafDrawBig';
import AsciiMoon from '../active/capabilities/animations/AsciiMoon';

/**
 * Format date nicely
 */
function formatDate(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds) {
  if (!seconds) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return `${hours}h ${minutes}m`;
}

export default function HomeView() {
  const [isVisible, setIsVisible] = useState(false);
  const sessionPhase = useSessionStore((state) => state.sessionPhase);
  const session = useSessionStore((state) => state.session);
  const substanceChecklist = useSessionStore((state) => state.substanceChecklist);
  const startIntake = useSessionStore((state) => state.startIntake);
  const startSubstanceChecklist = useSessionStore((state) => state.startSubstanceChecklist);
  const completeIntake = useSessionStore((state) => state.completeIntake);
  const setCurrentTab = useAppStore((state) => state.setCurrentTab);

  // Welcome → Intake fade transition
  const [welcomeFadingOut, setWelcomeFadingOut] = useState(false);
  const welcomeTimerRef = useRef(null);

  const handleBeginIntake = () => {
    setWelcomeFadingOut(true);
    welcomeTimerRef.current = setTimeout(() => {
      startIntake();
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (welcomeTimerRef.current) clearTimeout(welcomeTimerRef.current);
    };
  }, []);

  // Reset fade state when returning to welcome screen (e.g. after session reset)
  useEffect(() => {
    if (sessionPhase === 'not-started') {
      setWelcomeFadingOut(false);
    }
  }, [sessionPhase]);

  // Handle Begin Session - moon transition then navigate to substance checklist
  const handleBeginSession = () => {
    // Cancel any active pre-session module before starting the main session
    const activePreSession = useSessionStore.getState().activePreSessionModule;
    if (activePreSession) {
      useSessionStore.getState().exitPreSessionModule();
    }

    setTransitionStep('moon-enter');

    transitionTimersRef.current = [
      setTimeout(() => setTransitionStep('moon-visible'), 50),
      setTimeout(() => {
        startSubstanceChecklist();
        setCurrentTab('active');
      }, 200),
      setTimeout(() => setTransitionStep('moon-exit'), 2750),
      setTimeout(() => setTransitionStep('reveal'), 3550),
      setTimeout(() => setTransitionStep(null), 4700),
    ];
  };

  // Intake → pre-session transition (moon buffer)
  const [transitionStep, setTransitionStep] = useState(null);
  const transitionTimersRef = useRef([]);

  // Called by IntakeFlow after its fade-out completes
  const handleIntakeComplete = () => {
    // Put the overlay up FIRST (covers whatever is currently rendered)
    setTransitionStep('moon-enter');

    transitionTimersRef.current = [
      setTimeout(() => setTransitionStep('moon-visible'), 50),   // fade in moon (700ms)
      setTimeout(() => completeIntake(), 200),                   // generate timeline behind overlay
      setTimeout(() => setTransitionStep('moon-exit'), 2750),    // hold 2s, then fade out (700ms)
      setTimeout(() => setTransitionStep('reveal'), 3550),       // moon gone, overlay fades out (1s)
      setTimeout(() => setTransitionStep(null), 4700),           // cleanup
    ];
  };

  useEffect(() => {
    return () => transitionTimersRef.current.forEach(clearTimeout);
  }, []);

  // Trigger fade-in when component mounts
  // (isVisible starts as false, so we just schedule the reveal)
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const renderContent = () => {
    switch (sessionPhase) {
      case 'not-started':
        return (
          <div className={`max-w-md mx-auto px-6 flex flex-col items-center pt-4 transition-opacity duration-700 ease-out ${welcomeFadingOut ? 'opacity-0' : 'opacity-100'}`}>
            <div className="text-center mt-4">
              <h2
                className="text-3xl mb-4"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none', color: 'var(--color-text-primary)' }}
              >
                Welcome
              </h2>
              <div className="flex justify-center mb-4">
                <LeafDrawBig />
              </div>
              <div className="px-5 py-4 mb-4 text-left">
                <p className="uppercase tracking-[0.18em] text-[10px] text-[var(--accent)] mb-2">
                  Intake
                </p>
                <p className="text-xs leading-relaxed text-[var(--color-text-secondary)] uppercase tracking-wider">
                  A brief questionnaire to understand your intentions and preferences, best completed a few days before your session.
                </p>
              </div>
              <button
                type="button"
                onClick={handleBeginIntake}
                disabled={welcomeFadingOut}
                className="px-10 py-3 uppercase tracking-wider text-xs hover:opacity-80 transition-opacity duration-300 bg-[var(--color-text-primary)] text-[var(--color-bg)]"
              >
                Begin Intake
              </button>
            </div>
          </div>
        );

      case 'intake':
        return <IntakeFlow onComplete={handleIntakeComplete} />;

      case 'pre-session':
        return <TimelineEditor onBeginSession={handleBeginSession} />;

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
          <div className="max-w-md mx-auto px-6 pb-8">
            {/* Session Complete Header */}
            <div className="pt-6 pb-4 text-center border-b border-[var(--color-border)]">
              <h2 className="uppercase tracking-widest text-[10px] text-[var(--color-text-tertiary)] mb-2">
                Session Complete
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm">
                {formatDate(substanceChecklist?.ingestionTime || session?.closedAt)}
              </p>
              {session?.finalDurationSeconds && (
                <p className="text-[var(--color-text-tertiary)] text-xs mt-1">
                  Duration: {formatDuration(session.finalDurationSeconds)}
                </p>
              )}
            </div>

            {/* Frozen Timeline with integrated Phase 4 Follow-Up */}
            <TimelineEditor isActiveSession={false} isCompletedSession={true} />
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

      {/* Background overlay — hides content during transition, fades out to reveal */}
      {transitionStep != null && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'var(--color-bg)',
          zIndex: 10,
          opacity: transitionStep === 'reveal' ? 0 : 1,
          transition: 'opacity 1000ms ease',
          pointerEvents: 'none',
        }} />
      )}

      {/* Moon animation — floats above overlay */}
      {transitionStep?.startsWith('moon') && (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
          pointerEvents: 'none',
        }}>
          <div style={{
            opacity: transitionStep === 'moon-visible' ? 1 : 0,
            transition: 'opacity 700ms ease',
          }}>
            <AsciiMoon />
          </div>
        </div>
      )}
    </div>
  );
}

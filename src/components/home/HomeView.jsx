/**
 * HomeView Component
 * Timeline and session overview
 * Shows intake → timeline editor → session progress
 * After completion: Shows frozen timeline + follow-up section
 * Note: Substance checklist and PreSessionIntro are shown in ActiveView
 */

import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useAppStore } from '../../stores/useAppStore';
import IntakeFlow from '../intake/IntakeFlow';
import TimelineEditor from '../timeline/TimelineEditor';
import AsciiDiamond from '../active/capabilities/animations/AsciiDiamond';

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
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const sessionPhase = useSessionStore((state) => state.sessionPhase);
  const session = useSessionStore((state) => state.session);
  const substanceChecklist = useSessionStore((state) => state.substanceChecklist);
  const startIntake = useSessionStore((state) => state.startIntake);
  const startSubstanceChecklist = useSessionStore((state) => state.startSubstanceChecklist);
  const resetSession = useSessionStore((state) => state.resetSession);
  const setCurrentTab = useAppStore((state) => state.setCurrentTab);

  // Handle Begin Session - starts substance checklist and navigates to Active tab
  const handleBeginSession = () => {
    startSubstanceChecklist();
    setCurrentTab('active');
  };

  // Handle reset with confirmation
  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const handleResetConfirm = () => {
    setShowResetConfirm(false);
    resetSession();
  };

  const handleResetCancel = () => {
    setShowResetConfirm(false);
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
            <h2 className="mb-6 font-serif text-2xl" style={{ textTransform: 'none' }}>welcome to m-session</h2>
            <div className="flex justify-center mb-8">
              <AsciiDiamond />
            </div>
            <p className="mb-4 leading-relaxed">
              This is an app to guide you through an MDMA session focused on personal growth.
            </p>
            <div className="flex justify-center mb-4">
              <div className="circle-spacer" />
            </div>
            <p className="mb-4 text-[var(--color-text-tertiary)]">
              Read more about our philosophy in the active tab or the toolbar.
            </p>
            <div className="flex justify-center mb-4">
              <div className="circle-spacer" />
            </div>
            <p className="mb-8 leading-relaxed">
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

            {/* Start New Session - smaller button */}
            <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-center">
              <button
                type="button"
                onClick={handleResetClick}
                className="px-4 py-2 text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider hover:text-[var(--color-text-secondary)] transition-colors"
              >
                Start New Session
              </button>
            </div>

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
                <div className="bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-sm rounded-lg p-6 shadow-lg">
                  <h3 className="mb-4 text-[var(--color-text-primary)]">Start New Session?</h3>
                  <p className="text-[var(--color-text-secondary)] text-sm mb-6">
                    This will clear your current session data. Make sure you've downloaded any data you want to keep.
                  </p>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleResetConfirm}
                      className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
                    >
                      Yes, Start New Session
                    </button>
                    <button
                      type="button"
                      onClick={handleResetCancel}
                      className="w-full py-2 text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider hover:text-[var(--color-text-secondary)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
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

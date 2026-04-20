/**
 * HomeView Component
 * Timeline and session overview
 * Shows intake → timeline editor → session progress
 * After completion: Shows frozen timeline + follow-up section
 * Note: Substance checklist and PreSessionIntro are shown in ActiveView
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSessionStore } from '../../stores/useSessionStore';
import { useAppStore } from '../../stores/useAppStore';
import IntakeFlow from '../intake/IntakeFlow';
import TimelineEditor from '../timeline/TimelineEditor';
import { setTutorialDelay } from '../timeline/tutorialRevealFlag';
import ModuleLibraryDrawer from '../timeline/ModuleLibraryDrawer';
import ModuleDetailModal from '../timeline/ModuleDetailModal';
import { getModuleById } from '../../content/modules/library';
import LeafDrawV2 from '../active/capabilities/animations/LeafDrawV2';
import AsciiMoon from '../active/capabilities/animations/AsciiMoon';
import { useSessionHistoryStore } from '../../stores/useSessionHistoryStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { AwardIcon, CirclePlusIcon, CircleXIcon } from '../shared/Icons';
import { downloadSessionData } from '../../utils/downloadSessionData';

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
  const addModule = useSessionStore((state) => state.addModule);
  const startPreSessionModule = useSessionStore((state) => state.startPreSessionModule);
  const setCurrentTab = useAppStore((state) => state.setCurrentTab);
  const archivedSessions = useSessionHistoryStore((s) => s.sessions);
  const modules = useSessionStore((state) => state.modules);

  const journalEntries = useJournalStore((s) => s.entries);

  const recordDataExport = useSessionStore((state) => state.recordDataExport);

  // Lock in session number on first completed render
  useEffect(() => {
    if (sessionPhase === 'completed' && session?.sessionNumber == null) {
      const priorCompleted = archivedSessions.filter((s) => s.metadata?.closedAt).length;
      useSessionStore.setState((state) => ({
        session: { ...state.session, sessionNumber: priorCompleted + 1 },
      }));
    }
  }, [sessionPhase, session?.sessionNumber, archivedSessions]);

  // Preview Activity state
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [previewModule, setPreviewModule] = useState(null);
  const [previewDetailOpen, setPreviewDetailOpen] = useState(false);
  const [previewDismissing, setPreviewDismissing] = useState(false);

  // Welcome → Intake fade transition
  const [welcomeFadingOut, setWelcomeFadingOut] = useState(false);
  const welcomeTimerRef = useRef(null);

  const handleBeginIntake = () => {
    setWelcomeFadingOut(true);
    welcomeTimerRef.current = setTimeout(() => {
      startIntake();
    }, 800);
  };

  const [previewDrawerClosing, setPreviewDrawerClosing] = useState(false);

  const handlePreviewSelect = (libraryId) => {
    const moduleDef = getModuleById(libraryId);
    if (moduleDef) {
      setPreviewModule(moduleDef);
    }
    // Wait for detail modal fade-out (200ms), then slide drawer down (300ms)
    setTimeout(() => {
      setPreviewDrawerClosing(true);
      setTimeout(() => {
        setPreviewDrawerOpen(false);
        setPreviewDrawerClosing(false);
      }, 300);
    }, 200);
  };

  const handleBeginPreview = () => {
    if (!previewModule) return;
    const setPreviewOverlay = useAppStore.getState().setPreviewOverlay;
    setPreviewOverlay('enter');
    setTimeout(() => setPreviewOverlay('visible'), 20);
    setTimeout(() => {
      const result = addModule(previewModule.id, 'pre-session');
      if (result?.success) {
        setPreviewModule(null);
        startPreSessionModule(result.module.instanceId);
      }
      setTimeout(() => setPreviewOverlay('exit'), 100);
      setTimeout(() => setPreviewOverlay(null), 500);
    }, 420);
  };

  const handleClearPreview = () => {
    setPreviewDismissing(true);
    setTimeout(() => {
      setPreviewModule(null);
      setPreviewDismissing(false);
    }, 350);
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

  // Shared ritual timing — overlay + moon each fade over 700ms.
  // Sequence:
  //   0ms      mount overlay + moon at opacity 0
  //   50ms    'moon-visible' → overlay + moon fade in (700ms)
  //   800ms   content swap happens behind fully-opaque overlay
  //   1800ms  'moon-exit' → moon fades out (700ms), overlay stays opaque
  //   2500ms  'reveal' → overlay fades out (700ms) revealing new content
  //   3300ms  cleanup
  const RITUAL_CONTENT_SWAP_MS = 800;
  const RITUAL_MOON_EXIT_MS = 1800;
  const RITUAL_REVEAL_MS = 2500;
  const RITUAL_CLEANUP_MS = 3300;

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
      }, RITUAL_CONTENT_SWAP_MS),
      setTimeout(() => setTransitionStep('moon-exit'), RITUAL_MOON_EXIT_MS),
      setTimeout(() => setTransitionStep('reveal'), RITUAL_REVEAL_MS),
      setTimeout(() => setTransitionStep(null), RITUAL_CLEANUP_MS),
    ];
  };

  // Intake → pre-session transition (moon buffer)
  const [transitionStep, setTransitionStep] = useState(null);
  const transitionTimersRef = useRef([]);

  // Called by IntakeFlow after its fade-out completes
  const handleIntakeComplete = () => {
    // Tutorial appears 7s after button press (~1-1.5s after reveal finishes)
    setTutorialDelay(7000);
    useAppStore.getState().undismissBanner('timeline-tutorial');
    // Put the overlay up FIRST (covers whatever is currently rendered)
    setTransitionStep('moon-enter');

    transitionTimersRef.current = [
      setTimeout(() => setTransitionStep('moon-visible'), 50),
      setTimeout(() => completeIntake(), RITUAL_CONTENT_SWAP_MS),
      setTimeout(() => setTransitionStep('moon-exit'), RITUAL_MOON_EXIT_MS),
      setTimeout(() => setTransitionStep('reveal'), RITUAL_REVEAL_MS),
      setTimeout(() => setTransitionStep(null), RITUAL_CLEANUP_MS),
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
              <div className="flex justify-center mb-1">
                <LeafDrawV2 />
              </div>
              <div className="px-5 py-2 mb-1 text-left">
                <p className="uppercase tracking-[0.18em] text-[10px] text-[var(--accent)] mb-1">
                  Intake
                </p>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] tracking-wider">
                  A brief questionnaire to understand your intentions and preferences, best completed a few days before your session.
                </p>
              </div>
              <button
                type="button"
                onClick={handleBeginIntake}
                disabled={welcomeFadingOut}
                className="w-48 py-3 uppercase tracking-wider text-xs hover:opacity-80 transition-opacity duration-300 bg-[var(--color-text-primary)] text-[var(--color-bg)]"
              >
                Begin Intake
              </button>

              {/* Preview Activity */}
              <div className="mt-3 pb-24 flex flex-col items-center">
                {!previewModule ? (
                  <button
                    type="button"
                    onClick={() => setPreviewDrawerOpen(true)}
                    disabled={welcomeFadingOut}
                    className="w-48 py-3 uppercase tracking-wider text-xs hover:opacity-80 transition-opacity duration-300 border border-[var(--color-text-tertiary)] text-[var(--color-text-tertiary)]"
                  >
                    Preview Activity
                  </button>
                ) : (
                  <div
                    className="w-full max-w-xs overflow-hidden transition-all duration-300 ease-out"
                    style={{
                      maxHeight: previewDismissing ? '42px' : '300px',
                      opacity: previewDismissing ? 0 : 1,
                    }}
                  >
                    <div
                      className="border-2 border-[var(--color-border)] px-4 py-3 relative text-left cursor-pointer hover:border-[var(--color-text-tertiary)] transition-colors"
                      onClick={() => setPreviewDetailOpen(true)}
                    >
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleClearPreview(); }}
                        className="absolute top-2 right-2 opacity-70 hover:opacity-100 transition-opacity"
                        aria-label="Remove preview"
                      >
                        <CircleXIcon size={20} className="text-[var(--color-text-tertiary)]" />
                      </button>
                      <p className="text-[var(--color-text-primary)] text-xl leading-none pr-6" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>{previewModule.title}</p>
                      <p className="text-[var(--color-text-tertiary)] text-xs mt-1">
                        {previewModule.defaultDuration} min · {previewModule.category}
                      </p>
                      {previewModule.description && (
                        <p className="text-[var(--color-text-secondary)] text-xs mt-2 leading-relaxed">
                          {previewModule.description}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleBeginPreview(); }}
                        disabled={welcomeFadingOut}
                        className="w-48 mx-auto block mt-2 uppercase tracking-wider text-xs hover:opacity-80 transition-opacity duration-300 border border-[var(--color-text-primary)] text-[var(--color-text-primary)]"
                        style={{ padding: '11px 0' }}
                      >
                        Begin Activity
                      </button>
                    </div>
                  </div>
                )}
              </div>
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

      case 'completed': {
        const moduleItems = modules?.items || [];
        const moduleHistory = modules?.history || [];
        const preSessionCount = moduleItems.filter((m) => m.phase === 'pre-session' && m.status === 'completed').length;
        const completedCount = moduleItems.filter((m) => m.phase !== 'pre-session' && m.phase !== 'follow-up' && m.status === 'completed').length;
        const longestModule = moduleHistory.reduce((longest, m) => {
          if (!m.actualDuration) return longest;
          return !longest || m.actualDuration > longest.actualDuration ? m : longest;
        }, null);
        const longestName = longestModule?.title;
        const longestMins = longestModule?.actualDuration ? Math.round(longestModule.actualDuration / 60) : null;
        const followUpCount = moduleItems.filter((m) => m.phase === 'follow-up' && m.status === 'completed').length;
        const exportDate = session?.dataExportedAt
          ? new Date(session.dataExportedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
          : null;

        return (
          <div className="max-w-md mx-auto pb-8">
            {/* Session Complete Header */}
            <div className="pt-6 pb-4 px-6 border-b border-[var(--color-border)] flex items-start justify-between">
              <div>
                <h2
                  className="text-[22px] mb-1"
                  style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none', color: 'var(--accent)' }}
                >
                  Session Complete
                </h2>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  {formatDate(substanceChecklist?.ingestionTime || session?.closedAt)}
                </p>
                <div className="text-[var(--color-text-secondary)] text-xs mt-1.5 space-y-0.5">
                  {(substanceChecklist?.ingestionTime || session?.closedAt) && (
                    <p>
                      {substanceChecklist?.ingestionTime && new Date(substanceChecklist.ingestionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {substanceChecklist?.ingestionTime && session?.closedAt && ' – '}
                      {session?.closedAt && new Date(session.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {session?.finalDurationSeconds && (
                    <p>Duration: {formatDuration(session.finalDurationSeconds)}</p>
                  )}
                  <p>Pre-session activities: {preSessionCount}</p>
                  <p>Session activities: {completedCount}</p>
                  <p>Follow-up activities: {followUpCount}</p>
                  <p>Longest activity: {longestName ? `${longestName}${longestMins ? ` (${longestMins}m)` : ''}` : 'n/a'}</p>
                  <p>Journal entries: {journalEntries.length}</p>
                  <p>Session data: {exportDate
                    ? `Exported on ${exportDate}`
                    : <button
                        onClick={() => { downloadSessionData(); recordDataExport(); }}
                        className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                        style={{ textTransform: 'none' }}
                      >
                        Not yet exported
                        <CirclePlusIcon size={14} className="text-[var(--accent)]" />
                      </button>
                  }</p>
                </div>
              </div>
              <AwardIcon
                size={48}
                className="text-[var(--accent)] flex-shrink-0 mt-1"
                number={session?.sessionNumber > 1 ? session.sessionNumber : undefined}
              />
            </div>

            {/* Frozen Timeline with integrated Phase 4 Follow-Up */}
            <TimelineEditor isActiveSession={false} isCompletedSession={true} />

          </div>
        );
      }

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

      {/* Module Library Drawer for Preview Activity */}
      {previewDrawerOpen && (
        <ModuleLibraryDrawer
          phase="preview"
          onSelect={handlePreviewSelect}
          onClose={() => setPreviewDrawerOpen(false)}
          externalClosing={previewDrawerClosing}
        />
      )}

      {/* Preview Activity Detail Modal */}
      {previewDetailOpen && previewModule && (
        <ModuleDetailModal
          isOpen={previewDetailOpen}
          onClose={() => setPreviewDetailOpen(false)}
          module={{ libraryId: previewModule.id, title: previewModule.title, duration: previewModule.defaultDuration }}
          mode="info"
        />
      )}

      {/* Background overlay + moon animation — portaled to document.body so
          the overlay survives the tab switch that happens mid-transition
          (handleBeginSession switches to the Active tab at 200ms; HomeView
          then becomes display:none, and anything rendered inside it would
          vanish instantly). Rendering via portal keeps the overlay visible
          until the transition completes. */}
      {transitionStep != null && createPortal(
        <>
          {/* Background overlay — fades in to cover, stays opaque while the
              content swap happens, then fades out to reveal. Constrained to the
              content area between header and tab bar so the header and footer
              remain visible above the overlay. Both fades run at 700ms for
              ritual pacing. */}
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--color-bg)',
            // Must sit above Header (z-40), ModuleStatusBar (z-30),
            // ModuleControlBar (z-30), and the volume-slider popup (z-40)
            // so the entire app chrome is covered during the begin-session
            // ritual. Kept below modal backdrops (z-50) so urgent modals
            // can still appear on top if needed.
            zIndex: 45,
            opacity: (transitionStep === 'moon-enter' || transitionStep === 'reveal') ? 0 : 1,
            transition: 'opacity 700ms ease',
            pointerEvents: 'none',
          }} />

          {/* Moon animation — floats above overlay, centered on the full viewport */}
          {transitionStep?.startsWith('moon') && (
            <div style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 46,
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
        </>,
        document.body
      )}
    </div>
  );
}

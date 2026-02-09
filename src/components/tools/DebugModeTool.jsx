/**
 * DebugModeTool Component
 * Debug shortcuts for testing different session states.
 * Contains multiple scenarios: come-up test, follow-up test, etc.
 */

import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useToolsStore } from '../../stores/useToolsStore';

// ─── Come-Up Test ───────────────────────────────────────────────

function ComeUpTest() {
  const sessionPhase = useSessionStore((state) => state.sessionPhase);
  const resetSession = useSessionStore((state) => state.resetSession);
  const [showConfirm, setShowConfirm] = useState(false);

  const isActive = sessionPhase === 'active';

  const handleLaunch = () => {
    resetSession();
    useJournalStore.setState({ entries: [], navigation: { currentView: 'editor', activeEntryId: null } });
    useToolsStore.setState({ openTools: [], timerDuration: 0, timerRemaining: 0, timerActive: false, timerStartTime: null });

    setTimeout(() => {
      const store = useSessionStore.getState();
      const now = Date.now();
      const twentyMinutesAgo = now - 20 * 60 * 1000;

      useSessionStore.setState({
        intake: {
          ...store.intake,
          isComplete: true,
          responses: {
            ...store.intake.responses,
            sessionDuration: '4-6h',
            experienceLevel: 'experienced',
            sessionMode: 'solo-guided',
            guidanceLevel: 'balanced',
            considerBooster: 'no',
            safeSpace: 'yes',
            emergencyContact: 'yes',
            heartConditions: 'no',
            psychiatricHistory: 'no',
          },
        },
        sessionPhase: 'pre-session',
        timeline: {
          ...store.timeline,
          targetDuration: 300,
        },
      });

      useSessionStore.getState().generateTimelineFromIntake();

      useSessionStore.setState({
        substanceChecklist: {
          ...useSessionStore.getState().substanceChecklist,
          hasTakenSubstance: true,
          ingestionTime: twentyMinutesAgo,
          ingestionTimeConfirmed: true,
        },
        preSubstanceActivity: {
          ...useSessionStore.getState().preSubstanceActivity,
          substanceChecklistSubPhase: 'pre-session-intro',
          completedActivities: ['intention'],
        },
      });

      useSessionStore.getState().startSession();
      setShowConfirm(false);
    }, 50);
  };

  return (
    <>
      <div className="space-y-3">
        <p className="text-sm text-[var(--color-text-primary)]">Come-Up Test</p>
        <p className="text-[12px] text-[var(--color-text-tertiary)]">
          Jumps into an active come-up phase with ingestion set to 20 minutes ago.
        </p>

        {isActive && (
          <p className="text-[12px] text-[var(--accent)]">
            A session is currently active. Launching will reset and restart.
          </p>
        )}

        <button
          onClick={() => setShowConfirm(true)}
          className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
        >
          Launch Come-Up Test
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm p-6 space-y-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <p className="text-[12px] uppercase tracking-wider font-bold">Come-Up Test</p>
            <p style={{ color: 'var(--text-primary)' }}>
              This will {isActive ? 'reset the current session and ' : ''}generate a default 5-hour timeline
              and jump straight into the come-up phase with ingestion time set to 20 minutes ago.
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={handleLaunch}
                className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                Launch
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-70"
                style={{ border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Follow-Up Test ─────────────────────────────────────────────

function FollowUpTest() {
  const sessionPhase = useSessionStore((state) => state.sessionPhase);
  const resetSession = useSessionStore((state) => state.resetSession);
  const [showConfirm, setShowConfirm] = useState(false);

  const isActive = sessionPhase === 'active';

  const handleLaunch = () => {
    resetSession();
    useJournalStore.setState({ entries: [], navigation: { currentView: 'editor', activeEntryId: null } });
    useToolsStore.setState({ openTools: [], timerDuration: 0, timerRemaining: 0, timerActive: false, timerStartTime: null });

    setTimeout(() => {
      const store = useSessionStore.getState();
      const now = Date.now();
      const DAY_MS = 24 * 60 * 60 * 1000;
      const HOURS_49 = 49 * 60 * 60 * 1000;

      // Simulate: session closed 49 hours ago, lasted ~4 hours
      const closedAt = now - HOURS_49;
      const sessionDurationMs = 4 * 60 * 60 * 1000; // 4 hours
      const ingestionTime = closedAt - sessionDurationMs;

      // 1. Set intake as complete
      useSessionStore.setState({
        intake: {
          ...store.intake,
          isComplete: true,
          responses: {
            ...store.intake.responses,
            sessionDuration: '4-6h',
            experienceLevel: 'experienced',
            sessionMode: 'solo-guided',
            guidanceLevel: 'balanced',
            considerBooster: 'no',
            safeSpace: 'yes',
            emergencyContact: 'yes',
            heartConditions: 'no',
            psychiatricHistory: 'no',
          },
        },
        sessionPhase: 'pre-session',
        timeline: {
          ...store.timeline,
          targetDuration: 300,
        },
      });

      // 2. Generate the timeline (creates all modules)
      useSessionStore.getState().generateTimelineFromIntake();

      // 3. Set substance checklist with past ingestion
      useSessionStore.setState({
        substanceChecklist: {
          ...useSessionStore.getState().substanceChecklist,
          hasTakenSubstance: true,
          ingestionTime,
          ingestionTimeConfirmed: true,
        },
        preSubstanceActivity: {
          ...useSessionStore.getState().preSubstanceActivity,
          substanceChecklistSubPhase: 'pre-session-intro',
          completedActivities: ['intention'],
        },
      });

      // 4. Set session as completed 26 hours ago with follow-up unlocks
      useSessionStore.setState({
        sessionPhase: 'completed',
        phaseTransitions: {
          ...useSessionStore.getState().phaseTransitions,
          activeTransition: null,
          transitionCompleted: true,
        },
        transitionCaptures: {
          ...useSessionStore.getState().transitionCaptures,
          peak: {
            bodySensations: ['warmth', 'openness'],
            oneWord: 'connected',
            completedAt: ingestionTime + 2 * 60 * 60 * 1000,
          },
          integration: {
            ...useSessionStore.getState().transitionCaptures.integration,
            completedAt: ingestionTime + 3 * 60 * 60 * 1000,
          },
          closing: {
            selfGratitude: 'Thank you for being brave enough to look inward.',
            futureMessage: 'Remember this feeling of openness. Carry it gently.',
            commitment: 'I will practice being more present with the people I love.',
            completedAt: closedAt,
          },
        },
        timeline: {
          ...useSessionStore.getState().timeline,
          phases: {
            ...useSessionStore.getState().timeline.phases,
            integration: {
              ...useSessionStore.getState().timeline.phases.integration,
              endedAt: closedAt,
            },
          },
        },
        session: {
          closedAt,
          finalDurationSeconds: Math.floor(sessionDurationMs / 1000),
        },
        followUp: {
          unlockTimes: {
            checkIn: closedAt + DAY_MS,         // 24h after close — already passed (26h ago)
            revisit: closedAt + DAY_MS,         // 24h after close — already passed
            integration: closedAt + 2 * DAY_MS, // 48h after close — still locked
          },
          modules: {
            checkIn: {
              status: 'available',
              completedAt: null,
              feeling: null,
              note: null,
            },
            revisit: {
              status: 'available',
              completedAt: null,
              reflection: null,
            },
            integration: {
              status: 'available',
              completedAt: null,
              emerged: null,
              commitmentStatus: null,
              commitmentResponse: null,
            },
          },
        },
        activeFollowUpModule: null,
      });

      setShowConfirm(false);
    }, 50);
  };

  return (
    <>
      <div className="space-y-3">
        <p className="text-sm text-[var(--color-text-primary)]">Follow-Up Test</p>
        <p className="text-[12px] text-[var(--color-text-tertiary)]">
          Simulates a completed session 49 hours ago. All three follow-up
          modules (check-in, revisit, integration) will be unlocked.
        </p>

        {isActive && (
          <p className="text-[12px] text-[var(--accent)]">
            A session is currently active. Launching will reset and restart.
          </p>
        )}

        <button
          onClick={() => setShowConfirm(true)}
          className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
        >
          Launch Follow-Up Test
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm p-6 space-y-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <p className="text-[12px] uppercase tracking-wider font-bold">Follow-Up Test</p>
            <p style={{ color: 'var(--text-primary)' }}>
              This will {isActive ? 'reset the current session and ' : ''}simulate a completed session
              from 49 hours ago. All three follow-up modules will be available.
              Closing ritual captures will be pre-filled with test data.
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={handleLaunch}
                className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                Launch
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-70"
                style={{ border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main Debug Mode Component ──────────────────────────────────

export default function DebugModeTool() {
  return (
    <div className="py-6 px-6 max-w-xl mx-auto space-y-8">
      <div className="space-y-2">
        <h3 className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)]">
          Debug Mode
        </h3>
        <p className="text-[12px] text-[var(--color-text-tertiary)]">
          Test shortcuts for jumping into specific session states.
        </p>
      </div>

      <ComeUpTest />

      <div className="border-t border-[var(--color-border)]" />

      <FollowUpTest />
    </div>
  );
}

/**
 * DebugModeTool Component
 * Debug shortcuts for testing different session states.
 * Contains multiple scenarios: come-up test, follow-up test, etc.
 */

import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useToolsStore } from '../../stores/useToolsStore';
import { useAppStore } from '../../stores/useAppStore';
import { getModuleById } from '../../content/modules';

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
        sessionProfile: {
          ...store.sessionProfile,
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
        intake: {
          ...store.intake,
          isComplete: true,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
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
      const HOURS_49 = 49 * 60 * 60 * 1000;

      // Simulate: session closed 49 hours ago, lasted ~4 hours
      const closedAt = now - HOURS_49;
      const sessionDurationMs = 4 * 60 * 60 * 1000; // 4 hours
      const ingestionTime = closedAt - sessionDurationMs;

      // 1. Set sessionProfile + intake as complete
      useSessionStore.setState({
        sessionProfile: {
          ...store.sessionProfile,
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
        intake: {
          ...store.intake,
          isComplete: true,
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

      // 4. Set session as completed 49 hours ago with the phase-wide
      //    follow-up lock already elapsed, and auto-add the
      //    integration-reflection-journal follow-up module (mirrors what
      //    completeSession does in the live flow).
      const irLib = getModuleById('integration-reflection-journal');
      const followUpInstance = {
        instanceId: `${Date.now()}-debug-followup`,
        libraryId: 'integration-reflection-journal',
        phase: 'follow-up',
        title: irLib?.title || 'Integration Reflection',
        duration: irLib?.defaultDuration || 25,
        status: 'upcoming',
        order: 0,
        content: irLib?.content || {},
        startedAt: null,
        completedAt: null,
      };
      const currentModules = useSessionStore.getState().modules;
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
          // Phase-wide 8h lock already elapsed (session ended 49h ago)
          phaseUnlockTime: closedAt + 8 * 60 * 60 * 1000,
        },
        modules: {
          ...currentModules,
          items: [...currentModules.items, followUpInstance],
        },
      });

      setShowConfirm(false);
    }, 50);
  };

  return (
    <>
      <div className="space-y-3">
        <p className="text-sm text-[var(--color-text-primary)]">Follow-Up Test</p>
        <p className="text-[12px] text-[var(--color-text-tertiary)]">
          Simulates a completed session 49 hours ago with the 8-hour
          follow-up phase lock already elapsed. The Integration Reflection
          follow-up module is auto-added to the timeline.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="w-full max-w-sm p-6 space-y-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <p className="text-[12px] uppercase tracking-wider font-bold">Follow-Up Test</p>
            <p style={{ color: 'var(--text-primary)' }}>
              This will {isActive ? 'reset the current session and ' : ''}simulate a completed session
              from 49 hours ago. The Integration Reflection follow-up module
              will be available. Closing ritual captures will be pre-filled
              with test data.
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

// ─── Booster Peak Test ──────────────────────────────────────────

function BoosterPeakTest() {
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
      const ninetyMinutesAgo = now - 90 * 60 * 1000;
      const comeUpStarted = ninetyMinutesAgo;
      const comeUpEnded = ninetyMinutesAgo + 45 * 60 * 1000;
      // Synthetic peak-phase timestamps used by the simulated completed
      // modules + helper-modal journal entry below. All fall inside the
      // peak window (comeUpEnded → now) so the synthesis transition's
      // adaptive section sees them as "during peak".
      const peakPhaseStart = comeUpEnded;
      const valuesCompassStartedAt = peakPhaseStart + 5 * 60 * 1000;
      const valuesCompassCompletedAt = peakPhaseStart + 15 * 60 * 1000;
      const protectorStartedAt = peakPhaseStart + 18 * 60 * 1000;
      const protectorCompletedAt = peakPhaseStart + 28 * 60 * 1000;
      const stayWithItStartedAt = peakPhaseStart + 30 * 60 * 1000;
      const stayWithItCompletedAt = peakPhaseStart + 40 * 60 * 1000;
      const helperModalEntryAt = peakPhaseStart + 22 * 60 * 1000;

      // Create intention journal entry
      const intentionEntry = useJournalStore.getState().addEntry({
        content: 'INTENTION:\n\nTo dream like Hans Castorp in the snow.',
        source: 'session',
        moduleTitle: 'Pre-Substance Intention',
        isEdited: false,
      });

      // Simulate a Helper Modal usage during peak so `helperUsedDuring.peak`
      // evaluates true in the synthesis transition — triggers the "Reaching
      // Out" adaptive screen. Override createdAt after adding because
      // addEntry hard-codes `Date.now()`.
      const helperEntry = useJournalStore.getState().addEntry({
        content: 'HELPER MODAL · Peak\n\nCategory: Feeling overwhelmed\nAction chosen: Simple Grounding',
        source: 'session',
        moduleTitle: 'Helper Modal',
        isEdited: false,
      });
      useJournalStore.setState((s) => ({
        entries: s.entries.map((e) =>
          e.id === helperEntry.id ? { ...e, createdAt: helperModalEntryAt, updatedAt: helperModalEntryAt } : e
        ),
      }));

      useSessionStore.setState({
        sessionProfile: {
          ...store.sessionProfile,
          sessionDuration: '4-6h',
          experienceLevel: 'experienced',
          sessionMode: 'solo-guided',
          guidanceLevel: 'balanced',
          considerBooster: 'yes',
          safeSpace: 'yes',
          emergencyContact: 'yes',
          heartConditions: 'no',
          psychiatricHistory: 'no',
          holdingQuestion: 'To dream like Hans Castorp in the snow.',
        },
        intake: {
          ...store.intake,
          isComplete: true,
        },
        sessionPhase: 'pre-session',
        timeline: {
          ...store.timeline,
          targetDuration: 300,
        },
      });

      useSessionStore.getState().generateTimelineFromIntake();

      // Mark come-up modules as completed
      const currentItems = useSessionStore.getState().modules.items;
      const updatedItems = currentItems.map((m) => {
        if (m.phase === 'come-up') {
          return { ...m, status: 'completed', startedAt: comeUpStarted, completedAt: comeUpEnded };
        }
        return m;
      });

      // Find first peak module to set as active
      const firstPeakModule = updatedItems
        .filter((m) => m.phase === 'peak' && m.status === 'upcoming')
        .sort((a, b) => a.order - b.order)[0];

      if (firstPeakModule) {
        const idx = updatedItems.findIndex((m) => m.instanceId === firstPeakModule.instanceId);
        updatedItems[idx] = { ...firstPeakModule, status: 'active', startedAt: now };
      }

      // Simulated completed modules during peak — so the synthesis
      // transition's adaptive section shows all 4 gated screens:
      //   - "Your Values" (values-compass)
      //   - "Parts That Spoke" (protector-dialogue)
      //   - "Staying With It" (stay-with-it)
      //   - "Reaching Out" (helperUsedDuring: 'peak' — covered by the
      //     helper-modal journal entry above)
      // These entries live only in `modules.history` (what
      // `useTransitionModuleState.sessionData.modulesCompleted` reads),
      // not in `modules.items`, so they don't pollute the live timeline.
      const simulatedPeakHistory = [
        {
          instanceId: `debug-values-compass-${now}`,
          libraryId: 'values-compass',
          phase: 'peak',
          title: 'Values Compass',
          status: 'completed',
          order: 90,
          startedAt: valuesCompassStartedAt,
          completedAt: valuesCompassCompletedAt,
          actualDuration: Math.floor((valuesCompassCompletedAt - valuesCompassStartedAt) / 1000),
          duration: 15,
          content: {},
        },
        {
          instanceId: `debug-protector-dialogue-${now}`,
          // Adaptive conditions check `moduleCompleted: 'protector-dialogue'`
          // literally, so we use the parent id (not the -p1/-p2 variants).
          libraryId: 'protector-dialogue',
          phase: 'peak',
          title: 'Protector Dialogue',
          status: 'completed',
          order: 91,
          startedAt: protectorStartedAt,
          completedAt: protectorCompletedAt,
          actualDuration: Math.floor((protectorCompletedAt - protectorStartedAt) / 1000),
          duration: 10,
          content: {},
        },
        {
          instanceId: `debug-stay-with-it-${now}`,
          libraryId: 'stay-with-it',
          phase: 'peak',
          title: 'Stay With It',
          status: 'completed',
          order: 92,
          startedAt: stayWithItStartedAt,
          completedAt: stayWithItCompletedAt,
          actualDuration: Math.floor((stayWithItCompletedAt - stayWithItStartedAt) / 1000),
          duration: 10,
          content: {},
        },
      ];

      useSessionStore.setState({
        sessionPhase: 'active',
        sessionProfile: {
          ...useSessionStore.getState().sessionProfile,
          plannedDosageMg: 100,
          dosageFeedback: 'moderate',
          touchstone: 'snow',
          intentionJournalEntryId: intentionEntry.id,
        },
        substanceChecklist: {
          ...useSessionStore.getState().substanceChecklist,
          hasTakenSubstance: true,
          ingestionTime: ninetyMinutesAgo,
          ingestionTimeConfirmed: true,
        },
        preSubstanceActivity: {
          ...useSessionStore.getState().preSubstanceActivity,
          substanceChecklistSubPhase: 'pre-session-intro',
          completedActivities: ['intention'],
        },
        booster: {
          ...useSessionStore.getState().booster,
          considerBooster: true,
          boosterPrepared: true,
          status: 'pending',
        },
        timeline: {
          ...useSessionStore.getState().timeline,
          currentPhase: 'peak',
          phases: {
            ...useSessionStore.getState().timeline.phases,
            comeUp: {
              ...useSessionStore.getState().timeline.phases.comeUp,
              startedAt: comeUpStarted,
              endedAt: comeUpEnded,
              endedBy: 'user-checkin',
            },
            peak: {
              ...useSessionStore.getState().timeline.phases.peak,
              startedAt: comeUpEnded,
            },
          },
        },
        phaseTransitions: {
          ...useSessionStore.getState().phaseTransitions,
          activeTransition: null,
          transitionCompleted: true,
        },
        comeUpCheckIn: {
          ...useSessionStore.getState().comeUpCheckIn,
          isVisible: false,
          isMinimized: true,
          hasIndicatedFullyArrived: true,
        },
        modules: {
          ...useSessionStore.getState().modules,
          items: updatedItems,
          activeModuleId: firstPeakModule?.instanceId || null,
          // Merge the simulated peak completions into history. Any prior
          // history entries are preserved (reset should have cleared them,
          // but spread defensively in case a future change adds defaults).
          history: [
            ...(useSessionStore.getState().modules.history || []),
            ...simulatedPeakHistory,
          ],
        },
      });

      setShowConfirm(false);
    }, 50);
  };

  return (
    <>
      <div className="space-y-3">
        <p className="text-sm text-[var(--color-text-primary)]">Booster Peak Test</p>
        <p className="text-[12px] text-[var(--color-text-tertiary)]">
          Jumps into the peak phase with a pending booster, ingestion set to 90 minutes ago,
          and a pre-filled intention. Also seeds simulated peak-phase history so the synthesis
          transition's adaptive section shows all four gated screens: Values Compass, Protector
          Dialogue, Stay With It, and Reaching Out (via a faux Helper Modal entry).
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
          Launch Booster Peak Test
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="w-full max-w-sm p-6 space-y-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <p className="text-[12px] uppercase tracking-wider font-bold">Booster Peak Test</p>
            <p style={{ color: 'var(--text-primary)' }}>
              This will {isActive ? 'reset the current session and ' : ''}generate a 5-hour timeline
              with a pending booster, skip to the peak phase with ingestion 90 minutes ago,
              and a pre-filled intention.
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

// ─── Begin Session Test ─────────────────────────────────────────

function BeginSessionTest() {
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

      useSessionStore.setState({
        sessionProfile: {
          ...store.sessionProfile,
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
        intake: {
          ...store.intake,
          isComplete: true,
        },
        sessionPhase: 'pre-session',
        timeline: {
          ...store.timeline,
          targetDuration: 300,
        },
      });

      useSessionStore.getState().generateTimelineFromIntake();

      useAppStore.getState().setCurrentTab('home');
      setShowConfirm(false);
    }, 50);
  };

  return (
    <>
      <div className="space-y-3">
        <p className="text-sm text-[var(--color-text-primary)]">Begin Session Test</p>
        <p className="text-[12px] text-[var(--color-text-tertiary)]">
          Primes a pre-session state with a generated 5-hour timeline. Lands you on the Home
          tab with a Begin Session button ready to tap — for testing the substance checklist
          and opening ritual end-to-end.
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
          Launch Begin Session Test
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <div className="w-full max-w-sm p-6 space-y-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <p className="text-[12px] uppercase tracking-wider font-bold">Begin Session Test</p>
            <p style={{ color: 'var(--text-primary)' }}>
              This will {isActive ? 'reset the current session and ' : ''}generate a default 5-hour
              timeline and land you on the Home tab, ready to tap Begin Session.
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

      <BeginSessionTest />

      <div className="border-t border-[var(--color-border)]" />

      <ComeUpTest />

      <div className="border-t border-[var(--color-border)]" />

      <BoosterPeakTest />

      <div className="border-t border-[var(--color-border)]" />

      <FollowUpTest />
    </div>
  );
}

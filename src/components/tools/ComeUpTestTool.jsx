/**
 * ComeUpTestTool Component
 * Debug shortcut: jumps directly into an active session in the come-up phase.
 * Sets ingestion time to 20 minutes ago, generates a default timeline,
 * and starts the session — bypassing intake, substance checklist, and pre-session intro.
 */

import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useToolsStore } from '../../stores/useToolsStore';

export default function ComeUpTestTool() {
  const sessionPhase = useSessionStore((state) => state.sessionPhase);
  const resetSession = useSessionStore((state) => state.resetSession);
  const [showConfirm, setShowConfirm] = useState(false);

  const isActive = sessionPhase === 'active';

  const handleLaunch = () => {
    // Reset everything first
    resetSession();
    useJournalStore.setState({ entries: [], navigation: { currentView: 'editor', activeEntryId: null } });
    useToolsStore.setState({ openTools: [], timerDuration: 0, timerRemaining: 0, timerActive: false, timerStartTime: null });

    // Small delay so persisted reset completes before we set new state
    setTimeout(() => {
      const store = useSessionStore.getState();
      const now = Date.now();
      const twentyMinutesAgo = now - 20 * 60 * 1000;

      // 1. Mark intake as complete with sensible defaults
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

      // 3. Set substance checklist as completed with ingestion 20 min ago
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

      // 4. Start the session (sets sessionPhase='active', currentPhase='come-up')
      useSessionStore.getState().startSession();

      setShowConfirm(false);
    }, 50);
  };

  return (
    <div className="py-6 px-6 max-w-xl mx-auto">
      <div className="space-y-4">
        <p className="text-[12px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
          Debug shortcut — jumps directly into an active come-up phase session
          with ingestion set to 20 minutes ago.
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

      {/* Confirmation Modal */}
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
    </div>
  );
}

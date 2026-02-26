/**
 * Session History Store
 * Manages archived session snapshots for session switching.
 * Each archive contains the full session store state + journal entries
 * so sessions can be restored as the live session later.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSessionStore, migrateSessionState, SESSION_STORE_VERSION } from './useSessionStore';
import { useJournalStore } from './useJournalStore';
import { useAppStore } from './useAppStore';

/**
 * Build lightweight metadata for the session list display.
 */
function buildMetadata(sessionState) {
  return {
    startedAt: sessionState.substanceChecklist?.ingestionTime || null,
    closedAt: sessionState.session?.closedAt || null,
    finalDurationSeconds: sessionState.session?.finalDurationSeconds || null,
    sessionPhase: sessionState.sessionPhase || 'not-started',
    dosageMg: sessionState.substanceChecklist?.plannedDosageMg || null,
    intakeComplete: sessionState.intake?.isComplete || false,
  };
}

/**
 * Reset transient UI flags before restoring archived state into the live store.
 * Mirrors the partialize logic in useSessionStore's persist config.
 */
function cleanTransientState(sessionState) {
  return {
    ...sessionState,
    // These are excluded from persistence entirely — provide defaults
    meditationPlayback: {
      moduleInstanceId: null,
      isPlaying: false,
      hasStarted: false,
      startedAt: null,
      accumulatedTime: 0,
    },
    activeFollowUpModule: null,
    activePreSessionModule: null,
    // Reset transient UI flags within nested objects
    comeUpCheckIn: {
      ...sessionState.comeUpCheckIn,
      currentResponse: null,
      waitingForCheckIn: false,
    },
    peakCheckIn: { isVisible: false },
    closingCheckIn: { isVisible: false },
    booster: {
      ...sessionState.booster,
      isModalVisible: sessionState.booster?.status === 'prompted' || sessionState.booster?.status === 'snoozed',
      isMinimized: sessionState.booster?.status === 'snoozed',
    },
    phaseTransitions: {
      ...sessionState.phaseTransitions,
      activeTransition: null,
      transitionCompleted: false,
    },
    modules: {
      ...sessionState.modules,
      inOpenSpace: false,
    },
  };
}

export const useSessionHistoryStore = create(
  persist(
    (set, get) => ({
      // Array of archived sessions, newest first
      sessions: [],

      /**
       * Archive the current session and reset to a fresh state.
       * Only archives if there's meaningful data (not a blank not-started session).
       */
      archiveAndReset: () => {
        const sessionStore = useSessionStore.getState();
        const journalStore = useJournalStore.getState();

        const hasData = sessionStore.sessionPhase !== 'not-started' || journalStore.entries.length > 0;

        if (hasData) {
          const snapshot = sessionStore.snapshotForArchive();
          const sessionId = snapshot.sessionId || `legacy-${Date.now()}`;
          const archive = {
            sessionId,
            archivedAt: Date.now(),
            version: SESSION_STORE_VERSION,
            metadata: buildMetadata(snapshot),
            sessionState: snapshot,
            journalEntries: [...journalStore.entries],
          };

          // Upsert: replace existing archive with same sessionId, or append
          set((state) => {
            const existingIdx = state.sessions.findIndex((s) => s.sessionId === sessionId);
            if (existingIdx >= 0) {
              const updated = [...state.sessions];
              updated[existingIdx] = archive;
              return { sessions: updated };
            }
            return { sessions: [archive, ...state.sessions] };
          });
        }

        // Clear journal and reset session
        journalStore.clearAllEntries();
        sessionStore.resetSession();
        useAppStore.getState().setCurrentTab('home');
      },

      /**
       * Load an archived session into the live stores.
       * Archives the current session first if it has data.
       */
      loadSession: (sessionId) => {
        const state = get();
        const target = state.sessions.find((s) => s.sessionId === sessionId);
        if (!target) return;

        const sessionStore = useSessionStore.getState();
        const journalStore = useJournalStore.getState();

        // Archive current session if it has data
        const currentHasData = sessionStore.sessionPhase !== 'not-started' || journalStore.entries.length > 0;
        if (currentHasData) {
          const snapshot = sessionStore.snapshotForArchive();
          const currentSessionId = snapshot.sessionId || `legacy-${Date.now()}`;
          const currentArchive = {
            sessionId: currentSessionId,
            archivedAt: Date.now(),
            version: SESSION_STORE_VERSION,
            metadata: buildMetadata(snapshot),
            sessionState: snapshot,
            journalEntries: [...journalStore.entries],
          };

          // Upsert current session into archive, remove target from archive
          set((s) => {
            let sessions = [...s.sessions];
            // Upsert current
            const existingIdx = sessions.findIndex((a) => a.sessionId === currentSessionId);
            if (existingIdx >= 0) {
              sessions[existingIdx] = currentArchive;
            } else {
              sessions = [currentArchive, ...sessions];
            }
            // Remove target
            sessions = sessions.filter((a) => a.sessionId !== sessionId);
            return { sessions };
          });
        } else {
          // Nothing to archive — just remove target from archive
          set((s) => ({
            sessions: s.sessions.filter((a) => a.sessionId !== sessionId),
          }));
        }

        // Migrate archived state if needed
        let restoredState = target.sessionState;
        if (target.version < SESSION_STORE_VERSION) {
          restoredState = migrateSessionState(restoredState, target.version);
          // migrateSessionState returns undefined for very old versions — fall back to fresh state
          if (!restoredState) {
            sessionStore.resetSession();
            journalStore.clearAllEntries();
            useAppStore.getState().setCurrentTab('home');
            return;
          }
        }

        // Clean transient UI state and restore
        const cleaned = cleanTransientState(restoredState);

        // Bulk-set session store state (only data keys, not actions)
        const stateUpdate = {};
        for (const [key, value] of Object.entries(cleaned)) {
          if (typeof value !== 'function') {
            stateUpdate[key] = value;
          }
        }
        useSessionStore.setState(stateUpdate);

        // Restore journal entries
        journalStore.replaceAllEntries(target.journalEntries || []);

        // Navigate to home
        useAppStore.getState().setCurrentTab('home');
      },

      /**
       * Delete an archived session permanently.
       */
      deleteSession: (sessionId) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.sessionId !== sessionId),
        }));
      },

      /**
       * Get an archived session by ID.
       */
      getArchivedSession: (sessionId) => {
        return get().sessions.find((s) => s.sessionId === sessionId) || null;
      },
    }),
    {
      name: 'mdma-guide-session-history',
      version: 1,
    }
  )
);

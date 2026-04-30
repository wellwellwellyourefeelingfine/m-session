/**
 * IntentionSettingMaster — Thin wrapper around MasterModule for the
 * pre-session intention-setting flow.
 *
 * MasterModule's standard journal save (`journalAssembler` invoked from
 * `useMasterModuleState.finalizeModule`) creates a NEW journal entry every
 * time. The intention-setting flow needs upsert-by-id semantics: if the
 * intake questionnaire already created a journal entry for the user's
 * initial intention (and stored its id at `sessionProfile.intentionJournalEntryId`),
 * we update that entry rather than create a parallel one. This wrapper
 * owns that bridging.
 *
 * The content config sets `journal: { saveOnComplete: false }` so the
 * standard assembler does NOT run — the wrapper is the single writer.
 *
 * Also calls `completePreSubstanceActivity('intention-setting-v2')` so
 * the pre-session orchestrator marks the activity done. Mirrors the
 * pattern used by the OLD `IntentionSettingActivity.handleModuleComplete`.
 */

import { useCallback, lazy, Suspense } from 'react';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useJournalStore } from '../../../stores/useJournalStore';

const MasterModule = lazy(() => import('./MasterModule/MasterModule'));

export default function IntentionSettingMaster({
  module,
  onComplete,
  onSkip,
  onProgressUpdate,
}) {
  const sessionProfile = useSessionStore((s) => s.sessionProfile);
  const updateSessionProfile = useSessionStore((s) => s.updateSessionProfile);
  const completePreSubstanceActivity = useSessionStore((s) => s.completePreSubstanceActivity);
  const sessionId = useSessionStore((s) => s.sessionId);
  const addEntry = useJournalStore((s) => s.addEntry);
  const updateEntry = useJournalStore((s) => s.updateEntry);

  const persistJournal = useCallback(() => {
    const intentionText = (sessionProfile?.holdingQuestion || '').trim();
    if (!intentionText) return;
    const existingEntryId = sessionProfile?.intentionJournalEntryId;
    const content = `INTENTION:\n\n${intentionText}`;
    if (existingEntryId) {
      updateEntry(existingEntryId, content);
    } else {
      const entry = addEntry({
        content,
        source: 'session',
        sessionId,
        moduleTitle: 'Pre-Session Intention Setting',
        isEdited: false,
      });
      if (entry?.id) {
        updateSessionProfile('intentionJournalEntryId', entry.id);
      }
    }
  }, [sessionProfile, addEntry, updateEntry, updateSessionProfile, sessionId]);

  const handleComplete = useCallback(() => {
    persistJournal();
    completePreSubstanceActivity('intention-setting-v2');
    onComplete?.();
  }, [persistJournal, completePreSubstanceActivity, onComplete]);

  const handleSkip = useCallback(() => {
    persistJournal();
    onSkip?.();
  }, [persistJournal, onSkip]);

  return (
    <Suspense fallback={null}>
      <MasterModule
        module={module}
        onComplete={handleComplete}
        onSkip={handleSkip}
        onProgressUpdate={onProgressUpdate}
      />
    </Suspense>
  );
}

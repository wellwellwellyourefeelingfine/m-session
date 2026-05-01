/**
 * IntentionSettingMaster — Thin wrapper around MasterModule for the
 * pre-session intention-setting flow.
 *
 * Two responsibilities only:
 *   1. Signal the pre-session orchestrator on completion via
 *      `completePreSubstanceActivity('intention-setting-v2')`.
 *   2. Lazy-load MasterModule (Suspense boundary).
 *
 * Journal persistence is owned by MasterModule's `finalizeModule` via the
 * content config's `journal.upsertEntryIdField` — the assembler writes a
 * rich entry (intention + territory/feeling selectors + narrowing/reflection
 * prompts) and upserts into `sessionProfile.intentionJournalEntryId` so the
 * intake-created entry is updated in place rather than duplicated.
 */

import { useCallback, lazy, Suspense } from 'react';
import { useSessionStore } from '../../../stores/useSessionStore';

const MasterModule = lazy(() => import('./MasterModule/MasterModule'));

export default function IntentionSettingMaster({
  module,
  onComplete,
  onSkip,
  onProgressUpdate,
}) {
  const completePreSubstanceActivity = useSessionStore((s) => s.completePreSubstanceActivity);

  const handleComplete = useCallback(() => {
    completePreSubstanceActivity('intention-setting-v2');
    onComplete?.();
  }, [completePreSubstanceActivity, onComplete]);

  return (
    <Suspense fallback={null}>
      <MasterModule
        module={module}
        onComplete={handleComplete}
        onSkip={onSkip}
        onProgressUpdate={onProgressUpdate}
      />
    </Suspense>
  );
}

/**
 * PhaseRecapBlock — Summary statistics for a completed phase (or the full session).
 *
 * Reads from the session store + journal store. Purely presentational.
 *
 * Config:
 *   {
 *     type: 'phase-recap',
 *     scope: 'come-up' | 'peak' | 'integration' | 'full-session',
 *     showHelperCount: true,    // optional
 *   }
 */

import { useSessionStore } from '../../../../stores/useSessionStore';
import { useJournalStore } from '../../../../stores/useJournalStore';

const PHASE_LABELS = {
  'come-up': 'Come-Up',
  'peak': 'Peak',
  'integration': 'Synthesis',     // UI name for integration phase
  'closing': 'Closing',
};

export default function PhaseRecapBlock({ block }) {
  const modules = useSessionStore((s) => s.modules?.history || []);
  const timeline = useSessionStore((s) => s.timeline);
  const entries = useJournalStore((s) => s.entries || []);

  const scope = block.scope || 'come-up';
  const showHelperCount = block.showHelperCount === true;

  if (scope === 'full-session') {
    return (
      <div className="space-y-6">
        {['come-up', 'peak', 'integration'].map((phase) => (
          <PhaseSummary
            key={phase}
            phaseKey={phase}
            modules={modules}
            timeline={timeline}
            entries={entries}
            showHelperCount={showHelperCount}
          />
        ))}
      </div>
    );
  }

  return (
    <PhaseSummary
      phaseKey={scope}
      modules={modules}
      timeline={timeline}
      entries={entries}
      showHelperCount={showHelperCount}
    />
  );
}

function PhaseSummary({ phaseKey, modules, timeline, entries, showHelperCount }) {
  // Map external phase name to timeline phase key (comeUp, peak, integration)
  const timelineKey =
    phaseKey === 'come-up' ? 'comeUp'
    : phaseKey === 'peak' ? 'peak'
    : phaseKey === 'integration' ? 'integration'
    : null;

  const phaseInfo = timelineKey ? timeline?.phases?.[timelineKey] : null;
  const duration = formatDuration(phaseInfo?.startedAt, phaseInfo?.endedAt);

  // Filter modules completed in this phase
  const phaseModules = modules.filter((m) =>
    m.phase === (timelineKey === 'comeUp' ? 'come-up' : timelineKey) && m.status === 'completed'
  );

  // Journal entries created during this phase
  const phaseEntries = entries.filter((e) => {
    if (!phaseInfo?.startedAt) return false;
    const ts = e.createdAt || e.timestamp;
    if (!ts) return false;
    if (ts < phaseInfo.startedAt) return false;
    if (phaseInfo.endedAt && ts > phaseInfo.endedAt) return false;
    return true;
  });

  const helperEntryCount = showHelperCount
    ? phaseEntries.filter((e) => (e.moduleTitle || '').toLowerCase().includes('helper')).length
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3
          className="text-lg text-[var(--color-text-primary)]"
          style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
        >
          {PHASE_LABELS[phaseKey] || phaseKey}
        </h3>
        {duration && (
          <span className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
            {duration}
          </span>
        )}
      </div>

      {phaseModules.length > 0 ? (
        <ul className="space-y-1">
          {phaseModules.map((m, i) => (
            <li key={i} className="flex items-baseline justify-between text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
              <span>{m.title || m.libraryId}</span>
              {m.startedAt && m.completedAt && (
                <span className="text-[var(--color-text-tertiary)]">
                  {formatDuration(m.startedAt, m.completedAt)}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] italic">
          No activities
        </p>
      )}

      <div className="flex gap-4 text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
        <span>{phaseEntries.length} {phaseEntries.length === 1 ? 'entry' : 'entries'}</span>
        {showHelperCount && helperEntryCount > 0 && (
          <span>{helperEntryCount} helper check-in{helperEntryCount === 1 ? '' : 's'}</span>
        )}
      </div>
    </div>
  );
}

function formatDuration(startMs, endMs) {
  if (!startMs) return null;
  const end = endMs || Date.now();
  const totalMinutes = Math.round((end - startMs) / 60000);
  if (totalMinutes < 1) return '< 1 min';
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

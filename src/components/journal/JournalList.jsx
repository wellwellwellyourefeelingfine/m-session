/**
 * JournalList Component
 * Displays journal entries grouped by source (session vs manual)
 * Uses corner brackets similar to session timeline
 * Empty state shows prompt to create first entry
 */

import { useJournalStore } from '../../stores/useJournalStore';
import JournalEntryRow from './JournalEntryRow';

export default function JournalList({ onSelectEntry, onNewEntry, onSettings, onDeleteEntry }) {
  const entries = useJournalStore((state) => state.entries);
  const getSessionEntries = useJournalStore((state) => state.getSessionEntries);
  const getManualEntries = useJournalStore((state) => state.getManualEntries);

  const sessionEntries = getSessionEntries();
  const manualEntries = getManualEntries();
  const hasEntries = entries.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header - just settings button, right aligned */}
      <div className="flex items-center justify-end px-2 pt-5 pb-2">
        <button
          onClick={onSettings}
          className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors touch-target"
          aria-label="Settings"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-2">
        {!hasEntries ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-[var(--color-text-tertiary)] mb-6" style={{ textTransform: 'none' }}>
              No journal entries yet
            </p>
            <button
              onClick={onNewEntry}
              className="px-6 py-3 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors uppercase tracking-wider text-sm"
            >
              Create First Entry
            </button>
          </div>
        ) : (
          <div className="space-y-6 pb-20">
            {/* Session Entries Section */}
            {sessionEntries.length > 0 && (
              <EntrySection
                title="Session Entries"
                entries={sessionEntries}
                onSelectEntry={onSelectEntry}
                onDeleteEntry={onDeleteEntry}
              />
            )}

            {/* Manual Entries Section */}
            {manualEntries.length > 0 && (
              <EntrySection
                title="Manual Entries"
                entries={manualEntries}
                onSelectEntry={onSelectEntry}
                onDeleteEntry={onDeleteEntry}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Section component with corner brackets
function EntrySection({ title, entries, onSelectEntry, onDeleteEntry }) {
  if (!entries || entries.length === 0) return null;

  return (
    <div className="relative pl-5">
      {/* Corner brackets */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between">
        {/* Top corner */}
        <div className="w-2.5 h-2.5 border-t border-l border-[var(--color-border)] rounded-tl-sm" />
        {/* Bottom corner */}
        <div className="w-2.5 h-2.5 border-b border-l border-[var(--color-border)] rounded-bl-sm" />
      </div>

      {/* Section content */}
      <div>
        {/* Section title */}
        <h2 className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-widest mb-2">
          {title}
        </h2>

        {/* Entry list */}
        <div className="space-y-0.5">
          {entries.map((entry) => (
            <JournalEntryRow
              key={entry.id}
              entry={entry}
              onSelect={() => onSelectEntry(entry.id)}
              onDelete={() => onDeleteEntry(entry.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * JournalList Component
 * Displays journal entries grouped by source (session vs manual)
 * Uses corner brackets similar to session timeline
 * Empty state shows prompt to create first entry
 * Delete mode: minus button toggles delete mode, entries can be selected for deletion
 */

import { useState } from 'react';
import { useJournalStore } from '../../stores/useJournalStore';
import JournalEntryRow from './JournalEntryRow';
import ConfirmModal from './ConfirmModal';

export default function JournalList({ onSelectEntry, onNewEntry, onSettings, isSettingsOpen = false }) {
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const entries = useJournalStore((state) => state.entries);
  const getSessionEntries = useJournalStore((state) => state.getSessionEntries);
  const getManualEntries = useJournalStore((state) => state.getManualEntries);
  const deleteEntry = useJournalStore((state) => state.deleteEntry);

  const sessionEntries = getSessionEntries();
  const manualEntries = getManualEntries();
  const hasEntries = entries.length > 0;

  const handleDeleteModeToggle = () => {
    setIsDeleteMode(!isDeleteMode);
    setPendingDeleteId(null);
  };

  const handleEntryClick = (entryId) => {
    if (isDeleteMode) {
      setPendingDeleteId(entryId);
    } else {
      onSelectEntry(entryId);
    }
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId) {
      deleteEntry(pendingDeleteId);
      setPendingDeleteId(null);
      // If no more entries, exit delete mode
      if (entries.length <= 1) {
        setIsDeleteMode(false);
      }
    }
  };

  const handleCancelDelete = () => {
    setPendingDeleteId(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - delete mode button and settings button, right aligned */}
      <div className="flex items-center justify-end gap-2 px-2 pt-5 pb-2">
        {/* Delete mode toggle button - only show if there are entries */}
        {hasEntries && (
          <button
            onClick={handleDeleteModeToggle}
            className="touch-target transition-colors"
            aria-label={isDeleteMode ? 'Exit delete mode' : 'Enter delete mode'}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={isDeleteMode ? 'var(--accent)' : 'none'}
              fillOpacity={isDeleteMode ? 0.6 : 1}
              stroke={isDeleteMode ? 'var(--accent)' : 'var(--color-text-tertiary)'}
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="9" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={onSettings}
          className="transition-colors touch-target"
          aria-label="Settings"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={isSettingsOpen ? 'var(--accent)' : 'none'}
            fillOpacity={isSettingsOpen ? 0.6 : 1}
            stroke={isSettingsOpen ? 'var(--accent)' : 'var(--color-text-tertiary)'}
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
                onEntryClick={handleEntryClick}
                isDeleteMode={isDeleteMode}
                pendingDeleteId={pendingDeleteId}
              />
            )}

            {/* Manual Entries Section */}
            {manualEntries.length > 0 && (
              <EntrySection
                title="Manual Entries"
                entries={manualEntries}
                onEntryClick={handleEntryClick}
                isDeleteMode={isDeleteMode}
                pendingDeleteId={pendingDeleteId}
              />
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {pendingDeleteId && (
        <ConfirmModal
          title="Delete Entry"
          message="Are you sure you want to delete this note?"
          confirmLabel="Yes"
          cancelLabel="No"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isDestructive
        />
      )}
    </div>
  );
}

// Section component with corner brackets
function EntrySection({ title, entries, onEntryClick, isDeleteMode, pendingDeleteId }) {
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
              onSelect={() => onEntryClick(entry.id)}
              isDeleteMode={isDeleteMode}
              isSelected={pendingDeleteId === entry.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

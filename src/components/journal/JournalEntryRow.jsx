/**
 * JournalEntryRow Component
 * Individual entry row in the journal list
 * Compact design: Title on first line, date + preview on second line
 * Delete X button in top right corner
 */

export default function JournalEntryRow({ entry, onSelect, onDelete }) {
  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Today
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }

    // Yesterday
    if (diffDays === 1) {
      return 'Yesterday';
    }

    // Within last week
    if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }

    // Older
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent triggering onSelect
    onDelete();
  };

  return (
    <div className="relative group">
      <button
        onClick={onSelect}
        className="w-full text-left py-2 px-2 pr-8 -mx-2 rounded hover:bg-[var(--color-bg-secondary)] transition-colors"
      >
        {/* Title row */}
        <div className="flex items-center justify-between gap-2">
          <h3
            className="text-[var(--color-text-primary)] truncate flex-1"
            style={{ textTransform: 'none' }}
          >
            {entry.title || 'Untitled'}
          </h3>
          <span className="text-[var(--color-text-tertiary)] text-xs shrink-0">
            {formatDate(entry.updatedAt)}
          </span>
        </div>

        {/* Preview row */}
        <p
          className="text-[var(--color-text-tertiary)] text-xs truncate mt-0.5"
          style={{ textTransform: 'none' }}
        >
          {entry.preview || (entry.source === 'session' ? `From: ${entry.moduleTitle || 'Session'}` : 'No additional text')}
        </p>
      </button>

      {/* Delete button - visible on hover */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-0 p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Delete entry"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

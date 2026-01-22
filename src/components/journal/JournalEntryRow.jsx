/**
 * JournalEntryRow Component
 * Individual entry row in the journal list
 * Compact design: Title on first line, date + preview on second line
 * In delete mode: clicking selects for deletion with accent highlight
 */

export default function JournalEntryRow({ entry, onSelect, isDeleteMode = false, isSelected = false }) {
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

  // Determine button styling based on mode
  const getButtonClass = () => {
    const baseClass = 'w-full text-left py-2 px-2 -mx-2 rounded transition-colors';

    if (isSelected) {
      // Selected for deletion - accent highlight
      return `${baseClass} border border-[var(--accent)] bg-[var(--accent-bg)]`;
    }

    if (isDeleteMode) {
      // Delete mode but not selected - subtle indication
      return `${baseClass} hover:bg-[var(--accent-bg)] hover:border hover:border-[var(--accent)]`;
    }

    // Normal mode
    return `${baseClass} hover:bg-[var(--color-bg-secondary)]`;
  };

  return (
    <button
      onClick={onSelect}
      className={getButtonClass()}
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
  );
}

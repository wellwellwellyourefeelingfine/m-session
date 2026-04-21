/**
 * SelectorBlock — Grid selection with optional follow-up textarea
 *
 * Renders a prompt + grid of toggle buttons (2 or 3 columns).
 * Supports single-select and multi-select modes.
 * Optional follow-up journal textarea below the grid.
 */

import { useJournalStore } from '../../../../../stores/useJournalStore';

export default function SelectorBlock({
  screen,
  selectedValue,
  onToggle,
  journalValue,
  onJournalChange,
}) {
  const settings = useJournalStore((state) => state.settings);
  const columns = screen.columns || 2;
  const isMulti = screen.multiSelect || false;

  const isOptionSelected = (optionId) => {
    if (isMulti) return (selectedValue || []).includes(optionId);
    return selectedValue === optionId;
  };

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  const getFontFamilyClass = () => {
    switch (settings.fontFamily) {
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      default: return 'font-sans';
    }
  };

  const getLineHeightClass = () => {
    switch (settings.lineHeight) {
      case 'compact': return 'leading-snug';
      case 'relaxed': return 'leading-loose';
      default: return 'leading-normal';
    }
  };

  return (
    <div className="space-y-4">
      {screen.context && (
        <p className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider leading-relaxed">
          {screen.context}
        </p>
      )}

      <p
        className="text-base text-[var(--color-text-primary)]"
        style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
      >
        {screen.prompt}
      </p>

      <div className={`grid gap-2 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {screen.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onToggle(screen.key, option.id, isMulti)}
            className={`py-3 px-3 border transition-colors duration-150 text-left ${
              isOptionSelected(option.id)
                ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
                : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-text-tertiary)]'
            }`}
          >
            <span className="text-xs uppercase tracking-wider">{option.label}</span>
          </button>
        ))}
      </div>

      {screen.journal && (
        <div>
          <p
            className="text-base text-[var(--color-text-primary)] mb-2"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            {screen.journal.prompt}
          </p>
          <textarea
            value={journalValue || ''}
            onChange={(e) => onJournalChange(screen.key, e.target.value)}
            placeholder={screen.journal.placeholder}
            rows={screen.journal.rows || 3}
            className={`w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
              focus:outline-none focus:border-[var(--accent)]
              text-[var(--color-text-primary)] leading-relaxed
              placeholder:text-[var(--color-text-tertiary)] resize-none
              ${getFontSizeClass()} ${getFontFamilyClass()} ${getLineHeightClass()}`}
            style={{ textTransform: 'none' }}
          />
        </div>
      )}
    </div>
  );
}

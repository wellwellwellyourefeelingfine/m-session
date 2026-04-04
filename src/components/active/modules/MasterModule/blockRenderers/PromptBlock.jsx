/**
 * PromptBlock — Journaling prompt with textarea
 *
 * Renders a DM Serif prompt question + optional context + textarea.
 * Respects journal font settings (fontSize, fontFamily, lineHeight).
 */

import { useJournalStore } from '../../../../../stores/useJournalStore';

export default function PromptBlock({
  screen,
  value,
  onChange,
  promptNumber,
  totalPrompts,
}) {
  const settings = useJournalStore((state) => state.settings);

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
    <div>
      {screen.context && (
        <p className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider leading-relaxed mb-3">
          {screen.context}
        </p>
      )}

      <p
        className="text-lg mb-3 text-[var(--color-text-primary)]"
        style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
      >
        {screen.prompt}
      </p>

      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={screen.placeholder || 'Write freely...'}
        rows={6}
        className={`w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
          focus:outline-none focus:border-[var(--accent)]
          text-[var(--color-text-primary)] leading-relaxed
          placeholder:text-[var(--color-text-tertiary)] resize-none
          ${getFontSizeClass()} ${getFontFamilyClass()} ${getLineHeightClass()}`}
        style={{ textTransform: 'none' }}
      />

      {totalPrompts > 1 && promptNumber != null && (
        <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider mt-2 text-center">
          {promptNumber} of {totalPrompts}
        </p>
      )}
    </div>
  );
}

/**
 * PromptBlock — Journaling prompt with textarea
 *
 * Renders a DM Serif prompt question + optional context + textarea.
 * Respects journal font settings (fontSize, fontFamily, lineHeight).
 */

import { useJournalStore } from '../../../../../stores/useJournalStore';
import { renderLineWithMarkup, substituteTokensPlain } from '../utils/renderContentLines';

export default function PromptBlock({
  screen,
  value,
  onChange,
  promptNumber,
  totalPrompts,
  accentTerms,
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

  // Placeholder is a plain string attribute — substitute tokens but no JSX.
  const resolvedPlaceholder = substituteTokensPlain(
    screen.placeholder || 'Write freely...',
    accentTerms
  );

  return (
    <div>
      {screen.context && (
        <p className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider leading-relaxed mb-3">
          {renderLineWithMarkup(screen.context, accentTerms)}
        </p>
      )}

      {screen.prompt && (
        <p
          className="text-base mb-3 text-[var(--color-text-primary)]"
          style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
        >
          {renderLineWithMarkup(screen.prompt, accentTerms)}
        </p>
      )}

      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={resolvedPlaceholder}
        rows={screen.rows || 6}
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

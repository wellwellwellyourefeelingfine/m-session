/**
 * ReviewBlock — Assembled prompt review/edit screen
 *
 * Displays previously-collected prompt responses for review.
 * Only shows prompts the user actually saw — prompts hidden by conditions are excluded.
 * Shows all visible prompts regardless of whether the user entered text (respects
 * users who journal physically).
 *
 * Props:
 *   screen.assembleFrom: number[] - global prompt indices to include
 *   screen.editable: boolean - allow inline editing
 *   screen.header: string - optional header
 *   screen.context: string - optional context text
 */

import { useJournalStore } from '../../../../../stores/useJournalStore';
import evaluateCondition from '../utils/evaluateCondition';

export default function ReviewBlock({
  screen,
  responses,
  onSetPromptResponse,
  allBlocksWithPromptIndex,
  conditionContext,
}) {
  const settings = useJournalStore((state) => state.settings);
  const assembleFrom = screen.assembleFrom || [];
  const editable = screen.editable || false;

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

  // Find prompts matching the requested indices, filtering out those hidden by conditions
  const reviewItems = assembleFrom
    .map((promptIndex) => {
      const block = allBlocksWithPromptIndex.find(
        (b) => b.type === 'prompt' && b.promptIndex === promptIndex
      );
      if (!block) return null;

      // Skip prompts from sections the user never reached (due to routing)
      if (block.sectionId && conditionContext?.visitedSections) {
        if (!conditionContext.visitedSections.includes(block.sectionId)) return null;
      }

      // Skip prompts the user never saw due to conditions
      if (block.condition && conditionContext) {
        if (!evaluateCondition(block.condition, conditionContext)) return null;
      }

      return {
        promptIndex,
        prompt: block.prompt || `Prompt ${promptIndex + 1}`,
        response: responses[promptIndex] || '',
      };
    })
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {screen.context && (
        <p className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider leading-relaxed">
          {screen.context}
        </p>
      )}

      {reviewItems.map((item) => (
        <div key={item.promptIndex}>
          <p
            className="text-base mb-2 text-[var(--color-text-primary)]"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            {item.prompt}
          </p>

          {editable ? (
            <textarea
              value={item.response}
              onChange={(e) => onSetPromptResponse(item.promptIndex, e.target.value)}
              rows={4}
              className={`w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                focus:outline-none focus:border-[var(--accent)]
                text-[var(--color-text-primary)] leading-relaxed
                placeholder:text-[var(--color-text-tertiary)] resize-none
                ${getFontSizeClass()} ${getFontFamilyClass()} ${getLineHeightClass()}`}
              style={{ textTransform: 'none' }}
            />
          ) : (
            <p
              className={`text-[var(--color-text-secondary)] leading-relaxed
                ${getFontSizeClass()} ${getFontFamilyClass()} ${getLineHeightClass()}`}
              style={{ textTransform: 'none' }}
            >
              {item.response || ''}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

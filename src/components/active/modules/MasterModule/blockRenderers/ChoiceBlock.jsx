/**
 * ChoiceBlock — Selection checkpoint
 *
 * Renders a prompt + list of options. User selects one, then clicks Continue.
 * If the option has a `route`, ScreensSection handles the cross-section routing.
 * If no route, the selection is just saved for conditional rendering.
 *
 * If an option's route target is in `visitedSections`, a small check icon is
 * appended after the label to indicate the user has already done that activity.
 * The button remains selectable so the user can revisit.
 *
 * Prompt + context support `{accentTerm}` token substitution and accent
 * colouring via the shared renderLineWithMarkup utility — same idiom as
 * PromptBlock and TextBlock.
 */

import { CircleCheckIcon } from '../../../../shared/Icons';
import { renderLineWithMarkup } from '../utils/renderContentLines';

function getRouteTarget(route) {
  if (!route) return null;
  if (typeof route === 'string') return route === '_next' ? null : route;
  if (typeof route === 'object' && route.to) return route.to;
  return null;
}

export default function ChoiceBlock({ screen, selectedValue, onChoiceSelect, visitedSections = [], accentTerms = {} }) {
  return (
    <div className="space-y-4">
      {screen.context && (
        <p className="text-[var(--color-text-primary)] text-sm uppercase tracking-wider leading-relaxed">
          {renderLineWithMarkup(screen.context, accentTerms)}
        </p>
      )}

      {screen.prompt && (
        <p
          className="text-base text-[var(--color-text-primary)]"
          style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
        >
          {renderLineWithMarkup(screen.prompt, accentTerms)}
        </p>
      )}

      <div className="space-y-2">
        {screen.options.map((option) => {
          const target = getRouteTarget(option.route);
          const isCompleted = target != null && visitedSections.includes(target);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChoiceSelect(screen.key, option.id)}
              className={`w-full py-3 px-4 border transition-colors duration-150 text-left ${
                selectedValue === option.id
                  ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
                  : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-text-tertiary)]'
              }`}
            >
              <span className="text-xs uppercase tracking-wider">
                {option.label}
                {isCompleted && (
                  <>
                    {' '}
                    <CircleCheckIcon
                      size={14}
                      strokeWidth={2.5}
                      className="inline-block align-[-2px] ml-1 text-[var(--accent)]"
                      aria-hidden="true"
                    />
                    <span className="sr-only">(completed)</span>
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

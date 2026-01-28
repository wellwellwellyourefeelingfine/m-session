/**
 * FocusSelector Component
 * Single-select list for choosing/changing focus during integration transition
 */

import { FOCUS_OPTIONS, RELATIONSHIP_TYPES } from '../content/integrationTransitionContent';

export default function FocusSelector({
  selectedFocus,
  selectedRelationshipType,
  onFocusChange,
  onRelationshipTypeChange,
  showRelationshipTypes = false,
}) {
  // If showing relationship types, render those instead
  if (showRelationshipTypes) {
    return (
      <div className="space-y-2">
        {RELATIONSHIP_TYPES.map((option) => {
          const isSelected = selectedRelationshipType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onRelationshipTypeChange(option.value)}
              className={`w-full py-4 px-4 border text-left transition-colors ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
                  : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              <span className="uppercase tracking-wider text-xs">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Default: focus options
  return (
    <div className="space-y-2">
      {FOCUS_OPTIONS.map((option) => {
        const isSelected = selectedFocus === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onFocusChange(option.value)}
            className={`w-full py-4 px-4 border text-left transition-colors ${
              isSelected
                ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
                : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]'
            }`}
          >
            <span className="uppercase tracking-wider text-xs">
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

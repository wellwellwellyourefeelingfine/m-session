/**
 * ProtectorSelectionGrid Component
 * Single-select 2x4 grid for protector type selection during Protector Dialogue Part 1.
 * Follows BodySensationGrid styling pattern but uses single-select.
 * "Something else" option opens a text input for custom protector name.
 */

import { PROTECTOR_TYPES } from '../../../../content/modules/protectorDialogueContent';

// Main grid options (exclude "other" which gets special treatment)
const GRID_OPTIONS = PROTECTOR_TYPES.filter((t) => t.id !== 'other');
const OTHER_OPTION = PROTECTOR_TYPES.find((t) => t.id === 'other');

export default function ProtectorSelectionGrid({
  selected = null,
  customLabel = '',
  onChange,
  onCustomLabelChange,
}) {
  const handleSelect = (id) => {
    onChange(id === selected ? null : id);
  };

  return (
    <div className="space-y-3">
      {/* 2-column grid for main protector types */}
      <div className="grid grid-cols-2 gap-2">
        {GRID_OPTIONS.map((type) => {
          const isSelected = selected === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => handleSelect(type.id)}
              className={`py-3 px-3 border transition-colors duration-150 text-left ${
                isSelected
                  ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
                  : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
              }`}
            >
              <span className="uppercase tracking-wider text-xs block">
                {type.label}
              </span>
              {type.description && (
                <span className="text-[10px] block mt-1 opacity-60 normal-case tracking-normal">
                  {type.description}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* "Something else" — full width */}
      <button
        type="button"
        onClick={() => handleSelect('other')}
        className={`w-full py-3 px-4 border transition-colors duration-150 text-center ${
          selected === 'other'
            ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
            : 'border-[var(--color-border)] bg-transparent text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)]'
        }`}
      >
        <span className="uppercase tracking-wider text-xs">
          {OTHER_OPTION.label}
        </span>
      </button>

      {/* Custom label input — shown when "other" is selected */}
      {selected === 'other' && (
        <div className="animate-fadeIn">
          <input
            type="text"
            value={customLabel}
            onChange={(e) => onCustomLabelChange(e.target.value)}
            placeholder="Describe it in a few words..."
            maxLength={60}
            className="w-full py-3 px-4 border border-[var(--color-border)] bg-transparent
                       focus:outline-none focus:border-[var(--accent)]
                       text-[var(--color-text-primary)] text-center
                       placeholder:text-[var(--color-text-tertiary)]
                       text-sm"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}

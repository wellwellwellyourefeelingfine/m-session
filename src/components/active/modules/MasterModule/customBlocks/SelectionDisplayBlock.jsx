/**
 * SelectionDisplayBlock — Read-only display of a previously-made selector
 * pick. Reads from MasterModule's `selectorValues` map (via context) and
 * resolves the selected option's display label from the original options
 * array passed in the block config.
 *
 * Rendered as a small uppercase mono-caps label above an accent-bordered
 * box that mirrors the visual style of a selected button in SelectorBlock.
 *
 * If the user hasn't made a selection for this key (or the stored value
 * can't be resolved against `options`), the box still renders with a
 * "No entry" placeholder so the layout stays consistent.
 *
 * Config:
 *   {
 *     type: 'selection-display',
 *     label: 'What resonates:',
 *     selectorKey: 'territory',
 *     options: TERRITORY_OPTIONS,   // for label resolution; must match the
 *                                   // shape used by the originating selector
 *                                   // ({ value, label } here, then mapped to
 *                                   // { id, label } at the selector site).
 *                                   // Pass either shape — the lookup tries both.
 *   }
 */

export default function SelectionDisplayBlock({ block, context }) {
  const { label, selectorKey, options } = block;
  const selectedValue = context?.selectorValues?.[selectorKey];

  // Selectors in this module are mapped to `{ id, label }` from `{ value, label }`
  // at the section level. Resolve against either shape so the block accepts
  // the original constants directly without callers having to remap.
  const selectedOption =
    selectedValue != null
      ? options?.find((o) => o.id === selectedValue || o.value === selectedValue)
      : null;
  const displayLabel = selectedOption?.label ?? 'No entry';

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">
          {label}
        </p>
      )}
      <div className="py-3 px-4 border border-[var(--accent)] bg-[var(--accent-bg)]">
        <p className="text-[var(--color-text-primary)] text-xs uppercase tracking-wider">
          {displayLabel}
        </p>
      </div>
    </div>
  );
}

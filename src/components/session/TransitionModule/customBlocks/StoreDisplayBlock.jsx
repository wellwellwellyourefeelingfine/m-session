/**
 * StoreDisplayBlock — Read-only display of a store value.
 *
 * Reads any dot-path from the session store and renders in a styled container.
 * Used for showing the user's intention, focus label, touchstone, etc.
 *
 * Config:
 *   {
 *     type: 'store-display',
 *     storeKey: 'sessionProfile.holdingQuestion',
 *     emptyText: 'No intention was set',
 *     style: 'accent-box',                    // 'accent-box' | 'plain' | 'italic'
 *     labelMap: { ... },                      // optional: map raw values to display labels
 *     leftLabel: 'Opening Ritual Touchstone', // optional: small uppercase
 *                                              //   label rendered above the
 *                                              //   accent box, left-aligned.
 *                                              //   Only applies to the
 *                                              //   'accent-box' style.
 *   }
 */

import { useSessionStore } from '../../../../stores/useSessionStore';

export default function StoreDisplayBlock({ block }) {
  const value = useSessionStore((state) => resolvePath(block.storeKey, state));

  const displayValue = block.labelMap && value != null
    ? (block.labelMap[value] || String(value))
    : (value != null && value !== '' ? String(value) : null);

  const hasValue = displayValue != null && displayValue !== '';
  const emptyText = block.emptyText || '';

  if (!hasValue && !emptyText) return null;

  const textToShow = hasValue ? displayValue : emptyText;

  const style = block.style || 'accent-box';

  if (style === 'accent-box') {
    const accentBox = (
      <div className="py-4 px-4 border border-[var(--accent)] bg-[var(--accent-bg)]">
        <p
          className={`text-[var(--color-text-primary)] text-sm leading-relaxed text-center ${hasValue ? '' : 'italic opacity-70'}`}
          style={{ textTransform: 'none' }}
        >
          {hasValue ? `"${textToShow}"` : textToShow}
        </p>
      </div>
    );

    // When `leftLabel` is set (used by the Closing Ritual touchstone cairn),
    // stack a small left-aligned uppercase subheader above the accent box.
    // Keeps alignment consistent across stacked touchstones of varying label
    // lengths — side-by-side layout squishes on mobile.
    if (block.leftLabel) {
      return (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
            {block.leftLabel}
          </p>
          {accentBox}
        </div>
      );
    }

    return accentBox;
  }

  if (style === 'italic') {
    return (
      <p
        className={`text-[var(--color-text-primary)] text-sm leading-relaxed italic text-center`}
        style={{ textTransform: 'none' }}
      >
        {textToShow}
      </p>
    );
  }

  // 'plain'
  return (
    <p
      className="text-[var(--color-text-primary)] text-sm leading-relaxed text-center"
      style={{ textTransform: 'none' }}
    >
      {textToShow}
    </p>
  );
}

function resolvePath(path, state) {
  if (!path) return undefined;
  const parts = path.split('.');
  let value = state;
  for (const part of parts) {
    if (value == null || typeof value !== 'object') return undefined;
    value = value[part];
  }
  return value;
}

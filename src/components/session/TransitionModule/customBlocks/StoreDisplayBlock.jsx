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
    return (
      <div className="py-4 px-4 border border-[var(--accent)] bg-[var(--accent-bg)]">
        <p
          className={`text-[var(--color-text-primary)] text-sm leading-relaxed text-center ${hasValue ? '' : 'italic opacity-70'}`}
          style={{ textTransform: 'none' }}
        >
          {hasValue ? `"${textToShow}"` : textToShow}
        </p>
      </div>
    );
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

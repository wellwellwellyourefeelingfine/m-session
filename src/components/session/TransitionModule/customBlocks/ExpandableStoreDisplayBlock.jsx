/**
 * ExpandableStoreDisplayBlock — A small button with a CirclePlus icon that,
 * when clicked, smoothly reveals a store value in an accent-bordered box.
 *
 * Used for compare-to-earlier-value affordances — e.g., showing the user their
 * opening-ritual touchstone alongside the peak-transition touchstone.
 *
 * Config:
 *   { type: 'expandable-store-display',
 *     storeKey: 'transitionData.openingTouchstone',  // dot-path to read
 *     showLabel: 'see 1st Touchstone',                // button label collapsed
 *     hideLabel: 'hide 1st Touchstone' }              // button label expanded
 */

import { useState } from 'react';
import { useSessionStore } from '../../../../stores/useSessionStore';
import { CirclePlusIcon, CircleSkipIcon } from '../../../shared/Icons';

function resolveStoreValue(path, state) {
  if (!path) return undefined;
  const parts = path.split('.');
  let val = state;
  for (const p of parts) {
    if (val == null) return undefined;
    val = val[p];
  }
  return val;
}

export default function ExpandableStoreDisplayBlock({ block }) {
  const [expanded, setExpanded] = useState(false);
  const value = useSessionStore((s) => resolveStoreValue(block.storeKey, s));

  const label = expanded
    ? (block.hideLabel || 'hide')
    : (block.showLabel || 'show');
  const Icon = expanded ? CircleSkipIcon : CirclePlusIcon;

  return (
    <div className="w-full">
      {/* Toggle button — gray text, inline icon to the right */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-xs uppercase tracking-wider
            text-[var(--color-text-tertiary)]
            hover:text-[var(--color-text-secondary)] transition-colors"
        >
          <span>{label}</span>
          <Icon size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Slide-down reveal of the accent box */}
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: expanded ? '200px' : '0',
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="pt-3">
          <div className="w-full py-4 px-4 border border-[var(--accent)] bg-[var(--accent-bg)]">
            <p
              className="text-lg text-[var(--color-text-primary)] text-center"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {value || '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

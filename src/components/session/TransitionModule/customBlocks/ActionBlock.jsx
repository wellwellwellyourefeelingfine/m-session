/**
 * ActionBlock — Generic store-action button
 *
 * Fires a named store action from an explicit allowlist, then reports readiness
 * so Continue becomes available.
 *
 * Config:
 *   { type: 'action', label: "I've Taken It", action: 'recordIngestionTime', style: 'accent' }
 */

import { useState, useCallback } from 'react';
import { useSessionStore } from '../../../../stores/useSessionStore';

const ALLOWED_ACTIONS = {
  recordIngestionTime: () => useSessionStore.getState().recordIngestionTime(Date.now()),
  confirmIngestionTime: () => useSessionStore.getState().confirmIngestionTime(),
};

export default function ActionBlock({ block, context }) {
  const [fired, setFired] = useState(false);
  const blockKey = block.key || `action-${block.action}`;

  const handleClick = useCallback(() => {
    if (fired) return;
    const fn = ALLOWED_ACTIONS[block.action];
    if (!fn) {
      console.warn(`[ActionBlock] Unknown action: ${block.action}`);
      return;
    }
    fn();
    setFired(true);
    context.reportReady?.(blockKey, true);
  }, [fired, block.action, blockKey, context]);

  const style = block.style || 'default';
  const buttonClass = style === 'accent'
    ? 'w-full py-4 px-4 border border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--color-text-primary)]'
    : 'w-full py-4 px-4 border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={fired}
      className={`${buttonClass} uppercase tracking-wider text-xs transition-opacity ${fired ? 'opacity-60 cursor-default' : ''}`}
    >
      {fired && block.labelAfter ? block.labelAfter : block.label}
    </button>
  );
}

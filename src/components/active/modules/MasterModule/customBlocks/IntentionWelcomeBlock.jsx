/**
 * IntentionWelcomeBlock — Conditional welcome copy for the intention-setting
 * v2 module. Branches on whether the user already has an intention saved
 * from intake (or any prior write to sessionProfile.holdingQuestion).
 *
 * MasterModule's condition evaluator deliberately omits storeState (see
 * customBlocks/index.js gotcha #1), so `condition: { storeValue: ... }`
 * doesn't pass at the block-config level. We subscribe directly via Zustand
 * selector and branch in JSX — the documented pattern.
 *
 * Config:
 *   { type: 'intention-welcome' }
 */

import { useSessionStore } from '../../../../../stores/useSessionStore';

const COPY_HAS_INTENTION =
  "During your intake, you wrote an initial intention for your session. " +
  "This activity is here to help you sit with it, examine it, and refine it if you'd like.";

const COPY_NO_INTENTION =
  "You haven't written an intention for your session yet. That's perfectly fine. " +
  "This activity will help you find one.";

export default function IntentionWelcomeBlock() {
  const holdingQuestion = useSessionStore((s) => s.sessionProfile?.holdingQuestion);
  const hasExisting = (holdingQuestion || '').trim().length > 0;

  return (
    <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
      {hasExisting ? COPY_HAS_INTENTION : COPY_NO_INTENTION}
    </p>
  );
}

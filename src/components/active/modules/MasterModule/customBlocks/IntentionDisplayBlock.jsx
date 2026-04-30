/**
 * IntentionDisplayBlock — Read-only accent box showing the saved intention.
 *
 * Used on the closing screen as the final beat — replaces `store-display`
 * which is TransitionModule-only and silently no-ops in MasterModule
 * (MasterModule's ScreensSection doesn't pass storeState into the
 * conditionContext). Renders nothing when sessionProfile.holdingQuestion
 * is empty so the closing screen still flows cleanly for a user who
 * intentionally skipped the writing step.
 *
 * Config:
 *   { type: 'intention-display' }
 */

import { useSessionStore } from '../../../../../stores/useSessionStore';

export default function IntentionDisplayBlock() {
  const savedValue = useSessionStore((s) => s.sessionProfile?.holdingQuestion);
  const trimmed = (savedValue || '').trim();
  if (!trimmed) return null;

  return (
    <div className="py-4 px-4 border border-[var(--accent)] bg-[var(--accent-bg)] text-left">
      <p
        className="text-[var(--color-text-primary)] text-sm italic leading-relaxed"
        style={{ textTransform: 'none' }}
      >
        &ldquo;{trimmed}&rdquo;
      </p>
    </div>
  );
}

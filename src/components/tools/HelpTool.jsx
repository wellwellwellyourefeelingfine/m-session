/**
 * HelpTool Component
 * Concise reassurance and clear expectations for difficult moments
 */

export default function HelpTool() {
  return (
    <div className="space-y-6 px-4 py-4">
      {/* Primary reassurance */}
      <div className="space-y-4">
        <p className="text-[var(--color-text-primary)] leading-relaxed">
          You are safe. What you're experiencing is the effect of MDMA, and it will pass.
          The intensity typically peaks around 90 minutes after ingestion and gradually
          decreases from there.
        </p>
      </div>

      {/* What to expect */}
      <div className="space-y-3">
        <h4 className="text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs">
          What to Expect
        </h4>
        <ul className="space-y-2 text-[var(--color-text-secondary)] text-sm">
          <li>Physical sensations (temperature changes, jaw tension) are normal</li>
          <li>Emotional intensity is part of the process</li>
          <li>Difficult moments often lead to meaningful insights</li>
          <li>The experience will end, usually within 4-6 hours</li>
        </ul>
      </div>

      {/* Simple actions */}
      <div className="space-y-3">
        <h4 className="text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs">
          If You Need to Ground
        </h4>
        <ul className="space-y-2 text-[var(--color-text-secondary)] text-sm">
          <li>Change your position or environment</li>
          <li>Drink some water</li>
          <li>Focus on slow, steady breathing</li>
          <li>Feel your feet on the floor</li>
        </ul>
      </div>

      {/* Resources pointer */}
      <div className="pt-4 border-t border-[var(--color-border)]">
        <p className="text-[var(--color-text-tertiary)] text-sm">
          For crisis support contacts and additional resources, see the Resources tab in the toolbar.
        </p>
      </div>
    </div>
  );
}

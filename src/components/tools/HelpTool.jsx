/**
 * HelpTool Component
 * Support resources and grounding techniques for session assistance
 */

export default function HelpTool() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3>You Are Safe</h3>
        <p className="text-[var(--color-text-secondary)]">
          Take a deep breath. This experience is temporary.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-[var(--color-text-secondary)]">You are in control. You can:</p>
        <ul className="space-y-2 text-[var(--color-text-secondary)]">
          <li>- Change your environment</li>
          <li>- Put on calming music</li>
          <li>- Move to a different position</li>
          <li>- Call someone you trust</li>
        </ul>
      </div>

      <div className="pt-4 border-t border-[var(--color-border)]">
        <p className="text-[var(--color-text-tertiary)] mb-2">
          If you need immediate support:
        </p>
        <p className="text-[var(--color-text-primary)]">
          Fireside Project: 62-FIRESIDE (623-473-7433)
        </p>
        <p className="text-[var(--color-text-tertiary)] text-xs mt-1">
          Free psychedelic peer support line, available 24/7
        </p>
      </div>

      <div className="pt-4 border-t border-[var(--color-border)]">
        <h4 className="text-[var(--color-text-secondary)] uppercase tracking-wider text-xs mb-3">
          Grounding Techniques
        </h4>
        <div className="space-y-3 text-[var(--color-text-secondary)]">
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">5-4-3-2-1</p>
            <p className="text-sm">
              Name 5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste.
            </p>
          </div>
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">Box Breathing</p>
            <p className="text-sm">
              Breathe in 4 seconds, hold 4, out 4, hold 4. Repeat.
            </p>
          </div>
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">Feel Your Body</p>
            <p className="text-sm">
              Focus on the sensation of your feet on the floor, hands on your lap.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

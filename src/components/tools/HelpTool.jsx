/**
 * HelpTool Component
 * Warm reassurance and grounding support for difficult moments.
 * Tone: calm friend, not safety briefing.
 */

export default function HelpTool() {
  return (
    <div className="py-6 px-6 max-w-xl mx-auto space-y-8">
      {/* Primary reassurance — large and prominent */}
      <div className="space-y-4">
        <h3 className="text-base font-light text-[var(--accent)]">
          You are safe.
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          What you&apos;re feeling is the MDMA. It will pass. The intensity
          usually peaks around 90 minutes in and eases from there. Most
          experiences last 4&ndash;6 hours total.
        </p>
      </div>

      {/* Things that can help */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
          Things That Can Help
        </p>
        <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <li>Change your position or where you are</li>
          <li>Drink some water</li>
          <li>Slow your breathing &mdash; in through the nose, out through the mouth</li>
          <li>Feel your feet on the floor, your hands on your legs</li>
          <li>Put on music that feels good</li>
          <li>Talk to whoever is with you &mdash; you don&apos;t have to explain, just connect</li>
        </ul>
      </div>

      {/* Remember */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
          Remember
        </p>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Difficult moments are not emergencies. Emotional intensity, physical
          sensations, and waves of energy are all part of the experience.
          Let them move through you.
        </p>
      </div>

      {/* Support contacts */}
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
          If You Need Support
        </p>

        <div className="space-y-3 text-sm">
          <div>
            <a
              href="https://firesideproject.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-primary)] underline hover:opacity-70 transition-opacity"
            >
              Fireside Project
            </a>
            <span className="text-[var(--color-text-secondary)]">
              {' '}&mdash; free psychedelic peer support
            </span>
            <p className="mt-1">
              <a
                href="tel:+16234737433"
                className="text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
              >
                62-FIRESIDE (623-473-7433)
              </a>
              <span className="text-[var(--color-text-tertiary)] text-xs ml-2">
                Daily 11am&ndash;11pm PT
              </span>
            </p>
          </div>

          <div>
            <a
              href="https://chat.tripsit.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-primary)] underline hover:opacity-70 transition-opacity"
            >
              TripSit
            </a>
            <span className="text-[var(--color-text-secondary)]">
              {' '}&mdash; 24/7 live chat, anonymous
            </span>
            <p className="text-[var(--color-text-tertiary)] text-xs mt-1">
              chat.tripsit.me
            </p>
          </div>
        </div>
      </div>

      {/* Medical emergency disclaimer */}
      <div className="pt-4 border-t border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed">
          In a medical emergency (someone is unconscious, not breathing, or
          having a seizure), call{' '}
          <span className="text-[var(--color-text-secondary)]">911</span> (US/Canada)
          {' '}or{' '}
          <span className="text-[var(--color-text-secondary)]">112</span> (Europe).
        </p>
      </div>
    </div>
  );
}

/**
 * OpeningIndex — the "cover page" shown as the first screen of the Opening
 * Checklist, before the logistical steps begin.
 *
 * Purpose: welcome the user with a matter-of-fact guide-tone framing, then
 * present a book-style table of contents for the two parts ahead (Opening
 * Checklist + Opening Ritual), so they know where they are in the arc of
 * the session.
 *
 * Renders its own body content but relies on the parent SubstanceChecklist
 * to render the ModuleControlBar (Continue button) beneath it. No
 * ModuleStatusBar is rendered at this step — this is pre-flow.
 *
 * The parent handles the fade-in timing — this component just returns body
 * markup.
 */

export default function OpeningIndex() {
  return (
    <div className="space-y-8">
      {/* Header + guide framing */}
      <div className="space-y-4">
        <h2
          className="text-2xl text-[var(--color-text-primary)]"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          It&apos;s finally time
        </h2>
        <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
          Before we really settle into the session itself, we&apos;ll take care of a few logistical things first. The setting, the substance, your safety. Once those are sorted, we can relax into what comes next.
        </p>
      </div>

      {/* Part 1 — Opening Checklist */}
      <TocPart
        number="1"
        title="Opening Checklist"
        items={[
          'Setting the space',
          'A journal-friendly app',
          'Your substance',
          'Trusted contact',
        ]}
      />

      {/* Part 2 — Opening Ritual */}
      <TocPart
        number="2"
        title="Opening Ritual"
        items={[
          'Arriving',
          'Touchstone',
          'Intention',
          'Centering breath',
          'Taking your substance',
          'Begin the session',
        ]}
      />
    </div>
  );
}

function TocPart({ number, title, items }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3">
        <span
          className="text-[var(--accent)] text-xs uppercase tracking-wider"
        >
          Part {number}
        </span>
        <span
          className="text-[var(--color-text-primary)] text-lg"
          style={{ fontFamily: "'DM Serif Text', serif", textTransform: 'none' }}
        >
          {title}
        </span>
      </div>
      <ul className="space-y-1.5 pl-4">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-xs tracking-wider text-[var(--color-text-secondary)]"
          >
            <span className="text-[var(--color-text-tertiary)] mt-[6px] text-[8px]">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

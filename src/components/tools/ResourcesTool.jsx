/**
 * ResourcesTool Component
 *
 * Quick-reference list of emergency contacts, harm reduction resources,
 * and external links. Designed to be dense but scannable.
 * Lives in the Tools tab.
 */

import { useToolsStore } from '../../stores/useToolsStore';

export default function ResourcesTool() {
  const toggleTool = useToolsStore((state) => state.toggleTool);

  // Open the testing tool when clicking the internal link
  const handleTestingClick = () => {
    toggleTool('testing');
  };

  return (
    <div className="py-6 px-6 max-w-xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)]">
          Resources
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Emergency support, harm reduction info, and further reading.
        </p>
      </div>

      {/* Emergency */}
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
          If You Need Help Now
        </p>

        <div className="space-y-4">
          {/* Medical Emergency */}
          <div className="p-4 border border-[var(--color-border)]">
            <p className="text-[var(--color-text-primary)]">
              Medical Emergency
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              If someone is unconscious, not breathing, having a seizure, or
              showing signs of overheating—call emergency services immediately.
            </p>
            <div className="mt-2 text-sm">
              <span className="text-[var(--color-text-primary)]">911</span>
              <span className="text-[var(--color-text-tertiary)]"> (US/Canada)</span>
              <span className="text-[var(--color-text-tertiary)] mx-2">·</span>
              <span className="text-[var(--color-text-primary)]">112</span>
              <span className="text-[var(--color-text-tertiary)]"> (Europe)</span>
            </div>
          </div>

          {/* Fireside Project */}
          <div>
            <a
              href="https://firesideproject.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-primary)] underline hover:opacity-70 transition-opacity"
            >
              Fireside Project
            </a>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Free psychedelic peer support by phone or text. Trained volunteers
              who understand what you're going through.
            </p>
            <p className="text-sm mt-2">
              <a
                href="tel:+16234737433"
                className="text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
              >
                62-FIRESIDE (623-473-7433)
              </a>
              <br />
              <span className="text-[var(--color-text-tertiary)] text-xs">
                Daily 11am–11pm PT · Call or text
              </span>
            </p>
          </div>

          {/* TripSit */}
          <div>
            <a
              href="https://chat.tripsit.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-primary)] underline hover:opacity-70 transition-opacity"
            >
              TripSit Chat
            </a>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              24/7 live chat support from harm reduction volunteers.
              Non-judgmental, anonymous.
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)] text-xs mt-1">
              chat.tripsit.me
            </p>
          </div>

          {/* Crisis/Suicide */}
          <div className="text-sm text-[var(--color-text-secondary)]">
            <span className="text-[var(--color-text-primary)]">
              Crisis or suicidal thoughts:
            </span>
            {' '}
            <a
              href="tel:988"
              className="text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
            >
              988
            </a>
            {' '}(US) · Fireside is not a suicide hotline—call 988 or your local crisis line.
          </div>
        </div>
      </section>

      {/* Harm Reduction Info */}
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
          Harm Reduction
        </p>

        <ul className="space-y-3 text-sm">
          <li>
            <a
              href="https://rollsafe.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-primary)] underline hover:opacity-70 transition-opacity"
            >
              RollSafe.org
            </a>
            <span className="text-[var(--color-text-secondary)]">
              {' '}— Comprehensive MDMA guide: dosage, testing, supplements, what to expect
            </span>
          </li>

          <li>
            <a
              href="https://dancesafe.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-primary)] underline hover:opacity-70 transition-opacity"
            >
              DanceSafe
            </a>
            <span className="text-[var(--color-text-secondary)]">
              {' '}— Nonprofit harm reduction org, test kits, drug checking info
            </span>
          </li>

          <li>
            <a
              href="https://wiki.tripsit.me/wiki/MDMA"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-primary)] underline hover:opacity-70 transition-opacity"
            >
              TripSit Wiki: MDMA
            </a>
            <span className="text-[var(--color-text-secondary)]">
              {' '}— Effects, duration, dosage, combinations
            </span>
          </li>

          <li>
            <a
              href="https://combo.tripsit.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-primary)] underline hover:opacity-70 transition-opacity"
            >
              TripSit Combo Chart
            </a>
            <span className="text-[var(--color-text-secondary)]">
              {' '}— Drug interaction checker (what's safe to combine, what's not)
            </span>
          </li>

          <li>
            <button
              onClick={handleTestingClick}
              className="text-[var(--color-text-primary)] underline hover:opacity-70 transition-opacity text-left"
            >
              Testing Guide
            </button>
            <span className="text-[var(--color-text-secondary)]">
              {' '}— Reagent kits, lab testing, where to get them (in this app)
            </span>
          </li>
        </ul>
      </section>

      {/* Supplements */}
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
          Supplements
        </p>

        <p className="text-sm text-[var(--color-text-secondary)]">
          Some research suggests certain supplements may reduce MDMA's
          neurotoxic effects. Evidence is mostly from animal studies.
        </p>

        <ul className="space-y-2 text-sm">
          <li>
            <a
              href="https://rollsafe.org/mdma-supplements/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-primary)] underline hover:opacity-70 transition-opacity"
            >
              RollSafe Supplement Guide
            </a>
            <span className="text-[var(--color-text-secondary)]">
              {' '}— Research-backed recommendations
            </span>
          </li>

          <li>
            <a
              href="https://rollkit.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-primary)] underline hover:opacity-70 transition-opacity"
            >
              Roll Kit
            </a>
            <span className="text-[var(--color-text-secondary)]">
              {' '}— Pre-packaged supplement kits (donates to MAPS)
            </span>
          </li>
        </ul>
      </section>

      {/* Further Reading */}
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
          Further Reading
        </p>

        <ul className="space-y-2 text-sm">
          <li>
            <a
              href="https://maps.org/mdma/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-primary)] underline hover:opacity-70 transition-opacity"
            >
              MAPS: MDMA Research
            </a>
            <span className="text-[var(--color-text-secondary)]">
              {' '}— Clinical research on MDMA-assisted therapy
            </span>
          </li>

          <li>
            <a
              href="https://erowid.org/chemicals/mdma/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-primary)] underline hover:opacity-70 transition-opacity"
            >
              Erowid MDMA Vault
            </a>
            <span className="text-[var(--color-text-secondary)]">
              {' '}— Comprehensive archive: experiences, research, history
            </span>
          </li>

          <li>
            <a
              href="https://psychonautwiki.org/wiki/MDMA"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-primary)] underline hover:opacity-70 transition-opacity"
            >
              PsychonautWiki: MDMA
            </a>
            <span className="text-[var(--color-text-secondary)]">
              {' '}— Detailed effects, subjective experiences, pharmacology
            </span>
          </li>
        </ul>
      </section>

      {/* Books */}
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
          Books
        </p>

        <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <li>
            <a
              href="https://maps.org/images/pdf/scr.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-text-primary)] underline hover:opacity-70 transition-opacity"
            >
              "The Secret Chief Revealed"
            </a>
            {' '}— Myron Stolaroff. The story of Leo Zeff and underground MDMA therapy. (Free PDF)
          </li>

          <li>
            <span className="text-[var(--color-text-primary)]">
              "PIHKAL"
            </span>
            {' '}— Alexander & Ann Shulgin. Part memoir, part chemistry, includes MDMA's rediscovery.
          </li>

          <li>
            <span className="text-[var(--color-text-primary)]">
              "Trust Surrender Receive"
            </span>
            {' '}— Anne Other. Personal account of MDMA-assisted therapy.
          </li>
        </ul>
      </section>

      {/* Bottom note */}
      <div className="pt-4 border-t border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)]">
        <p>
          These resources are for harm reduction and education. We're not
          affiliated with any of them. Always do your own research.
        </p>
      </div>
    </div>
  );
}

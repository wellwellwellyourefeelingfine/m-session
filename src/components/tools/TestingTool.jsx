/**
 * TestingTool Component
 *
 * Comprehensive guide to substance testing - reagent kits vs lab testing,
 * crystal vs pressed pills, and trusted resources.
 * Lives in the Tools tab.
 *
 * Region-aware: North America vs Europe have different risk profiles
 * and resource availability.
 */

import { useState } from 'react';

// Expandable section component
function Section({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--color-border)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left py-4 flex justify-between items-center hover:opacity-70 transition-opacity"
      >
        <span>{title}</span>
        <span className="text-[var(--color-text-tertiary)]">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="pb-6 space-y-4 text-sm text-[var(--color-text-secondary)]">
          {children}
        </div>
      )}
    </div>
  );
}

export default function TestingTool() {
  const [region, setRegion] = useState('north-america');
  const isEurope = region === 'europe';

  return (
    <div className="py-6 px-6 max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h3 className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)]">
          Testing Your Substance
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          You can't know what you have by looking at it. Testing won't make
          drug use safe, but it can help you avoid some of the worst outcomes.
        </p>

        {/* Region Toggle */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[var(--color-text-tertiary)]">I'm in:</span>
          <div className="flex">
            <button
              onClick={() => setRegion('north-america')}
              className={`px-3 py-1 border border-[var(--color-border)] border-r-0 transition-colors
                ${region === 'north-america'
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)]'
                  : 'bg-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}
            >
              North America
            </button>
            <button
              onClick={() => setRegion('europe')}
              className={`px-3 py-1 border border-[var(--color-border)] transition-colors
                ${region === 'europe'
                  ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)]'
                  : 'bg-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'}`}
            >
              Europe
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>

        {/* Crystal vs Pills */}
        <Section title="Crystal vs. Pressed Pills" defaultOpen={true}>
          <p>
            MDMA comes in two common forms, and they have different risk profiles
            when it comes to adulteration.
          </p>

          <div className="space-y-3 mt-4">
            <div>
              <p className="text-[var(--color-text-primary)] mb-1">
                Crystal / Powder
              </p>
              <p>
                Raw MDMA that you weigh and put into capsules yourself. Generally
                considered lower risk for adulterants because there's less processing
                involved. What you see is closer to what you get. Still needs testing—purity
                varies and substitutions happen—but fewer opportunities for additives.
              </p>
            </div>

            <div>
              <p className="text-[var(--color-text-primary)] mb-1">
                Pressed Pills / Tablets
              </p>
              <p>
                MDMA mixed with a binder and pressed into a pill. The pressing process
                creates more opportunity for adulteration—other active substances can be
                mixed in, and you can't visually assess what you're getting. Pills with
                logos or designs are often counterfeited. A pill that was safe last month
                may not be the same pill this month, even if it looks identical.
              </p>
              {isEurope && (
                <p className="mt-2">
                  In Europe, pressed pills often contain high doses of MDMA (150-300mg),
                  sometimes more than twice a reasonable single dose. Testing can help
                  you know what you're working with so you can dose appropriately.
                </p>
              )}
            </div>
          </div>

          <p className="mt-4 text-[var(--color-text-primary)]">
            If you have the choice, crystal is generally the safer bet. If you're
            using pills, testing becomes even more important.
          </p>
        </Section>

        {/* Home Testing */}
        <Section title="Home Testing (Reagent Kits)">
          <p className="text-[var(--color-text-primary)]">
            What it is
          </p>
          <p>
            Reagent kits are bottles of chemicals that change color when they react
            with certain substances. You place a tiny sample of your substance on a
            ceramic plate, add a drop of reagent, and observe the color change.
          </p>

          <p className="text-[var(--color-text-primary)] mt-4">
            For MDMA testing
          </p>
          <p>
            Use at minimum two reagents: <span className="text-[var(--color-text-primary)]">Marquis</span> (should
            turn purple/black) and <span className="text-[var(--color-text-primary)]">Simon's</span> (should
            turn blue). This combination helps distinguish MDMA from MDA, methamphetamine,
            and other substitutes.
          </p>

          <p className="text-[var(--color-text-primary)] mt-4">
            What it can tell you
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Whether MDMA is likely present</li>
            <li>Whether something is clearly not MDMA</li>
            <li>Red flags suggesting adulteration</li>
          </ul>

          <p className="text-[var(--color-text-primary)] mt-4">
            What it can't tell you
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Purity or dose</li>
            <li>Everything that's in the sample</li>
            {!isEurope && (
              <li>Presence of fentanyl (use separate strips for this)</li>
            )}
          </ul>

          <p className="mt-4">
            Reagent testing is a first-pass screen, not a guarantee. An "expected"
            result doesn't mean your substance is pure or safe—it means it didn't
            raise any obvious red flags.
          </p>

          <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
              Where to get kits
            </p>

            {isEurope ? (
              <>
                <ul className="space-y-2">
                  <li>
                    <span className="text-[var(--color-text-primary)]">Smart shops</span>
                    <span> — In the Netherlands, reagent kits are available at smart shops
                    for around €10-15. Other EU countries have similar options.</span>
                  </li>
                  <li>
                    <a
                      href="https://www.eztestkits.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
                    >
                      EZ Test
                    </a>
                    <span> — EU-based, widely available</span>
                  </li>
                  <li>
                    <a
                      href="https://testkitplus.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
                    >
                      Test Kit Plus
                    </a>
                    <span> — Ships to EU</span>
                  </li>
                </ul>
                <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">
                  Many European festivals and clubs also offer free on-site drug checking
                  services. Check if your local event has one.
                </p>
              </>
            ) : (
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://dancesafe.org/product/mdma-testing-kit/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
                  >
                    DanceSafe
                  </a>
                  <span> — US nonprofit, kits include fentanyl strips</span>
                </li>
                <li>
                  <a
                    href="https://bunkpolice.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
                  >
                    Bunk Police
                  </a>
                  <span> — US, ships internationally</span>
                </li>
              </ul>
            )}
          </div>
        </Section>

        {/* Lab Testing */}
        <Section title="Lab Testing (Mail-In)">
          <p className="text-[var(--color-text-primary)]">
            What it is
          </p>
          <p>
            You mail a small sample (typically 10-50mg) to a laboratory that uses
            professional analytical equipment—usually GC-MS (gas chromatography–mass
            spectrometry) or LC-MS (liquid chromatography). They identify what's in
            your sample and report back, usually within 1-2 weeks.
          </p>

          <p className="text-[var(--color-text-primary)] mt-4">
            What it can tell you
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Exactly what substances are present</li>
            <li>Purity percentage (how much is actually MDMA)</li>
            <li>Presence of adulterants or cutting agents</li>
            <li>Dose per pill (for pressed tablets)</li>
          </ul>

          <p className="text-[var(--color-text-primary)] mt-4">
            Considerations
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Takes 1-2 weeks—requires planning ahead</li>
            <li>Costs {isEurope ? '€20-70' : '$40-100'} depending on service and analysis depth</li>
            <li>You're mailing a controlled substance (services handle this carefully)</li>
            <li>Results are anonymous</li>
          </ul>

          <p className="mt-4">
            Lab testing gives you the clearest picture of what you actually have.
            If you're sourcing from somewhere new or have any doubts, this is the
            most reliable option.
          </p>

          <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
              Trusted services
            </p>

            {isEurope ? (
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://energycontrol-international.org/drug-testing-service/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
                  >
                    Energy Control International
                  </a>
                  <span> — Spain, serving users since 1999</span>
                </li>
                <li>
                  <a
                    href="https://www.kykeonanalytics.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
                  >
                    Kykeon Analytics
                  </a>
                  <span> — Spain, anonymous, accepts crypto</span>
                </li>
              </ul>
            ) : (
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://www.drugsdata.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
                  >
                    DrugsData.org
                  </a>
                  <span> — US, run by Erowid</span>
                </li>
                <li>
                  <a
                    href="https://energycontrol-international.org/drug-testing-service/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
                  >
                    Energy Control International
                  </a>
                  <span> — Spain, accepts international samples</span>
                </li>
                <li>
                  <a
                    href="https://www.kykeonanalytics.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-[var(--color-text-primary)] hover:opacity-70 transition-opacity"
                  >
                    Kykeon Analytics
                  </a>
                  <span> — Spain/Canada, anonymous, accepts crypto</span>
                </li>
              </ul>
            )}
          </div>
        </Section>

        {/* Comparison */}
        <Section title="Which Should I Use?">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="py-2 pr-4"></th>
                  <th className="py-2 pr-4 text-[var(--color-text-primary)]">Reagent</th>
                  <th className="py-2 text-[var(--color-text-primary)]">Lab</th>
                </tr>
              </thead>
              <tbody className="text-[var(--color-text-secondary)]">
                <tr className="border-b border-[var(--color-border)]">
                  <td className="py-2 pr-4 text-[var(--color-text-primary)]">Speed</td>
                  <td className="py-2 pr-4">Immediate</td>
                  <td className="py-2">1-2 weeks</td>
                </tr>
                <tr className="border-b border-[var(--color-border)]">
                  <td className="py-2 pr-4 text-[var(--color-text-primary)]">Cost</td>
                  <td className="py-2 pr-4">{isEurope ? '€10-20' : '$25-50'} (many tests)</td>
                  <td className="py-2">{isEurope ? '€20-70' : '$40-100'} per sample</td>
                </tr>
                <tr className="border-b border-[var(--color-border)]">
                  <td className="py-2 pr-4 text-[var(--color-text-primary)]">Accuracy</td>
                  <td className="py-2 pr-4">Identifies red flags</td>
                  <td className="py-2">Precise composition</td>
                </tr>
                <tr className="border-b border-[var(--color-border)]">
                  <td className="py-2 pr-4 text-[var(--color-text-primary)]">Purity info</td>
                  <td className="py-2 pr-4">No</td>
                  <td className="py-2">Yes</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-[var(--color-text-primary)]">Best for</td>
                  <td className="py-2 pr-4">Quick check, known source</td>
                  <td className="py-2">New source, pressed pills, peace of mind</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-4">
            <span className="text-[var(--color-text-primary)]">Ideal approach:</span> Use
            reagents as a quick first check, and lab testing when you have time and
            want certainty. They complement each other.
          </p>

          {isEurope && (
            <p className="mt-3">
              <span className="text-[var(--color-text-primary)]">Festival testing:</span> Many
              European events offer free on-site drug checking with lab-grade equipment.
              These services (like The Loop in the UK, Jellinek in NL, or CheckIt! in Austria)
              combine the speed of reagents with the accuracy of lab testing.
            </p>
          )}
        </Section>

        {/* Fentanyl - conditional display */}
        {!isEurope ? (
          <Section title="Fentanyl Testing">
            <p>
              Fentanyl contamination in the North American drug supply is a serious risk.
              While less common in MDMA than in opioids or cocaine, it does happen—and
              the consequences can be fatal. Standard reagent tests won't detect it.
            </p>

            <p className="mt-3">
              <span className="text-[var(--color-text-primary)]">Fentanyl test strips</span> are
              inexpensive ($1-2 each) and easy to use. DanceSafe includes them with their
              kits, or you can buy them separately. If you're testing anything in North
              America, add this step—it takes two minutes.
            </p>

            <p className="text-[var(--color-text-primary)] mt-4">
              How to use them
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Dissolve a small amount of your substance in water</li>
              <li>Dip the strip for 15 seconds</li>
              <li>Wait 2-5 minutes for results</li>
              <li>Two lines = negative, one line = positive for fentanyl</li>
            </ul>

            <p className="mt-4 text-[var(--color-text-tertiary)] text-xs">
              Note: Fentanyl strips can give false positives with some substances. A positive
              result warrants caution and ideally lab confirmation, not immediate panic—but
              do take it seriously.
            </p>
          </Section>
        ) : (
          <Section title="A Note on Fentanyl">
            <p>
              Fentanyl contamination is primarily a North American problem. In Europe,
              the MDMA supply has remained largely unaffected by the fentanyl crisis.
              This doesn't mean it's impossible, but it's not a primary concern the way
              it is in the US and Canada.
            </p>

            <p className="mt-3">
              The more relevant risks in Europe are high-dose pills (some contain
              200-300mg of MDMA) and occasional substitution with other substances.
              Reagent testing and dose awareness address these concerns more directly
              than fentanyl strips.
            </p>

            <p className="mt-3 text-[var(--color-text-tertiary)] text-xs">
              If you're traveling to North America, different rules apply—fentanyl testing
              becomes important there.
            </p>
          </Section>
        )}

      </div>

      {/* Bottom reminder */}
      <div className="pt-4 text-sm text-[var(--color-text-tertiary)]">
        <p>
          Testing reduces risk but doesn't eliminate it. Start with a lower dose
          even with tested substances, especially from a new batch.
        </p>
      </div>
    </div>
  );
}

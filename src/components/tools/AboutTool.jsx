/**
 * AboutTool Component
 * About this project, what it is, what it isn't, and legal context.
 */

import { useState } from 'react';

const ETH_ADDRESS = '0x112494ef00fFAcAcC33BC7774C3d73BAA7733c51';

export default function AboutTool() {
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(ETH_ADDRESS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="py-6 px-6 max-w-xl mx-auto">
      <h3 className="text-lg mb-8 tracking-wider text-xs text-[var(--color-text-tertiary)]">
        About This Project
      </h3>

      <div className="space-y-8 text-[var(--color-text-secondary)]">
        {/* What m-session Is */}
        <section>
          <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
            What m-session Is
          </h2>
          <p className="mb-4">
            m-session provides structure and support for MDMA sessions focused on
            personal growth. Not therapy. Not treatment. A companion for honest
            self-reflection — whether you're on your own, with a partner, or with
            a trusted sitter.
          </p>
          <p className="mb-4">
            The app is built around the full arc of a session, including the days
            that follow, when insights are still fresh and the work of integration
            can actually begin. Every guided activity is rooted in an established
            therapeutic framework — IFS, ACT, Coherence Therapy, Focusing, and
            more — adapted for self-guided use.
          </p>
          <p>
            The approach throughout is non-directive: the app supports your process
            rather than steering it. Designed for altered states — minimal cognitive
            load, nothing jarring, nothing demanding. Content meets you where you are.
          </p>
        </section>

        {/* Therapeutic Frameworks */}
        <section>
          <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
            Therapeutic Frameworks
          </h2>
          <p className="mb-4">
            Every guided activity is rooted in an established therapeutic approach,
            adapted for self-guided use in altered states. The module library is
            always growing, and you can tailor your session with whichever
            frameworks feel most relevant to your process.
          </p>
          <div className="space-y-3">
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">Acceptance and Commitment Therapy (ACT)</p>
              <p>Values-driven action and psychological flexibility. Used in the
              Values Compass, Leaves on a Stream, and integration exercises.</p>
            </div>
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">Internal Family Systems (IFS)</p>
              <p>Meeting protective parts with curiosity rather than judgment. Used
              in the Protector Dialogue modules — guided meditation and journaling.</p>
            </div>
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">Emotionally Focused Therapy (EFT)</p>
              <p>Mapping the emotional cycles that drive disconnection in relationships.
              Used in The Deep Dive and The Cycle modules.</p>
            </div>
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">Coherence Therapy</p>
              <p>Accessing and transforming emotional schemas through felt experience.
              Used in the Stay With It module.</p>
            </div>
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">Focusing (Gendlin Method)</p>
              <p>Turning attention inward to the body's felt sense — the place where
              meaning hasn't yet formed into words. Used in the Felt Sense module.</p>
            </div>
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">Self-Compassion</p>
              <p>Kristin Neff's framework: mindfulness, common humanity, and self-kindness.
              Audio-guided meditation available throughout the session.</p>
            </div>
            <div>
              <p className="font-medium text-[var(--color-text-primary)]">Body-Centered Practices</p>
              <p>Body scan, breathwork, and grounding exercises. Multiple audio-guided
              meditations designed for different phases of the experience.</p>
            </div>
          </div>
          <p className="mt-4">
            If you have suggestions for other therapeutic frameworks we should
            build activities around, we'd love to hear from you.
          </p>
          <a
            href="https://tally.so/r/BzG9qN"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-xs uppercase tracking-wider py-2 px-4 border border-[var(--color-border)] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            Share Feedback
          </a>
        </section>

        {/* Who Built This */}
        <section>
          <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
            Who Built This
          </h2>
          <p className="mb-4">
            I built m-session because I believe people have the power to change
            themselves, and that psychedelics are one of the most powerful tools
            available to help with that. MDMA in particular has a way of cutting
            through the noise and helping people feel connected again — sometimes
            for the first time in years.
          </p>
          <p className="mb-4">
            My hope is that m-session grows into a true community project, with
            many active contributors, and that this tool becomes genuinely useful
            for anyone on their healing journey.
          </p>
          <p className="italic">
            Good luck, I love you.
          </p>
          <p className="text-[var(--color-text-tertiary)] text-xs mt-2">
            — dasloops
          </p>
        </section>

        {/* Privacy */}
        <section>
          <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
            Privacy by Design
          </h2>
          <p>
            No accounts, no analytics, no data collection. Everything is stored
            locally on your device — journal entries, intake responses, session
            history — none of it ever leaves your browser. What you explore in a
            session is yours alone. Open source and auditable.
          </p>
        </section>

        {/* Support */}
        <section>
          <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
            Support This Project
          </h2>
          <p className="mb-4">
            m-session is free and always will be. But development, hosting, and audio
            production have real costs. If the app has been useful to you and you'd
            like to help keep it running, contributions are genuinely appreciated.
          </p>
          <div className="bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
              Donate via Ethereum
            </p>
            <p
              className="text-xs text-[var(--color-text-primary)] break-all font-mono cursor-pointer hover:opacity-70 transition-opacity normal-case"
              onClick={handleCopyAddress}
              title="Click to copy"
            >
              {ETH_ADDRESS}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-2 transition-opacity duration-300">
              {copied ? 'Copied!' : 'Tap to copy address'}
            </p>
          </div>
        </section>

        {/* Open Source */}
        <section>
          <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
            Open Source
          </h2>
          <p className="mb-4">
            m-session is open source under the AGPL-3.0 license. Every line of code
            is available for inspection — you can verify that there are no hidden
            network requests, no analytics scripts, no data collection of any kind.
          </p>
          <p className="mb-4">
            If you're a developer, designer, writer, or just someone with ideas —
            you can help make this better. The module library is still growing,
            informed by community feedback and the input of practicing therapists
            and guides.
          </p>
          <a
            href="https://github.com/wellwellwellyourefeelingfine/m-session"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs uppercase tracking-wider py-2 px-4 border border-[var(--color-border)] hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            View on GitHub
          </a>
        </section>

        {/* Legal */}
        <section>
          <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
            Legal Notice
          </h2>
          <p className="mb-4">
            This application provides educational content, meditation guidance, and
            harm reduction information. It does not encourage, promote, or facilitate
            the use, purchase, or distribution of any controlled substance. The
            information provided is for educational and harm reduction purposes only.
          </p>
          <p className="mb-4">
            MDMA and other substances referenced in this app may be classified as
            controlled substances in your jurisdiction. Laws regarding these substances
            vary by country, state, and region. Users are solely responsible for
            understanding and complying with all applicable laws in their jurisdiction.
          </p>
          <p className="mb-4">
            This app is not a medical device and does not provide medical advice,
            diagnosis, or treatment. It is not a substitute for professional medical
            care, psychological counseling, or licensed therapy. If you are experiencing
            a mental health crisis, please contact a qualified professional or emergency
            services.
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            This project is provided as-is, without warranty. The creators assume no
            liability for how this tool is used. By using this application, you
            acknowledge that you are an adult acting of your own free will and accept
            full responsibility for your decisions.
          </p>
        </section>

      </div>
    </div>
  );
}

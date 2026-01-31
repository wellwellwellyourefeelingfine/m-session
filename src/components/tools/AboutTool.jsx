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
    <div className="py-12 px-6 max-w-xl mx-auto">
      <h3 className="text-lg mb-8 tracking-wider text-xs text-[var(--color-text-tertiary)]">
        About This Project
      </h3>

      <div className="space-y-8 text-[var(--color-text-secondary)]">
        {/* What We Built */}
        <section>
          <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
            What We Built
          </h2>
          <p className="mb-4">
            This is a harm reduction tool. It provides meditation, breathing exercises,
            journaling prompts, and structured guidance for people who have already
            decided to have an experience. We didn't build it to encourage anyone to
            take anything. We built it because people are going to do this regardless,
            and they deserve thoughtful tools when they do.
          </p>
          <p>
            The app doesn't sell, distribute, or help anyone obtain any controlled
            substance. It doesn't connect users to suppliers. It doesn't facilitate
            transactions. It's a meditation app with a specific use case — and everything
            in it (breathwork, body scans, guided journaling, self-compassion practices)
            is beneficial whether or not any substance is involved.
          </p>
        </section>

        {/* Why It Exists */}
        <section>
          <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
            Why It Exists
          </h2>
          <p className="mb-4">
            We believe in treating people as adults. Adults with sovereignty over their
            own minds and bodies. Adults with the common sense to make their own informed
            decisions about their own lives.
          </p>
          <p className="mb-4">
            The research is clear: MDMA-assisted therapy has shown remarkable results for
            PTSD, depression, and anxiety. Decades of clinical trials, thousands of
            participants, consistent findings. This isn't fringe science — it's published
            in peer-reviewed journals and has been granted breakthrough therapy designation
            by the U.S. FDA.
          </p>
          <p>
            But access to clinical settings is limited, expensive, and in most places
            not yet legally available. Meanwhile, people are having these experiences on
            their own — often without any structure, preparation, or integration support.
            We'd rather they have good tools than none at all.
          </p>
        </section>

        {/* What We Believe */}
        <section>
          <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
            What We Believe
          </h2>
          <p className="mb-4">
            Harm reduction saves lives. Pretending people won't do something doesn't
            stop them from doing it — it just means they do it without information. We
            believe providing honest, practical guidance is more ethical than withholding
            it.
          </p>
          <p>
            We also believe that meditation, breathwork, journaling, and structured
            self-reflection are universally valuable practices. This app packages them
            in a specific context, but the tools themselves are as old as human
            civilization.
          </p>
        </section>

        {/* Privacy */}
        <section>
          <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
            Privacy By Design
          </h2>
          <p>
            This app has no servers, no accounts, no analytics, and no way for us to
            see what you do with it. Everything is stored locally on your device. Your
            journal entries, your intake responses, your session history — none of it
            ever leaves your browser. This isn't a limitation. It's a deliberate choice.
            What you explore in a session is yours alone.
          </p>
        </section>

        {/* Support */}
        <section>
          <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
            Support This Project
          </h2>
          <p className="mb-4">
            This is a one-person project. No team, no investors, no revenue model.
            Just someone who thought this should exist and built it. The app is free
            and always will be.
          </p>
          <p className="mb-4">
            If it's been useful to you and you'd like to help keep it running, donations
            toward hosting and domain costs are genuinely appreciated. No pressure —
            the app works the same either way.
          </p>
          <div className="bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-lg p-4">
            <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
              Donate via Ethereum
            </p>
            <p
              className="text-xs text-[var(--color-text-primary)] break-all font-mono cursor-pointer hover:opacity-70 transition-opacity"
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
            This project is fully open source under the AGPL-3.0 license. The entire
            codebase is public — you can read it, fork it, improve it, or build on it.
          </p>
          <p className="mb-4">
            If you're a developer, designer, writer, or just someone with ideas — you
            can help make this better. Bug reports, feature suggestions, and pull requests
            are all welcome.
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

        <div className="pt-1">
          <p className="text-[var(--color-text-secondary)] italic">
            Good luck. I love you.
          </p>
          <p className="text-[var(--color-text-tertiary)] text-xs">
            — dasloops
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * AboutTool Component
 * About this project, what it is, why it exists, who built it, and legal context.
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

      <div className="space-y-8 text-[var(--color-text-secondary)]">
        {/* What is m-session? */}
        <section>
          <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
            What is m-session?
          </h2>
          <p className="mb-4">
            m-session gives your session shape: preparation, intention-setting, guided
            activities drawn from established therapeutic frameworks, and integration
            tools for the days that follow. It works whether you{'\u2019'}re on your own,
            with a partner, or with a trusted sitter.
          </p>
          <p className="mb-4">
            The app doesn{'\u2019'}t tell you what to think or feel. It provides structure
            and lets you lead. You choose which activities to engage with, how long to
            spend with them, and when to move on. The design philosophy is non-directive:
            the app trusts that you know what you need, even when you don{'\u2019'}t know
            it yet.
          </p>
          <p className="mb-4">
            m-session can be used solo, with a sitter, or with a partner. On your own,
            it brings intention and structure to a solo practice. With a sitter, it
            provides a research-informed framework for facilitation, giving someone
            without formal training a grounded structure to work from. With a partner,
            it opens into relationship-focused exercises designed to be done together.
            For serious psychiatric conditions such as PTSD or complex trauma, a
            professional therapeutic setting with trained facilitators is recommended.
          </p>
          <p className="mb-4">
            Every design decision has been made with the altered state in mind. The
            visual language is flat and calm, more like an open notebook than an app
            competing for your attention. Text is kept minimal per screen. Light and
            dark modes each carry a single accent color that is used sparingly to guide
            the eye without overwhelming it, which matters when your pupils are dilated
            and light sensitivity is high. The app runs offline, saves your state
            automatically, and can be closed and reopened at any point without losing
            progress. It{'\u2019'}s designed to feel as stable and undemanding as a surface
            you can set down and pick back up whenever you{'\u2019'}re ready.
          </p>
          <p>
            m-session is a free, open-source project built on the belief that the tools
            for honest self-exploration should be accessible to anyone who wants them. In
            a time when many people feel stuck, disconnected, or unable to access the kind
            of support they need, this is an attempt to close that gap.
          </p>
        </section>

        {/* Why m-session? */}
        <section>
          <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
            Why m-session?
          </h2>
          <p className="mb-4">
            MDMA has been used as a therapeutic tool since the 1970s, but the
            infrastructure around it has always been polarized. On one end, clinical
            settings with trained facilitators, expensive and largely reserved for
            severe psychiatric diagnoses. On the other, recreational use with no
            structure or therapeutic intention. In between is a large and underserved
            middle ground: people who want to work with MDMA intentionally, whether
            solo, with a partner, or with a sitter, but who don{'\u2019'}t have access
            to a clinical program and aren{'\u2019'}t looking for a party. They might be
            working through something specific, or they might simply want to understand
            themselves more honestly. MDMA doesn{'\u2019'}t require a diagnosis to be
            valuable. A private app on your own phone, used on your own terms, opens
            that door to anyone. For some, it might even be the first step toward
            seeking more structured professional help.
          </p>
          <p className="mb-4">
            The app draws on established therapeutic frameworks: Acceptance and
            Commitment Therapy (ACT), Coherence Therapy, Internal Family Systems (IFS),
            Emotionally Focused Therapy (EFT), Focusing, and others. None of this would
            exist without the clinicians who recognized MDMA{'\u2019'}s therapeutic
            potential, the researchers who spent decades fighting to re-legitimize its
            use, and the broader traditions of somatic and contemplative practice that
            these frameworks grew out of. m-session is an attempt to make this work more
            accessible.
          </p>
          <p>
            The project is free and open source, and the module library continues to
            grow. The long-term vision is something closer to an open repository: a
            growing collection of practices, knowledge, and guided experiences around
            MDMA therapy, shaped by the contributions of therapists, researchers,
            developers, and practitioners. The hope is that many more talented people
            will come to the table and help make it the best tool it can be.
          </p>
        </section>

        {/* Who built m-session? */}
        <section>
          <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
            Who built m-session?
          </h2>
          <p className="mb-4">
            I built m-session after a solo MDMA session opened things up for me. It had
            been years since I had touched psychedelics, and the distance made the
            contrast sharp. I could feel how much had quietly calcified: assumptions
            about myself, my relationships, what I thought I already understood. MDMA
            quieted the filters that normally make it so hard to see life for what it is,
            with acceptance and appreciation. It also made me realize how much I was
            leaving to chance.
          </p>
          <p className="mb-4">
            During that session, I found myself wishing for more structure. I was writing
            in a notebook, which is always valuable, but the process felt scattered.
            Random thoughts, half-formed reflections, no sense of arc or progression. I
            wanted a timeline at the very least, something that could keep track of how
            far into the experience I was and suggest what might be worth trying next.
            When I looked for something like that, it didn{'\u2019'}t exist. I had come to
            value certain meditation apps in my daily life, tools that were intelligent
            and well-designed and treated the user as an adult. I wanted something like
            that for MDMA.
          </p>
          <p className="mb-4">
            I have over seven years of experience working in psychology, my own long
            history with these substances, and a background in the creative field.
            m-session grew out of that intersection, working in collaboration with AI
            (Claude Opus 4.5) on research, design, and coding. All therapeutic content
            is reviewed and validated against primary sources. My hope is that m-session
            grows into a true community project, with many contributors, and that it
            becomes genuinely useful for anyone who wants to bring intention and structure
            to their MDMA practice.
          </p>
          <p className="mb-4">
            If you{'\u2019'}re reading this and feel like you can help in any way, please
            do. You can test the app and send feedback, contribute code, or support us
            financially. Since the project is still early, probably the most useful thing
            you can do is just spread the word.
          </p>
          <p className="italic">
            Good luck, I love you.
          </p>
          <p className="text-[var(--color-text-tertiary)] text-xs mt-2">
            — dasloops
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

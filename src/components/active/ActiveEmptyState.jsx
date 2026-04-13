/**
 * ActiveEmptyState Component
 * Welcome page for the Active tab before session intake.
 */

import { useRef } from 'react';
import AsciiMoon from './capabilities/animations/AsciiMoon';
import { useAppStore } from '../../stores/useAppStore';
import { useScrollReveal } from '../../hooks/useScrollReveal';

const principles = [
  { icon: '*', title: 'You are the expert on yourself.', desc: 'No app knows your inner landscape better than you do. We provide the container. You bring the wisdom.' },
  { icon: '~', title: 'Set an intention, then hold it loosely.', desc: 'Come in knowing what you want to explore. But if something else shows up, follow it. The process is smarter than the plan.' },
  { icon: '+', title: 'Growth, not escape.', desc: 'MDMA can feel very good. That\'s not the point. The point is the window of honesty it opens and what you do with it.' },
  { icon: '>', title: 'The session is the beginning.', desc: 'What you discover matters less than what you do with it afterward. Real change happens in the days and weeks that follow, as you integrate what you\'ve learned into how you actually live.' },
  { icon: '[]', title: 'Get out of your own way.', desc: 'Trust the process. If you create the right conditions and set a genuine intention, what needs to come up will come up. You don\'t need to force anything.' },
];

export default function ActiveEmptyState() {
  const setCurrentTab = useAppStore.getState().setCurrentTab;
  const containerRef = useRef(null);
  useScrollReveal(containerRef);

  return (
    <div ref={containerRef} className="flex flex-col items-center px-6 pt-4 pb-4 max-w-xl mx-auto w-full" style={{ textTransform: 'none' }}>

      {/* ── Hero ── */}
      <div className="flex flex-col items-center pb-6 w-full mt-4">
        <h1
          className="rv font-serif text-3xl text-center text-[var(--color-text-primary)]"
          data-rv-hero
          style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
        >
          Begin your journey
        </h1>
        <p className="rv rv-d1 uppercase text-[10px] text-[var(--color-text-tertiary)] text-center tracking-[0.18em] mb-4" data-rv-hero>
          A personal MDMA session assistant
        </p>
        <div className="rv rv-d2" data-rv-hero>
          <AsciiMoon opacity={0.80} />
        </div>
        <p className="rv rv-d3 uppercase text-[10px] text-[var(--color-text-primary)] opacity-65 text-center leading-[2] tracking-[0.06em] max-w-[240px] mt-4" data-rv-hero>
          Structure and support for intentional MDMA experiences. Guided meditations,
          breathwork, parts work, values mapping, and journaling. Organized into a
          session flow that follows your pace and respects wherever you are in
          your process.
        </p>
      </div>

      {/* ── What Gets in the Way ── */}
      <div className="w-full border-t border-[var(--border)] pt-8 pb-8">
        <p className="rv uppercase tracking-[0.18em] text-[10px] text-[var(--accent)] mb-3">Understanding</p>
        <h2
          className="rv rv-d1 font-serif text-xl text-[var(--color-text-primary)] mb-4 normal-case"
          style={{ fontFamily: 'DM Serif Text, serif' }}
        >
          What Gets in the Way
        </h2>
        <div className="rv rv-d2 text-[var(--color-text-secondary)] text-sm leading-relaxed space-y-4">
          <p>
            Most people have a limited ability to be truly honest with themselves. This
            isn't a character flaw. The brain has a threat-detection system that intercepts
            emotionally difficult material before it fully reaches conscious awareness.
            Painful memories, uncomfortable truths about yourself or your relationships,
            grief you set aside because life kept moving: this system suppresses, avoids,
            or reframes that material automatically, and it operates faster than conscious
            thought.
          </p>
          <p>
            This is useful for getting through the day. It's less useful when you want to
            understand yourself more deeply, examine how you show up in your relationships,
            or simply take an honest look at where you are in your life.
          </p>
        </div>
      </div>

      {/* ── What MDMA Changes ── */}
      <div className="w-full border-t border-[var(--border)] pt-8 pb-8">
        <p className="rv uppercase tracking-[0.18em] text-[10px] text-[var(--accent)] mb-3">Insight</p>
        <h2
          className="rv rv-d1 font-serif text-xl text-[var(--color-text-primary)] mb-4 normal-case"
          style={{ fontFamily: 'DM Serif Text, serif' }}
        >
          What MDMA Changes
        </h2>
        <div className="rv rv-d2 text-[var(--color-text-secondary)] text-sm leading-relaxed space-y-4">
          <p>
            MDMA reduces this defensiveness directly. It lowers the reactivity of the
            brain's threat-response system while leaving your thinking clear and intact.
            You stay lucid, coherent, and in control of your experience. What changes is
            your relationship to difficult material: it becomes approachable rather than
            overwhelming.
          </p>
          <p>
            What tends to replace the usual guardedness is a sense of warmth and honesty.
            People report being able to look at themselves and their lives with a kind of
            clear-eyed compassion that is hard to access under ordinary conditions.
            Self-criticism quiets. Difficult feelings can be held without being consumed
            by them. Things you've avoided become things you can actually sit with.
          </p>
          <p>
            The substance invites material forward. It doesn't force it. Sometimes what
            surfaces is exactly what you expected to work on. Sometimes it's something
            you didn't see coming: a forgotten memory, a feeling you didn't know you were
            carrying, a sudden clarity about a relationship or a part of yourself. There
            is no single version of what a session looks like, and you don't need to
            direct the process. Your role is to stay open to what arises and trust that
            what comes up is worth your attention.
          </p>
        </div>
      </div>

      {/* ── The Science ── */}
      <div className="w-full border-t border-[var(--border)] pt-8 pb-8">
        <p className="rv uppercase tracking-[0.18em] text-[10px] text-[var(--accent)] mb-3">Research</p>
        <h2
          className="rv rv-d1 font-serif text-xl text-[var(--color-text-primary)] mb-4 normal-case"
          style={{ fontFamily: 'DM Serif Text, serif' }}
        >
          Our Current Understanding
        </h2>
        <p className="rv rv-d2 text-[var(--color-text-secondary)] text-sm leading-relaxed mb-6">
          Research over the past two decades has identified several mechanisms that work
          together to create the therapeutic window MDMA opens. None of these operate in
          isolation, but understanding them individually can help you make sense of what
          you experience during a session.
        </p>
        <div className="rv rv-d3 space-y-[1px] bg-[var(--border)] border border-[var(--border)]">
          {[
            {
              label: 'Reduced amygdala reactivity',
              body: 'The amygdala is the brain region most associated with detecting and responding to threat. MDMA decreases its activation, particularly in response to negative emotional stimuli. Neuroimaging studies show reduced reactivity to angry and fearful facial expressions, and reduced blood flow to the amygdala correlates with the intensity of MDMA\u2019s subjective effects. This reduced activation may contribute to the diminished defensiveness people experience: with the brain\u2019s threat-detection system quieter, emotionally charged material can surface without triggering the usual protective reactions.',
            },
            {
              label: 'Preserved cognitive lucidity',
              body: 'Unlike classical psychedelics, MDMA maintains ego functioning and perceptual lucidity. You can think clearly, speak coherently, and reflect on your experience while it\u2019s happening. This combination of reduced defensiveness with intact cognition is unusual among psychoactive substances and is central to why MDMA lends itself to therapeutic work.',
            },
            {
              label: 'Increased self-compassion',
              body: 'MDMA consistently reduces self-criticism and increases self-directed warmth. Recent research from phase 3 clinical trials found that increases in self-compassion specifically mediated MDMA\u2019s therapeutic effects on PTSD symptoms, depression, and substance use. In practical terms: you become more able to look at yourself with honesty and kindness at the same time.',
            },
            {
              label: 'Oxytocin surge',
              body: 'MDMA triggers a substantial release of oxytocin, reaching plasma levels up to four times baseline. This effect is unique to MDMA and not observed with LSD or amphetamine. Oxytocin is involved in trust, social bonding, and the encoding of emotional information as safe rather than threatening. This surge is associated with the feelings of openness, connection, and safety that people commonly report, though the precise relationship between oxytocin levels and subjective experience is still being studied.',
            },
            {
              label: 'BDNF and neuroplasticity',
              body: 'MDMA increases expression of brain-derived neurotrophic factor (BDNF), a protein essential for the formation of new neural connections. BDNF plays a central role in learning and memory updating \u2014 the process by which the brain revises old emotional associations. In animal studies, blocking BDNF signaling prevents MDMA from producing lasting changes in learned fear responses. This suggests BDNF-driven neuroplasticity may be one reason why shifts experienced during MDMA sessions can persist well beyond the acute effects of the substance.',
            },
          ].map((item, i) => (
            <div key={i} className="bg-[var(--bg-primary)] px-5 pt-4 pb-5">
              <div className="flex items-center gap-2.5 uppercase tracking-[0.1em] text-[11px] text-[var(--color-text-primary)] font-medium mb-2">
                <span className="inline-block w-[6px] h-[6px] rounded-full border-[1.5px] border-[var(--accent)] shrink-0" />
                {item.label}
              </div>
              <div className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
                {item.body}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── What It Does / Doesn't ── */}
      <div className="w-full border-t border-[var(--border)] pt-8 pb-8">
        <div className="rv grid grid-cols-1 sm:grid-cols-2 gap-[1px] bg-[var(--border)] border border-[var(--border)]">
          <div className="rv rv-d1 bg-[var(--bg-primary)] pt-3 pb-5 px-5">
            <div className="text-base text-[var(--accent)] opacity-70 mb-3">{'>_'}</div>
            <div className="uppercase tracking-[0.1em] text-xs text-[var(--color-text-primary)] mb-3">What This App Does</div>
            <div className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                It holds the structure so you don't have to. When you're in an altered
                state, the last thing you need is to be managing logistics.
              </p>
              <p>
                Guided meditations designed for expanded states — slower, softer, with
                long silences. Breathing exercises. Journaling prompts. Body scans.
                Self-compassion practices. Music timers. Open space when you just need to be.
              </p>
              <p>
                All organized into a session flow that mirrors the natural arc of the
                experience. You decide what you use and what you skip.
              </p>
            </div>
          </div>
          <div className="rv rv-d2 bg-[var(--bg-primary)] pt-3 pb-5 px-5">
            <div className="text-base text-[var(--accent)] opacity-70 mb-3">{'//'}</div>
            <div className="uppercase tracking-[0.1em] text-xs text-[var(--color-text-primary)] mb-3">What It Doesn't Do</div>
            <div className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                It doesn't tell you what to think. It doesn't interpret your experience
                or tell you what it means. It doesn't push you toward any particular
                insight or conclusion.
              </p>
              <p>
                Think of it as a companion that checks in without taking over.
                <em> How are you doing? Need anything? Want to try something
                different?</em> Not a therapist running a session. Not a guru with
                answers. Just thoughtful support for a journey you're leading yourself.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Principles ── */}
      <div className="w-full border-t border-[var(--border)] pt-8 pb-8">
        <p className="rv uppercase tracking-[0.18em] text-[10px] text-[var(--accent)] mb-4">Principles</p>
        <div className="rv rv-d1 grid grid-cols-1 sm:grid-cols-2 gap-[1px] bg-[var(--border)] border border-[var(--border)]">
          {principles.map((p, i) => (
            <div
              key={i}
              className={`bg-[var(--bg-primary)] pt-3 pb-5 px-5${i === principles.length - 1 ? ' sm:col-span-2' : ''}`}
            >
              <div className="text-base text-[var(--accent)] opacity-70 mb-2">{p.icon}</div>
              <div className="uppercase tracking-[0.06em] text-xs text-[var(--color-text-primary)] font-medium mb-2">{p.title}</div>
              <div className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="w-full pt-4 flex flex-col items-center gap-6">
        <blockquote className="rv border-l-2 border-[var(--accent)] pl-4 italic text-[var(--color-text-tertiary)] text-sm leading-relaxed">
          "You might find it of interest in the sense that it allows you to be honest with yourself."
          <footer className="mt-2 not-italic text-xs text-[var(--color-text-tertiary)]">— Sasha Shulgin to Dr. Adam (Leo Zeff)</footer>
        </blockquote>
        <button
          onClick={() => setCurrentTab('home')}
          className="rv rv-d1 uppercase tracking-wider text-xs bg-[var(--color-text-primary)] text-[var(--color-bg)] px-8 py-3 hover:opacity-80 transition-opacity"
        >
          Begin Intake &rarr;
        </button>
        <p className="rv rv-d2 uppercase tracking-wider text-[10px] text-[var(--accent)] text-center max-w-[200px] -mt-3">
          Complete your intake on the Home tab to begin your session.
        </p>
      </div>
    </div>
  );
}

/**
 * ActiveEmptyState Component
 * Redesigned welcome/philosophy page for the Active tab before session intake.
 * Same content as PhilosophyContent but with structured visual layout.
 */

import AsciiMoon from './capabilities/animations/AsciiMoon';
import { useAppStore } from '../../stores/useAppStore';

const principles = [
  { icon: '*', title: 'You are the expert on yourself.', desc: 'No app knows your inner landscape better than you do. We provide the container. You bring the wisdom.' },
  { icon: '~', title: 'Set an intention, then hold it loosely.', desc: 'Come in knowing what you want to explore. But if something else shows up, follow it. The process is smarter than the plan.' },
  { icon: '+', title: 'Growth, not escape.', desc: 'MDMA can feel very good. That\'s not the point. The point is the window of honesty it opens and what you do with it.' },
  { icon: '>', title: 'The session is the beginning.', desc: 'What you discover matters less than what you do with it afterward. Real change happens in the days and weeks that follow, as you integrate what you\'ve learned into how you actually live.' },
  { icon: '[]', title: 'Get out of your own way.', desc: 'Trust the process. If you create the right conditions and set a genuine intention, what needs to come up will come up. You don\'t need to force anything.' },
];

export default function ActiveEmptyState() {
  const setCurrentTab = useAppStore.getState().setCurrentTab;

  return (
    <div className="flex flex-col items-center px-6 pt-4 pb-4 max-w-xl mx-auto w-full" style={{ textTransform: 'none' }}>

      {/* ── Hero ── */}
      <div className="flex flex-col items-center pb-6 w-full mt-4">
        <h1
          className="font-serif text-3xl text-center text-[var(--color-text-primary)]"
          style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
        >
          Begin your journey
        </h1>
        <p className="uppercase text-[10px] text-[var(--color-text-tertiary)] text-center tracking-[0.18em] mb-4">
          A personal MDMA session assistant
        </p>
        <AsciiMoon opacity={0.80} />
        <p className="uppercase text-[10px] text-[var(--color-text-primary)] opacity-65 text-center leading-[2] tracking-[0.06em] max-w-[240px] mt-4">
          Structure and support for intentional MDMA experiences. Guided meditations,
          breathwork, parts work, values mapping, and journaling. Organized into a
          session flow that follows your pace and respects wherever you are in
          your process.
        </p>
      </div>

      {/* ── The Filter ── */}
      <div className="w-full border-t border-[var(--border)] pt-8 pb-8">
        <p className="uppercase tracking-[0.18em] text-[10px] text-[var(--accent)] mb-3">Understanding</p>
        <h2
          className="font-serif text-xl text-[var(--color-text-primary)] mb-4 normal-case"
          style={{ fontFamily: 'DM Serif Text, serif' }}
        >
          The Filter
        </h2>
        <div className="text-[var(--color-text-secondary)] text-sm leading-relaxed space-y-4">
          <p>
            Your mind runs a filter you never asked for. Every thought about yourself,
            every memory, every feeling — it gets intercepted and labeled before you
            can really look at it. <em>Threatening. Shameful. Don't go there.</em>
          </p>
          <p>
            This is why honest self-reflection is hard. Not because you lack courage,
            but because the filter is faster than you are. Challenging material gets
            blocked before it reaches conscious awareness. You don't even know what
            you're not seeing.
          </p>
          <p>
            MDMA softens this filter. The automatic judgment quiets down — and what
            often takes its place is something warmer. You can look at yourself with
            less defensiveness. Hold difficult feelings without drowning in them.
            Be honest about things you've been avoiding, and be kind to yourself
            about what you find.
          </p>
        </div>
      </div>

      {/* ── You Already Know ── */}
      <div className="w-full border-t border-[var(--border)] pt-8 pb-8">
        <p className="uppercase tracking-[0.18em] text-[10px] text-[var(--accent)] mb-3">Insight</p>
        <h2
          className="font-serif text-xl text-[var(--color-text-primary)] mb-4 normal-case"
          style={{ fontFamily: 'DM Serif Text, serif' }}
        >
          You Already Know
        </h2>
        <div className="text-[var(--color-text-secondary)] text-sm leading-relaxed space-y-4">
          <p>
            Here's the thing nobody tells you: <strong className="text-[var(--color-text-primary)]">you already know what you need to look at.</strong>
          </p>
          <p>
            The relationship patterns you keep repeating. The grief you never
            processed. The ways you've been out of alignment with your own values.
            The conversations you've been afraid to have. You know. You've just
            gotten very good at not knowing that you know.
          </p>
          <p>
            MDMA doesn't give you new information. It gives you access to information
            you've been keeping from yourself. The insights don't come from the drug.
            They come from you. The drug just clears the path.
          </p>
        </div>
      </div>

      {/* ── What It Does / Doesn't ── */}
      <div className="w-full border-t border-[var(--border)] pt-8 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1px] bg-[var(--border)] border border-[var(--border)]">
          <div className="bg-[var(--bg-primary)] pt-3 pb-5 px-5">
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
          <div className="bg-[var(--bg-primary)] pt-3 pb-5 px-5">
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
        <p className="uppercase tracking-[0.18em] text-[10px] text-[var(--accent)] mb-4">Principles</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1px] bg-[var(--border)] border border-[var(--border)]">
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
        <blockquote className="border-l-2 border-[var(--accent)] pl-4 italic text-[var(--color-text-tertiary)] text-sm leading-relaxed">
          "You might find it of interest in the sense that it allows you to be honest with yourself."
          <footer className="mt-2 not-italic text-xs text-[var(--color-text-tertiary)]">— Sasha Shulgin to Dr. Adam (Leo Zeff)</footer>
        </blockquote>
        <button
          onClick={() => setCurrentTab('home')}
          className="uppercase tracking-wider text-xs bg-[var(--color-text-primary)] text-[var(--color-bg)] px-8 py-3 hover:opacity-80 transition-opacity"
        >
          Begin Intake &rarr;
        </button>
        <p className="uppercase tracking-wider text-[10px] text-[var(--accent)] text-center max-w-[200px] -mt-3">
          Complete your intake on the Home tab to begin your session.
        </p>
      </div>
    </div>
  );
}

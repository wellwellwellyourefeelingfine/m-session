/**
 * PhilosophyContent Component
 * Core philosophy text - reusable across different views
 */

export default function PhilosophyContent() {
  return (
    <div className="space-y-8 text-[var(--color-text-secondary)]">
      {/* Opening */}
      <section>
        <blockquote className="border-l-2 border-[var(--accent)] pl-4 italic mb-4 text-[var(--color-text-tertiary)]">
          "You might find it of interest in the sense that it allows you to be honest with yourself."
          <footer className="mt-2 not-italic text-xs" style={{ textTransform: 'none' }}>— Sasha Shulgin to Dr. Adam (Leo Zeff)</footer>
        </blockquote>
      </section>

      {/* The Filter */}
      <section>
        <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
          The Filter
        </h2>
        <p className="mb-4">
          Your mind runs a filter you never asked for. Every thought about yourself,
          every memory, every feeling — it gets intercepted and labeled before you
          can really look at it. <em>Threatening. Shameful. Don't go there.</em>
        </p>
        <p className="mb-4">
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
      </section>

      {/* You Already Know */}
      <section>
        <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
          You Already Know
        </h2>
        <p className="mb-4">
          Here's the thing nobody tells you: <strong className="text-[var(--color-text-primary)]">you already know what you need to look at.</strong>
        </p>
        <p className="mb-4">
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
      </section>

      {/* What This App Does */}
      <section>
        <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
          What This App Does
        </h2>
        <p className="mb-4">
          It holds the structure so you don't have to.
        </p>
        <p className="mb-4">
          When you're in an altered state, the last thing you need is to be
          managing logistics. <em>What should I do next? How long has it been?
          Should I journal or meditate?</em> Those questions pull you out of the
          experience. This app handles them for you.
        </p>
        <p className="mb-4">
          It gives you guided meditations designed for expanded states — slower,
          softer, with long silences that let the experience breathe. Breathing
          exercises to settle your nervous system. Journaling prompts that meet
          you where you are. Body scans. Self-compassion practices. Music timers.
          Open space when you just need to be.
        </p>
        <p>
          All of it organized into a session flow that mirrors the natural arc of
          the experience: gentle grounding as things come on, deeper exploration
          at the peak, reflection as things soften. You decide what you use and
          what you skip. The structure serves you, not the other way around.
        </p>
      </section>

      {/* What It Doesn't Do */}
      <section>
        <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
          What It Doesn't Do
        </h2>
        <p className="mb-4">
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
      </section>

      {/* Principles */}
      <section>
        <h2 className="text-lg font-serif mb-4 text-[var(--color-text-primary)]">
          Principles
        </h2>
        <div className="space-y-4">
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">You are the expert on yourself.</p>
            <p>No app knows your inner landscape better than you do. We provide
            the container. You bring the wisdom.</p>
          </div>
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">Set an intention, then hold it loosely.</p>
            <p>Come in knowing what you want to explore. But if something else
            shows up, follow it. The process is smarter than the plan.</p>
          </div>
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">Growth, not escape.</p>
            <p>MDMA can feel very good. That's not the point. The point is the
            window of honesty it opens and what you do with it.</p>
          </div>
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">The session is the beginning.</p>
            <p>What you discover matters less than what you do with it afterward.
            Real change happens in the days and weeks that follow, as you integrate
            what you've learned into how you actually live.</p>
          </div>
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">Get out of your own way.</p>
            <p>Trust the process. If you create the right conditions and set a genuine
            intention, what needs to come up will come up. You don't need to force
            anything.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

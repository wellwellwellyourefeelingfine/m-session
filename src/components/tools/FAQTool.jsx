/**
 * FAQTool Component
 *
 * Frequently asked questions about MDMA use for personal growth
 * and how the app works. Expandable sections for easy scanning.
 * Lives in the Tools tab.
 */

import { useState } from 'react';

// Individual FAQ item
function Question({ q, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[var(--color-border)]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left py-4 flex justify-between items-start gap-4 hover:opacity-70 transition-opacity"
      >
        <span className="text-[var(--color-text-primary)] text-xs uppercase tracking-wider">{q}</span>
        <span className="text-[var(--color-text-tertiary)] flex-shrink-0">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="pb-4 text-sm text-[var(--color-text-secondary)] space-y-3" style={{ textTransform: 'none' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// Section header
function SectionHeader({ children }) {
  return (
    <p className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] pt-6 pb-2">
      {children}
    </p>
  );
}

export default function FAQTool() {
  return (
    <div className="py-6 px-6 max-w-xl mx-auto space-y-2">
      {/* Header */}
      <h3 className="text-sm font-light tracking-wide text-[var(--color-text-primary)] pb-2">
        Frequently Asked Questions
      </h3>

      {/* Understanding the Experience */}
      <SectionHeader>Understanding the Experience</SectionHeader>

      <Question q="What does MDMA actually do?">
        <p>
          Your mind has a filter that runs constantly beneath your awareness. It
          evaluates every thought, memory, and feeling—labeling them as threatening
          or safe, acceptable or shameful. This is why honest self-reflection is
          hard: challenging thoughts get intercepted before you can really look at them.
        </p>
        <p>
          MDMA softens this filter. The automatic negative evaluation quiets down,
          often replaced by something warmer. You can examine parts of yourself that
          would usually feel threatening—not with detached curiosity, but with
          something closer to acceptance, even compassion.
        </p>
        <p>
          The content is still there. The harshness is reduced.
        </p>
      </Question>

      <Question q="How is this different from recreational use?">
        <p>
          The substance is the same. The intention and setting are different.
        </p>
        <p>
          Recreational use typically emphasizes the pleasurable effects—connection,
          euphoria, sensory enhancement—often in social settings with music and activity.
        </p>
        <p>
          Therapeutic use treats the openness as a window for self-work. You're not
          chasing the feeling; you're using it to look honestly at yourself, your
          patterns, your relationships. The setting is calm and private. The goal is
          insight, not escape.
        </p>
        <p>
          MDMA can feel very good. That's not the point here.
        </p>
      </Question>

      <Question q="How long does it last?">
        <p>
          A typical timeline:
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">Come-up:</span> 30–60
          minutes. Effects build gradually, sometimes with brief anxiety or nausea.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">Peak:</span> 2–3 hours.
          Full effects, greatest openness.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">Gentle decline:</span> 1–2
          hours. Effects soften but you're still in an open state.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">Landing:</span> Effects
          mostly resolved by 4–6 hours. Some residual warmth may linger.
        </p>
        <p>
          A booster dose extends this by 1–2 hours but doesn't intensify the peak.
        </p>
      </Question>

      <Question q="What should I expect during the comedown?">
        <p>
          As effects fade, you'll gradually return to your normal state of mind.
          Most people feel tired but peaceful—a kind of gentle landing rather than
          a crash.
        </p>
        <p>
          The next day or two, some people experience low mood, fatigue, or emotional
          sensitivity. This is normal. It's related to temporary changes in brain
          chemistry and typically resolves within a few days. Rest, light exercise,
          good food, and avoiding other substances helps.
        </p>
        <p>
          Many people actually feel better than usual in the days following—more
          open, more connected. Both responses are normal.
        </p>
      </Question>

      <Question q="What if nothing comes up?">
        <p>
          Sometimes sessions are quieter than expected. This doesn't mean it's not
          working. Not every session produces dramatic insights or emotional
          breakthroughs.
        </p>
        <p>
          What often happens is subtler: a felt sense of okayness, a softening toward
          yourself, a shift in perspective that only becomes clear later. Trust that
          if you create the conditions and set a genuine intention, what needs to
          happen is happening—even if it doesn't look the way you expected.
        </p>
        <p>
          The work often continues in integration, not just during the session itself.
        </p>
      </Question>

      <Question q="What if I feel too much?">
        <p>
          If things get intense, remember: you took a substance, it will wear off,
          and you are safe. This experience is temporary.
        </p>
        <p>
          Try changing something in your environment—your position, the lighting,
          the music. Sometimes what feels overwhelming is actually just unfamiliar.
        </p>
        <p>
          The "I need help" tool in this app offers quick reassurance and reminds
          you that you're safe. Breathing slowly, orienting to your surroundings,
          and focusing on simple physical sensations (the weight of your body,
          the texture of a blanket) can help you feel more settled.
        </p>
        <p>
          Intensity usually comes in waves. If you can ride it without fighting, it
          often passes more quickly.
        </p>
      </Question>

      <Question q="Is it normal to feel [physical sensation]?">
        <p>
          Common physical effects include:
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">Jaw tension or teeth grinding</span> —
          Very common. Magnesium supplements beforehand may help. Chewing gum can too,
          though some find it distracting.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">Feeling cold or hot</span> —
          Temperature regulation is affected. Have blankets available, and dress in
          layers you can adjust.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">Nausea during come-up</span> —
          Usually passes within 30 minutes. Ginger tea or candied ginger can help.
          Lying down and breathing slowly often settles it.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">Rapid heartbeat</span> —
          Some increase is normal. If it concerns you, try slow breathing. If it's
          severe or accompanied by chest pain, seek medical attention.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">Difficulty urinating</span> —
          Common and temporary. Don't force it; it will resolve.
        </p>
      </Question>

      {/* Safety & Practical */}
      <SectionHeader>Safety & Practical</SectionHeader>

      <Question q="Is this safe?">
        <p>
          No drug use is without risk. MDMA, used occasionally at reasonable doses
          in a safe setting by healthy people, has a relatively favorable safety
          profile compared to many substances—but "relatively favorable" is not
          "risk-free."
        </p>
        <p>
          The main risks include: overheating (rare in calm home settings),
          cardiovascular strain (relevant if you have heart conditions), neurotoxicity
          from heavy or frequent use, and dangerous interactions with certain
          medications.
        </p>
        <p>
          Testing your substance, staying hydrated (but not over-hydrated), using
          reasonable doses, waiting adequate time between sessions, and avoiding
          contraindicated medications significantly reduces risk.
        </p>
      </Question>

      <Question q="How often can I do this?">
        <p>
          Most harm reduction guidance suggests waiting at least 6–12 weeks between
          sessions. Some recommend longer—every 3–4 months.
        </p>
        <p>
          This isn't arbitrary. MDMA depletes serotonin and your brain needs time
          to recover. Frequent use is associated with reduced effects ("losing the
          magic"), worse comedowns, and potential long-term changes to serotonin
          systems.
        </p>
        <p>
          There's also a psychological case for spacing: integration takes time.
          Insights from one session benefit from weeks of processing before adding
          more material.
        </p>
      </Question>

      <Question q="What about medications?">
        <p>
          Some medications have dangerous interactions with MDMA:
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">SSRIs</span> (Prozac,
          Zoloft, Lexapro, etc.) — Block MDMA's effects and may increase risk of
          serotonin syndrome. Most people taper off SSRIs before MDMA sessions, but
          this should only be done under medical supervision.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">MAOIs</span> — Dangerous
          combination. Risk of serotonin syndrome and hypertensive crisis.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">Lithium</span> — Reports
          of seizures and other serious reactions. Do not combine.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">Tramadol</span> — Increased
          seizure risk.
        </p>
        <p>
          If you take any psychiatric medications, research interactions carefully
          or consult a knowledgeable healthcare provider before proceeding.
        </p>
      </Question>

      <Question q="What if something goes wrong?">
        <p>
          Most difficult experiences during MDMA sessions are psychological, not
          medical—anxiety, difficult emotions, or challenging thoughts. These are
          usually workable with grounding techniques, reassurance, and time.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">Medical emergencies</span> requiring
          immediate help include: loss of consciousness, seizures, extremely high
          body temperature, severe chest pain, or inability to communicate. Call
          emergency services.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">Psychological distress</span> that
          feels unmanageable: tap "I need help" for quick reassurance, check the
          Resources section for support lines like Fireside Project (62-FIRESIDE)
          or TripSit chat. You can also contact a trusted friend.
        </p>
        <p>
          Having a plan before you begin helps you act clearly if you need to.
        </p>
      </Question>

      <Question q="Should I have a sitter?">
        <p>
          A trusted sitter adds a layer of safety, especially for first-time
          experiences or higher doses. They can help with practical needs, provide
          reassurance, and respond if something goes wrong.
        </p>
        <p>
          That said, many people do solo sessions successfully. It's a personal
          choice based on your experience level, the dose, your setting, and your
          comfort with being alone in altered states.
        </p>
        <p>
          If you're solo, let someone know you're having a session (even if you
          don't share details), keep your phone accessible, and know who you'd
          call if you needed support.
        </p>
      </Question>

      {/* The Therapeutic Angle */}
      <SectionHeader>Therapy & Growth</SectionHeader>

      <Question q="Do I need to have trauma to benefit from this?">
        <p>
          No. While MDMA has shown remarkable results for people processing trauma,
          that's not the only use case.
        </p>
        <p>
          MDMA can help anyone who wants to understand themselves more deeply,
          improve their relationships, work through stuck patterns, or reconnect
          with parts of themselves they've lost touch with. You don't need to be
          broken to benefit from honest self-reflection.
        </p>
        <p>
          Sometimes the healthiest people are the ones most committed to continuing
          to grow.
        </p>
      </Question>

      <Question q="How is this different from clinical MDMA therapy?">
        <p>
          Clinical MDMA therapy (like the MAPS protocol) involves trained therapists,
          multiple preparatory sessions, structured therapeutic frameworks, and
          extensive integration support. It's designed for treating specific
          conditions like PTSD.
        </p>
        <p>
          This app is designed for personal growth and self-exploration—not clinical
          treatment. We don't diagnose, prescribe, or provide therapy. We offer
          structure and support for your own self-directed journey.
        </p>
        <p>
          If you're dealing with serious trauma, PTSD, or significant mental health
          challenges, working with a qualified professional is likely to be more
          appropriate than a self-guided approach.
        </p>
      </Question>

      <Question q="What's integration and why does it matter?">
        <p>
          Integration is the process of making sense of your experience and
          translating insights into lasting change. It's what happens in the days,
          weeks, and months after a session.
        </p>
        <p>
          An insight during a session is just the beginning. Real change comes from
          reflecting on what you learned, having conversations, adjusting how you
          live, and returning to the material over time.
        </p>
        <p>
          Without integration, even profound experiences can fade without impact.
          With it, even subtle sessions can catalyze meaningful shifts.
        </p>
        <p>
          We recommend journaling, talking to trusted people, and revisiting your
          session notes in the days that follow. Some people also work with
          integration coaches or therapists.
        </p>
      </Question>

      {/* Using the App */}
      <SectionHeader>Using the App</SectionHeader>

      <Question q="How are the session phases structured?">
        <p>
          Your session is organized into three phases that mirror the natural arc
          of an MDMA experience:
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">Come-up</span> —
          The first 30–60 minutes as effects build. Modules here focus on
          grounding, breathing, and settling into the experience. The app checks
          in with you during this time to see how you're feeling.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">Peak</span> —
          The heart of the experience, typically 2–3 hours. This is when you're
          most open. Modules here support deeper exploration: meditation,
          journaling, music, or simply being present.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">Integration</span> —
          As effects soften, the focus shifts to reflection and gentle closure.
          Modules here help you begin processing what arose and prepare for
          returning to ordinary consciousness.
        </p>
        <p>
          This structure provides a container, not a cage. You control when you
          transition between phases, and you can add, remove, or skip modules
          at any point.
        </p>
      </Question>

      <Question q="How do I customize my session?">
        <p>
          After completing the intake questionnaire, you'll see a timeline of
          suggested modules based on your responses. This is a starting point,
          not a prescription.
        </p>
        <p>
          You can click the edit button to change the ordering of modules within
          each phase, as well as remove them. Use the + button in each phase to
          add modules from the library.
        </p>
        <p>
          During the session, you can skip any module, extend time on something
          that's working, or add new modules as needed. The structure serves you,
          not the other way around.
        </p>
      </Question>

      <Question q="What if I want to skip something or change the plan?">
        <p>
          Most modules can be skipped with a skip button. A few pre-session
          steps (like the substance testing checklist) require completion for
          safety reasons.
        </p>
        <p>
          You might find that what you planned doesn't match what you actually
          need in the moment. Maybe you wanted to journal but your body wants to
          move. Maybe you planned deep introspection but you just need to rest.
          That's fine—that's the process working.
        </p>
        <p>
          Follow what actually arises, even if it surprises you.
        </p>
      </Question>

      <Question q="Can I use this with a sitter?">
        <p>
          Yes. A sitter can help guide you through the experience, facilitating
          the app's modules while adding their own intuition and presence. They
          can read prompts aloud, help you navigate between activities, and
          provide grounding support when needed.
        </p>
        <p>
          The app provides structure; the sitter provides human connection. Both
          can complement each other well.
        </p>
      </Question>

      {/* Privacy & Technical */}
      <SectionHeader>Privacy & Technical</SectionHeader>

      <Question q="Is my data private?">
        <p>
          Yes. Everything is stored locally on your device using your browser's
          local storage. We don't have servers, accounts, or any way to see your
          data. Your intake responses, journal entries, and session history never
          leave your device.
        </p>
        <p>
          After completing a session, you can download all your session data as
          a file—useful for keeping a personal record or sharing with a therapist
          or integration coach.
        </p>
        <p>
          This is by design. What you explore in a session is yours alone.
        </p>
      </Question>

      <Question q="Do I need internet during my session?">
        <p>
          No. This is a Progressive Web App (PWA), which means it can work fully
          offline once loaded. The app itself downloads on your first visit, and
          guided meditation audio is downloaded automatically when you finalize
          your session timeline after completing the intake form.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">When to go offline:</span> Complete
          the intake questionnaire and review your session timeline while you
          have an internet connection. Once your timeline is set, all audio for
          your scheduled modules is cached to your device. You can then safely
          go into airplane mode or disconnect for the duration of your session.
        </p>
        <p>
          If you add a meditation module to your timeline later (via the timeline
          editor), its audio will download at that point — so make any changes
          while you still have a connection.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">For the best experience on iPhone:</span> Open
          the app in Safari, tap the Share button, then select "Add to Home Screen."
          This creates an app icon that launches the full experience without browser
          UI—and ensures it works offline.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">On Android:</span> Chrome
          will typically prompt you to install the app automatically. You can also
          use the menu and select "Install app" or "Add to Home screen."
        </p>
        <p>
          We recommend setting this up before your session so you're not dependent
          on internet connectivity during the experience.
        </p>
      </Question>

      <Question q="Can I access my past sessions?">
        <p>
          Yes. Your journal entries and session history are saved locally on your
          device. You can review past sessions, reread what you wrote, and track
          your experiences over time.
        </p>
        <p>
          We encourage returning to your notes during integration—often you'll
          notice things you missed or find new meaning in what you wrote.
        </p>
      </Question>

      <Question q="How does the AI assistant work?">
        <p>
          The AI assistant is an entirely optional feature—the app works fully
          without it. If you'd like conversational support during your session,
          you can enable it by entering your own API key from Anthropic, OpenAI,
          or OpenRouter.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">Privacy controls:</span> In
          the AI settings panel, you can choose exactly what session information
          the AI can see. Toggle on or off: session status, time since ingestion,
          dosage, current activity, progress, journal entries, and your intention.
          Disable anything you'd prefer to keep private.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">How it works:</span> Your
          API key is encrypted and stored locally on your device. You can set it
          to auto-expire after a period of your choosing. Conversations happen
          directly between your device and the AI provider—we never see them.
        </p>
        <p>
          <span className="text-[var(--color-text-primary)]">Cost:</span> You pay
          the AI provider directly based on usage. We recommend setting a spending
          limit on your API key through your provider's dashboard.
        </p>
      </Question>

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  );
}

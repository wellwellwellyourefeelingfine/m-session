/**
 * HowToUseTool Component
 * Step-by-step guide for how to use the app.
 */

const steps = [
  {
    title: 'Add to Home Screen',
    body: 'This is a PWA (Progressive Web App) and works best from your home screen. Tap the share icon (\u23CE), then select "Add to Home Screen."',
  },
  {
    title: 'Complete the Intake Form',
    body: 'At least a few days before your session, answer the intake questions to generate a custom timeline. These will help clarify your intentions and what you\u2019ll need.',
  },
  {
    title: 'Customize Your Timeline',
    body: 'Add, remove, and rearrange activities within your session timeline. Some activities are phase-specific. You can also add pre-session activities and preview any module before your session.',
  },
  {
    title: 'Prepare for Your Session',
    body: 'In the days before, follow the recommendations from your intake form. Gather supplies \u2014 journal, pen, blanket, light snacks, water, headphones or a speaker. Schedule adequate time in a safe space. Arrange a trip sitter or let someone trusted know your plans. Explore the Resources tab for further reading.',
  },
  {
    title: 'Begin the Session',
    body: 'When you\u2019re ready, tap "Begin Session" at the bottom of your timeline on the Home tab. The intro will guide you through safety checks and reminders, including when to take your substance. Don\u2019t take it beforehand.',
  },
  {
    title: 'Enjoy the Session',
    body: 'Don\u2019t worry about following your timeline exactly. The app is flexible \u2014 complete, skip, add, or remove activities as you go. At minimum, it tracks your time and dosage.',
  },
  {
    title: 'Rest and Recover',
    body: 'Once your session is complete, take time to rest.',
  },
  {
    title: 'Follow-Up',
    body: 'Completing a session unlocks a follow-up timeline with integration activities. Some are time-locked to 8, 12, 24, or 48 hours after your session. Others are connected to specific activities you completed and only appear if you did them. You can customize this timeline and export your session data from Settings.',
  },
  {
    title: 'Integrate',
    body: 'Share your experience with someone you trust. If you need further support, consider a professional therapist. Communities like r/MDMAtherapy can also be helpful.',
  },
];

export default function HowToUseTool() {
  return (
    <div className="py-6 px-4 max-w-xl mx-auto">
      <h3 className="text-xs tracking-wider text-[var(--color-text-tertiary)] mb-8">
        How to Use This App
      </h3>

      <div className="space-y-6">
        {steps.map((step, i) => (
          <div key={i}>
            <div className="flex items-baseline gap-2 mb-1 -ml-1">
              <span className="text-xl font-serif text-[var(--accent)] flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-[var(--accent)]">-</span>
              <h4 className="text-base font-serif text-[var(--color-text-primary)] leading-snug">
                {step.title}
              </h4>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {step.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

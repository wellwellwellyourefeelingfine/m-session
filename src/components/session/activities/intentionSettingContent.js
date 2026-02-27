/**
 * Intention Setting Activity Content
 * Step definitions, self-inquiry options, writing stems, and display text
 * for the pre-session intention-setting flow.
 *
 * 13 step indices (0–12), but 12 user-facing pages.
 * Step 8 is the moon transition (auto-advancing, not a visible page).
 */

// User-facing step count (excludes moon transition) — for progress bar
export const PROGRESS_STEPS = 12;

// Self-inquiry options (Page 4 — Territory)
export const TERRITORY_OPTIONS = [
  { value: 'relationship', label: 'A relationship' },
  { value: 'avoidance', label: "Something I've been avoiding" },
  { value: 'feeling', label: "A feeling I can't shake" },
  { value: 'self-relation', label: 'How I relate to myself' },
  { value: 'unsure', label: "I'm not sure yet" },
];

// Self-inquiry options (Page 5 — Feeling)
export const FEELING_OPTIONS = [
  { value: 'sadness', label: 'Sadness' },
  { value: 'frustration', label: 'Frustration' },
  { value: 'confusion', label: 'Confusion' },
  { value: 'longing', label: 'Longing' },
  { value: 'fear', label: 'Fear' },
  { value: 'numbness', label: 'Numbness' },
  { value: 'unnamed', label: "Something I can't name" },
];

// Writing stems (Page 8)
export const STEM_INPUTS = [
  { prefix: 'Teach me', placeholder: 'Teach me to...' },
  { prefix: 'Show me', placeholder: 'Show me what...' },
  { prefix: 'Help me', placeholder: 'Help me...' },
];

/**
 * Get welcome page content (conditional on existing intention)
 */
export function getWelcomeContent(hasExistingIntention) {
  return {
    title: 'Refine Your Intention',
    body: hasExistingIntention
      ? "During your intake, you wrote an initial intention for your session. This activity is here to help you sit with it, examine it, and refine it if you'd like."
      : "You haven't written an intention for your session yet. That's perfectly fine. This activity will help you find one.",
    bodySecondary: "There's no wrong answer here. An intention is simply a direction you want to face.",
  };
}

/**
 * Step definitions
 * Types: 'welcome', 'text', 'meditationOffer', 'selection', 'writingWarmup',
 *        'moonTransition', 'intention', 'reflection', 'closing'
 */
export const INTENTION_STEPS = [
  // Step 0 — Welcome / Framing
  {
    id: 'welcome',
    type: 'welcome',
    // Content is dynamic — use getWelcomeContent()
  },

  // Step 1 — Intention vs. Expectation (education)
  {
    id: 'intention-vs-expectation',
    type: 'text',
    content: {
      title: 'Intention, Not Expectation',
      body: "An intention is a direction you want to face. It's not a destination you're demanding to arrive at.",
      bodySecondary: "An expectation tries to control the outcome. An intention stays open to how it unfolds.",
      example: {
        expectation: "I will finally understand why I'm anxious and fix it.",
        intention: "I want to be open to learning what's beneath my anxiety.",
      },
      footer: "The difference is subtle but important. Intentions leave room for the session to surprise you.",
    },
  },

  // Step 2 — Meditation Offer
  {
    id: 'meditation-offer',
    type: 'meditationOffer',
    content: {
      title: 'Slow Down First?',
      body: "Before you begin working on your intention, you might find it helpful to settle in.",
      bodySecondary: "A short grounding meditation can help you move from thinking to feeling, which is where good intentions tend to live.",
      meditationLabel: 'Basic Grounding',
      meditationDuration: '~5 minutes',
      meditationButton: 'Do the Meditation',
      skipButton: 'Continue Without',
    },
  },

  // Step 3 — Self-Inquiry: Territory
  {
    id: 'inquiry-territory',
    type: 'selection',
    content: {
      title: "What's Alive Right Now?",
      body: "Without overthinking it, what area of your life feels most present or pressing right now?",
      bodySecondary: "Tap what resonates, or just sit with the question and continue.",
      optionsKey: 'territory',
    },
  },

  // Step 4 — Self-Inquiry: Feeling
  {
    id: 'inquiry-feeling',
    type: 'selection',
    content: {
      title: 'What Comes Up?',
      body: "When you think about that, what feeling shows up? Not what you think about it, but what you feel.",
      bodySecondary: "Again, just tap what's closest. There's no right answer.",
      optionsKey: 'feeling',
    },
  },

  // Step 5 — Self-Inquiry: One Thing
  {
    id: 'inquiry-one-thing',
    type: 'text',
    content: {
      title: 'One Thing',
      body: "If this session could help you with just one thing, what would it be?",
      bodySecondary: "You don't need to write it down yet. Just let the question sit for a moment.",
    },
  },

  // Step 6 — Teach Me / Show Me / Help Me (education)
  {
    id: 'stems-education',
    type: 'text',
    content: {
      title: 'A Starting Point',
      body: "Many experienced facilitators suggest beginning an intention with a simple request.",
      bodySecondary: 'Phrases like "Teach me," "Show me," or "Help me" put you in a posture of openness rather than control. They frame the session as a conversation, not a demand.',
      footer: "On the next page, you'll have a chance to try this out.",
      stems: ['"Teach me..."', '"Show me..."', '"Help me..."'],
    },
  },

  // Step 7 — Teach Me / Show Me / Help Me (interactive)
  {
    id: 'stems-interactive',
    type: 'writingWarmup',
    content: {
      title: 'Try It Out',
      body: "Complete whichever of these feel natural. You don't need to fill in all three.",
      footer: "These are just warm-ups. Your actual intention comes next.",
    },
  },

  // Step 8 — Moon Transition (auto-advancing, not a user-facing page)
  {
    id: 'moon-transition',
    type: 'moonTransition',
  },

  // Step 9 — Write Your Intention
  {
    id: 'write-intention',
    type: 'intention',
    content: {
      title: 'My Intention',
      bodyNoExisting: "What do you want to explore, understand, or open yourself to?",
      placeholder: 'Write your intention here...',
    },
  },

  // Step 10 — Reflection: Feel Into It
  {
    id: 'reflection-feel',
    type: 'reflection',
    content: {
      title: 'Feel Into It',
      body: "Read your intention back to yourself, slowly.",
      bodySecondary: "Does it land in your chest, or just in your head? A good intention usually carries some feeling behind it. Not just logic.",
      bodyNoIntention: "If you wrote your intention in a physical journal, take a moment to read it back to yourself now.",
      editPrompt: 'Want to adjust it?',
      editButton: 'Edit Intention',
    },
  },

  // Step 11 — Reflection: What's Beneath It
  {
    id: 'reflection-beneath',
    type: 'reflection',
    content: {
      title: "What's Beneath It?",
      body: "Sometimes the first thing we write is the surface layer. The real intention might live one level deeper.",
      bodySecondary: 'Does your intention move you toward something you want? Or away from something you want to escape? Both are valid starting points, but "toward" tends to serve better during a session.',
      bodyNoIntention: "If something deeper is emerging, let yourself sit with it.",
      editButton: 'Revise Intention',
    },
  },

  // Step 12 — Closing: Hold It Lightly
  {
    id: 'closing',
    type: 'closing',
    content: {
      title: 'Hold It Lightly',
      body: "You've done the work of setting your intention. Now the most important thing is to hold it lightly.",
      bodySecondary: "MDMA sessions often go somewhere you didn't predict. The deepest experiences tend to follow their own path, not the one your mind mapped out in advance.",
      bodyTertiary: "Trust that your intention has been heard. When the session begins, your only job is to stay present with whatever comes.",
    },
  },
];

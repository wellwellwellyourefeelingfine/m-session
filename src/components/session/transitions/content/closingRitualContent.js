/**
 * Closing Ritual Content
 * Step definitions for the session closing ritual (8 steps)
 */

export const CLOSING_RITUAL_STEPS = [
  {
    id: 'honoring',
    content: {
      label: 'Closing',
      title: 'Honoring This Experience',
      body: "You've moved through something meaningful today.",
      bodySecondary: "Before we close, let's take a few moments to honor what you experienced and create a bridge to the days ahead.",
    },
  },
  {
    id: 'self-gratitude',
    content: {
      label: 'Gratitude',
      title: 'One Thing About Yourself',
      body: "Gratitude is easier when it's specific.",
      instruction: "Right now, in this moment—what is one thing about yourself you're grateful for?",
      placeholder: "One thing about myself I appreciate...",
      footer: "This doesn't have to be grand. It can be small. Something true.",
      captureField: 'selfGratitude',
      isTextarea: true,
    },
  },
  {
    id: 'future-message',
    content: {
      label: 'Future Self',
      title: 'A Message Forward',
      body: "Imagine yourself one week from now. You're back in ordinary life—the demands, the routines, the noise.",
      instruction: "What do you want that version of you to remember from today?",
      placeholder: "What I want to remember...",
      footer: "Write as if you're leaving a note for yourself to find.",
      captureField: 'futureMessage',
      isTextarea: true,
    },
  },
  {
    id: 'commitment',
    content: {
      label: 'Commitment',
      title: 'One Thing Different',
      body: "Integration happens through action—small, specific actions.",
      instruction: "As you return to your life, is there one thing you want to do differently? Not a whole life change. Just one thing.",
      placeholder: "One thing I want to do differently...",
      captureField: 'commitment',
      isTextarea: true,
      examples: [
        "Pause before reacting when I feel triggered",
        "Reach out to [person] this week",
        "Spend ten minutes each morning in stillness",
        "Stop saying yes to things I don't want to do",
        "Tell someone what I'm actually feeling",
      ],
    },
  },
  {
    id: 'complete',
    content: {
      label: 'Complete',
      title: 'This Session Is Complete',
      body: "What you experienced today is part of you now. It will continue to unfold in ways you can't predict.",
      bodySecondary: "The work now isn't to hold on tightly—it's to let what you've learned settle into you, to notice how it wants to change you in the days ahead.",
      bodyTertiary: "Rest well. Drink water. Eat something nourishing. Be gentle with yourself tonight.",
      isComplete: true,
    },
  },
  {
    id: 'before-you-go',
    content: {
      label: 'Practical',
      title: 'Before You Go',
      body: "A few things before we close.",
      isBeforeYouGo: true,
      dataSection: {
        title: 'Your Data',
        body: "This app stores everything locally on your device. Your journal entries, session notes, and responses aren't backed up anywhere else.",
        instruction: "We recommend saving a copy of what you wrote today.",
        buttonLabel: 'Download Session Data',
      },
    },
  },
  {
    id: 'integration-time',
    content: {
      label: 'Integration',
      title: 'Integration Takes Time',
      body: "Integration doesn't happen in a single day. The insights from today will continue to clarify over the coming days—sometimes in unexpected moments.",
      bodySecondary: "We encourage you to return to this app tomorrow or the day after. There's a short follow-up session designed to help you process what you experienced.",
      footer: "The follow-up session will be available on your home screen 24 hours after you close this session.",
      isIntegrationTime: true,
    },
  },
  {
    id: 'closing',
    content: {
      label: 'Complete',
      title: 'Take Care',
      body: "We recommend talking about your experience with someone you trust. Sharing what you went through can deepen your understanding and help the insights settle.",
      bodySecondary: "Follow-up sessions will be available on your home screen to help you continue integrating over the coming days.",
      bodyTertiary: "We'll be here when you're ready to return.",
      isClosing: true,
    },
  },
];

// Post-close animation content
export const POST_CLOSE_CONTENT = {
  text: 'Take care of yourself.',
};

// Closing check-in modal content (triggers closing ritual)
export const CLOSING_CHECKIN_CONTENT = {
  title: 'Ready to Close Your Session?',
  body: "You've completed your scheduled activities. Would you like to begin the closing ritual?",
  bodySecondary: "The closing ritual is a gentle way to honor what you experienced and create a bridge to the days ahead.",
  beginButton: 'Begin Closing Ritual',
  stayButton: 'Not yet, stay here',
};

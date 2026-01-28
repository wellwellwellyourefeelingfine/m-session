/**
 * Integration Transition Content
 * Step definitions and focus mapping for the peak → integration transition
 */

// Map intake focus values to human-readable labels
export const FOCUS_LABELS = {
  'self-understanding': 'Self-understanding and personal insight',
  'healing': 'Emotional healing',
  'relationship': 'A specific relationship in your life',
  'creativity': 'Creative or existential exploration',
  'open': 'General openness',
  // Additional focus options for when user changes focus
  'processing': 'Processing something you\'ve been carrying',
  'reconnecting': 'Reconnecting with yourself',
};

// Short labels for display
export const FOCUS_LABELS_SHORT = {
  'self-understanding': 'Self-understanding',
  'healing': 'Emotional healing',
  'relationship': 'Relationship exploration',
  'creativity': 'Creativity & insight',
  'open': 'Open exploration',
  'processing': 'Processing & releasing',
  'reconnecting': 'Reconnecting with self',
};

// Focus options for when user wants to change
export const FOCUS_OPTIONS = [
  { value: 'self-understanding', label: 'Understanding myself more deeply' },
  { value: 'relationship', label: 'A relationship in my life' },
  { value: 'processing', label: 'Processing something I\'ve been carrying' },
  { value: 'reconnecting', label: 'Reconnecting with a part of myself' },
  { value: 'creativity', label: 'Something creative or existential' },
  { value: 'open', label: 'I want to stay open' },
];

// Relationship types (reused from intake)
export const RELATIONSHIP_TYPES = [
  { value: 'romantic-current', label: 'Romantic partner (current)' },
  { value: 'romantic-past', label: 'Romantic partner (past)' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'friend', label: 'Friend' },
  { value: 'myself', label: 'Myself' },
  { value: 'passed', label: 'Someone who has passed' },
  { value: 'other', label: 'Other' },
];

export const INTEGRATION_TRANSITION_STEPS = [
  {
    id: 'acknowledgment',
    content: {
      label: 'Transition',
      title: 'The Peak Is Softening',
      body: "The intensity is beginning to ease, but the openness remains.",
      bodySecondary: "This is a valuable window—you still have access to what you experienced, and now you have the clarity to reflect on it.",
    },
  },
  {
    id: 'intention-checkin',
    content: {
      label: 'Intention',
      title: 'Return to Your Intention',
      body: "Before your session, you set an intention:",
      bodyAfterIntention: "Has anything shifted? Would you like to add to what you wrote?",
      isIntentionCheckIn: true,
    },
  },
  {
    id: 'focus-confirmation',
    content: {
      label: 'Focus',
      title: 'Your Focus',
      body: "When you began, you said you were drawn to this session for:",
      bodyAfterFocus: "Does this still feel true? Or did something else become more important?",
      isFocusConfirmation: true,
    },
  },
  {
    id: 'focus-edit',
    content: {
      label: 'Focus',
      title: 'What Came Into Focus?',
      body: "That's completely normal. Sessions often reveal what actually needs attention.",
      instruction: "What feels most important now?",
      isFocusEdit: true,
      hidesMoon: true,
    },
  },
  {
    id: 'relationship-type',
    content: {
      label: 'Focus',
      title: 'Who Is It?',
      body: "Who is the relationship with?",
      isRelationshipType: true,
      hidesMoon: true,
    },
  },
  {
    id: 'bridge',
    content: {
      label: 'Reflection',
      title: 'A Moment of Reflection',
      isBridge: true,
      // Text varies by focus - see getBridgeText()
    },
  },
  {
    id: 'tailored-activity',
    content: {
      label: 'Activity',
      isTailoredActivity: true,
      // Renders based on focus
    },
  },
  {
    id: 'hydration',
    content: {
      label: 'Care',
      title: 'Nourish Yourself',
      body: "Take a moment to drink some water. If you feel ready, have a small snack.",
      bodySecondary: "Your body has been working hard. Give it what it needs.",
      isHydration: true,
    },
  },
  {
    id: 'ready',
    content: {
      label: 'Ready',
      title: 'Enter Integration',
      body: "The integration phase is about letting things settle.",
      bodySecondary: "There may be modules ahead, or you may simply want open space.",
      bodyTertiary: "Follow what feels right.",
      isReady: true,
    },
  },
];

/**
 * Get bridge text based on focus
 * This introduces the tailored activity option with passive, open therapeutic language
 */
export function getBridgeText(focus) {
  const bridgeTexts = {
    relationship: {
      body: "You came to this session with a relationship on your mind.",
      bodySecondary:
        "One thing that can help is writing to that person—not to send, just to clarify what's true for you.",
      question: "Would you like to try this?",
      yesLabel: "Yes, I'd like to write",
      noLabel: "No, continue without",
    },
    'self-understanding': {
      body: "You came to this session wanting to understand yourself more deeply.",
      bodySecondary:
        "One way to work with what's here is to let different parts of yourself speak—a kind of inner dialogue.",
      question: "Would you like to try this?",
      yesLabel: "Yes, I'd like to try this",
      noLabel: "No, continue without",
    },
    processing: {
      body: "You came to this session carrying something you wanted to process.",
      bodySecondary:
        "One way to work with what's here is to notice what you're ready to let go of—and what you want to keep.",
      question: "Would you like to try this?",
      yesLabel: "Yes, I'd like to explore",
      noLabel: "No, continue without",
    },
    healing: {
      body: "You came to this session carrying something you wanted to process.",
      bodySecondary:
        "One way to work with what's here is to notice what you're ready to let go of—and what you want to keep.",
      question: "Would you like to try this?",
      yesLabel: "Yes, I'd like to explore",
      noLabel: "No, continue without",
    },
    reconnecting: {
      body: "You came to this session wanting to reconnect with yourself.",
      bodySecondary:
        "One way to work with what's here is to reclaim something you've lost touch with—a feeling, a quality, a part of who you are.",
      question: "Would you like to try this?",
      yesLabel: "Yes, I'd like to try this",
      noLabel: "No, continue without",
    },
    creativity: {
      body: "You came to this session open to deeper questions.",
      bodySecondary:
        "One way to work with what's here is to sit with what matters most—vision, meaning, mystery.",
      question: "Would you like to try this?",
      yesLabel: "Yes, I'd like to explore",
      noLabel: "No, continue without",
    },
    open: {
      body: "You came to this session without a fixed agenda.",
      bodySecondary:
        "One way to work with what's here is simply to notice what stood out, what surprised you, and what you've been shown.",
      question: "Would you like to try this?",
      yesLabel: "Yes, I'd like to reflect",
      noLabel: "No, continue without",
    },
  };

  return bridgeTexts[focus] || bridgeTexts.open;
}

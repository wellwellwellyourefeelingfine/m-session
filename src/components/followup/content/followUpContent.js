/**
 * Follow-Up Session Content
 * Content definitions for the three time-locked follow-up modules
 */

// ============================================
// MODULE DEFINITIONS
// ============================================

export const FOLLOW_UP_MODULES = {
  checkIn: {
    id: 'checkIn',
    title: 'Check-In',
    description: 'A brief check-in to see how you\'re feeling after your session.',
    lockedDescription: 'This module will be available 24 hours after your session ended, giving your mind and body time to rest.',
    duration: '3-5 minutes',
    unlockHours: 24,
  },
  revisit: {
    id: 'revisit',
    title: 'Revisit',
    description: 'Revisit what you wrote during your session with fresh eyes.',
    lockedDescription: 'This module will be available 24 hours after your session ended.',
    duration: '5-10 minutes',
    unlockHours: 24,
  },
  integration: {
    id: 'integration',
    title: 'Integration Reflection',
    description: 'A deeper reflection on how integration is unfolding.',
    lockedDescription: 'This module will be available 48 hours after your session ended.',
    duration: '5-10 minutes',
    unlockHours: 48,
  },
};

// ============================================
// CHECK-IN MODULE CONTENT
// ============================================

export const CHECK_IN_FEELINGS = [
  { value: 'settled', label: 'Settled and clear' },
  { value: 'processing', label: 'Still processing' },
  { value: 'low', label: 'A bit low or flat' },
  { value: 'tender', label: 'Tender but okay' },
  { value: 'energized', label: 'Energized' },
  { value: 'mixed', label: 'Mixed or uncertain' },
];

export const CHECK_IN_RESPONSES = {
  settled: {
    text: 'Good. Sometimes clarity continues to build in the days after.',
  },
  energized: {
    text: 'Good. Sometimes clarity continues to build in the days after.',
  },
  processing: {
    text: "That's completely normal. Integration often takes several days. Be patient with yourself.",
  },
  mixed: {
    text: "That's completely normal. Integration often takes several days. Be patient with yourself.",
  },
  low: {
    text: "Some people experience a dip in mood the day or two after MDMA. This is a normal neurochemical adjustment and typically passes within a few days.",
    textSecondary: "Be gentle with yourself\u2014rest, eat well, and reach out to someone you trust if you need support.",
    showSupport: true,
  },
  tender: {
    text: 'Tenderness is a sign that something real was touched. Take care of yourself today.',
  },
};

// Body awareness options for the somatic check-in step
export const BODY_FEELINGS = [
  { value: 'relaxed', label: 'Relaxed or light' },
  { value: 'heavy', label: 'Heavy or tired' },
  { value: 'tense', label: 'Tense or restless' },
  { value: 'normal', label: 'About the same as usual' },
];

export const BODY_RESPONSES = {
  relaxed: {
    text: 'That openness can linger. Let it.',
  },
  heavy: {
    text: "That's common the day after. Your body did a lot of work. Rest if you can.",
  },
  tense: {
    text: "Sometimes the body holds what the mind hasn't fully processed yet. Movement, stretching, or a warm bath can help.",
  },
  normal: {
    text: "Good. Everyone's body responds differently.",
  },
};

export const CHECK_IN_STEPS = [
  {
    id: 'feeling',
    content: {
      label: 'Follow-Up',
      title: 'How Are You?',
      body: "It's been about a day since your session. Take a moment to check in with yourself.",
      instruction: 'How are you feeling?',
    },
  },
  {
    id: 'response',
    content: {
      label: 'Follow-Up',
      // Title and body are dynamic based on feeling
    },
  },
  {
    id: 'body',
    content: {
      label: 'Follow-Up',
      title: 'Your Body',
      body: 'MDMA opens the body as much as the mind. How does your body feel today?',
    },
  },
  {
    id: 'note',
    content: {
      label: 'Follow-Up',
      title: 'Optional Note',
      body: 'Is there anything you want to note about how you\'re feeling right now?',
      placeholder: 'Write if you\'d like...',
    },
  },
  {
    id: 'complete',
    content: {
      label: 'Complete',
      body: 'Thank you for checking in.',
    },
  },
];

// ============================================
// REVISIT MODULE CONTENT
// ============================================

// Contextual intro text based on check-in feeling
export const REVISIT_FEELING_CONTEXT = {
  low: "You mentioned you\u2019ve been feeling a bit low. Be gentle with yourself as you revisit these words\u2014they came from a different state of awareness.",
  tender: "You mentioned you\u2019ve been feeling tender. Be gentle with yourself as you revisit these words\u2014they came from a different state of awareness.",
  settled: "You mentioned feeling settled\u2014a good place to revisit what came up during your session.",
  energized: "You mentioned feeling energized\u2014a good place to revisit what came up during your session.",
  processing: "You mentioned you\u2019re still processing. That\u2019s a fine place to be. Let\u2019s revisit what came up.",
  mixed: "You mentioned feeling mixed. That\u2019s okay. Let\u2019s revisit what came up and see what lands differently now.",
};

export const REVISIT_STEPS = [
  {
    id: 'intro',
    content: {
      label: 'Revisit',
      title: 'What You Wrote',
      body: "During your session, you wrote some things down. Let's revisit them with fresh eyes.",
    },
  },
  {
    id: 'display',
    content: {
      label: 'Revisit',
      // Content is dynamically pulled from session data
    },
  },
  {
    id: 'reflection',
    content: {
      label: 'Revisit',
      title: 'Reflection',
      body: "Reading this now, a day later\u2014what stands out? Has anything shifted or become clearer?",
      placeholder: 'What I notice now...',
    },
  },
  {
    id: 'carry-forward',
    content: {
      label: 'Revisit',
      body: 'Is there a single line, phrase, or feeling you want to carry forward from this?',
      placeholder: 'Something to carry forward...',
    },
  },
  {
    id: 'complete',
    content: {
      label: 'Complete',
      body: 'Take what resonates. Let go of what doesn\'t.',
    },
  },
];

// ============================================
// INTEGRATION MODULE CONTENT
// ============================================

export const COMMITMENT_STATUSES = [
  { value: 'following', label: "I've been following through" },
  { value: 'trying', label: "I've been trying, with mixed results" },
  { value: 'not-started', label: "I haven't started yet" },
  { value: 'reconsidered', label: "I've reconsidered\u2014it's not the right commitment" },
  { value: 'forgot', label: "I don't remember what it was" },
];

export const COMMITMENT_RESPONSES = {
  following: {
    text: 'Good. Small actions accumulate.',
    hasInput: false,
  },
  trying: {
    text: "That's honest. Integration isn't linear. What's getting in the way?",
    hasInput: true,
    placeholder: "What's getting in the way...",
  },
  'not-started': {
    text: "That's okay. Is there a smaller version of this commitment you could start with today?",
    hasInput: true,
    placeholder: 'A smaller version...',
  },
  reconsidered: {
    text: "Sometimes what felt right in the session doesn't fit ordinary life. Is there a different commitment that feels more true now?",
    hasInput: true,
    placeholder: 'What feels more true now...',
  },
  forgot: {
    text: "Here's what you wrote:",
    showCommitment: true,
    followUp: 'Does this still feel relevant?',
    options: [
      { value: 'yes', label: "Yes, I'll work on this" },
      { value: 'no', label: 'No, I want to set a different commitment' },
    ],
    noInput: {
      hasInput: true,
      placeholder: 'A new commitment...',
    },
  },
};

export const INTEGRATION_PRACTICES = [
  'Journal when something comes up',
  'Talk to someone you trust about your experience',
  'Notice moments in daily life that connect back to what emerged',
  'Be patient\u2014some insights take weeks to fully land',
];

export const INTEGRATION_STEPS = [
  {
    id: 'intro',
    content: {
      label: 'Integration',
      title: 'A Few Days Later',
      body: "A few days have passed. Sometimes the most important insights don't arrive during the session itself\u2014they emerge in the days after, in quiet moments, in dreams, in ordinary life.",
      // Dynamic variant used when prior modules were completed:
      bodyWithContext: "You've already checked in with how you're feeling and revisited what you wrote. Now, a few days out, let's look at what's actually taking root.",
    },
  },
  {
    id: 'emerged',
    content: {
      label: 'Integration',
      title: "What's Emerged",
      body: "Has anything new emerged since your session? Any realizations, shifts in perspective, or things you're seeing differently?",
      placeholder: "What's emerged...",
    },
  },
  {
    id: 'commitment-check',
    content: {
      label: 'Integration',
      title: 'Your Commitment',
      body: 'How are you doing with the commitment you made?',
      // Commitment text is dynamically pulled from session data
    },
  },
  {
    id: 'commitment-response',
    content: {
      label: 'Integration',
      // Content is dynamic based on commitment status
    },
  },
  {
    id: 'closing',
    content: {
      label: 'Integration',
      body: "Integration is ongoing. There's no finish line. But checking in like this\u2014honestly, without judgment\u2014is part of the work.",
    },
  },
  {
    id: 'complete',
    content: {
      label: 'Complete',
      title: 'Follow-Up Complete',
      body: "You've completed the follow-up session.",
      bodySecondary: "If you'd like to do another session in the future, we'll be here. In the meantime, your journal contains everything you've written.",
      bodyTertiary: 'Take care of yourself.',
    },
  },
];

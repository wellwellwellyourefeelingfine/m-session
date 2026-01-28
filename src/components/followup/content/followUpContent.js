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
    textSecondary: "Be gentle with yourself—rest, eat well, and reach out to someone you trust if you need support.",
  },
  tender: {
    text: 'Tenderness is a sign that something real was touched. Take care of yourself today.',
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
      body: "Reading this now, a day later—what stands out? Has anything shifted or become clearer?",
      placeholder: 'What I notice now...',
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
  { value: 'reconsidered', label: "I've reconsidered—it's not the right commitment" },
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

export const INTEGRATION_STEPS = [
  {
    id: 'intro',
    content: {
      label: 'Integration',
      title: 'A Few Days Later',
      body: "A few days have passed. Sometimes the most important insights don't arrive during the session itself—they emerge in the days after, in quiet moments, in dreams, in ordinary life.",
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
      body: "Integration is ongoing. There's no finish line. But checking in like this—honestly, without judgment—is part of the work.",
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

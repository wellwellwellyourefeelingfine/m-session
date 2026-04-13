/**
 * Follow-Up Session Content
 * Content definitions for the four time-locked follow-up modules
 */

// ============================================
// MODULE DEFINITIONS
// ============================================

export const FOLLOW_UP_MODULES = {
  checkIn: {
    id: 'checkIn',
    title: 'Check-In',
    description: 'A brief check-in to see how you\'re feeling after your session.',
    lockedDescription: 'This module will be available 8 hours after your session ended, giving your mind and body time to rest.',
    duration: '3-5 minutes',
    unlockHours: 8,
  },
  revisit: {
    id: 'revisit',
    title: 'Revisit',
    description: 'Revisit what you wrote during your session with fresh eyes.',
    lockedDescription: 'This module will be available 8 hours after your session ended.',
    duration: '5-10 minutes',
    unlockHours: 8,
  },
  valuesCompassFollowUp: {
    id: 'valuesCompassFollowUp',
    title: 'Values Compass',
    description: 'Revisit your ACT Matrix with fresh eyes and practice noticing toward and away moves.',
    lockedDescription: 'This module will be available 8 hours after your session ended.',
    duration: '10-20 minutes',
    unlockHours: 8,
  },
  integration: {
    id: 'integration',
    title: 'Integration Reflection',
    description: 'A deeper reflection on how integration is unfolding.',
    lockedDescription: 'This module will be available 8 hours after your session ended.',
    duration: '5-10 minutes',
    unlockHours: 8,
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

// ============================================
// VALUES COMPASS FOLLOW-UP MODULE CONTENT
// ============================================

export const TOWARD_MOVE_STATUSES = [
  { value: 'did-it', label: "I did it, or I've been doing it" },
  { value: 'started', label: "I've started, with mixed results" },
  { value: 'not-yet', label: "I haven't started yet" },
  { value: 'reconsidered', label: "I've reconsidered — it doesn't fit" },
];

export const TOWARD_MOVE_RESPONSES = {
  'did-it': {
    text: 'Good. Toward moves compound.',
    hasInput: false,
  },
  started: {
    text: "That's honest. What's been getting in the way?",
    hasInput: true,
    placeholder: "What's been getting in the way...",
  },
  'not-yet': {
    text: "That's okay. Is there a smaller version you could try today?",
    hasInput: true,
    placeholder: 'A smaller version...',
  },
  reconsidered: {
    text: "Sometimes what made sense during the session doesn't fit ordinary life. Is there a different toward move that feels more true now?",
    hasInput: true,
    placeholder: 'What feels more true now...',
  },
};

export const TIME_SPENT_OPTIONS = [
  { value: 'mostly-left', label: 'Mostly on the left (away moves)' },
  { value: 'mostly-right', label: 'Mostly on the right (toward moves)' },
  { value: 'balanced', label: 'A mix of both sides' },
  { value: 'hard-to-tell', label: "Hard to tell" },
];

export const TIME_SPENT_RESPONSES = {
  'mostly-left': {
    text: "That's worth noticing without judgment. Away moves are often automatic — seeing them is the first step.",
    hasInput: true,
    placeholder: 'What I notice about that...',
  },
  'mostly-right': {
    text: "That's good to recognize. What's been helping you move toward what matters?",
    hasInput: true,
    placeholder: "What's been helping...",
  },
  balanced: {
    text: "A mix is normal. Life involves both. The compass helps you notice the balance.",
    hasInput: false,
  },
  'hard-to-tell': {
    text: "That's okay. Noticing gets easier with practice. Even asking the question is a toward move.",
    hasInput: false,
  },
};

export const VALUES_COMPASS_FOLLOWUP_STEPS = [
  {
    id: 'welcome',
    content: {
      label: 'Values Compass',
      title: 'Your Values Compass',
      body: "During your session, you mapped out what matters to you, what gets in the way, and how you move through your life. Let's revisit that map with fresh eyes.",
    },
  },
  {
    id: 'matrix-revisit',
    content: {
      label: 'Values Compass',
      title: 'Your Matrix',
      body: 'Here is the matrix you created during your session. Take a moment to look at it. Does anything stand out differently now?',
      placeholder: 'What I notice looking at this now...',
    },
  },
  {
    id: 'noticing-away',
    content: {
      label: 'Values Compass',
      title: 'Away Moves',
      body: "Since your session, have you noticed yourself making any of the away moves you identified? Or new ones you didn't map?",
      placeholder: 'Away moves I\'ve noticed...',
    },
  },
  {
    id: 'noticing-toward',
    content: {
      label: 'Values Compass',
      title: 'Toward Moves',
      body: "Have you noticed yourself making any toward moves — even small ones — since your session?",
      placeholder: 'Toward moves I\'ve noticed...',
    },
  },
  {
    id: 'stuck-loop-checkin',
    content: {
      label: 'Values Compass',
      title: 'The Loop',
      body: "During your session, we looked at the stuck loop — how inner obstacles and away moves can feed each other. Have you noticed this pattern playing out since then?",
      placeholder: 'What I\'ve noticed about the loop...',
    },
  },
  {
    id: 'toward-move-status',
    content: {
      label: 'Values Compass',
      title: 'Your Toward Move',
      body: 'During your session, you chose a toward move to practice:',
    },
  },
  {
    id: 'time-spent',
    content: {
      label: 'Values Compass',
      title: 'Where You\'ve Been',
      body: 'Looking at your matrix, where would you say you\'ve been spending most of your time since the session?',
    },
  },
  {
    id: 'message-resurface',
    content: {
      label: 'Values Compass',
      title: 'A Message From That Place',
      body: 'During your session, you wrote a message to yourself from a place of clarity. Here it is:',
      placeholder: 'Reading this now, I...',
    },
  },
  {
    id: 'closing',
    content: {
      label: 'Complete',
      body: "The compass isn't something you complete — it's something you carry. Each time you notice a toward move or an away move, you're using it.",
      bodySecondary: 'The awareness you practiced during your session is already working.',
    },
  },
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

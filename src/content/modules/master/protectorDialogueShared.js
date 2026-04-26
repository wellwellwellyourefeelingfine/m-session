/**
 * protectorDialogueShared
 *
 * Shared content constants for the Dialogue with a Protector activity
 * (both Part 1 "Meeting a Protector" and Part 2 "Understanding Your
 * Protector"). Imported by both master content configs and by
 * downloadSessionData (for `getProtectorName`).
 */

// ============================================
// LANDING PAGE CONTENT
// ============================================

export const PART1_LANDING = {
  subtitle: 'What is a Protector?',
  description: 'Internal Family Systems uses the idea of "parts": protective patterns in the mind, each with its own logic and felt quality. In this exercise, we\'ll sometimes address these patterns as if they have a voice. This is a technique, not a literal claim. It works because personifying a pattern creates enough distance to observe it with curiosity instead of being caught inside it. You don\'t need to believe your mind is literally made of separate selves for this to be useful.',
  goals: 'In this first part, you\'ll slow down and meet one of your protectors. Through a guided meditation and reflection, you\'ll begin to notice it, name it, and start a relationship with it. Not to fix anything. Just to say hello.',
};

export const PART2_LANDING = {
  subtitle: 'Building a Relationship with a Part',
  description: 'In IFS, change doesn\'t come from analyzing or overriding a protective pattern. It comes from relating to it differently, with curiosity instead of control. When you stop fighting a pattern and start understanding it, something shifts on its own. You don\'t need to force anything.',
  goals: 'In this second part, you\'ll go deeper with the protector you met earlier. You\'ll explore where it came from, how old it is, what it fears, and what it might need. You\'ll have a real dialogue with it, asking questions and listening for what comes back.',
};

// ============================================
// PROTECTOR EXAMPLES & HELPERS
// ============================================

export const PROTECTOR_EXAMPLES = [
  { name: 'The Critic', description: 'Pushes you to be better, points out what\'s wrong before anyone else can' },
  { name: 'The Controller', description: 'Needs to manage everything, can\'t let go' },
  { name: 'The Pleaser', description: 'Puts others first, avoids conflict at any cost' },
  { name: 'The Achiever', description: 'Proves your worth through work and accomplishment' },
  { name: 'The Avoider', description: 'Shuts down, withdraws, goes numb when things get hard' },
  { name: 'The Worrier', description: 'Always scanning for danger, preparing for the worst' },
  { name: 'The Caretaker', description: 'Takes care of everyone else so you don\'t have to feel your own pain' },
  { name: 'The Escape Artist', description: 'Reaches for distraction: phone, substances, food, anything to not feel' },
  { name: 'The Numb One', description: 'Turns everything off when the pain gets through' },
  { name: 'The Performer', description: 'Puts on a mask, makes sure no one sees the real you' },
];

export const PROTECTOR_EXAMPLES_FOOTNOTE = 'These are starting points. Your protector might be something entirely different.';

/**
 * Display name for a protector. Returns the user-written name, or a generic
 * fallback used in places where the substitution can't gracefully degrade.
 */
export function getProtectorName(name) {
  return name || 'your protector';
}

// ============================================
// FEEL TOWARD OPTIONS (Part 1)
// ============================================

export const FEEL_TOWARD_OPTIONS = [
  { id: 'curious', label: 'Curious', description: 'I want to understand it', positive: true },
  { id: 'warm', label: 'Warm', description: 'I feel some compassion for it', positive: true },
  { id: 'open', label: 'Open', description: 'I\'m willing to be with it', positive: true },
  { id: 'frustrated', label: 'Frustrated', description: 'I wish it would stop', positive: false },
  { id: 'afraid', label: 'Afraid', description: 'It feels too big or too close', positive: false },
  { id: 'numb', label: 'Numb', description: 'I don\'t feel much of anything toward it', positive: false },
];

export const FEEL_TOWARD_UNBLENDING_LINES = [
  'That\'s okay. What you\'re noticing isn\'t a problem. It\'s information.',
  '',
  'When you feel frustration toward a protector, or fear, or blankness, that\'s usually a different reaction getting in the way. Another protective response with its own momentum.',
  '',
  'That\'s completely normal. We rarely have just one thing going on inside.',
  '§',
  'Here\'s what to try: acknowledge that reaction without fighting it. You might silently say, "I notice this frustration. I\'m going to set it aside for now so I can stay with what I was exploring. I can come back to it."',
  '',
  'Take a moment. Breathe.',
];

export const FEEL_TOWARD_GENTLE_NOTE = 'That\'s okay. Sometimes these reactions don\'t shift right away, and that\'s worth respecting. You can still continue. Just notice that something else may be present alongside you. There\'s no wrong way to do this.';

// ============================================
// STARTER QUESTIONS (Part 2 dialogue loop)
// ============================================

export const STARTER_QUESTIONS = [
  'What are you trying to protect me from?',
  'How long have you been doing this?',
  'What do you wish I understood about you?',
  'What would happen if you stopped?',
  'Do you know how old I am now?',
];

// ============================================
// FEAR BENEATH SUGGESTIONS (Part 2)
// ============================================

export const FEAR_BENEATH_SUGGESTIONS = [
  'Being rejected or abandoned',
  'Being seen as worthless',
  'Losing control and falling apart',
  'Feeling a pain that seems too big to bear',
  'Being truly, fully vulnerable',
  'Being exposed or humiliated',
];

/**
 * Protector Dialogue Content
 * All step definitions, protector types, affirmations, and display labels
 * for the two-part IFS Protector Dialogue module.
 */

// ============================================
// LANDING PAGE CONTENT
// ============================================

export const PART1_LANDING = {
  subtitle: 'IFS framework',
  description: 'Internal Family Systems views the mind as a collection of parts, each with its own perspective and role. Some of these parts are protectors: patterns that formed early in life to keep you safe from pain.',
  goals: 'In this first part, you\'ll slow down and meet one of your protectors. Through breath, reflection, and a guided meditation, you\'ll begin to notice it, name it, and send it a message. Not to fix anything, just to say hello.',
};

export const PART2_LANDING = {
  subtitle: 'IFS framework',
  description: 'Internal Family Systems views the mind as a collection of parts, each with its own perspective and role. Some of these parts are protectors: patterns that formed early in life to keep you safe from pain.',
  goals: 'In this second part, you\'ll go deeper with the protector you met earlier. You\'ll explore where it came from, what it fears, what it\'s guarding, and begin a dialogue about what it might need from you.',
};

// ============================================
// PROTECTOR TYPES & LABELS
// ============================================

export const PROTECTOR_TYPES = [
  { id: 'critic', label: 'The Critic', description: 'Pushes you to be better, points out what\'s wrong' },
  { id: 'controller', label: 'The Controller', description: 'Needs to manage everything, can\'t let go' },
  { id: 'pleaser', label: 'The Pleaser', description: 'Puts others first, avoids conflict at any cost' },
  { id: 'achiever', label: 'The Achiever', description: 'Proves your worth through work and accomplishment' },
  { id: 'avoider', label: 'The Avoider', description: 'Shuts down, withdraws, goes numb when things get hard' },
  { id: 'worrier', label: 'The Worrier', description: 'Always scanning for danger, preparing for the worst' },
  { id: 'caretaker', label: 'The Caretaker', description: 'Takes care of everyone else so you don\'t have to feel your own pain' },
  { id: 'other', label: 'Something else' },
];

export const PROTECTOR_DISPLAY_LABELS = {
  critic: 'The Critic',
  controller: 'The Controller',
  pleaser: 'The Pleaser',
  achiever: 'The Achiever',
  avoider: 'The Avoider',
  worrier: 'The Worrier',
  caretaker: 'The Caretaker',
  other: null, // uses custom label
};

/**
 * Get the display label for a protector type.
 * Returns the custom name for 'other', or the standard label.
 */
export function getProtectorLabel(type, customName) {
  if (type === 'other') return customName || 'your protector';
  return PROTECTOR_DISPLAY_LABELS[type] || 'your protector';
}

// ============================================
// PROTECTOR AFFIRMATIONS (Part 1 Step 7)
// ============================================

export const PROTECTOR_AFFIRMATIONS = {
  critic: {
    title: 'The Critic',
    body: 'The Critic is one of the hardest workers in the system. It drives you relentlessly because somewhere, long ago, it learned that being perfect was the only way to be safe.',
    closing: 'That voice isn\'t your enemy. It\'s just exhausted.',
  },
  controller: {
    title: 'The Controller',
    body: 'The need to control is often the need to feel safe. This part of you stepped in when things felt chaotic, when the world wasn\'t predictable and you needed it to be.',
    closing: 'It\'s been holding everything together for a long time.',
  },
  pleaser: {
    title: 'The Pleaser',
    body: 'The part of you that puts everyone else first learned early that your needs came second. It became very skilled at reading rooms, at making sure no one was upset.',
    closing: 'It\'s been doing that job for a long time. It\'s allowed to rest.',
  },
  achiever: {
    title: 'The Achiever',
    body: 'The Achiever knows one equation very well: if I am productive, I am valuable. If I stop, I am nothing.',
    closing: 'But that math was never true. This part of you has been solving the wrong problem with extraordinary effort.',
  },
  avoider: {
    title: 'The Avoider',
    body: 'Shutting down isn\'t weakness. It\'s a strategy. At some point, feeling too much was dangerous, so this part of you learned to turn the volume down.',
    closing: 'It\'s a protector. It did what it had to do.',
  },
  worrier: {
    title: 'The Worrier',
    body: 'The Worrier never stops scanning the horizon. It believes that if it stays vigilant enough, nothing bad will happen.',
    closing: 'That\'s an enormous amount of effort. It\'s been running a surveillance operation your whole life.',
  },
  caretaker: {
    title: 'The Caretaker',
    body: 'Caring for everyone else is a beautiful thing. But when it becomes compulsive, when you can\'t stop, it\'s usually because focusing on others keeps you from having to feel something of your own.',
    closing: 'This protector has a very generous cover story.',
  },
  other: {
    title: null, // uses custom label
    body: 'Whatever protector showed up for you, it appeared for a reason. It\'s not random. It came because it has something to show you.',
    closing: 'The fact that you can see it right now, with curiosity instead of frustration, means something has already shifted.',
  },
};

// ============================================
// PART 1 STEPS: "Meeting a Protector"
// ============================================

export const PART1_STEPS = [
  // Step 1 — Opening
  {
    type: 'text',
    content: {
      lines: [
        'This activity is about getting to know a part of yourself that works hard to protect you.',
        '',
        'Not to fix it. Not to get rid of it. Just to understand it a little better.',
      ],
    },
  },
  // Step 2 — Framing
  {
    type: 'text',
    content: {
      lines: [
        'You carry patterns that formed for good reasons. Ways of coping, defending, managing the world.',
        '§',
        'An inner critic that pushes you to be better. A part that avoids conflict at all costs. A part that stays busy so you never have to sit still.',
        '§',
        'These aren\'t flaws. They\'re protectors. They took on their roles when you needed them.',
      ],
    },
  },
  // Step 3 — The Invitation
  {
    type: 'text',
    content: {
      lines: [
        'Right now, in this state, something interesting happens.',
        '',
        'The walls these protectors usually maintain tend to soften on their own. You may already be sensing parts of yourself more clearly than usual.',
        '§',
        'We\'re going to work with that. Not by forcing anything open, just by paying attention to what\'s already here.',
      ],
    },
  },
  // Step 4 — Settling Breath
  {
    type: 'breath',
    content: {
      preText: 'Before we begin, let\'s settle in.\n\nWhen you\'re ready, we\'ll guide you through a short breathing exercise. Three slow breaths to help you ground and settle before beginning the protector dialogue.',
      postText: 'Good. Stay with that ease.',
      sequences: [
        {
          type: 'cycles',
          count: 3,
          pattern: { inhale: 5, hold: 0, exhale: 7, holdAfterExhale: 0 },
        },
      ],
    },
  },
  // Step 5 — Guided Noticing (Audio Meditation or Read-through)
  {
    type: 'meditation',
    content: {
      meditationId: 'protector-dialogue',
      choicePrompt: 'The next part is a guided meditation. About 8\u201310 minutes.\n\nYou can listen to it, or read through it at your own pace.',
      listenLabel: 'Listen',
      readLabel: 'Read',
    },
  },
  // Step 6 — Protector Selection
  {
    type: 'selection',
    content: {
      prompt: 'Which protector showed up for you? Choose whatever feels closest. It doesn\'t have to be perfect.',
    },
  },
  // Step 7 — Affirmation (personalized)
  {
    type: 'affirmation',
  },
  // Step 8 — Body Location
  {
    type: 'textInput',
    content: {
      prompt: 'Where did you feel this protector in your body?\n\nIf you noticed a specific place, like a tightness, warmth, heaviness, or pressure, take a moment to note it.',
      placeholder: 'e.g., tightness in my chest, knot in my stomach',
      field: 'bodyLocation',
      multiline: false,
    },
  },
  // Step 9 — Message to Your Protector
  {
    type: 'textInput',
    content: {
      prompt: 'Before we move on, take a moment to say something to this protector. One message. Whatever comes.\n\nYou might thank it. You might tell it you understand. You might say something you\'ve never said before.\n\nThere\'s no right answer.',
      placeholder: 'Write whatever feels true...',
      field: 'protectorMessage',
      multiline: true,
    },
  },
  // Step 10 — Closing
  {
    type: 'text',
    content: {
      lines: [
        'That\'s it for now.',
        '',
        'What just happened doesn\'t need to be analyzed yet. Let it sit. Let it settle.',
        '§',
        'We\'ll come back to this protector later, during integration, when you can see it with a little more clarity.',
        '',
        'For now, just know: you saw something real. And you approached it with kindness. That matters more than you might think.',
      ],
    },
  },
];

// ============================================
// PART 2 STEPS: "Understanding Your Protector"
// ============================================

export const PART2_STEPS = [
  // Step 1 — Reconnection (personalized in component)
  {
    type: 'reconnection',
  },
  // Step 2 — How Parts Work
  {
    type: 'text',
    content: {
      lines: [
        'Here\'s something worth understanding about how the mind organizes itself.',
        '',
        'We all carry different parts. Not in a disordered way, but as a natural feature of being human. Everyone has them.',
        '§',
        'Some parts are protectors. They develop strategies to keep you safe: working harder, shutting down, staying vigilant, pleasing others, maintaining control.',
        '§',
        'These strategies made sense when they first formed, usually in childhood or during a difficult time in your life. The problem is, most of them never updated. They\'re still running the old program.',
      ],
    },
  },
  // Step 3 — The Protector's Logic
  {
    type: 'text',
    content: {
      lines: [
        'Every protector has a logic to it. An internal reasoning that sounds something like:',
        '',
        '\u201CIf I keep doing this, then the bad thing won\'t happen.\u201D',
        '§',
        'The Critic says: If I point out every flaw first, no one else can hurt me with their criticism.',
        '',
        'The Controller says: If I manage every detail, nothing will fall apart.',
        '',
        'The Avoider says: If I don\'t engage, I can\'t be overwhelmed.',
        '§',
        'The logic always made sense once. The question is whether it still does.',
      ],
    },
  },
  // Step 4 — Guided Reflection (personalized with protector label)
  {
    type: 'guidedReflection',
    content: {
      // {protector_label} replaced in component
      lines: [
        'Let\'s think about your protector, {protector_label}.',
        '',
        'When did it first show up in your life? You may not have an exact memory, but you might have a sense of the period. Childhood, adolescence, a specific event, a relationship, a loss.',
        '',
        'Take a moment to feel into this. You don\'t need a narrative. A sense is enough.',
      ],
      hasPause: true,
    },
  },
  // Step 5 — Journaling: Origins
  {
    type: 'textInput',
    content: {
      prompt: 'When do you think this protector first took on its role? What was happening in your life when it appeared?\n\nWrite whatever comes. A memory, a feeling, a guess. Fragments are fine.',
      placeholder: 'It probably started when...',
      field: 'origins',
      multiline: true,
      rows: 5,
    },
  },
  // Step 6 — The Fear Beneath (personalized)
  {
    type: 'fearBeneath',
    content: {
      // {protector_label} replaced in component
      preLines: [
        'Now comes the important question.',
        '',
        'Every protector is afraid of something. That fear is what keeps it locked in its pattern.',
        '',
        '{protector_label} has been doing its job because it\'s afraid of what would happen if it stopped.',
        '',
        'What is that fear?',
      ],
      suggestions: [
        'Being rejected or abandoned',
        'Being seen as worthless',
        'Losing control and falling apart',
        'Feeling a pain that seems too big to bear',
        'Being truly, fully vulnerable',
      ],
      postLine: 'Or something else entirely.',
    },
  },
  // Step 7 — Journaling: The Fear
  {
    type: 'textInput',
    content: {
      prompt: 'In your own words: what is this protector afraid would happen if it stopped doing its job?',
      placeholder: 'If it stopped, then...',
      field: 'fear',
      multiline: true,
      rows: 4,
    },
  },
  // Step 8 — What It Guards
  {
    type: 'text',
    content: {
      lines: [
        'Behind every protector, there\'s usually something more tender.',
        '',
        'A wound. A memory. A younger version of you that experienced something painful and never fully processed it.',
        '',
        'The protector stands in front of that pain. That\'s its entire job description.',
        '§',
        'You don\'t need to go to that pain right now. Just knowing it\'s there, and knowing that the protector has been guarding it all this time, is enough.',
        '',
        'Understanding the guard is the first step toward understanding the wound.',
      ],
    },
  },
  // Step 9 — The Dialogue
  {
    type: 'dialogue',
    content: {
      preText: 'Now, let\'s try something.\n\nWrite a short dialogue between you and your protector. You\'re not performing. Just putting into words a conversation that may already be happening internally.\n\nStart with a question. Let the protector answer. See what unfolds. There\'s no right way to do this.',
      example: 'Me: Why do you push me so hard?\nCritic: Because if you\'re not perfect, they\'ll see the real you.\nMe: What\'s wrong with the real me?\nCritic: ...I don\'t know anymore. I just know I have to keep you safe.\nMe: What if I told you I can handle it now?\nCritic: I want to believe that. But I\'ve been doing this so long.',
    },
  },
  // Step 10 — What Does It Need?
  {
    type: 'textInput',
    content: {
      prompt: 'One more question, and this one matters.\n\nWhat does this protector actually need from you?\n\nNot what you need from it. What does it need?\n\nMaybe it needs permission to rest. Maybe it needs to know that you see how hard it\'s worked. Maybe it needs to hear that you\'re okay. That you can take it from here.\n\nWrite whatever feels true.',
      placeholder: 'What it needs...',
      field: 'whatItNeeds',
      multiline: true,
      rows: 4,
    },
  },
  // Step 11 — A Commitment
  {
    type: 'textInput',
    content: {
      prompt: 'Before we close this, consider making a small, honest commitment to this protector.\n\nNot a grand promise. Something real. Something you can actually do.\n\nIt might be: \u201CI\'ll notice when you show up, instead of just reacting.\u201D\n\nOr: \u201CI\'ll check in with you before I let you take over.\u201D\n\nOr: \u201CI\'ll try to give you a break sometimes.\u201D',
      placeholder: 'I commit to...',
      field: 'commitment',
      multiline: true,
      rows: 2,
    },
  },
  // Step 12 — Closing Reflection
  {
    type: 'text',
    content: {
      lines: [
        'What you just did, sitting with a protector, asking it questions, trying to understand rather than fight it... that\'s a real skill.',
        '§',
        'It\'s called parts work. And it doesn\'t require a therapist or a special state of mind. You can do this any time.',
        '§',
        'The protector you met today didn\'t appear by accident. It came because something in you is ready to have this conversation.',
        '',
        'You don\'t need to resolve everything right now. Understanding is not a single event. It\'s a relationship. And today, you started one.',
      ],
    },
  },
  // Step 13 — Closing
  {
    type: 'text',
    content: {
      lines: [
        'You can return to this work anytime. In a journal, in quiet moments, or in a future session.',
        '',
        'The protector will still be there. Now it knows you\'re paying attention.',
      ],
    },
  },
];

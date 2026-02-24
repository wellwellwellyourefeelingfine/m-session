/**
 * Protector Dialogue Content
 * All step definitions, protector examples, feel-toward options, and display helpers
 * for the two-part IFS Protector Dialogue module.
 */

// ============================================
// LANDING PAGE CONTENT
// ============================================

export const PART1_LANDING = {
  subtitle: 'What is a Protector?',
  description: 'Internal Family Systems uses the idea of "parts": protective patterns in the mind, each with its own logic and felt quality. In this exercise, we\'ll sometimes address these patterns as if they have a voice. This is a technique, not a literal claim. It works because personifying a pattern creates enough distance to observe it with curiosity instead of being caught inside it. You don\'t need to believe your mind is literally made of separate selves for this to be useful.',
  goals: 'In this first part, you\'ll slow down and meet one of your protectors. Through breath, a guided meditation, and reflection, you\'ll begin to notice it, name it, and start a relationship with it. Not to fix anything. Just to say hello.',
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

/**
 * Get the display name for a protector.
 * Returns the user-written name, or a fallback.
 */
export function getProtectorName(name) {
  return name || 'your protector';
}

// ============================================
// FEEL TOWARD OPTIONS (Part 1 Step 7)
// ============================================

export const FEEL_TOWARD_OPTIONS = [
  { id: 'curious', label: 'Curious', description: 'I want to understand it', positive: true },
  { id: 'warm', label: 'Warm', description: 'I feel some compassion for it', positive: true },
  { id: 'open', label: 'Open', description: 'I\'m willing to be with it', positive: true },
  { id: 'frustrated', label: 'Frustrated', description: 'I wish it would stop', positive: false },
  { id: 'afraid', label: 'Afraid', description: 'It feels too big or too close', positive: false },
  { id: 'numb', label: 'Numb', description: 'I don\'t feel much of anything toward it', positive: false },
];

export const FEEL_TOWARD_UNBLENDING_TEXT = [
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
// STARTER QUESTIONS (Part 2 Dialogue)
// ============================================

export const STARTER_QUESTIONS = [
  'What are you trying to protect me from?',
  'How long have you been doing this?',
  'What do you wish I understood about you?',
  'What would happen if you stopped?',
  'Do you know how old I am now?',
];

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
        'An inner critic that pushes you to be better. A part that avoids conflict at all costs. A part that stays busy so you never have to sit still. A part that reaches for distraction the moment things get uncomfortable.',
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
      preText: 'Before we begin, let\'s settle in.\n\nWhen you\'re ready, we\'ll guide you through a short breathing exercise. Three slow breaths to help you arrive in your body before we go inward.',
      postText: 'Continue breathing at your own pace. When you feel settled, press continue.',
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
      choicePrompt: 'The next part is a guided meditation. About 12\u201315 minutes.\n\nYou can listen to it, or read through it at your own pace.',
      listenLabel: 'Listen',
      readLabel: 'Read',
    },
  },
  // Step 6 — Naming Your Protector
  {
    type: 'naming',
    content: {
      header: 'What showed up?',
      prompt: 'In a word or a short phrase, give this protector a name. It doesn\'t need to be clever. It just needs to feel right.',
      namePlaceholder: 'e.g., The Critic, The Wall, The Fixer...',
      descriptionLabel: 'Briefly describe what it does or how it shows up.',
      descriptionPlaceholder: 'e.g., It pushes me to be perfect so no one can criticize me first...',
      examplesLabel: 'Examples of common protectors',
      examplesFootnote: 'These are starting points. Your protector might be something entirely different.',
    },
  },
  // Step 7 — Feel Toward Check (IFS 4th F)
  {
    type: 'feelToward',
    content: {
      checkHeader: 'One more thing before we go on.',
      checkPrompt: 'Take a moment to check: how do you feel toward {protector_name} right now?\n\nThis matters. The relationship you build with this protector depends on where you\'re coming from.',
      recheckPrompt: 'How do you feel toward {protector_name} now?',
    },
  },
  // Step 8 — Body Location
  {
    type: 'textInput',
    content: {
      prompt: 'Where did you feel {protector_name} in your body?\n\nIf you noticed a specific place, like a tightness, warmth, heaviness, pressure, or hollowness, take a moment to note it.',
      placeholder: 'e.g., tightness in my chest, knot in my stomach, pressure behind my eyes',
      field: 'bodyLocation',
      multiline: false,
    },
  },
  // Step 9 — Message to Your Protector
  {
    type: 'textInput',
    content: {
      prompt: 'Before we close this part, take a moment to say something to {protector_name}. One message. Whatever comes.\n\nYou might thank it. You might tell it you see how hard it\'s been working. You might say something you\'ve never said before.\n\nThere\'s no right answer. Just write whatever feels true.',
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
        'In Part II, you\'ll go deeper with {protector_name}: exploring where it came from, what it fears, and what it actually needs from you. You\'ll have a conversation with it.',
        '',
        'For now, just know: you noticed something real. And you approached it with curiosity instead of combat. That matters more than you might think.',
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
        'Some parts are protectors. They develop strategies to keep you safe: working harder, shutting down, staying vigilant, pleasing others, maintaining control, numbing out.',
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
        '',
        'The Escape Artist says: If I find something else to focus on, I don\'t have to feel this.',
        '§',
        'The logic always made sense once. The question is whether it still does, and whether {protector_name} knows that things have changed.',
      ],
    },
  },
  // Step 4 — Re-Settling
  {
    type: 'settling',
    content: {
      lines: [
        'Before we go further, let\'s check in.',
        '',
        'Take a breath. Feel your body. Notice where {protector_name} lives in you. You said it was {body_location}.',
        '',
        'See if you can feel it now. And check: can you be with it with some curiosity? Some openness?',
        '',
        'If so, let\'s continue.',
        '',
        'If something else is getting in the way, like a critical reaction, impatience, or unease, take a moment to acknowledge it and gently set it aside.',
      ],
      // Fallback when no body location data
      fallbackLines: [
        'Before we go further, let\'s check in.',
        '',
        'Take a breath. Feel your body. Notice where {protector_name} lives in you.',
        '',
        'See if you can feel it now. And check: can you be with it with some curiosity? Some openness?',
        '',
        'If so, let\'s continue.',
        '',
        'If something else is getting in the way, like a critical reaction, impatience, or unease, take a moment to acknowledge it and gently set it aside.',
      ],
    },
  },
  // Step 5 — How Old Is It?
  {
    type: 'textInput',
    content: {
      header: 'What age does this pattern belong to?',
      preText: 'Not how long you\'ve had the pattern, but what age it seems connected to. Protective patterns often carry the emotional energy of the period when they formed. They can feel childlike, adolescent, or rooted in a very specific time.\n\nClose your eyes for a moment and notice: what age does {protector_name} belong to?\n\nSee what comes. A number, an impression, a feeling. It doesn\'t have to be precise.',
      placeholder: 'e.g., about 7, teenage, very young, not sure...',
      field: 'protectorAge',
      multiline: false,
    },
  },
  // Step 6 — What Version of You Is It Responding To?
  {
    type: 'textInput',
    content: {
      preText: 'Now notice something else:\n\nWhat version of you does {protector_name} seem to be responding to?\n\nThis is an important question. Protective patterns often operate as if nothing has changed since they formed. They respond to the world the way you needed to when you were younger, as if you\'re still that age, still in that situation. The pattern may be protecting against something that\'s no longer a threat, but it hasn\'t updated.',
      placeholder: 'e.g., it seems connected to when I was about 10, it responds as if I\'m still a teenager, it doesn\'t seem to register that I\'m an adult now...',
      field: 'respondingToVersion',
      multiline: true,
      rows: 3,
    },
  },
  // Step 7 — Origins
  {
    type: 'textInput',
    content: {
      header: 'Where did it come from?',
      preText: 'When do you think {protector_name} first took on its role? What was happening in your life when it appeared?\n\nYou may not have an exact memory. A sense is enough. A period. An atmosphere. A relationship. Something shifted, and this part stepped in.\n\nWrite whatever comes. A memory, a feeling, a guess. Fragments are fine.',
      placeholder: 'It probably started when...',
      field: 'origins',
      multiline: true,
      rows: 5,
    },
  },
  // Step 8 — The Fear Beneath
  {
    type: 'fearBeneath',
    content: {
      header: 'What is it afraid of?',
      preLines: [
        'Every protector is afraid of something. That fear is what keeps it locked in its pattern.',
        '',
        '{protector_name} has been doing its job because it\'s afraid of what would happen if it stopped.',
        '',
        'What is that fear?',
      ],
      suggestions: [
        'Being rejected or abandoned',
        'Being seen as worthless',
        'Losing control and falling apart',
        'Feeling a pain that seems too big to bear',
        'Being truly, fully vulnerable',
        'Being exposed or humiliated',
      ],
      postLine: 'Or something else entirely.',
    },
  },
  // Step 9 — Journaling: The Fear
  {
    type: 'textInput',
    content: {
      prompt: 'In your own words: what is {protector_name} afraid would happen if it stopped doing its job?',
      placeholder: 'If it stopped, then...',
      field: 'fear',
      multiline: true,
      rows: 4,
    },
  },
  // Step 10 — What It Guards
  {
    type: 'text',
    content: {
      lines: [
        'Behind most protective patterns, there\'s something more tender. A feeling. A memory. Something that was too much to process at the time.',
        '',
        'The protector stands between you and that tenderness. That\'s its entire purpose.',
        '§',
        'You don\'t need to go there right now. Trust the pace of this. Understanding the protective pattern is the work right now.',
        '',
        'If more surfaces over time, it will. There\'s no need to force it.',
      ],
    },
  },
  // Step 11 — The Dialogue (looping)
  {
    type: 'dialogueLoop',
    content: {
      header: 'A Conversation with {protector_name}',
      preText: 'Now let\'s try something different. You\'re going to have a written dialogue with {protector_name}.\n\nThis is a technique, not a performance. The idea is to ask a question directed at this pattern, then close your eyes and notice what comes back. Not what you think the answer should be, but whatever surfaces. It might come as words, an image, a feeling, or a body sensation.\n\nThis works because some of what you know about yourself isn\'t accessible through direct thinking. Addressing a question to a pattern and waiting for a response is a way of reaching that deeper layer. Think of it as listening to what your body and emotional memory already know.\n\nThe key is to ask, and then wait. Receive, don\'t construct.',
      starterLabel: 'If you\'re not sure where to start, try one of these',
      questionPlaceholder: 'Write a question for {protector_name}...',
      listeningInstruction: 'Close your eyes. Ask this question inwardly, to {protector_name}. Then wait.\n\nDon\'t construct a response. Just notice what comes. A word, a sentence, an image, a feeling. Whatever arrives is enough.\n\nWhen you\'ve received something, press continue.',
      responsePlaceholder: 'Write what came back...',
    },
  },
  // Step 12 — What Does It Need?
  {
    type: 'textInput',
    content: {
      header: 'What does it need from you?',
      preText: 'One more question, and this one matters.\n\nWhat does {protector_name} actually need from you? Not what you need from it. What does it need?\n\nMaybe it needs permission to rest. Maybe it needs to know that you see how hard it\'s worked. Maybe it needs to hear that you\'re not a child anymore, that you can handle things now. Maybe it just needs to know you\'re listening.',
      placeholder: 'What it needs...',
      field: 'whatItNeeds',
      multiline: true,
      rows: 4,
    },
  },
  // Step 13 — What Might Take Its Place?
  {
    type: 'textInput',
    content: {
      header: 'If this pattern didn\'t have to run anymore...',
      preText: 'One more question to sit with: if {protector_name} didn\'t have to operate this way anymore, what might take its place?\n\nProtective patterns carry energy. When they soften, that energy doesn\'t disappear. It becomes available for something else. The critic\'s intensity might become encouragement. The controller\'s vigilance might become careful attention. The avoider\'s withdrawal might become genuine rest.\n\nSee what comes.',
      placeholder: 'If this pattern softened, what might replace it...',
      field: 'whatMightReplace',
      multiline: true,
      rows: 4,
    },
  },
  // Step 14 — Intention (renamed from Commitment)
  {
    type: 'textInput',
    content: {
      header: 'A small intention.',
      preText: 'This isn\'t a grand declaration. It\'s a small, honest intention for how you\'ll relate to this pattern going forward.\n\nSomething real. Something you can actually hold.\n\nIt might be: \u201CI\'ll notice when this pattern fires, instead of just reacting.\u201D\n\nOr: \u201CI\'ll pause before I let it take over.\u201D\n\nOr: \u201CWhen this pattern fires, I\'ll try to remember that I\'m not the age I was when it started.\u201D',
      placeholder: 'Our agreement...',
      field: 'intention',
      multiline: true,
      rows: 2,
    },
  },
  // Step 15 — Closing Reflection
  {
    type: 'text',
    content: {
      lines: [
        'What you just did, sitting with a protector, asking it questions, listening without trying to fix, that\'s a real skill.',
        '§',
        'It\'s called parts work. And it doesn\'t require a therapist or a special state of mind. You can do this any time. In a journal, in a quiet moment, in a future session.',
        '§',
        'The protector you met today didn\'t appear by accident. It came because something in you is ready to have this conversation.',
      ],
    },
  },
  // Step 16 — Closing
  {
    type: 'text',
    content: {
      lines: [
        'You don\'t need to resolve everything right now. Understanding isn\'t a single event. It\'s a relationship. And today, you deepened one.',
        '',
        '{protector_name} will still be there. Now it knows you\'re paying attention.',
      ],
    },
  },
];

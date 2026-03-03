/**
 * The Cycle Content
 * All phase definitions, move options, and screen text
 * for Part 2 of the linked EFT relationship module pair.
 *
 * Supports solo (journaling-first) and couple (discussion-first) modes.
 * In couple mode, the app becomes a facilitated conversation guide.
 * In solo mode, it remains a personal reflection tool.
 */

// ============================================
// MOVE OPTIONS
// ============================================

export const PURSUER_MOVES = [
  { id: 'criticize', label: 'Criticize', description: 'Point out what they are doing wrong' },
  { id: 'pursue', label: 'Pursue', description: 'Follow them, demand a response, refuse to let it drop' },
  { id: 'blame', label: 'Blame', description: 'Make it about what they did or did not do' },
  { id: 'escalate', label: 'Escalate', description: 'Get louder, more intense, more urgent' },
  { id: 'question', label: 'Question', description: 'Ask rapid-fire questions, interrogate' },
  { id: 'fix', label: 'Try to fix', description: 'Jump into problem-solving before the feeling is heard' },
  { id: 'plead', label: 'Plead', description: 'Beg them to listen, to care, to respond' },
  { id: 'test', label: 'Test', description: 'Set up situations to see if they will show up' },
];

export const WITHDRAWER_MOVES = [
  { id: 'shut-down', label: 'Shut down', description: 'Go quiet, stop talking, leave the room internally' },
  { id: 'deflect', label: 'Deflect', description: 'Change the subject, make a joke, minimize it' },
  { id: 'stonewall', label: 'Stonewall', description: 'Refuse to engage, go blank, wait it out' },
  { id: 'appease', label: 'Appease', description: 'Agree to anything just to end the conflict' },
  { id: 'intellectualize', label: 'Intellectualize', description: 'Move to logic, argue the facts, avoid the feeling' },
  { id: 'leave', label: 'Leave', description: 'Walk away, take space, disappear' },
  { id: 'numb', label: 'Go numb', description: 'Stop feeling anything, flatline' },
  { id: 'busy', label: 'Get busy', description: 'Fill the space with tasks, work, distraction' },
];

/**
 * Get the move options for a given position.
 * @param {'pursuer' | 'withdrawer'} position
 * @returns {Array} Array of move option objects
 */
export function getMovesForPosition(position) {
  return position === 'pursuer' ? PURSUER_MOVES : WITHDRAWER_MOVES;
}

/**
 * Get the label for a move ID within a position.
 * @param {'pursuer' | 'withdrawer'} position
 * @param {string} moveId
 * @returns {string}
 */
export function getMoveLabel(position, moveId) {
  const moves = getMovesForPosition(position);
  return moves.find(m => m.id === moveId)?.label || moveId;
}

// ============================================
// POSITION CONFIG
// ============================================

export const POSITIONS = {
  pursuer: {
    key: 'pursuer',
    label: 'I move toward',
    description: 'When things get hard, I tend to reach, push, pursue, demand, escalate.',
  },
  withdrawer: {
    key: 'withdrawer',
    label: 'I move away',
    description: 'When things get hard, I tend to pull back, shut down, go quiet, leave.',
  },
};

/**
 * Get the opposite position.
 */
export function getPartnerPosition(myPosition) {
  return myPosition === 'pursuer' ? 'withdrawer' : 'pursuer';
}

// ============================================
// ACCENT TERMS (for renderContentLines highlighting)
// ============================================

export const CYCLE_ACCENT_TERMS = {
  seventy_percent: '70%',
  this_is_the_cycle: 'this is the cycle',
  plasticity: 'plasticity',
};

// ============================================
// SCREEN CONTENT — PRE-MEDITATION
// ============================================

export const FRAMING_CONTENT = {
  header: 'The Cycle',
  subtitle: 'Part II',
  withPartData: {
    lines: [
      'In The Deep Dive, you went beneath the surface of what happens between you and this person. You found the feelings underneath your familiar reactions.',
      '\u00A7',
      'Now we are going to map the pattern itself. The repeating cycle that you and this person get caught in.',
      '\u00A7',
      'Every relationship has one. It runs faster than either of you can think. And once you can see it from above, it starts to lose some of its grip.',
    ],
  },
  withoutPartData: {
    lines: [
      'This exercise is about mapping the repeating pattern in a relationship. The cycle that plays out when things get hard between you and someone who matters.',
      '\u00A7',
      'Every relationship has one. It runs faster than either of you can think. And once you can see it from above, it starts to lose some of its grip.',
    ],
  },
  coupleNote: 'You are going to map this together. The app will guide you through taking turns. One of you will hold the device. Both of you will participate.',
};

export const FRICTION_SCREEN = {
  header: 'The friction point',
  solo: {
    prompt: 'Think about a tension that keeps coming up between you and this person. Not the biggest fight. Just a pattern you have been through more than once.',
    placeholder: 'What keeps coming up...',
    rows: 3,
  },
  couple: {
    instruction: 'Talk about this together for a moment. What is the pattern that keeps showing up between you? Not the worst fight. The one you keep going through. When you have agreed on what it is, write it down.',
    placeholder: 'The pattern you both recognize...',
    rows: 3,
  },
};

export const YOUR_MOVE_SCREEN = {
  solo: {
    header: 'Your move',
    prompt: 'When this tension shows up, what do you typically do?',
    journalPrompt: 'What are you hoping will happen when you do this?',
    journalPlaceholder: 'What I am hoping for...',
  },
  couple: {
    header: 'Your turn',
    prompt: 'Person holding the device: when this tension comes up, what do you typically do?',
    journalPrompt: 'What are you hoping will happen when you do this?',
    journalPlaceholder: 'What I am hoping for...',
    note: 'Your partner will get their turn next.',
  },
};

export const YOUR_UNDERNEATH_SCREEN = {
  solo: {
    header: 'Your underneath',
    prompt: {
      withPart1: 'In The Deep Dive, you found a deeper feeling underneath your surface reactions. Does it connect to the pattern you just described? What is the feeling that drives your move?',
      withoutPart1: 'Underneath the move you just described, what is the deeper feeling driving it? A fear. A sadness. A question you keep asking.',
    },
    placeholder: 'The feeling underneath my reaction...',
    rows: 4,
  },
  couple: {
    header: 'Your underneath',
    prompt: {
      withPart1: 'This is just for you. You found this deeper feeling in the first part of the exercise. Does it connect to the pattern you just described?',
      withoutPart1: 'This is just for you right now. Underneath the move you just described, what is the deeper feeling driving it? A fear. A sadness. A question you keep asking.',
    },
    note: 'You will have a chance to share this with your partner before you see the full cycle.',
    placeholder: 'The feeling underneath my reaction...',
    rows: 4,
  },
};

export const PARTNER_TURN_SCREEN = {
  header: 'Your partner\u2019s turn',
  intro: 'Hand the device to your partner, or read the following prompts aloud.',
  step1: {
    subheader: 'Your move',
    prompt: 'When this tension comes up between you, what do you typically do?',
    note: 'Select the one that feels closest. It does not have to be exact.',
  },
  step2: {
    subheader: 'Your underneath',
    prompt: 'Underneath that reaction, what is the deeper feeling driving it? Not the frustration or the shutdown. What is behind it.',
    placeholder: 'The feeling underneath my reaction...',
    rows: 4,
    note: 'You will share this with your partner in a moment.',
  },
};

export const SHARING_SCREEN = {
  header: 'Before you see the cycle',
  lines: [
    'You have each written about what you feel underneath your reactions. Now share it.',
    '\u00A7',
    'This is not a discussion. One person reads what they wrote. The other person just listens. Then switch.',
    '\u00A7',
    'Take your time with this.',
  ],
  postShare: 'When you have both shared, continue to see the full cycle.',
};

export const THEIR_MOVE_SCREEN = {
  header: 'Their move',
  lines: [
    'Now think about the other person. When the tension starts, what do they do?',
    '',
    'You are mapping their side of the pattern. Not to blame them, but to see the whole cycle.',
  ],
  prompt: 'Select the one that feels closest.',
};

export const THEIR_UNDERNEATH_SCREEN = {
  header: 'Their underneath',
  prompt: 'What do you imagine is driving their move? Not the behavior you see. The feeling underneath it. What are they afraid of? What are they protecting?',
  placeholder: 'What I imagine they feel underneath...',
  rows: 4,
};

export const PRE_REVEAL_CONTENT = {
  solo: 'You have mapped both sides of your cycle. Give this pattern a name, then see the whole thing.',
  couple: 'You have each mapped your side. Give this pattern a name, then see the whole thing together.',
};

export const CYCLE_NAMING_TEXT = {
  placeholder: 'e.g., The Chase, The Freeze, Push-Pull...',
};

export const SITTING_CONTENT = {
  solo: {
    lines: [
      'This is your cycle. Not a flaw in either person. A pattern that lives between you, driven by what you are both feeling underneath.',
      '\u00A7',
      'Most relationships have some version of this. The pattern does not get solved. It gets recognized. And when you can see it from above, you have a choice you did not have before.',
    ],
  },
  couple: {
    lines: [
      'This is your cycle. Not something one of you is doing to the other. A pattern that lives between you, driven by what you are both feeling underneath.',
      '\u00A7',
      'You can both see it now. That is not a small thing.',
    ],
  },
};

export const MEDITATION_INTRO_CONTENT = {
  header: 'Closing Meditation',
  lines: [
    'You have built something. You can see the pattern now.',
    '\u00A7',
    'Before we close, take a few minutes to let it settle from your mind into the rest of you. This short meditation will help you hold what you have seen with something other than analysis.',
  ],
};

// ============================================
// SCREEN CONTENT — POST-MEDITATION
// ============================================

export const CAPTURE_SCREEN = {
  solo: {
    header: 'While it\u2019s fresh',
    preamble: 'The meditation just ended. If something is present for you right now, write it down before it fades.',
    placeholder: 'Whatever is most alive right now...',
    rows: 4,
  },
  couple: {
    header: 'While it\u2019s fresh',
    instruction: 'Take a quiet moment. If either of you wants to write something down from the meditation, do that now. This one is individual.',
    placeholder: 'Whatever is most alive right now...',
    rows: 4,
  },
};

export const CYCLE_CHECKIN_HEADER = 'How did that land?';
export const CYCLE_CHECKIN_SUBTEXT = 'Pick whichever feels closest right now.';
export const CYCLE_CHECKIN_COUPLE_NOTE = 'Pick whichever feels closest for the person holding the device. You can talk about where you each landed on the next screen.';

export const CYCLE_CHECKIN_OPTIONS = [
  { id: 'softer', label: 'Softer toward both of us' },
  { id: 'clearer', label: 'Seeing the pattern more clearly' },
  { id: 'heavy', label: 'Something heavy came up' },
  { id: 'ready', label: 'Ready to try something different' },
  { id: 'processing', label: 'Still processing, not sure yet' },
];

export const CYCLE_TAILORED_RESPONSES = {
  softer: {
    header: 'That is what changes the pattern',
    paragraphs: [
      'The softening you are feeling is not just a nice side effect. It is the mechanism of change. When you can hold your side of the cycle and their side with genuine compassion instead of blame, the cycle loses its grip. Not all at once. But meaningfully.',
      'This is different from understanding the pattern intellectually. You felt both sides of it. Your nervous system registered that neither of you is the enemy. That kind of felt understanding is what actually shifts how you show up the next time the cycle starts.',
    ],
  },
  clearer: {
    header: 'Clarity is the first exit',
    paragraphs: [
      'You are seeing something now that most people never see in their own relationships. Not because the pattern is hidden, but because you are usually inside it when it is happening. You cannot read the label from inside the bottle.',
      'The clarity you have right now is not permanent in its current intensity. It will soften as you move through the rest of your day. But the pattern recognition itself tends to stick. The next time your cycle starts, there will be a moment where a part of you says: this is the thing. That moment is the exit ramp.',
    ],
  },
  heavy: {
    header: 'The weight is real',
    paragraphs: [
      'Seeing a pattern clearly does not always feel like relief. Sometimes it feels like grief. Grief for all the times the cycle ran without either of you knowing. For the hurt that accumulated. For the distance it created between two people who were both just trying to stay safe.',
      'That heaviness is not a sign that something went wrong. It is a sign that you are seeing the full picture, including the cost. Sit with it. It will not stay this heavy. And what it leaves behind is usually a quieter kind of compassion.',
    ],
  },
  ready: {
    header: 'Hold that energy gently',
    paragraphs: [
      'The desire to do something different is powerful right now. And it is real. But the cycle is faster than your good intentions. It has been running on autopilot for a long time. The next time it fires, your body will be three moves deep before your conscious mind catches up.',
      'That is not a reason to give up. It is a reason to aim smaller than you think. Do not try to stop the cycle. Try to catch it one beat earlier than last time. That is the real win.',
    ],
  },
  processing: {
    header: 'Let it settle',
    paragraphs: [
      'The meditation covered a lot of ground. Not all of it processes at the same speed. Some of it may not land until hours or days from now.',
      'As you go through the next few screens, see if anything becomes clearer. Sometimes the shift shows up later, in a moment when you would normally reach for your familiar move, and instead you pause.',
    ],
  },
};

export const CYCLE_PSYCHOED_SCREENS = [
  {
    header: 'What the research says',
    lines: [
      'Relationship researchers have found that roughly {seventy_percent} of the conflicts couples face are perpetual. They never get fully resolved. The same themes come back, year after year, in different costumes.',
      '\u00A7',
      'This is not a failure of the relationship. It is the nature of relationships. Two separate nervous systems, shaped by different histories, will always have places where they grind against each other.',
      '\u00A7',
      'The difference between couples who thrive and couples who do not is not whether they have a cycle. It is whether they can talk about the cycle without being inside it.',
    ],
  },
  {
    header: 'What catching it looks like',
    lines: [
      'Catching the cycle does not look dramatic. It looks like this:',
      '\u00A7',
      'You feel the familiar tension rising. Your body starts doing the thing. The jaw tightens, or the stomach drops, or the urge to leave the room fires. And somewhere in there, a quiet voice says: {this_is_the_cycle}.',
      '\u00A7',
      'That is it. You do not need to stop the feeling. You just need to name what is happening. Out loud, if you can.',
      '\u00A7',
      '\u201CI think we are in the cycle.\u201D',
      '\u00A7',
      'That sentence, said from a real place, changes the temperature of the room. It pulls both of you up to the level where you can see the pattern instead of being trapped inside it.',
    ],
    coupleAddition: '\u201CI think we are in the cycle.\u201D That sentence works even better when two people can say it to each other.',
  },
  {
    header: 'Why this sticks',
    lines: [
      'There is a reason this exercise was designed for right now rather than as something to read in a book.',
      '\u00A7',
      'Your brain is in a state of heightened {plasticity}. The defenses that normally keep old patterns locked in place are softer. New connections form more easily. Emotional learning that would take months of repetition in ordinary life can happen in a single sitting.',
      '\u00A7',
      'The compassion you felt during the meditation is not just a feeling that will fade. It is being written into the same neural pathways that hold the cycle. You are not just understanding the pattern differently. You are encoding a new response to it.',
      '\u00A7',
      'The days after this session matter. The pattern will show up again. When it does, you will have a window where the new understanding is still warm. Use it.',
    ],
  },
];

export const REFLECT_1_SCREEN = {
  solo: {
    header: 'What surprised you',
    preamble: 'You have been living inside this cycle for a while. Now you have seen it from above. Was there something in the pattern that you did not expect?',
    prompt: 'What was unexpected about seeing the whole cycle?',
    placeholder: 'Something I noticed that I hadn\u2019t seen before...',
    rows: 4,
  },
  couple: {
    header: 'What surprised you',
    instruction: 'Share with each other: was there something about the cycle that surprised you? Something about your own side, their side, or how the two moves feed each other? Take turns. Listen without responding until both of you have shared.',
    timeSuggestion: 'Take a few minutes with this.',
    placeholder: 'Notes from your conversation...',
    rows: 3,
  },
};

export const REFLECT_2_SCREEN = {
  solo: {
    header: 'Their side',
    preamble: {
      default: 'During the meditation, you held both sides of the cycle at once. Now try to put words to what you imagine the other person goes through. Not their behavior. The feeling underneath it.',
      heavy: 'This one might be hard right now. But even a small attempt matters. What do you imagine it feels like to be on their side of this cycle?',
    },
    prompt: 'What do I imagine it feels like to be on their side of this?',
    placeholder: 'Their fears, their frustrations, what they might be protecting...',
    rows: 5,
  },
  couple: {
    header: 'Seeing each other',
    instruction: 'This one has two parts.',
    steps: [
      'First, each of you: describe to your partner what you now understand about THEIR side of the cycle. Not a summary. Tell them what you imagine it feels like to be them in this pattern. What you think they are afraid of. What you think they need.',
      'Then, each of you: tell your partner whether they got it right. What did they see clearly? What did they miss?',
    ],
    timeSuggestion: 'This is the most important conversation in this exercise. Take your time.',
    placeholder: 'What we learned about each other\u2019s side...',
    rows: 4,
  },
};

export const REFLECT_3_SCREEN = {
  solo: {
    header: 'One different move',
    preamble: {
      default: 'You know what the cycle looks like now. The next time you feel it starting, what would it look like to do one thing differently?',
      ready: 'You said you feel ready to try something different. Let\u2019s make it concrete. What is one specific thing you could do or say instead of your usual move?',
      heavy: 'This does not have to be ambitious. The most powerful thing you can do is the smallest thing: pause one beat longer, name what is happening, say the feeling instead of the reaction.',
    },
    prompt: 'What would it look like to step outside this cycle, even once?',
    placeholder: 'One moment, one move, one sentence I could try...',
    rows: 5,
  },
  couple: {
    header: 'One different move',
    instruction: {
      default: 'Discuss together: the next time you feel the cycle starting, what could each of you do differently? Not a promise to be perfect. Just one moment where one of you does something other than the usual move.',
      ready: 'You both have the pattern in front of you now. Talk about this: what is one concrete thing each of you could try the next time the cycle starts? Be specific. Not \u201CI will be better.\u201D Something like \u201CI will say what I am actually feeling instead of going quiet\u201D or \u201CI will ask instead of criticize.\u201D',
      heavy: 'This does not need to be a big commitment. Talk about the smallest possible exit ramp for each of you. One beat of pause. One sentence that names what is actually happening.',
    },
    timeSuggestion: 'Take a few minutes with this.',
    placeholder: 'What we want to try...',
    rows: 4,
  },
};

export const JOURNEY_CLOSE_SCREEN = {
  solo: {
    header: 'The full picture',
    lines: [
      'You started this by going underneath your surface reactions to find what was really driving them. Then you mapped the pattern those feelings create. And then you held the whole thing with something other than blame.',
      '\u00A7',
      'Most people never do any of it, let alone all three in one sitting.',
    ],
    prompt: 'The one thing I want to carry forward from this',
    placeholder: 'A feeling, an insight, a commitment, whatever stays...',
    rows: 4,
  },
  couple: {
    header: 'The full picture',
    lines: [
      'You started this by each going underneath your surface reactions. Then you mapped the pattern those feelings create between you. And then you held the whole thing, together, with something other than blame.',
      '\u00A7',
      'You did this together. That matters more than doing it perfectly.',
    ],
    instruction: 'One last conversation. Each of you: what is the one thing from today that you want to carry forward? Share it with each other.',
    timeSuggestion: 'Take your time with this one.',
    placeholder: 'What we want to carry forward...',
    rows: 4,
  },
};

export const CLOSING_CONTENT = {
  solo: {
    withJourney: [
      'Your cycle lives in your journal now. You can come back to it anytime.',
      '\u00A7',
      'The pattern does not disappear because you can see it. But seeing it means you are no longer only inside it.',
      '\u00A7',
      'And that changes everything.',
    ],
    standalone: [
      'Your cycle lives in your journal now.',
      '\u00A7',
      'The pattern does not disappear because you can see it. But seeing it means you are no longer only inside it. And the compassion you brought to both sides of it today will keep working, even when the cycle comes back.',
      '\u00A7',
      'Notice it. Name it. That is enough.',
    ],
  },
  couple: {
    withJourney: [
      'Your cycle lives in your journal now. You can look at it together anytime.',
      '\u00A7',
      'The pattern will come back. It always does. But now you have a shared language for it. And the next time one of you says \u201CI think we are in the cycle,\u201D the other one will know exactly what that means.',
      '\u00A7',
      'That shared knowing is the exit ramp.',
    ],
    standalone: [
      'Your cycle lives in your journal now. You can look at it together anytime.',
      '\u00A7',
      'The pattern will come back. But now you both know what it looks like from above. And you have felt both sides of it, together, with something other than blame.',
      '\u00A7',
      'The next time the cycle starts, see if one of you can name it. That is enough.',
    ],
  },
};

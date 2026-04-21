/**
 * Tailored Activity: A Conversation With Yourself
 * Focus: self-understanding
 *
 * Single section, progressive-reveal pattern (`persistBlocks: true`).
 * An inner dialogue between the part that asks and the part that knows,
 * revealed one voice at a time.
 *
 * Flow:
 *   [0] header + intro
 *   [1] + "The part that asks" — first question
 *   [2] + "The part that knows" — first answer
 *   [3] + "Asking again" — follow-up question
 *   [4] + "Answering again" — follow-up answer
 *   [5] + closing prompt — "What do you notice?"
 */

const HEADER = { type: 'header', title: 'A Conversation With Yourself', animation: 'sunset' };

const INTRO = { type: 'text', lines: [
  'Sometimes clarity comes from letting different parts of yourself speak.',
  '§',
  'This is a conversation between two perspectives within you — the part that questions and the part that knows. Let them talk to each other.',
] };

// Each voice is a pair of blocks: a small uppercase label + the prompt.
// Using `text` blocks with `header` would render in DM Serif but that
// duplicates the prompt's own DM Serif styling, so instead we use the
// prompt's `context` field for a subtler uppercase tag above each question.
const VOICES = [
  { type: 'prompt',
    context: 'THE PART THAT ASKS',
    prompt: 'What do you want to understand? What question is alive in you right now?',
    placeholder: 'What I want to understand...',
    journalLabel: 'The part that asks' },
  { type: 'prompt',
    context: 'THE PART THAT KNOWS',
    prompt: 'Let the part of you that senses what is true respond. What does it say?',
    placeholder: 'What I sense is true...',
    journalLabel: 'The part that knows' },
  { type: 'prompt',
    context: 'ASKING AGAIN',
    prompt: 'Does the answer raise a new question? Ask it.',
    placeholder: 'The next question...',
    journalLabel: 'Asking again' },
  { type: 'prompt',
    context: 'ANSWERING AGAIN',
    prompt: 'Let the knowing part respond once more.',
    placeholder: 'What I know...',
    journalLabel: 'Answering again' },
];

const CLOSING_PROMPT = {
  type: 'prompt',
  prompt: 'Read back through the conversation. What do you notice?',
  placeholder: 'What I notice...',
  journalLabel: 'What I notice',
};

// Debrief — revealed after the closing prompt, frames what the user just did
// and reassures them that the conversation is preserved in their journal.
const DEBRIEF = { type: 'text',
  header: 'A different perspective',
  lines: [
    'This conversation will be saved in your journal for you to come back to later if you wish.',
    '§',
    'Sometimes playing two sides can help you gain insight into your thinking, allowing you to step out of yourself for a moment and see yourself from a different perspective.',
  ],
};

const BASE = [HEADER, INTRO];
const screens = [
  { blocks: BASE },
  ...VOICES.map((_, i) => ({ blocks: [...BASE, ...VOICES.slice(0, i + 1)] })),
  { blocks: [...BASE, ...VOICES, CLOSING_PROMPT] },
  { blocks: [...BASE, ...VOICES, CLOSING_PROMPT, DEBRIEF] },
];

export const innerDialogueSections = [
  {
    id: 'inner-dialogue',
    type: 'screens',
    persistBlocks: true,
    ritualFade: true,
    screens,
  },
];

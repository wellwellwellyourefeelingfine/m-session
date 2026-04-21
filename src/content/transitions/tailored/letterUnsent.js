/**
 * Tailored Activity: A Letter You Don't Have to Send
 * Focus: relationship
 *
 * Single section, progressive-reveal pattern (`persistBlocks: true`).
 * Each Continue reveals the next writing prompt beneath the previous one.
 * The user's earlier responses stay visible as they work through the letter.
 *
 * Flow:
 *   [0] header + intro
 *   [1] + "Who are you writing to?"
 *   [2] + "What I've never told you..."
 *   [3] + "What I wish you understood..."
 *   [4] + "What I see now that I couldn't see before..."
 *   [5] + "What I need from you..."
 *   [6] + closing reflection — "How does it feel?"
 */

const HEADER = { type: 'header', title: "A Letter You Don't Have to Send", animation: 'sunset' };

const INTRO = { type: 'text', lines: [
  'Write to them as if they could truly hear you.',
  '§',
  "You don't have to send this. You don't have to show anyone. This is just for you — a way to understand what you really want to say.",
] };

const PROMPTS = [
  { type: 'prompt',
    prompt: 'Who are you writing to?',
    placeholder: 'Dear...',
    journalLabel: 'Dear' },
  { type: 'prompt',
    prompt: "What I've never told you...",
    placeholder: 'Write freely...',
    journalLabel: "What I've never told you" },
  { type: 'prompt',
    prompt: 'What I wish you understood...',
    placeholder: 'Write freely...',
    journalLabel: 'What I wish you understood' },
  { type: 'prompt',
    prompt: "What I see now that I couldn't see before...",
    placeholder: 'Write freely...',
    journalLabel: "What I see now that I couldn't see before" },
  { type: 'prompt',
    prompt: 'What I need from you...',
    placeholder: 'Write freely...',
    journalLabel: 'What I need from you' },
];

const CLOSING_PROMPT = {
  type: 'prompt',
  prompt: 'How does it feel, having said what you needed to say?',
  placeholder: 'It feels...',
  journalLabel: 'How it feels',
};

// Build the screens array progressively — [0] intro; [n] intro + first n
// prompts; [final] intro + all prompts + closing.
const BASE = [HEADER, INTRO];
const screens = [
  { blocks: BASE },
  ...PROMPTS.map((_, i) => ({ blocks: [...BASE, ...PROMPTS.slice(0, i + 1)] })),
  { blocks: [...BASE, ...PROMPTS, CLOSING_PROMPT] },
];

export const letterUnsentSections = [
  {
    id: 'letter-unsent',
    type: 'screens',
    persistBlocks: true,
    ritualFade: true,
    screens,
  },
];

/**
 * Tailored Activity: Sitting With Mystery
 * Focus: creativity (creative / existential)
 *
 * Single section, progressive-reveal pattern (`persistBlocks: true`).
 * Sit with what the session encountered — vision, meaning, mystery —
 * without rushing to resolve it.
 *
 * Flow:
 *   [0] header + intro
 *   [1] + first prompt — "What you encountered"
 *   [2] + second prompt — "What stays open"
 *   [3] + closing text — "Holding loosely"
 */

const HEADER = { type: 'header', title: 'Sitting With Mystery', animation: 'sunset' };

const INTRO = { type: 'text', lines: [
  "One way to work with what's here is to sit with what you encountered — vision, meaning, mystery.",
  '§',
  "These don't always resolve into neat answers. That's part of the territory.",
] };

const PROMPT_ONE = {
  type: 'prompt',
  context: 'WHAT YOU ENCOUNTERED',
  prompt: 'What arose in the session that feels larger than words? An image, a feeling, a knowing?',
  placeholder: 'What came through...',
  journalLabel: 'What I encountered',
};

const PROMPT_TWO = {
  type: 'prompt',
  context: 'WHAT STAYS OPEN',
  prompt: 'What question or mystery do you want to keep alive going forward?',
  placeholder: "The question I'm sitting with...",
  journalLabel: 'Question to keep alive',
};

const CLOSING = { type: 'text',
  header: 'Holding loosely',
  lines: [
    "You don't have to understand it all right now. Sit with what you encountered. Its meaning may unfold over days or weeks.",
  ],
};

const BASE = [HEADER, INTRO];

export const sittingWithMysterySections = [
  {
    id: 'sitting-with-mystery',
    type: 'screens',
    persistBlocks: true,
    ritualFade: true,
    screens: [
      { blocks: [...BASE] },
      { blocks: [...BASE, PROMPT_ONE] },
      { blocks: [...BASE, PROMPT_ONE, PROMPT_TWO] },
      { blocks: [...BASE, PROMPT_ONE, PROMPT_TWO, CLOSING] },
    ],
  },
];

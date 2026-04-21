/**
 * Tailored Activity: What Emerged (Open Reflection)
 * Focus: open
 *
 * Single section, progressive-reveal pattern (`persistBlocks: true`).
 * The intro text mounts first; each Continue reveals the next block beneath
 * via the persistBlocks auto-fade + smooth-scroll. The user's prior responses
 * stay on screen as they move through the activity.
 *
 * Flow:
 *   [0] header + intro text
 *   [1] + first prompt — "What stands out about the peak?"
 *   [2] + second prompt — "What might it be pointing toward?"
 *   [3] + closing text — "Letting it settle"
 */

const HEADER = { type: 'header', title: 'What Emerged', animation: 'sunset' };

const INTRO = { type: 'text', lines: [
  'Even without a specific direction, something usually emerges.',
  '§',
  "Let's take a few minutes to capture what came through.",
] };

const PROMPT_ONE = {
  type: 'prompt',
  prompt: 'What stands out about the peak? What felt important?',
  placeholder: 'What came up...',
  journalLabel: 'What arose',
};

const PROMPT_TWO = {
  type: 'prompt',
  prompt: 'If what emerged was a signal about something in your life, what might it be pointing toward?',
  placeholder: 'It might be about...',
  journalLabel: 'What it pointed to',
};

const CLOSING = { type: 'text',
  header: 'Letting it settle',
  lines: [
    'Sometimes the most useful insights come in the days ahead, not in the session itself. What you wrote here can be a starting point.',
  ],
};

export const openReflectionSections = [
  {
    id: 'open-reflection',
    type: 'screens',
    persistBlocks: true,
    ritualFade: true,
    screens: [
      { blocks: [HEADER, INTRO] },
      { blocks: [HEADER, INTRO, PROMPT_ONE] },
      { blocks: [HEADER, INTRO, PROMPT_ONE, PROMPT_TWO] },
      { blocks: [HEADER, INTRO, PROMPT_ONE, PROMPT_TWO, CLOSING] },
    ],
  },
];

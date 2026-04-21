/**
 * Tailored Activity: What Stays, What Goes
 * Focus: healing (processing what they're carrying)
 *
 * Single section, progressive-reveal pattern (`persistBlocks: true`).
 * Sort what's ready to go from what's worth keeping. Each of the two
 * writing prompts has its own sub-header + framing text revealed with it.
 *
 * Flow:
 *   [0] header + intro
 *   [1] + "What I'm Ready to Release" section (sub-header + text + prompt)
 *   [2] + "What I'm Keeping" section (sub-header + text + prompt)
 *   [3] + closing prompt — "How does it feel?"
 */

const HEADER = { type: 'header', title: 'What Stays, What Goes', animation: 'sunset' };

const INTRO = { type: 'text', lines: [
  "Processing isn't about fixing everything. It's about sorting — recognizing what you're ready to let go of, and what you're choosing to carry forward.",
  '§',
  'Take your time with this.',
] };

// Release: sub-header + description text + prompt (three blocks that reveal together).
const RELEASE_FRAMING = {
  type: 'text',
  header: "What I'm Ready to Release",
  lines: [
    "Old stories, beliefs that no longer serve, weight you've been carrying that isn't yours.",
  ],
};
const RELEASE_PROMPT = {
  type: 'prompt',
  prompt: '',
  placeholder: "I'm ready to let go of...",
  journalLabel: "What I'm ready to release",
};

// Keep: same pattern — sub-header + text + prompt.
const KEEP_FRAMING = {
  type: 'text',
  header: "What I'm Keeping",
  lines: [
    'Lessons learned, strength earned, truths that are yours.',
  ],
};
const KEEP_PROMPT = {
  type: 'prompt',
  prompt: '',
  placeholder: "I'm choosing to hold onto...",
  journalLabel: "What I'm keeping",
};

const CLOSING_PROMPT = {
  type: 'prompt',
  prompt: 'Look at what you wrote. How does it feel to name these things?',
  placeholder: 'It feels...',
  journalLabel: 'How it feels',
};

const BASE = [HEADER, INTRO];
const RELEASE = [RELEASE_FRAMING, RELEASE_PROMPT];
const KEEP = [KEEP_FRAMING, KEEP_PROMPT];

export const releaseKeepSections = [
  {
    id: 'release-keep',
    type: 'screens',
    persistBlocks: true,
    ritualFade: true,
    screens: [
      { blocks: [...BASE] },
      { blocks: [...BASE, ...RELEASE] },
      { blocks: [...BASE, ...RELEASE, ...KEEP] },
      { blocks: [...BASE, ...RELEASE, ...KEEP, CLOSING_PROMPT] },
    ],
  },
];

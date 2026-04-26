/**
 * Dialogue with a Protector — Part 2: "Understanding Your Protector"
 *
 * MasterModule content config replacing ProtectorDialoguePart2Module.jsx.
 * Lives at integration phase. Reads protector identity from
 * sessionProfile.protector (written by Part 1; falls back to inline
 * naming on the reconnect screen if Part 2 is run without Part 1).
 *
 * Flow: reconnect → how-parts-work → re-settle → exploring (3 prompts) →
 * fear-beneath → what-it-guards → dialogue (multi-turn loop) →
 * closing-prompts (3 prompts) → closing.
 */

import {
  STARTER_QUESTIONS,
  FEAR_BENEATH_SUGGESTIONS,
} from './protectorDialogueShared';

// Header reused across multi-screen progressive-reveal sections so the
// header DOM stays pinned (no re-fade) between screens.
const HOW_PARTS_HEADER = { type: 'header', title: 'How Parts Work', animation: 'ascii-moon' };
const EXPLORING_HEADER = { type: 'header', title: 'Going Deeper', animation: 'ascii-moon' };
const FEAR_HEADER = { type: 'header', title: 'The Fear Beneath', animation: 'ascii-moon' };
const CLOSING_PROMPTS_HEADER = { type: 'header', title: 'Looking Forward', animation: 'ascii-moon' };
const CLOSING_HEADER = { type: 'header', title: 'Closing Notes', animation: 'ascii-diamond' };

// Pre-baked text blocks reused across progressive-reveal screens so the
// shared blocks reconcile against the same React tree across screens.
// "How parts work" intro split across two text blocks so the section
// progressively reveals across three screens (intro 1 → intro 2 → logic)
// rather than dumping the full education in two large chunks. Each block
// is its own JS reference so persistBlocks reconciles cleanly.
const HOW_PARTS_INTRO_1 = { type: 'text', lines: [
  "Here's something worth understanding about how the mind organizes itself.",
  '§',
  'We all carry different parts. Not in a disordered way, but as a natural feature of being human. Everyone has them.',
] };

const HOW_PARTS_INTRO_2 = { type: 'text', lines: [
  'Some parts are protectors. They develop strategies to keep you safe: working harder, shutting down, staying vigilant, pleasing others, maintaining control, numbing out.',
  '§',
  "These strategies made sense when they first formed, usually in childhood or during a difficult time in your life. The problem is, most of them never updated. They're still running the old program.",
] };

const HOW_PARTS_LOGIC = { type: 'text', lines: [
  'Every protector has a logic to it. An internal reasoning that sounds something like:',
  '§',
  '"If I keep doing this, then the bad thing won\'t happen."',
  '§',
  "The Critic says: If I point out every flaw first, no one else can hurt me with their criticism.",
  '',
  'The Controller says: If I manage every detail, nothing will fall apart.',
  '',
  "The Avoider says: If I don't engage, I can't be overwhelmed.",
  '',
  "The Escape Artist says: If I find something else to focus on, I don't have to feel this.",
  '§',
  'The logic always made sense once. The question is whether it still does, and whether {protectorName} knows that things have changed.',
] };

const EXPLORING_AGE_INTRO = { type: 'text', lines: [
  "Not how long you've had it — the age it seems connected to. Protective patterns often carry the emotional energy of the period when they formed.",
  '§',
  "Close your eyes for a moment. A number, an impression, a feeling — it doesn't have to be precise.",
] };

const EXPLORING_AGE_PROMPT = {
  type: 'prompt',
  promptKey: 'exploring-age',
  prompt: 'What age does {protectorName} belong to?',
  placeholder: 'e.g., about 7, teenage, very young, not sure...',
  rows: 1,
  journalLabel: 'Age of pattern',
};

const EXPLORING_VERSION_INTRO = { type: 'text', lines: [
  "Protective patterns often operate as if nothing has changed since they formed. They respond to the world the way you needed to when you were younger, as if you're still that age. The pattern may be guarding against something that's no longer a threat — it just hasn't updated.",
] };

const EXPLORING_VERSION_PROMPT = {
  type: 'prompt',
  promptKey: 'exploring-version',
  prompt: 'What version of you does {protectorName} respond to?',
  placeholder: "e.g., it's connected to when I was about 10, it responds as if I'm still a teenager...",
  rows: 3,
  journalLabel: 'Version it responds to',
};

const EXPLORING_ORIGINS_INTRO = { type: 'text', lines: [
  'You may not have an exact memory. A sense is enough — a period, an atmosphere, a relationship. Something shifted, and this part stepped in.',
  '§',
  'Write whatever comes. Fragments are fine.',
] };

const EXPLORING_ORIGINS_PROMPT = {
  type: 'prompt',
  promptKey: 'exploring-origins',
  prompt: 'When did {protectorName} first take on its role?',
  placeholder: 'It probably started when...',
  rows: 5,
  journalLabel: 'Origins',
};

const FEAR_INTRO = { type: 'text', lines: [
  'Every protector is afraid of something. That fear is what keeps it locked in its pattern.',
  '§',
  "{protectorName} has been doing its job because it's afraid of what would happen if it stopped.",
  '§',
  'What is that fear?',
] };

const FEAR_SUGGESTIONS = {
  type: 'text',
  tightAbove: true,
  lines: [
    ...FEAR_BENEATH_SUGGESTIONS.map((s) => s),
    '§',
    'Or something else entirely.',
  ],
};

const FEAR_PROMPT = {
  type: 'prompt',
  promptKey: 'fear',
  prompt: 'In your own words: what is {protectorName} afraid would happen if it stopped doing its job?',
  placeholder: 'If it stopped, then...',
  rows: 4,
  journalLabel: 'The fear beneath',
};

const NEEDS_INTRO = { type: 'text', lines: [
  "Listen for what {protectorName} asks of you, not what you ask of it. Maybe permission to rest. Maybe to know you see how hard it has worked. Maybe to hear you're not a child anymore. Maybe just to know you're listening.",
] };

const NEEDS_PROMPT = {
  type: 'prompt',
  promptKey: 'needs',
  prompt: 'What does {protectorName} need from you?',
  placeholder: 'What it needs...',
  rows: 4,
  journalLabel: 'What it needs',
};

const REPLACE_INTRO = { type: 'text', lines: [
  "Protective patterns carry energy. When they soften, that energy doesn't disappear — it becomes available for something else. The critic's intensity might become encouragement. The controller's vigilance might become careful attention. The avoider's withdrawal might become genuine rest.",
] };

const REPLACE_PROMPT = {
  type: 'prompt',
  promptKey: 'replace',
  prompt: "If {protectorName} didn't have to run anymore, what might take its place?",
  placeholder: 'If this pattern softened, what might replace it...',
  rows: 4,
  journalLabel: 'What might take its place',
};

const INTENTION_INTRO = { type: 'text', lines: [
  "Something small and real, not a grand declaration. Something you can actually hold.",
  '§',
  'Examples: "I\'ll notice when this pattern fires, instead of just reacting." "I\'ll pause before I let it take over." "When this pattern fires, I\'ll remember I\'m not the age I was when it started."',
] };

const INTENTION_PROMPT = {
  type: 'prompt',
  promptKey: 'intention',
  prompt: "What's your intention with {protectorName}?",
  placeholder: 'My intention...',
  rows: 2,
  journalLabel: 'Intention',
};

export const protectorDialogueP2Content = {
  idleAnimation: 'ascii-moon',
  idle: {
    // Unified parent title — matches Part 1 so the activity reads as one
    // continuous practice across peak and integration.
    title: 'Dialogue with a Protector',
    subtitle: 'Part 2: Understanding Your Protector',
    // Description combines the IFS framing (change comes from relating, not
    // analyzing) with what this part will actually do — same idle pattern
    // as Part 1. No expandable; the conceptual hook lives inline.
    description:
      "This continues the IFS work from Part 1. Change doesn't come from analyzing or overriding a protective pattern — it comes from relating to it differently, with curiosity instead of control. In this second part, you'll go deeper with the protector you met: where it came from, how old it is, what it fears, and what it might need. You'll write to it directly and listen for what comes back.",
  },

  journal: {
    saveOnComplete: true,
    titlePrefix: 'PROTECTOR DIALOGUE — PART 2',
  },

  sections: [
    // ── A. Reconnect: welcome panel (or fallback inline naming) ────────────
    {
      id: 'reconnect',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Welcome Back', animation: 'ascii-moon' },
            { type: 'protector-reconnection' },
          ],
        },
      ],
    },

    // ── B. How parts work: 3-screen progressive reveal ─────────────────────
    {
      id: 'how-parts-work',
      type: 'screens',
      persistBlocks: true,
      screens: [
        { blocks: [HOW_PARTS_HEADER, HOW_PARTS_INTRO_1] },
        { blocks: [HOW_PARTS_HEADER, HOW_PARTS_INTRO_1, HOW_PARTS_INTRO_2] },
        { blocks: [HOW_PARTS_HEADER, HOW_PARTS_INTRO_1, HOW_PARTS_INTRO_2, HOW_PARTS_LOGIC] },
      ],
    },

    // ── C. Re-settling: check in with body location ────────────────────────
    {
      id: 're-settling',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Settling In', animation: 'ascii-moon' },
            { type: 'text', lines: [
              'Before we go further, take a breath. Feel your body.',
              '§',
              'Notice {protectorName} — where it lives in you. You felt it as {bodyLocation}.',
              '§',
              'See if you can be with it with some curiosity. Some openness.',
              '§',
              "If something else is getting in the way — a critical reaction, impatience, unease — take a moment to acknowledge it and gently set it aside.",
            ] },
          ],
        },
      ],
    },

    // ── D. Exploring: 3-screen progressive reveal of age/version/origins ───
    // Each screen shows orienting body text + a prompt whose `prompt` field
    // carries the actual question (DM Serif, directly above the input).
    {
      id: 'exploring',
      type: 'screens',
      persistBlocks: true,
      screens: [
        {
          blocks: [
            EXPLORING_HEADER,
            EXPLORING_AGE_INTRO,
            EXPLORING_AGE_PROMPT,
          ],
        },
        {
          blocks: [
            EXPLORING_HEADER,
            EXPLORING_AGE_INTRO,
            EXPLORING_AGE_PROMPT,
            EXPLORING_VERSION_INTRO,
            EXPLORING_VERSION_PROMPT,
          ],
        },
        {
          blocks: [
            EXPLORING_HEADER,
            EXPLORING_AGE_INTRO,
            EXPLORING_AGE_PROMPT,
            EXPLORING_VERSION_INTRO,
            EXPLORING_VERSION_PROMPT,
            EXPLORING_ORIGINS_INTRO,
            EXPLORING_ORIGINS_PROMPT,
          ],
        },
      ],
    },

    // ── E. Fear beneath: 2-screen progressive reveal ───────────────────────
    {
      id: 'fear-beneath',
      type: 'screens',
      persistBlocks: true,
      screens: [
        {
          blocks: [
            FEAR_HEADER,
            FEAR_INTRO,
            FEAR_SUGGESTIONS,
          ],
        },
        {
          blocks: [
            FEAR_HEADER,
            FEAR_INTRO,
            FEAR_SUGGESTIONS,
            FEAR_PROMPT,
          ],
        },
      ],
    },

    // ── F. What it guards: text-only beat (no animation) ───────────────────
    {
      id: 'what-it-guards',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'What It Guards', animation: null },
            { type: 'text', lines: [
              "Behind most protective patterns, there's something more tender. A feeling. A memory. Something that was too much to process at the time.",
              '§',
              "The protector stands between you and that tenderness. That's its entire purpose.",
              '§',
              "You don't need to go there right now. Trust the pace of this. Understanding the protective pattern is the work right now.",
              '§',
              "If more surfaces over time, it will. There's no need to force it.",
            ] },
          ],
        },
      ],
    },

    // ── G. Dialogue: written Q&A on one continuous page ────────────────────
    // Inputs reveal one at a time as the user advances (Continue → response,
    // Continue → next question). After two complete exchanges, an "Ask more"
    // link appears; Continue then advances the section.
    {
      id: 'dialogue',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'A Conversation', animation: 'ascii-moon' },
            {
              type: 'dialogue-loop',
              responsesKey: 'protector-dialogue-exchanges',
              journalLabel: 'Dialogue',
              starterQuestions: STARTER_QUESTIONS,
              starterToggleLabel: 'Example Questions',
              questionPrompt: 'What would you like to ask {protectorName}?',
              questionPlaceholder: 'Write a question for {protectorName}...',
              responsePrompt: 'What came back?',
              responsePlaceholder: 'Write what came back...',
              introLines: [
                "You're going to have a written dialogue with {protectorName}.",
                '§',
                'Ask a question, then notice what comes back — not what you think the answer should be, whatever surfaces. It might come as words, an image, a feeling, or a body sensation.',
                '§',
                "Ask, then wait. Receive, don't construct.",
              ],
            },
          ],
        },
      ],
    },

    // ── H. Closing prompts: 3-screen progressive reveal ────────────────────
    // Each screen layers orienting body text + a prompt whose `prompt`
    // field carries the actual question (DM Serif above the input).
    {
      id: 'closing-prompts',
      type: 'screens',
      persistBlocks: true,
      screens: [
        {
          blocks: [
            CLOSING_PROMPTS_HEADER,
            NEEDS_INTRO,
            NEEDS_PROMPT,
          ],
        },
        {
          blocks: [
            CLOSING_PROMPTS_HEADER,
            NEEDS_INTRO,
            NEEDS_PROMPT,
            REPLACE_INTRO,
            REPLACE_PROMPT,
          ],
        },
        {
          blocks: [
            CLOSING_PROMPTS_HEADER,
            NEEDS_INTRO,
            NEEDS_PROMPT,
            REPLACE_INTRO,
            REPLACE_PROMPT,
            INTENTION_INTRO,
            INTENTION_PROMPT,
          ],
        },
      ],
    },

    // ── I. Closing: 2-screen progressive reveal with diamond ───────────────
    {
      id: 'closing',
      type: 'screens',
      persistBlocks: true,
      ritualFade: true,
      screens: [
        {
          blocks: [
            CLOSING_HEADER,
            { type: 'text', lines: [
              "This is parts work — the same approach a therapist might use, just self-directed. It doesn't require a special state of mind or a particular setting. The questions you asked here can be asked again any time: in a journal, in a quiet hour, the next time {protectorName} surfaces.",
            ] },
          ],
        },
        {
          blocks: [
            CLOSING_HEADER,
            { type: 'text', lines: [
              "This is parts work — the same approach a therapist might use, just self-directed. It doesn't require a special state of mind or a particular setting. The questions you asked here can be asked again any time: in a journal, in a quiet hour, the next time {protectorName} surfaces.",
            ] },
            { type: 'text', lines: [
              "Understanding a protective pattern isn't an event with an endpoint. It's an ongoing relationship that updates each time you turn toward it instead of away.",
              '§',
              "Nothing here needs resolving today. {protectorName} will be there when you come back.",
            ] },
          ],
        },
      ],
    },
  ],
};

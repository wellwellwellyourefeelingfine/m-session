/**
 * Tailored Activity: A Letter You Don't Have to Send
 * Focus: relationship
 *
 * Write to someone as if they could truly hear you. Not to send — to clarify
 * what's true for you. 4-screen flow: intro → write → review → closing.
 */

export const letterUnsentSections = [
  {
    id: 'letter-intro',
    type: 'screens',
    ritualFade: true,
    screens: [
      {
        blocks: [
          { type: 'header', title: "A Letter You Don't Have to Send", animation: 'sunset' },
          { type: 'text', lines: [
            'Write to them as if they could truly hear you.',
            '§',
            "You don't have to send this. You don't have to show anyone. This is just for you — a way to understand what you really want to say.",
          ] },
        ],
      },
    ],
  },
  {
    id: 'letter-write',
    type: 'screens',
    screens: [
      {
        blocks: [
          { type: 'header', title: 'Dear...', animation: 'sunset' },
          { type: 'prompt',
            prompt: 'Who are you writing to?',
            placeholder: 'Dear...',
          },
        ],
      },
      {
        blocks: [
          { type: 'prompt',
            prompt: "What I've never told you...",
            placeholder: 'Write freely...',
          },
        ],
      },
      {
        blocks: [
          { type: 'prompt',
            prompt: 'What I wish you understood...',
            placeholder: 'Write freely...',
          },
        ],
      },
      {
        blocks: [
          { type: 'prompt',
            prompt: "What I see now that I couldn't see before...",
            placeholder: 'Write freely...',
          },
        ],
      },
      {
        blocks: [
          { type: 'prompt',
            prompt: 'What I need from you...',
            placeholder: 'Write freely...',
          },
        ],
      },
    ],
  },
  {
    id: 'letter-review',
    type: 'screens',
    ritualFade: true,
    screens: [
      {
        blocks: [
          { type: 'header', title: 'Read What You Wrote', animation: 'sunset' },
          { type: 'text', lines: [
            'Take a moment with what you\'ve written. You don\'t have to change anything.',
          ] },
          { type: 'review', assembleFrom: [0, 1, 2, 3, 4], editable: true },
        ],
      },
    ],
  },
  {
    id: 'letter-closing',
    type: 'screens',
    ritualFade: true,
    screens: [
      {
        blocks: [
          { type: 'header', title: 'Closing', animation: 'sunset' },
          { type: 'prompt',
            prompt: 'How does it feel, having said what you needed to say?',
            placeholder: 'It feels...',
          },
        ],
      },
    ],
  },
];

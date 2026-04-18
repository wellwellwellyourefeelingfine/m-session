/**
 * Tailored Activity: What You're Reclaiming
 * Focus: reconnecting
 *
 * Reconnect with something you've lost touch with — a feeling, a quality,
 * a part of who you are.
 */

export const reclaimingSections = [
  {
    id: 'reclaiming-intro',
    type: 'screens',
    ritualFade: true,
    screens: [
      {
        blocks: [
          { type: 'header', title: "What You're Reclaiming", animation: 'sunset' },
          { type: 'text', lines: [
            'Disconnection happens slowly — pieces of ourselves get lost, set aside, forgotten. Reconnection is about calling those pieces home.',
            '§',
            'What have you found again today?',
          ] },
        ],
      },
    ],
  },
  {
    id: 'reclaiming-write',
    type: 'screens',
    screens: [
      {
        blocks: [
          { type: 'header', title: 'What Part', animation: 'sunset' },
          { type: 'prompt',
            prompt: 'What part of yourself are you reclaiming?',
            placeholder: "I'm reclaiming...",
          },
        ],
      },
      {
        blocks: [
          { type: 'header', title: 'What Was Lost', animation: 'sunset' },
          { type: 'prompt',
            prompt: 'When did you first notice it was missing? What covered it?',
            placeholder: 'It went quiet when...',
          },
        ],
      },
      {
        blocks: [
          { type: 'header', title: 'How to Hold It', animation: 'sunset' },
          { type: 'prompt',
            prompt: 'Now that you\'ve found it again, how will you keep it close?',
            placeholder: "I'll keep it close by...",
          },
        ],
      },
    ],
  },
  {
    id: 'reclaiming-closing',
    type: 'screens',
    ritualFade: true,
    screens: [
      {
        blocks: [
          { type: 'header', title: 'Welcome Back', animation: 'sunset' },
          { type: 'text', lines: [
            'Whatever you\'ve reclaimed is yours. It was always yours. You just needed to remember.',
          ] },
        ],
      },
    ],
  },
];

/**
 * Tailored Activity: Sitting With Mystery
 * Focus: creativity (creative / existential)
 *
 * Sit with what the session encountered — vision, meaning, mystery.
 */

export const sittingWithMysterySections = [
  {
    id: 'mystery-intro',
    type: 'screens',
    ritualFade: true,
    screens: [
      {
        blocks: [
          { type: 'header', title: 'Sitting With Mystery', animation: 'sunset' },
          { type: 'text', lines: [
            'You came to this session open to deeper questions. One way to work with what\'s here is to sit with what you encountered — vision, meaning, mystery.',
            '§',
            'These don\'t always resolve into neat answers. That\'s part of the territory.',
          ] },
        ],
      },
    ],
  },
  {
    id: 'mystery-write',
    type: 'screens',
    screens: [
      {
        blocks: [
          { type: 'header', title: 'What You Encountered', animation: 'sunset' },
          { type: 'prompt',
            prompt: 'What arose in the session that feels larger than words? An image, a feeling, a knowing?',
            placeholder: 'What came through...',
          },
        ],
      },
      {
        blocks: [
          { type: 'header', title: 'What Stays Open', animation: 'sunset' },
          { type: 'prompt',
            prompt: 'What question or mystery do you want to keep alive going forward?',
            placeholder: "The question I'm sitting with...",
          },
        ],
      },
    ],
  },
  {
    id: 'mystery-closing',
    type: 'screens',
    ritualFade: true,
    screens: [
      {
        blocks: [
          { type: 'header', title: 'Holding Loosely', animation: 'sunset' },
          { type: 'text', lines: [
            'You don\'t have to understand it all right now. Sit with what you encountered. Its meaning may unfold over days or weeks.',
          ] },
        ],
      },
    ],
  },
];

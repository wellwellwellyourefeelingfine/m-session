/**
 * Tailored Activity: Open Reflection
 * Focus: open
 *
 * Capture what came through without a fixed agenda.
 */

export const openReflectionSections = [
  {
    id: 'open-reflection-intro',
    type: 'screens',
    ritualFade: true,
    screens: [
      {
        blocks: [
          { type: 'header', title: 'What Emerged', animation: 'sunset' },
          { type: 'text', lines: [
            'You came to this session without a fixed agenda. That takes trust.',
            '§',
            'Even without a specific direction, something usually emerges. Let\'s take a few minutes to capture what came through.',
          ] },
        ],
      },
    ],
  },
  {
    id: 'open-reflection-write',
    type: 'screens',
    screens: [
      {
        blocks: [
          { type: 'header', title: 'What Arose', animation: 'sunset' },
          { type: 'prompt',
            prompt: 'What stands out about the peak? What felt important?',
            placeholder: 'What came up...',
          },
        ],
      },
      {
        blocks: [
          { type: 'header', title: 'What It Pointed To', animation: 'sunset' },
          { type: 'prompt',
            prompt: 'If what emerged was a signal about something in your life, what might it be pointing toward?',
            placeholder: 'It might be about...',
          },
        ],
      },
    ],
  },
  {
    id: 'open-reflection-closing',
    type: 'screens',
    ritualFade: true,
    screens: [
      {
        blocks: [
          { type: 'header', title: 'Letting It Settle', animation: 'sunset' },
          { type: 'text', lines: [
            'Sometimes the most useful insights come in the days ahead, not in the session itself. What you wrote here can be a starting point.',
          ] },
        ],
      },
    ],
  },
];

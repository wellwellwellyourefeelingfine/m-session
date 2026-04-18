/**
 * Tailored Activity: What Stays, What Goes
 * Focus: processing / healing (shared between both)
 *
 * Sort what you're ready to let go of from what you're choosing to carry forward.
 */

export const releaseKeepSections = [
  {
    id: 'release-keep-intro',
    type: 'screens',
    ritualFade: true,
    screens: [
      {
        blocks: [
          { type: 'header', title: 'What Stays, What Goes', animation: 'sunset' },
          { type: 'text', lines: [
            "Processing isn't about fixing everything. It's about sorting — recognizing what you're ready to let go of, and what you're choosing to carry forward.",
            '§',
            'Take your time with this.',
          ] },
        ],
      },
    ],
  },
  {
    id: 'release-keep-write',
    type: 'screens',
    screens: [
      {
        blocks: [
          { type: 'header', title: "What I'm Ready to Release", animation: 'sunset' },
          { type: 'text', lines: [
            "Old stories, beliefs that no longer serve, weight you've been carrying that isn't yours.",
          ] },
          { type: 'prompt',
            prompt: '',
            placeholder: "I'm ready to let go of...",
          },
        ],
      },
      {
        blocks: [
          { type: 'header', title: "What I'm Keeping", animation: 'sunset' },
          { type: 'text', lines: [
            'Lessons learned, strength earned, truths that are yours.',
          ] },
          { type: 'prompt',
            prompt: '',
            placeholder: "I'm choosing to hold onto...",
          },
        ],
      },
    ],
  },
  {
    id: 'release-keep-closing',
    type: 'screens',
    ritualFade: true,
    screens: [
      {
        blocks: [
          { type: 'header', title: 'How It Feels', animation: 'sunset' },
          { type: 'prompt',
            prompt: 'Look at what you wrote. How does it feel to name these things?',
            placeholder: 'It feels...',
          },
        ],
      },
    ],
  },
];

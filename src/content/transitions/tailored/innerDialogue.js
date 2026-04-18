/**
 * Tailored Activity: A Conversation With Yourself
 * Focus: self-understanding
 *
 * A two-voice inner dialogue. Sometimes clarity comes from letting
 * different parts of yourself speak.
 */

export const innerDialogueSections = [
  {
    id: 'dialogue-intro',
    type: 'screens',
    ritualFade: true,
    screens: [
      {
        blocks: [
          { type: 'header', title: 'A Conversation With Yourself', animation: 'sunset' },
          { type: 'text', lines: [
            'Sometimes clarity comes from letting different parts of yourself speak.',
            '§',
            'This is a conversation between two perspectives within you — the part that questions and the part that knows. Let them talk to each other.',
          ] },
        ],
      },
    ],
  },
  {
    id: 'dialogue-voices',
    type: 'screens',
    screens: [
      {
        blocks: [
          { type: 'header', title: 'The Part That Asks', animation: 'sunset' },
          { type: 'prompt',
            prompt: 'What do you want to understand? What question is alive in you right now?',
            placeholder: 'What I want to understand...',
          },
        ],
      },
      {
        blocks: [
          { type: 'header', title: 'The Part That Knows', animation: 'sunset' },
          { type: 'prompt',
            prompt: 'Let the part of you that senses what is true respond. What does it say?',
            placeholder: 'What I sense is true...',
          },
        ],
      },
      {
        blocks: [
          { type: 'header', title: 'Asking Again', animation: 'sunset' },
          { type: 'prompt',
            prompt: 'Does the answer raise a new question? Ask it.',
            placeholder: 'The next question...',
          },
        ],
      },
      {
        blocks: [
          { type: 'header', title: 'Answering Again', animation: 'sunset' },
          { type: 'prompt',
            prompt: 'Let the knowing part respond once more.',
            placeholder: 'What I know...',
          },
        ],
      },
    ],
  },
  {
    id: 'dialogue-review',
    type: 'screens',
    ritualFade: true,
    screens: [
      {
        blocks: [
          { type: 'header', title: 'Read the Conversation', animation: 'sunset' },
          { type: 'review', assembleFrom: [0, 1, 2, 3], editable: false },
        ],
      },
    ],
  },
  {
    id: 'dialogue-closing',
    type: 'screens',
    ritualFade: true,
    screens: [
      {
        blocks: [
          { type: 'header', title: 'Notice', animation: 'sunset' },
          { type: 'prompt',
            prompt: 'Read what you wrote. What do you notice?',
            placeholder: 'What I notice...',
          },
        ],
      },
    ],
  },
];

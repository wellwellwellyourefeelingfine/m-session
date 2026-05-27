/**
 * Section B: Intention & Focus
 * Questions about user's intentions and emotional state
 */

export const sectionBQuestions = [
  {
    field: 'primaryFocus',
    type: 'single-select',
    label: 'What is your primary focus for this session?',
    options: [
      { value: 'self-understanding', label: 'Self-understanding' },
      { value: 'healing', label: 'Emotional healing' },
      { value: 'relationship', label: 'Relationship exploration' },
      { value: 'creativity', label: 'Creativity & insight' },
      { value: 'open', label: 'Open exploration' },
    ],
  },
];

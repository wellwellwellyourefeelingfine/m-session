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
  {
    field: 'holdingQuestion',
    type: 'text',
    label: 'Is there a question you are holding?',
    description: 'Optional - something you want to explore or understand.',
    placeholder: 'What would you like to explore?',
    required: false,
    multiline: true,
  },
  {
    field: 'emotionalState',
    type: 'single-select',
    label: 'How would you describe your current emotional state?',
    options: [
      { value: 'calm', label: 'Calm and centered' },
      { value: 'anxious', label: 'Some anxiety' },
      { value: 'excited', label: 'Excited and open' },
      { value: 'heavy', label: 'Carrying heaviness' },
      { value: 'neutral', label: 'Neutral' },
    ],
  },
];

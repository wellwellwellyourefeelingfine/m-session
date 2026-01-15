/**
 * Section A: Experience & Context
 * Questions about user's experience level and session setup
 */

export const sectionAQuestions = [
  {
    field: 'experienceLevel',
    type: 'single-select',
    label: 'What is your experience level?',
    options: [
      { value: 'first-time', label: 'First time' },
      { value: 'beginner', label: '1-3 sessions' },
      { value: 'experienced', label: '4+ sessions' },
    ],
  },
  {
    field: 'sessionMode',
    type: 'single-select',
    label: 'How are you planning this session?',
    options: [
      { value: 'solo', label: 'Solo' },
      { value: 'with-partner', label: 'With a partner' },
      { value: 'with-sitter', label: 'With a sitter' },
      { value: 'group', label: 'Group setting' },
    ],
  },
  {
    field: 'hasPreparation',
    type: 'single-select',
    label: 'Have you prepared for this session?',
    description: 'This includes setting intentions, preparing your space, etc.',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'somewhat', label: 'Somewhat' },
      { value: 'no', label: 'Not yet' },
    ],
  },
];

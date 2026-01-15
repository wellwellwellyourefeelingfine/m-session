/**
 * Section C: Session Preferences
 * Questions about guidance level and activity preferences
 */

export const sectionCQuestions = [
  {
    field: 'guidanceLevel',
    type: 'single-select',
    label: 'How much guidance would you like?',
    options: [
      { value: 'full', label: 'Full guidance' },
      { value: 'moderate', label: 'Moderate guidance' },
      { value: 'minimal', label: 'Minimal - mostly open space' },
    ],
  },
  {
    field: 'activityPreferences',
    type: 'multi-select',
    label: 'What activities interest you?',
    description: 'Select all that apply.',
    options: [
      { value: 'journaling', label: 'Journaling' },
      { value: 'meditation', label: 'Meditation' },
      { value: 'music', label: 'Music listening' },
      { value: 'movement', label: 'Gentle movement' },
      { value: 'breathing', label: 'Breathwork' },
    ],
  },
  {
    field: 'sessionDuration',
    type: 'single-select',
    label: 'Expected session duration?',
    options: [
      { value: 'short', label: '3-4 hours' },
      { value: 'medium', label: '4-6 hours' },
      { value: 'long', label: '6+ hours' },
    ],
  },
  {
    field: 'startTime',
    type: 'time',
    label: 'What time are you starting?',
    required: false,
  },
];

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
    field: 'considerBooster',
    type: 'single-select',
    label: 'Would you like to consider a supplemental dose?',
    description: 'Some people choose to take a smaller "booster" dose partway through their session to extend the experience. This is entirely optional.',
    options: [
      { value: 'yes', label: 'Yes, I\'d like to consider it' },
      { value: 'no', label: 'No, just one dose' },
      { value: 'decide-later', label: 'I\'ll decide during the session' },
    ],
  },
  // Note: startTime question removed - now handled when user clicks Begin Session
];

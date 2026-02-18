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
  // Note: considerBooster moved to Section D (Safety & Practicality)
  // Note: startTime question removed - now handled when user clicks Begin Session
];

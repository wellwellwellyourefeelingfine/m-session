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
  // Note: considerBooster moved to Section D (Safety & Practicality)
  // Note: startTime question removed - now handled when user clicks Begin Session
];

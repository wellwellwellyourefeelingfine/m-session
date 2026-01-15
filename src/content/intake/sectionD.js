/**
 * Section D: Safety & Practicality
 * Questions about safety setup and health considerations
 */

export const sectionDQuestions = [
  {
    field: 'safeSpace',
    type: 'single-select',
    label: 'Do you have a safe, comfortable space prepared?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'mostly', label: 'Mostly ready' },
      { value: 'no', label: 'Not yet' },
    ],
  },
  {
    field: 'hasWaterSnacks',
    type: 'single-select',
    label: 'Do you have water and light snacks available?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    field: 'emergencyContact',
    type: 'single-select',
    label: 'Does someone know you are having this experience?',
    description: 'A trusted person who could be contacted if needed.',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no-okay', label: 'No, but I am comfortable' },
      { value: 'no-concerned', label: 'No, and I am concerned' },
    ],
  },
  {
    field: 'heartConditions',
    type: 'single-select',
    label: 'Do you have any heart conditions?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
    ],
  },
  {
    field: 'psychiatricHistory',
    type: 'single-select',
    label: 'Do you have a history of psychosis or severe psychiatric conditions?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
    ],
  },
];

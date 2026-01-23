/**
 * Section D: Safety & Practicality
 * Questions about safety setup and health considerations
 */

export const sectionDQuestions = [
  {
    field: 'hasMDMA',
    type: 'single-select',
    label: 'Do you have your MDMA?',
    contentBlocks: [
      { type: 'spacer' },
      { type: 'text', text: 'Of course, you can also choose to do this session without any substances as well.', color: 'grey' },
    ],
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'not-yet', label: 'Not yet' },
    ],
  },
  {
    field: 'hasTested',
    type: 'single-select',
    label: 'Have you tested your MDMA yet?',
    contentBlocks: [
      { type: 'spacer' },
      { type: 'text', text: 'We recommend testing your MDMA either with an at-home kit or by sending it to a lab service.' },
      { type: 'spacer' },
      { type: 'text', text: 'Check out the Resources in the Tools tab for more information.', color: 'grey' },
    ],
    skipWhen: { field: 'hasMDMA', value: 'not-yet' },
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'not-yet', label: 'Not yet' },
    ],
  },
  {
    field: 'hasResearchedDosage',
    type: 'single-select',
    label: 'Have you researched the dosage you wish to take?',
    contentBlocks: [
      { type: 'spacer' },
      { type: 'text', text: 'The standard therapeutic dose used in clinical settings is 80\u2013120mg. We recommend staying within this range.' },
      { type: 'spacer' },
      { type: 'text', text: 'If your MDMA is in crystal form, you will need a milligram-sensitive scale (often called a jewelry scale, accurate to 0.001g) to measure properly. Standard kitchen scales are not precise enough.', color: 'grey' },
    ],
    skipWhen: { field: 'hasMDMA', value: 'not-yet' },
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'not-yet', label: 'Not yet' },
    ],
  },
  {
    field: 'physicalPreparation',
    type: 'single-select',
    label: 'Have you prepared your body for this session?',
    contentBlocks: [
      { type: 'spacer' },
      { type: 'text', text: 'To prepare your body for your session, we recommend:' },
      { type: 'list', items: [
        'Being well-rested (avoid sleep deprivation)',
        'Eating a light meal 2\u20133 hours beforehand',
        'Avoiding alcohol for at least 24 hours before',
        'Limiting or avoiding caffeine on session day',
      ]},
      { type: 'spacer' },
      { type: 'text', text: 'These factors meaningfully affect how your body processes MDMA and how you feel during the experience.', color: 'grey' },
    ],
    skipWhen: { field: 'hasMDMA', value: 'not-yet' },
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'not-yet', label: 'Not yet' },
    ],
  },
  {
    field: 'lastMDMAUse',
    type: 'single-select',
    label: 'When did you last use MDMA?',
    skipWhen: { field: 'hasMDMA', value: 'not-yet' },
    options: [
      { value: 'first-time', label: 'This is my first time' },
      { value: 'more-than-3-months', label: 'More than 3 months ago' },
      { value: '1-3-months', label: '1\u20133 months ago' },
      { value: 'less-than-1-month', label: 'Less than 1 month ago' },
      { value: 'unsure', label: 'I\u2019m not sure' },
    ],
  },
  {
    field: 'emergencyContact',
    type: 'single-select',
    label: 'Does someone know you are having this experience?',
    contentBlocks: [
      { type: 'spacer' },
      { type: 'text', text: 'An in-person sitter is ideal. If that isn\'t possible, let someone trusted know at least a day beforehand.', color: 'grey' },
    ],
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no-okay', label: 'No, but I am comfortable' },
      { value: 'no-concerned', label: 'No, and I am concerned' },
    ],
  },
  {
    field: 'contraindicatedMedications',
    type: 'single-select',
    label: 'Do you currently take any of the following medications?',
    contentBlocks: [
      { type: 'spacer' },
      { type: 'list', items: [
        'MAOIs (Nardil, Parnate, Marplan)',
        'SSRIs (Prozac, Zoloft, Lexapro, Paxil)',
        'SNRIs (Effexor, Cymbalta, Pristiq)',
        'Lithium',
        'Tramadol',
        'DXM (cough suppressants)',
        'HIV protease inhibitors (Ritonavir)',
        'Stimulants (Adderall, Ritalin)',
      ]},
    ],
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
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

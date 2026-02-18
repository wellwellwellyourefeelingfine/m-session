/**
 * Section D: Safety & Practicality
 * Questions about safety setup and health considerations
 */

export const sectionDQuestions = [
  {
    field: 'hasResearchedDosage',
    type: 'dosage-calculator',
    label: 'Have you considered what dosage you plan to take?',
    required: false,
  },
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
      { type: 'accent-link', text: 'Check out the Resources in the Tools tab for more information.', action: { tab: 'tools', tool: 'dosage', section: 'testing' } },
    ],
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'not-yet', label: 'Not yet' },
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
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'not-yet', label: 'Not yet' },
    ],
  },
  {
    field: 'lastMDMAUse',
    type: 'single-select',
    label: 'When did you last use MDMA?',
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
    contentBlocks: [
      { type: 'spacer' },
      { type: 'text', text: 'MDMA significantly increases heart rate and blood pressure, sometimes for several hours. This includes conditions such as:' },
      { type: 'list', items: [
        'High blood pressure (hypertension)',
        'Heart arrhythmias or irregular heartbeat',
        'History of heart attack or stroke',
        'Heart valve conditions',
        'Cardiomyopathy',
      ]},
      { type: 'spacer' },
      { type: 'text', text: 'If you have any cardiovascular concerns, we strongly recommend consulting a healthcare provider before proceeding.', color: 'grey' },
    ],
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
    ],
  },
  {
    field: 'psychiatricHistory',
    type: 'single-select',
    label: 'Do you have a history of psychosis or severe psychiatric conditions?',
    contentBlocks: [
      { type: 'spacer' },
      { type: 'text', text: 'MDMA can temporarily alter perception and emotional processing in powerful ways. For most people this is manageable, but certain conditions carry elevated risk:' },
      { type: 'list', items: [
        'Schizophrenia or schizoaffective disorder',
        'Bipolar disorder (especially with psychotic features)',
        'History of psychotic episodes',
        'Severe dissociative disorders',
      ]},
      { type: 'spacer' },
      { type: 'text', text: 'If any of these apply, please consult a mental health professional before proceeding. This is not about judgment \u2014 it\u2019s about ensuring your safety during a vulnerable experience.', color: 'grey' },
    ],
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
    ],
  },
];

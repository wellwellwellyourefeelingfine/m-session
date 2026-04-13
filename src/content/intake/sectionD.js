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
    field: 'hasTested',
    type: 'single-select',
    label: 'Have you tested your MDMA yet?',
    contentBlocks: [
      { type: 'spacer' },
      { type: 'text', text: 'We recommend testing your MDMA either with an at-home kit or by sending it to a lab service.' },
      { type: 'spacer' },
      { type: 'accent-link', text: 'Substance Testing', action: { tab: 'tools', tool: 'dosage', section: 'testing' } },
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
    contentBlocks: [
      { type: 'spacer' },
      { type: 'text', text: 'Some people choose to take a smaller "booster" dose partway through their session to extend the experience. This is entirely optional.' },
      { type: 'spacer' },
      { type: 'accent-link', text: 'Booster Dose', action: { tab: 'tools', tool: 'faq', section: 'booster' } },
    ],
    options: [
      { value: 'yes', label: 'Yes, I\'d like to consider it' },
      { value: 'no', label: 'No, just one dose' },
      { value: 'decide-later', label: 'I\'ll decide during the session' },
    ],
  },
  {
    field: 'physicalPreparation',
    type: 'single-select',
    label: 'Do you feel physically ready for a session?',
    contentBlocks: [
      { type: 'spacer' },
      { type: 'text', text: 'An MDMA session can be demanding of the body. We recommend:' },
      { type: 'list', items: [
        'Being well-rested',
        'Eating a light meal 2\u20133 hours beforehand',
        'Avoiding alcohol for at least 24 hours before',
        'Limiting or avoiding caffeine on session day',
      ]},
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
    field: 'emergencyContactDetails',
    type: 'contact-input',
    label: 'Who can you contact if you need help?',
    required: false,
    contentBlocks: (profile) => [
      { type: 'spacer' },
      { type: 'text', text: 'It\u2019s best practice to have an emergency contact: someone you\u2019ve reached out to before your session to let them know what you\u2019re planning. This can be as simple as a text letting them know you\u2019d like them to be available during this time.' },
      ...(profile.sessionMode === 'with-sitter'
        ? [
            { type: 'spacer' },
            { type: 'text', text: 'You\u2019ve indicated you\u2019re using this app with a sitter, but if you\u2019d still like to add or update emergency details below, you can.' },
          ]
        : []),
      { type: 'spacer' },
      { type: 'text', text: 'Both fields are optional. You can also add or update these details later from within the app.', color: 'grey' },
    ],
    inputs: [
      { field: 'name', placeholder: 'Emergency Name', required: false },
      { field: 'phone', placeholder: 'Emergency Number', required: false, inputMode: 'tel' },
    ],
  },
  {
    field: 'contraindicatedMedications',
    type: 'single-select',
    label: 'Do you currently take any of the following medications?',
    neutralOptions: true,
    contentBlocks: [
      { type: 'spacer' },
      { type: 'list', items: [
        'MAOIs (Nardil, Parnate, Marplan)',
        'SSRIs (Prozac, Zoloft, Lexapro, Paxil)',
        'SNRIs (Effexor, Cymbalta, Pristiq)',
        'Lithium',
        'Tramadol',
        'DXM (cough suppressants)',
        'Ritonavir, cobicistat, or HIV drugs containing them',
        'Stimulants (Adderall, Ritalin)',
      ]},
      { type: 'spacer' },
      { type: 'text', text: 'These medications interact with MDMA in various ways. Some (like MAOIs and CYP450 inhibitors such as ritonavir) are genuinely dangerous and should not be combined. Others (like SSRIs and SNRIs) primarily block MDMA\'s effects rather than creating dangerous interactions. The risks and appropriate actions differ by medication — consult your prescribing physician before making any changes to your medication regimen.' },
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
    neutralOptions: true,
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
      { type: 'text', text: 'If you have any cardiovascular concerns, we strongly recommend consulting a healthcare provider before proceeding.' },
    ],
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    field: 'psychiatricHistory',
    type: 'single-select',
    label: 'Do you have a history of psychosis or severe psychiatric conditions?',
    neutralOptions: true,
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
      { type: 'text', text: 'If any of these apply, please consult a mental health professional before proceeding. This is not about judgment \u2014 it\u2019s about ensuring your safety during a vulnerable experience.' },
    ],
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
];

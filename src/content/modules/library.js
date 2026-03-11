/**
 * Module Library
 * Central repository of all available session modules
 * Each module has metadata about when/how it can be used
 *
 * CAPABILITIES SYSTEM:
 * Each module can define a `capabilities` object that controls how it renders.
 * See src/components/active/capabilities/index.js for full schema documentation.
 *
 * Capability types:
 * - timer: { type, showProgress, showTimeDisplay, autoComplete }
 * - prompts: { type, fadeTransition, showProgress }
 * - animation: { type, color, size }
 * - audio: { type, src, showMuteButton } (future)
 * - input: { type, saveToJournal, placeholder }
 * - controls: { showBeginButton, showPauseButton, showSkipButton, etc. }
 * - layout: { centered, maxWidth, padding }
 */

// Display order and labels for module categories in the Add Activity drawer
export const MODULE_CATEGORIES = {
  'pre-session': { label: 'Pre-Session', order: 0 },
  meditation: { label: 'Meditation', order: 1 },
  activity: { label: 'Activity', order: 2 },
  journaling: { label: 'Journaling', order: 3 },
  open: { label: 'Open', order: 4 },
};

export const MODULE_TYPES = {
  'breath-meditation': { label: 'Breath Meditation', intensity: 'gentle' },
  'music-listening': { label: 'Music Listening', intensity: 'gentle' },
  'open-awareness': { label: 'Open Awareness', intensity: 'moderate' },
  'body-scan': { label: 'Body Scan', intensity: 'gentle' },
  'simple-grounding': { label: 'Simple Grounding', intensity: 'gentle' },
  'short-grounding': { label: 'Basic Grounding', intensity: 'gentle' },
  'light-journaling': { label: 'Light Journaling', intensity: 'moderate' },
  'deep-journaling': { label: 'Deep Journaling', intensity: 'deep' },
  'therapy-exercise': { label: 'Therapy Exercise', intensity: 'deep' },
  'parts-work': { label: 'Parts Work', intensity: 'deep' },
  'letter-writing': { label: 'Letter Writing', intensity: 'deep' },
  // Note: 'closing-ritual' is now a transition flow (ClosingRitual.jsx), not a module
  'open-space': { label: 'Open Space', intensity: 'gentle' },
  'lets-dance': { label: "Let's Dance", intensity: 'gentle' },
  // Leaves on a Stream (ACT cognitive defusion)
  'leaves-on-a-stream': { label: 'Leaves on a Stream', intensity: 'gentle' },
  // Protector Dialogue (IFS) — linked two-part module
  'protector-dialogue-p1': { label: 'Meeting a Protector', intensity: 'moderate' },
  'protector-dialogue-p2': { label: 'Understanding Your Protector', intensity: 'deep' },
  // Values Compass (ACT Matrix)
  'values-compass': { label: 'Values Compass', intensity: 'moderate' },
  // Felt Sense (Focusing)
  'felt-sense': { label: 'Felt Sense', intensity: 'moderate' },
  // The Deep Dive (EFT) — linked two-part module
  'the-descent': { label: 'The Deep Dive', intensity: 'moderate' },
  'the-cycle': { label: 'The Cycle', intensity: 'moderate' },
  'booster-consideration': { label: 'Booster Check-In', intensity: 'gentle' },
  // Intention Setting (pre-session)
  'intention-setting': { label: 'Intention Setting', intensity: 'gentle' },
  // Life Graph (pre-session)
  'life-graph': { label: 'Life Graph', intensity: 'gentle' },
  // Mapping the Territory (pre-session)
  'mapping-territory': { label: 'Mapping the Territory', intensity: 'gentle' },
  // Pendulation (Somatic Experiencing)
  'pendulation': { label: 'Pendulation', intensity: 'moderate' },
  // Follow-up phase modules (time-locked, available 8-24h after session)
  'follow-up': { label: 'Follow-Up', intensity: 'gentle' },
};

// Phase restrictions for module intensities
export const PHASE_INTENSITY_RULES = {
  'pre-session': {
    allowed: ['gentle', 'moderate', 'deep'],
    warning: [],
    blocked: [],
  },
  'come-up': {
    allowed: ['gentle'],
    warning: [],
    blocked: ['moderate', 'deep'],
  },
  peak: {
    allowed: ['gentle', 'moderate'],
    warning: ['deep'],
    blocked: [],
  },
  integration: {
    allowed: ['gentle', 'moderate', 'deep'],
    warning: [],
    blocked: [],
  },
  'follow-up': {
    allowed: ['gentle'],
    warning: [],
    blocked: ['moderate', 'deep'],
  },
};

/**
 * Module Library
 * All available modules users can add to their timeline
 */
export const moduleLibrary = [
  // === PRE-SESSION ===
  {
    id: 'intention-setting',
    type: 'intention-setting',
    category: 'pre-session',
    title: 'Intention Setting',
    description: 'A guided flow to refine your session intention. Includes optional grounding meditation, self-inquiry, and writing exercises.',
    defaultDuration: 5,
    intensity: 'gentle',
    allowedPhases: ['pre-session', 'come-up'],
    recommendedPhases: ['pre-session', 'come-up'],
    hasVariableDuration: false,
    capabilities: {
      controls: { showBeginButton: false, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['intention', 'pre-session', 'writing', 'grounding', 'self-inquiry'],
  },
  {
    id: 'life-graph',
    type: 'life-graph',
    category: 'pre-session',
    title: 'Life Graph',
    description: 'Chart significant life milestones against a well-being scale, then see your journey visualized as a life graph.',
    defaultDuration: 5,
    intensity: 'gentle',
    allowedPhases: ['pre-session', 'come-up', 'peak', 'integration'],
    recommendedPhases: ['pre-session', 'come-up'],
    hasVariableDuration: false,
    capabilities: {
      controls: { showBeginButton: false, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['life-graph', 'pre-session', 'reflection', 'visualization', 'lifeline'],
  },
  {
    id: 'mapping-territory',
    type: 'mapping-territory',
    category: 'pre-session',
    title: 'Mapping the Territory',
    description: 'A brief orientation to the kinds of experience that can arise during a session. Based on the work of psychedelic researcher Bill Richards.',
    defaultDuration: 10,
    intensity: 'gentle',
    allowedPhases: ['pre-session', 'come-up'],
    recommendedPhases: ['pre-session'],
    hasVariableDuration: false,
    capabilities: {
      controls: { showBeginButton: false, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['mapping', 'pre-session', 'preparation', 'education', 'Richards'],
  },

  // === COME-UP APPROPRIATE (Gentle) ===
  {
    id: 'simple-grounding',
    type: 'simple-grounding',
    category: 'meditation',
    title: 'Simple Grounding',
    description: 'A guided grounding practice to feel present and connected. Settle in, notice your body and senses, and return to the here and now.',
    defaultDuration: 8,
    intensity: 'gentle',
    allowedPhases: ['come-up', 'peak', 'integration'],
    recommendedPhases: ['come-up'],
    hasVariableDuration: false,
    meditationId: 'simple-grounding',
    // Uses custom SimpleGroundingModule with audio-text sync
    capabilities: {
      timer: { type: 'elapsed', showProgress: true, showTimeDisplay: true, autoComplete: true },
      prompts: { type: 'timed', fadeTransition: true },
      audio: { type: 'voiceover', showMuteButton: true },
      controls: { showBeginButton: true, showPauseButton: true, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['grounding', 'calming', 'come-up', 'guided'],
  },
  {
    id: 'short-grounding',
    type: 'short-grounding',
    category: 'meditation',
    title: 'Basic Grounding',
    description: 'A brief 5-minute grounding reset. Body contact, senses, and breath — just enough to come back to center.',
    defaultDuration: 5,
    intensity: 'gentle',
    allowedPhases: ['pre-session', 'come-up', 'peak', 'integration'],
    recommendedPhases: ['come-up', 'peak', 'integration'],
    hasVariableDuration: false,
    meditationId: 'short-grounding',
    capabilities: {
      timer: { type: 'elapsed', showProgress: true, showTimeDisplay: true, autoComplete: true },
      prompts: { type: 'timed', fadeTransition: true },
      audio: { type: 'voiceover', showMuteButton: true },
      controls: { showBeginButton: true, showPauseButton: true, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['grounding', 'brief', 'calming', 'guided'],
  },

  // === BREATH MEDITATION (with BreathOrb animation) ===
  {
    id: 'breath-meditation-calm',
    type: 'breath-meditation',
    category: 'meditation',
    hidden: true,
    title: 'Calming Breath',
    description: 'A 15-minute guided breathing meditation that progressively deepens your breath, then gently returns to natural breathing.',
    defaultDuration: 15,
    intensity: 'gentle',
    allowedPhases: ['come-up', 'peak', 'integration'],
    recommendedPhases: ['come-up'],
    content: {
      instructions: 'Follow the orb with your breath as it guides you through a natural progression from gentle to deep breathing.',
      // Reference the meditation content file with segments and prompts
      meditationId: 'calming-breath-15min',
    },
    // Uses custom BreathMeditationModule with BreathOrb
    capabilities: {
      timer: { type: 'breathing', autoComplete: true },
      animation: { type: 'breath-orb' },
      controls: { showBeginButton: true, showPauseButton: true, showSkipButton: true },
    },
    tags: ['breathing', 'meditation', 'calming', 'orb', '15-minute'],
  },
  {
    id: 'music-listening',
    type: 'music-listening',
    category: 'open',
    title: 'Music Time',
    description: 'Simply listen to music and let it move through you.',
    defaultDuration: 20,
    minDuration: 10,
    maxDuration: 60,
    intensity: 'gentle',
    allowedPhases: ['come-up', 'peak', 'integration'],
    recommendedPhases: ['come-up', 'peak'],
    content: {
      instructions: 'Put on music that feels right for this moment. Close your eyes and let the music wash over you. There\'s nothing to do but listen and feel.',
    },
    // Uses custom MusicListeningModule component
    capabilities: {
      controls: { showSkipButton: true },
    },
    tags: ['music', 'passive', 'immersive'],
  },
  {
    id: 'lets-dance',
    type: 'lets-dance',
    category: 'open',
    title: "Let's Dance",
    description: 'Put on your favourite dance music and move your body freely.',
    defaultDuration: 20,
    minDuration: 10,
    maxDuration: 60,
    intensity: 'gentle',
    allowedPhases: ['peak'],
    recommendedPhases: ['peak'],
    content: {
      instructions: 'Pick a song that makes you want to move. Let your body lead — there\'s no right or wrong way to dance.',
    },
    // Uses custom LetsDanceModule component
    capabilities: {
      controls: { showSkipButton: true },
    },
    tags: ['music', 'dance', 'movement', 'active'],
  },

  // === PEAK APPROPRIATE (Moderate) ===
  {
    id: 'open-awareness',
    type: 'open-awareness',
    category: 'meditation',
    title: 'Open Awareness',
    description: 'Rest in awareness itself. No technique, no effort — just noticing.',
    defaultDuration: 15,
    minDuration: 10,
    maxDuration: 30,
    intensity: 'moderate',
    allowedPhases: ['pre-session', 'peak', 'integration'],
    recommendedPhases: ['peak'],
    hasVariableDuration: true,
    durationSteps: [10, 15, 20, 25, 30],
    meditationId: 'open-awareness',
    // Uses custom OpenAwarenessModule with audio-text sync
    capabilities: {
      timer: { type: 'elapsed', showProgress: true, showTimeDisplay: true, autoComplete: true },
      prompts: { type: 'timed', fadeTransition: true },
      audio: { type: 'voiceover', showMuteButton: true },
      controls: { showBeginButton: true, showPauseButton: true, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['meditation', 'vipassana', 'open-awareness', 'guided'],
  },
  {
    id: 'body-scan',
    type: 'body-scan',
    category: 'meditation',
    title: 'Body Scan',
    description: 'A guided scan through your entire body. Notice what is present without needing to change anything.',
    defaultDuration: 10,
    minDuration: 10,
    maxDuration: 15,
    intensity: 'gentle',
    allowedPhases: ['pre-session', 'come-up', 'peak', 'integration'],
    recommendedPhases: ['come-up', 'peak'],
    hasVariableDuration: true,
    durationSteps: [10, 15],
    meditationId: 'body-scan',
    // Uses custom BodyScanModule with audio-text sync
    capabilities: {
      timer: { type: 'elapsed', showProgress: true, showTimeDisplay: true, autoComplete: true },
      prompts: { type: 'timed', fadeTransition: true },
      audio: { type: 'voiceover', showMuteButton: true },
      controls: { showBeginButton: true, showPauseButton: true, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['meditation', 'body-scan', 'somatic', 'guided'],
  },
  {
    id: 'self-compassion',
    type: 'self-compassion',
    category: 'meditation',
    title: 'Self-Compassion',
    description: 'Channel the natural self-compassion that opens during this experience.',
    defaultDuration: 11,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak'],
    meditationId: 'self-compassion',
    hasVariableDuration: false,
    // Uses custom SelfCompassionModule with audio-text sync + variation selection
    capabilities: {
      timer: { type: 'elapsed', showProgress: true, showTimeDisplay: true, autoComplete: true },
      prompts: { type: 'timed', fadeTransition: true },
      audio: { type: 'voiceover', showMuteButton: true },
      controls: { showBeginButton: true, showPauseButton: true, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['meditation', 'self-compassion', 'loving-kindness', 'guided'],
  },
  {
    id: 'leaves-on-a-stream',
    type: 'leaves-on-a-stream',
    category: 'activity',
    title: 'Leaves on a Stream',
    description: 'A guided meditation for observing your thoughts with curiosity rather than getting caught in them. You\'ll practice watching thoughts come and go, like leaves floating past on a stream.',
    defaultDuration: 10,
    minDuration: 10,
    maxDuration: 20,
    intensity: 'gentle',
    allowedPhases: ['pre-session', 'come-up', 'peak', 'integration'],
    recommendedPhases: ['peak'],
    hasVariableDuration: true,
    durationSteps: [10, 15, 20],
    meditationId: 'leaves-on-a-stream',
    // Uses custom LeavesOnAStreamModule with audio-text sync + reflection + journaling
    capabilities: {
      timer: { type: 'elapsed', showProgress: true, showTimeDisplay: true, autoComplete: true },
      prompts: { type: 'timed', fadeTransition: true },
      audio: { type: 'voiceover', showMuteButton: true },
      controls: { showBeginButton: true, showPauseButton: true, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['ACT', 'cognitive-defusion', 'meditation', 'guided', 'leaves-on-a-stream', 'mindfulness'],
  },
  {
    id: 'stay-with-it',
    type: 'stay-with-it',
    category: 'activity',
    title: 'Stay With It',
    description: 'A meditation for turning toward whatever you\u2019re feeling and staying present with it. Includes a check-in, brief psychoeducation, and journaling.',
    defaultDuration: 15,
    minDuration: 10,
    maxDuration: 25,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak'],
    hasVariableDuration: true,
    durationSteps: [10, 15, 20, 25],
    meditationId: 'stay-with-it',
    // Uses custom StayWithItModule with audio-text sync + check-in + psychoeducation + journaling
    capabilities: {
      timer: { type: 'elapsed', showProgress: true, showTimeDisplay: true, autoComplete: true },
      prompts: { type: 'timed', fadeTransition: true },
      audio: { type: 'voiceover', showMuteButton: true },
      controls: { showBeginButton: true, showPauseButton: true, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['reconsolidation', 'schema', 'meditation', 'guided', 'stay-with-it', 'emotional-processing'],
  },
  {
    id: 'pendulation',
    type: 'pendulation',
    category: 'activity',
    title: 'Pendulation',
    description: 'A guided somatic experiencing practice. Track sensations as they move between activation and safety, with adaptive branching based on your experience.',
    defaultDuration: 25,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak'],
    hasVariableDuration: false,
    meditationId: 'pendulation',
    capabilities: {
      controls: { showBeginButton: false, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['somatic-experiencing', 'pendulation', 'meditation', 'guided', 'Levine', 'body-awareness'],
  },
  {
    id: 'felt-sense',
    type: 'felt-sense',
    category: 'activity',
    title: 'Felt Sense',
    description: 'Turn inward and let your body show you what it\u2019s holding. No words needed.',
    defaultDuration: 12,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak', 'integration'],
    hasVariableDuration: false,
    meditationId: 'felt-sense',
    capabilities: {
      timer: { type: 'elapsed', showProgress: true, showTimeDisplay: true, autoComplete: true },
      prompts: { type: 'timed', fadeTransition: true },
      audio: { type: 'voiceover', showMuteButton: true },
      controls: { showBeginButton: true, showPauseButton: true, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['focusing', 'felt-sense', 'somatic', 'meditation', 'guided', 'Gendlin', 'journaling'],
  },
  // === THE DEEP DIVE (EFT Relationship) — Linked Two-Part Module ===
  // Parent entry — shown in ModuleLibraryDrawer. Adding creates both Part 1 and Part 2.
  {
    id: 'the-descent',
    type: 'the-descent',
    category: 'activity',
    title: 'The Deep Dive',
    description: 'A two-part relationship-guided audio meditation for one person or two. Discover what lies beneath your surface reactions, then map the cycle that plays out between you.',
    defaultDuration: 45,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak'],
    isLinkedParent: true,
    linkedParts: [
      { id: 'the-descent-p1', title: 'The Deep Dive (Part 1)', duration: 25, phase: 'same' },
      { id: 'the-cycle-p2', title: 'The Cycle (Part 2)', duration: 25, phase: 'integration' },
    ],
    tags: ['EFT', 'relationship', 'attachment', 'emotion', 'guided', 'meditation', 'couples'],
  },
  // Part 1 — hidden from drawer, added automatically by linked parent
  {
    id: 'the-descent-p1',
    type: 'the-descent',
    category: 'activity',
    title: 'The Deep Dive (Part 1)',
    description: 'A relationship-guided audio meditation for one person or two. Explore what lies beneath surface-level reactions.',
    defaultDuration: 25,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
    hidden: true,
    isLinkedPart: true,
    linkedParentId: 'the-descent',
    meditationId: 'the-descent',
    capabilities: {
      controls: { showBeginButton: false, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['EFT', 'relationship', 'attachment', 'meditation'],
  },
  // Part 2 — hidden from drawer, added automatically by linked parent
  {
    id: 'the-cycle-p2',
    type: 'the-cycle',
    category: 'activity',
    title: 'The Cycle (Part 2)',
    description: 'Map the repeating pattern in your relationship and see it from above.',
    defaultDuration: 25,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
    hidden: true,
    isLinkedPart: true,
    linkedParentId: 'the-descent',
    capabilities: {
      controls: { showBeginButton: false, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['EFT', 'relationship', 'cycle', 'mapping', 'journaling'],
  },
  {
    id: 'values-compass',
    type: 'values-compass',
    category: 'activity',
    title: 'Values Compass',
    description: 'An interactive exercise for mapping what you care about, what gets in the way, and how you actually move through your life. Based on the ACT Matrix.',
    defaultDuration: 25,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak', 'integration'],
    hasVariableDuration: false,
    capabilities: {
      controls: { showBeginButton: false, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['ACT', 'values', 'matrix', 'interactive', 'journaling'],
  },
  {
    id: 'light-journaling',
    type: 'light-journaling',
    category: 'journaling',
    title: 'Light Journaling',
    description: 'Gentle writing prompts to capture what\'s arising.',
    defaultDuration: 15,
    minDuration: 10,
    maxDuration: 30,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak'],
    content: {
      instructions: 'Write freely about whatever is present for you. Don\'t worry about grammar or making sense. Just let the words flow.',
      prompts: [
        'What am I noticing right now?',
        'What wants to be expressed?',
        'What feels true in this moment?',
      ],
    },
    // Uses custom JournalingModule (journal store integration)
    capabilities: {
      prompts: { type: 'static' },
      input: { type: 'journal', saveToJournal: true, placeholder: "What's on your mind?" },
      controls: { showBeginButton: false, showSkipButton: true, continueButtonText: 'Save & Continue' },
      layout: { centered: false, maxWidth: 'lg' },
    },
    tags: ['journaling', 'expression', 'light'],
  },

  // === INTEGRATION APPROPRIATE (Deep) ===
  {
    id: 'deep-journaling',
    type: 'deep-journaling',
    category: 'journaling',
    title: 'Deep Journaling',
    description: 'Structured prompts for deeper self-exploration and insight.',
    defaultDuration: 30,
    minDuration: 20,
    maxDuration: 60,
    intensity: 'deep',
    allowedPhases: ['integration'],
    recommendedPhases: ['integration'],
    content: {
      instructions: 'Take your time with these prompts. Write whatever comes, even if it surprises you. This is for you alone.',
      prompts: [
        'What have I been avoiding looking at?',
        'What truth am I ready to acknowledge?',
        'What would my life look like if I fully accepted myself?',
        'What am I ready to release?',
      ],
    },
    // Uses custom JournalingModule (journal store integration)
    capabilities: {
      prompts: { type: 'static' },
      input: { type: 'journal', saveToJournal: true, placeholder: 'Let your thoughts flow freely...' },
      controls: { showBeginButton: false, showSkipButton: true, continueButtonText: 'Save & Continue' },
      layout: { centered: false, maxWidth: 'lg' },
    },
    tags: ['journaling', 'deep', 'insight'],
  },
  {
    id: 'parts-work',
    type: 'parts-work',
    category: 'journaling',
    hidden: true,
    title: 'Parts Work',
    description: 'Explore and dialogue with different aspects of yourself.',
    defaultDuration: 30,
    minDuration: 20,
    maxDuration: 45,
    intensity: 'deep',
    allowedPhases: ['integration'],
    recommendedPhases: ['integration'],
    content: {
      instructions: 'Notice if there are different "parts" of you with different feelings or perspectives. See if you can get to know them with curiosity rather than judgment.',
      prompts: [
        'What part of me is showing up right now?',
        'What does this part want me to know?',
        'What does this part need?',
        'How old does this part feel?',
      ],
    },
    // Uses custom JournalingModule (journal store integration)
    capabilities: {
      prompts: { type: 'static' },
      input: { type: 'journal', saveToJournal: true, placeholder: 'Begin a dialogue with this part...' },
      controls: { showBeginButton: false, showSkipButton: true, continueButtonText: 'Save & Continue' },
      layout: { centered: false, maxWidth: 'lg' },
    },
    tags: ['IFS', 'parts', 'deep-work'],
  },
  {
    id: 'letter-writing',
    type: 'letter-writing',
    category: 'journaling',
    title: 'Letter Writing',
    description: 'Write a letter to yourself, someone else, or a part of you.',
    defaultDuration: 25,
    minDuration: 15,
    maxDuration: 45,
    intensity: 'deep',
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['integration'],
    content: {
      instructions: 'Write a letter. It could be to your younger self, to someone you need to say something to, or to a part of yourself that needs to hear from you.',
      prompts: [
        'Who needs to hear from you?',
        'What have you been wanting to say?',
        'What do they need to know?',
      ],
    },
    // Uses custom JournalingModule (journal store integration)
    capabilities: {
      prompts: { type: 'static' },
      input: { type: 'journal', saveToJournal: true, placeholder: 'Dear...' },
      controls: { showBeginButton: false, showSkipButton: true, continueButtonText: 'Save & Continue' },
      layout: { centered: false, maxWidth: 'lg' },
    },
    tags: ['writing', 'expression', 'healing'],
  },
  {
    id: 'therapy-gratitude',
    type: 'therapy-exercise',
    category: 'journaling',
    title: 'Gratitude Reflection',
    description: 'A structured practice to connect with appreciation and meaning.',
    defaultDuration: 20,
    minDuration: 10,
    maxDuration: 30,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['integration'],
    content: {
      instructions: 'Reflect on what you\'re grateful for—people, experiences, qualities in yourself, simple pleasures. Let yourself really feel the gratitude.',
      prompts: [
        'What am I grateful for right now?',
        'Who has helped me become who I am?',
        'What simple pleasure am I thankful for?',
      ],
    },
    // Uses custom JournalingModule (journal store integration)
    capabilities: {
      prompts: { type: 'static' },
      input: { type: 'journal', saveToJournal: true, placeholder: 'I am grateful for...' },
      controls: { showBeginButton: false, showSkipButton: true, continueButtonText: 'Save & Continue' },
      layout: { centered: false, maxWidth: 'lg' },
    },
    tags: ['gratitude', 'appreciation', 'positive'],
  },
  // Note: 'closing-ritual' is now a transition flow (ClosingRitual.jsx), not a module

  // === PROTECTOR DIALOGUE (IFS Framework) — Linked Two-Part Module ===
  // Parent entry — shown in ModuleLibraryDrawer. Adding this creates both Part 1 and Part 2.
  {
    id: 'protector-dialogue',
    type: 'protector-dialogue',
    category: 'activity',
    title: 'Dialogue with a Protector',
    description: 'A two-part IFS practice. Meet a protective part of yourself through guided meditation and reflection, then deepen the dialogue during integration.',
    defaultDuration: 55,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak'],
    isLinkedParent: true,
    linkedParts: [
      { id: 'protector-dialogue-p1', title: 'Meeting a Protector (Part 1)', duration: 25, phase: 'same' },
      { id: 'protector-dialogue-p2', title: 'Understanding Your Protector (Part 2)', duration: 30, phase: 'integration' },
    ],
    tags: ['IFS', 'parts-work', 'protector', 'dialogue', 'deep-work', 'guided', 'meditation'],
  },
  // Part 1 — hidden from drawer, added automatically by linked parent
  {
    id: 'protector-dialogue-p1',
    type: 'protector-dialogue-p1',
    category: 'activity',
    title: 'Meeting a Protector (Part 1)',
    description: 'Guided meditation and reflection to meet a protective part of yourself.',
    defaultDuration: 25,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
    hidden: true,
    isLinkedPart: true,
    linkedParentId: 'protector-dialogue',
    meditationId: 'protector-dialogue',
    capabilities: {
      controls: { showBeginButton: false, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['IFS', 'parts-work', 'protector', 'meditation'],
  },
  // Part 2 — hidden from drawer, added automatically by linked parent
  {
    id: 'protector-dialogue-p2',
    type: 'protector-dialogue-p2',
    category: 'activity',
    title: 'Understanding Your Protector (Part 2)',
    description: 'Deepen your dialogue with the protector you met. Journaling and reflection.',
    defaultDuration: 30,
    intensity: 'deep',
    allowedPhases: ['peak', 'integration'],
    hidden: true,
    isLinkedPart: true,
    linkedParentId: 'protector-dialogue',
    capabilities: {
      controls: { showBeginButton: false, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['IFS', 'parts-work', 'protector', 'journaling'],
  },

  // === UTILITY MODULES (Any phase) ===
  {
    id: 'open-space',
    type: 'open-space',
    category: 'open',
    title: 'Open Space',
    description: 'Unstructured time to simply be with whatever arises.',
    defaultDuration: 20,
    minDuration: 5,
    maxDuration: 60,
    hasVariableDuration: true,
    durationSteps: [5, 10, 15, 20, 30, 45, 60],
    intensity: 'gentle',
    allowedPhases: ['come-up', 'peak', 'integration'],
    recommendedPhases: ['come-up', 'peak', 'integration'],
    content: {
      instructions: 'This is open time. Rest, move, listen to music, or simply be. Follow your inner guidance.',
    },
    // Uses custom OpenSpaceModule with AsciiMoon animation and duration picker
    capabilities: {
      timer: { type: 'elapsed', autoComplete: true },
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: true },
    },
    tags: ['open', 'flexible', 'unstructured'],
  },

  // === BOOSTER CONSIDERATION ===
  {
    id: 'booster-consideration',
    type: 'booster-consideration',
    title: 'Booster Check-In',
    description: 'A guided check-in at the 90-minute mark to consider whether a supplemental dose is right for you.',
    defaultDuration: 5,
    intensity: 'gentle',
    allowedPhases: ['peak'],
    recommendedPhases: ['peak'],
    isBoosterModule: true,
    content: {
      instructions: 'This module will guide you through a brief check-in about taking a supplemental dose.',
    },
    tags: ['booster', 'check-in', 'supplemental'],
  },

  // === FOLLOW-UP MODULES (Time-locked, 8-24h after session) ===
  {
    id: 'followup-check-in',
    type: 'follow-up',
    title: 'Check-In',
    description: 'A brief check-in on how you are feeling since your session.',
    defaultDuration: 5,
    intensity: 'gentle',
    allowedPhases: ['follow-up'],
    recommendedPhases: ['follow-up'],
    isFollowUpModule: true,
    followUpModuleId: 'checkIn',
    unlockDelay: 8, // hours after session close
    content: {
      instructions: 'Take a moment to notice how you are feeling today.',
    },
    tags: ['follow-up', 'check-in', 'reflection'],
  },
  {
    id: 'followup-revisit',
    type: 'follow-up',
    title: 'Revisit',
    description: 'Read back what you wrote during your session.',
    defaultDuration: 10,
    intensity: 'gentle',
    allowedPhases: ['follow-up'],
    recommendedPhases: ['follow-up'],
    isFollowUpModule: true,
    followUpModuleId: 'revisit',
    unlockDelay: 8, // hours after session close
    content: {
      instructions: 'Revisit the intentions and messages you wrote during your session.',
    },
    tags: ['follow-up', 'revisit', 'reflection'],
  },
  {
    id: 'followup-values-compass',
    type: 'follow-up',
    title: 'Values Compass Revisited',
    description: 'Revisit your ACT Matrix with fresh eyes and practice noticing toward and away moves.',
    defaultDuration: 15,
    intensity: 'gentle',
    allowedPhases: ['follow-up'],
    recommendedPhases: ['follow-up'],
    isFollowUpModule: true,
    followUpModuleId: 'valuesCompassFollowUp',
    unlockDelay: 12, // hours after session close (conditional on VC completion)
    content: {
      instructions: 'Revisit the values compass you created during your session.',
    },
    tags: ['follow-up', 'values-compass', 'ACT', 'matrix'],
  },
  {
    id: 'followup-integration',
    type: 'follow-up',
    title: 'Integration Reflection',
    description: 'Deeper reflection on how insights are integrating into your life.',
    defaultDuration: 10,
    intensity: 'gentle',
    allowedPhases: ['follow-up'],
    recommendedPhases: ['follow-up'],
    isFollowUpModule: true,
    followUpModuleId: 'integration',
    unlockDelay: 24, // hours after session close
    content: {
      instructions: 'Reflect on what has emerged since your session and how your commitment is taking shape.',
    },
    tags: ['follow-up', 'integration', 'commitment'],
  },
  {
    id: 'followup-journaling',
    type: 'follow-up',
    title: 'Follow-Up Journaling',
    description: 'Open journaling space to continue processing your experience.',
    defaultDuration: 15,
    intensity: 'gentle',
    allowedPhases: ['follow-up'],
    recommendedPhases: ['follow-up'],
    isFollowUpModule: true,
    unlockDelay: 24, // hours after session close
    content: {
      instructions: 'Write freely about what has been arising since your session. What are you noticing? What feels different?',
      prompts: [
        'What has been on my mind since the session?',
        'What insights are becoming clearer?',
        'What do I want to remember?',
      ],
    },
    capabilities: {
      prompts: { type: 'static' },
      input: { type: 'journal', saveToJournal: true, placeholder: 'Continue processing...' },
      controls: { showBeginButton: false, showSkipButton: true, continueButtonText: 'Save & Continue' },
      layout: { centered: false, maxWidth: 'lg' },
    },
    tags: ['follow-up', 'journaling', 'processing'],
  },
];

/**
 * Get a module by its library ID
 */
export function getModuleById(id) {
  return moduleLibrary.find((m) => m.id === id);
}

/**
 * Get all modules allowed in a specific phase
 */
export function getModulesForPhase(phase) {
  return moduleLibrary.filter((m) => m.allowedPhases.includes(phase));
}

/**
 * Get modules recommended for a specific phase
 */
export function getRecommendedModulesForPhase(phase) {
  return moduleLibrary.filter((m) => m.recommendedPhases.includes(phase));
}

/**
 * Check if a module can be added to a phase
 * Returns { allowed: boolean, warning?: string, error?: string }
 */
export function canAddModuleToPhase(moduleId, phase) {
  const module = getModuleById(moduleId);
  if (!module) {
    return { allowed: false, error: 'Module not found' };
  }

  const rules = PHASE_INTENSITY_RULES[phase];
  if (!rules) {
    return { allowed: false, error: 'Invalid phase' };
  }

  // Pre-session: most modules allowed, but exclude session-specific ones that don't make sense to practice
  if (phase === 'pre-session') {
    const excludedFromPreSession = [
      'booster-consideration',
      'followup-check-in',
      'followup-revisit',
      'followup-values-compass',
      'followup-integration',
      'followup-journaling',
    ];
    if (excludedFromPreSession.includes(module.id)) {
      return { allowed: false, error: `"${module.title}" is not available for pre-session.` };
    }
    if (!module.allowedPhases.includes('pre-session')) {
      return {
        allowed: true,
        warning: `This activity is designed for the main session. You can still try it here before your session begins.`,
      };
    }
    return { allowed: true };
  }

  // Check if module is explicitly not allowed in this phase
  if (!module.allowedPhases.includes(phase)) {
    return {
      allowed: false,
      error: `"${module.title}" is not available during the ${phase} phase.`,
    };
  }

  // Check intensity rules
  if (rules.blocked.includes(module.intensity)) {
    return {
      allowed: false,
      error: `${module.intensity} intensity modules are not available during ${phase}. This phase is for gentler activities.`,
    };
  }

  if (rules.warning.includes(module.intensity)) {
    return {
      allowed: true,
      warning: `"${module.title}" is designed for the Integration phase. You may find it more effective later in your session when you've settled into a more grounded state.`,
    };
  }

  return { allowed: true };
}

/**
 * Get modules grouped by intensity
 */
export function getModulesGroupedByIntensity() {
  return {
    gentle: moduleLibrary.filter((m) => m.intensity === 'gentle'),
    moderate: moduleLibrary.filter((m) => m.intensity === 'moderate'),
    deep: moduleLibrary.filter((m) => m.intensity === 'deep'),
  };
}

/**
 * Get follow-up modules (time-locked modules for post-session)
 */
export function getFollowUpModules() {
  return moduleLibrary.filter((m) => m.isFollowUpModule);
}

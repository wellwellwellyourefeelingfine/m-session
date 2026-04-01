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
  // Shaking the Tree (Somatic Movement)
  'shaking-the-tree': { label: 'Shaking the Tree', intensity: 'gentle' },
  // Time Capsule (Future Self Journaling)
  'time-capsule': { label: 'Time Capsule', intensity: 'moderate' },
  // Inner Child Letter
  'inner-child-letter': { label: 'Inner Child Letter', intensity: 'deep' },
  // Feeling Dialogue
  'feeling-dialogue': { label: 'Dialogue with a Feeling', intensity: 'moderate' },
  // Committed Action (ACT)
  'committed-action': { label: 'Committed Action', intensity: 'moderate' },
  // Integration Reflection (Follow-Up)
  'integration-reflection-journal': { label: 'Integration Reflection', intensity: 'moderate' },
  // Relationships Reflection (Follow-Up)
  'relationships-reflection': { label: 'Relationships Reflection', intensity: 'moderate' },
  // Lifestyle Reflection (Follow-Up)
  'lifestyle-reflection': { label: 'Lifestyle Reflection', intensity: 'moderate' },
  // Spirit & Meaning (Follow-Up)
  'spirit-meaning': { label: 'Spirit & Meaning', intensity: 'deep' },
  // Body & Somatic Awareness (Follow-Up)
  'body-somatic': { label: 'Body & Somatic Awareness', intensity: 'moderate' },
  // Nature & Connection (Follow-Up)
  'nature-connection': { label: 'Nature & Connection', intensity: 'gentle' },
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
  {
    id: 'shaking-the-tree',
    type: 'shaking-the-tree',
    category: 'activity',
    title: 'Shaking the Tree',
    description: 'A guided somatic movement practice. Five phases of movement — from gentle sway to full expression and back — to release tension held in the body.',
    defaultDuration: 15,
    minDuration: 10,
    maxDuration: 30,
    intensity: 'gentle',
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak'],
    content: {
      instructions: 'A guided movement practice with five phases. Pick some music, set a duration, and let your body move.',
    },
    capabilities: {
      controls: { showSkipButton: true },
    },
    tags: ['somatic', 'movement', 'shaking', 'body', 'release'],
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
    defaultDuration: 40,
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
      introScreens: [
        {
          header: 'Light Journaling',
          lines: [
            'Writing during a session can help you hold onto what you are experiencing before it slips away. You do not need to write well or write a lot. Even a few words can anchor something important.',
            '§',
            'There are no rules here. Write whatever comes. If nothing comes, sit with the question and see what surfaces.',
          ],
        },
      ],
      prompts: [
        'What am I noticing right now?',
        'What wants to be expressed?',
        'What feels true in this moment?',
      ],
      closingScreens: [
        {
          header: 'Light Journaling',
          lines: [
            'Whatever you wrote is enough. You can always come back to your journal and add more later.',
            '§',
            'Sometimes the most useful entries are the ones that feel incomplete. They mark a moment in time, and that is their value.',
          ],
        },
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
      introScreens: [
        {
          header: 'Deep Journaling',
          lines: [
            'This is a space for the things that are harder to look at. The questions ahead are designed to go beneath the surface, and the state you are in right now can make that easier than it usually is.',
            '§',
            'Write honestly. No one will read this unless you choose to share it. If a question brings up something uncomfortable, that is often a sign you are close to something that matters.',
          ],
        },
      ],
      prompts: [
        'What have I been avoiding looking at?',
        'What truth am I ready to acknowledge?',
        'What would my life look like if I fully accepted myself?',
        'What am I ready to release?',
      ],
      closingScreens: [
        {
          header: 'Deep Journaling',
          lines: [
            'You just spent time with questions that most people avoid. That takes a kind of courage that is easy to underestimate.',
            '§',
            'What you wrote may continue to unfold over the coming days. You may notice new thoughts, feelings, or connections that were not obvious during the writing itself. Your journal is always here if you want to return and add to what you started.',
          ],
        },
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
      instructions: 'A guided letter-writing experience to help you express what matters most.',
    },
    // Uses dedicated LetterWritingModule with multi-step flow
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
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
      instructions: 'Reflect on what you\'re grateful for. People, experiences, qualities in yourself, simple pleasures. Let yourself really feel it.',
      introScreens: [
        {
          header: 'Gratitude Reflection',
          lines: [
            'Gratitude can feel like a cliche until you actually slow down and let it land. During a session, the usual filters that keep you from feeling things fully are lowered, and appreciation can become surprisingly vivid.',
            '§',
            'The prompts ahead will ask you to think about different parts of your life. Take your time with each one. The goal is not to list things but to let yourself feel the weight of what you have.',
          ],
        },
      ],
      prompts: [
        'What am I grateful for right now?',
        'Who has helped me become who I am?',
        'What simple pleasure am I thankful for?',
      ],
      closingScreens: [
        {
          header: 'Gratitude Reflection',
          lines: [
            'Research on gratitude practices consistently shows that they improve wellbeing, but only when they move beyond the surface. What you just did was closer to the real thing.',
            '§',
            'You may find that the people or things you wrote about stay with you over the next few days. Consider telling one of them what they mean to you, if the opportunity arises.',
          ],
        },
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

  // === TIME CAPSULE (Future Self Journaling) ===
  {
    id: 'time-capsule',
    type: 'time-capsule',
    category: 'journaling',
    title: 'Time Capsule',
    description: 'Write a message to your future self from the clarity of this moment.',
    defaultDuration: 20,
    minDuration: 10,
    maxDuration: 30,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['integration'],
    content: {
      introScreens: [
        {
          header: 'Time Capsule',
          lines: [
            'Right now, you may be seeing things with a clarity that is hard to access in everyday life. Patterns that usually stay hidden are visible. Things that matter feel unmistakably clear.',
            '§',
            'This is a chance to capture that clarity before it fades. You are going to write a message to your future self \u2014 the version of you who will be back in ordinary life, navigating the same patterns, the same relationships, the same choices.',
            '§',
            'What does that person need to hear from the version of you who is here right now?',
          ],
        },
      ],
      prompts: [
        'It is one year from now. What do you want to tell the person sitting here today?',
        'What do you see clearly right now that you are afraid you might forget?',
        'What is one thing you want to promise yourself?',
      ],
      closingScreens: [
        {
          header: 'Time Capsule',
          lines: [
            'What you just wrote is a message from a version of yourself that had access to something important. In the days and weeks ahead, the intensity of this clarity may soften, but the truth underneath it does not go away.',
            '§',
            'Your message is saved in your journal. Come back to it when you need a reminder of what you saw today.',
            '§',
            'Some people find it useful to set a calendar reminder for a month, three months, or a year from now to re-read what they wrote. It can be surprising how much still resonates.',
          ],
        },
      ],
    },
    capabilities: {
      prompts: { type: 'static' },
      input: { type: 'journal', saveToJournal: true, placeholder: 'Write to your future self...' },
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['journaling', 'reflection', 'future-self', 'integration'],
  },

  // === INNER CHILD LETTER ===
  {
    id: 'inner-child-letter',
    type: 'inner-child-letter',
    category: 'journaling',
    title: 'Inner Child Letter',
    description: 'Write a letter to your younger self at an age that still carries weight.',
    defaultDuration: 25,
    minDuration: 15,
    maxDuration: 45,
    intensity: 'deep',
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['integration'],
    content: {
      instructions: 'A guided letter to a younger version of yourself.',
    },
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['journaling', 'inner-child', 'healing', 'letter'],
  },

  // === DIALOGUE WITH A FEELING (Gestalt / IFS) ===
  {
    id: 'feeling-dialogue',
    type: 'feeling-dialogue',
    category: 'journaling',
    title: 'Dialogue with a Feeling',
    description: 'Name a feeling and have a conversation with it.',
    defaultDuration: 20,
    minDuration: 15,
    maxDuration: 40,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak'],
    content: {
      instructions: 'A guided conversation with a feeling that is present.',
    },
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['journaling', 'gestalt', 'emotions', 'dialogue'],
  },

  // === COMMITTED ACTION (ACT Framework) ===
  {
    id: 'committed-action',
    type: 'committed-action',
    category: 'journaling',
    title: 'Committed Action',
    description: 'Identify a value, explore what gets in the way, and write a commitment to act. Based on the ACT framework.',
    defaultDuration: 20,
    minDuration: 10,
    maxDuration: 30,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['integration'],
    content: {
      instructions: 'A guided commitment based on Acceptance and Commitment Therapy.',
    },
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['ACT', 'values', 'commitment', 'journaling'],
  },

  // === INTEGRATION REFLECTION (Follow-Up Journaling) ===
  {
    id: 'integration-reflection-journal',
    type: 'integration-reflection-journal',
    category: 'journaling',
    title: 'Integration Reflection',
    description: 'A guided reflection on what stayed with you from your session. Inspired by the MAPS Psychedelic Integration Workbook.',
    defaultDuration: 25,
    minDuration: 15,
    maxDuration: 45,
    intensity: 'moderate',
    isFollowUpModule: true,
    unlockDelay: 24,
    allowedPhases: ['follow-up'],
    recommendedPhases: ['follow-up'],
    content: {
      screens: [
        {
          type: 'text',
          header: 'Integration Reflection',
          lines: [
            'The first day or two after a session is a window. Research suggests that neuroplasticity is elevated during this period, which means the brain is more receptive to forming new connections and consolidating new patterns.',
            '\u00a7',
            'Writing things down during this window helps anchor what came up. Insights that feel vivid now can fade quickly without something to hold them in place.',
            '\u00a7',
            'This reflection will walk you through what stayed with you, what shifted, and what you want to carry forward.',
          ],
        },
        {
          type: 'prompt',
          prompt: 'What from your session is still with you right now?',
          context: 'It could be an image, a feeling, a thought, or something you cannot quite name.',
          placeholder: 'What is still present...',
        },
        {
          type: 'selector',
          prompt: 'How have you been feeling since your session?',
          key: 'emotionalState',
          columns: 2,
          multiSelect: false,
          options: [
            { id: 'settled', label: 'Settled and clear' },
            { id: 'processing', label: 'Still processing' },
            { id: 'lighter', label: 'Lighter than before' },
            { id: 'heavy', label: 'Heavy or weighed down' },
            { id: 'tender', label: 'Tender but okay' },
            { id: 'energized', label: 'Energized' },
            { id: 'numb', label: 'Numb or flat' },
            { id: 'mixed', label: 'Mixed or uncertain' },
          ],
          journal: {
            prompt: 'Want to say more about that?',
            placeholder: 'Any details about how you have been feeling...',
            rows: 3,
          },
        },
        {
          type: 'prompt',
          prompt: 'Has anything about the way you see yourself, another person, or a situation changed since your session?',
          context: 'Pay attention to small changes. A thought that used to trigger anxiety but now just feels neutral. A person you think about differently. A situation that seemed impossible but now seems manageable. Shifts after a session are often quiet.',
          placeholder: 'What has shifted...',
        },
        {
          type: 'prompt',
          prompt: 'Is there anything from your session that feels unfinished or unresolved?',
          context: 'Not everything that comes up during a session gets completed during the session. Naming what is still open can help you stay with it rather than push it away.',
          placeholder: 'What feels unfinished...',
        },
        {
          type: 'text',
          header: 'The Integration Window',
          lines: [
            'The period after a session is sometimes called the integration window. The heightened neuroplasticity that follows a psychedelic experience can last days to weeks, and during this time the brain is unusually receptive to change.',
            '\u00a7',
            'This is why writing, reflecting, and making small intentional changes during this period can have an outsized effect. You are not just remembering what happened. You are actively shaping how it becomes part of you.',
          ],
        },
        {
          type: 'prompt',
          prompt: 'What from your session do you want to remember and bring into your daily life?',
          placeholder: 'What I want to carry forward...',
        },
        {
          type: 'prompt',
          prompt: 'Is there anyone you want to talk to about what came up? Is there any kind of support that would help you right now?',
          context: 'Integration does not have to be solitary. Some things are better processed with a therapist, a trusted friend, or a community that understands.',
          placeholder: 'The support I need...',
        },
        {
          type: 'text',
          header: 'Integration Reflection',
          lines: [
            'Integration is not a single event. It is an ongoing process that can continue for weeks, months, or longer. What you wrote today is a snapshot of where you are right now, and it will be useful to revisit.',
            '\u00a7',
            'You may notice new connections, emotions, or realizations in the days ahead that were not obvious during this reflection. Your journal is always available if you want to come back and add to what you started.',
            '\u00a7',
            'If anything difficult came up during your session or during this reflection, consider reaching out to a therapist, integration professional, or trusted friend. You do not have to process everything alone.',
          ],
        },
      ],
    },
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['follow-up', 'integration', 'journaling', 'reflection'],
  },

  // === RELATIONSHIPS REFLECTION (Follow-Up Journaling) ===
  {
    id: 'relationships-reflection',
    type: 'relationships-reflection',
    category: 'journaling',
    title: 'Relationships Reflection',
    description: 'Explore how your session has shifted the way you see the people in your life. Inspired by the MAPS Psychedelic Integration Workbook.',
    defaultDuration: 20,
    minDuration: 10,
    maxDuration: 40,
    intensity: 'moderate',
    isFollowUpModule: true,
    unlockDelay: 24,
    allowedPhases: ['follow-up'],
    recommendedPhases: ['follow-up'],
    content: {
      screens: [
        {
          type: 'text',
          header: 'Relationships Reflection',
          lines: [
            'Sessions frequently bring clarity to relationships. People often report seeing others with more compassion, understanding relational patterns more clearly, and feeling motivated to repair or deepen connections.',
            '\u00a7',
            'This reflection will help you capture those insights while they are still close.',
          ],
        },
        {
          type: 'prompt',
          prompt: 'Who has been on your mind since your session?',
          context: 'During and after a session, certain people tend to surface. It might be someone you are close to, someone you have lost, or someone you have unfinished business with.',
          placeholder: 'The person or people I keep thinking about...',
        },
        {
          type: 'selector',
          prompt: 'How has your perspective on this relationship changed?',
          key: 'relationshipShift',
          columns: 2,
          multiSelect: false,
          options: [
            { id: 'compassion', label: 'More compassion toward them' },
            { id: 'understanding', label: 'Better understanding of their perspective' },
            { id: 'clarity', label: 'Clearer about what I need' },
            { id: 'forgiveness', label: 'Ready to forgive something' },
            { id: 'closeness', label: 'Wanting to be closer' },
            { id: 'pattern', label: 'Recognizing a pattern' },
            { id: 'distance', label: 'Needing more distance' },
            { id: 'unsure', label: 'Not sure yet' },
          ],
          journal: {
            prompt: 'Want to say more about what shifted?',
            placeholder: 'What changed in how I see this...',
            rows: 3,
          },
        },
        {
          type: 'prompt',
          prompt: 'Is there a pattern in how you relate to someone that you can see more clearly now?',
          context: 'Sessions can reveal patterns in how we relate to others. Ways we protect ourselves, ways we withdraw, things we tolerate that we should not, or things we withhold that we should share.',
          placeholder: 'A pattern I notice is...',
        },
        {
          type: 'prompt',
          prompt: 'Is there something you want to communicate to someone based on what came up?',
          context: 'You do not have to act on this right away. Writing it down is enough for now. If you choose to have this conversation, give yourself a few days first.',
          placeholder: 'What I want to say is...',
        },
        {
          type: 'text',
          header: 'A Note on Timing',
          lines: [
            'The urge to reach out to someone immediately after a session can be strong. The empathy and openness you feel are real, but they are also amplified.',
            '\u00a7',
            'Give yourself at least a few days before initiating difficult conversations or making major relationship decisions. What remains true after the afterglow settles is what matters most.',
          ],
        },
        {
          type: 'prompt',
          prompt: 'What kind of relationships do you want to build or strengthen going forward?',
          placeholder: 'The connections I want to invest in...',
        },
        {
          type: 'text',
          header: 'Relationships Reflection',
          lines: [
            'Relationships are one of the areas where session insights tend to have the most lasting impact, but only if you act on them.',
            '\u00a7',
            'Your reflections are saved in your journal. Consider revisiting them before any important conversations.',
            '\u00a7',
            'If relationship issues came up that feel beyond what you can work through alone, a therapist or counselor can help you navigate them.',
          ],
        },
      ],
    },
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['follow-up', 'relationships', 'journaling', 'reflection'],
  },

  // === LIFESTYLE REFLECTION (Follow-Up Journaling) ===
  {
    id: 'lifestyle-reflection',
    type: 'lifestyle-reflection',
    category: 'journaling',
    title: 'Lifestyle Reflection',
    description: 'Identify what to keep, what to change, and where to start. Inspired by the MAPS Psychedelic Integration Workbook.',
    defaultDuration: 20,
    minDuration: 10,
    maxDuration: 40,
    intensity: 'moderate',
    isFollowUpModule: true,
    unlockDelay: 24,
    allowedPhases: ['follow-up'],
    recommendedPhases: ['follow-up'],
    content: {
      screens: [
        {
          type: 'text',
          header: 'Lifestyle Reflection',
          lines: [
            'Sessions can make you want to change everything at once. The clarity about what is and is not working in your daily life can feel urgent.',
            '\u00a7',
            'But lasting change happens through small, deliberate adjustments, not dramatic overhauls. This reflection will help you identify what to focus on first.',
          ],
        },
        {
          type: 'prompt',
          prompt: 'What in your daily life is already serving you well?',
          context: 'Before thinking about what to change, take a moment to notice what is already working. Routines, habits, or practices that support you, even if they are simple.',
          placeholder: 'What is working for me right now...',
        },
        {
          type: 'selector',
          prompt: 'What area of your life feels most ready for a change?',
          key: 'lifestyleArea',
          columns: 2,
          multiSelect: false,
          options: [
            { id: 'sleep', label: 'Sleep and rest' },
            { id: 'movement', label: 'Physical movement' },
            { id: 'diet', label: 'Diet and nutrition' },
            { id: 'work', label: 'Work and productivity' },
            { id: 'screens', label: 'Screen time and media' },
            { id: 'social', label: 'Social life' },
            { id: 'creative', label: 'Creative expression' },
            { id: 'other', label: 'Something else' },
          ],
          journal: {
            prompt: 'What specifically do you want to change in this area?',
            placeholder: 'What I want to change...',
            rows: 3,
          },
        },
        {
          type: 'prompt',
          prompt: 'Is there a boundary you need to set, adjust, or let go of?',
          context: 'Sessions often make it clearer where your boundaries are too rigid or too loose. Places where you give too much, tolerate too much, or hold too tightly to control.',
          placeholder: 'A boundary I need to change...',
        },
        {
          type: 'prompt',
          prompt: 'What is one specific habit you want to start, stop, or change?',
          context: 'Research on habit change suggests that starting with one small, specific change is more effective than attempting several at once. The neuroplasticity window after a session makes this an especially good time to begin.',
          placeholder: 'One thing I will do differently...',
        },
        {
          type: 'text',
          header: 'Small Changes, Real Impact',
          lines: [
            'The most effective lifestyle changes after a session are ones you can sustain without willpower. Instead of relying on motivation, attach the new behavior to something you already do.',
            '\u00a7',
            'If you want to meditate, do it right after brushing your teeth. If you want to move more, start with five minutes, not an hour.',
            '\u00a7',
            'The window after a session is a time when new patterns can form more easily. Use it for one thing, not everything.',
          ],
        },
        {
          type: 'prompt',
          prompt: 'What routines, environments, or people help you stay on track when you are trying to make a change?',
          placeholder: 'What supports me...',
        },
        {
          type: 'text',
          header: 'Lifestyle Reflection',
          lines: [
            'The changes that stick after a session are usually the ones that feel obvious rather than ambitious.',
            '\u00a7',
            'Your reflections are saved in your journal. Come back to them in a week and see which changes you actually made. That will tell you more about what matters than anything you wrote today.',
          ],
        },
      ],
    },
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['follow-up', 'lifestyle', 'journaling', 'reflection'],
  },

  // === SPIRIT & MEANING (Follow-Up Journaling) ===
  {
    id: 'spirit-meaning',
    type: 'spirit-meaning',
    category: 'journaling',
    title: 'Spirit & Meaning',
    description: 'Explore the existential, spiritual, or meaning-making experiences from your session. Inspired by the MAPS Psychedelic Integration Workbook.',
    defaultDuration: 30,
    minDuration: 15,
    maxDuration: 60,
    intensity: 'deep',
    isFollowUpModule: true,
    unlockDelay: 24,
    allowedPhases: ['follow-up'],
    recommendedPhases: ['follow-up'],
    content: {
      screens: [
        {
          type: 'text',
          header: 'Spirit & Meaning',
          lines: [
            'Sessions sometimes open a door to experiences that are difficult to categorize. A sense of connection to something larger. A shift in how death, time, or purpose feels. A dissolving of boundaries that normally feel solid.',
            '\u00a7',
            'These experiences are among the most commonly reported and least discussed outcomes of psychedelic work.',
            '\u00a7',
            'This reflection is a space to sit with whatever came through, whether it was spiritual in a traditional sense, existential, or something you do not have a word for yet.',
          ],
        },
        {
          type: 'prompt',
          prompt: 'Was there a moment during your session that felt larger than you?',
          context: 'Many people report that the most meaningful parts of their experience are also the hardest to put into words. Researchers call this ineffability. Try anyway. Even partial descriptions can help you hold onto what happened.',
          placeholder: 'What I experienced was...',
        },
        {
          type: 'selector',
          prompt: 'Which of these comes closest to what you experienced?',
          key: 'spiritualExperience',
          columns: 2,
          multiSelect: true,
          options: [
            { id: 'connection', label: 'Connection to something larger' },
            { id: 'unity', label: 'A sense of unity or oneness' },
            { id: 'clarity', label: 'Clarity about what matters' },
            { id: 'mortality', label: 'Confrontation with mortality' },
            { id: 'held', label: 'Feeling of being held or loved' },
            { id: 'dissolving', label: 'Dissolving of boundaries' },
            { id: 'sacred', label: 'Encounter with something sacred' },
            { id: 'peace', label: 'A deep sense of peace' },
            { id: 'grief', label: 'Grief or loss' },
            { id: 'none', label: 'None of these' },
          ],
          journal: {
            prompt: 'Want to describe it in your own words?',
            placeholder: 'In my own words, it was...',
            rows: 4,
          },
        },
        {
          type: 'text',
          header: 'Holding What Cannot Be Named',
          lines: [
            'One of the difficulties of spiritual or mystical experience is that it can feel absolutely real and certain in the moment but become hard to access or trust afterward.',
            '\u00a7',
            'This is normal. The experience does not become less real because it fades from immediate awareness.',
            '\u00a7',
            'Integration is the process of finding ways to stay connected to what you saw, even when ordinary life makes it harder to feel.',
          ],
        },
        {
          type: 'prompt',
          prompt: 'Has your sense of what life is about changed since your session?',
          context: 'Sessions can change how you think about purpose, meaning, death, connection, or what matters most. These shifts can be subtle or seismic.',
          placeholder: 'What I see differently now...',
        },
        {
          type: 'prompt',
          prompt: 'Is there something you believe or feel to be true now that you did not before your session?',
          context: 'This does not have to be religious or even spiritual. It could be about yourself, about other people, about how things work, or about what matters.',
          placeholder: 'What I now hold to be true...',
        },
        {
          type: 'text',
          header: 'Practices for Staying Connected',
          lines: [
            'People who have had meaningful spiritual or existential experiences during sessions report several practices that help them maintain connection to what they found: spending time in nature, meditation or contemplation, creative expression, returning to music from the session, and conversations with others who understand.',
            '\u00a7',
            'You do not need to adopt a belief system or a practice. But finding even one way to regularly touch what you experienced can keep it alive as a source of meaning rather than a fading memory.',
          ],
        },
        {
          type: 'prompt',
          prompt: 'Is there a practice, ritual, or habit that might help you stay connected to what you experienced?',
          context: 'It could be as simple as a daily walk, a few minutes of silence, or revisiting a piece of music. The most effective practices are the ones you will actually do.',
          placeholder: 'Something I could do regularly...',
        },
        {
          type: 'prompt',
          prompt: 'What question are you sitting with right now that you do not have an answer to?',
          context: 'Some of the most important outcomes of a session are not answers but better questions. Questions that reframe how you think about your life, your relationships, or your place in things.',
          placeholder: 'The question I am sitting with...',
        },
        {
          type: 'text',
          header: 'Spirit & Meaning',
          lines: [
            'What you explored here may be the most personal and least shareable part of your experience. That is fine. Not everything needs to be communicated to be real.',
            '\u00a7',
            'Your reflections are saved in your journal. You may find that they become more meaningful over time, not less.',
            '\u00a7',
            'If what came up during your session has raised questions that feel too large to sit with alone, consider seeking out a therapist, spiritual director, or integration circle. These experiences deserve careful attention.',
          ],
        },
      ],
    },
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['follow-up', 'spirit', 'meaning', 'existential', 'journaling', 'reflection'],
  },

  // === BODY & SOMATIC AWARENESS (Follow-Up Journaling) ===
  {
    id: 'body-somatic',
    type: 'body-somatic',
    category: 'journaling',
    title: 'Body & Somatic Awareness',
    description: 'Notice what your body is holding, releasing, and asking for after your session. Inspired by the MAPS Psychedelic Integration Workbook.',
    defaultDuration: 25,
    minDuration: 15,
    maxDuration: 45,
    intensity: 'moderate',
    isFollowUpModule: true,
    unlockDelay: 24,
    allowedPhases: ['follow-up'],
    recommendedPhases: ['follow-up'],
    content: {
      screens: [
        {
          type: 'text',
          header: 'Body & Somatic Awareness',
          lines: [
            'During a session, the body often communicates more clearly than the mind. Tension releases, emotions surface as physical sensations, and areas of chronic holding can temporarily soften.',
            '\u00a7',
            'In the days after a session, the body continues to process. Paying attention to what it is telling you is one of the most effective forms of integration.',
          ],
        },
        {
          type: 'prompt',
          prompt: 'What do you notice in your body right now?',
          context: 'Take a moment to scan your body from head to feet. Notice any areas of tension, warmth, heaviness, lightness, or numbness. You do not need to interpret what you find. Just notice.',
          placeholder: 'Where I feel tension, ease, or sensation...',
        },
        {
          type: 'selector',
          prompt: 'What physical changes have you noticed since your session?',
          key: 'physicalChanges',
          columns: 2,
          multiSelect: true,
          options: [
            { id: 'relaxed', label: 'More relaxed than usual' },
            { id: 'tension', label: 'Tension in a new place' },
            { id: 'pain-softened', label: 'Old pain has softened' },
            { id: 'awareness', label: 'More aware of my body' },
            { id: 'sleep', label: 'Sleep has changed' },
            { id: 'appetite', label: 'Appetite has shifted' },
            { id: 'emotional', label: 'More emotional than usual' },
            { id: 'drained', label: 'Feeling physically drained' },
            { id: 'energy', label: 'Increased energy' },
            { id: 'none', label: 'No noticeable changes' },
          ],
          journal: {
            prompt: 'Want to describe what you are feeling physically?',
            placeholder: 'What I am noticing in my body...',
            rows: 3,
          },
        },
        {
          type: 'prompt',
          prompt: 'Did your body show you anything during the session that you want to remember?',
          context: 'Sessions can reveal how the body stores experiences. A tightness in the chest that corresponds to grief. Tension in the jaw from years of holding back words. Heaviness in the stomach connected to anxiety. Sometimes the body releases these during a session. Sometimes it shows them to you so you can begin to work with them.',
          placeholder: 'What my body revealed...',
        },
        {
          type: 'text',
          header: 'The Body Keeps Processing',
          lines: [
            'After a session, the body often continues what it started. You might notice unexpected waves of emotion, changes in how you sleep, shifts in appetite, or a desire to move differently.',
            '\u00a7',
            'These are not side effects. They are part of the integration process. The body processes at its own pace, and it does not always follow the timeline the mind expects.',
            '\u00a7',
            'Be patient with physical changes. They are usually temporary and meaningful.',
          ],
        },
        {
          type: 'prompt',
          prompt: 'What kind of physical activity or rest does your body seem to want right now?',
          context: 'Some people feel called to move more after a session. Others need stillness. Both are valid responses to what the body is working through.',
          placeholder: 'What my body is asking for...',
        },
        {
          type: 'prompt',
          prompt: 'Is there tension or pain in your body that you now recognize as connected to something specific?',
          context: 'Somatic therapists often observe that people carry tension, pain, or holding patterns that originated in someone else\'s experience or in situations that ended long ago. Sessions can make this visible.',
          placeholder: 'What I am carrying and where it came from...',
        },
        {
          type: 'text',
          header: 'Working with the Body',
          lines: [
            'The body responds to attention. Simple practices can help continue what the session started.',
            '\u00a7',
            'Placing a hand on a tense area and breathing into it. Gentle stretching without forcing anything. Walking slowly and noticing how your feet meet the ground. Warm baths or showers with deliberate attention to sensation.',
            '\u00a7',
            'These are not exercises. They are ways of maintaining the conversation your body started during the session.',
          ],
        },
        {
          type: 'selector',
          prompt: 'Which of these body-based practices feel right for you right now?',
          key: 'somaticPractices',
          columns: 2,
          multiSelect: true,
          options: [
            { id: 'stretching', label: 'Gentle stretching or yoga' },
            { id: 'walking', label: 'Walking in nature' },
            { id: 'breathwork', label: 'Breathwork' },
            { id: 'bath', label: 'Warm bath or shower' },
            { id: 'dance', label: 'Dance or free movement' },
            { id: 'massage', label: 'Massage or bodywork' },
            { id: 'rest', label: 'Rest and sleep' },
            { id: 'other', label: 'Something else' },
          ],
          journal: {
            prompt: 'Is there a specific practice you want to commit to?',
            placeholder: 'What I will try...',
            rows: 3,
          },
        },
        {
          type: 'prompt',
          prompt: 'If your body could speak directly to you right now, what would it say?',
          context: 'This is not a metaphor. The body has its own intelligence. It registers and responds to experience faster than conscious thought. Letting it speak, even through writing, can surface things the mind has not yet processed.',
          placeholder: 'What my body would tell me...',
        },
        {
          type: 'text',
          header: 'Body & Somatic Awareness',
          lines: [
            'The body does not forget what happened during a session, even when the mind moves on. The physical changes you noticed may continue to unfold over days or weeks.',
            '\u00a7',
            'Your reflections are saved in your journal. Consider revisiting them alongside any body-based practice you chose.',
            '\u00a7',
            'If you are experiencing persistent physical discomfort, unusual pain, or physical symptoms that concern you, consult a healthcare provider. Somatic processing is real, but so are medical conditions that deserve attention.',
          ],
        },
      ],
    },
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['follow-up', 'body', 'somatic', 'journaling', 'reflection'],
  },

  // === NATURE & CONNECTION (Follow-Up Journaling) ===
  {
    id: 'nature-connection',
    type: 'nature-connection',
    category: 'journaling',
    title: 'Nature & Connection',
    description: 'Explore how your relationship to the natural world has shifted since your session. Inspired by the MAPS Psychedelic Integration Workbook.',
    defaultDuration: 20,
    minDuration: 10,
    maxDuration: 40,
    intensity: 'gentle',
    isFollowUpModule: true,
    unlockDelay: 24,
    allowedPhases: ['follow-up'],
    recommendedPhases: ['follow-up'],
    content: {
      screens: [
        {
          type: 'text',
          header: 'Nature & Connection',
          lines: [
            'Many people report that after a session, the natural world feels different. Colors are more vivid, the sound of wind or water carries more weight, and the boundary between self and environment feels thinner.',
            '\u00a7',
            'This is not imagination. Sessions can recalibrate how the nervous system processes sensory information, making the natural world register more deeply.',
            '\u00a7',
            'This reflection will help you explore that connection and consider how to sustain it.',
          ],
        },
        {
          type: 'prompt',
          prompt: 'Has the natural world felt different to you since your session?',
          context: 'Think about the last time you were outside since your session. It could be a walk, standing in a doorway, or looking out a window.',
          placeholder: 'What I have been noticing...',
        },
        {
          type: 'selector',
          prompt: 'What element of the natural world feels most alive to you right now?',
          key: 'natureElement',
          columns: 2,
          multiSelect: true,
          options: [
            { id: 'trees', label: 'Trees and forests' },
            { id: 'water', label: 'Water and oceans' },
            { id: 'sky', label: 'Sky and weather' },
            { id: 'animals', label: 'Animals and wildlife' },
            { id: 'earth', label: 'Soil and earth' },
            { id: 'plants', label: 'Plants and flowers' },
            { id: 'mountains', label: 'Mountains or open land' },
            { id: 'stars', label: 'Night sky and stars' },
          ],
          journal: {
            prompt: 'What is it about this that draws you?',
            placeholder: 'What draws me to this...',
            rows: 3,
          },
        },
        {
          type: 'prompt',
          prompt: 'Was there a moment of connection with nature during or after your session that stayed with you?',
          context: 'Sessions can make a single encounter with nature feel significant. A bird outside the window at the right moment. The texture of bark under your hand. Rain on your face.',
          placeholder: 'A moment I remember...',
        },
        {
          type: 'text',
          header: 'The Oldest Medicine',
          lines: [
            'Long before psychedelics were synthesized in laboratories, plant medicines were used within natural settings by cultures around the world. The relationship between psychedelic experience and the natural world is not incidental.',
            '\u00a7',
            'Research on forest bathing, nature exposure, and outdoor therapy consistently shows that time in nature reduces cortisol, lowers inflammation, and improves mood.',
            '\u00a7',
            'After a session, when the nervous system is still recalibrating, nature provides a regulating environment that supports the integration process without requiring effort.',
          ],
        },
        {
          type: 'prompt',
          prompt: 'Has your relationship to the environment or the planet shifted since your session?',
          context: 'Some people find that sessions shift their awareness of environmental issues, consumption habits, or their sense of responsibility toward the natural world.',
          placeholder: 'How I think about the environment now...',
        },
        {
          type: 'prompt',
          prompt: 'When you spend time in nature, what happens in your body and mind?',
          context: 'Pay attention to the physical response. Does your breathing change? Does your chest open? Does your jaw relax? The body often knows before the mind does why nature matters.',
          placeholder: 'What nature does for me physically...',
        },
        {
          type: 'text',
          header: 'Bringing Nature into Integration',
          lines: [
            'You do not need to live in the wilderness to integrate through nature. A daily walk with deliberate attention to what you see, hear, and feel is enough.',
            '\u00a7',
            'Sit with a tree for ten minutes without your phone. Watch weather change. Put your hands in soil. Eat a meal outside.',
            '\u00a7',
            'The practice is not about doing something special. It is about removing the barriers between you and what is already there.',
          ],
        },
        {
          type: 'selector',
          prompt: 'Which of these feel possible for you in the coming week?',
          key: 'naturePractice',
          columns: 2,
          multiSelect: true,
          options: [
            { id: 'walk', label: 'Daily walk outside' },
            { id: 'park', label: 'Sitting in a park or garden' },
            { id: 'sunrise', label: 'Watching sunrise or sunset' },
            { id: 'garden', label: 'Gardening or touching soil' },
            { id: 'water', label: 'Swimming or being near water' },
            { id: 'meal', label: 'Eating a meal outdoors' },
            { id: 'window', label: 'Sleeping with a window open' },
            { id: 'phone', label: 'Leaving my phone inside' },
          ],
          journal: {
            prompt: 'What will you try first?',
            placeholder: 'I will start with...',
            rows: 3,
          },
        },
        {
          type: 'prompt',
          prompt: 'After your session, do you feel more connected to something beyond yourself?',
          context: 'This could be ecological, spiritual, communal, or something you cannot name. The feeling of being part of a larger system is one of the most consistently reported outcomes of psychedelic experience.',
          placeholder: 'What I feel connected to...',
        },
        {
          type: 'text',
          header: 'Nature & Connection',
          lines: [
            'The connection you feel to the natural world right now is available to you at any time. It does not require a session to access. It requires attention.',
            '\u00a7',
            'Your reflections are saved in your journal. Consider revisiting them the next time you are outdoors. Notice whether the connection you described is still there. It usually is.',
          ],
        },
      ],
    },
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['follow-up', 'nature', 'connection', 'journaling', 'reflection'],
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

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

// Journaling module content (extracted for maintainability)
import { lightJournalingContent, deepJournalingContent, gratitudeReflectionContent, timeCapsuleContent } from './journaling/journalingContent';
import { integrationReflectionContent } from './journaling/integrationReflectionContent';
import { relationshipsReflectionContent } from './journaling/relationshipsReflectionContent';
import { lifestyleReflectionContent } from './journaling/lifestyleReflectionContent';
import { spiritMeaningContent } from './journaling/spiritMeaningContent';
import { bodySomaticContent } from './journaling/bodySomaticContent';
import { natureConnectionContent } from './journaling/natureConnectionContent';
import { routingTestModuleContent } from './master/routingTestModule';

// Display order and labels for module categories in the Add Activity drawer
export const MODULE_CATEGORIES = {
  'pre-session': { label: 'Pre-Session', order: 0 },
  meditation: { label: 'Meditation', order: 1 },
  activity: { label: 'Activity', order: 2 },
  journaling: { label: 'Journaling', order: 3 },
  open: { label: 'Open', order: 4 },
};

// Layer 2: Category → icon key (overrides default SparkleIcon)
export const CATEGORY_ICONS = {
  'pre-session': 'compass',
  meditation: 'waves',
  activity: 'boat',
  journaling: 'notebook-pen',
  open: 'sparkle',
  'follow-up': 'leaf',
};

// Layer 3: Individual module → icon key (overrides category)
export const MODULE_ICONS = {
  'music-listening': 'music',
  'lets-dance': 'music',
  'shaking-the-tree': 'music',
  'open-space': 'clock',
  'values-compass': 'compass',
  'leaves-on-a-stream': 'leaf',
  'body-scan': 'snail',
  'simple-grounding': 'snail',
  'short-grounding': 'snail',
  'self-compassion': 'heart-handshake',
  'the-descent': 'heart-handshake',
  'the-descent-p1': 'heart-handshake',
  'protector-dialogue': 'heart-handshake',
  'protector-dialogue-p1': 'heart-handshake',
  'protector-dialogue-p2': 'heart-handshake',
  'relationships-reflection': 'heart-handshake',
  'inner-child-letter': 'heart-handshake',
  'feeling-dialogue': 'heart-handshake',
  'booster-consideration': 'fire',
};

// Therapeutic frameworks referenced by modules via the `framework` field
export const FRAMEWORKS = {
  act:                     { label: 'Acceptance & Commitment Therapy', abbreviation: 'ACT', description: 'Developing psychological flexibility through acceptance, mindfulness, and values-based action.' },
  ifs:                     { label: 'Internal Family Systems',         abbreviation: 'IFS', description: 'Working with protective and vulnerable inner parts to restore balance and self-leadership.' },
  'somatic-experiencing':  { label: 'Somatic Experiencing',            abbreviation: 'SE',  description: 'Releasing trauma held in the body through gentle awareness of physical sensation.' },
  focusing:                { label: 'Focusing',                        abbreviation: null,  description: 'Listening to the body\'s felt sense to access meaning that lives below conscious thought.' },
  eft:                     { label: 'Emotionally Focused Therapy',     abbreviation: 'EFT', description: 'Understanding attachment patterns and emotional cycles in relationships.' },
  gestalt:                 { label: 'Gestalt Therapy',                 abbreviation: null,  description: 'Direct dialogue with feelings, parts, or absent others to surface unfinished business.' },
  mindfulness:             { label: 'Mindfulness-Based',               abbreviation: null,  description: 'Cultivating present-moment awareness through meditation and non-judgmental observation.' },
  metta:                   { label: 'Metta (Loving-Kindness)',         abbreviation: null,  description: 'Cultivating unconditional friendliness and compassion toward oneself and others.' },
  'coherence-therapy':     { label: 'Coherence Therapy',              abbreviation: null,  description: 'Accessing and transforming the emotional learnings that drive unwanted patterns through experiential reconsolidation.' },
  'psychedelic-integration': { label: 'Psychedelic Integration',       abbreviation: null,  description: 'Structured reflection practices for making sense of psychedelic experience. Inspired by the MAPS Integration Workbook.' },
  general:                 { label: 'General',                         abbreviation: null,  description: 'General therapeutic and wellness practices not tied to a specific framework.' },
};

export const MODULE_TYPES = {
  'breath-meditation': { label: 'Breath Meditation', intensity: 1 },
  'music-listening': { label: 'Music Listening', intensity: 1 },
  'open-awareness': { label: 'Open Awareness', intensity: 3 },
  'body-scan': { label: 'Body Scan', intensity: 1 },
  'simple-grounding': { label: 'Session Grounding', intensity: 1 },
  'short-grounding': { label: 'Basic Grounding', intensity: 1 },
  'light-journaling': { label: 'Light Journaling', intensity: 2 },
  'deep-journaling': { label: 'Deep Journaling', intensity: 3 },
  'therapy-exercise': { label: 'Therapy Exercise', intensity: 5 },
  'parts-work': { label: 'Parts Work', intensity: 5 },
  'letter-writing': { label: 'Letter Writing', intensity: 2 },
  // Note: 'closing-ritual' is now a transition flow (ClosingRitual.jsx), not a module
  'open-space': { label: 'Open Space', intensity: 1 },
  'lets-dance': { label: "Let's Dance", intensity: 5 },
  // Leaves on a Stream (ACT cognitive defusion)
  'leaves-on-a-stream': { label: 'Leaves on a Stream', intensity: 2 },
  // Protector Dialogue (IFS) — linked two-part module
  'protector-dialogue-p1': { label: 'Meeting a Protector', intensity: 4 },
  'protector-dialogue-p2': { label: 'Understanding Your Protector', intensity: 4 },
  // Values Compass (ACT Matrix)
  'values-compass': { label: 'Values Compass', intensity: 2 },
  // Felt Sense (Focusing)
  'felt-sense': { label: 'Felt Sense', intensity: 4 },
  // The Deep Dive (EFT) — linked two-part module
  'the-descent': { label: 'The Deep Dive', intensity: 5 },
  'the-cycle': { label: 'The Cycle', intensity: 4 },
  'booster-consideration': { label: 'Booster Check-In', intensity: 1 },
  // Intention Setting (pre-session)
  'intention-setting': { label: 'Intention Setting', intensity: 1 },
  // Life Graph (pre-session)
  'life-graph': { label: 'Life Graph', intensity: 2 },
  // Mapping the Territory (pre-session)
  'mapping-territory': { label: 'Mapping the Territory', intensity: 1 },
  // Pendulation (Somatic Experiencing)
  'pendulation': { label: 'Pendulation', intensity: 5 },
  // Shaking the Tree (Somatic Movement)
  'shaking-the-tree': { label: 'Shaking the Tree', intensity: 3 },
  // Time Capsule (Future Self Journaling)
  'time-capsule': { label: 'Time Capsule', intensity: 3 },
  // Inner Child Letter
  'inner-child-letter': { label: 'Inner Child Letter', intensity: 3 },
  // Feeling Dialogue
  'feeling-dialogue': { label: 'Dialogue with a Feeling', intensity: 3 },
  // Committed Action (ACT)
  'committed-action': { label: 'Committed Action', intensity: 2 },
  // Integration Reflection (Follow-Up)
  'integration-reflection-journal': { label: 'Integration Reflection', intensity: 2 },
  // Relationships Reflection (Follow-Up)
  'relationships-reflection': { label: 'Relationships Reflection', intensity: 2 },
  // Lifestyle Reflection (Follow-Up)
  'lifestyle-reflection': { label: 'Lifestyle Reflection', intensity: 2 },
  // Spirit & Meaning (Follow-Up)
  'spirit-meaning': { label: 'Spirit & Meaning', intensity: 3 },
  // Body & Somatic Awareness (Follow-Up)
  'body-somatic': { label: 'Body & Somatic Awareness', intensity: 2 },
  // Nature & Connection (Follow-Up)
  'nature-connection': { label: 'Nature & Connection', intensity: 1 },
  // Follow-up phase modules (time-locked, available 8-24h after session)
  'follow-up': { label: 'Follow-Up', intensity: 1 },
  // MasterModule routing/continuation test (search-only)
  'routing-test-module': { label: 'Routing & Continuation Test', intensity: 1 },
};

// Phase restrictions for module intensities
// Valid phases for canAddModuleToPhase validation
export const VALID_PHASES = ['pre-session', 'come-up', 'peak', 'integration', 'follow-up'];

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
    allowedPhases: ['pre-session', 'come-up'],
    recommendedPhases: ['pre-session', 'come-up'],
    hasVariableDuration: false,
    capabilities: {
      controls: { showBeginButton: false, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['intention', 'pre-session', 'writing', 'grounding', 'self-inquiry'],
    framework: ['general'],
    content: { instructions: 'Begins with education on the difference between intentions and expectations. An optional 5-minute grounding meditation helps you settle in. Self-inquiry prompts help you identify what\'s asking for attention, followed by sentence-stem warm-ups and a main intention-writing exercise.' },
  },
  {
    id: 'life-graph',
    type: 'life-graph',
    category: 'pre-session',
    title: 'Life Graph',
    description: 'Chart significant life milestones against a well-being scale, then see your journey visualized as a life graph.',
    defaultDuration: 5,
    allowedPhases: ['pre-session', 'come-up', 'peak', 'integration'],
    recommendedPhases: ['pre-session', 'come-up'],
    hasVariableDuration: false,
    capabilities: {
      controls: { showBeginButton: false, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['life-graph', 'pre-session', 'reflection', 'visualization', 'lifeline'],
    framework: ['general'],
    content: { instructions: 'You\'ll plot key moments from your life on a 0\u201310 well-being scale, starting with two guided entries, then adding as many as you like. The app generates a visual lifeline from your data. An optional deep-dive section offers journaling prompts to explore the patterns you notice.' },
  },
  {
    id: 'mapping-territory',
    type: 'mapping-territory',
    category: 'pre-session',
    title: 'Mapping the Territory',
    description: 'A brief orientation to the kinds of experience that can arise during a session. Based on the work of psychedelic researcher Bill Richards.',
    defaultDuration: 10,
    allowedPhases: ['pre-session', 'come-up'],
    recommendedPhases: ['pre-session'],
    hasVariableDuration: false,
    capabilities: {
      controls: { showBeginButton: false, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['mapping', 'pre-session', 'preparation', 'education', 'Richards'],
    framework: ['general'],
    content: { instructions: 'A self-paced read-through covering the experiential territories \u2014 sensory, biographical, peak, and challenging. Includes self-assessment choices, journaling prompts, and curated music recommendations with streaming links.' },
  },

  // === COME-UP APPROPRIATE (Gentle) ===
  {
    id: 'simple-grounding',
    type: 'simple-grounding',
    category: 'meditation',
    title: 'Session Grounding',
    description: 'A guided grounding meditation designed for an active session. Settle into your body, notice your senses, and find your footing.',
    defaultDuration: 9,
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
    framework: ['general'],
    content: { instructions: 'Audio-guided, approximately 9 minutes. Five sections: settling in, noticing where your body makes contact, tuning into your senses, following your breath, and a gentle closing. Text prompts appear in sync with the voice guidance.' },
  },
  {
    id: 'short-grounding',
    type: 'short-grounding',
    category: 'meditation',
    title: 'Basic Grounding',
    description: 'A brief 5-minute grounding reset. Body contact, senses, and breath — just enough to come back to center.',
    defaultDuration: 5,
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
    framework: ['general'],
    content: { instructions: 'Audio-guided, approximately 4 minutes. A lighter, quicker version of the Session Grounding \u2014 the same five-section structure compressed into a short reset you can use between activities or whenever you need to reorient.' },
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
    framework: ['mindfulness'],
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
    framework: ['general'],
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
    framework: ['general'],
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
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak'],
    content: {
      instructions: 'Pick music from the curated recommendations and set a duration. Five timed phases guide you through: Sway, Bounce, Shake, Move Freely, and Return to stillness \u2014 with haptic pulses at each transition. Afterward, a body-sensation check-in, brief psychoeducation on somatic release, and journaling.',
    },
    capabilities: {
      controls: { showSkipButton: true },
    },
    tags: ['somatic', 'movement', 'shaking', 'body', 'release'],
    framework: ['somatic-experiencing'],
  },

  // === PEAK APPROPRIATE (Moderate) ===
  {
    id: 'open-awareness',
    type: 'open-awareness',
    category: 'meditation',
    title: 'Open Awareness',
    description: 'Rest in awareness itself. No technique, no effort — just noticing.',
    defaultDuration: 15,
    minDuration: 15,
    maxDuration: 30,
    allowedPhases: ['pre-session', 'peak', 'integration'],
    recommendedPhases: ['come-up', 'peak'],
    hasVariableDuration: true,
    durationSteps: [15, 20, 25, 30],
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
    framework: ['mindfulness'],
    content: { instructions: 'A vipassana-inspired audio-guided meditation. You\'ll progressively widen awareness from breath to body to the space around you. Longer durations add extended periods of silence rather than additional instruction, giving you more room to simply rest in awareness.' },
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
    framework: ['mindfulness'],
    content: { instructions: 'Audio-guided. You\'ll move attention progressively from your feet through your legs, pelvis, torso, arms, and head, pausing at each region. Longer durations add extended silence in the later regions rather than covering more ground.' },
  },
  {
    id: 'self-compassion',
    type: 'self-compassion',
    category: 'meditation',
    title: 'Self-Compassion',
    description: 'Channel the natural self-compassion that opens during this experience.',
    defaultDuration: 11,
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
    framework: ['metta'],
    content: { instructions: 'A guided loving-kindness meditation with three variations to choose from: a general self-compassion practice, one that extends compassion to another person, or one that focuses on something specific you are carrying.' },
  },
  {
    id: 'leaves-on-a-stream',
    type: 'leaves-on-a-stream',
    category: 'activity',
    title: 'Leaves on a Stream',
    description: 'A guided meditation for observing your thoughts without getting caught in them. Practice watching them come and go, like leaves floating past on a stream.',
    defaultDuration: 10,
    minDuration: 10,
    maxDuration: 20,
    allowedPhases: ['pre-session', 'come-up', 'peak', 'integration'],
    recommendedPhases: ['pre-session', 'come-up', 'peak'],
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
    framework: ['act'],
    content: { instructions: 'Audio-guided meditation followed by a six-screen reflection on cognitive defusion \u2014 the skill of noticing thoughts without engaging them. Ends with two journaling prompts to capture what showed up and what it was like to let thoughts pass.' },
  },
  {
    id: 'stay-with-it',
    type: 'stay-with-it',
    category: 'activity',
    title: 'Stay With It',
    description: 'A meditation for turning toward whatever you\u2019re feeling and staying present with it, rather than pulling away.',
    defaultDuration: 15,
    minDuration: 10,
    maxDuration: 25,
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
    framework: ['coherence-therapy'],
    content: { instructions: 'Four parts: an audio-guided meditation, a check-in where you select how you\'re feeling from five options (each gives a different tailored response), a seven-screen psychoeducation section on schemas and emotional reconsolidation, and three journaling prompts with an optional juxtaposition exercise.' },
  },
  {
    id: 'pendulation',
    type: 'pendulation',
    category: 'activity',
    title: 'Pendulation',
    description: 'A guided somatic experiencing practice. Track sensations as they move between activation and safety in your body.',
    defaultDuration: 40,
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak'],
    hasVariableDuration: false,
    meditationId: 'pendulation',
    capabilities: {
      controls: { showBeginButton: false, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['somatic-experiencing', 'pendulation', 'meditation', 'guided', 'Levine', 'body-awareness'],
    framework: ['somatic-experiencing'],
    content: { instructions: 'Begins with six screens of somatic education, then moves into an extended audio meditation. At two points during the meditation, you\'ll pause and choose which somatic path to follow based on what you\'re noticing in your body \u2014 the meditation branches accordingly. Ends with a tailored debrief that reflects the path you took. Allow around 40 minutes.' },
  },
  {
    id: 'felt-sense',
    type: 'felt-sense',
    category: 'activity',
    title: 'Felt Sense',
    description: 'Turn inward and let your body show you what it\u2019s holding. No words needed.',
    defaultDuration: 12,
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
    framework: ['focusing'],
    content: { instructions: 'An audio-guided Focusing meditation with two variations to choose from. You will turn attention inward to your body, find where something wants your attention, and stay with it. Followed by a reflection flow and journaling.' },
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
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak'],
    isLinkedParent: true,
    linkedParts: [
      { id: 'the-descent-p1', title: 'The Deep Dive (Part 1)', duration: 25, phase: 'same' },
      { id: 'the-cycle-p2', title: 'The Cycle (Part 2)', duration: 25, phase: 'integration' },
    ],
    tags: ['EFT', 'relationship', 'attachment', 'emotion', 'guided', 'meditation', 'couples'],
    framework: ['eft'],
    content: { instructions: 'Part 1: Choose solo or couple mode, then enter a guided meditation on attachment and surface reactions. Followed by an adaptive check-in, EFT psychoeducation, and reflection journaling. Part 2: Build an interactive map of the friction cycle between you and another person, with a pattern reveal, closing meditation, and journaling. Data from Part 1 carries forward.' },
  },
  // Part 1 — hidden from drawer, added automatically by linked parent
  {
    id: 'the-descent-p1',
    type: 'the-descent',
    category: 'activity',
    title: 'The Deep Dive (Part 1)',
    description: 'A relationship-guided audio meditation for one person or two. Explore what lies beneath surface-level reactions.',
    defaultDuration: 25,
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
    framework: ['eft'],
    content: { instructions: 'An audio-guided meditation for one person or a couple. You will explore what lies beneath surface-level reactions, followed by a check-in, reflection, and journaling.' },
  },
  // Part 2 — hidden from drawer, added automatically by linked parent
  {
    id: 'the-cycle-p2',
    type: 'the-cycle',
    category: 'activity',
    title: 'The Cycle (Part 2)',
    description: 'Map the repeating pattern in your relationship and see it from above.',
    defaultDuration: 25,
    allowedPhases: ['peak', 'integration'],
    hidden: true,
    isLinkedPart: true,
    linkedParentId: 'the-descent',
    capabilities: {
      controls: { showBeginButton: false, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['EFT', 'relationship', 'cycle', 'mapping', 'journaling'],
    framework: ['eft'],
    content: { instructions: 'An interactive mapping exercise that builds on Part 1. You will identify the positions you and another person take during friction, explore what is underneath, and see the repeating cycle visualized. Includes a brief meditation and journaling.' },
  },
  {
    id: 'values-compass',
    type: 'values-compass',
    category: 'activity',
    title: 'Values Compass',
    description: 'Learn and build your own ACT Matrix \u2014 a four-quadrant map of what you value, what hooks you, and the moves you make toward and away from what matters.',
    defaultDuration: 25,
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak', 'integration'],
    hasVariableDuration: false,
    capabilities: {
      controls: { showBeginButton: false, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['ACT', 'values', 'matrix', 'interactive', 'journaling'],
    framework: ['act'],
    content: { instructions: 'Five intro screens teach you the ACT Matrix framework \u2014 two axes (toward/away and inner/outer) forming four quadrants. You\'ll then build each quadrant by adding your own items or choosing from examples, positioning them by drag-and-drop. Once complete, the full matrix is revealed and you\'ll journal through eight guided prompts. Your matrix is saved to your journal as both text and an exportable image.' },
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
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak'],
    content: lightJournalingContent,
    // Uses custom JournalingModule (journal store integration)
    capabilities: {
      prompts: { type: 'static' },
      input: { type: 'journal', saveToJournal: true, placeholder: "What's on your mind?" },
      controls: { showBeginButton: false, showSkipButton: true, continueButtonText: 'Save & Continue' },
      layout: { centered: false, maxWidth: 'lg' },
    },
    tags: ['journaling', 'expression', 'light'],
    framework: ['general'],
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
    allowedPhases: ['integration'],
    recommendedPhases: ['integration'],
    content: deepJournalingContent,
    // Uses custom JournalingModule (journal store integration)
    capabilities: {
      prompts: { type: 'static' },
      input: { type: 'journal', saveToJournal: true, placeholder: 'Let your thoughts flow freely...' },
      controls: { showBeginButton: false, showSkipButton: true, continueButtonText: 'Save & Continue' },
      layout: { centered: false, maxWidth: 'lg' },
    },
    tags: ['journaling', 'deep', 'insight'],
    framework: ['general'],
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
    framework: ['ifs'],
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
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['integration'],
    content: {
      instructions: 'Choose a recipient, then write in three parts: what you feel, what you\'ve never been able to say, and how you want to leave things. The app assembles your entries into a complete letter with a salutation for you to review and edit. Closes with a reflection.',
    },
    // Uses dedicated LetterWritingModule with multi-step flow
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['writing', 'expression', 'healing'],
    framework: ['general'],
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
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['integration'],
    content: gratitudeReflectionContent,
    // Uses custom JournalingModule (journal store integration)
    capabilities: {
      prompts: { type: 'static' },
      input: { type: 'journal', saveToJournal: true, placeholder: 'I am grateful for...' },
      controls: { showBeginButton: false, showSkipButton: true, continueButtonText: 'Save & Continue' },
      layout: { centered: false, maxWidth: 'lg' },
    },
    tags: ['gratitude', 'appreciation', 'positive'],
    framework: ['general'],
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
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['integration'],
    content: timeCapsuleContent,
    capabilities: {
      prompts: { type: 'static' },
      input: { type: 'journal', saveToJournal: true, placeholder: 'Write to your future self...' },
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['journaling', 'reflection', 'future-self', 'integration'],
    framework: ['general'],
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
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['integration'],
    content: {
      instructions: 'Choose an age that feels significant. Three guided prompts help you write directly to that younger version of yourself. The app assembles your entries into a full letter for review. Closes with a reflection on what came up.',
    },
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['journaling', 'inner-child', 'healing', 'letter'],
    framework: ['ifs'],
  },

  // === DIALOGUE WITH A FEELING (Gestalt / IFS) ===
  {
    id: 'feeling-dialogue',
    type: 'feeling-dialogue',
    category: 'journaling',
    title: 'Dialogue with a Feeling',
    description: 'Name a feeling that\'s present and have a back-and-forth conversation with it.',
    defaultDuration: 20,
    minDuration: 15,
    maxDuration: 40,
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak'],
    content: {
      instructions: 'A Gestalt-inspired exercise. Name a feeling and notice where it lives in your body, then move through four written exchanges \u2014 you speak to it, it responds, you reply, and it tells you what it needs. The assembled dialogue is shown for review, followed by a closing reflection.',
    },
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['journaling', 'gestalt', 'emotions', 'dialogue'],
    framework: ['gestalt', 'ifs'],
  },

  // === COMMITTED ACTION (ACT Framework) ===
  {
    id: 'committed-action',
    type: 'committed-action',
    category: 'journaling',
    title: 'Committed Action',
    description: 'Identify a value, name what gets in the way, and write a commitment to act.',
    defaultDuration: 20,
    minDuration: 10,
    maxDuration: 30,
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['integration'],
    content: {
      instructions: 'An ACT-based guided flow in four steps: name a value that matters, identify a barrier, explore your willingness to move forward despite discomfort, and write a concrete action commitment. The app assembles your responses for review.',
    },
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['ACT', 'values', 'commitment', 'journaling'],
    framework: ['act'],
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
    isFollowUpModule: true,
    allowedPhases: ['follow-up'],
    recommendedPhases: ['follow-up'],
    content: integrationReflectionContent,
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['follow-up', 'integration', 'journaling', 'reflection'],
    framework: ['psychedelic-integration'],
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
    isFollowUpModule: true,
    allowedPhases: ['follow-up'],
    recommendedPhases: ['follow-up'],
    content: relationshipsReflectionContent,
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['follow-up', 'relationships', 'journaling', 'reflection'],
    framework: ['psychedelic-integration'],
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
    isFollowUpModule: true,
    allowedPhases: ['follow-up'],
    recommendedPhases: ['follow-up'],
    content: lifestyleReflectionContent,
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['follow-up', 'lifestyle', 'journaling', 'reflection'],
    framework: ['psychedelic-integration'],
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
    isFollowUpModule: true,
    allowedPhases: ['follow-up'],
    recommendedPhases: ['follow-up'],
    content: spiritMeaningContent,
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['follow-up', 'spirit', 'meaning', 'existential', 'journaling', 'reflection'],
    framework: ['psychedelic-integration'],
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
    isFollowUpModule: true,
    allowedPhases: ['follow-up'],
    recommendedPhases: ['follow-up'],
    content: bodySomaticContent,
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['follow-up', 'body', 'somatic', 'journaling', 'reflection'],
    framework: ['psychedelic-integration'],
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
    isFollowUpModule: true,
    allowedPhases: ['follow-up'],
    recommendedPhases: ['follow-up'],
    content: natureConnectionContent,
    capabilities: {
      controls: { showBeginButton: true, showSkipButton: true },
      layout: { centered: false, maxWidth: 'sm' },
    },
    tags: ['follow-up', 'nature', 'connection', 'journaling', 'reflection'],
    framework: ['psychedelic-integration'],
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
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak'],
    isLinkedParent: true,
    linkedParts: [
      { id: 'protector-dialogue-p1', title: 'Meeting a Protector (Part 1)', duration: 25, phase: 'same' },
      { id: 'protector-dialogue-p2', title: 'Understanding Your Protector (Part 2)', duration: 30, phase: 'integration' },
    ],
    tags: ['IFS', 'parts-work', 'protector', 'dialogue', 'deep-work', 'guided', 'meditation'],
    framework: ['ifs'],
    content: { instructions: 'A two-part IFS practice. Part 1 guides you through meeting a protective part of yourself via meditation and reflection. Part 2 deepens the dialogue during integration, exploring what the protector guards and what it needs.' },
  },
  // Part 1 — hidden from drawer, added automatically by linked parent
  {
    id: 'protector-dialogue-p1',
    type: 'protector-dialogue-p1',
    category: 'activity',
    title: 'Meeting a Protector (Part 1)',
    description: 'Guided meditation and reflection to meet a protective part of yourself.',
    defaultDuration: 25,
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
    framework: ['ifs'],
    content: { instructions: 'A guided flow to meet a protective part of yourself. You will move through a breath exercise, guided meditation, and a series of reflections to name the protector, notice where it lives in your body, and hear what it wants you to know.' },
  },
  // Part 2 — hidden from drawer, added automatically by linked parent
  {
    id: 'protector-dialogue-p2',
    type: 'protector-dialogue-p2',
    category: 'activity',
    title: 'Understanding Your Protector (Part 2)',
    description: 'Deepen your dialogue with the protector you met. Journaling and reflection.',
    defaultDuration: 30,
    allowedPhases: ['peak', 'integration'],
    hidden: true,
    isLinkedPart: true,
    linkedParentId: 'protector-dialogue',
    capabilities: {
      controls: { showBeginButton: false, showSkipButton: true, skipConfirmation: true },
      layout: { centered: true, maxWidth: 'sm' },
    },
    tags: ['IFS', 'parts-work', 'protector', 'journaling'],
    framework: ['ifs'],
    content: { instructions: 'A guided integration exercise that continues the dialogue from Part 1. You will reconnect with the protector, explore its origins and what it fears, and move through a dialogue cycle of asking, listening, and responding.' },
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
    framework: ['general'],
  },

  // === MASTER MODULE TEST ===
  // === ROUTING & CONTINUATION TEST ===
  {
    id: 'routing-test-module',
    type: 'routing-test-module',
    category: 'activity',
    title: 'Routing & Continuation Test',
    description: 'Tests skip-ahead routing, custom bookmarks, visited-section skipping, and section visit conditions.',
    defaultDuration: 5,
    allowedPhases: ['come-up', 'peak', 'integration'],
    recommendedPhases: [],
    searchOnly: true,
    hasVariableDuration: false,
    tags: ['test', 'routing', 'master', 'master-module'],
    framework: ['general'],
    content: {
      instructions: 'Tests the routing and bookmark system. Expected flow: 0 → 1 → 2 → 5 → 4 → 6.',
      masterModuleContent: routingTestModuleContent,
    },
  },

  // === BOOSTER CONSIDERATION ===
  {
    id: 'booster-consideration',
    type: 'booster-consideration',
    title: 'Booster Check-In',
    description: 'A guided check-in at the 90-minute mark to consider whether a supplemental dose is right for you.',
    defaultDuration: 5,
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak', 'integration'],
    isBoosterModule: true,
    content: {
      instructions: 'This module will guide you through a brief check-in about taking a supplemental dose.',
    },
    tags: ['booster', 'check-in', 'supplemental'],
    framework: ['general'],
  },

];

// Derive intensity from MODULE_TYPES (single source of truth)
moduleLibrary.forEach((m) => {
  if (MODULE_TYPES[m.type]) {
    m.intensity = MODULE_TYPES[m.type].intensity;
  }
});

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
 * Returns { allowed: boolean, error?: string }
 *
 * Agnostic gating: the only hard block is follow-up modules outside the
 * follow-up phase. Recommendations are expressed via `recommendedPhases`
 * and surfaced through the Recommended filter, not through gating.
 */
export function canAddModuleToPhase(moduleId, phase) {
  const module = getModuleById(moduleId);
  if (!module) {
    return { allowed: false, error: 'Module not found' };
  }

  // Preview = unrestricted sandbox
  if (phase === 'preview') {
    return { allowed: true };
  }

  if (!VALID_PHASES.includes(phase)) {
    return { allowed: false, error: 'Invalid phase' };
  }

  // HARD GATE: follow-up modules are time-locked to the follow-up phase
  if (module.isFollowUpModule && phase !== 'follow-up') {
    return { allowed: false, error: `"${module.title}" is only available during follow-up.` };
  }

  // HARD GATE: booster module is only relevant during peak and integration
  if (module.isBoosterModule && phase !== 'peak' && phase !== 'integration') {
    return { allowed: false, error: `"${module.title}" is only available during the peak or integration phase.` };
  }

  return { allowed: true };
}

/**
 * Get modules grouped by intensity
 */
export function getModulesGroupedByIntensity() {
  return {
    low: moduleLibrary.filter((m) => m.intensity <= 2),
    moderate: moduleLibrary.filter((m) => m.intensity === 3),
    high: moduleLibrary.filter((m) => m.intensity >= 4),
  };
}

/**
 * Get follow-up modules (time-locked modules for post-session)
 */
export function getFollowUpModules() {
  return moduleLibrary.filter((m) => m.isFollowUpModule);
}

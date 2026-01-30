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

export const MODULE_TYPES = {
  grounding: { label: 'Grounding', intensity: 'gentle' },
  breathing: { label: 'Breathing', intensity: 'gentle' },
  'breath-meditation': { label: 'Breath Meditation', intensity: 'gentle' },
  'guided-meditation': { label: 'Guided Meditation', intensity: 'gentle' },
  'music-listening': { label: 'Music Listening', intensity: 'gentle' },
  'open-awareness': { label: 'Open Awareness', intensity: 'moderate' },
  'body-scan': { label: 'Body Scan', intensity: 'moderate' },
  'simple-grounding': { label: 'Simple Grounding', intensity: 'gentle' },
  'light-journaling': { label: 'Light Journaling', intensity: 'moderate' },
  'deep-journaling': { label: 'Deep Journaling', intensity: 'deep' },
  'therapy-exercise': { label: 'Therapy Exercise', intensity: 'deep' },
  'parts-work': { label: 'Parts Work', intensity: 'deep' },
  'letter-writing': { label: 'Letter Writing', intensity: 'deep' },
  // Note: 'closing-ritual' is now a transition flow (ClosingRitual.jsx), not a module
  'open-space': { label: 'Open Space', intensity: 'gentle' },
  'booster-consideration': { label: 'Booster Check-In', intensity: 'gentle' },
  // Follow-up phase modules (time-locked, available 24-48h after session)
  'follow-up': { label: 'Follow-Up', intensity: 'gentle' },
};

// Phase restrictions for module intensities
export const PHASE_INTENSITY_RULES = {
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
  // === COME-UP APPROPRIATE (Gentle) ===
  {
    id: 'grounding-basic',
    type: 'grounding',
    title: 'Grounding Meditation',
    description: 'A simple practice to feel present and connected to your body and surroundings.',
    defaultDuration: 10,
    minDuration: 5,
    maxDuration: 20,
    intensity: 'gentle',
    allowedPhases: ['come-up', 'peak', 'integration'],
    recommendedPhases: ['come-up'],
    content: {
      instructions: 'Find a comfortable position. Feel your body making contact with the surface beneath you. Notice the weight of your body, the temperature of the air, any sounds around you.',
      prompts: [
        { title: 'Notice Your Body', text: 'Feel your feet on the ground. Notice where your body is supported. You are safe here.' },
        { title: 'Breathe Slowly', text: 'Breathe in slowly for 4 counts... hold for 4... and out for 6. Let each breath settle you deeper.' },
        { title: 'Set Your Intention', text: 'What do you want to remember about why you\'re here today? Hold that intention gently.' },
      ],
    },
    // Uses custom GroundingModule component (sequential steps)
    capabilities: {
      prompts: { type: 'sequential', showProgress: true, fadeTransition: true },
      controls: { showBeginButton: false, showSkipButton: true, showBackButton: true },
    },
    tags: ['grounding', 'beginner', 'calming'],
  },
  {
    id: 'simple-grounding',
    type: 'simple-grounding',
    title: 'Simple Grounding',
    description: 'A brief grounding practice to feel present and connected. Settle in, notice your senses, and return to the here and now.',
    defaultDuration: 5,
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
    tags: ['grounding', 'brief', 'calming', 'come-up', 'guided'],
  },
  {
    id: 'breathing-4-7-8',
    type: 'breathing',
    title: '4-7-8 Breathing',
    description: 'A calming breath pattern to activate your parasympathetic nervous system.',
    defaultDuration: 10,
    minDuration: 5,
    maxDuration: 15,
    intensity: 'gentle',
    allowedPhases: ['come-up', 'peak', 'integration'],
    recommendedPhases: ['come-up'],
    content: {
      instructions: 'Breathe in through your nose for 4 counts. Hold for 7 counts. Exhale slowly through your mouth for 8 counts. Repeat.',
      timerConfig: {
        inhale: 4,
        hold: 7,
        exhale: 8,
        cycles: 8,
      },
    },
    // Uses custom BreathingModule component (phase-based animation)
    capabilities: {
      timer: { type: 'breathing', autoComplete: true },
      animation: { type: 'breathing-circle', size: 'large' },
      controls: { showBeginButton: true, showSkipButton: true },
    },
    tags: ['breathing', 'calming', 'anxiety-relief'],
  },
  {
    id: 'breathing-box',
    type: 'breathing',
    title: 'Box Breathing',
    description: 'Equal counts for inhale, hold, exhale, hold. Creates balance and calm.',
    defaultDuration: 10,
    minDuration: 5,
    maxDuration: 15,
    intensity: 'gentle',
    allowedPhases: ['come-up', 'peak', 'integration'],
    recommendedPhases: ['come-up'],
    content: {
      instructions: 'Breathe in for 4 counts. Hold for 4 counts. Breathe out for 4 counts. Hold for 4 counts. Repeat.',
      timerConfig: {
        inhale: 4,
        hold: 4,
        exhale: 4,
        holdAfterExhale: 4,
        cycles: 10,
      },
    },
    // Uses custom BreathingModule component (phase-based animation)
    capabilities: {
      timer: { type: 'breathing', autoComplete: true },
      animation: { type: 'breathing-circle', size: 'large' },
      controls: { showBeginButton: true, showSkipButton: true },
    },
    tags: ['breathing', 'calming', 'focus'],
  },

  // === BREATH MEDITATION 2.0 (with BreathOrb animation) ===
  {
    id: 'breath-meditation-calm',
    type: 'breath-meditation',
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
    id: 'breath-meditation-deep',
    type: 'breath-meditation',
    title: 'Deep Relaxation Breath',
    description: 'A longer breath meditation that progressively slows your breathing for deep relaxation.',
    defaultDuration: 15,
    minDuration: 10,
    maxDuration: 30,
    intensity: 'gentle',
    allowedPhases: ['come-up', 'peak', 'integration'],
    recommendedPhases: ['come-up', 'peak'],
    content: {
      instructions: 'This practice will gradually slow your breath. Trust the orb and let your nervous system settle.',
      breathSequences: [
        // Warm up with normal breathing
        { type: 'cycles', count: 3, pattern: { inhale: 3, hold: 0, exhale: 3, holdAfterExhale: 0 } },
        // Box breathing to establish rhythm
        { type: 'cycles', count: 4, pattern: { inhale: 4, hold: 4, exhale: 4, holdAfterExhale: 4 } },
        // Slow down with extended exhale
        { type: 'cycles', count: 5, pattern: { inhale: 4, hold: 4, exhale: 6, holdAfterExhale: 2 } },
        // Deep slow breathing
        { type: 'duration', seconds: 300, pattern: { inhale: 5, hold: 5, exhale: 8, holdAfterExhale: 2 } },
      ],
    },
    // Uses custom BreathMeditationModule with BreathOrb
    capabilities: {
      timer: { type: 'breathing', autoComplete: true },
      animation: { type: 'breath-orb' },
      controls: { showBeginButton: true, showPauseButton: true, showSkipButton: true },
    },
    tags: ['breathing', 'meditation', 'deep-relaxation', 'orb'],
  },
  {
    id: 'breath-meditation-4-7-8',
    type: 'breath-meditation',
    title: '4-7-8 Breath Meditation',
    description: 'The classic relaxation breath with visual guidance. Activates your parasympathetic nervous system.',
    defaultDuration: 10,
    minDuration: 5,
    maxDuration: 15,
    intensity: 'gentle',
    allowedPhases: ['come-up', 'peak', 'integration'],
    recommendedPhases: ['come-up', 'integration'],
    content: {
      instructions: 'Breathe in for 4, hold for 7, exhale for 8. This pattern activates your relaxation response.',
      breathSequences: [
        // Pure 4-7-8 breathing for the full duration
        { type: 'cycles', count: 10, pattern: { inhale: 4, hold: 7, exhale: 8, holdAfterExhale: 0 } },
      ],
    },
    // Uses custom BreathMeditationModule with BreathOrb
    capabilities: {
      timer: { type: 'breathing', autoComplete: true },
      animation: { type: 'breath-orb' },
      controls: { showBeginButton: true, showPauseButton: true, showSkipButton: true },
    },
    tags: ['breathing', 'meditation', '4-7-8', 'relaxation', 'orb'],
  },
  {
    id: 'breath-meditation-guided',
    type: 'breath-meditation',
    title: 'Guided Breath Meditation',
    description: 'A breath meditation with visual orb and spoken guidance to help you settle into presence.',
    defaultDuration: 10,
    minDuration: 10,
    maxDuration: 30,
    intensity: 'gentle',
    allowedPhases: ['come-up', 'peak', 'integration'],
    recommendedPhases: ['come-up', 'peak'],
    content: {
      instructions: 'Follow the orb with your breath while guided prompts help you settle into presence.',
      // No breathSequences = uses guided mode with generateBreathSequences()
    },
    // Uses custom BreathMeditationModule with BreathOrb and guided prompts
    capabilities: {
      timer: { type: 'breathing', autoComplete: true },
      animation: { type: 'breath-orb' },
      controls: { showBeginButton: true, showPauseButton: true, showSkipButton: true },
    },
    tags: ['breathing', 'meditation', 'guided', 'orb'],
  },

  {
    id: 'guided-meditation-breath',
    type: 'guided-meditation',
    title: 'Breath Awareness',
    description: 'A guided meditation focusing on the breath as an anchor to the present moment.',
    defaultDuration: 10,
    minDuration: 10,
    maxDuration: 30,
    intensity: 'gentle',
    allowedPhases: ['come-up', 'peak', 'integration'],
    recommendedPhases: ['come-up', 'peak'],
    hasVariableDuration: true,
    durationSteps: [10, 15, 20, 25, 30],
    meditationId: 'breath-awareness-default',
    // Uses custom GuidedMeditationModule (timed prompts + playback)
    capabilities: {
      timer: { type: 'elapsed', showProgress: true, showTimeDisplay: true, autoComplete: true },
      prompts: { type: 'timed', fadeTransition: true },
      // Future: audio: { type: 'voiceover', showMuteButton: true },
      // Future: animation: { type: 'glowing-orb', color: 'orange' },
      controls: { showBeginButton: true, showPauseButton: true, showSkipButton: true, skipConfirmation: true },
    },
    tags: ['meditation', 'breath', 'mindfulness', 'guided'],
  },
  {
    id: 'music-listening',
    type: 'music-listening',
    title: 'Music Immersion',
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

  // === PEAK APPROPRIATE (Moderate) ===
  {
    id: 'open-awareness',
    type: 'open-awareness',
    title: 'Open Awareness',
    description: 'Rest in awareness itself. No technique, no effort — just noticing.',
    defaultDuration: 15,
    minDuration: 10,
    maxDuration: 30,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
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
    title: 'Body Scan',
    description: 'A guided scan through your entire body. Notice what is present without needing to change anything.',
    defaultDuration: 10,
    minDuration: 10,
    maxDuration: 15,
    intensity: 'moderate',
    allowedPhases: ['come-up', 'peak', 'integration'],
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
    id: 'light-journaling',
    type: 'light-journaling',
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

  // === UTILITY MODULES (Any phase) ===
  {
    id: 'open-space',
    type: 'open-space',
    title: 'Open Space',
    description: 'Unstructured time to simply be with whatever arises.',
    defaultDuration: 20,
    minDuration: 5,
    maxDuration: 60,
    intensity: 'gentle',
    allowedPhases: ['come-up', 'peak', 'integration'],
    recommendedPhases: ['come-up', 'peak', 'integration'],
    content: {
      instructions: 'This is open time. Rest, move, listen to music, or simply be. Follow your inner guidance.',
    },
    capabilities: {
      timer: { type: 'elapsed', autoComplete: true, awayFromScreen: true },
      prompts: { type: 'static' },
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

  // === FOLLOW-UP MODULES (Time-locked, 24-48h after session) ===
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
    unlockDelay: 24, // hours after session close
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
    unlockDelay: 24, // hours after session close
    content: {
      instructions: 'Revisit the intentions and messages you wrote during your session.',
    },
    tags: ['follow-up', 'revisit', 'reflection'],
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
    unlockDelay: 48, // hours after session close
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

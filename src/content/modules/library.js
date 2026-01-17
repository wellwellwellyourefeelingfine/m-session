/**
 * Module Library
 * Central repository of all available session modules
 * Each module has metadata about when/how it can be used
 */

export const MODULE_TYPES = {
  grounding: { label: 'Grounding', intensity: 'gentle' },
  breathing: { label: 'Breathing', intensity: 'gentle' },
  'guided-meditation': { label: 'Guided Meditation', intensity: 'gentle' },
  'body-scan-light': { label: 'Light Body Scan', intensity: 'gentle' },
  'music-listening': { label: 'Music Listening', intensity: 'gentle' },
  'gentle-movement': { label: 'Gentle Movement', intensity: 'gentle' },
  'open-awareness': { label: 'Open Awareness', intensity: 'moderate' },
  'light-journaling': { label: 'Light Journaling', intensity: 'moderate' },
  'body-scan-deep': { label: 'Deep Body Scan', intensity: 'moderate' },
  'self-compassion': { label: 'Self Compassion', intensity: 'moderate' },
  'deep-journaling': { label: 'Deep Journaling', intensity: 'deep' },
  'therapy-exercise': { label: 'Therapy Exercise', intensity: 'deep' },
  'parts-work': { label: 'Parts Work', intensity: 'deep' },
  'letter-writing': { label: 'Letter Writing', intensity: 'deep' },
  'closing-ritual': { label: 'Closing Ritual', intensity: 'moderate' },
  'check-in': { label: 'Check-In', intensity: 'gentle' },
  'open-space': { label: 'Open Space', intensity: 'gentle' },
  break: { label: 'Break', intensity: 'gentle' },
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
        'What do you notice in your body right now?',
        'What are five things you can see, four you can hear, three you can touch?',
      ],
    },
    tags: ['grounding', 'beginner', 'calming'],
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
    tags: ['breathing', 'calming', 'focus'],
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
    tags: ['meditation', 'breath', 'mindfulness', 'guided'],
  },
  {
    id: 'body-scan-light',
    type: 'body-scan-light',
    title: 'Light Body Scan',
    description: 'A gentle scan through your body, noticing sensations without judgment.',
    defaultDuration: 15,
    minDuration: 10,
    maxDuration: 25,
    intensity: 'gentle',
    allowedPhases: ['come-up', 'peak'],
    recommendedPhases: ['come-up', 'peak'],
    content: {
      instructions: 'Starting from the top of your head, slowly move your attention down through your body. Just notice what\'s there without trying to change anything.',
      prompts: [
        'What sensations do you notice in your head and face?',
        'How does your chest feel? Your belly?',
        'What do you notice in your hands and feet?',
      ],
    },
    tags: ['body', 'awareness', 'gentle'],
  },
  {
    id: 'music-listening',
    type: 'music-listening',
    title: 'Music Immersion',
    description: 'Simply listen to music and let it move through you.',
    defaultDuration: 20,
    minDuration: 10,
    maxDuration: 45,
    intensity: 'gentle',
    allowedPhases: ['come-up', 'peak', 'integration'],
    recommendedPhases: ['come-up', 'peak'],
    content: {
      instructions: 'Put on music that feels right for this moment. Close your eyes and let the music wash over you. There\'s nothing to do but listen and feel.',
    },
    tags: ['music', 'passive', 'immersive'],
  },
  {
    id: 'gentle-movement',
    type: 'gentle-movement',
    title: 'Gentle Movement',
    description: 'Slow, intuitive movement to connect with your body.',
    defaultDuration: 15,
    minDuration: 10,
    maxDuration: 30,
    intensity: 'gentle',
    allowedPhases: ['come-up', 'peak'],
    recommendedPhases: ['come-up'],
    content: {
      instructions: 'Stand or sit comfortably. Begin to move slowly, following what your body wants. There\'s no right way—just gentle exploration.',
      prompts: [
        'What movement does your body want right now?',
        'Can you move even slower?',
      ],
    },
    tags: ['movement', 'body', 'intuitive'],
  },

  // === PEAK APPROPRIATE (Moderate) ===
  {
    id: 'open-awareness',
    type: 'open-awareness',
    title: 'Open Awareness',
    description: 'Rest in spacious awareness, letting everything be as it is.',
    defaultDuration: 20,
    minDuration: 10,
    maxDuration: 45,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak'],
    content: {
      instructions: 'Let go of any agenda. Simply be aware of whatever arises—thoughts, feelings, sensations—without grasping or pushing away. Rest in the space of awareness itself.',
    },
    tags: ['meditation', 'spacious', 'non-directive'],
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
    tags: ['journaling', 'expression', 'light'],
  },
  {
    id: 'body-scan-deep',
    type: 'body-scan-deep',
    title: 'Deep Body Exploration',
    description: 'A more thorough body scan, staying with sensations that call for attention.',
    defaultDuration: 25,
    minDuration: 15,
    maxDuration: 40,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak', 'integration'],
    content: {
      instructions: 'Scan through your body slowly. When you find an area that holds tension or asks for attention, stay there. Breathe into it. See what it has to tell you.',
      prompts: [
        'Where in your body do you feel most alive?',
        'Is there anywhere holding tension or emotion?',
        'What does this part of your body want you to know?',
      ],
    },
    tags: ['body', 'somatic', 'exploration'],
  },
  {
    id: 'self-compassion',
    type: 'self-compassion',
    title: 'Self-Compassion Practice',
    description: 'Offering kindness and understanding to yourself.',
    defaultDuration: 15,
    minDuration: 10,
    maxDuration: 25,
    intensity: 'moderate',
    allowedPhases: ['peak', 'integration'],
    recommendedPhases: ['peak', 'integration'],
    content: {
      instructions: 'Place a hand on your heart. Acknowledge that this moment is difficult, or that you\'re doing hard work. Offer yourself the same kindness you would offer a dear friend.',
      prompts: [
        'What do I need to hear right now?',
        'How can I be gentle with myself?',
        'What would I say to a friend feeling this way?',
      ],
    },
    tags: ['self-compassion', 'kindness', 'heart'],
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
    tags: ['gratitude', 'appreciation', 'positive'],
  },
  {
    id: 'closing-ritual',
    type: 'closing-ritual',
    title: 'Closing Ritual',
    description: 'A gentle way to close your session and honor the experience.',
    defaultDuration: 15,
    minDuration: 10,
    maxDuration: 20,
    intensity: 'moderate',
    allowedPhases: ['integration'],
    recommendedPhases: ['integration'],
    content: {
      instructions: 'Take a moment to honor this experience. Acknowledge what you\'ve explored, what you\'ve learned, what you want to carry forward.',
      prompts: [
        'What am I taking away from this session?',
        'What do I want to remember?',
        'How do I want to be in the days ahead?',
      ],
    },
    tags: ['closing', 'integration', 'completion'],
  },

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
    tags: ['open', 'flexible', 'unstructured'],
  },
  {
    id: 'break',
    type: 'break',
    title: 'Break',
    description: 'Time for bathroom, water, snacks, or stretching.',
    defaultDuration: 10,
    minDuration: 5,
    maxDuration: 20,
    intensity: 'gentle',
    allowedPhases: ['come-up', 'peak', 'integration'],
    recommendedPhases: ['come-up', 'peak', 'integration'],
    content: {
      instructions: 'Take care of your physical needs. Stay hydrated. Stretch if your body wants to move.',
    },
    tags: ['break', 'rest', 'physical'],
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

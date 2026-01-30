/**
 * Self-Compassion Meditation
 *
 * A guided self-compassion meditation with 3 variations:
 * - Default (~11 min): Core only
 * - Relationship (~15 min): Core + relationship-focused extension
 * - Going Deeper (~14 min): Core + deeper self-exploration extension
 *
 * All variations share a common core (Parts 1-4 + Parts 6-7).
 * Variations insert between Part 4 and Part 6.
 *
 * 70 total unique clips: 42 core + 15 relationship + 13 going deeper
 *
 * Audio: /audio/meditations/self-compassion/{clipId}.mp3
 * Fixed duration per variation (no silence expansion)
 */

const SPEAKING_RATE = 90; // words per minute — slower than body scan, per script direction

// ============================================
// CORE CLIPS (42 clips, used in all variations)
// ============================================

const coreClips = [
  // --- Part 1: Arriving (1:15 total) ---
  {
    id: 'core-01',
    text: 'Let yourself settle into a comfortable position.',
    baseSilenceAfter: 4,
  },
  {
    id: 'core-02',
    text: 'You can close your eyes, or let your gaze rest softly downward.',
    baseSilenceAfter: 4,
  },
  {
    id: 'core-03',
    text: 'Take a moment to notice how you\'re feeling right now. Whatever is here is welcome.',
    baseSilenceAfter: 5,
  },
  {
    id: 'core-04',
    text: 'You don\'t need to change anything. You don\'t need to prepare yourself in any special way.',
    baseSilenceAfter: 5,
  },
  {
    id: 'core-05',
    text: 'This is simply a time to be with yourself. Gently. Without agenda.',
    baseSilenceAfter: 6,
  },
  {
    id: 'core-06',
    text: 'Let your breathing be natural. Easy.',
    baseSilenceAfter: 6,
  },

  // --- Part 2: Turning Toward Yourself (1:45 total) ---
  {
    id: 'core-07',
    text: 'Now, bring your attention inward. Toward yourself.',
    baseSilenceAfter: 5,
  },
  {
    id: 'core-08',
    text: 'Not your thoughts. Not what you need to do. Just... you. The one who\'s here.',
    baseSilenceAfter: 5,
  },
  {
    id: 'core-09',
    text: 'If it helps, you might place a hand on your chest. Or simply imagine warmth gathering there.',
    baseSilenceAfter: 5,
  },
  {
    id: 'core-10',
    text: 'This is a chance to turn toward yourself the way you might turn toward someone you care about.',
    baseSilenceAfter: 6,
  },
  {
    id: 'core-11',
    text: 'Most of us don\'t do this very often. We\'re usually focused outward \u2014 on tasks, on others, on problems to solve.',
    baseSilenceAfter: 4,
  },
  {
    id: 'core-12',
    text: 'Right now, there\'s nothing to solve. There\'s just you, being with yourself.',
    baseSilenceAfter: 6,
  },

  // --- Part 3: Acknowledging (2:00 total) ---
  {
    id: 'core-13',
    text: 'Take a moment to acknowledge something simple: being human is not easy.',
    baseSilenceAfter: 5,
  },
  {
    id: 'core-14',
    text: 'Everyone struggles. Everyone carries things they wish were different. Everyone has parts of themselves they find hard to accept.',
    baseSilenceAfter: 5,
  },
  {
    id: 'core-15',
    text: 'This is not a flaw. This is what it means to be alive.',
    baseSilenceAfter: 6,
  },
  {
    id: 'core-16',
    text: 'You might notice places where you\'ve been hard on yourself. Mistakes you replay. Ways you feel you\'ve fallen short.',
    baseSilenceAfter: 5,
  },
  {
    id: 'core-17',
    text: 'You don\'t need to go looking for these. But if they\'re present, let them be present.',
    baseSilenceAfter: 5,
  },
  {
    id: 'core-18',
    text: 'And consider: what if these parts of you \u2014 the imperfect parts, the struggling parts \u2014 what if they also deserve kindness?',
    baseSilenceAfter: 7,
  },
  {
    id: 'core-19',
    text: 'Not because you\'ve earned it. Not because you\'ve fixed yourself first. Just because you\'re here. Just because you\'re human.',
    baseSilenceAfter: 6,
  },

  // --- Part 4: Offering Kindness — The Core (3:30 total) ---
  {
    id: 'core-20',
    text: 'Now, I\'m going to offer some phrases. You don\'t need to believe them or make them true.',
    baseSilenceAfter: 3,
  },
  {
    id: 'core-21',
    text: 'Just let them land however they land. Like someone saying something kind to you \u2014 you\'re just receiving.',
    baseSilenceAfter: 5,
  },
  {
    id: 'core-22',
    text: 'May I be gentle with myself.',
    baseSilenceAfter: 7,
  },
  {
    id: 'core-23',
    text: 'May I accept myself as I am in this moment.',
    baseSilenceAfter: 7,
  },
  {
    id: 'core-24',
    text: 'May I give myself the compassion I would give to someone I love.',
    baseSilenceAfter: 7,
  },
  {
    id: 'core-25',
    text: 'If those words feel right, you can silently repeat them. Or just let them settle.',
    baseSilenceAfter: 6,
  },
  {
    id: 'core-26',
    text: 'May I be gentle with myself.',
    baseSilenceAfter: 8,
  },
  {
    id: 'core-27',
    text: 'May I accept myself as I am.',
    baseSilenceAfter: 8,
  },
  {
    id: 'core-28',
    text: 'May I give myself compassion.',
    baseSilenceAfter: 8,
  },
  {
    id: 'core-29',
    text: 'Notice what happens in your body as you hear these words. There may be softening. There may be resistance. There may be emotion. All of it is okay.',
    baseSilenceAfter: 6,
  },
  {
    id: 'core-30',
    text: 'You don\'t need to force anything open. Kindness doesn\'t demand. It just offers.',
    baseSilenceAfter: 7,
  },
  // --- END OF PART 4 — Variation insertion point is here ---

  // --- Part 6: Resting in Kindness (1:30 total) ---
  {
    id: 'core-31',
    text: 'Now, let go of any specific focus. Let go of the phrases.',
    baseSilenceAfter: 5,
  },
  {
    id: 'core-32',
    text: 'Just rest in whatever warmth or openness is present.',
    baseSilenceAfter: 6,
  },
  {
    id: 'core-33',
    text: 'If it helps, imagine you\'re sitting in a space of complete acceptance. Nothing to prove. Nothing to fix. Just held.',
    baseSilenceAfter: 7,
  },
  {
    id: 'core-34',
    text: 'Your only job right now is to receive.',
    baseSilenceAfter: 8,
  },
  {
    id: 'core-35',
    text: 'Let yourself be here.',
    baseSilenceAfter: 10,
  },
  {
    id: 'core-36',
    text: 'Let yourself be enough.',
    baseSilenceAfter: 10,
  },

  // --- Part 7: Closing (1:00 total) ---
  {
    id: 'core-37',
    text: 'In your own time, begin to let this practice come to a close.',
    baseSilenceAfter: 4,
  },
  {
    id: 'core-38',
    text: 'But know that this kindness doesn\'t end when the meditation ends.',
    baseSilenceAfter: 4,
  },
  {
    id: 'core-39',
    text: 'You can return to it anytime. A hand on your chest. A moment of pause. A breath.',
    baseSilenceAfter: 5,
  },
  {
    id: 'core-40',
    text: 'The warmth you\'ve touched is not something you have to create. It\'s already part of you.',
    baseSilenceAfter: 5,
  },
  {
    id: 'core-41',
    text: 'When you\'re ready, let your eyes open gently. Take your time.',
    baseSilenceAfter: 5,
  },
  {
    id: 'core-42',
    text: 'Thank you for being willing to turn toward yourself with kindness.',
    baseSilenceAfter: 0,
  },
];

// ============================================
// VARIATION A: Relationship-Focused (15 clips)
// Inserted between Part 4 (core-30) and Part 6 (core-31)
// ============================================

const relationshipClips = [
  {
    id: 'rel-01',
    text: 'Having offered kindness to yourself, you might now extend that warmth toward someone else.',
    baseSilenceAfter: 5,
  },
  {
    id: 'rel-02',
    text: 'Let someone come to mind. Someone who feels important right now. It could be someone you love easily. Someone you\'re struggling with. Someone you miss. Just let a person arise.',
    baseSilenceAfter: 6,
  },
  {
    id: 'rel-03',
    text: 'You don\'t need to choose perfectly. Whoever comes to mind is the right person for this moment.',
    baseSilenceAfter: 6,
  },
  {
    id: 'rel-04',
    text: 'See if you can picture them. Not an idea of them \u2014 but them. Their face. The way they hold themselves. Something real about who they are.',
    baseSilenceAfter: 6,
  },
  {
    id: 'rel-05',
    text: 'And remember: they are also human. They also struggle. They also carry things they wish were different.',
    baseSilenceAfter: 6,
  },
  {
    id: 'rel-06',
    text: 'Whatever has passed between you \u2014 for now, just let them be a person. Imperfect, like you. Trying, like you.',
    baseSilenceAfter: 7,
  },
  {
    id: 'rel-07',
    text: 'Now, offer the same phrases toward them. You\'re not excusing anything. You\'re not resolving anything. You\'re simply wishing them well.',
    baseSilenceAfter: 5,
  },
  {
    id: 'rel-08',
    text: 'May you be gentle with yourself.',
    baseSilenceAfter: 7,
  },
  {
    id: 'rel-09',
    text: 'May you accept yourself as you are.',
    baseSilenceAfter: 7,
  },
  {
    id: 'rel-10',
    text: 'May you find compassion \u2014 for yourself, and from others.',
    baseSilenceAfter: 8,
  },
  {
    id: 'rel-11',
    text: 'Notice what arises as you offer these words. There may be warmth. There may be grief. There may be resistance. None of it is wrong.',
    baseSilenceAfter: 6,
  },
  {
    id: 'rel-12',
    text: 'You can want good things for someone and still have complicated feelings about them. Both can be true.',
    baseSilenceAfter: 6,
  },
  {
    id: 'rel-13',
    text: 'If it feels right, offer the phrases one more time. Silently, in your own words, in your own way.',
    baseSilenceAfter: 10,
  },
  {
    id: 'rel-14',
    text: 'Now, gently let their image fade. You can return to them later if you want. For now, come back to yourself.',
    baseSilenceAfter: 5,
  },
  {
    id: 'rel-15',
    text: 'Notice that extending kindness to another hasn\'t depleted you. If anything, there may be more warmth present now.',
    baseSilenceAfter: 6,
  },
];

// ============================================
// VARIATION B: Going Deeper (13 clips)
// Inserted at the same point as Variation A
// ============================================

const goingDeeperClips = [
  {
    id: 'deep-01',
    text: 'You\'ve been offering kindness to yourself in a general way. Now, if you\'re willing, you might bring this compassion to something specific.',
    baseSilenceAfter: 5,
  },
  {
    id: 'deep-02',
    text: 'Is there something you\'ve been carrying? A struggle. A mistake. A way you\'ve been hard on yourself.',
    baseSilenceAfter: 5,
  },
  {
    id: 'deep-03',
    text: 'It doesn\'t have to be the biggest thing. Just something real. Something that could use some kindness.',
    baseSilenceAfter: 6,
  },
  {
    id: 'deep-04',
    text: 'Let it come forward, just a little. You don\'t need to dive into the story. Just acknowledge that it\'s there.',
    baseSilenceAfter: 6,
  },
  {
    id: 'deep-05',
    text: 'Now, imagine a close friend came to you carrying this same thing. The same mistake. The same struggle. The same pain.',
    baseSilenceAfter: 5,
  },
  {
    id: 'deep-06',
    text: 'How would you look at them? What would be in your eyes?',
    baseSilenceAfter: 6,
  },
  {
    id: 'deep-07',
    text: 'What would you want them to know?',
    baseSilenceAfter: 7,
  },
  {
    id: 'deep-08',
    text: 'Can you offer that same understanding to yourself?',
    baseSilenceAfter: 8,
  },
  {
    id: 'deep-09',
    text: 'You\'ve been doing your best. Even when your best hasn\'t felt like enough. Even when you\'ve fallen short of who you want to be.',
    baseSilenceAfter: 6,
  },
  {
    id: 'deep-10',
    text: 'That\'s not a reason to withhold compassion. That\'s exactly when compassion is needed most.',
    baseSilenceAfter: 7,
  },
  {
    id: 'deep-11',
    text: 'So offer it now. To yourself. To this part of you that\'s been struggling.',
    baseSilenceAfter: 5,
  },
  {
    id: 'deep-12',
    text: 'May I hold this with kindness. May I give myself room to be imperfect. May I stop waiting until I\'m fixed to be worthy of my own compassion.',
    baseSilenceAfter: 8,
  },
  {
    id: 'deep-13',
    text: 'Now, gently, let the specific focus soften. You\'ve touched it with kindness. That\'s enough for now.',
    baseSilenceAfter: 6,
  },
];


// ============================================
// ASSEMBLY LOGIC
// ============================================

// The insertion point: variation clips insert after core-30 (end of Part 4)
// and before core-31 (start of Part 6: Resting in Kindness)
const INSERTION_INDEX = 30; // core clips [0..29] are Parts 1-4, [30..41] are Parts 6-7

/**
 * Assemble the clip sequence for a given variation
 * @param {string} variationKey - 'default' | 'relationship' | 'going-deeper'
 * @returns {Array} Ordered array of clip objects
 */
function assembleVariation(variationKey) {
  const before = coreClips.slice(0, INSERTION_INDEX);
  const after = coreClips.slice(INSERTION_INDEX);

  switch (variationKey) {
    case 'relationship':
      return [...before, ...relationshipClips, ...after];
    case 'going-deeper':
      return [...before, ...goingDeeperClips, ...after];
    case 'default':
    default:
      return [...coreClips];
  }
}

/**
 * Calculate the speaking duration for a clip using word-count estimation
 * @param {Object} clip - Clip object with text
 * @returns {number} Estimated speaking duration in seconds
 */
function calculateClipSpeakingDuration(clip) {
  const wordCount = clip.text.split(' ').length;
  return (wordCount / SPEAKING_RATE) * 60;
}

/**
 * Calculate the total raw duration for a variation (before rounding)
 * @param {string} variationKey
 * @returns {number} Duration in seconds
 */
function calculateRawDuration(variationKey) {
  const clips = assembleVariation(variationKey);
  return clips.reduce((sum, clip) => {
    return sum + calculateClipSpeakingDuration(clip) + clip.baseSilenceAfter;
  }, 0);
}

/**
 * Calculate the rounded duration for a variation (nearest whole minute, rounded up)
 * @param {string} variationKey
 * @returns {number} Duration in seconds (always a whole minute)
 */
function calculateVariationDuration(variationKey) {
  const rawSeconds = calculateRawDuration(variationKey);
  const minutes = Math.ceil(rawSeconds / 60);
  return minutes * 60;
}


// ============================================
// EXPORTED MEDITATION OBJECT
// ============================================

export const selfCompassionMeditation = {
  id: 'self-compassion',
  title: 'Self-Compassion',
  subtitle: 'Guided self-compassion',
  description: 'Channel the natural self-compassion that opens during this experience. Not about generating warmth through effort \u2014 just allowing and directing what\u2019s already opening.',

  // Audio configuration
  audio: {
    basePath: '/audio/meditations/self-compassion/',
    format: 'mp3',
  },

  // Speaking rate for duration estimation (slower pace per script direction)
  speakingRate: 90,

  // Fixed duration per variation (no DurationPicker)
  isFixedDuration: true,

  // Default variation shown on idle screen
  defaultVariation: 'default',

  // Variation definitions with pre-calculated durations
  variations: {
    default: {
      key: 'default',
      label: 'General Self-Compassion',
      description: 'A practice of offering kindness to yourself, as you are.',
      duration: calculateVariationDuration('default'),
    },
    relationship: {
      key: 'relationship',
      label: 'Self-Compassion with a Relationship',
      description: 'Extend compassion to yourself, then toward someone important to you.',
      duration: calculateVariationDuration('relationship'),
    },
    'going-deeper': {
      key: 'going-deeper',
      label: 'Going Deeper',
      description: 'Bring compassion to something specific you\'ve been carrying.',
      duration: calculateVariationDuration('going-deeper'),
    },
  },

  // Assembly function (called by component with selected variation key)
  assembleVariation,

  // Utility for component to calculate clip speaking duration
  calculateClipSpeakingDuration,
};

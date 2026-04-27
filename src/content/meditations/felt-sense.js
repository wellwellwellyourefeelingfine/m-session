/**
 * Felt Sense Meditation
 *
 * A guided focusing meditation based on Eugene Gendlin's Focusing technique.
 * Two variations:
 * - Default (~17 min): Core practice, gentle introduction
 * - Going Deeper (~26 min): Full practice with extended silences and additional prompts
 *
 * All variations share a common set of prompts. Going Deeper adds
 * variationOnly prompts and uses longer base silences.
 *
 * 44 total unique prompts: 35 shared + 9 going-deeper only
 *
 * Audio: /audio/meditations/felt-sense/{promptId}.mp3
 * Fixed duration per variation (no silence expansion)
 */

// ============================================
// ALL PROMPTS (38 total)
// ============================================

const allPrompts = [
  // --- Phase 1: Settling ---
  {
    id: 'settling-01',
    text: 'Let yourself arrive. There\u2019s nothing you need to figure out right now. Nothing to fix. Just the feeling of being here.',
    baseSilenceAfter: 12,
  },
  {
    id: 'settling-02',
    text: 'If your eyes are open, let them close. Or soften your gaze. Whatever feels right.',
    baseSilenceAfter: 10,
  },
  {
    id: 'settling-03',
    text: 'Take a slow breath in. And let it go with a sigh if that feels good.',
    baseSilenceAfter: 15,
  },
  {
    id: 'settling-04',
    text: 'Feel the weight of your body against whatever is supporting you. The places where you make contact. Let gravity do the work.',
    baseSilenceAfter: 15,
  },
  {
    id: 'settling-05',
    text: 'Your body has been carrying things for you. Some you know about. Some you don\u2019t. Right now, you don\u2019t need to know what they are. Just notice that your body is here, and it\u2019s been paying attention even when your mind was somewhere else.',
    baseSilenceAfter: 18,
    defaultSilenceAfter: 12,
  },
  {
    id: 'settling-06',
    text: 'Let your breathing find its own rhythm. You don\u2019t need to control it. Just notice the movement. The rise. The fall. The pause between.',
    baseSilenceAfter: 20,
    defaultSilenceAfter: 12,
  },
  {
    id: 'settling-07',
    text: 'Take a moment to scan through your body. Not searching for anything in particular. Just noticing what\u2019s already here.',
    baseSilenceAfter: 20,
    defaultSilenceAfter: 12,
  },

  // --- Phase 2: Clearing a Space ---
  {
    id: 'clearing-01',
    text: 'Ask yourself, gently, and let the answer come from your body rather than your mind: What\u2019s between me and feeling completely at ease right now?',
    baseSilenceAfter: 20,
    defaultSilenceAfter: 15,
  },
  {
    id: 'clearing-02',
    text: 'Whatever comes up, you don\u2019t need to go into it yet. Just notice it. Acknowledge it. Set it down beside you, like placing something on a shelf. You\u2019re not ignoring it. You\u2019re making room.',
    baseSilenceAfter: 15,
  },
  {
    id: 'clearing-03',
    text: 'If there are several things, that\u2019s fine. Notice each one. Set each one down gently. You\u2019ll come back to one of them in a moment.',
    baseSilenceAfter: 20,
    defaultSilenceAfter: 12,
  },
  {
    id: 'clearing-04',
    text: 'Notice what it\u2019s like to have a little space. Even a small amount of space is enough.',
    baseSilenceAfter: 20,
    defaultSilenceAfter: 12,
  },

  // --- Phase 3: Finding the Felt Sense ---
  {
    id: 'finding-01',
    text: 'Now, from everything you set aside, let one thing call to you. Not the one you think you should work with. The one that has a pull. A gravity. The one your attention keeps drifting back toward.',
    baseSilenceAfter: 12,
  },
  {
    id: 'finding-02',
    text: 'Don\u2019t go inside the feeling yet. Stay at the edge of it. Like sitting beside a pool without diving in. Just be near it.',
    baseSilenceAfter: 20,
    defaultSilenceAfter: 12,
  },
  {
    id: 'finding-03',
    text: 'Ask yourself: Where do I feel this in my body? It might be in your chest. Your stomach. Your throat. Your shoulders. Somewhere else entirely. Let your attention move to wherever it lives.',
    baseSilenceAfter: 15,
  },
  {
    id: 'finding-04',
    text: 'Stay with that place in your body. Don\u2019t try to name the feeling yet. Let it be vague. Let it be unclear. That vagueness is actually the beginning of something, not the absence of something.',
    baseSilenceAfter: 25,
    defaultSilenceAfter: 15,
  },
  {
    id: 'finding-05',
    text: 'This is what some people call a felt sense. Not quite an emotion. Not a thought. Something underneath both. Your body\u2019s way of holding the whole of something at once, before words get involved.',
    baseSilenceAfter: 15,
    variationOnly: 'going-deeper',
  },
  {
    id: 'finding-06',
    text: 'Let it become more vivid. Not by forcing it, but by giving it your full, patient attention. Like waiting for your eyes to adjust in a dim room. The more you wait, the more you see.',
    baseSilenceAfter: 25,
    variationOnly: 'going-deeper',
  },

  // --- Phase 4: Letting It Take Shape ---
  {
    id: 'shape-01',
    text: 'Now, gently, see if this felt sense wants to show you something. If it had a shape, what would it be? A weight? A knot? A color? A texture? Something else entirely?',
    baseSilenceAfter: 15,
  },
  {
    id: 'shape-02',
    text: 'There\u2019s no right answer. Whatever comes is right. It might be something concrete, like a stone or a wall. It might be something abstract, like a color or a pressure. Trust what shows up, even if it surprises you.',
    baseSilenceAfter: 25,
    defaultSilenceAfter: 15,
  },
  {
    id: 'shape-03',
    text: 'Notice its qualities. Is it heavy or light? Dense or hollow? Warm or cold? Still or moving? Close or far away?',
    baseSilenceAfter: 15,
  },
  {
    id: 'shape-04',
    text: 'Let the details sharpen. You\u2019re not inventing this. You\u2019re receiving it. Your body already knows what it looks like. You\u2019re just turning your attention toward something that was always there.',
    baseSilenceAfter: 25,
    variationOnly: 'going-deeper',
  },
  {
    id: 'shape-05',
    text: 'See if a word or phrase comes that captures the quality of it. Not a story about it. Just a word that matches. \u201cHeavy.\u201d \u201cTight.\u201d \u201cStuck.\u201d \u201cHollow.\u201d \u201cWaiting.\u201d Something that, when you say it inwardly, your body goes, Yes. That\u2019s it.',
    baseSilenceAfter: 15,
  },
  {
    id: 'shape-06',
    text: 'If a word comes, hold it lightly beside the feeling and check: Does this word match? If not, try another. If nothing fits, that\u2019s fine too. The feeling doesn\u2019t need a name to do its work.',
    baseSilenceAfter: 20,
    defaultSilenceAfter: 12,
  },

  // --- Phase 5: Being With ---
  {
    id: 'being-01',
    text: 'This is the most important part of the whole practice. And it\u2019s the simplest. Just stay here. Be with what you found.',
    baseSilenceAfter: 15,
  },
  {
    id: 'being-02',
    text: 'You don\u2019t need to fix it. You don\u2019t need to make it go away. You don\u2019t need to understand why it\u2019s there. You just need to keep it company.',
    baseSilenceAfter: 15,
  },
  {
    id: 'being-03',
    text: 'Try turning toward it the way you\u2019d turn toward a friend who is hurting. Not with advice. Not with solutions. Just with presence. With the feeling of, I see you. I\u2019m here.',
    baseSilenceAfter: 30,
    defaultSilenceAfter: 15,
  },
  {
    id: 'being-04',
    text: 'Whatever this feeling is, it\u2019s been here a while. It\u2019s been waiting for exactly this. For someone to stop and sit with it instead of pushing past it.',
    baseSilenceAfter: 20,
    defaultSilenceAfter: 12,
  },
  {
    id: 'being-05',
    text: 'If you notice your mind wanting to analyze, to explain, to figure it out, that\u2019s natural. Let those thoughts come and go. Then return your attention to the body. To the shape. To the feeling itself.',
    baseSilenceAfter: 30,
    defaultSilenceAfter: 20,
  },
  {
    id: 'being-06',
    text: 'Something happens when we stop trying to change what we\u2019re feeling and just let it be here. We create a kind of space. And in that space, things sometimes begin to move on their own. Or they don\u2019t. Either way, the space itself is what matters.',
    baseSilenceAfter: 35,
    variationOnly: 'going-deeper',
  },
  {
    id: 'being-07',
    text: 'Stay with it. Keep it company. There\u2019s no timeline here. Nothing needs to happen on schedule.',
    baseSilenceAfter: 40,
    variationOnly: 'going-deeper',
  },
  {
    id: 'being-08',
    text: 'If it wants to move, let it move. If it wants to stay still, let it stay still. Your only job is to remain here, present, without an agenda.',
    baseSilenceAfter: 15,
    variationOnly: 'going-deeper',
  },
  {
    id: 'being-09',
    text: 'Notice what\u2019s happening now. Has anything shifted? Even slightly? The shape, the weight, the density, the temperature, the position.',
    baseSilenceAfter: 20,
    defaultSilenceAfter: 12,
  },
  {
    id: 'being-10',
    text: 'Sometimes the change is obvious. Sometimes it\u2019s barely perceptible. Sometimes nothing changes at all. And even that is information. You showed up. You stayed. That\u2019s not nothing.',
    baseSilenceAfter: 40,
    defaultSilenceAfter: 25,
  },

  // --- Phase 6: Receiving the Shift ---
  {
    id: 'receiving-01',
    text: 'If something has shifted, even a little, take a moment to notice what that\u2019s like. What\u2019s the new quality? What replaced what was there before?',
    baseSilenceAfter: 15,
  },
  {
    id: 'receiving-02',
    text: 'Sometimes the shift feels like a softening. Like something loosened its grip. Sometimes it feels like movement, like something that was frozen started to thaw. Sometimes it\u2019s a realization. An image. A memory. A word that suddenly makes sense.',
    baseSilenceAfter: 25,
    variationOnly: 'going-deeper',
  },
  {
    id: 'receiving-03',
    text: 'Whatever came, receive it. You don\u2019t need to do anything with it right now. Just let it settle. Like snow falling through water. Let it find its place.',
    baseSilenceAfter: 35,
    variationOnly: 'going-deeper',
  },
  {
    id: 'receiving-04',
    text: 'If nothing shifted, that\u2019s also real. Some things need more time. Some things need several visits. The fact that you stayed present with it, that you turned toward it instead of away, is itself a form of change. You met something you usually avoid. That matters.',
    baseSilenceAfter: 20,
    defaultSilenceAfter: 12,
  },
  {
    id: 'receiving-05',
    text: 'If it feels right, take a moment to acknowledge what showed up. Not with any formula. Just whatever comes naturally. A sense of thanks. A quiet recognition. A promise to return.',
    baseSilenceAfter: 25,
    variationOnly: 'going-deeper',
  },

  // --- Phase 7: Returning ---
  {
    id: 'returning-01',
    text: 'Begin to widen your attention again. From the narrow focus of that one place in your body, let your awareness expand to include your whole body.',
    baseSilenceAfter: 15,
  },
  {
    id: 'returning-02',
    text: 'Feel your breathing again. The rise and fall.',
    baseSilenceAfter: 10,
  },
  {
    id: 'returning-03',
    text: 'Feel the surface beneath you. The air on your skin. The sounds around you, near and far.',
    baseSilenceAfter: 15,
  },
  {
    id: 'returning-04',
    text: 'Take one more slow, full breath. And let it go.',
    baseSilenceAfter: 15,
  },
  {
    id: 'returning-05',
    text: 'When you\u2019re ready, at your own pace, let your eyes open. There\u2019s no rush.',
    baseSilenceAfter: 12,
  },
  {
    id: 'returning-06',
    text: 'Take a moment before moving on. Let whatever you experienced settle. You can write about it in a moment if you\u2019d like.',
    baseSilenceAfter: 8,
  },
];


// ============================================
// ASSEMBLY LOGIC
// ============================================

/**
 * Assemble the prompt sequence for a given variation
 * @param {string} variationKey - 'default' | 'going-deeper'
 * @returns {Array} Ordered array of prompt objects with correct silence durations
 */
function assembleVariation(variationKey) {
  return allPrompts
    .filter(p => !p.variationOnly || p.variationOnly === variationKey)
    .map(p => {
      // Apply reduced silence for default variation where specified
      if (variationKey === 'default' && p.defaultSilenceAfter != null) {
        return { ...p, baseSilenceAfter: p.defaultSilenceAfter };
      }
      return p;
    });
}

// ============================================
// EXPORTED MEDITATION OBJECT
// ============================================

export const feltSenseMeditation = {
  id: 'felt-sense',
  title: 'Felt Sense',
  subtitle: 'A guided focusing practice',
  description: 'A guided focusing practice rooted in Eugene Gendlin\u2019s work. Turn inward and let your body show you what it\u2019s holding. Rather than thinking about your experience, you\u2019ll learn to sense it directly \u2014 noticing the subtle, often wordless quality of what\u2019s there.',

  // Audio configuration
  audio: {
    basePath: '/audio/meditations/felt-sense/',
    format: 'mp3',
    defaultVoice: 'theo',
    voices: [
      { id: 'theo',   label: 'Thoughtful Theo', subfolder: '' },
      { id: 'rachel', label: 'Relaxing Rachel', subfolder: 'relaxing-rachel/' },
    ],
  },

  // Fixed duration per variation
  isFixedDuration: true,

  // Default variation shown on idle screen
  defaultVariation: 'default',

  // Variation definitions. Display durations are derived at runtime via
  // estimateMeditationDurationSeconds (voice-aware) — see FeltSenseModule.
  variations: {
    default: {
      key: 'default',
      label: 'A Gentle Practice',
      description: 'Settle in, find what your body is holding, and be with it.',
    },
    'going-deeper': {
      key: 'going-deeper',
      label: 'Going Deeper',
      description: 'The full practice, with more time to stay with what you find.',
    },
  },

  // All prompts (for audio generation — all 44 unique prompts)
  prompts: allPrompts,

  // Assembly function (called by component with selected variation key)
  assembleVariation,
};

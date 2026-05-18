/**
 * Metta Heart Meditation
 *
 * A 10-phase loving-kindness meditation that builds warmth in the heart and
 * radiates it outward — first to the self, then to another, then without
 * limit, and finally dissolving the sender/receiver boundary into a resting
 * felt sense of boundlessness.
 *
 * Audio-synced TTS with 86 pre-recorded prompts and authored silence
 * intervals between each. Fixed duration (~29 minutes, silence-tuned).
 *
 * Voice: Theo Silk (UmQN7jS1Ee8B1czsUtQh) via eleven_multilingual_v2
 *   stability: 0.65, similarity_boost: 0.70, style: 0.0
 *   use_speaker_boost: true, speed: 0.87
 *
 * Phase breakdown:
 *   Phase 1:  Settling In               (settling-01..06)
 *   Phase 2:  Guiding Breath to Heart   (heart-01..08)
 *   Phase 3:  Metta Phrases — Self      (metta-self-01..10)
 *   Phase 4:  Stabilizing Heart Energy  (stabilizing-01..11)
 *   Phase 5:  Radiating Through Body    (radiating-01..12)
 *   Phase 6:  Expanding Beyond Body     (expanding-01..11)
 *   Phase 7:  Universal Expansion       (universal-01..08)
 *   Phase 8:  Dissolving the Sender     (dissolving-01..07)
 *   Phase 9:  Resting in Boundlessness  (resting-01..07)
 *   Phase 10: Returning                 (returning-01..06)
 */

export const mettaHeartMeditation = {
  id: 'metta-heart',
  title: 'Metta Heart',
  subtitle: 'Loving-kindness from the heart outward',
  description: 'A guided loving-kindness meditation that builds warmth in the heart, first cultivating metta within, then practicing radiating it beyond the bounds of self.',

  // Audio configuration
  audio: {
    basePath: '/audio/meditations/metta-heart/',
    format: 'mp3',
    defaultVoice: 'theo',
    voices: [
      { id: 'theo',   label: 'Thoughtful Theo', subfolder: '' },
      { id: 'rachel', label: 'Relaxing Rachel', subfolder: 'relaxing-rachel/' },
    ],
  },

  // Fixed duration — silence-tuned to ~29 min.
  // The placeholder below is overwritten with the real composed-audio total
  // (sum of clip durations + sum of silences) after audio generation +
  // manifest regen. See simple-grounding.js line 52 for the convention.
  isFixedDuration: true,
  fixedDuration: 1740, // ~29 min placeholder; refresh from manifest after audio gen

  prompts: [
    // ============================================
    // PHASE 1: SETTLING IN (settling-01..06)
    // ============================================
    {
      id: 'settling-01',
      text: "Find a position that feels steady and at ease. You can sit, recline, or lie down. Whatever allows you to be both alert and relaxed.",
      baseSilenceAfter: 5,
    },
    {
      id: 'settling-02',
      text: "Close your eyes if that feels right. Let your hands rest wherever they've landed. Let the weight of your body be held by whatever is beneath you.",
      baseSilenceAfter: 8,
    },
    {
      id: 'settling-03',
      text: "Bring your attention to the breath. Don't try to change it. Just notice it as it is right now... the pace, the texture, the temperature. Let the breath be exactly as you find it.",
      baseSilenceAfter: 10,
    },
    {
      id: 'settling-04',
      text: "There is nothing to fix here. No rhythm to achieve. Simply notice where the breath enters and where it leaves. The edges of each inhale. The quiet turning point before each exhale.",
      baseSilenceAfter: 12,
    },
    {
      id: 'settling-05',
      text: "Just breathing. Allowing it to come and go without attachment to what it should be. The breath just is. Let it be so.",
      baseSilenceAfter: 8,
    },
    {
      id: 'settling-06',
      text: "If the mind has already wandered, that's fine. That is what minds do. Gently return to the breath. Each return is the practice itself. Like waking up.",
      baseSilenceAfter: 8,
    },

    // ============================================
    // PHASE 2: GUIDING THE BREATH TO THE HEART (heart-01..08)
    // ============================================
    {
      id: 'heart-01',
      text: "Now let your attention follow the breath a little deeper. As you inhale, feel the breath travel down from the nose... through the throat... and into the chest. On the exhale, feel it rise back up and release. A slow, soft current moving through you.",
      baseSilenceAfter: 12,
    },
    {
      id: 'heart-02',
      text: "Down on the inhale. Up on the exhale.",
      baseSilenceAfter: 6,
    },
    {
      id: 'heart-03',
      text: "Let the breath settle lower. Down into the belly. Feel the belly expand on the inhale. Feel it soften on the exhale. Let this become the center of your breathing for a moment.",
      baseSilenceAfter: 12,
    },
    {
      id: 'heart-04',
      text: "Now gently guide your attention to the center of the chest. The heart space. You don't need to locate it precisely. Just rest your awareness somewhere in the middle of the chest, wherever it feels warm or alive or simply present.",
      baseSilenceAfter: 10,
    },
    {
      id: 'heart-05',
      text: "Imagine the breath flowing directly into this space. As though the heart has its own gravity, drawing the breath toward it. Like an eddy in a river... the breath spirals gently inward, pools here for a moment, and then releases.",
      baseSilenceAfter: 10,
    },
    {
      id: 'heart-06',
      text: "Breathing in, the heart receives. Breathing out, the heart softens.",
      baseSilenceAfter: 10,
    },
    {
      id: 'heart-07',
      text: "Breathe into the heart. Breathe out from the heart. Let this become your rhythm. There is no effort needed. The breath knows the way.",
      baseSilenceAfter: 10,
    },
    {
      id: 'heart-08',
      text: "Stay with this. The breath and the heart, moving together.",
      baseSilenceAfter: 10,
    },

    // ============================================
    // PHASE 3: METTA PHRASES — SELF (metta-self-01..10)
    // ============================================
    {
      id: 'metta-self-01',
      text: "As you continue breathing through the heart, we'll introduce some simple phrases. These are intentions. Seeds of kindness planted in the ground of your attention. They may feel natural or they may feel strange. Both are fine. The words do their work whether or not a feeling arrives.",
      baseSilenceAfter: 5,
    },
    {
      id: 'metta-self-02',
      text: "Direct these first phrases toward yourself. You can repeat them silently in your mind, or if it helps to say them quietly aloud, let yourself do that. Sometimes hearing your own voice makes the words more real.",
      baseSilenceAfter: 5,
    },
    {
      id: 'metta-self-03',
      text: "May I be well.",
      baseSilenceAfter: 8,
    },
    {
      id: 'metta-self-04',
      text: "May I feel deep love.",
      baseSilenceAfter: 8,
    },
    {
      id: 'metta-self-05',
      text: "May I be filled with light.",
      baseSilenceAfter: 10,
    },
    {
      id: 'metta-self-06',
      text: `Again, in your own time.
May I be well.
May I feel deep love.
May I be filled with light.`,
      baseSilenceAfter: 12,
    },
    {
      id: 'metta-self-07',
      text: "Let the phrases land in the heart as you breathe.",
      baseSilenceAfter: 6,
    },
    {
      id: 'metta-self-08',
      text: "These phrases are yours to shape. If different words carry more meaning for you, use those instead. What matters is the intention underneath the language. A sincere wish directed toward yourself, without condition.",
      baseSilenceAfter: 5,
    },
    {
      id: 'metta-self-09',
      text: `One more time.
May I be well.
May I feel deep love.
May I be filled with light.`,
      baseSilenceAfter: 10,
    },
    {
      id: 'metta-self-10',
      text: "Continue repeating the phrases at your own pace. Let them become a quiet rhythm alongside the breath.",
      baseSilenceAfter: 12,
    },

    // ============================================
    // PHASE 4: STABILIZING HEART ENERGY (stabilizing-01..11)
    // ============================================
    {
      id: 'stabilizing-01',
      text: "Now let the phrases rest. Return your full attention to the heart. Notice what is there. It may be warmth. It may be pressure. It may be nothing you can name. Whatever you find, stay with it. Be curious about it.",
      baseSilenceAfter: 10,
    },
    {
      id: 'stabilizing-02',
      text: "Just noticing. The heart, as it is.",
      baseSilenceAfter: 6,
    },
    {
      id: 'stabilizing-03',
      text: "Continue to breathe through this center. Each inhale nourishes the space. Each exhale lets it soften and open. You are not trying to create a feeling. You are creating the conditions for a feeling to arise on its own.",
      baseSilenceAfter: 10,
    },
    {
      id: 'stabilizing-04',
      text: "Breathing in, nourishing. Breathing out, opening.",
      baseSilenceAfter: 8,
    },
    {
      id: 'stabilizing-05',
      text: "If something does arise... warmth, tenderness, a subtle glow, an ache, an openness... let it be there. Don't hold onto it. Don't try to make it stay. Lovingkindness moves like breath. It needs to flow to stay alive.",
      baseSilenceAfter: 10,
    },
    {
      id: 'stabilizing-06',
      text: "Attachment to the feeling can quiet the feeling. So practice this lightly. Stay close, but with open hands. Interested, but not grasping. Like watching light move across water.",
      baseSilenceAfter: 10,
    },
    {
      id: 'stabilizing-07',
      text: "Gently cycle your awareness now between three things. The heart space. The breath. And the intentions. Heart. Breath. Intentions. Let them weave together at whatever pace feels natural.",
      baseSilenceAfter: 10,
    },
    {
      id: 'stabilizing-08',
      text: "There is no correct order. Move between them as you're drawn.",
      baseSilenceAfter: 8,
    },
    {
      id: 'stabilizing-09',
      text: "Heart. Breath. Intentions. Each one feeding the others.",
      baseSilenceAfter: 10,
    },
    {
      id: 'stabilizing-10',
      text: "If the heart feels quiet, return to the phrases. If the phrases feel mechanical, return to the breath. If the breath feels thin, return to the heart. Each one supports the others. There is always somewhere to rest.",
      baseSilenceAfter: 10,
    },
    {
      id: 'stabilizing-11',
      text: "Stay here. Gently moving between them.",
      baseSilenceAfter: 10,
    },

    // ============================================
    // PHASE 5: RADIATING THROUGH THE BODY (radiating-01..12)
    // ============================================
    {
      id: 'radiating-01',
      text: "Whatever quality of energy lives in the heart right now, however faint or strong, begin to let it move. On each exhale, feel it spread. First into the chest itself. Into the ribs, the shoulders, the back of the body.",
      baseSilenceAfter: 10,
    },
    {
      id: 'radiating-02',
      text: "The breath carries it. You just allow.",
      baseSilenceAfter: 6,
    },
    {
      id: 'radiating-03',
      text: "Let the breath carry this warmth the way a river carries heat from a spring. Down through the belly. Into the hips. Along the length of the legs. All the way to the soles of the feet.",
      baseSilenceAfter: 12,
    },
    {
      id: 'radiating-04',
      text: "Filling downward. Warm and steady.",
      baseSilenceAfter: 6,
    },
    {
      id: 'radiating-05',
      text: "And upward. Through the throat. Into the face. Softening the jaw. The space behind the eyes. The forehead. Up to the crown of the head. The whole body becoming a vessel for this energy.",
      baseSilenceAfter: 10,
    },
    {
      id: 'radiating-06',
      text: "Out through the arms. Into the hands. To the tips of the fingers. Every surface of the body touched by this current of kindness.",
      baseSilenceAfter: 8,
    },
    {
      id: 'radiating-07',
      text: "Rest here for a moment. The whole body breathing. The whole body held in lovingkindness. Not just the heart now, but every cell, every boundary, every edge.",
      baseSilenceAfter: 12,
    },
    {
      id: 'radiating-08',
      text: "All of you, held in this.",
      baseSilenceAfter: 8,
    },
    {
      id: 'radiating-09',
      text: `Return to the phrases if you like, with the full body as the receiver now.
May I be well.
May I feel deep love.
May I be filled with light.`,
      baseSilenceAfter: 10,
    },
    {
      id: 'radiating-10',
      text: "Let them resonate through the whole body. Repeat them at your own pace.",
      baseSilenceAfter: 12,
    },
    {
      id: 'radiating-11',
      text: "Let the awareness move gently between the body, the breath, and the intentions. All three alive at once. A steady, warm, total experience.",
      baseSilenceAfter: 10,
    },
    {
      id: 'radiating-12',
      text: "Body. Breath. Intentions. Resting in all three.",
      baseSilenceAfter: 10,
    },

    // ============================================
    // PHASE 6: EXPANDING BEYOND THE BODY (expanding-01..11)
    // ============================================
    {
      id: 'expanding-01',
      text: "Now imagine that the edges of the body are not quite as solid as they seem. That the warmth you feel doesn't stop at the skin. Picture a soft boundary just beyond your body... a few inches out, all around you. A shell of warmth, like the glow of an ember.",
      baseSilenceAfter: 12,
    },
    {
      id: 'expanding-02',
      text: "You can feel this. The energy extending just past the skin.",
      baseSilenceAfter: 8,
    },
    {
      id: 'expanding-03',
      text: "The sense that you are slightly larger than you were a moment ago. Slightly more porous. Slightly less contained. The heart's energy, carried by the breath, reaching past the body's normal edges.",
      baseSilenceAfter: 10,
    },
    {
      id: 'expanding-04',
      text: "Let this boundary expand further. There is no effort here. Just an allowing. The warmth wants to move. It wants to fill whatever space you offer it.",
      baseSilenceAfter: 10,
    },
    {
      id: 'expanding-05',
      text: "Let it grow. You don't need to push. Just open.",
      baseSilenceAfter: 8,
    },
    {
      id: 'expanding-06',
      text: "Now bring to mind someone in your life. Anyone. It may be someone you love deeply. It may be someone you saw briefly today and barely know. There is no right choice. Let whoever arises, arise.",
      baseSilenceAfter: 10,
    },
    {
      id: 'expanding-07',
      text: "Hold this person in your awareness alongside the warmth you've been cultivating. Let the lovingkindness that has been flowing through your body begin to include them. As though the glow that surrounds you has expanded enough to reach where they are.",
      baseSilenceAfter: 10,
    },
    {
      id: 'expanding-08',
      text: `Adapt the phrases now. Direct them toward this person.
May you be well.
May you feel deep love.
May you be filled with light.`,
      baseSilenceAfter: 10,
    },
    {
      id: 'expanding-09',
      text: `Again.
May you be well.
May you feel deep love.
May you be filled with light.`,
      baseSilenceAfter: 12,
    },
    {
      id: 'expanding-10',
      text: "Keep repeating the phrases toward them if it feels right. Let the warmth carry the words.",
      baseSilenceAfter: 10,
    },
    {
      id: 'expanding-11',
      text: "Notice what happens in the heart as you offer these words to another person. The same energy. The same warmth. The boundary between self and other becomes thinner here. What you wish for yourself and what you wish for them turns out to be the same wish.",
      baseSilenceAfter: 10,
    },

    // ============================================
    // PHASE 7: UNIVERSAL EXPANSION (universal-01..08)
    // ============================================
    {
      id: 'universal-01',
      text: "Let the image of that person gently dissolve. In its place, allow the awareness to widen. Feel the warmth that surrounded you and held another now reaching further still. Past the walls of this room. Past the edges of this building. Outward in every direction.",
      baseSilenceAfter: 12,
    },
    {
      id: 'universal-02',
      text: "There are people everywhere right now living their lives. People you will never meet, in cities and villages and open landscapes all over the world. Each of them carrying their own hope to be well. Their own quiet wish for love. Their own need for light.",
      baseSilenceAfter: 10,
    },
    {
      id: 'universal-03',
      text: "Your life has something to do with theirs. Not in a way you need to understand. Just in a way you can feel. The constructs of self and other are useful, but they are only constructs. What remains when they thin is connection. What remains is this.",
      baseSilenceAfter: 12,
    },
    {
      id: 'universal-04',
      text: "Let the boundaries dissolve as far as they want to go.",
      baseSilenceAfter: 8,
    },
    {
      id: 'universal-05',
      text: "Let the lovingkindness you've cultivated radiate without limit now. Like warmth from a star. Not directed at any one being. Not held back from any other. Simply moving outward because that is what it does.",
      baseSilenceAfter: 12,
    },
    {
      id: 'universal-06',
      text: "Boundless. In all directions. Without effort.",
      baseSilenceAfter: 10,
    },
    {
      id: 'universal-07',
      text: `One last time.
May all beings be well.
May all beings feel deep love.
May all beings be filled with light and life.`,
      baseSilenceAfter: 12,
    },
    {
      id: 'universal-08',
      text: "Continue with the phrases if you wish. Or simply rest in the feeling of radiating outward.",
      baseSilenceAfter: 10,
    },

    // ============================================
    // PHASE 8: DISSOLVING THE SENDER (dissolving-01..07)
    // ============================================
    {
      id: 'dissolving-01',
      text: "Let the phrases go now. You don't need them anymore. What you've been cultivating doesn't require language to continue. It moves on its own.",
      baseSilenceAfter: 10,
    },
    {
      id: 'dissolving-02',
      text: "Notice something. As the lovingkindness radiates outward without limit, the one who is sending it becomes harder to find. Where does the warmth end and you begin? Where do you end and the warmth begin?",
      baseSilenceAfter: 12,
    },
    {
      id: 'dissolving-03',
      text: "This is not a problem to solve. It is something to feel. The boundary between the one who loves and the love itself has become very thin.",
      baseSilenceAfter: 10,
    },
    {
      id: 'dissolving-04',
      text: "Think of a wave in the ocean. The wave moves, it has shape, it has direction. But it was never separate from the water. It doesn't give the ocean anything. It is the ocean, expressing itself.",
      baseSilenceAfter: 10,
    },
    {
      id: 'dissolving-05',
      text: "The lovingkindness you feel is like this. It was never yours to give. You are not the source. You are the expression. You are the wave, discovering it was always the water.",
      baseSilenceAfter: 12,
    },
    {
      id: 'dissolving-06',
      text: "Rest in this. There is nothing to send and no one to send it to. Just love, aware of itself.",
      baseSilenceAfter: 12,
    },
    {
      id: 'dissolving-07',
      text: "Breathing. Present. Part of something that was never separate to begin with.",
      baseSilenceAfter: 12,
    },

    // ============================================
    // PHASE 9: RESTING IN BOUNDLESSNESS (resting-01..07)
    // ============================================
    {
      id: 'resting-01',
      text: "Gently bring your attention back toward the body. Not away from what you've been feeling, but into it. The body is still here. But it may feel different now. Lighter. Wider. Less defined at the edges.",
      baseSilenceAfter: 10,
    },
    {
      id: 'resting-02',
      text: "Notice what boundlessness actually feels like in the body. Not as an idea, but as a sensation. What is happening in the chest right now? In the belly? At the surface of the skin?",
      baseSilenceAfter: 12,
    },
    {
      id: 'resting-03',
      text: "Stay curious. There is no right answer. Just attention, meeting whatever is here.",
      baseSilenceAfter: 8,
    },
    {
      id: 'resting-04',
      text: "The heart may feel open in a way that is hard to describe. Warm, or spacious, or simply quiet. Whatever quality is there, let yourself rest inside it. Not observing it from the outside, but inhabiting it.",
      baseSilenceAfter: 12,
    },
    {
      id: 'resting-05',
      text: "The whole body, breathing, suffused with this feeling. You don't need to protect it or sustain it. It is already here. It has been here.",
      baseSilenceAfter: 10,
    },
    {
      id: 'resting-06',
      text: "Let the breath be soft. Let the awareness be wide and easy. There is nothing left to do.",
      baseSilenceAfter: 12,
    },
    {
      id: 'resting-07',
      text: "Just this. The body. The breath. The warmth that lives in both.",
      baseSilenceAfter: 12,
    },

    // ============================================
    // PHASE 10: RETURNING (returning-01..06)
    // ============================================
    {
      id: 'returning-01',
      text: "Gently let the expansion soften. You don't need to pull the warmth back in. Just allow your awareness to settle closer to the body. To the breath. To the heart. The energy will stay in motion on its own.",
      baseSilenceAfter: 10,
    },
    {
      id: 'returning-02',
      text: "Feel your weight again. The surface beneath you. The temperature of the air against the skin.",
      baseSilenceAfter: 6,
    },
    {
      id: 'returning-03',
      text: "When you're ready, take one deep, full breath. Let it fill the whole body. And release it completely.",
      baseSilenceAfter: 8,
    },
    {
      id: 'returning-04',
      text: "What you practiced here is not a single experience. It is a capacity. Each time you return to the breath, the heart, the intention to wish yourself or another well... the capacity deepens. The feeling you cultivated today becomes easier to find tomorrow.",
      baseSilenceAfter: 6,
    },
    {
      id: 'returning-05',
      text: "You learned something about the heart today. Not as an idea, but as a felt thing. That it opens when you attend to it. That its warmth extends further than you thought. That the boundary between caring for yourself and caring for others was never as solid as it seemed.",
      baseSilenceAfter: 6,
    },
    {
      id: 'returning-06',
      text: "Open your eyes slowly, if they've been closed. Let the world come back in at its own pace. There is no rush. What you practiced is still here.",
      baseSilenceAfter: 3,
    },
  ],
};

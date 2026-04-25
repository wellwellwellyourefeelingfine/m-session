/**
 * Protector Dialogue Guided Meditation
 * "Meeting a Protector" — Part 1, Step 5
 *
 * 30 prompts across 7 phases, targeting 12–15 minutes at ~90 WPM for peak state.
 * Audio files are TTS-generated and placed in /audio/meditations/protector-dialogue/
 * The module supports a "Read" mode as fallback when audio files aren't available.
 */

export const protectorDialogueMeditation = {
  id: 'protector-dialogue',
  title: 'Meeting a Protector',
  subtitle: 'Guided Noticing',
  description: 'A gentle guided audio meditation to notice and connect with a protective part of yourself. Have your headphones or speakers ready.',

  // Duration config — expanded meditation
  baseDuration: 840,  // ~14 minutes base
  minDuration: 720,   // 12 minutes minimum
  maxDuration: 900,   // 15 minutes with expanded silences

  // Audio config
  audio: {
    basePath: '/audio/meditations/protector/',
    format: 'mp3',
    defaultVoice: 'theo',
    voices: [
      { id: 'theo',   label: 'Thoughtful Theo', subfolder: '' },
      { id: 'rachel', label: 'Relaxing Rachel', subfolder: 'relaxing-rachel/' },
    ],
  },

  // Speaking rate — slower for peak state (90 WPM vs typical 150)
  speakingRate: 90,

  // Prompts — 7 phases, 30 prompts
  prompts: [
    // ── Settling Phase ──
    {
      id: 'settling-01',
      text: 'Find a comfortable position. You can close your eyes if that feels right, or let your gaze soften toward the ground.',
      baseSilenceAfter: 5,
    },
    {
      id: 'settling-02',
      text: 'Take a moment to just notice that you\'re here. You don\'t need to be anywhere else or do anything yet. Just register the fact that you showed up for this.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 15,
    },
    {
      id: 'settling-03',
      text: 'Let your breathing be whatever it is right now. You don\'t need to control it. Just notice the rhythm that\'s already happening.',
      baseSilenceAfter: 10,
      silenceExpandable: true,
      silenceMax: 20,
    },
    {
      id: 'settling-04',
      text: 'Now, slowly bring your attention into your body. Not thinking about your body. Actually feeling it from the inside. Start wherever feels natural.',
      baseSilenceAfter: 10,
      silenceExpandable: true,
      silenceMax: 20,
    },
    {
      id: 'settling-05',
      text: 'Notice the weight of yourself. Where you\'re sitting. The contact between you and what\'s supporting you. The temperature of the air on your skin.',
      baseSilenceAfter: 10,
      silenceExpandable: true,
      silenceMax: 20,
    },
    {
      id: 'settling-06',
      text: 'And notice how you feel right now. Not to judge it or fix it. Just to take a reading. What\'s the emotional weather in here?',
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 30,
    },

    // ── Finding Phase ──
    {
      id: 'finding-01',
      text: 'Now, gently, I want you to think about a pattern you recognize in yourself. A way you tend to react when things get difficult, or when something hits a nerve.',
      baseSilenceAfter: 12,
      silenceExpandable: true,
      silenceMax: 25,
    },
    {
      id: 'finding-02',
      text: 'It might be a voice that criticizes you before anyone else can. A habit of shutting down, or people-pleasing, or staying so busy you never have to sit still. It could be the part that reaches for distraction: your phone, a drink, anything to not feel what you\'re feeling. Or the one that always needs to be in control.',
      baseSilenceAfter: 18,
      silenceExpandable: true,
      silenceMax: 35,
    },
    {
      id: 'finding-03',
      text: 'Whatever comes to mind first, that\'s the one. Don\'t overthink it. Don\'t go looking for the "right" one. Just let it be whatever showed up.',
      baseSilenceAfter: 12,
      silenceExpandable: true,
      silenceMax: 25,
    },

    // ── Focusing Phase ──
    {
      id: 'focusing-01',
      text: 'Now see if you can feel where this pattern lives in your body. It often has a location. A tightness. A weight. A hollowness. A buzzing. Something specific, somewhere.',
      baseSilenceAfter: 18,
      silenceExpandable: true,
      silenceMax: 35,
    },
    {
      id: 'focusing-02',
      text: 'If you can find it, rest your attention there. Not trying to change it. Not analyzing it. Just being with it the way you\'d sit with a feeling that doesn\'t need to be fixed.',
      baseSilenceAfter: 18,
      silenceExpandable: true,
      silenceMax: 35,
    },
    {
      id: 'focusing-03',
      text: 'Stay with that sensation for a moment longer. Notice whether it shifts when you give it your full attention. Sometimes it gets stronger. Sometimes it softens. Sometimes it stays exactly the same. Whatever it does is fine.',
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 30,
    },

    // ── Fleshing Out Phase ──
    {
      id: 'fleshing-01',
      text: 'Now see if this pattern starts to take on any kind of form or quality. It doesn\'t have to. But sometimes, when you pay enough attention, something becomes clearer.',
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 30,
    },
    {
      id: 'fleshing-02',
      text: 'It might appear as a shape, a color, a texture. It might carry a heaviness, or a heat, or a kind of tightness that has a character to it. Just notice whatever qualities are there.',
      baseSilenceAfter: 18,
      silenceExpandable: true,
      silenceMax: 35,
    },
    {
      id: 'fleshing-03',
      text: 'Whatever you\'re noticing, even just a vague impression, that\'s enough. You don\'t need to sharpen it.',
      baseSilenceAfter: 10,
      silenceExpandable: true,
      silenceMax: 20,
    },
    {
      id: 'fleshing-04',
      text: 'And if you can, notice whether this pattern carries a certain age. Not how long you\'ve had it, but the age it seems to belong to. The period of your life it\'s connected to.',
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 30,
    },

    // ── Feel Toward Phase ──
    {
      id: 'feel-toward-01',
      text: 'Now, gently, I want you to notice something about your relationship to this pattern.',
      baseSilenceAfter: 5,
    },
    {
      id: 'feel-toward-02',
      text: 'How do you feel toward it right now? Not what you think about it. How you actually feel toward it, sitting here, in this moment.',
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 30,
    },
    {
      id: 'feel-toward-03',
      text: 'If you notice something like curiosity, or warmth, or openness, stay with that. That\'s exactly where you want to be.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 15,
    },
    {
      id: 'feel-toward-04',
      text: 'But if you notice frustration, or judgment, or a wish that it would just go away, that\'s worth noticing too. That reaction is its own pattern, separate from the one you\'re observing.',
      baseSilenceAfter: 10,
      silenceExpandable: true,
      silenceMax: 20,
    },
    {
      id: 'feel-toward-05',
      text: 'If that\'s happening, see if you can acknowledge the frustration without acting on it. Gently set it to the side, just for now. You can come back to it.',
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 30,
    },
    {
      id: 'feel-toward-06',
      text: 'Check again. How do you feel toward this pattern now? See if there\'s any curiosity there. Even a small amount is enough.',
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 30,
    },

    // ── Relating Phase ──
    {
      id: 'relating-01',
      text: 'Now, from whatever curiosity you have, see if you can get genuinely interested in this pattern. Approach it the way you would something you don\'t fully understand yet. With openness, not judgment.',
      baseSilenceAfter: 12,
      silenceExpandable: true,
      silenceMax: 25,
    },
    {
      id: 'relating-02',
      text: 'If you could ask it one question, it would be this: What are you trying to protect me from?',
      baseSilenceAfter: 20,
      silenceExpandable: true,
      silenceMax: 40,
    },
    {
      id: 'relating-03',
      text: 'You don\'t need an answer right now. Just holding the question is enough. Let whatever comes, come. And if nothing comes, that\'s fine too.',
      baseSilenceAfter: 12,
      silenceExpandable: true,
      silenceMax: 25,
    },
    {
      id: 'relating-04',
      text: 'Now, if it feels genuine, and only if it does, see if you can feel something like appreciation for this pattern. It developed for a reason. It\'s been running for a long time. Maybe longer than you realized.',
      baseSilenceAfter: 18,
      silenceExpandable: true,
      silenceMax: 35,
    },
    {
      id: 'relating-05',
      text: 'You might silently say something like: I see you. I know why you\'re here.',
      baseSilenceAfter: 20,
      silenceExpandable: true,
      silenceMax: 40,
    },

    // ── Closing Phase ──
    {
      id: 'closing-01',
      text: 'Let whatever just happened settle. You don\'t need to make sense of it. You don\'t need to hold onto it. Just let it be here.',
      baseSilenceAfter: 12,
      silenceExpandable: true,
      silenceMax: 25,
    },
    {
      id: 'closing-02',
      text: 'Take one more breath. A slow one.',
      baseSilenceAfter: 6,
    },
    {
      id: 'closing-03',
      text: 'When you\'re ready, gently bring your attention back to the room. Open your eyes when it feels right.',
      baseSilenceAfter: 8,
    },
  ],
};

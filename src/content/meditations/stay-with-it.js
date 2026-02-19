/**
 * Stay With It Meditation
 *
 * A reconsolidation-based guided meditation from the Open MDMA framework.
 * The user turns toward whatever emotional activation is already present,
 * stays with it rather than avoiding it, and allows MDMA's safety signal
 * to provide the contradictory evidence that enables schema updating.
 *
 * 23 prompts (19 base + 4 conditional) written at ~90 WPM for peak state.
 * Audio files are TTS-generated and placed in /audio/meditations/stay-with-it/
 *
 * Variable duration: 10, 15, 20, or 25 minutes via expandable silence intervals
 * and conditional prompts for longer sessions.
 */

export const stayWithItMeditation = {
  id: 'stay-with-it',
  title: 'Stay With It',
  subtitle: 'Reconsolidation Meditation',
  description: 'A guided audio meditation for turning toward whatever you\u2019re feeling right now and staying present with it. No technique to learn. No visualization. Just you and what\u2019s here. Have your headphones or speakers ready.',
  baseDuration: 600,   // ~10 minutes base
  minDuration: 600,    // 10 min
  maxDuration: 1500,   // 25 min
  durationSteps: [10, 15, 20, 25],
  defaultDuration: 15,

  // Audio configuration
  audio: {
    basePath: '/audio/meditations/stay-with-it/',
    format: 'mp3',
  },

  // Speaking rate — slower for peak state (90 WPM vs typical 150)
  speakingRate: 90,

  prompts: [
    // === MOVEMENT 1: ARRIVING AND ESTABLISHING SAFETY ===
    {
      id: 'arriving-01',
      text: 'Find a comfortable position. Close your eyes, or let your gaze soften downward.',
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },
    {
      id: 'arriving-02',
      text: 'Take a few breaths. Not special breaths. Just the ones that are already happening.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 15,
    },
    {
      id: 'arriving-03',
      text: 'Notice where your body meets the surface beneath you. The weight of you, being held.',
      baseSilenceAfter: 6,
      silenceExpandable: true,
      silenceMax: 12,
    },
    {
      id: 'arriving-04',
      text: 'You are safe in this room right now. Let that land. Not as an idea, but as something you can actually feel.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 18,
    },
    {
      id: 'arriving-05',
      text: 'The safety you feel right now is not just comfort. It\u2019s information your nervous system is already taking in, whether your mind has caught up or not.',
      baseSilenceAfter: 10,
      silenceExpandable: true,
      silenceMax: 20,
    },

    // === MOVEMENT 2: INVITING WHAT'S PRESENT ===
    {
      id: 'inviting-01',
      text: 'Now, gently shift your attention inward. Not searching for anything. Just noticing what\u2019s already here.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 15,
    },
    {
      id: 'inviting-02',
      text: 'There may be an emotion present. Anxiety. Sadness. Anger. Grief. A heaviness you can\u2019t name. Or maybe just a tension somewhere in your body.',
      baseSilenceAfter: 6,
      silenceExpandable: true,
      silenceMax: 12,
    },
    {
      id: 'inviting-03',
      text: 'Whatever is there, even if it\u2019s subtle, even if it doesn\u2019t make sense, that\u2019s what we\u2019re here for. You don\u2019t need to understand it. You don\u2019t need to fix it. You just need to feel it.',
      baseSilenceAfter: 10,
      silenceExpandable: true,
      silenceMax: 20,
    },
    {
      id: 'inviting-04',
      text: 'If nothing obvious is present, notice what\u2019s pulling at your attention. Or notice what your attention seems to be avoiding. Both are signals.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 15,
    },
    {
      id: 'inviting-05',
      text: 'See if you can find where this feeling lives in your body. Your chest. Your stomach. Your throat. Your jaw. Let your attention settle there.',
      baseSilenceAfter: 10,
      silenceExpandable: true,
      silenceMax: 25,
    },

    // === MOVEMENT 3: STAYING PRESENT (CORE PRACTICE) ===
    {
      id: 'staying-01',
      text: 'Stay with it. Whatever you\u2019re feeling, lean into it gently. You don\u2019t need to make it bigger or smaller. Just be with it the way you\u2019d sit beside someone who needed company.',
      baseSilenceAfter: 25,
      silenceExpandable: true,
      silenceMax: 60,
    },
    {
      id: 'staying-02',
      text: 'If your mind has drifted to thinking about the feeling, analyzing it, explaining it to yourself, see if you can come back to feeling it directly. The body, not the story.',
      baseSilenceAfter: 20,
      silenceExpandable: true,
      silenceMax: 50,
    },
    {
      id: 'staying-03',
      text: 'If you notice a sudden blankness, a feeling of nothing happening, boredom, sleepiness, or a sense that the medicine isn\u2019t working, pause with that. That might not be peace. Your nervous system may be pulling you away from something. See if you can stay with the nothingness itself.',
      baseSilenceAfter: 25,
      silenceExpandable: true,
      silenceMax: 60,
    },
    {
      id: 'staying-04',
      text: 'If your thoughts are racing or you feel an urge to move, fidget, or stop, notice that too. That urgency is information. You don\u2019t need to act on it. Just feel it alongside whatever else is present.',
      baseSilenceAfter: 20,
      silenceExpandable: true,
      silenceMax: 50,
    },
    {
      id: 'staying-05',
      text: 'Whatever is happening right now is fine. Tears are fine. Shaking is fine. Stillness is fine. Feeling nothing is fine. You are not doing this wrong.',
      baseSilenceAfter: 30,
      silenceExpandable: true,
      silenceMax: 75,
    },
    // Conditional: only included for 15+ minute sessions
    {
      id: 'staying-06',
      text: 'If the feeling has shifted or softened, stay with whatever has taken its place. Something else may have surfaced underneath. Let your attention follow wherever it goes.',
      baseSilenceAfter: 30,
      silenceExpandable: true,
      silenceMax: 75,
      conditional: { minDuration: 15 },
    },
    {
      id: 'staying-07',
      text: 'You might notice that what you\u2019re feeling doesn\u2019t seem quite so solid anymore. Maybe you can see it from a slight distance. Not gone, but not the whole of your experience either. If that\u2019s happening, let it.',
      baseSilenceAfter: 25,
      silenceExpandable: true,
      silenceMax: 60,
      conditional: { minDuration: 15 },
    },
    // Conditional: only included for 20+ minute sessions
    {
      id: 'staying-08',
      text: 'Continue resting with whatever is present. Nowhere else to be. Nothing else to do. Just this.',
      baseSilenceAfter: 40,
      silenceExpandable: true,
      silenceMax: 90,
      conditional: { minDuration: 20 },
    },
    {
      id: 'staying-09',
      text: 'If something feels stuck, if the same feeling keeps circling without shifting, try holding it with gentle curiosity. Not \u201cwhy won\u2019t this change\u201d but something closer to \u201cI see you. I\u2019m here.\u201d That\u2019s enough.',
      baseSilenceAfter: 30,
      silenceExpandable: true,
      silenceMax: 75,
      conditional: { minDuration: 20 },
    },

    // === MOVEMENT 4: NOTICING WHAT SHIFTED ===
    {
      id: 'closing-01',
      text: 'Gently widen your awareness. Let the room back in. Sounds. Temperature. The surface beneath you.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 15,
    },
    {
      id: 'closing-02',
      text: 'Without trying to make sense of anything, just notice how you feel now compared to when you started. Something may have shifted. Something may not have. Both are fine.',
      baseSilenceAfter: 10,
      silenceExpandable: true,
      silenceMax: 20,
    },
    {
      id: 'closing-03',
      text: 'You don\u2019t need to understand what just happened. Understanding often comes later. For now, just notice what\u2019s here.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 15,
    },
    {
      id: 'closing-04',
      text: 'When you\u2019re ready, let your eyes open. Take your time.',
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },
  ],
};

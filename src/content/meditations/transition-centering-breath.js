/**
 * Transition Audio — Centering Breath
 *
 * Guided breath practice (~7-8 min) usable as a standalone grounding module
 * in any phase of the session, and also offered as a detour in the Opening
 * Ritual before the user takes their substance.
 *
 * Seven sections: orientation, settling in, body release, natural breath
 * awareness, paced 4-in/6-out breathing, centering, and close.
 */

export const transitionCenteringBreath = {
  id: 'transition-centering-breath',
  title: 'Centering Breath',
  description: 'A guided breath practice for settling, centering, and returning to yourself.',

  audio: {
    basePath: '/audio/meditations/transition-centering-breath/',
    format: 'mp3',
    defaultVoice: 'theo',
    voices: [
      { id: 'theo',   label: 'Thoughtful Theo', subfolder: '' },
      { id: 'rachel', label: 'Relaxing Rachel', subfolder: 'relaxing-rachel/' },
    ],
  },

  isFixedDuration: true,
  fixedDuration: 464, // ~7:44 — computed from actual MP3 durations (audio-durations.json) + baseSilenceAfter sums

  idleAnimation: 'wave',

  prompts: [
    // ── Orientation ──
    { id: 'intro',        text: "Let's take some time to arrive here.  A few minutes to settle the body, steady the breath, and return to yourself.", baseSilenceAfter: 3 },
    { id: 'posture-01',   text: "Settle into a comfortable position.  Let your weight sink into whatever's beneath you.",                              baseSilenceAfter: 5 },
    { id: 'posture-02',   text: 'Let your shoulders drop.  Let your hands rest easy.',                                                                 baseSilenceAfter: 4 },
    { id: 'posture-03',   text: "Let your jaw soften.  When you're settled, close your eyes.",                                                         baseSilenceAfter: 5 },

    // ── Settling In ──
    { id: 'settling-01',  text: 'Pay attention to the weight of your hands.  The weight of your arms.  The weight of your legs resting against the surface beneath.', baseSilenceAfter: 5 },
    { id: 'settling-02',  text: 'Feel the points of contact between your body and whatever holds you.  Let yourself be held.',                         baseSilenceAfter: 6 },

    // ── Body Release ──
    { id: 'release-01',   text: 'Take a moment to notice where your body is holding tension.',                                                        baseSilenceAfter: 5 },
    { id: 'release-02',   text: 'Notice it.  Allow it to be right where it is, for now.',                                                              baseSilenceAfter: 6 },
    { id: 'release-03',   text: 'Without trying to fix anything, let your attention move through your shoulders.  Let them release what they can.',    baseSilenceAfter: 5 },
    { id: 'release-04',   text: 'The jaw, and the throat.  Let them soften.',                                                                          baseSilenceAfter: 5 },
    { id: 'release-05',   text: 'The hands.  Unclench them.  Let them rest open.',                                                                      baseSilenceAfter: 5 },
    { id: 'release-06',   text: 'The belly.  Let it be soft.  Let it rise and fall with the breath.',                                                   baseSilenceAfter: 5 },
    { id: 'release-sigh', text: 'Take one slow sigh out through the mouth.  A clearing breath.',                                                       baseSilenceAfter: 6 },

    // ── Natural Breath Awareness ──
    { id: 'natural-01',   text: 'Bring your attention to the breath.  Watch it flow in.  Watch it flow out.',                                           baseSilenceAfter: 5 },
    { id: 'natural-02',   text: 'Feel the breath visit the nose.  The coolness on the inhale.  The warmth on the exhale.',                              baseSilenceAfter: 6 },
    { id: 'natural-03',   text: 'Let your awareness follow the breath deeper.  Past the throat.  Into the chest.  Into the deep diaphragm, where the body naturally breathes from.', baseSilenceAfter: 6 },
    { id: 'natural-04',   text: 'Feel your chest expand with each inhale.  Feel your belly soften with each exhale.  The body breathing itself, without effort.', baseSilenceAfter: 6 },
    { id: 'natural-05',   text: 'Notice the rhythm of your breath right now.  Let it be exactly as it is.',                                            baseSilenceAfter: 6 },

    // ── Paced Breathing: 4-in / 6-out ──
    { id: 'paced-intro',  text: "Now we'll move the breath into a steady rhythm.  Four counts in, six counts out.  The longer exhale is what tells the body to soften.", baseSilenceAfter: 4 },
    { id: 'paced-1-in',   text: 'Breathe in slowly through the nose.  One.  Two.  Three.  Four.',                                                         baseSilenceAfter: 2 },
    { id: 'paced-1-out',  text: 'And out slowly through the mouth.  One.  Two.  Three.  Four.  Five.  Six.',                                                baseSilenceAfter: 3 },
    { id: 'paced-2-in',   text: 'Again.  In through the nose.  One.  Two.  Three.  Four.',                                                                 baseSilenceAfter: 2 },
    { id: 'paced-2-out',  text: 'Out through the mouth.  One.  Two.  Three.  Four.  Five.  Six.',                                                           baseSilenceAfter: 3 },
    { id: 'paced-3-in',   text: 'Once more.  In.  One.  Two.  Three.  Four.',                                                                              baseSilenceAfter: 2 },
    { id: 'paced-3-out',  text: 'Out.  One.  Two.  Three.  Four.  Five.  Six.',                                                                             baseSilenceAfter: 3 },
    { id: 'paced-4-in',   text: 'A final breath.  In.  One.  Two.  Three.  Four.',                                                                         baseSilenceAfter: 2 },
    { id: 'paced-4-out',  text: 'Out.  One.  Two.  Three.  Four.  Five.  Six.',                                                                             baseSilenceAfter: 4 },

    // ── Centering ──
    { id: 'center-01',    text: 'Let the breath return to its own rhythm.',                                                                           baseSilenceAfter: 5 },
    { id: 'center-02',    text: 'Turn your attention to the center of your chest.',                                                                   baseSilenceAfter: 4 },
    { id: 'center-03',    text: 'Breathe there.  Not deeper.  Not slower.  Just there.',                                                                 baseSilenceAfter: 6 },
    { id: 'center-04',    text: "Feel the subtle rise and fall at the chest.  The body's quiet rhythm.",                                               baseSilenceAfter: 6 },
    { id: 'center-05',    text: 'This is the center.  The place everything else gathers around.',                                                      baseSilenceAfter: 6 },
    { id: 'center-06',    text: 'Rest your attention here for a few breaths.',                                                                        baseSilenceAfter: 15 },

    // ── Close ──
    { id: 'close-01',        text: 'Notice how your body feels now.  Different from where you started.',                                               baseSilenceAfter: 5 },
    { id: 'close-portable',  text: 'This steadiness is always available to you.  The breath is here whenever you need it.',                            baseSilenceAfter: 5 },
    { id: 'close-02',        text: 'Take one more slow breath.',                                                                                      baseSilenceAfter: 5 },
    { id: 'close-03',        text: "When you're ready, open your eyes.",                                                                              baseSilenceAfter: 3 },
  ],
};

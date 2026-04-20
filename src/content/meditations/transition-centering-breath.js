/**
 * Transition Audio — Centering Breath
 *
 * Guided breath practice (~6 min) offered as a detour in the
 * Opening Ritual, before the user takes their substance.
 *
 * Six sections: orientation, body release, natural breath awareness,
 * paced 4-in/6-out breathing, centering, and close.
 */

export const transitionCenteringBreath = {
  id: 'transition-centering-breath',
  title: 'Centering Breath',
  description: 'A guided breath practice to settle and center before you begin.',

  audio: {
    basePath: '/audio/meditations/transition-centering-breath/',
    format: 'mp3',
  },

  speakingRate: 95,

  prompts: [
    // ── Orientation ──
    { id: 'intro',        text: "Let's take some time to arrive here. A few minutes to settle the body and steady the breath before you begin.", baseSilenceAfter: 3 },
    { id: 'posture-01',   text: "Find a comfortable seat. Let your weight sink into whatever's beneath you.",                                    baseSilenceAfter: 5 },
    { id: 'posture-02',   text: 'Let your shoulders drop. Let your hands rest easy.',                                                            baseSilenceAfter: 4 },
    { id: 'posture-03',   text: "Let your jaw soften. When you're settled, close your eyes.",                                                    baseSilenceAfter: 5 },

    // ── Body Release ──
    { id: 'release-01',   text: 'Take a moment to notice where your body is holding tension.',                                                   baseSilenceAfter: 5 },
    { id: 'release-02',   text: 'Without trying to fix anything, let your attention pass through your shoulders. Let them release what they can.', baseSilenceAfter: 5 },
    { id: 'release-03',   text: 'The jaw, and the throat. Let them soften.',                                                                     baseSilenceAfter: 5 },
    { id: 'release-04',   text: 'The hands. Unclench them. Let them rest open.',                                                                 baseSilenceAfter: 5 },
    { id: 'release-05',   text: 'The belly. Let it be soft. Let it rise and fall with the breath.',                                              baseSilenceAfter: 5 },
    { id: 'release-sigh', text: 'Take one slow sigh out through the mouth. A clearing breath.',                                                  baseSilenceAfter: 6 },

    // ── Natural Breath Awareness ──
    { id: 'natural-01',   text: "Now turn your attention to the breath. Don't change it. Just watch it.",                                        baseSilenceAfter: 5 },
    { id: 'natural-02',   text: 'Feel the air coming in through the nose. Feel it leaving.',                                                     baseSilenceAfter: 6 },
    { id: 'natural-03',   text: "Notice the rhythm of your breath right now. However it is, it's fine.",                                         baseSilenceAfter: 6 },

    // ── Paced Breathing: 4-in / 6-out ──
    { id: 'paced-intro',  text: "Now we'll shape the breath a little. Four counts in, six counts out. A longer exhale helps the body settle.",   baseSilenceAfter: 4 },
    { id: 'paced-1-in',   text: 'Breathe in slowly through the nose. One. Two. Three. Four.',                                                    baseSilenceAfter: 2 },
    { id: 'paced-1-out',  text: 'And out slowly through the mouth. One. Two. Three. Four. Five. Six.',                                           baseSilenceAfter: 3 },
    { id: 'paced-2-in',   text: 'Again. In through the nose. One. Two. Three. Four.',                                                            baseSilenceAfter: 2 },
    { id: 'paced-2-out',  text: 'Out through the mouth. One. Two. Three. Four. Five. Six.',                                                      baseSilenceAfter: 3 },
    { id: 'paced-3-in',   text: 'Once more. In. One. Two. Three. Four.',                                                                         baseSilenceAfter: 2 },
    { id: 'paced-3-out',  text: 'Out. One. Two. Three. Four. Five. Six.',                                                                        baseSilenceAfter: 3 },
    { id: 'paced-4-in',   text: 'A final breath. In. One. Two. Three. Four.',                                                                    baseSilenceAfter: 2 },
    { id: 'paced-4-out',  text: 'Out. One. Two. Three. Four. Five. Six.',                                                                        baseSilenceAfter: 4 },

    // ── Centering ──
    { id: 'center-01',    text: 'Let the breath return to its own rhythm.',                                                                      baseSilenceAfter: 5 },
    { id: 'center-02',    text: 'Turn your attention to the center of your chest.',                                                              baseSilenceAfter: 4 },
    { id: 'center-03',    text: 'Breathe there. Not deeper, not slower. Just there.',                                                            baseSilenceAfter: 6 },
    { id: 'center-04',    text: 'This is the center. The place everything else gathers around.',                                                 baseSilenceAfter: 6 },
    { id: 'center-05',    text: 'Rest your attention here for a few breaths.',                                                                   baseSilenceAfter: 15 },

    // ── Close ──
    { id: 'close-01',     text: 'Notice how your body feels now. Different from where you started.',                                             baseSilenceAfter: 5 },
    { id: 'close-02',     text: 'Take one more slow breath.',                                                                                    baseSilenceAfter: 5 },
    { id: 'close-03',     text: "When you're ready, open your eyes.",                                                                            baseSilenceAfter: 3 },
  ],
};

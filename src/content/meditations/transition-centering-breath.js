/**
 * Transition Audio — Centering Breath
 *
 * Short guided breath exercise (~3 min) offered as a detour in the
 * Opening Ritual, before the user takes their substance.
 */

export const transitionCenteringBreath = {
  id: 'transition-centering-breath',
  title: 'Centering Breath',
  description: 'A brief guided breath practice before you begin.',

  audio: {
    basePath: '/audio/meditations/transition-centering-breath/',
    format: 'mp3',
  },

  speakingRate: 95,

  prompts: [
    { id: 'intro', text: "Let's take a few breaths together before you begin.", baseSilenceAfter: 3 },
    { id: 'in-01', text: 'Close your eyes. Breathe in slowly through your nose for a count of four.', baseSilenceAfter: 1 },
    { id: 'count-01', text: 'One, two, three, four.', baseSilenceAfter: 5 },
    { id: 'hold-01', text: 'Hold gently for a moment.', baseSilenceAfter: 3 },
    { id: 'out-01', text: 'Now breathe out slowly through your mouth. Let the breath carry any tension with it.', baseSilenceAfter: 6 },
    { id: 'in-02', text: 'Again. In through the nose.', baseSilenceAfter: 5 },
    { id: 'out-02', text: 'And out through the mouth.', baseSilenceAfter: 6 },
    { id: 'in-03', text: 'One more time. A slow breath in.', baseSilenceAfter: 5 },
    { id: 'out-03', text: 'And a long breath out.', baseSilenceAfter: 7 },
    { id: 'return', text: 'Good. Let your breathing return to its natural rhythm.', baseSilenceAfter: 4 },
    { id: 'close', text: "You're here. You're ready.", baseSilenceAfter: 3 },
  ],
};

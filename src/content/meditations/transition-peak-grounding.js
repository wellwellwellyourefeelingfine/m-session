/**
 * Transition Audio — Peak Grounding
 *
 * Short guided grounding (~2 min) offered as a detour during the Peak
 * Transition, if the user is feeling activated or overwhelmed on arrival.
 */

export const transitionPeakGrounding = {
  id: 'transition-peak-grounding',
  title: 'Peak Grounding',
  description: 'A brief grounding together at the peak arrival.',

  audio: {
    basePath: '/audio/meditations/transition-peak-grounding/',
    format: 'mp3',
  },

  speakingRate: 95,

  prompts: [
    { id: 'intro', text: "If the intensity feels like a lot right now, that's okay. Let's ground together for a moment.", baseSilenceAfter: 3 },
    { id: 'feet', text: 'Feel your feet on the floor. Press them down gently. Feel the weight and the contact.', baseSilenceAfter: 5 },
    { id: 'hands', text: 'Now notice your hands. Wherever they are, feel the surface beneath them. The texture. The temperature.', baseSilenceAfter: 5 },
    { id: 'breath-01-in', text: 'Take a breath in.', baseSilenceAfter: 4 },
    { id: 'breath-01-out', text: 'And let it go.', baseSilenceAfter: 5 },
    { id: 'safe', text: "You are here. You are in your body. The intensity you're feeling is not dangerous. It's the substance working, and it will settle.", baseSilenceAfter: 5 },
    { id: 'breath-02-in', text: 'One more breath. In.', baseSilenceAfter: 4 },
    { id: 'breath-02-out', text: 'And out.', baseSilenceAfter: 5 },
    { id: 'close', text: "Good. You're ready to continue whenever you'd like.", baseSilenceAfter: 3 },
  ],
};

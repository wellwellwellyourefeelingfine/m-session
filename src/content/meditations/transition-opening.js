/**
 * Transition Audio — Opening the Space
 *
 * Voice-guided opening for the Opening Ritual (~2 min).
 * Delivered by Theo Silk over the Sunrise animation.
 *
 * Tone: unhurried, present, ceremonial. Sets the container for the session.
 */

export const transitionOpening = {
  id: 'transition-opening',
  title: 'Opening the Space',
  description: 'A brief guided opening to arrive in your body and the moment.',

  audio: {
    basePath: '/audio/meditations/transition-opening/',
    format: 'mp3',
  },

  speakingRate: 95,

  prompts: [
    { id: 'begin-01', text: "Let's begin by arriving here.", baseSilenceAfter: 2 },
    { id: 'breath-01-in', text: 'Close your eyes if that feels comfortable. Take a slow breath in through your nose.', baseSilenceAfter: 4 },
    { id: 'breath-01-out', text: 'And out through your mouth.', baseSilenceAfter: 4 },
    { id: 'breath-02-in', text: 'One more. In.', baseSilenceAfter: 4 },
    { id: 'breath-02-out', text: 'And out.', baseSilenceAfter: 4 },
    { id: 'body-01', text: "Now bring your attention to your body. Notice where you're sitting or lying. Feel the surface beneath you. The weight of your hands wherever they're resting.", baseSilenceAfter: 5 },
    { id: 'notice-01', text: "You don't need to change anything about how you feel right now. Just notice what's here.", baseSilenceAfter: 5 },
    { id: 'container-01', text: 'This session begins now. Between this moment and when we close, this is your time. Whatever arises is welcome. Whatever surfaces is part of the work. You don\'t need to perform or achieve anything. You just need to be here.', baseSilenceAfter: 4 },
    { id: 'close-01', text: "When you're ready, open your eyes.", baseSilenceAfter: 3 },
  ],
};

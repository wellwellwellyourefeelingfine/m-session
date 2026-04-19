/**
 * Transition Audio — Opening the Space
 *
 * Voice-guided opening for the Opening Ritual (~3-4 min).
 * Plays AFTER the user has taken their substance, between the two reassurance
 * screens. Delivered by Theo Silk over the Sunrise animation.
 *
 * Tone: unhurried, present, ceremonial. The guide is holding space with the
 * user as the medicine settles into the body. Not preparing them for intake —
 * acknowledging that intake has already happened and the quiet work has begun.
 */

export const transitionOpening = {
  id: 'transition-opening',
  title: 'Opening the Space',
  description: 'A brief guided opening — arriving in your body as the medicine begins its work.',

  audio: {
    basePath: '/audio/meditations/transition-opening/',
    format: 'mp3',
  },

  speakingRate: 95,

  prompts: [
    { id: 'arrival-01',    text: "Let's begin by arriving here.",                                                                                                             baseSilenceAfter: 3 },
    { id: 'arrival-02',    text: "No rush. No task. Just this moment.",                                                                                                       baseSilenceAfter: 4 },
    { id: 'arrival-03',    text: "The medicine is already inside you, settling in, beginning its quiet work. For now, there's nothing you need to do.",                       baseSilenceAfter: 5 },

    { id: 'breath-01-in',  text: "Close your eyes if that feels comfortable. Take a slow breath in through your nose.",                                                       baseSilenceAfter: 4 },
    { id: 'breath-01-out', text: "And a long breath out through your mouth.",                                                                                                 baseSilenceAfter: 4 },
    { id: 'breath-02-in',  text: "Again. In.",                                                                                                                                baseSilenceAfter: 4 },
    { id: 'breath-02-out', text: "And out.",                                                                                                                                  baseSilenceAfter: 4 },
    { id: 'breath-03-in',  text: "One more. A slow breath in.",                                                                                                               baseSilenceAfter: 4 },
    { id: 'breath-03-out', text: "And a long breath out.",                                                                                                                    baseSilenceAfter: 5 },

    { id: 'container-01',  text: "This time you've set aside — it belongs to you. The hours ahead are yours alone. Whatever surfaces here, whatever you feel, whatever you remember or release, it stays with you.", baseSilenceAfter: 5 },
    { id: 'container-02',  text: "I'm here to hold the shape of this for you. To keep the edges steady so you can rest inside them.",                                         baseSilenceAfter: 5 },

    { id: 'body-01',       text: "Bring your attention to your body. Notice where you're sitting or lying. Feel the surface beneath you.",                                    baseSilenceAfter: 5 },
    { id: 'body-02',       text: "The weight of your hands, wherever they're resting. The temperature of the room on your skin. The small sounds around you.",                baseSilenceAfter: 6 },
    { id: 'body-03',       text: "You don't need to change any of it. Just notice what's here.",                                                                              baseSilenceAfter: 5 },

    { id: 'intention-01',  text: "Whatever brought you here today — hold it lightly. You don't need to reach for it. It already knows where to find you.",                    baseSilenceAfter: 5 },

    { id: 'permission-01', text: "You don't need to feel anything in particular. You don't need to perform, or prove, or achieve.",                                           baseSilenceAfter: 4 },
    { id: 'permission-02', text: "Whatever arises is part of the work. Whatever surfaces is welcome. Curious rather than controlling. Open rather than effortful.",           baseSilenceAfter: 5 },

    { id: 'close-01',      text: "The space is open. The session is yours.",                                                                                                  baseSilenceAfter: 4 },
    { id: 'close-02',      text: "When you're ready, open your eyes.",                                                                                                        baseSilenceAfter: 3 },
  ],
};

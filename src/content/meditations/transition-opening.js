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
  description: 'A brief guided opening. Arriving in your body as the MDMA begins to come on.',

  audio: {
    basePath: '/audio/meditations/transition-opening/',
    format: 'mp3',
  },

  speakingRate: 95,

  prompts: [
    { id: 'arrival-01',    text: "Let's begin by arriving here.",                                                                                                             baseSilenceAfter: 3 },
    { id: 'arrival-02',    text: "No rush. No task. Just this moment.",                                                                                                       baseSilenceAfter: 4 },
    { id: 'arrival-03',    text: "The MDMA is already inside you, settling in, beginning its quiet work. For now, there's nothing you need to do.",                           baseSilenceAfter: 5 },

    { id: 'breath-01-in',  text: "Close your eyes if that feels comfortable. Take a slow breath in through your nose.",                                                       baseSilenceAfter: 4 },
    { id: 'breath-01-out', text: "And a long breath out through your mouth.",                                                                                                 baseSilenceAfter: 4 },
    { id: 'breath-02-in',  text: "Again. In.",                                                                                                                                baseSilenceAfter: 4 },
    { id: 'breath-02-out', text: "And out.",                                                                                                                                  baseSilenceAfter: 4 },
    { id: 'breath-03-in',  text: "One more. A slow breath in.",                                                                                                               baseSilenceAfter: 4 },
    { id: 'breath-03-out', text: "And a long breath out.",                                                                                                                    baseSilenceAfter: 5 },

    { id: 'container-01',  text: "This time you've set aside — it belongs to you. The hours ahead are yours alone. Whatever surfaces here, whatever you feel, whatever you remember or release, it stays with you.", baseSilenceAfter: 5 },
    { id: 'container-02',  text: "This space is yours. The ritual has begun. The structure is already in place. You don't need to hold it up.",                                baseSilenceAfter: 5 },

    { id: 'body-01',       text: "Bring your attention to your body. Notice where you're sitting or lying. Feel the surface beneath you.",                                    baseSilenceAfter: 5 },
    { id: 'body-02',       text: "The weight of your hands, wherever they're resting. The temperature of the room on your skin. The small sounds around you.",                baseSilenceAfter: 6 },
    { id: 'body-03',       text: "You don't need to change any of it. Just notice what's here.",                                                                              baseSilenceAfter: 5 },

    { id: 'intention-01',  text: "Whatever brought you here today — hold it lightly. You don't need to reach for it. It already knows where to find you.",                    baseSilenceAfter: 5 },

    { id: 'permission-01', text: "You don't need to feel anything in particular. You don't need to perform, or prove, or achieve.",                                           baseSilenceAfter: 4 },
    { id: 'permission-02', text: "Whatever arises is part of the work. Whatever surfaces is welcome. Curious rather than controlling. Open rather than effortful.",           baseSilenceAfter: 5 },

    { id: 'come-up-01',    text: "In the minutes ahead, you might begin to feel something. A warmth, a lightness, a softening in the body. Or you might feel nothing for a while. Both are fine.", baseSilenceAfter: 5 },
    { id: 'come-up-02',    text: "Everyone comes up differently. For some, it arrives quickly. For others it takes longer. Let it come without force or expectation.",        baseSilenceAfter: 4 },
    { id: 'come-up-03',    text: "While you wait, let things stay quiet. Soft music, slow breathing, or simple rest. Nothing that asks effort from you. Let your body ease into the altered state that's arriving.", baseSilenceAfter: 5 },

    { id: 'close-01',      text: "The space is open. The session is yours.",                                                                                                  baseSilenceAfter: 4 },
    { id: 'close-02',      text: "The hours ahead are set apart from ordinary time. They belong to no one else. Take them slowly.",                                           baseSilenceAfter: 5 },
    { id: 'close-03',      text: "When you're ready, open your eyes.",                                                                                                        baseSilenceAfter: 3 },
  ],
};

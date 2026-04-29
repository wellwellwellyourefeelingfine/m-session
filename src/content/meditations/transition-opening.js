/**
 * Transition Audio — Opening the Space
 *
 * Voice-guided opening for the Opening Ritual (~7-8 min).
 * Plays AFTER the user has taken their substance, between the two reassurance
 * screens.  Delivered by Theo Silk over the Sunrise animation.
 *
 * Tone: unhurried, ceremonial, held.  Places the listener inside an imaginal
 * scene — a small boat on slow water at dawn — and gives them a stance to
 * carry into the session: meet whatever arises from the depths with the
 * curiosity of a naturalist, not the focus of a fisherman hunting one
 * specific catch.
 */

export const transitionOpening = {
  id: 'transition-opening',
  title: 'Opening the Space',
  description: 'A guided opening.  Arriving in your body as the medicine begins to come on.',

  audio: {
    basePath: '/audio/meditations/transition-opening/',
    format: 'mp3',
    defaultVoice: 'theo',
    voices: [
      { id: 'theo',   label: 'Thoughtful Theo', subfolder: '' },
      { id: 'rachel', label: 'Relaxing Rachel', subfolder: 'relaxing-rachel/' },
    ],
  },

  isFixedDuration: true,
  fixedDuration: 513, // ~8:33 — computed from actual MP3 durations (audio-durations.json) + baseSilenceAfter sums

  prompts: [
    { id: 'arrival-01', text: "Let's begin by arriving here.  Right where you are, just as you are.  Allow yourself to be here.", baseSilenceAfter: 3 },
    { id: 'arrival-02', text: "There's no rush.  No task.  Nothing you need to do, and nowhere else you need to be.  Just this moment, and the breath moving through it.", baseSilenceAfter: 4 },
    { id: 'arrival-03', text: "The medicine is already inside you. It's settling in, beginning its quiet work, and you don't need to do anything to help it along.  Let your only task be presence.", baseSilenceAfter: 5 },

    { id: 'breath-01-in', text: 'Close your eyes, if that feels comfortable.  And take a slow breath in, through the nose... drawing in fresh air, filling the chest.', baseSilenceAfter: 4 },
    { id: 'breath-01-out', text: 'And a long breath out, through the mouth... letting the body soften, letting the shoulders drop.', baseSilenceAfter: 4 },
    { id: 'breath-02-in', text: 'Again.  A slow breath in, through the nose... drawing the air all the way down into the belly.', baseSilenceAfter: 4 },
    { id: 'breath-02-out', text: "And a long breath out, through the mouth... letting go of whatever you brought in with you.", baseSilenceAfter: 4 },
    { id: 'breath-03-in', text: 'One more.  A slow, full breath in... as deep as feels right for you, with no effort, no straining.', baseSilenceAfter: 5 },
    { id: 'breath-03-out', text: 'And a long, easy breath out... and as the breath leaves, let the body settle into the present moment.', baseSilenceAfter: 6 },

    { id: 'water-01', text: 'As you begin to ease into your session, it may be helpful to imagine yourself on an open ocean, held in a small boat that sways gently on the rolling waves.', baseSilenceAfter: 5 },
    { id: 'water-02', text: 'On the horizon, you see a band of light, the beginnings of a rising sun.  The warmth of its light reaches your face, and begins to illuminate the deep waters of the ocean beneath you.', baseSilenceAfter: 5 },
    { id: 'water-03', text: 'There is darkness in the depths.  Beauty also.  The ocean holds so much life, and so many unknowns.', baseSilenceAfter: 6 },
    { id: 'water-04', text: "... now set the ocean's mysteries aside for now, and simply feel yourself held by the boat...   You are safe here...", baseSilenceAfter: 6 },

    { id: 'body-01', text: 'Feel the surface beneath you, where your arms and legs make contact, grounded and held.', baseSilenceAfter: 5 },
    { id: 'body-02', text: 'Become aware of the weight of your hands, resting.  Feel your shoulders ease down.  The air on your skin.  The small sounds around you.', baseSilenceAfter: 6 },
    { id: 'body-03', text: 'Let the breath rise, and fall, exactly as it is.  Let it all simply be.', baseSilenceAfter: 5 },

    { id: 'depths-01', text: 'In the hours ahead, things will arise to meet you.  Some you may expect.  Some you may not.', baseSilenceAfter: 5 },
    { id: 'depths-02', text: "Memories, emotions, images, questions.  Fragments you had set aside.  Truths you already knew but hadn't looked at directly.", baseSilenceAfter: 6 },
    { id: 'depths-03', text: "Whatever comes to the surface does so because it's ready.  Whatever stays beneath is not yet time.", baseSilenceAfter: 6 },

    { id: 'intention-01', text: 'You may have set an intention.  A question, a hope, a feeling you wanted to meet.', baseSilenceAfter: 5 },
    { id: 'intention-02', text: 'Hold it lightly.  It already knows where to find you.', baseSilenceAfter: 5 },

    { id: 'stance-01', text: 'Some come to these waters with a net.  Hoping to pull up one specific thing.  A particular answer, a particular memory.  The ocean gives what the ocean gives.', baseSilenceAfter: 6 },
    { id: 'stance-02', text: 'Come instead as a naturalist on the open water, curious to observe what arises from the sea.  There is so much to learn from the life that exists there beneath the surface.', baseSilenceAfter: 5 },
    { id: 'stance-03', text: "For now, simply stay grounded in your boat, feeling the gentle waves as they rise and fall, watching the rays of the sun as they mingle with the ocean's lucid surface.", baseSilenceAfter: 6 },

    { id: 'comeup-01', text: 'In the minutes ahead, something will begin to shift.  A warmth.  A softening.  A subtle sense of the world opening.', baseSilenceAfter: 5 },
    { id: 'comeup-02', text: 'Everyone comes up differently.  For some it arrives quickly.  For others it takes longer.  Let it come on its own time.', baseSilenceAfter: 5 },
    { id: 'comeup-03', text: "While you wait, be gentle with yourself.  Rest.  Grounding.  Soft music.  Stretch out if you need to.  Let your body ease into what's arriving.", baseSilenceAfter: 5 },

    { id: 'close-01', text: 'The sun continues to rise...   The water continues its slow movement...   The space is open.   The session is yours.', baseSilenceAfter: 5 },
    { id: 'close-02', text: 'The hours ahead are set apart from ordinary time.  They belong to no one else.  Take them slowly and with a renewed attention.', baseSilenceAfter: 5 },
    { id: 'close-03', text: "When you're ready,  open your eyes...", baseSilenceAfter: 3 },
  ],
};

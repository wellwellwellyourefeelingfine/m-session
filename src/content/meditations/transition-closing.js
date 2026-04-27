/**
 * Transition Audio — Closing Reflection
 *
 * Voice-guided closing (~10 min) delivered over the Moonrise animation
 * at the midpoint of the Closing Ritual.
 *
 * Tone: settled, wise, honoring the work done.  Acknowledges the full range
 * of possible experiences without assuming difficulty or ease.  Frames the
 * active session as closing and the deeper integration as beginning.
 */

export const transitionClosing = {
  id: 'transition-closing',
  title: 'Closing Reflection',
  description: 'A guided closing as the session comes to a close.',

  audio: {
    basePath: '/audio/meditations/transition-closing/',
    format: 'mp3',
  },

  isFixedDuration: true,
  fixedDuration: 551, // ~9:11 — computed from actual MP3 durations (audio-durations.json) + baseSilenceAfter sums

  prompts: [
    { id: 'arrival-01', text: "Let's take a moment to bring this to a close. We'll put a marker here, wherever the journey has taken you.", baseSilenceAfter: 4 },
    { id: 'arrival-02', text: 'From this place of closing, try to appreciate what came before.  Simply a recognition...  Like looking back at the view after a long hike.', baseSilenceAfter: 5 },

    { id: 'breath-01-in', text: 'Close your eyes, if that feels comfortable.  And take a slow breath in, through the nose... feeling the air fill the chest.', baseSilenceAfter: 4 },
    { id: 'breath-01-out', text: 'And a long breath out, through the mouth... letting the body soften, letting the shoulders release.', baseSilenceAfter: 4 },
    { id: 'breath-02-in', text: 'Again.  A slow breath in, through the nose... gathering yourself gently, bringing your attention all the way here.', baseSilenceAfter: 4 },
    { id: 'breath-02-out', text: "And a long breath out, through the mouth... letting go of anything that isn't needed for what comes next.", baseSilenceAfter: 4 },

    { id: 'honor-01', text: 'Whatever moved through you today was real.  And it was yours.', baseSilenceAfter: 5 },
    { id: 'honor-02', text: "Sessions like this one rarely arrive in a single note.  There may be moments of quiet peace or loud waves of feeling.  That's the texture of real work: a fullness of harmony.", baseSilenceAfter: 5 },
    { id: 'honor-03', text: "The psyche does this work in its own language.  What surfaced, surfaced because it was ready to.  What stayed hidden wasn't yet time.", baseSilenceAfter: 6 },
    { id: 'honor-04', text: 'Your mind and body showed you what they were ready to show you, at the pace you could meet.  What they offered was exactly enough.', baseSilenceAfter: 6 },

    { id: 'intention-01', text: 'Earlier today, you may have set an intention.', baseSilenceAfter: 2 },
    { id: 'intention-02', text: "If you did hold an intention, let it rest for a moment now.  You don't need to measure whether it was met.", baseSilenceAfter: 5 },
    { id: 'intention-03', text: 'Intentions are seeds.  You might not see the growth immediately, but it will come with nurturing attention.', baseSilenceAfter: 6 },

    { id: 'shape-01', text: "These sessions rarely follow the shape you planned for them.  They follow what's actually needed.  That's the deeper intelligence of this work.", baseSilenceAfter: 5 },
    { id: 'shape-02', text: 'Listening to what the moment actually called for, rather than what you prepared for, was the whole practice today.', baseSilenceAfter: 6 },

    { id: 'spectrum-01', text: 'These sessions land across a wide range.  Some feel expansive, even euphoric.  And some feel like a reckoning.  Their meaning will unfold slowly over days.', baseSilenceAfter: 6 },
    { id: 'spectrum-02', text: 'Whatever you experienced today, every part of it had something to give.  The bright moments and the quiet ones alike.', baseSilenceAfter: 4 },
    { id: 'spectrum-03', text: 'Whatever you felt today, your system offered exactly what you were ready for.  And you received it.', baseSilenceAfter: 6 },

    { id: 'continues-01', text: 'The active part of the session is ending now.  The deeper integration has just begun.', baseSilenceAfter: 5 },
    { id: 'continues-02', text: 'Over the coming days and weeks, pieces of this experience will return to you.  In quiet moments.  In conversations.  In dreams.  Sometimes when you least expect it.', baseSilenceAfter: 6 },
    { id: 'continues-03', text: "Let those moments arrive on their own time.  You don't need to chase them.  Welcome them with a brave and open heart.", baseSilenceAfter: 6 },

    { id: 'unknowing-01', text: 'Understanding will come on its own time.  Meaning emerges slowly.  Over weeks, sometimes months.  Not all at once.', baseSilenceAfter: 6 },
    { id: 'unknowing-02', text: 'Not knowing what to make of today is not a problem.  This is where the integration begins.', baseSilenceAfter: 6 },

    { id: 'help-01', text: 'A few things tend to help in the days ahead.', baseSilenceAfter: 4 },
    { id: 'help-02', text: 'Rest, above all.  Sleep when you can.  Eat gently.  Move slowly tomorrow.', baseSilenceAfter: 5 },
    { id: 'help-03', text: "When you're ready, speaking with someone you trust can help.  Saying it out loud often changes what it becomes.", baseSilenceAfter: 5 },
    { id: 'help-04', text: 'Working with a therapist who understands this kind of experience can deepen the integration too.', baseSilenceAfter: 5 },
    { id: 'help-05', text: 'You can also return here.  There are follow-up activities designed to help you keep making sense of what happened, at your own pace.', baseSilenceAfter: 6 },

    { id: 'gratitude-01', text: 'Before we close, take a moment to acknowledge what you did today.', baseSilenceAfter: 5 },
    { id: 'gratitude-02', text: 'You made the time.  You prepared.  You opened yourself to something real.  And you met everything that came up.', baseSilenceAfter: 6 },
    { id: 'gratitude-03', text: "That took courage.  It's worth naming.", baseSilenceAfter: 6 },

    { id: 'close-container-01', text: 'The space we opened at the start is closing now.', baseSilenceAfter: 5 },
    { id: 'close-container-02', text: 'The hours you set aside held exactly what they were meant to hold.', baseSilenceAfter: 5 },
    { id: 'close-container-03', text: 'This time was set apart from ordinary time.  Let it stay set apart in your memory, as a special object you can return to and call upon.', baseSilenceAfter: 6 },

    { id: 'return-01', text: 'Take one more slow breath in.', baseSilenceAfter: 4 },
    { id: 'return-02', text: 'And a long breath out.', baseSilenceAfter: 5 },
    { id: 'return-03', text: 'Feel the surface beneath you.  The air on your skin.  The sounds around you.', baseSilenceAfter: 5 },
    { id: 'return-04', text: 'The world is there for you.  Meet it with renewed attention.', baseSilenceAfter: 4 },
    { id: 'return-05', text: "When you're ready, open your eyes.  Your session is complete.", baseSilenceAfter: 3 },
  ],
};

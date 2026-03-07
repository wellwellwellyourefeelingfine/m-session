/**
 * The Deep Dive — Relationship Meditation (Part 1)
 *
 * A relationship-guided audio meditation for one person or two.
 * Explore what lies beneath surface-level reactions using EFT principles.
 *
 * Two modes:
 * - Solo (~20 min): Exploring a relationship internally
 * - Couple (~23 min): Doing this with a partner present
 *
 * 41 total unique prompts: 32 shared + 6 couple-only + 3 solo-only
 *
 * Audio: /audio/meditations/the-descent/{promptId}.mp3
 * Fixed duration per mode (no DurationPicker)
 */

import audioDurations from './audio-durations.json' with { type: 'json' };

const SPEAKING_RATE = 90; // words per minute — slow, spacious pacing

// ============================================
// ALL PROMPTS (41 total)
// ============================================

const allPrompts = [
  // === PHASE 1: SETTLING ===
  {
    id: 'settling-01',
    text: 'Find a comfortable position. Somewhere you can stay for a while. Close your eyes, or let your gaze go soft.',
    baseSilenceAfter: 5,
    silenceExpandable: false,
  },
  {
    id: 'settling-02',
    text: 'Take a slow breath. Not to change anything. Just to arrive.',
    baseSilenceAfter: 8,
    silenceExpandable: true,
    silenceMax: 15,
  },
  {
    id: 'settling-03',
    text: 'Feel the weight of your body. The places where you make contact with whatever is holding you. Let yourself be held.',
    baseSilenceAfter: 10,
    silenceExpandable: true,
    silenceMax: 18,
  },
  {
    id: 'settling-04',
    text: 'Let your breathing find its own pace. You don\u2019t need to be anywhere other than here. You don\u2019t need to be ready for anything. Just be here for a moment before we begin.',
    baseSilenceAfter: 12,
    silenceExpandable: true,
    silenceMax: 20,
  },

  // === PHASE 2: BRINGING THE PERSON CLOSE ===
  {
    id: 'person-01',
    text: 'In this practice, you are going to turn your attention toward someone who matters to you. Someone where there is something alive between you. Something unfinished, or something you want to understand better.',
    baseSilenceAfter: 6,
    silenceExpandable: false,
  },
  {
    id: 'person-02',
    text: 'You probably already know who this is. Let them come to mind now. You don\u2019t need to choose carefully. Your mind already knows.',
    baseSilenceAfter: 10,
    silenceExpandable: true,
    silenceMax: 18,
  },
  {
    id: 'person-03',
    text: 'Bring this person close. Not a memory of a fight, or a good time. Just them. Their face. The way they hold themselves. The feeling of being in a room with them.',
    baseSilenceAfter: 12,
    silenceExpandable: true,
    silenceMax: 22,
  },
  {
    id: 'person-04',
    text: 'Now notice what happens in your body when you bring them this close. There is no wrong answer here. It might be warmth. It might be tension. It might be a complicated mix of things you can\u2019t quite separate. Just notice what\u2019s there.',
    baseSilenceAfter: 15,
    silenceExpandable: true,
    silenceMax: 25,
  },
  {
    id: 'person-05-couple',
    text: 'Your partner is right here with you. If it feels right, reach out and make some kind of contact. A hand on their knee. Holding hands. Just the feeling of them being here, in this, alongside you. You don\u2019t need to look at each other yet. Just feel the fact that they are here.',
    baseSilenceAfter: 15,
    silenceExpandable: true,
    silenceMax: 25,
    variationOnly: 'couple',
  },

  // === PHASE 3: LAYER ONE — THE SURFACE ===
  {
    id: 'surface-01',
    text: 'Now let your mind drift toward what happens when things get hard between you and this person. Not a specific argument. Just the pattern. The thing that keeps showing up.',
    baseSilenceAfter: 10,
    silenceExpandable: true,
    silenceMax: 20,
  },
  {
    id: 'surface-02',
    text: 'When you are in it, when the friction is happening, what is your most familiar feeling? The one that shows up almost before you know it\u2019s there.',
    baseSilenceAfter: 12,
    silenceExpandable: true,
    silenceMax: 22,
  },
  {
    id: 'surface-03',
    text: 'It might be frustration. The sense that you are not being heard, or that you keep having to explain yourself. It might be a kind of tightness in your chest, a rising heat, an urgency that you have to make them understand.',
    baseSilenceAfter: 8,
    silenceExpandable: true,
    silenceMax: 15,
  },
  {
    id: 'surface-04',
    text: 'Or it might be something quieter. A pulling away. A door closing inside you. The feeling of going flat or numb, like something in you just leaves the room even though your body is still there.',
    baseSilenceAfter: 8,
    silenceExpandable: true,
    silenceMax: 15,
  },
  {
    id: 'surface-05',
    text: 'Or maybe it is a familiar tiredness. A heaviness that says: here we go again. A sense that nothing you do will actually change anything.',
    baseSilenceAfter: 8,
    silenceExpandable: true,
    silenceMax: 15,
  },
  {
    id: 'surface-06',
    text: 'Whatever your version is, find it now. Not as an idea but as a feeling in your body. Where does it live? Your chest. Your stomach. Your throat. Your shoulders. Your jaw.',
    baseSilenceAfter: 15,
    silenceExpandable: true,
    silenceMax: 25,
  },
  {
    id: 'surface-07',
    text: 'Stay with it for a moment. This is the feeling you know. This is the one that runs the show when things get hard between you. It has been doing this for a long time. Maybe longer than this relationship.',
    baseSilenceAfter: 15,
    silenceExpandable: true,
    silenceMax: 25,
  },
  {
    id: 'surface-07-couple',
    text: 'Notice what it is like to feel this with your partner right beside you. You don\u2019t need to talk about it or do anything about it. Just notice that you can feel this familiar thing and they are still here.',
    baseSilenceAfter: 12,
    silenceExpandable: true,
    silenceMax: 20,
    variationOnly: 'couple',
  },

  // === PHASE 4: LAYER TWO — WHAT'S UNDERNEATH ===
  {
    id: 'beneath-01',
    text: 'Now. See if you can do something that might feel unfamiliar. Instead of staying with that surface feeling, see if you can look behind it. Not push it away. Just gently step around it, like looking behind a wall you have been standing in front of for a long time.',
    baseSilenceAfter: 15,
    silenceExpandable: true,
    silenceMax: 30,
  },
  {
    id: 'beneath-02',
    text: 'That surface reaction, the frustration or the withdrawal or the numbness, it has been trying to do something for you. It is not random. It is a move. A strategy. Something you learned to do when things feel unsafe between you and someone who matters.',
    baseSilenceAfter: 12,
    silenceExpandable: true,
    silenceMax: 22,
  },
  {
    id: 'beneath-03',
    text: 'What is it protecting?',
    baseSilenceAfter: 20,
    silenceExpandable: true,
    silenceMax: 40,
  },
  {
    id: 'beneath-04',
    text: 'Underneath the part of you that pushes forward or pulls away, is there something softer? Something that does not come out very often? Something you might have decided a long time ago was not safe to show?',
    baseSilenceAfter: 20,
    silenceExpandable: true,
    silenceMax: 40,
  },
  {
    id: 'beneath-05',
    text: 'It might be a fear. The fear that you are too much. Or not enough. The fear that if they really saw all of you, they would not stay.',
    baseSilenceAfter: 15,
    silenceExpandable: true,
    silenceMax: 30,
  },
  {
    id: 'beneath-06',
    text: 'It might be a sadness. A loneliness that lives right in the middle of the relationship. The feeling of being right next to someone and still not quite able to reach them.',
    baseSilenceAfter: 15,
    silenceExpandable: true,
    silenceMax: 30,
  },
  {
    id: 'beneath-07',
    text: 'It might be something even simpler than that. A question that your body keeps asking even though your mind stopped asking it a long time ago. Something like: Am I enough for you? Will you stay? Do I matter? Do you see me?',
    baseSilenceAfter: 25,
    silenceExpandable: true,
    silenceMax: 50,
  },
  {
    id: 'beneath-08',
    text: 'Whatever you are finding here, let yourself feel it. Not just know it. Feel it. In your body. In the weight of it. In the way it has been sitting there, underneath everything, maybe for a very long time.',
    baseSilenceAfter: 25,
    silenceExpandable: true,
    silenceMax: 50,
  },
  {
    id: 'beneath-09',
    text: 'This is real. This is what is actually happening when things get hard between you. Not the argument about schedules or money or dishes. This. This feeling right here.',
    baseSilenceAfter: 20,
    silenceExpandable: true,
    silenceMax: 40,
  },
  // Couple: turn toward partner
  {
    id: 'beneath-09-couple-a',
    text: 'If it feels right, turn toward your partner now. You don\u2019t need to speak. Just let them see you while you are in this place. This more open place. And let yourself see them.',
    baseSilenceAfter: 10,
    silenceExpandable: true,
    silenceMax: 18,
    variationOnly: 'couple',
  },
  {
    id: 'beneath-09-couple-b',
    text: 'They are probably finding their own version of the same thing right now. You don\u2019t need to know what it is. Just let yourself be seen, and see them, without either of you needing to be anything other than what you are in this moment.',
    baseSilenceAfter: 35,
    silenceExpandable: true,
    silenceMax: 60,
    variationOnly: 'couple',
  },
  // Solo: imagined being seen
  {
    id: 'beneath-09-solo-a',
    text: 'Imagine, just for a moment, that this person could see you right now. Not the version of you that shows up in the argument. Not the one who gets loud or goes quiet. This version. The one underneath. The one who is just asking a question and hoping the answer is yes.',
    baseSilenceAfter: 10,
    silenceExpandable: true,
    silenceMax: 18,
    variationOnly: 'solo',
  },
  {
    id: 'beneath-09-solo-b',
    text: 'What would it be like if they could see this and not turn away?',
    baseSilenceAfter: 25,
    silenceExpandable: true,
    silenceMax: 45,
    variationOnly: 'solo',
  },

  // === PHASE 5: LAYER THREE — THE NEED ===
  {
    id: 'need-01',
    text: 'Stay here for a moment. Right here, with whatever you have found.',
    baseSilenceAfter: 15,
    silenceExpandable: true,
    silenceMax: 30,
  },
  {
    id: 'need-02',
    text: 'If this feeling could speak, if it could say one completely honest thing to this person, what would it say? Not a complaint. Not a request. Just the truest thing.',
    baseSilenceAfter: 25,
    silenceExpandable: true,
    silenceMax: 50,
  },
  {
    id: 'need-03',
    text: 'You might notice that what it wants to say is very simple. Much simpler than any argument you have ever had. It might be something like: I need to know you are there. Or: I am scared I am losing you. Or: I just want to feel like I matter. Let whatever is there be there.',
    baseSilenceAfter: 25,
    silenceExpandable: true,
    silenceMax: 50,
  },
  {
    id: 'need-04',
    text: 'This is the part of you that your surface reactions have been trying to protect. The one that cares so much about this person that it learned a whole way of being just to keep the connection from breaking. Even when that way of being sometimes makes the connection harder.',
    baseSilenceAfter: 20,
    silenceExpandable: true,
    silenceMax: 40,
  },
  {
    id: 'need-05',
    text: 'You don\u2019t need to do anything with this right now. You don\u2019t need to solve it or say it out loud or make a plan. Just let yourself know what is true. Let it settle into you as something you know now, something you can feel, not just something you think about.',
    baseSilenceAfter: 20,
    silenceExpandable: true,
    silenceMax: 35,
  },

  // === PHASE 6: CLOSING ===
  {
    id: 'closing-01',
    text: 'Slowly begin to widen your awareness again. The room around you. Sounds. The temperature. The surface beneath you.',
    baseSilenceAfter: 8,
    silenceExpandable: true,
    silenceMax: 15,
  },
  {
    id: 'closing-02',
    text: 'Take a breath. A real one. Let it go.',
    baseSilenceAfter: 6,
    silenceExpandable: false,
  },
  {
    id: 'closing-03',
    text: 'Notice how you feel now compared to when you started. Something may have shifted. Something may still be settling. Both are fine. There is no right way to feel after something like this.',
    baseSilenceAfter: 10,
    silenceExpandable: true,
    silenceMax: 18,
  },
  // Couple: facilitated one-sentence sharing
  {
    id: 'closing-04-couple',
    text: 'When you are ready, if there is one thing you want your partner to know right now, one sentence, you can say it. It does not have to be big or complete. Just the truest thing. Your partner\u2019s only job is to hear it. Take your time. There is no rush.',
    baseSilenceAfter: 40,
    silenceExpandable: true,
    silenceMax: 70,
    variationOnly: 'couple',
  },
  {
    id: 'closing-05-couple',
    text: 'If you haven\u2019t already, switch. The other person can share their one thing now. The listener just receives. No response needed. Just hearing.',
    baseSilenceAfter: 40,
    silenceExpandable: true,
    silenceMax: 70,
    variationOnly: 'couple',
  },
  // Solo: transition to journaling
  {
    id: 'closing-04-solo',
    text: 'In a moment, you will have a chance to put some of this into words. Not to analyze what happened. Just to catch what surfaced before it fades. There is no pressure to write perfectly or completely. Whatever comes is enough.',
    baseSilenceAfter: 8,
    silenceExpandable: false,
    variationOnly: 'solo',
  },
  // Shared: eyes open
  {
    id: 'closing-05',
    text: 'When you are ready, let your eyes open. Take your time.',
    baseSilenceAfter: 5,
    silenceExpandable: false,
  },
];


// ============================================
// ASSEMBLY LOGIC
// ============================================

/**
 * Assemble the prompt sequence for a given mode
 * @param {'solo' | 'couple'} mode
 * @returns {Array} Filtered and ordered prompt array
 */
function assembleVariation(mode) {
  return allPrompts.filter(p => !p.variationOnly || p.variationOnly === mode);
}

/**
 * Calculate the speaking duration for a prompt using the audio manifest.
 * Falls back to word-count estimation if no audio file exists yet.
 */
function calculatePromptSpeakingDuration(prompt) {
  const manifestDuration = audioDurations['the-descent']?.[prompt.id];
  if (manifestDuration) return manifestDuration;
  const wordCount = prompt.text.split(' ').length;
  return (wordCount / SPEAKING_RATE) * 60;
}


// ============================================
// EXPORTED MEDITATION OBJECT
// ============================================

export const theDescentMeditation = {
  id: 'the-descent',
  title: 'The Deep Dive',
  subtitle: 'Relationship meditation',
  description: 'A relationship-guided audio meditation for one person or two. Explore what is really happening beneath the surface.',

  audio: {
    basePath: '/audio/meditations/the-descent/',
    format: 'mp3',
  },

  speakingRate: SPEAKING_RATE,

  // Fixed duration per mode (no DurationPicker)
  isFixedDuration: true,

  defaultVariation: 'solo',

  variations: {
    solo: {
      key: 'solo',
      label: 'Solo',
      description: 'Explore a relationship on your own.',
      duration: 17 * 60,
    },
    couple: {
      key: 'couple',
      label: 'With a Partner',
      description: 'Do this together. Includes moments of shared contact.',
      duration: 20 * 60,
    },
  },

  prompts: allPrompts,
  assembleVariation,
  calculatePromptSpeakingDuration,
};

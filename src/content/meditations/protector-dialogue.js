/**
 * Protector Dialogue Guided Meditation
 * "Meeting a Protector" — Part 1, Step 5
 *
 * 16 prompts written at ~90 WPM for peak state.
 * Audio files are TTS-generated and placed in /audio/meditations/protector-dialogue/
 * The module supports a "Read" mode as fallback when audio files aren't available.
 */

export const protectorDialogueMeditation = {
  id: 'protector-dialogue',
  title: 'Meeting a Protector',
  subtitle: 'Guided Noticing',
  description: 'A gentle guided audio meditation to notice and connect with a protective part of yourself. Have your headphones or speakers ready.',

  // Duration config — this is a fixed-length meditation, not variable
  baseDuration: 600, // ~10 minutes base
  minDuration: 480,  // 8 minutes minimum
  maxDuration: 720,  // 12 minutes with expanded silences

  // Audio config
  audio: {
    basePath: '/audio/meditations/protector/',
    format: 'mp3',
  },

  // Speaking rate — slower for peak state (90 WPM vs typical 150)
  speakingRate: 90,

  // Prompts
  prompts: [
    {
      id: 'settling-01',
      text: 'Find a comfortable position. You can close your eyes if that feels right, or let your gaze soften.',
      baseSilenceAfter: 5,
    },
    {
      id: 'settling-02',
      text: 'Take a moment to notice how you feel right now. Not to judge it or name it. Just to register it.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 15,
    },
    {
      id: 'body-01',
      text: 'Now, gently bring your attention into your body. Start wherever feels natural.',
      baseSilenceAfter: 6,
    },
    {
      id: 'body-02',
      text: 'Notice if there\'s an area that holds some tension. Your chest. Your jaw. Your stomach. Your shoulders. Wherever you feel something pulling for attention.',
      baseSilenceAfter: 10,
      silenceExpandable: true,
      silenceMax: 20,
    },
    {
      id: 'pattern-01',
      text: 'Now I want you to think about a pattern you recognize in yourself. A way you tend to react when things get difficult.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 15,
    },
    {
      id: 'pattern-02',
      text: 'Maybe it\'s a voice that criticizes you. Maybe it\'s a habit of shutting down, or people-pleasing, or staying so busy you never stop. Maybe it\'s the part of you that always needs to be in control.',
      baseSilenceAfter: 12,
      silenceExpandable: true,
      silenceMax: 25,
    },
    {
      id: 'pattern-03',
      text: 'Whatever comes to mind first \u2014 that\'s the one. Don\'t overthink it. Just let it be whatever it is.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 15,
    },
    {
      id: 'locate-01',
      text: 'Now see if you can feel where this pattern lives in your body. It often has a location \u2014 a tightness, a weight, a sensation somewhere specific.',
      baseSilenceAfter: 12,
      silenceExpandable: true,
      silenceMax: 25,
    },
    {
      id: 'locate-02',
      text: 'If you can find it, just rest your attention there. You don\'t need to do anything with it. Just notice it.',
      baseSilenceAfter: 10,
      silenceExpandable: true,
      silenceMax: 20,
    },
    {
      id: 'relate-01',
      text: 'Here\'s what I\'d like you to try. Instead of thinking about this pattern as something wrong with you, see if you can get curious about it. As if it were another person in the room.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 15,
    },
    {
      id: 'relate-02',
      text: 'If you could ask it one question, it would be this: what are you trying to protect me from?',
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 30,
    },
    {
      id: 'relate-03',
      text: 'You don\'t need an answer right now. Just asking the question is enough. Let whatever comes, come.',
      baseSilenceAfter: 12,
      silenceExpandable: true,
      silenceMax: 25,
    },
    {
      id: 'gratitude-01',
      text: 'Now, if it feels genuine \u2014 and only if it does \u2014 see if you can feel something like appreciation for this part of you. It showed up for a reason. It\'s been working hard, probably for a long time.',
      baseSilenceAfter: 12,
      silenceExpandable: true,
      silenceMax: 25,
    },
    {
      id: 'gratitude-02',
      text: 'You might silently say something like: I see you. I know you\'ve been trying to help.',
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 30,
    },
    {
      id: 'close-01',
      text: 'Take one more breath. Let whatever you noticed settle. There\'s no rush.',
      baseSilenceAfter: 8,
    },
    {
      id: 'close-02',
      text: 'When you\'re ready, gently bring your attention back to the room. Open your eyes when it feels right.',
      baseSilenceAfter: 6,
    },
  ],
};

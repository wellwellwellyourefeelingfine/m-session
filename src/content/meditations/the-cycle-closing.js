/**
 * The Cycle — Closing Meditation
 *
 * A short guided meditation that closes Part 2 of the EFT relationship module.
 * Takes the cognitive understanding of the mapped cycle and makes it felt.
 * Generates compassion for both sides and plants the seed of a different possibility.
 *
 * Two modes:
 * - Solo (~7 min): 17 prompts, scalable to ~10 min
 * - Couple (~8 min): 18 prompts, scalable to ~12 min
 *
 * 21 total unique prompts: 15 shared + 3 couple-only + 2 solo-only
 *
 * Audio: /audio/meditations/the-cycle-closing/{promptId}.mp3
 * Fixed duration per mode
 */

// ============================================
// ALL PROMPTS (21 total)
// ============================================

const allPrompts = [
  // === PHASE 1: RE-SETTLING ===
  {
    id: 'settle-01',
    text: 'Let your eyes close again. Or let your gaze go soft. You have been thinking. Now, for a few minutes, come back to feeling.',
    baseSilenceAfter: 6,
    silenceExpandable: true,
    silenceMax: 10,
  },
  {
    id: 'settle-02',
    text: 'Take a breath. Let your shoulders drop. Feel where your body meets the surface beneath you.',
    baseSilenceAfter: 8,
    silenceExpandable: true,
    silenceMax: 14,
  },
  {
    id: 'settle-03',
    text: 'You just built something. You mapped the pattern that lives between you and this person. You can see it now. Before we close, take a few minutes to let it settle from your mind into the rest of you.',
    baseSilenceAfter: 10,
    silenceExpandable: true,
    silenceMax: 16,
  },

  // === PHASE 2: SEEING THE CYCLE FROM ABOVE ===
  {
    id: 'seeing-01',
    text: 'Bring the cycle to mind. Not the diagram on the screen. The feeling of it. The loop you keep going through with this person.',
    baseSilenceAfter: 10,
    silenceExpandable: true,
    silenceMax: 18,
  },
  {
    id: 'seeing-02',
    text: 'See yourself in the pattern. Your move. The thing you do when the tension starts. That familiar pull to push forward or pull away. Feel it in your body, the urgency or the heaviness or the shutting down. But this time, see it from a little distance. Not from inside it. From just above.',
    baseSilenceAfter: 12,
    silenceExpandable: true,
    silenceMax: 22,
  },
  {
    id: 'seeing-03',
    text: 'Now see the other person. Their move. The thing they do. And underneath it, the feeling that drives it. Their version of the same fear. You mapped it a moment ago. Let yourself actually feel what it might be like to be on their side of this.',
    baseSilenceAfter: 15,
    silenceExpandable: true,
    silenceMax: 25,
  },
  {
    id: 'seeing-04',
    text: 'And now see the arrows connecting you. How your move triggers their feeling. How their move triggers yours. The way it feeds itself. Neither of you starting it on purpose. Both of you caught in something that moves faster than either of you can think.',
    baseSilenceAfter: 12,
    silenceExpandable: true,
    silenceMax: 20,
  },

  // === PHASE 3: THE SAME NEED ===
  {
    id: 'same-01',
    text: 'Here is what most people never see from inside the cycle. Underneath your move and underneath theirs, you are usually reaching for the same thing.',
    baseSilenceAfter: 10,
    silenceExpandable: true,
    silenceMax: 18,
  },
  {
    id: 'same-02',
    text: 'Connection. Safety. The feeling that you matter to this person. The feeling that they are not going to leave. The feeling that you are enough.',
    baseSilenceAfter: 12,
    silenceExpandable: true,
    silenceMax: 20,
  },
  {
    id: 'same-03',
    text: 'The cycle is not two people fighting each other. It is two people trying to get to the same place using moves that accidentally block each other from getting there.',
    baseSilenceAfter: 15,
    silenceExpandable: true,
    silenceMax: 28,
  },
  {
    id: 'same-04',
    text: 'Can you feel that? Not as an idea. As something in your body. The way something softens when you realize that neither of you is the enemy of the other. That you are both just trying to hold onto something that matters.',
    baseSilenceAfter: 18,
    silenceExpandable: true,
    silenceMax: 32,
  },

  // === PHASE 4: STEPPING OUTSIDE ===
  {
    id: 'outside-01',
    text: 'You cannot make a cycle disappear just by seeing it. It is wired in deep. It will come back. But now you have something you did not have before. You know what it looks like from above. And that means the next time you feel it starting, there is a moment, just a small one, where you might be able to catch it.',
    baseSilenceAfter: 12,
    silenceExpandable: true,
    silenceMax: 20,
  },
  {
    id: 'outside-02',
    text: 'Not to stop the feeling. Not to stop their feeling. Just to pause. To notice: this is the cycle. We are in it again. That one moment of recognition is worth more than winning any argument.',
    baseSilenceAfter: 15,
    silenceExpandable: true,
    silenceMax: 25,
  },
  // Couple only
  {
    id: 'outside-03-couple',
    text: 'Turn toward your partner now. You have both just seen the same pattern from above. You know your side. And you have tried to see theirs. That is not a small thing.',
    baseSilenceAfter: 10,
    silenceExpandable: true,
    silenceMax: 16,
    variationOnly: 'couple',
  },
  {
    id: 'outside-04-couple',
    text: 'If there is one thing you want to say to them right now, knowing what you both know about this pattern, you can say it. Not a promise to be different. Not an apology. Just what is true for you right now, having seen the whole cycle. One sentence. Take your time.',
    baseSilenceAfter: 35,
    silenceExpandable: true,
    silenceMax: 60,
    variationOnly: 'couple',
  },
  {
    id: 'outside-05-couple',
    text: 'Now switch. The other person shares. The listener just receives.',
    baseSilenceAfter: 35,
    silenceExpandable: true,
    silenceMax: 60,
    variationOnly: 'couple',
  },
  // Solo only
  {
    id: 'outside-03-solo',
    text: 'Imagine for a moment that the next time the cycle starts, you catch it. You feel your familiar move beginning, and instead of following it all the way through, you pause. You take a breath. And you say the thing underneath the thing. Not the complaint. Not the withdrawal. The real one.',
    baseSilenceAfter: 15,
    silenceExpandable: true,
    silenceMax: 28,
    variationOnly: 'solo',
  },
  {
    id: 'outside-04-solo',
    text: 'What would you say? What would it sound like to step outside the cycle for one moment and just tell this person what is actually happening for you?',
    baseSilenceAfter: 20,
    silenceExpandable: true,
    silenceMax: 35,
    variationOnly: 'solo',
  },

  // === PHASE 5: CLOSING ===
  {
    id: 'close-01',
    text: 'Take a breath. Let everything you have held in this session begin to settle. You do not need to carry it all consciously. It will keep working on its own.',
    baseSilenceAfter: 10,
    silenceExpandable: true,
    silenceMax: 16,
  },
  {
    id: 'close-02',
    text: 'Something is different now. You have seen the pattern. You have felt both sides of it. And you have held it with something other than blame. That changes the pattern, even if just a little. Even if just for now.',
    baseSilenceAfter: 12,
    silenceExpandable: true,
    silenceMax: 20,
  },
  {
    id: 'close-03',
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

// ============================================
// EXPORTED MEDITATION OBJECT
// ============================================

export const theCycleClosingMeditation = {
  id: 'the-cycle-closing',
  title: 'The Cycle — Closing',
  subtitle: 'Relationship meditation',
  description: 'A short guided meditation to hold the cycle you mapped with compassion and plant the seed of something different.',

  audio: {
    basePath: '/audio/meditations/the-cycle-closing/',
    format: 'mp3',
  },

  // Fixed duration per mode
  isFixedDuration: true,

  defaultVariation: 'solo',

  // Display durations are derived at runtime via estimateMeditationDurationSeconds
  // (voice-aware) — see TheCycleModule.
  variations: {
    solo: {
      key: 'solo',
      label: 'Solo',
      description: 'Closing meditation for solo mode.',
    },
    couple: {
      key: 'couple',
      label: 'With a Partner',
      description: 'Closing meditation with shared moments.',
    },
  },

  prompts: allPrompts,
  assembleVariation,
};

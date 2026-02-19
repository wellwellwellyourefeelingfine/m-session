/**
 * Simple Grounding Meditation
 *
 * A brief grounding practice with:
 * - 15 pre-recorded TTS audio prompts (consolidated for tonal consistency)
 * - Fixed duration (~5 minutes 15 seconds)
 * - No silence expansion (fixed pauses throughout)
 * - Audio-text sync via shared useMeditationPlayback hook
 *
 * Purpose: Settle anxiety, establish body awareness, and create a foundation
 * of safety as effects begin. Ideal for the come-up phase.
 *
 * Tone: Simple and steady, grounding without being heavy, reassuring
 * without over-promising, present-focused.
 *
 * TTS notes: Each clip contains 2-3 full sentences to give the model enough
 * context for consistent calm delivery. Commas and ellipses are used heavily
 * to enforce slow pacing and natural pauses.
 *
 * Duration breakdown:
 *   Part 1: Settling                ~1:00
 *   Part 2: Grounding Through Contact ~1:30
 *   Part 3: Grounding Through Senses ~1:15
 *   Part 4: Breath                  ~1:00
 *   Part 5: Closing                 ~0:45
 */

export const simpleGroundingMeditation = {
  id: 'simple-grounding',
  title: 'Simple Grounding',
  subtitle: 'Body & breath anchoring',
  description: 'A brief guided audio meditation to feel present and connected to your body. Have your headphones or speakers ready before you begin.',

  // Audio configuration
  audio: {
    basePath: '/audio/meditations/simple-grounding/',
    format: 'mp3',
  },

  // Speaking rate for duration estimation (words per minute)
  // Slow, even pace per script direction
  speakingRate: 95,

  // Fixed duration — no DurationPicker
  isFixedDuration: true,
  fixedDuration: 315, // ~5:15 in seconds

  prompts: [
    // ============================================
    // PART 1: SETTLING (~1:00)
    // ============================================
    {
      id: 'settle-01',
      text: "Allow yourself to settle in, gently. There's nowhere else to be right now... nothing to figure out.",
      baseSilenceAfter: 5,
    },
    {
      id: 'settle-02',
      text: "You've arrived here, and that's enough. Let your eyes close, or let them rest softly downward.",
      baseSilenceAfter: 5,
    },
    {
      id: 'settle-03',
      text: "Your body already knows how to do this. Nothing needs to happen... for now, simply be here.",
      baseSilenceAfter: 6,
    },

    // ============================================
    // PART 2: GROUNDING THROUGH CONTACT (~1:30)
    // ============================================
    {
      id: 'contact-01',
      text: "Notice where your body meets the surface beneath you. There's weight there... there's contact... there's support.",
      baseSilenceAfter: 6,
    },
    {
      id: 'contact-02',
      text: "The ground is holding you, and there's no need to hold yourself up. Feel your feet, or the backs of your legs... solid, and present.",
      baseSilenceAfter: 6,
    },
    {
      id: 'contact-03',
      text: "Feel your hands, and notice where they're resting. These points of contact are anchors... keeping you here, in this moment, in this body.",
      baseSilenceAfter: 6,
    },
    {
      id: 'contact-04',
      text: "You're not floating. You're grounded... you're held.",
      baseSilenceAfter: 6,
    },

    // ============================================
    // PART 3: GROUNDING THROUGH SENSES (~1:15)
    // ============================================
    {
      id: 'senses-01',
      text: "Now, gently, come into your senses. Notice the temperature of the air on your skin... cool, or warm... it doesn't matter which.",
      baseSilenceAfter: 5,
    },
    {
      id: 'senses-02',
      text: "Notice any sounds around you, near or far. Let them be there, without needing to follow them.",
      baseSilenceAfter: 6,
    },
    {
      id: 'senses-03',
      text: "Notice the weight of your own body... the heaviness of your limbs, at rest. These sensations are anchors too. They're reminders that you're here, that this is real... that you're safe.",
      baseSilenceAfter: 6,
    },

    // ============================================
    // PART 4: BREATH (~1:00)
    // ============================================
    {
      id: 'breath-01',
      text: "Now, notice your breathing. There's no need to change it... it's already happening, and it's been happening this whole time.",
      baseSilenceAfter: 5,
    },
    {
      id: 'breath-02',
      text: "Feel the air coming in... feel it going out. That rhythm is steady... it's yours, and it's here.",
      baseSilenceAfter: 6,
    },
    {
      id: 'breath-03',
      text: "Each breath is a small return to the present moment. Each exhale... a small release. There's nothing to control, nothing to perfect. The breath is already taking care of itself.",
      baseSilenceAfter: 6,
    },

    // ============================================
    // PART 5: CLOSING (~0:45)
    // ============================================
    {
      id: 'close-01',
      text: "You're grounded now... you're here. Whatever comes next, you can meet it from this place. Your body is with you, your breath is with you... and the ground is beneath you.",
      baseSilenceAfter: 5,
    },
    {
      id: 'close-02',
      text: "That's enough... that's always enough. Take one more breath here... and when you're ready, let your eyes open, slowly... gently. You're here, you're grounded... you're okay.",
      baseSilenceAfter: 0,
    },
  ],
};

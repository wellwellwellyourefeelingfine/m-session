/**
 * Simple Grounding Meditation
 *
 * A grounding practice with:
 * - 31 pre-recorded TTS audio prompts
 * - Fixed duration (~9 minutes)
 * - No silence expansion (fixed pauses throughout)
 * - Audio-text sync via shared useMeditationPlayback hook
 *
 * Purpose: Settle anticipatory energy, establish body awareness, and create
 * a foundation of safety and presence as effects begin. Ideal for the
 * come-up phase when the user has just taken their substance and is waiting.
 *
 * Tone: Simple and steady, grounding without being heavy, reassuring
 * without over-promising, present-focused. Warm but not sentimental.
 *
 * Voice: Theo Silk (UmQN7jS1Ee8B1czsUtQh) via eleven_multilingual_v2
 *   stability: 0.65, similarity_boost: 0.70, style: 0.0
 *   use_speaker_boost: true, speed: 0.87
 *
 * TTS notes: Each clip contains 2-3 full sentences to give the model enough
 * context for consistent calm delivery. Commas and ellipses are used heavily
 * to enforce slow pacing and natural pauses.
 *
 * Duration breakdown:
 *   Part 1: Settling          (clips 1-7)   ~1:50
 *   Part 2: Body & Contact    (clips 8-14)  ~1:50
 *   Part 3: Sensory Presence  (clips 15-21) ~1:35
 *   Part 4: Breath            (clips 22-27) ~1:30
 *   Part 5: Closing           (clips 28-31) ~1:15
 */

export const simpleGroundingMeditation = {
  id: 'simple-grounding',
  title: 'Session Grounding',
  subtitle: 'Body & breath anchoring',
  description: 'A guided audio meditation to feel present and connected to your body. Have your headphones or speakers ready before you begin.',

  // Audio configuration
  audio: {
    basePath: '/audio/meditations/simple-grounding/',
    format: 'mp3',
    defaultVoice: 'theo',
    voices: [
      { id: 'theo',   label: 'Thoughtful Theo', subfolder: '' },
      { id: 'rachel', label: 'Relaxing Rachel', subfolder: 'relaxing-rachel/' },
    ],
  },

  // Fixed duration
  isFixedDuration: true,
  fixedDuration: 561, // ~9:21 in seconds (from actual MP3 durations + actual silence file durations)

  prompts: [
    // ============================================
    // PART 1: SETTLING (clips 1–7, ~1:50)
    // ============================================
    {
      id: 'settle-01',
      text: "Go ahead and let yourself settle in. There's nowhere else to be right now, and nothing you need to figure out.",
      baseSilenceAfter: 5,
    },
    {
      id: 'settle-02',
      text: "If it feels right, let your eyes close. Or if you'd rather, let your gaze soften and rest somewhere in front of you.",
      baseSilenceAfter: 5,
    },
    {
      id: 'settle-03',
      text: "You've already done what you needed to do. You showed up, you prepared your space, and now the only thing left... is to simply be here.",
      baseSilenceAfter: 5,
    },
    {
      id: 'settle-04',
      text: "Your body already knows how to rest. You don't need to manage anything or make anything happen right now.",
      baseSilenceAfter: 5,
    },
    {
      id: 'settle-05',
      text: "If there's any anticipation or restlessness, that's fine. Let it be there without needing to push it away. It can sit alongside you, like a sound in the room.",
      baseSilenceAfter: 5,
    },
    {
      id: 'settle-06',
      text: "Right now, the practice is simple. Just be where you are. Feel what you feel. Let everything else wait.",
      baseSilenceAfter: 5,
    },
    {
      id: 'settle-07',
      text: "This is a time to arrive. Not to do, not to achieve... just to land in your own body and discover what's already here.",
      baseSilenceAfter: 6,
    },

    // ============================================
    // PART 2: BODY & CONTACT (clips 8–14, ~1:50)
    // ============================================
    {
      id: 'contact-01',
      text: "Now, gently, bring your attention to the surface beneath you. Where your body is making contact, there's weight there... pressure... support.",
      baseSilenceAfter: 5,
    },
    {
      id: 'contact-02',
      text: "Whatever you're sitting or lying on, it's holding you fully. You don't need to hold yourself up. Let that effort go.",
      baseSilenceAfter: 5,
    },
    {
      id: 'contact-03',
      text: "Sense the backs of your legs, or the soles of your feet, wherever they're touching something solid. Feel how steady that contact is.",
      baseSilenceAfter: 5,
    },
    {
      id: 'contact-04',
      text: "Now bring your attention to your hands. Where are they resting? Feel the warmth of them, the weight, the texture of whatever they're touching.",
      baseSilenceAfter: 5,
    },
    {
      id: 'contact-05',
      text: "Each of these points of contact is an anchor. They connect you to something real and solid... this surface, this room, this moment.",
      baseSilenceAfter: 5,
    },
    {
      id: 'contact-06',
      text: "You're not floating. You're held. The ground is beneath you, and it's not going anywhere.",
      baseSilenceAfter: 5,
    },
    {
      id: 'contact-07',
      text: "Let yourself feel that. Not as an idea, but as a physical sensation... the simple, steady fact of being supported.",
      baseSilenceAfter: 6,
    },

    // ============================================
    // PART 3: SENSORY PRESENCE (clips 15–21, ~1:35)
    // ============================================
    {
      id: 'senses-01',
      text: "Now let your awareness open a little wider. Feel the temperature of the air on your skin... cool, or warm. There's no right answer, just what's here.",
      baseSilenceAfter: 5,
    },
    {
      id: 'senses-02',
      text: "Sense the weight of your clothing against your body. The places where fabric touches skin. These small, real sensations keep you in the present.",
      baseSilenceAfter: 5,
    },
    {
      id: 'senses-03',
      text: "Become aware of any sounds around you, near or far. Let them come and go without needing to follow them or push them away.",
      baseSilenceAfter: 5,
    },
    {
      id: 'senses-04',
      text: "You might notice the quality of light through your eyelids, or the feeling of stillness in the room. Whatever's there, just receive it.",
      baseSilenceAfter: 5,
    },
    {
      id: 'senses-05',
      text: "If there's a scent in the air, let yourself take that in too. Or the taste in your mouth. These senses are quiet anchors, always available to you.",
      baseSilenceAfter: 5,
    },
    {
      id: 'senses-06',
      text: "Feel the weight of your own body. The heaviness of your limbs at rest. The gentle pull of gravity, holding you to the earth.",
      baseSilenceAfter: 5,
    },
    {
      id: 'senses-07',
      text: "All of these sensations are reminders. Reminders that you're here, that this is real, and that you are safe in this moment.",
      baseSilenceAfter: 6,
    },

    // ============================================
    // PART 4: BREATH (clips 22–27, ~1:30)
    // ============================================
    {
      id: 'breath-01',
      text: "Now, without changing anything, turn your attention to your breathing. It's already happening. It's been happening this whole time, without you needing to manage it.",
      baseSilenceAfter: 5,
    },
    {
      id: 'breath-02',
      text: "Feel the air as it comes in through your nose or your mouth. Cool on the inhale, warm on the way out. Simple and steady.",
      baseSilenceAfter: 6,
    },
    {
      id: 'breath-03',
      text: "Feel the gentle release of each exhale. Your body letting go, automatically, without any effort from you.",
      baseSilenceAfter: 6,
    },
    {
      id: 'breath-04',
      text: "Sense the rhythm of it. In... and out. Each breath following the last, like waves arriving at shore. This rhythm has been with you your entire life.",
      baseSilenceAfter: 6,
    },
    {
      id: 'breath-05',
      text: "Each inhale is a small arrival. Each exhale, a small release. There's nothing to perfect here. Nothing to control.",
      baseSilenceAfter: 5,
    },
    {
      id: 'breath-06',
      text: "The breath is taking care of itself, and it will keep taking care of itself. You can simply rest inside that rhythm.",
      baseSilenceAfter: 6,
    },

    // ============================================
    // PART 5: CLOSING (clips 28–31, ~1:15)
    // ============================================
    {
      id: 'close-01',
      text: "You're grounded now. Not because you achieved something, but because you noticed what was already here... your body, your senses, your breath.",
      baseSilenceAfter: 5,
    },
    {
      id: 'close-02',
      text: "This place of presence is always available to you. Not just right now, but anytime you need it. A few breaths, a few points of contact... and you're here.",
      baseSilenceAfter: 5,
    },
    {
      id: 'close-03',
      text: "Whatever comes next, you can meet it from this steady place. Your body is with you. Your breath is with you. And the ground is beneath you.",
      baseSilenceAfter: 5,
    },
    {
      id: 'close-04',
      text: "Take one more full breath here. Let it fill you... and let it go. And when you're ready, let your eyes open, slowly... gently. You're here. You're grounded. You're okay.",
      baseSilenceAfter: 0,
    },
  ],
};

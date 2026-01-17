/**
 * Breath Awareness Meditation
 * A simple meditation focusing on the breath as an anchor to the present moment.
 * Inspired by Sam Harris' Waking Up style - direct, non-religious, present-focused.
 */

export const breathAwarenessMeditation = {
  meditationId: 'breath-awareness-default',
  title: 'Breath Awareness',
  description: 'A simple meditation focusing on the breath as an anchor to the present moment.',
  baseDuration: 600, // 10 minutes in seconds (base timing)
  minDuration: 600,  // 10 minutes
  maxDuration: 1800, // 30 minutes
  durationSteps: [10, 15, 20, 25, 30], // Available durations in minutes
  prompts: [
    // === INTRODUCTION ===
    {
      id: 'intro-01',
      text: 'Find a comfortable position. You can sit or lie down — whatever feels right.',
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },
    {
      id: 'intro-02',
      text: 'Let your eyes close. Or if you prefer, rest your gaze softly on a point in front of you.',
      baseSilenceAfter: 6,
      silenceExpandable: false,
    },

    // === SETTLING IN ===
    {
      id: 'settle-01',
      text: 'Take a moment to arrive. You don\'t need to do anything yet. Just allow yourself to be here.',
      baseSilenceAfter: 10,
      silenceExpandable: true,
      silenceMax: 30,
    },
    {
      id: 'settle-02',
      text: 'Notice how your body feels. The weight of it. The places where it makes contact with the surface beneath you.',
      baseSilenceAfter: 12,
      silenceExpandable: true,
      silenceMax: 30,
    },
    {
      id: 'settle-03',
      text: 'You might notice areas of tension. If you do, there\'s nothing you need to fix. Simply notice.',
      baseSilenceAfter: 10,
      silenceExpandable: true,
      silenceMax: 25,
    },

    // === BREATH INTRODUCTION ===
    {
      id: 'breath-intro-01',
      text: 'Now, bring your attention to the breath.',
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },
    {
      id: 'breath-intro-02',
      text: 'You don\'t need to control it or breathe in any special way. Just notice the breathing that\'s already happening.',
      baseSilenceAfter: 8,
      silenceExpandable: false,
    },

    // === LOCATING THE BREATH ===
    {
      id: 'breath-locate-01',
      text: 'Find where the breath is most vivid for you. It might be the nostrils — the subtle coolness of air entering, the warmth as it leaves.',
      baseSilenceAfter: 8,
      silenceExpandable: false,
    },
    {
      id: 'breath-locate-02',
      text: 'Or it might be the chest. The gentle rise and fall.',
      baseSilenceAfter: 6,
      silenceExpandable: false,
    },
    {
      id: 'breath-locate-03',
      text: 'Or the belly. Expanding on the inhale, softening on the exhale.',
      baseSilenceAfter: 6,
      silenceExpandable: false,
    },
    {
      id: 'breath-locate-04',
      text: 'Wherever you feel it most clearly — rest your attention there.',
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 45,
    },

    // === MAIN PRACTICE ===
    {
      id: 'breath-main-01',
      text: 'Let the breath be the anchor for your attention. Each inhale. Each exhale. Just this.',
      baseSilenceAfter: 20,
      silenceExpandable: true,
      silenceMax: 60,
    },

    // === WORKING WITH DISTRACTION ===
    {
      id: 'distraction-01',
      text: 'At some point, you\'ll notice that your mind has wandered. This is completely natural. It\'s what minds do.',
      baseSilenceAfter: 6,
      silenceExpandable: false,
    },
    {
      id: 'distraction-02',
      text: 'The moment you notice you\'ve been thinking — that\'s the moment of waking up. That noticing is the practice.',
      baseSilenceAfter: 8,
      silenceExpandable: false,
    },
    {
      id: 'distraction-03',
      text: 'When this happens, simply return to the breath. No judgment. No frustration. Just a gentle return.',
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 45,
    },

    // === DEEPENING ===
    {
      id: 'breath-main-02',
      text: 'Continue resting your attention on the breath. Each breath is complete in itself. Nothing to achieve. Nowhere to get to.',
      baseSilenceAfter: 30,
      silenceExpandable: true,
      silenceMax: 90,
    },
    {
      id: 'breath-main-03',
      text: 'If it helps, you can silently note "in" as you inhale, "out" as you exhale. Or simply feel the breath without labeling.',
      baseSilenceAfter: 25,
      silenceExpandable: true,
      silenceMax: 75,
    },
    {
      id: 'deepening-01',
      text: 'Notice that you don\'t have to make the breath happen. It breathes itself. You\'re simply witnessing.',
      baseSilenceAfter: 20,
      silenceExpandable: true,
      silenceMax: 60,
    },
    {
      id: 'deepening-02',
      text: 'And notice, too, the one who is aware of the breath. There\'s breathing, and there\'s the knowing of breathing.',
      baseSilenceAfter: 25,
      silenceExpandable: true,
      silenceMax: 75,
    },

    // === EXTENDED SILENCE (Primary expansion blocks) ===
    {
      id: 'long-silence-01',
      text: 'For the next while, I\'ll be quiet. Just stay with the breath. Each time you wander, return.',
      baseSilenceAfter: 60,
      silenceExpandable: true,
      silenceMax: 180,
    },
    {
      id: 'midpoint-01',
      text: 'Gently check in. Where is your attention right now? If it\'s wandered, that\'s fine. Just come back to the breath.',
      baseSilenceAfter: 30,
      silenceExpandable: true,
      silenceMax: 90,
    },
    {
      id: 'long-silence-02',
      text: 'Continue. Breath by breath.',
      baseSilenceAfter: 60,
      silenceExpandable: true,
      silenceMax: 180,
    },

    // === EXPANDING AWARENESS ===
    {
      id: 'awareness-01',
      text: 'Now, while still aware of the breath, allow your attention to expand slightly. Include the body as a whole. The whole field of sensation.',
      baseSilenceAfter: 15,
      silenceExpandable: true,
      silenceMax: 45,
    },
    {
      id: 'awareness-02',
      text: 'Sound, if there is any. The space around you. The breath continuing within that larger awareness.',
      baseSilenceAfter: 20,
      silenceExpandable: true,
      silenceMax: 60,
    },

    // === CLOSING ===
    {
      id: 'closing-01',
      text: 'In a moment, this meditation will come to an end. But the awareness that\'s here right now doesn\'t have to go anywhere.',
      baseSilenceAfter: 10,
      silenceExpandable: false,
    },
    {
      id: 'closing-02',
      text: 'This quality of attention — of being present to your experience — is always available. The breath is always here as an anchor.',
      baseSilenceAfter: 10,
      silenceExpandable: false,
    },
    {
      id: 'closing-03',
      text: 'Whenever you\'re ready, let your eyes open. Take a moment before moving on.',
      baseSilenceAfter: 8,
      silenceExpandable: false,
    },
    {
      id: 'closing-04',
      text: 'Well done.',
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },
  ],
};

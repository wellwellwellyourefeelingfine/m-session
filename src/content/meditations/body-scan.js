/**
 * Body Scan Meditation
 *
 * A progressive body scan meditation featuring:
 * - 54 pre-recorded TTS audio prompts
 * - Variable duration (10 or 15 minutes) via expandable silence
 * - Expansion concentrated in later body regions (pelvis onward)
 * - Audio-text sync pattern (same as Open Awareness)
 *
 * Purpose: Systematically bring awareness through each region of the body,
 * cultivating embodied presence and somatic sensitivity.
 *
 * Posture: Lying down is ideal, sitting is fine too. Eyes closed.
 *
 * Duration breakdown (base ~8:37):
 *   Part 1: Settling         ~1:04
 *   Part 2: Grounding        ~1:01
 *   Part 3: Progressive Scan ~4:24
 *   Part 4: Whole Body       ~1:18
 *   Part 5: Closing          ~0:50
 */

export const bodyScanMeditation = {
  id: 'body-scan',
  title: 'Body Scan',
  subtitle: 'Somatic awareness',
  description: 'A guided audio scan through your entire body. Notice what is present without needing to change anything. Have your headphones or speakers ready.',
  baseDuration: 517,   // ~8:37 in seconds
  minDuration: 600,    // 10 min
  maxDuration: 900,    // 15 min
  durationSteps: [10, 15],

  // Audio configuration
  audio: {
    basePath: '/audio/meditations/body-scan/',
    format: 'mp3',
  },

  // Speaking rate for duration estimation (words per minute)
  speakingRate: 150,

  prompts: [
    // ============================================
    // PART 1: SETTLING (clips 1-7, ~1:04)
    // All fixed — no expansion needed in settling
    // ============================================
    {
      id: 'settling-01',
      text: 'Let yourself settle into a comfortable position.',
      baseSilenceAfter: 3,
      silenceExpandable: false,
    },
    {
      id: 'settling-02',
      text: "Lying down is ideal if that's available to you. But sitting is fine too.",
      baseSilenceAfter: 4,
      silenceExpandable: false,
    },
    {
      id: 'settling-03',
      text: "Let your eyes close. Or soften your gaze downward if closing them doesn't feel right.",
      baseSilenceAfter: 3,
      silenceExpandable: false,
    },
    {
      id: 'settling-04',
      text: "There's nothing you need to do right now. Nowhere to be. Nothing to figure out.",
      baseSilenceAfter: 4,
      silenceExpandable: false,
    },
    {
      id: 'settling-05',
      text: 'Take a breath. Not a special breath... just a normal one. And as you exhale, let your body get a little heavier.',
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },
    {
      id: 'settling-06',
      text: 'Another breath. And again, as you breathe out — let yourself settle.',
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },
    {
      id: 'settling-07',
      text: "You don't need to relax... You don't need to feel any particular way... Just notice what's already here.",
      baseSilenceAfter: 6,
      silenceExpandable: false,
    },

    // ============================================
    // PART 2: GROUNDING CONTACT (clips 8-13, ~1:01)
    // All fixed — grounding sets the foundation
    // ============================================
    {
      id: 'grounding-01',
      text: 'Bring your attention to wherever your body meets the surface beneath you.',
      baseSilenceAfter: 4,
      silenceExpandable: false,
    },
    {
      id: 'grounding-02',
      text: "If you're lying down, notice your back against the bed or floor... The backs of your legs... Your heels... Your shoulders.",
      baseSilenceAfter: 2,
      silenceExpandable: false,
    },
    {
      id: 'grounding-03',
      text: "If you're sitting, notice where your weight rests — your seat, your feet on the ground.",
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },
    {
      id: 'grounding-04',
      text: "You don't need to change anything. Just notice the places where you're supported.",
      baseSilenceAfter: 6,
      silenceExpandable: false,
    },
    {
      id: 'grounding-05',
      text: "Feel the weight of your body, being held. You don't have to hold yourself up right now. The surface beneath you is doing that.",
      baseSilenceAfter: 6,
      silenceExpandable: false,
    },
    {
      id: 'grounding-06',
      text: 'Let that be enough for a moment.',
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },

    // ============================================
    // PART 3: PROGRESSIVE SCAN (clips 14-41, ~4:24)
    // Early regions (feet, lower legs, upper legs) = fixed
    // Later regions (pelvis onward) = expandable
    // ============================================

    // --- Feet (14-16) - Fixed ---
    {
      id: 'scan-feet-01',
      text: 'Now, gently bring your attention down to your feet.',
      baseSilenceAfter: 3,
      silenceExpandable: false,
    },
    {
      id: 'scan-feet-02',
      text: 'Notice whatever is there to notice... Temperature... Pressure... Tingling... Stillness... Whatever is present.',
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },
    {
      id: 'scan-feet-03',
      text: "You're not looking for anything in particular. Just sensing what's there.",
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },

    // --- Lower Legs (17-19) - Fixed ---
    {
      id: 'scan-lower-legs-01',
      text: 'Let your attention drift upward, to your lower legs... Your ankles... Your shins and calves.',
      baseSilenceAfter: 4,
      silenceExpandable: false,
    },
    {
      id: 'scan-lower-legs-02',
      text: "Notice any sensations... Or notice the absence of sensation... that's information too.",
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },
    {
      id: 'scan-lower-legs-03',
      text: "If you find your mind wandering, that's fine. Just gently return to the body when you notice.",
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },

    // --- Upper Legs (20-22) - Fixed ---
    {
      id: 'scan-upper-legs-01',
      text: 'Now, your upper legs... Your knees... Your thighs.',
      baseSilenceAfter: 4,
      silenceExpandable: false,
    },
    {
      id: 'scan-upper-legs-02',
      text: 'These larger muscles often hold tension without us realizing. See if you can feel what\'s there.',
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },
    {
      id: 'scan-upper-legs-03',
      text: 'Not trying to relax anything. Just noticing.',
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },

    // --- Pelvis (23-25) - EXPANDABLE ---
    {
      id: 'scan-pelvis-01',
      text: 'Bring your attention to your pelvis, your hips, your seat.',
      baseSilenceAfter: 4,
      silenceExpandable: true,
      silenceMax: 12,
    },
    {
      id: 'scan-pelvis-02',
      text: 'This is the base of your body. A lot can be held here.',
      baseSilenceAfter: 5,
      silenceExpandable: true,
      silenceMax: 14,
    },
    {
      id: 'scan-pelvis-03',
      text: 'Just notice what you notice... Heaviness... warmth... tension... nothing... all of it is fine.',
      baseSilenceAfter: 5,
      silenceExpandable: true,
      silenceMax: 15,
    },

    // --- Belly (26-28) - EXPANDABLE ---
    {
      id: 'scan-belly-01',
      text: 'Now your belly. The soft center of your body.',
      baseSilenceAfter: 4,
      silenceExpandable: true,
      silenceMax: 12,
    },
    {
      id: 'scan-belly-02',
      text: 'Notice the gentle movement of your breath here. The rise and fall.',
      baseSilenceAfter: 5,
      silenceExpandable: true,
      silenceMax: 15,
    },
    {
      id: 'scan-belly-03',
      text: "You might notice some holding, or tightness... You can acknowledge it without needing to fix it... Just let it be seen.",
      baseSilenceAfter: 6,
      silenceExpandable: true,
      silenceMax: 18,
    },

    // --- Chest (29-31) - EXPANDABLE ---
    {
      id: 'scan-chest-01',
      text: 'Your chest now. Your ribs. The area around your heart.',
      baseSilenceAfter: 4,
      silenceExpandable: true,
      silenceMax: 12,
    },
    {
      id: 'scan-chest-02',
      text: 'Notice the breath here too — the expansion and release.',
      baseSilenceAfter: 5,
      silenceExpandable: true,
      silenceMax: 15,
    },
    {
      id: 'scan-chest-03',
      text: "Emotions may live here... and that's okay. You don't need to do anything with them right now.",
      baseSilenceAfter: 6,
      silenceExpandable: true,
      silenceMax: 18,
    },

    // --- Hands/Arms (32-34) - Fixed ---
    {
      id: 'scan-arms-01',
      text: 'Let your attention move to your hands... Your fingers... your palms.',
      baseSilenceAfter: 4,
      silenceExpandable: false,
    },
    {
      id: 'scan-arms-02',
      text: 'Then your wrists... your forearms... your upper arms.',
      baseSilenceAfter: 4,
      silenceExpandable: false,
    },
    {
      id: 'scan-arms-03',
      text: 'Notice any sensation... Warmth... tingling... weight... lightness.',
      baseSilenceAfter: 5,
      silenceExpandable: false,
    },

    // --- Shoulders/Neck (35-37) - Mildly expandable ---
    {
      id: 'scan-shoulders-01',
      text: 'Now your shoulders. Another place where we often carry more than we realize.',
      baseSilenceAfter: 4,
      silenceExpandable: true,
      silenceMax: 10,
    },
    {
      id: 'scan-shoulders-02',
      text: 'And your neck — the bridge between body and mind.',
      baseSilenceAfter: 4,
      silenceExpandable: true,
      silenceMax: 10,
    },
    {
      id: 'scan-shoulders-03',
      text: "You might notice some tension here. That's common. Just acknowledge it.",
      baseSilenceAfter: 5,
      silenceExpandable: true,
      silenceMax: 12,
    },

    // --- Face/Head (38-41) - Mildly expandable ---
    {
      id: 'scan-face-01',
      text: 'Finally, your face... Your jaw... notice whether it\'s clenched at all, and let it soften, if it wants to.',
      baseSilenceAfter: 4,
      silenceExpandable: true,
      silenceMax: 10,
    },
    {
      id: 'scan-face-02',
      text: 'Your eyes, resting behind closed lids.',
      baseSilenceAfter: 3,
      silenceExpandable: true,
      silenceMax: 8,
    },
    {
      id: 'scan-face-03',
      text: 'Your forehead. The top of your head.',
      baseSilenceAfter: 4,
      silenceExpandable: true,
      silenceMax: 10,
    },
    {
      id: 'scan-face-04',
      text: 'Let your whole face be soft. No expression you need to hold.',
      baseSilenceAfter: 5,
      silenceExpandable: true,
      silenceMax: 12,
    },

    // ============================================
    // PART 4: WHOLE BODY (clips 42-48, ~1:18)
    // Expandable — primary expansion target for 15-min
    // ============================================
    {
      id: 'whole-body-01',
      text: 'Now, let your attention expand to include your whole body at once.',
      baseSilenceAfter: 4,
      silenceExpandable: true,
      silenceMax: 18,
    },
    {
      id: 'whole-body-02',
      text: 'Not scanning piece by piece — just sensing the whole.',
      baseSilenceAfter: 5,
      silenceExpandable: true,
      silenceMax: 20,
    },
    {
      id: 'whole-body-03',
      text: 'Your body... breathing. Your body... resting. Your body... here.',
      baseSilenceAfter: 6,
      silenceExpandable: true,
      silenceMax: 25,
    },
    {
      id: 'whole-body-04',
      text: 'Whatever sensations are present... familiar, or new... let them be.',
      baseSilenceAfter: 5,
      silenceExpandable: true,
      silenceMax: 20,
    },
    {
      id: 'whole-body-05',
      text: 'Your body knows how to do this. You can trust what\'s happening.',
      baseSilenceAfter: 6,
      silenceExpandable: true,
      silenceMax: 25,
    },
    {
      id: 'whole-body-06',
      text: "You might notice effects beginning to emerge now... Warmth... softness... subtle shifts. Or maybe nothing yet. Both are fine. There's no schedule you need to keep.",
      baseSilenceAfter: 6,
      silenceExpandable: true,
      silenceMax: 30,
    },
    {
      id: 'whole-body-07',
      text: 'Just stay with what\'s here.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 35,
    },

    // ============================================
    // PART 5: CLOSING (clips 49-54, ~0:50)
    // Mostly fixed — gentle transition back
    // ============================================
    {
      id: 'closing-01',
      text: 'In your own time, begin to let the practice come to a close.',
      baseSilenceAfter: 4,
      silenceExpandable: false,
    },
    {
      id: 'closing-02',
      text: "You don't need to do anything abruptly. Just let your awareness gently widen.",
      baseSilenceAfter: 4,
      silenceExpandable: false,
    },
    {
      id: 'closing-03',
      text: 'Notice the sounds around you, if there are any.',
      baseSilenceAfter: 4,
      silenceExpandable: false,
    },
    {
      id: 'closing-04',
      text: 'Notice the temperature of the air.',
      baseSilenceAfter: 4,
      silenceExpandable: false,
    },
    {
      id: 'closing-05',
      text: "And when you're ready... there's no rush... you can open your eyes, or simply rest here a while longer.",
      baseSilenceAfter: 5,
      silenceExpandable: true,
      silenceMax: 10,
    },
    {
      id: 'closing-06',
      text: "You've arrived in your body. That's all this was for.",
      baseSilenceAfter: 0,
      silenceExpandable: false,
    },
  ],
};

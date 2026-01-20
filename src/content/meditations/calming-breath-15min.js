/**
 * Calming Breath - 15 Minute Fixed Meditation
 *
 * A scientifically-structured breath meditation that guides users through
 * a progression from normal breathing to deep, elongated breathing and back.
 *
 * Total Duration: 15 minutes (900 seconds)
 *
 * Segment Structure:
 * - Segments 0, 9, 10: "idle" type (free breathing, no orb animation)
 * - Segments 1-8: "breath" type (guided patterns with orb animation)
 */

export const calmingBreath15Min = {
  id: 'calming-breath-15min',
  title: 'Calming Breath',
  description: 'A 15-minute guided breathing meditation that progressively deepens your breath, then gently returns to natural breathing.',
  duration: 900, // 15 minutes in seconds
  isFixedDuration: true,

  segments: [
    // Segment 0: Intro idle (15s)
    {
      type: 'idle',
      duration: 15,
      label: 'Settling In',
    },

    // Segment 1: 4-0-4-0 for 6 cycles (48s)
    {
      type: 'breath',
      pattern: { inhale: 4, hold: 0, exhale: 4, holdAfterExhale: 0 },
      cycles: 6,
      label: 'Gentle Start',
    },

    // Segment 2: 4-2-6-0 for 6 cycles (72s)
    {
      type: 'breath',
      pattern: { inhale: 4, hold: 2, exhale: 6, holdAfterExhale: 0 },
      cycles: 6,
      label: 'Adding Pause',
    },

    // Segment 3: 5-1-7-0 for 8 cycles (104s)
    {
      type: 'breath',
      pattern: { inhale: 5, hold: 1, exhale: 7, holdAfterExhale: 0 },
      cycles: 8,
      label: 'Deepening',
    },

    // Segment 4: 6-2-7-0 for 4 cycles (60s)
    {
      type: 'breath',
      pattern: { inhale: 6, hold: 2, exhale: 7, holdAfterExhale: 0 },
      cycles: 4,
      label: 'Full Breath',
    },

    // Segment 5: 6-0-8-0 for 12 cycles (168s)
    {
      type: 'breath',
      pattern: { inhale: 6, hold: 0, exhale: 8, holdAfterExhale: 0 },
      cycles: 12,
      label: 'Extended Exhale',
    },

    // Segment 6: 7-0-9-0 for 12 cycles (192s)
    {
      type: 'breath',
      pattern: { inhale: 7, hold: 0, exhale: 9, holdAfterExhale: 0 },
      cycles: 12,
      label: 'Deep Flow',
    },

    // Segment 7: 6-0-9-0 for 4 cycles (60s)
    {
      type: 'breath',
      pattern: { inhale: 6, hold: 0, exhale: 9, holdAfterExhale: 0 },
      cycles: 4,
      label: 'Easing Back',
    },

    // Segment 8: 5-0-7-0 for 2 cycles (24s)
    {
      type: 'breath',
      pattern: { inhale: 5, hold: 0, exhale: 7, holdAfterExhale: 0 },
      cycles: 2,
      label: 'Returning',
    },

    // Segment 9: Free breathing idle (150s - 2.5 minutes)
    {
      type: 'idle',
      duration: 150,
      label: 'Free Breathing',
    },

    // Segment 10: Closing idle (7s)
    {
      type: 'idle',
      duration: 7,
      label: 'Closing',
    },
  ],

  /**
   * Timed prompts throughout the meditation
   * Times are cumulative from start of meditation
   *
   * Each prompt displays for ~6-8 seconds before fading out.
   * Prompts are spaced to feel natural, like a meditation instructor.
   *
   * Segment timing reference:
   * - Segment 0 (Settling In):     0s - 15s    (15s idle)
   * - Segment 1 (4-4):            15s - 63s    (8s × 6 cycles = 48s)
   * - Segment 2 (4-2-6):          63s - 135s   (12s × 6 cycles = 72s)
   * - Segment 3 (5-1-7):         135s - 239s   (13s × 8 cycles = 104s)
   * - Segment 4 (6-2-7):         239s - 299s   (15s × 4 cycles = 60s)
   * - Segment 5 (6-8):           299s - 467s   (14s × 12 cycles = 168s)
   * - Segment 6 (7-9):           467s - 659s   (16s × 12 cycles = 192s)
   * - Segment 7 (6-9):           659s - 719s   (15s × 4 cycles = 60s)
   * - Segment 8 (5-7):           719s - 743s   (12s × 2 cycles = 24s)
   * - Segment 9 (Free Breathing): 743s - 893s  (150s idle)
   * - Segment 10 (Closing):       893s - 900s  (7s idle)
   */
  prompts: [
    // Segment 0: Settling In (0-15s)
    // Let user settle without immediate instruction
    { time: 1, text: 'Find a comfortable position.' },
    { time: 9, text: 'We\'ll begin with gentle, natural breaths.' },

    // Segment 1: 4-4 pattern (15-63s) - 6 cycles of 8s each
    // Cycle 1 starts at 15s, cycle 2 at 23s, cycle 3 at 31s, etc.
    { time: 17, text: 'Breathe in slowly... and out.' },
    { time: 33, text: 'Follow the orb with your breath.' },
    { time: 49, text: 'Let each exhale release a little tension.' },

    // Segment 2: 4-2-6 pattern (63-135s) - 6 cycles of 12s each
    // Cycle 1: 63-75s, cycle 2: 75-87s, cycle 3: 87-99s, etc.
    { time: 65, text: 'Now adding a brief pause after inhaling.' },
    { time: 89, text: 'Inhale... hold gently... release slowly.' },
    { time: 113, text: 'The exhale is longer now. Let it calm you.' },

    // Segment 3: 5-1-7 pattern (135-239s) - 8 cycles of 13s each
    // Cycle 1: 135-148s, cycle 2: 148-161s, etc.
    { time: 137, text: 'Deepening the breath.' },
    { time: 163, text: 'Longer inhales... longer exhales.' },
    { time: 202, text: 'Feel your body settling.' },

    // Segment 4: 6-2-7 pattern (239-299s) - 4 cycles of 15s each
    // Cycle 1: 239-254s, cycle 2: 254-269s, etc.
    { time: 241, text: 'Full, nourishing breaths.' },
    { time: 271, text: 'You\'re doing beautifully.' },

    // Segment 5: 6-8 pattern (299-467s) - 12 cycles of 14s each
    // This is a long, steady segment. Fewer prompts, more space.
    { time: 301, text: 'Releasing the hold. Just breathe and release.' },
    { time: 357, text: 'Let the extended exhale calm your nervous system.' },
    { time: 427, text: 'Stay with this rhythm.' },

    // Segment 6: 7-9 pattern (467-659s) - 12 cycles of 16s each
    // Deepest breathing. Spacious prompts.
    { time: 469, text: 'Now into our deepest breaths.' },
    { time: 533, text: 'Long, slow inhales. Even longer exhales.' },
    { time: 597, text: 'You are completely safe here.' },

    // Segment 7: 6-9 pattern (659-719s) - 4 cycles of 15s each
    // Beginning to return. Gentle transition.
    { time: 661, text: 'Beginning to ease back gently.' },
    { time: 691, text: 'Maintaining the calm.' },

    // Segment 8: 5-7 pattern (719-743s) - 2 cycles of 12s each
    // Short segment, one prompt is enough
    { time: 721, text: 'Returning toward natural breathing.' },

    // Segment 9: Free breathing (743-893s) - 150s idle
    // User breathes freely. Minimal guidance.
    { time: 746, text: 'Now breathe freely, however feels natural.' },
    { time: 806, text: 'No pattern to follow. Just be.' },
    { time: 866, text: 'When you\'re ready, slowly return your awareness.' },
  ],
};

/**
 * Helper function to calculate segment start times
 * Used for debugging and validation
 */
export function getSegmentStartTimes(meditation = calmingBreath15Min) {
  let currentTime = 0;
  return meditation.segments.map((segment, index) => {
    const startTime = currentTime;
    if (segment.type === 'idle') {
      currentTime += segment.duration;
    } else {
      const cycleDuration =
        segment.pattern.inhale +
        segment.pattern.hold +
        segment.pattern.exhale +
        segment.pattern.holdAfterExhale;
      currentTime += cycleDuration * segment.cycles;
    }
    return { index, label: segment.label, startTime, endTime: currentTime };
  });
}

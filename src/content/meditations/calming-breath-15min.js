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
      label: 'Intro',
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
    // Segment 0: Settling In (0-15s) - 3 prompts, evenly spaced
    { time: 1, text: 'Settle into a comfortable position.' },
    { time: 6, text: 'Soften your gaze on the orb.' },
    { time: 11, text: 'The orb will guide your breath. Follow along gently.' },

    // Segment 1: Gentle Start - 4-4 pattern (15-63s) - 3 prompts
    { time: 18, text: 'Breathe in as the orb expands... out as it contracts.' },
    { time: 34, text: 'No need to force anything. Just follow.' },
    { time: 50, text: 'With each exhale, let your shoulders drop.' },

    // Segment 2: Adding Pause - 4-2-6 pattern (63-135s) - 3 prompts
    { time: 60, text: 'Now we add a brief pause at the top of the breath.' },
    { time: 92, text: 'Inhale... pause... and a long, slow release.' },
    { time: 116, text: 'The exhale is where the calm lives.' },

    // Segment 3: Deepening - 5-1-7 pattern (135-239s) - 3 prompts
    { time: 140, text: 'Deepening now. Longer breaths.' },
    { time: 175, text: 'Feel your belly expand with each inhale.' },
    { time: 210, text: 'Your body knows how to do this.' },

    // Segment 4: Full Breath - 6-2-7 pattern (239-299s) - 2 prompts
    { time: 245, text: 'Full, nourishing breaths.' },
    { time: 275, text: 'You\'re settling into a steady rhythm.' },

    // Segment 5: Extended Exhale - 6-8 pattern (299-467s) - 3 prompts
    { time: 310, text: 'Releasing the pause. Just inhale and release.' },
    { time: 370, text: 'Long exhales calm your nervous system.' },
    { time: 430, text: 'Stay here. Let the breath breathe you.' },

    // Segment 6: Deep Flow - 7-9 pattern (467-659s) - 3 prompts
    { time: 480, text: 'Our deepest breaths now.' },
    { time: 550, text: 'Slow and spacious. Just being.' },
    { time: 620, text: 'With each breath, an opening of awareness. An opening of our internal rhythm.' },

    // Segment 7: Easing Back - 6-9 pattern (659-719s) - 2 prompts
    { time: 665, text: 'Gently easing back now.' },
    { time: 695, text: 'Carrying the calm with you.' },

    // Segment 8: Returning - 5-7 pattern (719-743s) - 1 prompt
    { time: 725, text: 'Returning toward your natural breath.' },

    // Segment 9: Free Breathing (743-893s) - 3 prompts
    { time: 750, text: 'Breathe freely now. No pattern to follow.' },
    { time: 810, text: 'Just be with whatever is here.' },
    { time: 860, text: 'When you\'re ready, begin to notice the room around you.' },

    // Segment 10: Closing (893-900s) - no prompts, end in silence
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

/**
 * Guided Breath Orb Meditation
 *
 * A breath meditation combining the visual orb animation with guided prompts.
 * Inspired by Sam Harris' Waking Up style - direct, non-religious, present-focused.
 *
 * Structure:
 * - Intro & settling (with box breathing 3-3-3-3)
 * - Breath awareness (with 4-4-4-4 box breathing)
 * - Deepening (transitioning to 4-0-6-0 - no holds)
 * - Extended practice (5-0-7-0 - longer exhale, no holds)
 * - Closing
 *
 * Holds are only used in the first ~5 minutes to establish rhythm,
 * then transition to natural breathing without holds for deeper relaxation.
 */

export const guidedBreathOrbMeditation = {
  meditationId: 'guided-breath-orb',
  title: 'Guided Breath Meditation',
  description: 'A breath meditation with visual guidance and spoken prompts to help you find calm and presence.',
  baseDuration: 600, // 10 minutes in seconds
  minDuration: 600,  // 10 minutes
  maxDuration: 1800, // 30 minutes
  durationSteps: [10, 15, 20, 25, 30], // Available durations in minutes

  /**
   * Segments combine breath patterns with guided prompts
   * Each segment has:
   * - breath: { pattern, cycles OR duration }
   * - prompts: array of { text, timing } where timing is 'start' | 'middle' | 'end' | number (seconds into segment)
   * - expandable: if true, this segment can be extended for longer durations
   */
  segments: [
    // === INTRODUCTION (0-1 min) ===
    {
      id: 'intro',
      breath: {
        pattern: { inhale: 3, hold: 3, exhale: 3, holdAfterExhale: 3 },
        cycles: 3,
      },
      prompts: [
        { text: 'Find a comfortable position.', timing: 'start' },
        { text: 'Let your eyes close.', timing: 12 },
        { text: 'Take a moment to arrive.', timing: 24 },
      ],
      expandable: false,
    },

    // === SETTLING (1-2 min) ===
    {
      id: 'settling',
      breath: {
        pattern: { inhale: 4, hold: 4, exhale: 4, holdAfterExhale: 4 },
        cycles: 3,
      },
      prompts: [
        { text: 'Notice how your body feels.', timing: 'start' },
        { text: 'The weight of it. The places where it makes contact.', timing: 16 },
        { text: 'If you notice tension, simply notice. Nothing to fix.', timing: 32 },
      ],
      expandable: false,
    },

    // === BREATH INTRODUCTION (2-3 min) ===
    {
      id: 'breath-intro',
      breath: {
        pattern: { inhale: 4, hold: 4, exhale: 4, holdAfterExhale: 4 },
        cycles: 4,
      },
      prompts: [
        { text: 'Now, bring your attention to the breath.', timing: 'start' },
        { text: "You don't need to control it. Just notice.", timing: 16 },
        { text: 'Find where the breath is most vivid for you.', timing: 32 },
        { text: 'The nostrils. The chest. The belly.', timing: 48 },
      ],
      expandable: false,
    },

    // === TRANSITION TO NO HOLDS (3-4 min) ===
    {
      id: 'transition',
      breath: {
        pattern: { inhale: 4, hold: 2, exhale: 5, holdAfterExhale: 0 },
        cycles: 4,
      },
      prompts: [
        { text: 'Let the breath become more natural now.', timing: 'start' },
        { text: 'Longer exhale. Releasing.', timing: 22 },
      ],
      expandable: false,
    },

    // === MAIN PRACTICE - NO HOLDS (4-6 min) ===
    {
      id: 'main-practice-1',
      breath: {
        pattern: { inhale: 4, hold: 0, exhale: 6, holdAfterExhale: 0 },
        cycles: 6,
      },
      prompts: [
        { text: 'Let the breath be your anchor.', timing: 'start' },
        { text: 'Each inhale. Each exhale. Just this.', timing: 20 },
        { text: "At some point, you'll notice your mind has wandered.", timing: 40 },
        { text: 'The moment you notice — that is the practice.', timing: 50 },
      ],
      expandable: true,
      expandCycles: 3, // Add 3 cycles per 5-minute extension
    },

    // === DEEPENING (6-8 min) ===
    {
      id: 'deepening',
      breath: {
        pattern: { inhale: 5, hold: 0, exhale: 7, holdAfterExhale: 0 },
        cycles: 5,
      },
      prompts: [
        { text: "You don't have to make the breath happen.", timing: 'start' },
        { text: 'It breathes itself. You are simply witnessing.', timing: 24 },
        { text: 'Notice the one who is aware of the breath.', timing: 48 },
      ],
      expandable: true,
      expandCycles: 4,
    },

    // === EXTENDED SILENCE (8-9 min) ===
    {
      id: 'silence',
      breath: {
        pattern: { inhale: 5, hold: 0, exhale: 7, holdAfterExhale: 0 },
        duration: 60, // 1 minute of silence
      },
      prompts: [
        { text: "I'll be quiet now. Stay with the breath.", timing: 'start' },
      ],
      expandable: true,
      expandDuration: 120, // Add 2 minutes per extension
    },

    // === CLOSING (9-10 min) ===
    {
      id: 'closing',
      breath: {
        pattern: { inhale: 4, hold: 0, exhale: 6, holdAfterExhale: 0 },
        cycles: 3,
      },
      prompts: [
        { text: 'In a moment, this meditation will end.', timing: 'start' },
        { text: 'But this awareness is always available.', timing: 15 },
        { text: 'The breath is always here as an anchor.', timing: 25 },
      ],
      expandable: false,
    },

    // === FINAL ===
    {
      id: 'final',
      breath: {
        pattern: { inhale: 4, hold: 0, exhale: 4, holdAfterExhale: 0 },
        cycles: 2,
      },
      prompts: [
        { text: 'When ready, let your eyes open.', timing: 'start' },
        { text: 'Well done.', timing: 12 },
      ],
      expandable: false,
    },
  ],
};

/**
 * Generate breath sequences for a given duration
 * @param {number} durationMinutes - Total duration in minutes (10, 15, 20, 25, 30)
 * @returns {Array} Array of breath sequences for useBreathController
 */
export function generateBreathSequences(durationMinutes = 10) {
  const baseDuration = 10;
  const extraMinutes = durationMinutes - baseDuration;
  const extensions = Math.floor(extraMinutes / 5); // Number of 5-minute extensions

  const sequences = [];
  const segments = guidedBreathOrbMeditation.segments;

  segments.forEach(segment => {
    let sequence;

    if (segment.breath.cycles) {
      let cycles = segment.breath.cycles;

      // Add extra cycles for expandable segments
      if (segment.expandable && segment.expandCycles && extensions > 0) {
        cycles += segment.expandCycles * extensions;
      }

      sequence = {
        type: 'cycles',
        count: cycles,
        pattern: segment.breath.pattern,
        segmentId: segment.id,
      };
    } else if (segment.breath.duration) {
      let duration = segment.breath.duration;

      // Add extra duration for expandable segments
      if (segment.expandable && segment.expandDuration && extensions > 0) {
        duration += segment.expandDuration * extensions;
      }

      sequence = {
        type: 'duration',
        seconds: duration,
        pattern: segment.breath.pattern,
        segmentId: segment.id,
      };
    }

    if (sequence) {
      sequences.push(sequence);
    }
  });

  return sequences;
}

/**
 * Generate timed prompts for a given duration
 * @param {number} durationMinutes - Total duration in minutes
 * @returns {Array} Array of { text, timeSeconds } for displaying prompts
 */
export function generateTimedPrompts(durationMinutes = 10) {
  const sequences = generateBreathSequences(durationMinutes);
  const prompts = [];
  let currentTime = 0;

  const segments = guidedBreathOrbMeditation.segments;

  sequences.forEach((sequence, index) => {
    const segment = segments.find(s => s.id === sequence.segmentId);
    if (!segment) return;

    // Calculate segment duration
    let segmentDuration;
    if (sequence.type === 'cycles') {
      const cycleDuration =
        (sequence.pattern.inhale || 0) +
        (sequence.pattern.hold || 0) +
        (sequence.pattern.exhale || 0) +
        (sequence.pattern.holdAfterExhale || 0);
      segmentDuration = cycleDuration * sequence.count;
    } else {
      segmentDuration = sequence.seconds;
    }

    // Add prompts with calculated times
    segment.prompts.forEach(prompt => {
      let promptTime;

      if (prompt.timing === 'start') {
        promptTime = currentTime;
      } else if (prompt.timing === 'middle') {
        promptTime = currentTime + segmentDuration / 2;
      } else if (prompt.timing === 'end') {
        promptTime = currentTime + segmentDuration - 3;
      } else if (typeof prompt.timing === 'number') {
        promptTime = currentTime + prompt.timing;
      }

      prompts.push({
        text: prompt.text,
        timeSeconds: promptTime,
        segmentId: segment.id,
      });
    });

    currentTime += segmentDuration;
  });

  return prompts;
}

export default guidedBreathOrbMeditation;

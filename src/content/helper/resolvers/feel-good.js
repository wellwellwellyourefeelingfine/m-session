/**
 * Resolver — I Feel So Good
 *
 * triageState shape:
 *   {
 *     energy: number,              // 0–10 from rating step
 *     energyFeeling?: string,      // 'enjoying' | 'too-much' (only when energy 7–8)
 *   }
 *
 * Note: per user decision, the "too-much" branch does NOT redirect to the
 * Intense Feeling category. It's handled here with phase-aware copy that
 * frames the surge as a normal early effect during come-up, and as something
 * to channel physically once past the come-up window.
 *
 * Activity-curation rationale (developer notes):
 *   - Values Compass removed from EVERY peak branch — it was overused
 *     across the Feel Good tree and wasn't earning its slot.
 *   - Let's Dance added to low energy peak/late-session and to moderate
 *     late-session: even quiet contentment deserves a movement option.
 *     Music removed from moderate late-session (it was the default and
 *     too passive when there's still energy to channel).
 *   - Letter writing tools (Letter Writing, Inner Child Letter, Gratitude
 *     Reflection, Dialogue with a Feeling) added to the low-energy
 *     branches in peak and late-session. Soft contentment is the ideal
 *     window for reflective writing — the user has presence but not so
 *     much activation that they need to move.
 *   - High-energy + enjoying late-session also gets Letter Writing for
 *     the same reason.
 *   - High-energy + too-much branches are unchanged; they need
 *     stabilization tools, not journaling.
 */

import { ACT, formatTimeContext } from '../resolverUtils';

// Low energy (1–3) — passive enjoyment
const LOW_BY_PHASE = {
  'come-up': {
    message:
      "The warmth is starting. The next hour will likely bring more of this. Enjoy the gentleness of where you are.",
    activities: [ACT.music, ACT.openAwareness],
  },
  peak: {
    message:
      "A soft, steady warmth. Good place to be. If you want to put this feeling to use, the options below can help. Or you can just stay here.",
    // Values Compass removed. Let's Dance added (low-energy peak still
    // benefits from a movement option). Letter Writing added (soft
    // contentment is a good window for reflective writing).
    activities: [ACT.music, ACT.openAwareness, ACT.letsDance, ACT.letterWriting],
  },
  'late-session': {
    message: "This quiet contentment is a good way to close. Soak it in.",
    // Letter writing tools added: late-session contentment is the ideal
    // moment for reflective journaling. Let's Dance is intentionally NOT
    // included here because at low energy in late session the user is in a
    // closing/winding-down mode where movement-discharge would be jarring.
    activities: [
      ACT.music,
      ACT.openAwareness,
      ACT.letterWriting,
      ACT.gratitudeReflection,
      ACT.feelingDialogue,
    ],
  },
  default: {
    message: "You're in a good place. Enjoy it.",
    activities: [ACT.music, ACT.openAwareness],
  },
};

// Moderate energy (4–6) — workable, can ride or channel
const MODERATE_BY_PHASE = {
  'come-up': {
    message:
      "This energy is your body meeting the medicine. It often deepens into something richer over the next 30 minutes. For now, you can ride it or channel it.",
    activityIntro: 'Put it to use or let it ride.',
    activities: [ACT.music, ACT.shaking, ACT.letsDance],
  },
  peak: {
    message:
      "This is the sweet spot. Enough energy to work with, enough presence to direct it. If you want to channel this into something meaningful, the options below can help. If you want to stay in the feeling, that's good too.",
    activityIntro: 'Channel it if you want to.',
    // Values Compass removed.
    activities: [ACT.feltSense, ACT.music, ACT.letsDance],
  },
  'late-session': {
    message:
      "There's still good energy here as things wind down. You can use it for reflection or just enjoy what's left.",
    activityIntro: 'Make the most of it.',
    // Music removed (overused in late-session). Let's Dance added (gives
    // the user a movement option even as things wind down).
    activities: [ACT.openAwareness, ACT.valuesCompass, ACT.letsDance],
  },
  default: {
    message: "Good energy. Here are some ways to work with it.",
    activities: [ACT.music, ACT.shaking, ACT.letsDance],
  },
};

// High energy (7–8) + 'enjoying' — channel the energy
const HIGH_ENJOYING_BY_PHASE = {
  'come-up': {
    message:
      "This surge of energy is your body's first response to the medicine. It usually evolves into something deeper within the next 30 minutes. Enjoy the ride, and if you need to move, move.",
    activities: [ACT.shaking, ACT.letsDance, ACT.music],
  },
  peak: {
    message:
      "You've got a lot of energy and it wants to go somewhere. Movement is a great outlet. Or if you're ready for something deeper, this energy can fuel focused inner work.",
    activityIntro: 'Move, dance, or go deeper.',
    // Values Compass removed.
    activities: [ACT.letsDance, ACT.shaking, ACT.feltSense],
  },
  'late-session': {
    message:
      "High energy late in the session is a gift. Dance, move, or use it for one more piece of meaningful work before things wind down.",
    // Letter Writing added: late-session is the ideal moment to capture
    // what the energy is bringing into focus.
    activities: [ACT.letsDance, ACT.shaking, ACT.music, ACT.letterWriting],
  },
  default: {
    message: "Let the energy move.",
    activities: [ACT.shaking, ACT.letsDance, ACT.music],
  },
};

// High energy (7–8) + 'too-much' — phase-aware reassurance, no redirect.
// Per user decision: come-up gets the "this is normal as effects begin" framing,
// past come-up gets a different reassurance focused on grounding through movement.
const HIGH_TOO_MUCH_BY_PHASE = {
  'come-up': {
    message:
      "This intensity is normal as the medicine takes hold. Your nervous system is activating quickly and the rest of the experience hasn't caught up with it yet. Channeling the energy through your body can take the edge off without fighting it.",
    activityIntro: 'Move it through.',
    activities: [ACT.simpleGrounding, ACT.shaking, ACT.letsDance],
  },
  'early-peak': {
    message:
      "The intensity is real, but it's workable. The peak is settling in around you. Grounding through your body, or moving the energy out, can help you find your footing without losing what's good about this.",
    activityIntro: 'Ground it or move it.',
    activities: [ACT.simpleGrounding, ACT.shaking, ACT.letsDance],
  },
  peak: {
    message:
      "The energy is more than you want right now. That's okay. You can move it through your body, or you can slow down and ground. Either one will give the intensity somewhere to go.",
    activityIntro: 'Channel or settle.',
    activities: [ACT.shaking, ACT.simpleGrounding, ACT.bodyScan],
  },
  default: {
    message:
      "If this energy feels like more than you want, channel it through your body or slow down with something grounding. There's no wrong way to meet it.",
    activityIntro: 'Move it or ground it.',
    activities: [ACT.shaking, ACT.simpleGrounding, ACT.letsDance],
  },
};

export function resolveFeelGood(triageState, sessionContext) {
  const { energy, energyFeeling } = triageState;
  const { phaseWindow, minutesSinceIngestion } = sessionContext;
  const timeContextLine = formatTimeContext(minutesSinceIngestion, phaseWindow);

  // High energy (7–8) — fork on energyFeeling
  if (energy >= 7) {
    if (energyFeeling === 'too-much') {
      const payload =
        HIGH_TOO_MUCH_BY_PHASE[phaseWindow] || HIGH_TOO_MUCH_BY_PHASE.default;
      return {
        timeContextLine,
        message: payload.message,
        activityIntro: payload.activityIntro,
        activities: payload.activities,
      };
    }
    // 'enjoying' (or undefined fallback)
    const payload =
      HIGH_ENJOYING_BY_PHASE[phaseWindow] || HIGH_ENJOYING_BY_PHASE.default;
    return {
      timeContextLine,
      message: payload.message,
      activityIntro: payload.activityIntro,
      activities: payload.activities,
    };
  }

  // Moderate energy (4–6)
  if (energy >= 4) {
    const payload = MODERATE_BY_PHASE[phaseWindow] || MODERATE_BY_PHASE.default;
    return {
      timeContextLine,
      message: payload.message,
      activityIntro: payload.activityIntro,
      activities: payload.activities,
    };
  }

  // Low energy (1–3)
  const payload = LOW_BY_PHASE[phaseWindow] || LOW_BY_PHASE.default;
  return {
    timeContextLine,
    message: payload.message,
    activityIntro: payload.activityIntro,
    activities: payload.activities,
  };
}

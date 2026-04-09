/**
 * Resolver — Intense Feeling
 *
 * triageState shape:
 *   {
 *     intensity: number,           // 0–10 from rating step
 *     bodyLocation: string,        // 'chest-heart' | 'head' | 'stomach' | 'limbs' | 'all-over' | 'cant-tell'
 *   }
 *
 * Returns a ResultPayload with phase-aware copy and activity suggestions.
 *
 * Note: rating 0 (acknowledge) and rating 9–10 (emergency override) are handled
 * by the runner before this resolver is called. This function is only invoked
 * for intensity 1–8 with a body location selected.
 *
 * Activity-curation rationale (developer notes for future tuning):
 *   - chest-heart branches include Self-Compassion: a metta-style meditation
 *     directed at the heart space pairs naturally with chest sensations.
 *   - Pendulation and Stay With It are included for moderate (1–5) intensity
 *     during early-peak and peak windows: somatic-experiencing tools fit best
 *     when the user is past the come-up but the sensation is still workable.
 *   - Body Scan and Music Time are intentionally OMITTED from the moderate
 *     (1–5) peak/early-peak branches: they're overused defaults and too basic
 *     for that window. They should only appear when intensity is high (6–8)
 *     or during the come-up where simpler grounding is appropriate.
 *   - Music Time is also stripped from every Intense Feeling branch where
 *     intensity is in the 1–5 tier, for the same reason.
 */

import { ACT, formatTimeContext } from '../resolverUtils';

const COME_UP_BY_LOCATION = {
  // Chest-heart copy is softened per user decision: removed the "If this feels
  // like genuine chest pain..." sentence that asked the user to self-diagnose,
  // and added a separate calm pointer to the contact card below.
  'chest-heart': {
    message:
      "During the come-up, your heart rate increases and chest sensations are common. What you're feeling is your cardiovascular system responding to the medicine.",
    secondaryMessage:
      "If you're worried, the options below are for you.",
    // Self-Compassion added: a metta-style meditation directed at the heart
    // space pairs naturally with chest sensations.
    activities: [ACT.simpleGrounding, ACT.bodyScan, ACT.selfCompassion],
    showEmergencyCard: true,
  },
  head: {
    message:
      "Head pressure, buzzing, and a rushing sensation are typical come-up effects. Your serotonin system is activating. This usually smooths out as the peak begins.",
    // Leaves on a Stream added: cognitive defusion helps when the head is
    // the active site of intensity (busy thoughts, mental pressure).
    activities: [ACT.simpleGrounding, ACT.openAwareness, ACT.leavesOnAStream],
  },
  stomach: {
    message:
      "Nausea and gut tension are among the most common come-up effects. Slow, deep breathing through the nose can help. If you need to, let yourself be sick. It passes quickly and won't diminish the session.",
    activities: [ACT.simpleGrounding, ACT.bodyScan],
  },
  limbs: {
    message:
      "Trembling, restless legs, and tingling in the extremities are your body's response to the medicine entering your system. Movement can help, or you can let the sensation be there without fighting it.",
    // Body Scan added so the user has a stillness option in addition to
    // movement-based discharge.
    activities: [ACT.shaking, ACT.simpleGrounding, ACT.bodyScan],
  },
  'all-over': {
    message:
      "Your whole body is adjusting to the medicine right now. This wave of physical intensity is normal and usually peaks within the first 45 minutes before settling.",
    activities: [ACT.shaking, ACT.simpleGrounding, ACT.bodyScan],
  },
  'cant-tell': {
    message:
      "Your whole body is adjusting to the medicine right now. This wave of physical intensity is normal and usually peaks within the first 45 minutes before settling.",
    activities: [ACT.shaking, ACT.simpleGrounding, ACT.bodyScan],
  },
};

// Peak / late-session moderate-intensity branches (1–5).
//
// Curation rules:
//   - Body Scan and Music Time are NOT included here. They're overused
//     defaults and too basic for this window — reserved for the high-intensity
//     (6–8) branch where simpler grounding is appropriate.
//   - Pendulation and Stay With It are included on EVERY body location.
//     Somatic-experiencing tools fit best in the early-peak / peak window
//     when intensity is workable (not high enough to require pure grounding).
//   - chest-heart additionally includes Self-Compassion (metta-style heart
//     practice).
const PEAK_MODERATE_BY_LOCATION = {
  'chest-heart': {
    message:
      "Pressure in the chest during the peak often signals emotion moving through you. This is the medicine working. If it feels safe enough, stay with the sensation and see what's underneath it.",
    activities: [ACT.stayWithIt, ACT.feltSense, ACT.selfCompassion, ACT.pendulation],
  },
  head: {
    message:
      "Head pressure during the peak can come from held tension or unprocessed thoughts circling. Rather than trying to think your way through it, try dropping your attention into your body.",
    activities: [ACT.openAwareness, ACT.pendulation, ACT.stayWithIt],
  },
  stomach: {
    message:
      "Gut sensations during the peak are often connected to held emotion: anxiety, grief, things you haven't said. Pay attention to it. Your body knows something your mind hasn't caught up with yet.",
    activities: [ACT.feltSense, ACT.pendulation, ACT.stayWithIt],
  },
  limbs: {
    message:
      "Your body is processing something. Rather than trying to figure out what, let your attention rest on the sensation itself. You don't need to do anything with it.",
    activities: [ACT.openAwareness, ACT.pendulation, ACT.stayWithIt],
  },
  'all-over': {
    message:
      "Your body is processing something. Rather than trying to figure out what, let your attention rest on the sensation itself. You don't need to do anything with it.",
    activities: [ACT.openAwareness, ACT.pendulation, ACT.stayWithIt],
  },
  'cant-tell': {
    message:
      "Your body is processing something. Rather than trying to figure out what, let your attention rest on the sensation itself. You don't need to do anything with it.",
    activities: [ACT.openAwareness, ACT.pendulation, ACT.stayWithIt],
  },
};

const PEAK_HIGH_MESSAGE =
  "This is a lot of sensation. The most helpful thing right now is to slow down and anchor to something simple. You don't need to process this. Just be in your body.";
const PEAK_HIGH_ACTIVITIES = [ACT.shortGrounding, ACT.bodyScan, ACT.openAwareness];

const EARLY_PEAK_MESSAGE =
  "You're in the transition between come-up and full effects. Physical intensity often spikes here before settling into something warmer. Stay with the sensation. It's shifting.";
// Body Scan removed from this list (overused/too basic for the early-peak
// window). Pendulation and Stay With It added: somatic-experiencing tools
// fit best when the user is past the come-up and intensity is still workable.
const EARLY_PEAK_ACTIVITIES = [ACT.openAwareness, ACT.simpleGrounding, ACT.pendulation, ACT.stayWithIt];

export function resolveIntenseFeeling(triageState, sessionContext) {
  const { intensity, bodyLocation } = triageState;
  const { phaseWindow, minutesSinceIngestion } = sessionContext;
  const timeContextLine = formatTimeContext(minutesSinceIngestion, phaseWindow);

  // Come-up: copy varies by body location
  if (phaseWindow === 'come-up') {
    const variant = COME_UP_BY_LOCATION[bodyLocation] || COME_UP_BY_LOCATION['all-over'];
    return {
      timeContextLine,
      message: variant.message,
      secondaryMessage: variant.secondaryMessage,
      activityIntro: 'Try one of these.',
      activities: variant.activities,
      showEmergencyCard: variant.showEmergencyCard,
    };
  }

  // Early peak: same copy for all body locations
  if (phaseWindow === 'early-peak') {
    return {
      timeContextLine,
      message: EARLY_PEAK_MESSAGE,
      activityIntro: 'These can help you settle.',
      activities: EARLY_PEAK_ACTIVITIES,
    };
  }

  // Peak / late-session / null: split by intensity tier
  if (intensity >= 6) {
    return {
      timeContextLine,
      message: PEAK_HIGH_MESSAGE,
      activityIntro: 'Start with something simple.',
      activities: PEAK_HIGH_ACTIVITIES,
    };
  }

  // Moderate (1–5)
  const variant =
    PEAK_MODERATE_BY_LOCATION[bodyLocation] || PEAK_MODERATE_BY_LOCATION['all-over'];
  return {
    timeContextLine,
    message: variant.message,
    activityIntro: 'These can help you stay with what\u2019s happening.',
    activities: variant.activities,
  };
}

/**
 * Resolver — Grief
 *
 * triageState shape:
 *   {
 *     intensity: number,           // 0–10 from rating step
 *     expression: string,          // 'yes' | 'trying' | 'too-much'
 *   }
 *
 * Activity-curation rationale (developer notes):
 *   - Inner Child Letter and Gratitude Reflection are added to the flowing
 *     (yes) and blocked (trying) branches. Both are letter/journaling tools
 *     that pair well with grief integration: re-parenting and appreciation
 *     for what was loved.
 *   - Body Scan removed from the blocked (trying) branch — it was the basic
 *     somatic anchor, but the user is asking for tools that open the
 *     emotional channel rather than just observe sensation.
 *   - Overwhelming (too-much) branches are unchanged — those should stay
 *     pure stabilization (Short Grounding + Self-Compassion + Body Scan).
 */

import { ACT, formatTimeContext } from '../resolverUtils';

const FLOWING_BY_PHASE = {
  peak: {
    message:
      "Let it come. MDMA opens a window where grief can move through you without the usual defenses getting in the way. This is some of the most important work you can do today. You don't need to understand it yet. Just let it be here.",
    activityIntro: 'Hold the space for what\u2019s moving.',
    activities: [ACT.music, ACT.selfCompassion, ACT.stayWithIt],
  },
  'late-session': {
    message:
      "Grief surfacing now, as clarity returns, often carries real understanding with it. Let the tears come and pay attention to what the sadness is about. You may see something you couldn't see earlier.",
    activityIntro: 'Stay with what\u2019s here.',
    // Inner Child Letter and Gratitude Reflection added: late-session
    // clarity is the natural moment for letter-writing integration tools.
    activities: [ACT.stayWithIt, ACT.selfCompassion, ACT.openAwareness, ACT.innerChildLetter, ACT.gratitudeReflection],
  },
  default: {
    message:
      "Grief needs space, not fixing. Whatever is here, old loss, something unnamed, something you didn't know you were carrying, let it move. You're doing something important.",
    activityIntro: 'These can hold space for what\u2019s here.',
    // Inner Child Letter and Gratitude Reflection added.
    activities: [ACT.music, ACT.selfCompassion, ACT.stayWithIt, ACT.innerChildLetter, ACT.gratitudeReflection],
  },
};

const BLOCKED = {
  message:
    "The grief is there but something is holding it back. The release will come when it's ready, and forcing it usually pushes it further out of reach. You don't need to make this happen. Body-oriented approaches can sometimes open the channel that thinking can't.",
  activityIntro: 'Approach through the body.',
  // Body Scan removed (too observational for the "open the channel" goal).
  // Inner Child Letter and Gratitude Reflection added: writing-based tools
  // can open emotional channels that pure body work can't reach.
  activities: [ACT.feltSense, ACT.shaking, ACT.innerChildLetter, ACT.gratitudeReflection],
};

const OVERWHELMING_BY_PHASE = {
  peak: {
    message:
      "You're in the middle of something big. You don't need to drown in it. The goal is to be with the grief without it pulling you under. Let's find a stable place to stand so you can feel this without losing yourself.",
    activityIntro: 'Find your footing.',
    activities: [ACT.shortGrounding, ACT.selfCompassion, ACT.bodyScan],
  },
  default: {
    message:
      "This wave is bigger than you can hold right now, and that's okay. Step back just far enough to breathe. The grief isn't going anywhere. You can come back to it when you're more grounded.",
    activityIntro: 'Stabilize first.',
    activities: [ACT.shortGrounding, ACT.selfCompassion, ACT.bodyScan],
  },
};

export function resolveGrief(triageState, sessionContext) {
  const { expression } = triageState;
  const { phaseWindow, minutesSinceIngestion } = sessionContext;
  const timeContextLine = formatTimeContext(minutesSinceIngestion, phaseWindow);

  let payload;
  if (expression === 'yes') {
    payload = FLOWING_BY_PHASE[phaseWindow] || FLOWING_BY_PHASE.default;
  } else if (expression === 'trying') {
    payload = BLOCKED;
  } else {
    // 'too-much'
    payload = OVERWHELMING_BY_PHASE[phaseWindow] || OVERWHELMING_BY_PHASE.default;
  }

  return {
    timeContextLine,
    message: payload.message,
    activityIntro: payload.activityIntro,
    activities: payload.activities,
  };
}

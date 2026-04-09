/**
 * Resolver — Trauma
 *
 * triageState shape:
 *   {
 *     vividness: number,           // 0–10 from rating step
 *     dualAwareness: string,       // 'yes' | 'somewhat' | 'no'
 *   }
 *
 * Phase-aware modifier: during come-up, prepend a normalization line regardless
 * of the dual-awareness branch.
 *
 * Activity-curation rationale (developer notes):
 *   - Music Time is generally suppressed across the trauma branches; it's
 *     too passive for processing-active work and too generic to ground
 *     true overwhelm. The 'no' (flooding) branch is the one exception:
 *     music can serve as a soothing anchor when the priority is calming.
 *   - dualAwareness='yes' branches lean on Stay With It / Felt Sense /
 *     Pendulation: somatic-experiencing tools that support continued
 *     processing without flooding.
 *   - dualAwareness='somewhat' uses Leaves on a Stream alongside grounding
 *     (cognitive defusion helps when the user is half in / half out of the
 *     memory) and Stay With It to keep the door open.
 *   - dualAwareness='no' is pure stabilization: Simple Grounding +
 *     Body Scan + Shaking the Tree + Self-Compassion + Music Time. No
 *     processing tools.
 */

import { ACT, formatTimeContext } from '../resolverUtils';

const COME_UP_PREPEND =
  "Trauma surfacing during the come-up is less common. The physical effects usually dominate right now. If memories are already appearing, your nervous system may be more activated than usual. The grounding suggestions below can help.";

// dualAwareness === 'yes' — processing is active and within capacity
const PROCESSING_ACTIVE_BY_PHASE = {
  peak: {
    message:
      "What's surfacing is the medicine doing its work. You're revisiting this from a position the fear couldn't reach before. Stay with it if you can, and use your breath to keep one foot here in the room.",
    activityIntro: 'These can help you go deeper.',
    // Music removed (too passive for active processing). Pendulation added
    // for somatic-experiencing oscillation between activation and calm.
    activities: [ACT.stayWithIt, ACT.feltSense, ACT.pendulation],
  },
  'late-session': {
    message:
      "Something is still working through you. The cognitive clarity you're gaining right now can help you understand what came up. Stay with the memory, but gently. You've done a lot today.",
    activityIntro: 'These can support what\u2019s moving.',
    // Music removed. Felt Sense and Pendulation added: late-session clarity
    // is the ideal moment for somatic-experiencing integration.
    activities: [ACT.stayWithIt, ACT.openAwareness, ACT.feltSense, ACT.pendulation],
  },
  default: {
    message:
      "You're able to hold what's surfacing without losing yourself in it. That's significant. Stay present with the material and trust your own process.",
    activityIntro: 'These can support your process.',
    // Music removed.
    activities: [ACT.stayWithIt, ACT.feltSense],
  },
};

// dualAwareness === 'somewhat' — partial grounding needed
const PARTIAL_GROUNDING = {
  message:
    "You're partway between the memory and the room. That's okay. The goal isn't to push the material away. It's to get enough ground under you that you can stay with it without being swept under. Start with grounding, and if the material is still there when you feel more stable, let it come.",
  activityIntro: 'Establish your footing first.',
  // Short Grounding removed. Leaves on a Stream added (cognitive defusion
  // helps when the user is half in, half out of the memory). Stay With It
  // added so processing stays available once footing is established.
  activities: [ACT.bodyScan, ACT.simpleGrounding, ACT.leavesOnAStream, ACT.stayWithIt],
};

// dualAwareness === 'no' — flooding, priority grounding only
const FLOODING_BY_PHASE = {
  peak: {
    message:
      "The material has gotten ahead of your capacity to stay with it. That's not failure. It means something important is here, and you need more ground before you can face it. Right now, the only job is to feel your body in this room.",
    activityIntro: 'Anchor to something physical.',
    // Short Grounding swapped for Simple Grounding. Open Awareness removed
    // (too unstructured for flooding). Shaking the Tree, Self-Compassion,
    // and Music Time added: physical discharge + soothing + audio anchor.
    activities: [ACT.simpleGrounding, ACT.bodyScan, ACT.shaking, ACT.selfCompassion, ACT.music],
  },
  default: {
    message:
      "Right now, what matters most is feeling your body in this room. The material will still be there when you're ready. You don't have to go back to it today.",
    activityIntro: 'Start here.',
    activities: [ACT.simpleGrounding, ACT.bodyScan, ACT.shaking, ACT.selfCompassion, ACT.music],
  },
};

export function resolveTrauma(triageState, sessionContext) {
  const { dualAwareness } = triageState;
  const { phaseWindow, minutesSinceIngestion } = sessionContext;
  const timeContextLine = formatTimeContext(minutesSinceIngestion, phaseWindow);

  let payload;
  if (dualAwareness === 'yes') {
    payload = PROCESSING_ACTIVE_BY_PHASE[phaseWindow] || PROCESSING_ACTIVE_BY_PHASE.default;
  } else if (dualAwareness === 'somewhat') {
    payload = PARTIAL_GROUNDING;
  } else {
    // 'no' — flooding
    payload = FLOODING_BY_PHASE[phaseWindow] || FLOODING_BY_PHASE.default;
  }

  // Come-up prepend modifier — added before the main message regardless of branch
  const message =
    phaseWindow === 'come-up'
      ? `${COME_UP_PREPEND}\n\n${payload.message}`
      : payload.message;

  return {
    timeContextLine,
    message,
    activityIntro: payload.activityIntro,
    activities: payload.activities,
  };
}

/**
 * Resolver — Ego Dissolution
 *
 * triageState shape:
 *   {
 *     disorientation: number,      // 0–10 from rating step
 *     experienceType: string,      // 'derealization' | 'depersonalization' | 'identity' | 'unity'
 *   }
 *
 * Note: the identity branch returns `activityPaths` (two parallel labeled
 * activity groups) instead of a flat `activities` array. The runner detects
 * this and renders both groups.
 *
 * Activity-curation rationale (developer notes):
 *   - Leaves on a Stream is added to come-up branches for both derealization
 *     and depersonalization. Cognitive defusion is a strong fit when
 *     perception is starting to feel strange — it gives the user a way to
 *     watch the experience without getting swept by it.
 *   - Pendulation added at peak for both derealization and depersonalization:
 *     somatic-experiencing oscillation helps the user re-anchor while still
 *     allowing the perceptual state to be present.
 *   - Identity-peak "expansive" path: Mapping the Territory removed, replaced
 *     with Music Time and Letter Writing. The user wanted tools that better
 *     support the expansive experience without leaning on a pre-session
 *     module.
 */

import { ACT, formatTimeContext } from '../resolverUtils';

const DEREALIZATION_BY_PHASE = {
  'come-up': {
    message:
      "Perception shifts during the come-up are common. Colors may look different, sounds may feel closer or further away, and the room might seem unfamiliar. This is a normal pharmacological effect and usually stabilizes within 20 minutes.",
    activityIntro: 'If you want to ground:',
    // Leaves on a Stream added (cognitive defusion for perceptual strangeness).
    activities: [ACT.simpleGrounding, ACT.openAwareness, ACT.leavesOnAStream],
  },
  peak: {
    message:
      "Your perception is being filtered differently right now. Things looking or feeling strange is one of the more common MDMA effects. You're safe, and your normal perception will return as the session progresses.",
    activityIntro: 'These can help if the strangeness is uncomfortable.',
    // Pendulation added: somatic-experiencing oscillation helps re-anchor
    // while allowing the perceptual state to be present.
    activities: [ACT.simpleGrounding, ACT.bodyScan, ACT.openAwareness, ACT.pendulation],
  },
  default: {
    message:
      "Perceptual shifts are a normal part of the experience. You're safe. If the strangeness is uncomfortable, grounding can help. If it's just unusual, you can let it be.",
    activityIntro: 'Ground if you need to.',
    activities: [ACT.simpleGrounding, ACT.bodyScan],
  },
};

const DEPERSONALIZATION_BY_PHASE = {
  'come-up': {
    message:
      "Feeling disconnected from your body during the come-up can happen as your nervous system adjusts. Gentle physical engagement, like feeling your feet on the floor or touching the texture of a blanket, can help you re-anchor.",
    activityIntro: 'Reconnect through sensation.',
    // Leaves on a Stream added (cognitive defusion for the dissociative pull).
    activities: [ACT.shortGrounding, ACT.bodyScan, ACT.leavesOnAStream],
  },
  peak: {
    message:
      "Feeling detached from your body can mean two different things. It might be a gentle loosening of your usual boundaries, which is part of the experience. Or it might be dissociation, a protective response where a part of you checks out. Either way, the remedy is the same: gentle attention back to physical sensation.",
    activityIntro: 'Come back to the body.',
    // Pendulation added: re-anchors while preserving access to the
    // dissociative state for somatic-experiencing work.
    activities: [ACT.bodyScan, ACT.shortGrounding, ACT.shaking, ACT.pendulation],
  },
  default: {
    message:
      "Disconnection from the body is something to take seriously and address gently. You don't need to force anything. Start with small, simple sensations: the weight of your hands, the temperature of the air.",
    activityIntro: 'Anchor to sensation.',
    activities: [ACT.shortGrounding, ACT.bodyScan],
  },
};

// Identity branch returns activityPaths (two parallel groups)
const IDENTITY_BY_PHASE = {
  peak: {
    message:
      "MDMA can soften the edges of your usual sense of self. This can feel disorienting, but your identity isn't breaking, it's stretching. The you that exists beneath all the stories and roles is still here. If this feels frightening, ground. If it feels expansive, rest in it.",
    activityPaths: [
      {
        label: 'This feels scary',
        activities: [ACT.shortGrounding, ACT.bodyScan],
      },
      {
        // Mapping the Territory removed (it's pre-session-scoped and not
        // ideal for in-the-moment expansive work). Music and Letter Writing
        // are better fits — soundtrack the state and capture it on paper.
        label: 'This feels expansive',
        activities: [ACT.openAwareness, ACT.music, ACT.letterWriting],
      },
    ],
  },
  default: {
    message:
      "Your sense of self is shifting, and that can feel strange. You haven't lost yourself. Try noticing simple facts: your name, where you are, what year it is. These anchors can help without shutting down the experience.",
    activityIntro: 'Anchor without shutting down.',
    activities: [ACT.shortGrounding, ACT.bodyScan, ACT.openAwareness],
  },
};

// Unity is a positive experience — same copy across phases
const UNITY = {
  message:
    "What you're experiencing is sometimes called oceanic boundlessness, a felt sense of connection with everything around you. This is one of the more meaningful states MDMA can open. You don't need to do anything with it. Rest in it.",
  activityIntro: 'If you want to deepen this:',
  activities: [ACT.openAwareness, ACT.music, ACT.mappingTheTerritory],
};

export function resolveEgoDissolution(triageState, sessionContext) {
  const { experienceType } = triageState;
  const { phaseWindow, minutesSinceIngestion } = sessionContext;
  const timeContextLine = formatTimeContext(minutesSinceIngestion, phaseWindow);

  let payload;
  if (experienceType === 'derealization') {
    payload = DEREALIZATION_BY_PHASE[phaseWindow] || DEREALIZATION_BY_PHASE.default;
  } else if (experienceType === 'depersonalization') {
    payload = DEPERSONALIZATION_BY_PHASE[phaseWindow] || DEPERSONALIZATION_BY_PHASE.default;
  } else if (experienceType === 'identity') {
    payload = IDENTITY_BY_PHASE[phaseWindow] || IDENTITY_BY_PHASE.default;
  } else {
    // 'unity'
    payload = UNITY;
  }

  return {
    timeContextLine,
    message: payload.message,
    activityIntro: payload.activityIntro,
    activities: payload.activities,
    activityPaths: payload.activityPaths,
  };
}

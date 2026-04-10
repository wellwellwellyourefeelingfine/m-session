/**
 * Resolver — Low Mood (follow-up only)
 *
 * triageState shape:
 *   {
 *     severity: number,       // 0–10 from rating step
 *     quality: string,        // 'flat' | 'sad' | 'irritable' | 'anxious' | 'hopeless'
 *     functioning: string,    // 'managing' | 'struggling' | 'cant-function' (severity 4-9 only)
 *   }
 *
 * Severity tiers (rating 0 and 10 handled by runner, never reach this function):
 *   Mild:        1–3
 *   Moderate:    4–6
 *   Significant: 7–9
 *
 * Branches on: severity tier × quality × functioning × sessionContext.timeWindow
 *
 * Support resources are a new ResultPayload field for follow-up categories:
 *   supportResources: [{ type: 'fireside' | 'emergency-contact' | 'find-therapist' }]
 */

import { ACT, formatFollowUpTimeContext } from '../resolverUtils';

// ============================================
// SUPPORT RESOURCE PRESETS
// ============================================

const FIRESIDE = { type: 'fireside' };
const EMERGENCY_CONTACT = { type: 'emergency-contact' };
const FIND_THERAPIST = { type: 'find-therapist' };

// ============================================
// MILD (severity 1–3)
// ============================================

const MILD_ACUTE = {
  flat: {
    message:
      "A muted, gray feeling in the first few days is one of the most common aftereffects. Your serotonin system flooded during the session and is now restoring itself. This is neurochemistry, not a sign that something went wrong. It typically lifts within a week. In the meantime: sleep, eat well, move your body gently, and don't make any big decisions.",
    activityIntro: 'These can help while you wait it out.',
    activities: [ACT.selfCompassion, ACT.openAwareness, ACT.bodySomatic],
  },
  sad: {
    message:
      "Sadness in the first days after a session sometimes means grief that opened during the session is still moving through you. That's continuation of the work, not a setback. Let it come if it needs to.",
    activities: [ACT.integrationReflection, ACT.selfCompassion],
  },
  irritable: {
    message:
      "Irritability in the acute window is common. Your nervous system went through a lot, and the serotonin dip can leave you with a shorter fuse. Be patient with yourself. This passes.",
    activities: [ACT.bodySomatic, ACT.natureConnection],
  },
  anxious: {
    message:
      "Some anxiety in the first days is your nervous system recalibrating. The openness you felt during the session can leave you feeling more exposed than usual for a while. Grounding helps.",
    activities: [ACT.openAwareness, ACT.bodySomatic],
  },
  hopeless: {
    message:
      "Hopelessness in the acute window can be frightening, but it's often the serotonin dip at its worst. Before drawing conclusions about the session or yourself, give your brain a few more days to recover. If this feeling persists past a week, the resources below can help.",
    activities: [ACT.selfCompassion, ACT.integrationReflection],
    supportResources: [FIRESIDE, EMERGENCY_CONTACT],
  },
};

const MILD_EARLY = {
  flat: {
    message:
      "If the flatness is hanging on past the first few days, it may be worth paying attention to, but it's still within the normal window. Some people take up to two weeks to fully rebound. Keep taking care of the basics.",
    activities: [ACT.natureConnection, ACT.lifestyleReflection],
  },
  // sad, irritable, anxious share the same copy
  shared: {
    message:
      "The acute neurochemical effects should be fading by now. What you're feeling may be less about serotonin and more about the material that surfaced. Reflection can help you understand what's underneath the mood.",
    activities: [ACT.integrationReflection, ACT.relationshipsReflection, ACT.selfCompassion],
  },
  hopeless: {
    message:
      "Hopelessness that persists into the second week deserves attention. This may not just be the comedown. Talking to someone who understands integration work can help you figure out whether this is normal processing or something that needs support.",
    activities: [ACT.selfCompassion],
    supportResources: [FIRESIDE, FIND_THERAPIST, EMERGENCY_CONTACT],
  },
};

const MILD_MID_LATE = {
  message:
    "You're past the neurochemical recovery window. A persistent low mood at this point is worth taking seriously, though it doesn't mean the session failed. Sometimes integration stirs up material that needs more time or professional support to work through.",
  activities: [ACT.integrationReflection, ACT.selfCompassion],
  supportResources: [FIRESIDE, FIND_THERAPIST],
};

// ============================================
// MODERATE (severity 4–6)
// ============================================

const MODERATE_ACUTE_MANAGING = {
  flat: {
    message:
      "This is harder than you expected, and you're still getting through the day. That counts. The serotonin dip hits some people harder than others. Basic self-care matters more right now than trying to process or make sense of anything.",
    activityIntro: 'Be gentle with yourself.',
    activities: [ACT.selfCompassion, ACT.bodySomatic, ACT.natureConnection],
  },
  irritable: {
    message:
      "This is harder than you expected, and you're still getting through the day. That counts. The serotonin dip hits some people harder than others. Basic self-care matters more right now than trying to process or make sense of anything.",
    activityIntro: 'Be gentle with yourself.',
    activities: [ACT.selfCompassion, ACT.bodySomatic, ACT.natureConnection],
  },
  sad: {
    message:
      "The sadness is asking for your attention, and you're strong enough to hold it while still functioning. When you have a quiet moment, the reflection below can help you understand what the grief is connected to.",
    activities: [ACT.integrationReflection, ACT.selfCompassion],
  },
  anxious: {
    message:
      "Anxiety at this level during the first few days is your system working hard to restabilize. Grounding practices can help take the edge off while your neurochemistry normalizes.",
    activities: [ACT.openAwareness, ACT.bodySomatic],
  },
  hopeless: {
    message:
      "This level of hopelessness in the acute window is significant. It's very likely neurochemical, but that doesn't make it less real. Don't sit with this alone.",
    activities: [ACT.selfCompassion],
    supportResources: [FIRESIDE, EMERGENCY_CONTACT],
  },
};

const MODERATE_ACUTE_IMPAIRED = {
  message:
    "You're having a rough time. In the first few days after a session, a hard crash is not uncommon, but struggling to function means you should reach out to someone. You don't need to explain the whole session. Just let someone know you're having a hard few days and could use company or support.",
  activities: [ACT.selfCompassion],
  supportResources: [EMERGENCY_CONTACT, FIRESIDE, FIND_THERAPIST],
};

const MODERATE_EARLY_MANAGING = {
  message:
    "The first week is behind you. If the mood hasn't lifted yet, something beyond the neurochemical dip may be at play. The session may have opened material that your mind is still processing outside of conscious awareness. Structured reflection can help bring it into focus.",
  activities: [ACT.integrationReflection, ACT.lifestyleReflection, ACT.relationshipsReflection],
  supportResources: [FIRESIDE],
};

const MODERATE_EARLY_IMPAIRED = {
  message:
    "Two weeks of significantly impaired functioning is past the normal recovery window. This doesn't mean something went wrong with the session, but it means you deserve support that goes beyond what an app can offer. Please reach out to one of the resources below.",
  activities: [ACT.selfCompassion],
  supportResources: [FIND_THERAPIST, FIRESIDE, EMERGENCY_CONTACT],
};

const MODERATE_MID_LATE = {
  message:
    "Persistent moderate low mood weeks after a session suggests that integration work has more to uncover, or that what surfaced during the session needs professional support to process. An integration therapist can help enormously here.",
  activities: [ACT.integrationReflection],
  supportResources: [FIND_THERAPIST, FIRESIDE],
};

// ============================================
// SIGNIFICANT (severity 7–9)
// ============================================

const SIGNIFICANT_ACUTE = {
  message:
    "A mood this low in the first few days is painful, and it's important you don't go through it alone. The serotonin dip can produce what feels like a depressive episode, and for some people it's genuinely debilitating. This is temporary for the vast majority of people, but right now, the priority is connection and care.",
  activities: [ACT.selfCompassion],
  supportResources: [EMERGENCY_CONTACT, FIRESIDE, FIND_THERAPIST],
};

const SIGNIFICANT_EARLY = {
  message:
    "A mood this low into the second week needs attention. Whether it's extended neurochemical recovery or emotional material from the session that hasn't been processed, you shouldn't try to power through this by yourself. Professional support can make a real difference.",
  activities: [ACT.selfCompassion],
  supportResources: [FIND_THERAPIST, EMERGENCY_CONTACT, FIRESIDE],
};

const SIGNIFICANT_MID_LATE = {
  message:
    "A significantly low mood this long after the session is something to take to a professional. An integration therapist or a therapist familiar with psychedelic experiences can help you work through what's happening. This is exactly what they're trained for.",
  supportResources: [FIND_THERAPIST, FIRESIDE, EMERGENCY_CONTACT],
};

// ============================================
// RESOLVER
// ============================================

function classifySeverityTier(severity) {
  if (severity <= 3) return 'mild';
  if (severity <= 6) return 'moderate';
  return 'significant';
}

export function resolveLowMood(triageState, sessionContext) {
  const { severity, quality, functioning } = triageState;
  const { timeWindow, daysSinceSession } = sessionContext;
  const timeContextLine = formatFollowUpTimeContext(daysSinceSession, timeWindow);

  const tier = classifySeverityTier(severity);

  let payload;

  if (tier === 'mild') {
    payload = resolveMild(quality, timeWindow);
  } else if (tier === 'moderate') {
    payload = resolveModerate(quality, functioning, timeWindow);
  } else {
    payload = resolveSignificant(timeWindow);
  }

  return {
    timeContextLine,
    message: payload.message,
    activityIntro: payload.activityIntro,
    activities: payload.activities,
    supportResources: payload.supportResources,
  };
}

function resolveMild(quality, timeWindow) {
  if (timeWindow === 'mid' || timeWindow === 'late') {
    return MILD_MID_LATE;
  }

  if (timeWindow === 'early') {
    if (quality === 'flat') return MILD_EARLY.flat;
    if (quality === 'hopeless') return MILD_EARLY.hopeless;
    return MILD_EARLY.shared;
  }

  // acute (default)
  return MILD_ACUTE[quality] || MILD_ACUTE.flat;
}

function resolveModerate(quality, functioning, timeWindow) {
  if (timeWindow === 'mid' || timeWindow === 'late') {
    return MODERATE_MID_LATE;
  }

  const isImpaired = functioning === 'struggling' || functioning === 'cant-function';

  if (timeWindow === 'early') {
    return isImpaired ? MODERATE_EARLY_IMPAIRED : MODERATE_EARLY_MANAGING;
  }

  // acute (default)
  if (isImpaired) return MODERATE_ACUTE_IMPAIRED;
  return MODERATE_ACUTE_MANAGING[quality] || MODERATE_ACUTE_MANAGING.flat;
}

function resolveSignificant(timeWindow) {
  if (timeWindow === 'early') return SIGNIFICANT_EARLY;
  if (timeWindow === 'mid' || timeWindow === 'late') return SIGNIFICANT_MID_LATE;
  return SIGNIFICANT_ACUTE;
}

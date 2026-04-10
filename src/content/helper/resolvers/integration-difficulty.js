/**
 * Resolver — Integration Difficulty (follow-up only)
 *
 * triageState shape:
 *   {
 *     stuckness: number,      // 0–10 from rating step
 *     stuckType: string,      // 'fading' | 'overwhelmed' | 'nothing-changed' | 'confused' | 'avoidant'
 *   }
 *
 * The stuckness rating gates the choice step (1–9 shows stuckType) but does
 * NOT affect resolution — the resolver branches entirely on stuckType × timeWindow.
 * Rating 0 and 10 are handled by the runner and never reach this function.
 */

import { ACT, formatFollowUpTimeContext } from '../resolverUtils';

// ============================================
// SUPPORT RESOURCE PRESETS
// ============================================

const FIRESIDE = { type: 'fireside' };
const EMERGENCY_CONTACT = { type: 'emergency-contact' };
const FIND_THERAPIST = { type: 'find-therapist' };

// ============================================
// FADING — insights dimming with each passing day
// ============================================

const FADING = {
  acute: {
    message:
      "It's only been a few days. The insights aren't gone \u2014 they're settling. Your brain is transitioning from the state where those realizations felt electric to the state where they need to become durable. The single most important thing you can do right now is write. Capture whatever you remember, even fragments. You can make sense of it later.",
    activityIntro: 'Anchor what you remember.',
    activities: [ACT.integrationReflection, ACT.lightJournaling],
  },
  early: {
    message:
      "Some fading is normal. The emotional intensity of the session can't be sustained, and that's actually healthy. What matters now is whether you can access the meaning of what came up, even if the feeling has cooled. Structured reflection helps translate raw experience into understanding.",
    activityIntro: 'Go deeper into what came up.',
    activities: [ACT.integrationReflection, ACT.spiritMeaning],
    supportResources: [FIRESIDE],
  },
  default: {
    message:
      "Some distance from the session is inevitable, and not all of it is loss. What fades first is usually the emotional intensity, not the actual insight. But if the meaning itself feels unreachable, talking it through with someone \u2014 a friend, a therapist, or the Fireside line \u2014 can help bring it back. Sometimes you need another person's reflection to hear what you already know.",
    activities: [ACT.integrationReflection, ACT.spiritMeaning],
    supportResources: [FIRESIDE, FIND_THERAPIST],
  },
};

// ============================================
// OVERWHELMED — too much surfaced at once
// ============================================

// Shared message across all time windows
const OVERWHELMED_MESSAGE =
  "When a lot surfaces at once, the impulse is to try to process everything simultaneously. That doesn't work. Pick one thread \u2014 the one that feels most alive, or the one that keeps coming back on its own \u2014 and start there. The rest will wait. Integration isn't a race and it doesn't have to be comprehensive. Even one insight fully integrated changes more than ten insights left floating.";

const OVERWHELMED = {
  acute: {
    message: OVERWHELMED_MESSAGE,
    activityIntro: 'Start with one thread.',
    activities: [ACT.integrationReflection, ACT.lightJournaling],
  },
  early: {
    message: OVERWHELMED_MESSAGE,
    activityIntro: 'Start with one thread.',
    activities: [ACT.integrationReflection, ACT.relationshipsReflection, ACT.bodySomatic],
    supportResources: [FIRESIDE],
  },
  default: {
    message: OVERWHELMED_MESSAGE,
    activityIntro: 'Start with one thread.',
    activities: [ACT.integrationReflection, ACT.lifestyleReflection],
    supportResources: [FIND_THERAPIST, FIRESIDE],
  },
};

// ============================================
// NOTHING CHANGED — insight without behavioral shift
// ============================================

const NOTHING_CHANGED = {
  acute: {
    message:
      "It's too early to expect behavioral change. The session planted seeds. Give them time before concluding they didn't take root. For now, focus on capturing what you saw clearly during the session, so you have something concrete to work with later.",
    activities: [ACT.integrationReflection, ACT.lightJournaling, ACT.valuesCompass],
  },
  early: {
    message:
      "Insight and action are connected but not the same thing. Understanding something during a session doesn't automatically translate into changed behavior once normal life resumes. Old patterns have momentum. The gap between 'I see what needs to change' and 'I'm changing it' is where the real integration work lives. These reflections can help you identify specific, small things you can do differently.",
    activityIntro: 'Turn insight into action.',
    activities: [ACT.lifestyleReflection, ACT.valuesCompass, ACT.relationshipsReflection],
    supportResources: [FIRESIDE],
  },
  default: {
    message:
      "If nothing has shifted after several weeks, it may be worth asking whether you're waiting for the session to change you, or whether you're actively doing the work of changing. That's not a criticism \u2014 it's a common pattern. Integration requires conscious effort, and sometimes it requires help. An integration therapist can work with you to turn what you learned into concrete steps.",
    activities: [ACT.lifestyleReflection, ACT.valuesCompass],
    supportResources: [FIND_THERAPIST, FIRESIDE],
  },
};

// ============================================
// CONFUSED — meaning isn't clear
// ============================================

const CONFUSED = {
  acute: {
    message:
      "Not every session produces tidy insights. Some experiences are more somatic, emotional, or symbolic than cognitive. Meaning can take days or weeks to crystallize. For now, write down what you remember \u2014 images, body sensations, emotions, fragments of thought \u2014 without trying to interpret them. The understanding may come later, or it may come through conversation.",
    activities: [ACT.integrationReflection, ACT.lightJournaling, ACT.bodySomatic],
  },
  early: {
    message:
      "If the experience still feels opaque after a week, try approaching it from different angles. The reflections below each offer a different lens \u2014 relationships, body, meaning, lifestyle. Sometimes the session was working on something that only becomes visible when you look at your life from a specific direction.",
    activityIntro: 'Try a different lens.',
    activities: [ACT.spiritMeaning, ACT.relationshipsReflection, ACT.bodySomatic, ACT.natureConnection],
    supportResources: [FIRESIDE],
  },
  default: {
    message:
      "Some sessions resist being understood on your own. Talking it through with someone \u2014 whether a trained listener on the Fireside line or an integration therapist \u2014 can surface meaning that solitary reflection can't. The act of describing the experience to another person often reveals what it was about.",
    activities: [ACT.spiritMeaning],
    supportResources: [FIRESIDE, FIND_THERAPIST],
  },
};

// ============================================
// AVOIDANT — keeps putting off integration work
// ============================================

// Shared opening prepended to every time-window message
const AVOIDANT_PREPEND =
  "Avoidance after a session is almost always protective. Something came up that a part of you doesn't feel ready to face in ordinary consciousness. That part kept you safe during the session and it's keeping you safe now. The resistance deserves respect, not force.";

const AVOIDANT = {
  acute: {
    message:
      `${AVOIDANT_PREPEND}\n\nIn the first few days, avoidance might just be your system saying 'I need to rest before I process.' That's legitimate. Don't force integration when your body is still recovering. But if you can manage one small thing \u2014 even five minutes of writing \u2014 do that. Momentum matters more than depth right now.`,
    activityIntro: 'Just five minutes.',
    activities: [ACT.lightJournaling, ACT.integrationReflection],
  },
  early: {
    message:
      `${AVOIDANT_PREPEND}\n\nIf you're past the first few days and still avoiding, notice what happens when you think about sitting down to reflect. Does your body tense? Does your mind go blank? Does a distraction suddenly seem urgent? That response is information. A gentle approach through the body can sometimes bypass the avoidance that the mind keeps up.`,
    activityIntro: 'Come at it sideways.',
    activities: [ACT.bodySomatic, ACT.natureConnection, ACT.lightJournaling],
    supportResources: [FIRESIDE],
  },
  default: {
    message:
      `${AVOIDANT_PREPEND}\n\nExtended avoidance sometimes means the material is too big to face alone, and there's no shame in that. Some things that surface during MDMA sessions need a human being on the other side \u2014 not an app, not a journal prompt, but a person who can hold the space while you look at what you've been avoiding.`,
    activities: [ACT.integrationReflection],
    supportResources: [FIND_THERAPIST, FIRESIDE, EMERGENCY_CONTACT],
  },
};

// ============================================
// STUCK TYPE → DATA MAP
// ============================================

const STUCK_TYPE_MAP = {
  fading: FADING,
  overwhelmed: OVERWHELMED,
  'nothing-changed': NOTHING_CHANGED,
  confused: CONFUSED,
  avoidant: AVOIDANT,
};

// ============================================
// RESOLVER
// ============================================

export function resolveIntegrationDifficulty(triageState, sessionContext) {
  const { stuckType } = triageState;
  const { timeWindow, daysSinceSession } = sessionContext;
  const timeContextLine = formatFollowUpTimeContext(daysSinceSession, timeWindow);

  const typeData = STUCK_TYPE_MAP[stuckType];
  if (!typeData) {
    return { timeContextLine, message: 'Integration takes time. Be patient with yourself.' };
  }

  // Resolve time window: acute → early → default (mid/late)
  const windowKey = (timeWindow === 'acute' || timeWindow === 'early') ? timeWindow : 'default';
  const payload = typeData[windowKey] || typeData.default;

  return {
    timeContextLine,
    message: payload.message,
    activityIntro: payload.activityIntro,
    activities: payload.activities,
    supportResources: payload.supportResources,
  };
}

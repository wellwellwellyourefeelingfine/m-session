/**
 * Resolver — Resistance
 *
 * triageState shape:
 *   {
 *     strength: number,            // 0–10 from rating step
 *     resistanceType: string,      // 'control' | 'escape' | 'numb' | 'anger'
 *   }
 *
 * Activity-curation rationale (developer notes):
 *   - Control branches lean on Leaves on a Stream (cognitive defusion for
 *     mental-control patterns) and Inner Child Letter (peak/default — soft
 *     re-parenting for the part that's gripping).
 *   - Escape branches add Stay With It alongside grounding so the user has
 *     a way to actively meet what they're avoiding instead of only anchoring.
 *     Music Time stripped from the come-up and peak escape branches because
 *     it's too passive for the work the user actually needs to do.
 *   - Numb branches add Pendulation (somatic-experiencing oscillation is the
 *     standard tool for re-engaging dissociated sensation) plus Leaves on a
 *     Stream at the peak.
 *   - Anger come-up swaps Let's Dance for Leaves on a Stream + Self-Compassion
 *     because come-up irritability often benefits from cognitive defusion and
 *     warmth more than dance discharge. Open Awareness added at peak/default
 *     so the user has a witness-mode option.
 */

import { ACT, formatTimeContext } from '../resolverUtils';

const BY_TYPE_AND_PHASE = {
  control: {
    'come-up': {
      message:
        "Control-seeking during the come-up is extremely common. Your mind is trying to manage an experience that hasn't fully arrived yet. The most useful thing you can do is let go of figuring out how the session is supposed to go.",
      activityIntro: 'Let go of the steering wheel for a few minutes.',
      // Leaves on a Stream added: cognitive defusion is the natural tool
      // for the "trying to manage" pattern.
      activities: [ACT.openAwareness, ACT.music, ACT.simpleGrounding, ACT.leavesOnAStream],
    },
    peak: {
      message:
        "The urge to control has been with you for a long time, and it's a strong habit. Right now it doesn't need to work so hard. See if you can let your grip relax and let MDMA's effects carry you through this part of the experience.",
      activityIntro: 'These can help you loosen the grip.',
      // Music removed (too passive for the work). Inner Child Letter added:
      // soft re-parenting for the part that's gripping.
      activities: [ACT.protectorDialogue, ACT.openAwareness, ACT.innerChildLetter],
    },
    default: {
      message:
        "The urge to control is a familiar strategy your mind reaches for when things feel uncertain. You don't need to fight it. Acknowledge it's there, and see if you can let go just enough for the effects of the MDMA to do some of the work.",
      activityIntro: 'Try one of these.',
      // Values Compass removed. Inner Child Letter added.
      activities: [ACT.protectorDialogue, ACT.openAwareness, ACT.innerChildLetter],
    },
  },
  escape: {
    'come-up': {
      message:
        "The urge to leave is your nervous system responding to unfamiliar activation. You're safe. This feeling usually passes as the come-up gives way to the full effects. Try staying for another 15 minutes.",
      activityIntro: 'Ground yourself while you wait.',
      // Music removed. Leaves on a Stream added (cognitive defusion for
      // the leaving impulse).
      activities: [ACT.simpleGrounding, ACT.openAwareness, ACT.leavesOnAStream],
    },
    peak: {
      message:
        "The urge to get away from what's here is a real signal, and it's worth noticing. You're safe in this room. Whatever is here for you to feel may be easier to face right now than it will be later. Stay a little longer if you can.",
      activityIntro: 'These can help you stay.',
      // Music removed. Stay With It added — gives the user an active
      // tool for the "stay a little longer" instruction.
      activities: [ACT.simpleGrounding, ACT.shaking, ACT.stayWithIt],
    },
    default: {
      message:
        "The urge to escape is a signal, not an instruction. You're safe. See if you can stay with the discomfort for a few more minutes.",
      activityIntro: 'Anchor yourself.',
      // Stay With It added.
      activities: [ACT.simpleGrounding, ACT.music, ACT.bodyScan, ACT.stayWithIt],
    },
  },
  numb: {
    'come-up': {
      message:
        "Feeling blank during the come-up sometimes means the effects of the MDMA haven't fully taken hold yet. Give it time. If this persists into the peak, it's worth paying attention to and gently re-engaging with your body.",
      activityIntro: 'Gentle re-engagement.',
      activities: [ACT.bodyScan, ACT.shaking],
    },
    peak: {
      message:
        "Numbness during the peak is usually a part of you pulling the emergency brake or avoiding what's here. You don't need to force anything open. Gentle somatic attention can help you reconnect.",
      activityIntro: 'Re-engage through the body.',
      // Leaves on a Stream and Pendulation added: cognitive defusion +
      // somatic-experiencing oscillation are the standard tools for
      // re-engaging dissociated sensation.
      activities: [ACT.bodyScan, ACT.shaking, ACT.feltSense, ACT.leavesOnAStream, ACT.pendulation],
    },
    default: {
      message:
        "Numbness is the opposite of what you expected, and that can be disorienting. Rather than trying to feel something, try just noticing what your body is doing. Sensation is still there. It may just be quieter than you think.",
      activityIntro: 'Start with the body.',
      // Pendulation added.
      activities: [ACT.bodyScan, ACT.shaking, ACT.openAwareness, ACT.pendulation],
    },
  },
  anger: {
    'come-up': {
      message:
        "Irritability during the come-up is common. Your nervous system is activated and the calming effects haven't kicked in yet. Physical discharge can help burn off the edge.",
      activityIntro: 'Move the energy.',
      // Let's Dance removed (too celebratory for irritation). Leaves on a
      // Stream + Self-Compassion added: cognitive defusion + warmth fit
      // come-up irritability better than dance discharge.
      activities: [ACT.shaking, ACT.leavesOnAStream, ACT.selfCompassion],
    },
    peak: {
      message:
        "Anger is one of the emotions MDMA can bring to the surface, especially if you've spent a long time suppressing it. This is real material. If it feels safe, stay with the anger and acknowledge it's arising.",
      activityIntro: 'Work with it.',
      // Open Awareness added: gives the user a witness-mode option in
      // addition to the active tools.
      activities: [ACT.shaking, ACT.protectorDialogue, ACT.feltSense, ACT.openAwareness],
    },
    default: {
      message:
        "Anger is information. Something matters to you, and this feeling is the proof. Physical discharge can help if the energy is too much, or you can sit with it and listen.",
      activityIntro: 'Channel it.',
      // Open Awareness added.
      activities: [ACT.shaking, ACT.feltSense, ACT.protectorDialogue, ACT.openAwareness],
    },
  },
};

export function resolveResistance(triageState, sessionContext) {
  const { resistanceType } = triageState;
  const { phaseWindow, minutesSinceIngestion } = sessionContext;
  const timeContextLine = formatTimeContext(minutesSinceIngestion, phaseWindow);

  const typeBranch = BY_TYPE_AND_PHASE[resistanceType] || BY_TYPE_AND_PHASE.control;
  const payload = typeBranch[phaseWindow] || typeBranch.default;

  return {
    timeContextLine,
    message: payload.message,
    activityIntro: payload.activityIntro,
    activities: payload.activities,
  };
}

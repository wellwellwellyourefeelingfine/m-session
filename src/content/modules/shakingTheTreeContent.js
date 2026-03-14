/**
 * Shaking the Tree — Somatic Movement Practice
 * Content definitions: intro screens + movement sections
 *
 * Philosophical lineage (not user-facing):
 * - Somatic Experiencing (Peter Levine) — animals shaking after threat, discharge signs
 * - Osho Kundalini/Dynamic Meditation — "allow the shaking, don't manufacture it"
 * - Qigong shaking practice — progressive permission structure
 * - Hakomi (Ron Kurtz) — body carries stored tension, organicity principle
 */

export const INTRO_SCREENS = [
  {
    id: 'what-this-is',
    header: 'What this is',
    body: [
      'This is a movement practice. Not a workout, not a dance class. The only goal is to let your body move the way it wants to.',
      'You\u2019ll move through five sections, from gentle swaying to full-body shaking to stillness. Each section gives your body a little more permission than the last.',
    ],
  },
  {
    id: 'why-it-works',
    header: 'Why it works',
    body: [
      'Your body has a built-in mechanism for releasing tension. Animals do it instinctively. A dog shakes after a confrontation. A bird ruffles its feathers after escaping a predator. The shaking discharges the activation and the animal moves on.',
      'Humans suppress this reflex. We tighten instead of trembling. We hold instead of shaking. The tension accumulates, especially during deep emotional work.',
      'This practice gives that reflex permission to happen.',
    ],
  },
  {
    id: 'key-instruction',
    header: 'Remember',
    body: [
      'Allow the shaking. Don\u2019t manufacture it.',
      'Start with the suggested movements. At some point, your body will begin to move on its own. When that happens, follow it. Let the shaking become something you\u2019re not controlling. Let your body lead.',
      'If you find yourself thinking, move more. The mind quiets when the body is fully engaged.',
    ],
  },
  {
    id: 'what-you-might-feel',
    header: 'Feeling',
    body: [
      'Tingling in your hands or feet. Warmth spreading through your chest or limbs. Waves of emotion that come and go. Yawning or deep sighing. Laughter. Tears. A sense of something loosening or softening that you can\u2019t quite name.',
      'All of this is normal. It\u2019s your nervous system discharging stored energy. You don\u2019t need to understand it or do anything with it. Just keep moving.',
    ],
  },
  {
    id: 'ready',
    header: 'Ready',
    body: [
      'Stand up. Bare feet if possible. Give yourself enough space to move freely.',
      'Put on your music. When you\u2019re ready, begin.',
    ],
    isReady: true,
  },
];

export const MOVEMENT_SECTIONS = [
  {
    id: 'sway',
    name: 'Sway',
    pctOfTotal: 0.20,
    energyLevel: 0.2,
    cue: 'Start gentle.',
    invitation: 'Let your body find a rhythm.',
    guidance: [
      'Feet hip-width apart. Knees soft.',
      'Rock side to side, or in small circles.',
      'Close your eyes if that feels right.',
    ],
  },
  {
    id: 'bounce',
    name: 'Bounce',
    pctOfTotal: 0.20,
    energyLevel: 0.4,
    cue: 'Add some bounce.',
    invitation: 'Soft bounce from your knees.',
    guidance: [
      'Let everything else hang loose. Arms, shoulders, jaw.',
      'Feel the vibration travel upward through your body.',
      'You don\u2019t need to control where it goes.',
    ],
  },
  {
    id: 'shake',
    name: 'Shake',
    pctOfTotal: 0.25,
    energyLevel: 0.8,
    cue: 'Let it get bigger.',
    invitation: 'Shake everything.',
    guidance: [
      'Hands, wrists, arms. Shoulders, spine, hips.',
      'Flick your fingers. Let your head go.',
      'It can be messy. It should be messy.',
    ],
  },
  {
    id: 'move',
    name: 'Move Freely',
    pctOfTotal: 0.20,
    energyLevel: 1.0,
    cue: 'Your body knows.',
    invitation: 'Follow the impulse.',
    guidance: [
      'Dance, jump, stomp, spin, stretch, curl.',
      'There is no wrong way to do this.',
      'If something wants to come out, let it.',
    ],
  },
  {
    id: 'return',
    name: 'Return',
    pctOfTotal: 0.15,
    energyLevel: 0.1,
    cue: 'Begin to slow down.',
    invitation: 'Let the movements get smaller.',
    guidance: [
      'Come back to the bounce. Then the sway.',
      'Then let the sway become stillness.',
      'Stand. Eyes closed. Feel what\u2019s different.',
    ],
  },
];

// ─── Check-in content ────────────────────────────────────────────────────────

export const BODY_CHECKIN_OPTIONS = [
  { id: 'tingling', label: 'Tingling' },
  { id: 'warmth', label: 'Warmth' },
  { id: 'heaviness', label: 'Heaviness' },
  { id: 'lightness', label: 'Lightness' },
  { id: 'buzzing', label: 'Buzzing' },
  { id: 'pulsing', label: 'Pulsing' },
  { id: 'stillness', label: 'Stillness' },
  { id: 'openness', label: 'Openness' },
  { id: 'tension', label: 'Tension' },
  { id: 'softness', label: 'Softness' },
  { id: 'energy', label: 'Energy' },
  { id: 'calm', label: 'Calm' },
];

export const UNNAMED_OPTION = {
  id: 'unnamed',
  label: 'Something I can\u2019t name',
};

export const LANDING_SCREEN = {
  instruction: 'Stand still. Close your eyes. Notice what\u2019s different in your body right now.',
};

export const TAILORED_RESPONSES = {
  'activation': {
    header: 'Your body is still moving',
    paragraphs: [
      'Even though you\u2019ve stopped, the energy is still circulating. Tingling, buzzing, pulsing \u2014 these are signs of discharge. Your nervous system is processing what was held.',
      'This is exactly what the practice is for. You don\u2019t need to do anything with it. Just notice.',
    ],
  },
  'settling': {
    header: 'Something has settled',
    paragraphs: [
      'The stillness, calm, or softness you\u2019re feeling is your nervous system finding a new baseline. The shaking helped discharge what was being held, and now your body is resting in what\u2019s underneath.',
      'Stay with this. It doesn\u2019t need to be dramatic to be significant.',
    ],
  },
  'release': {
    header: 'A release happened',
    paragraphs: [
      'Warmth and openness after shaking often signal a parasympathetic shift \u2014 your body moving from holding to letting go. Something that was braced has softened.',
      'You might feel emotional, spacious, or simply different. All of that is the release doing its work.',
    ],
  },
  'held-tension': {
    header: 'Some things are still held',
    paragraphs: [
      'Tension after shaking isn\u2019t failure \u2014 it\u2019s information. Some holding patterns need more than one round to shift. Your body showed you where it\u2019s still bracing.',
      'The practice planted a seed. The release may come later \u2014 in rest, in sleep, in the next session.',
    ],
  },
  'mixed': {
    header: 'Your body is telling a complex story',
    paragraphs: [
      'Feeling multiple things at once \u2014 energy and calm, tension and openness \u2014 means your system is in active reorganization. Different parts are at different stages of processing.',
      'This is normal. You don\u2019t need to resolve the contradiction. Just notice the layers.',
    ],
  },
  'energized': {
    header: 'The energy is awake',
    paragraphs: [
      'What you\u2019re feeling is vitality that was trapped in holding patterns. The shaking freed it. Energy, lightness, buzzing \u2014 these are signs of your system coming alive.',
      'Channel this into whatever comes next. This energy is yours.',
    ],
  },
  'quiet': {
    header: 'The quiet is real',
    paragraphs: [
      'Heaviness and stillness after intense movement can signal deep rest \u2014 your body entering a state it couldn\u2019t access while it was holding. This is restorative, not collapse.',
      'If you feel sleepy or heavy, that\u2019s your system claiming the rest it needs.',
    ],
  },
  'unnamed': {
    header: 'Something shifted',
    paragraphs: [
      'Not everything the body does has a name. You moved, you shook, and now something is different. That\u2019s enough.',
      'The part of you that knows what happened doesn\u2019t need language. Trust it.',
    ],
  },
};

export const REFLECT_SCREENS = [
  {
    header: 'What just happened',
    lines: [
      'Your body has a built-in mechanism for releasing stored tension. What you just did \u2014 the swaying, bouncing, shaking \u2014 gave that mechanism permission to activate.',
      '\u00A7',
      'In somatic therapy, this is called discharge. Animals do it naturally after any threat response. Humans suppress it. The shaking practice works because it bypasses the suppression.',
    ],
  },
  {
    header: 'What to notice going forward',
    lines: [
      'The effects of this practice often show up later:',
      '{#1} Deeper sleep or more vivid dreams tonight',
      '{#2} Emotional waves that arise without obvious cause',
      '{#3} Physical sensations \u2014 warmth, tingling, softness \u2014 returning spontaneously',
      '{#4} A sense of being more \u201cin\u201d your body than usual',
      '\u00A7',
      'None of this needs to be managed. It\u2019s your system continuing to process. If something comes up, notice it and let it move through.',
    ],
  },
];

export const JOURNAL_SCREEN = {
  header: 'Capture anything',
  placeholder: 'What came up during the practice? What feels different now? Anything you want to remember...',
};

export const CLOSING_CONTENT = {
  lines: [
    'The shaking is done. The processing continues.',
    '\u00A7',
    'Your body knows how to do the rest.',
  ],
};

/**
 * Determine response key based on selected sensations.
 * Maps sensation combinations to one of 8 tailored response types.
 */
export function getResponseKey(selected) {
  if (selected.includes('unnamed') && selected.length === 1) return 'unnamed';
  if (selected.includes('unnamed')) return 'mixed';

  const activation = ['tingling', 'buzzing', 'pulsing'];
  const settling = ['stillness', 'calm', 'softness'];
  const release = ['warmth', 'openness'];
  const held = ['tension', 'heaviness'];
  const vital = ['energy', 'lightness'];

  const hasActivation = selected.some(s => activation.includes(s));
  const hasSettling = selected.some(s => settling.includes(s));
  const hasRelease = selected.some(s => release.includes(s));
  const hasHeld = selected.some(s => held.includes(s));
  const hasVital = selected.some(s => vital.includes(s));

  const categories = [hasActivation, hasSettling, hasRelease, hasHeld, hasVital].filter(Boolean).length;
  if (categories >= 3) return 'mixed';

  if (hasHeld && !hasRelease && !hasSettling) return 'held-tension';
  if (hasActivation && !hasSettling) return 'activation';
  if (hasRelease) return 'release';
  if (hasSettling && !hasActivation) return 'settling';
  if (hasVital) return 'energized';
  if (hasHeld && hasSettling) return 'quiet';

  return 'mixed';
}

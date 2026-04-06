/**
 * Helper Modal Category Configurations
 * Each category defines the full flow: icon, prompt, rating routing, and activity suggestions.
 * Activity IDs reference modules from src/content/modules/library.js.
 */

export const helperCategories = [
  // ============================================
  // ACTIVE SESSION CATEGORIES
  // ============================================
  {
    id: 'intense-feeling',
    phase: 'active',
    icon: 'HandIcon',
    label: 'Intense feeling',
    description: 'Somatic overwhelm, tightness, trembling, heat',
    subheader: 'Intense feeling',
    prompt: 'On a scale of 0 to 10, how intense is this feeling?',
    showScale: true,
    skipScaleTo: null,
    routing: {
      ranges: [
        { min: 0, max: 0, route: 'acknowledge-close' },
        { min: 1, max: 5, route: 'max-activity' },
        { min: 6, max: 8, route: 'gentle-activity' },
        { min: 9, max: 10, route: 'emergency' },
      ],
    },
    acknowledgeText: "You're noticing sensation without being overwhelmed by it. That's awareness doing its job. You can come back here any time.",
    maxActivityIntro: "Let's give that energy somewhere to go.",
    gentleActivityIntro: "When sensation is this strong, slower is better. Let's start with something simple.",
    maxActivitySuggestions: [
      { id: 'simple-grounding', label: 'Simple Grounding', description: 'Ground yourself through your senses' },
      { id: 'music-listening', label: 'Music Time', description: 'Let music hold the space for you' },
      { id: 'shaking-the-tree', label: 'Shaking the Tree', description: 'Release tension through movement' },
    ],
    gentleActivitySuggestions: [
      { id: 'body-scan', label: 'Body Scan', description: 'Slow, gentle attention to each part of your body' },
      { id: 'open-awareness', label: 'Open Awareness', description: 'Rest in spacious, non-directed attention' },
    ],
  },
  {
    id: 'trauma',
    phase: 'active',
    icon: 'EyeIcon',
    label: 'Trauma re-experience',
    description: 'Vivid emotional or sensory flashbacks feel like they\u2019re happening now',
    subheader: 'Trauma re-experience',
    prompt: 'On a scale of 0 to 10, how vivid or overwhelming is this right now?',
    showScale: true,
    skipScaleTo: null,
    routing: {
      ranges: [
        { min: 0, max: 0, route: 'acknowledge-close' },
        { min: 1, max: 5, route: 'max-activity' },
        { min: 6, max: 8, route: 'gentle-activity' },
        { min: 9, max: 10, route: 'emergency' },
      ],
    },
    acknowledgeText: "It sounds like something surfaced but isn't taking over. That's okay. You're here, and you're safe.",
    maxActivityIntro: 'Grounding can help create distance from what\u2019s surfacing.',
    gentleActivityIntro: 'Right now, the most important thing is to feel your body in this room. Let\u2019s start there.',
    maxActivitySuggestions: [
      { id: 'simple-grounding', label: 'Simple Grounding', description: 'Ground yourself through your senses' },
      { id: 'shaking-the-tree', label: 'Shaking the Tree', description: 'Release tension through movement' },
      { id: 'music-listening', label: 'Music Time', description: 'Let music hold the space for you' },
    ],
    gentleActivitySuggestions: [
      { id: 'short-grounding', label: 'Short Grounding', description: 'Quick grounding to anchor you here' },
      { id: 'body-scan', label: 'Body Scan', description: 'Slow, gentle attention to each part of your body' },
      { id: 'open-awareness', label: 'Open Awareness', description: 'Rest in spacious, non-directed attention' },
    ],
  },
  {
    id: 'resistance',
    phase: 'active',
    icon: 'AngryIcon',
    label: 'Inner resistance',
    description: 'A part of me is fighting the process. I\u2019m having thoughts that feel urgent',
    subheader: 'Inner resistance',
    prompt: 'On a scale of 0 to 10, how strong is this resistance?',
    showScale: true,
    skipScaleTo: null,
    routing: {
      ranges: [
        { min: 0, max: 0, route: 'acknowledge-close' },
        { min: 1, max: 5, route: 'max-activity' },
        { min: 6, max: 8, route: 'gentle-activity' },
        { min: 9, max: 10, route: 'emergency' },
      ],
    },
    acknowledgeText: "Noticing resistance without it running the show is significant. You're doing well.",
    maxActivityIntro: 'Sometimes resistance just needs acknowledgment and a gentle redirect.',
    gentleActivityIntro: 'A strong protector part might be active. Let\u2019s slow down and listen.',
    maxActivitySuggestions: [
      { id: 'simple-grounding', label: 'Simple Grounding', description: 'Ground yourself through your senses' },
      { id: 'music-listening', label: 'Music Time', description: 'Let music hold the space for you' },
      { id: 'values-compass', label: 'Values Compass', description: 'Reconnect with what matters to you' },
    ],
    gentleActivitySuggestions: [
      { id: 'protector-dialogue', label: 'Dialogue with a Protector', description: 'Gently meet the part that\u2019s resisting' },
      { id: 'open-awareness', label: 'Open Awareness', description: 'Rest in spacious, non-directed attention' },
      { id: 'felt-sense', label: 'Felt Sense', description: 'Turn inward and listen to what\u2019s there' },
    ],
  },
  {
    id: 'grief',
    phase: 'active',
    icon: 'TearIcon',
    label: 'Grief',
    description: 'Sudden wave of crying, feeling of loss, sadness, emptiness',
    subheader: 'Grief',
    prompt: 'On a scale of 0 to 10, how intense is this wave?',
    showScale: true,
    skipScaleTo: null,
    routing: {
      ranges: [
        { min: 0, max: 0, route: 'acknowledge-close' },
        { min: 1, max: 5, route: 'max-activity' },
        { min: 6, max: 8, route: 'gentle-activity' },
        { min: 9, max: 10, route: 'emergency' },
      ],
    },
    acknowledgeText: "Something touched the surface. You don't have to chase it. It'll come back when you're ready.",
    maxActivityIntro: 'Grief often just needs space. These can help hold it gently.',
    gentleActivityIntro: 'When grief is this strong, the kindest thing is to let it be here without trying to fix it.',
    maxActivitySuggestions: [
      { id: 'music-listening', label: 'Music Time', description: 'Let music hold the space for you' },
      { id: 'self-compassion', label: 'Self-Compassion', description: 'Offer yourself the kindness you need right now' },
      { id: 'open-awareness', label: 'Open Awareness', description: 'Rest in spacious, non-directed attention' },
    ],
    gentleActivitySuggestions: [
      { id: 'self-compassion', label: 'Self-Compassion', description: 'Offer yourself the kindness you need right now' },
      { id: 'body-scan', label: 'Body Scan', description: 'Slow, gentle attention to each part of your body' },
      { id: 'stay-with-it', label: 'Stay With It', description: 'Stay present with what\u2019s here' },
    ],
  },
  {
    id: 'ego-dissolution',
    phase: 'active',
    icon: 'EggIcon',
    label: 'Ego dissolution',
    description: 'I feel a strange sense of self is lost, reality feels unknown',
    subheader: 'Ego dissolution',
    prompt: 'On a scale of 0 to 10, how disorienting does this feel?',
    showScale: true,
    skipScaleTo: null,
    routing: {
      ranges: [
        { min: 0, max: 0, route: 'acknowledge-close' },
        { min: 1, max: 5, route: 'max-activity' },
        { min: 6, max: 8, route: 'gentle-activity' },
        { min: 9, max: 10, route: 'emergency' },
      ],
    },
    acknowledgeText: "Something shifted, but you're still here. That flicker of strangeness is normal.",
    maxActivityIntro: 'Gentle grounding can help you feel your edges again.',
    gentleActivityIntro: 'Your sense of self is stretching, not breaking. Let\u2019s anchor to something simple.',
    maxActivitySuggestions: [
      { id: 'simple-grounding', label: 'Simple Grounding', description: 'Ground yourself through your senses' },
      { id: 'body-scan', label: 'Body Scan', description: 'Slow, gentle attention to each part of your body' },
      { id: 'open-awareness', label: 'Open Awareness', description: 'Rest in spacious, non-directed attention' },
    ],
    gentleActivitySuggestions: [
      { id: 'short-grounding', label: 'Short Grounding', description: 'Quick grounding to anchor you here' },
      { id: 'open-awareness', label: 'Open Awareness', description: 'Rest in spacious, non-directed attention' },
    ],
  },
  {
    id: 'feel-good',
    phase: 'active',
    icon: 'LaughIcon',
    label: 'I feel so good',
    description: 'I have so much energy, I can\u2019t sit still/focus, I want to move',
    subheader: 'I feel so good',
    prompt: null,
    showScale: false,
    skipScaleTo: 'max-activity',
    routing: { ranges: [] },
    acknowledgeText: null,
    maxActivityIntro: 'That energy is wonderful. Let\u2019s put it to use.',
    gentleActivityIntro: null,
    maxActivitySuggestions: [
      { id: 'shaking-the-tree', label: 'Shaking the Tree', description: 'Release energy through movement' },
      { id: 'lets-dance', label: 'Let\u2019s Dance', description: 'Move your body to music' },
      { id: 'music-listening', label: 'Music Time', description: 'Let music hold the space for you' },
    ],
    gentleActivitySuggestions: [],
  },

  // ============================================
  // FOLLOW-UP CATEGORIES (stubs)
  // ============================================
  {
    id: 'low-mood',
    phase: 'follow-up',
    icon: 'TearIcon',
    label: 'My mood is really low',
    description: 'Feeling down, flat, or emotionally depleted',
    subheader: 'Low mood',
    prompt: 'On a scale of 0 to 10, how low is your mood?',
    showScale: true,
    skipScaleTo: null,
    routing: {
      ranges: [
        { min: 0, max: 0, route: 'acknowledge-close' },
        { min: 1, max: 5, route: 'max-activity' },
        { min: 6, max: 8, route: 'gentle-activity' },
        { min: 9, max: 10, route: 'emergency' },
      ],
    },
    acknowledgeText: 'Post-session mood dips are common and usually temporary. Be gentle with yourself.',
    maxActivityIntro: 'Some gentle activities can help lift the heaviness.',
    gentleActivityIntro: 'When mood is this low, start with the simplest thing.',
    maxActivitySuggestions: [],
    gentleActivitySuggestions: [],
  },
  {
    id: 'integration-difficulty',
    phase: 'follow-up',
    icon: 'EggIcon',
    label: 'I am having difficulty with the integration work',
    description: 'Struggling to process or make sense of the experience',
    subheader: 'Integration difficulty',
    prompt: 'On a scale of 0 to 10, how stuck do you feel?',
    showScale: true,
    skipScaleTo: null,
    routing: {
      ranges: [
        { min: 0, max: 0, route: 'acknowledge-close' },
        { min: 1, max: 5, route: 'max-activity' },
        { min: 6, max: 8, route: 'gentle-activity' },
        { min: 9, max: 10, route: 'emergency' },
      ],
    },
    acknowledgeText: 'Integration takes time. There\u2019s no rush to make sense of everything right away.',
    maxActivityIntro: 'Sometimes a different approach can help things click.',
    gentleActivityIntro: 'Let\u2019s try something gentle to reconnect with the experience.',
    maxActivitySuggestions: [],
    gentleActivitySuggestions: [],
  },
];

/**
 * Get the route for a given category and rating value.
 * Returns the route string ('acknowledge-close', 'max-activity', 'gentle-activity', 'emergency').
 */
export function getRouteForRating(category, rating) {
  for (const range of category.routing.ranges) {
    if (rating >= range.min && rating <= range.max) {
      return range.route;
    }
  }
  return 'acknowledge-close';
}

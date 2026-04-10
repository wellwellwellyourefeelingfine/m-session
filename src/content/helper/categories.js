/**
 * Helper Modal Category Configurations — V5
 *
 * Each category defines:
 *   - Identity (id, phases, icon, label)
 *   - Display copy (description, expandedDescription)
 *   - Rating-0 acknowledge text
 *   - A `steps` array describing the decision tree (rating → choice(s) → result)
 *
 * The `phases` field is an ARRAY of session-phase keys where the category
 * should appear in the helper modal:
 *   - 'active'    — shown during the in-session helper modal
 *   - 'follow-up' — shown after the session has completed
 * A category can belong to BOTH (e.g. core categories like Intense Feeling
 * and Trauma still apply during follow-up). The helper modal filters by
 * `category.phases.includes(phaseKey)`.
 *
 * Steps are walked in order by TriageStepRunner. Each step has:
 *   - type: 'rating' | 'choice' | 'result'
 *   - id: key in triageState (rating + choice steps only)
 *   - prompt: question shown to the user (rating + choice steps only)
 *   - journalLabel: short noun used in journal entries (rating + choice steps only)
 *   - showWhen?: predicate (triageState) → boolean — runs before rendering
 *   - options: array of { value, label } (choice steps only)
 *   - resolve: (triageState, sessionContext) → ResultPayload (result steps only)
 *
 * The two follow-up-only categories (`low-mood`, `integration-difficulty`)
 * are intentionally stubs without `steps` arrays — HelperModal renders them
 * with PlaceholderCategory until V6 fleshes them out.
 *
 * Resolver functions live in src/content/helper/resolvers/, one file per
 * category, exported as pure functions.
 */

import { resolveIntenseFeeling } from './resolvers/intense-feeling';
import { resolveTrauma } from './resolvers/trauma';
import { resolveResistance } from './resolvers/resistance';
import { resolveGrief } from './resolvers/grief';
import { resolveEgoDissolution } from './resolvers/ego-dissolution';
import { resolveFeelGood } from './resolvers/feel-good';
import { resolveLowMood } from './resolvers/low-mood';
import { resolveIntegrationDifficulty } from './resolvers/integration-difficulty';

export const helperCategories = [
  // ============================================
  // CORE CATEGORIES (active + follow-up)
  // The 4 categories below appear in BOTH the in-session helper modal
  // and the post-session follow-up helper modal. Ego Dissolution and
  // Feel Good are session-only and appear after these.
  // ============================================
  {
    id: 'intense-feeling',
    phases: ['active', 'follow-up'],
    icon: 'HandIcon',
    label: 'Intense feeling',
    description: 'Pressure or sensation in the body that demands attention',
    expandedDescription:
      "I\u2019m feeling pressure or sensation in my body that\u2019s hard to ignore. There\u2019s tightness, trembling, heat, or buzzing energy pulling all of my attention.",
    acknowledgeText:
      'Noticed without being overwhelmed. You can come back here any time.',
    steps: [
      {
        type: 'rating',
        id: 'intensity',
        prompt: 'How intense is this feeling?',
        journalLabel: 'Intensity',
      },
      {
        type: 'choice',
        id: 'bodyLocation',
        prompt: 'Where in your body are you feeling this?',
        journalLabel: 'Body location',
        showWhen: (state) => state.intensity >= 1 && state.intensity <= 9,
        options: [
          { value: 'chest-heart', label: 'Chest or heart' },
          { value: 'head', label: 'Head' },
          { value: 'stomach', label: 'Stomach or gut' },
          { value: 'limbs', label: 'Arms or legs' },
          { value: 'all-over', label: 'All over' },
          { value: 'cant-tell', label: 'Hard to tell' },
        ],
      },
      {
        type: 'result',
        resolve: resolveIntenseFeeling,
      },
    ],
  },

  {
    id: 'trauma',
    phases: ['active', 'follow-up'],
    icon: 'EyeIcon',
    label: 'Trauma',
    description: 'Past experiences surfacing as if they\u2019re happening now',
    expandedDescription:
      "Something from my past is surfacing and feels like it\u2019s happening right now. I\u2019m seeing, hearing, or feeling things from another moment in my life, and my body is reacting as if it\u2019s here in the room.",
    acknowledgeText: 'Something surfaced but it isn\u2019t running the show. You\u2019re here.',
    steps: [
      {
        type: 'rating',
        id: 'vividness',
        prompt: 'How vivid or overwhelming is this right now?',
        journalLabel: 'Vividness',
      },
      {
        type: 'choice',
        id: 'dualAwareness',
        prompt: 'Can you notice what\u2019s surfacing while still feeling your body in this room?',
        journalLabel: 'Dual awareness',
        showWhen: (state) => state.vividness >= 1 && state.vividness <= 9,
        options: [
          { value: 'yes', label: 'Yes, I can hold both' },
          { value: 'somewhat', label: 'Somewhat' },
          { value: 'no', label: 'No, it\u2019s taking over' },
        ],
      },
      {
        type: 'result',
        resolve: resolveTrauma,
      },
    ],
  },

  {
    id: 'resistance',
    phases: ['active', 'follow-up'],
    icon: 'AngryIcon',
    label: 'Resistance',
    description: 'Something inside is pushing back against the process',
    expandedDescription:
      "A part of me is pushing back against what\u2019s happening. I\u2019m having urgent thoughts about figuring something out or taking control, and the harder I try to surrender, the more it digs in.",
    acknowledgeText: 'Noticing resistance without it running the show. That\u2019s a step.',
    steps: [
      {
        type: 'rating',
        id: 'strength',
        prompt: 'How strong is this resistance?',
        journalLabel: 'Strength',
      },
      {
        type: 'choice',
        id: 'resistanceType',
        prompt: 'What does it feel like?',
        journalLabel: 'Resistance type',
        showWhen: (state) => state.strength >= 1 && state.strength <= 9,
        options: [
          { value: 'control', label: 'I need to control what\u2019s happening' },
          { value: 'escape', label: 'I want to stop or leave' },
          { value: 'numb', label: 'I feel numb or blank' },
          { value: 'anger', label: 'I\u2019m angry or irritated' },
        ],
      },
      {
        type: 'result',
        resolve: resolveResistance,
      },
    ],
  },

  {
    id: 'grief',
    phases: ['active', 'follow-up'],
    icon: 'TearIcon',
    label: 'Grief',
    description: 'A wave of sadness, loss, or old ache rising up',
    expandedDescription:
      "A wave of sadness has moved through me without warning. I might be crying without understanding why, or feeling the weight of an old loss that\u2019s bigger than the moment I\u2019m in.",
    acknowledgeText: 'Something touched the surface. You don\u2019t have to chase it.',
    steps: [
      {
        type: 'rating',
        id: 'intensity',
        prompt: 'How intense is this wave?',
        journalLabel: 'Intensity',
      },
      {
        type: 'choice',
        id: 'expression',
        prompt: 'Are you able to let yourself cry?',
        journalLabel: 'Expression',
        showWhen: (state) => state.intensity >= 1 && state.intensity <= 9,
        options: [
          { value: 'yes', label: 'Yes, it\u2019s flowing' },
          { value: 'trying', label: 'I\u2019m trying but it won\u2019t come' },
          { value: 'too-much', label: 'It\u2019s too much' },
        ],
      },
      {
        type: 'result',
        resolve: resolveGrief,
      },
    ],
  },

  // ============================================
  // ACTIVE-ONLY CATEGORIES
  // These two categories appear ONLY during the in-session helper modal.
  // ============================================
  {
    id: 'ego-dissolution',
    phases: ['active'],
    icon: 'EggIcon',
    label: 'Ego dissolution',
    description: 'The sense of self feels uncertain or far away',
    expandedDescription:
      "My sense of who I am feels uncertain. The boundary between me and everything else is softer than usual, and reality feels strange or far away.",
    acknowledgeText: 'Something shifted, but you\u2019re still here. That flicker is part of it.',
    steps: [
      {
        type: 'rating',
        id: 'disorientation',
        prompt: 'How disorienting does this feel?',
        journalLabel: 'Disorientation',
      },
      {
        type: 'choice',
        id: 'experienceType',
        prompt: 'Which of these is closest?',
        journalLabel: 'Experience type',
        showWhen: (state) => state.disorientation >= 1 && state.disorientation <= 9,
        options: [
          { value: 'derealization', label: 'Things look or feel strange' },
          { value: 'depersonalization', label: 'I feel disconnected from my body' },
          { value: 'identity', label: 'I don\u2019t know who I am' },
          { value: 'unity', label: 'Everything feels connected' },
        ],
      },
      {
        type: 'result',
        resolve: resolveEgoDissolution,
      },
    ],
  },

  {
    id: 'feel-good',
    phases: ['active'],
    icon: 'LaughIcon',
    label: 'I feel so good',
    description: 'Energy moving through, hard to sit still or focus',
    expandedDescription:
      "I\u2019m full of energy and I can feel it moving through me. It\u2019s hard to sit still or focus, and I\u2019m not sure if this is too much.",
    acknowledgeText: 'Noted.',
    steps: [
      {
        type: 'rating',
        id: 'energy',
        prompt: 'How strong is this energy?',
        journalLabel: 'Energy',
        lowLabel: 'Gentle warmth',
        highLabel: 'Can\u2019t sit still',
      },
      {
        type: 'choice',
        id: 'energyFeeling',
        prompt: 'Are you enjoying this, or does it feel like too much?',
        journalLabel: 'Energy feeling',
        showWhen: (state) => state.energy >= 7 && state.energy <= 9,
        options: [
          { value: 'enjoying', label: 'I\u2019m enjoying it' },
          { value: 'too-much', label: 'It feels like too much' },
        ],
      },
      {
        type: 'result',
        resolve: resolveFeelGood,
      },
    ],
  },

  // ============================================
  // FOLLOW-UP-ONLY CATEGORIES
  // These two categories appear ONLY during the post-session follow-up
  // helper modal. They use follow-up time windows (acute/early/mid/late)
  // computed from days since session completion.
  // ============================================
  {
    id: 'low-mood',
    phases: ['follow-up'],
    icon: 'RainCloudIcon',
    label: 'Low mood',
    description: 'Feeling down, flat, or emotionally depleted',
    expandedDescription:
      "My mood has dropped since the session. I feel flat, sad, anxious, or irritable, and it\u2019s weighing on me.",
    acknowledgeText: 'You checked in, and that matters. Come back if anything shifts.',
    steps: [
      {
        type: 'rating',
        id: 'severity',
        prompt: 'How low is your mood right now?',
        journalLabel: 'Severity',
      },
      {
        type: 'choice',
        id: 'quality',
        prompt: 'What does it feel like?',
        journalLabel: 'Quality',
        showWhen: (state) => state.severity >= 1 && state.severity <= 9,
        options: [
          { value: 'flat', label: 'Flat and empty' },
          { value: 'sad', label: 'Sad or tearful' },
          { value: 'irritable', label: 'Irritable and on edge' },
          { value: 'anxious', label: 'Anxious or unsettled' },
          { value: 'hopeless', label: 'Hopeless' },
        ],
      },
      {
        type: 'choice',
        id: 'functioning',
        prompt: 'How much is this affecting your daily life?',
        journalLabel: 'Functioning',
        showWhen: (state) => state.severity >= 4 && state.severity <= 9,
        options: [
          { value: 'managing', label: "I\u2019m getting through my day, but it\u2019s hard" },
          { value: 'struggling', label: "I\u2019m having trouble doing basic things" },
          { value: 'cant-function', label: 'I can barely function' },
        ],
      },
      {
        type: 'result',
        resolve: resolveLowMood,
      },
    ],
  },
  {
    id: 'integration-difficulty',
    phases: ['follow-up'],
    icon: 'OrigamiIcon',
    label: 'Integration',
    description: 'Struggling to process the experience',
    expandedDescription:
      "I\u2019m finding it hard to process what happened during my session, or to turn what I experienced into something useful in my daily life.",
    acknowledgeText: 'Integration takes time. There\u2019s no rush to make sense of everything right away.',
    steps: [
      {
        type: 'rating',
        id: 'stuckness',
        prompt: 'How stuck do you feel?',
        journalLabel: 'Stuckness',
      },
      {
        type: 'choice',
        id: 'stuckType',
        prompt: 'Which of these is closest to what you\u2019re experiencing?',
        journalLabel: 'Stuck type',
        showWhen: (state) => state.stuckness >= 1 && state.stuckness <= 9,
        options: [
          { value: 'fading', label: 'The insights are fading' },
          { value: 'overwhelmed', label: "Too much came up and I don\u2019t know where to start" },
          { value: 'nothing-changed', label: 'I understand what happened but nothing has changed' },
          { value: 'confused', label: "I don\u2019t understand what I experienced" },
          { value: 'avoidant', label: 'I keep avoiding the integration work' },
        ],
      },
      {
        type: 'result',
        resolve: resolveIntegrationDifficulty,
      },
    ],
  },
];

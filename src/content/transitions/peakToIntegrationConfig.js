/**
 * Peak-to-Integration Transition — Content config
 *
 * User-facing name: "Synthesis Transition". Internal name uses `integration`
 * per project terminology convention.
 *
 * Peak → Integration transition. Triggered when
 * phaseTransitions.activeTransition === 'peak-to-integration'.
 * Completion fires transitionToIntegration() on the session store.
 *
 * Imports and spreads 6 tailored activity content files at the end of the
 * sections array. The bridge choice routes to the matching activity (gated
 * by effectiveFocus) with bookmark: true, returning to the post-bridge flow.
 *
 * Full copy in transition-copy-document.md → Synthesis Transition.
 */

import { FOCUS_OPTIONS, RELATIONSHIP_TYPES } from './shared';
import { letterUnsentSections } from './tailored/letterUnsent';
import { innerDialogueSections } from './tailored/innerDialogue';
import { releaseKeepSections } from './tailored/releaseKeep';
import { reclaimingSections } from './tailored/reclaiming';
import { sittingWithMysterySections } from './tailored/sittingWithMystery';
import { openReflectionSections } from './tailored/openReflection';

export const peakToIntegrationConfig = {
  id: 'peak-to-integration',

  onComplete: (store) => store.transitionToIntegration(),

  animation: 'sunset',

  statusBar: {
    leftLabel: 'Transition',
    showSessionElapsed: true,
  },

  skip: {
    allowed: true,
    confirmMessage: 'Skip the transition and go directly to the synthesis phase?',
  },

  journal: {
    saveOnComplete: true,
    titlePrefix: 'SYNTHESIS TRANSITION',
  },

  sections: [
    // ── Screen 1: The Peak Is Softening (welcome / orientation) ────────────
    // Reassurance first — orient the user to where they are in the session
    // before showing the recap stats.
    {
      id: 'softening',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'The Peak Is Softening', animation: 'sunset' },
            { type: 'text', lines: [
              'The intensity is beginning to ease, but the openness remains. This is a valuable window. You still have access to what you experienced, and now you have the clarity to reflect on it.',
            ] },
          ],
        },
      ],
    },

    // ── Screen 2: Phase Recap ──────────────────────────────────────────────
    {
      id: 'phase-recap',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'The Peak', animation: 'sunset' },
            { type: 'text', lines: [
              'A look at what you moved through during the peak — the time you spent, what you engaged with.',
            ] },
            { type: 'phase-recap', scope: 'peak', showHelperCount: true },
          ],
        },
      ],
    },

    // ── Screen 3: Permission (Don't Hold On) ────────────────────────────────
    {
      id: 'permission',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: "You Don't Need to Hold On", animation: 'sunset' },
            { type: 'text', lines: [
              "There can be a pull to capture every insight, to hold tightly to what you felt. You don't need to do that. What matters will stay with you. Some things will surface in the days ahead that you couldn't have anticipated now.",
              '§',
              'Your job in this phase is not to preserve the peak. It is to let things settle into their natural shape.',
            ] },
          ],
        },
      ],
    },

    // ── Screen 4: Return to Intention ───────────────────────────────────────
    {
      id: 'intention-checkin',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Your Intention', animation: 'sunset' },
            { type: 'text',
              condition: { storeValue: 'sessionProfile.holdingQuestion' },
              lines: ['Before your session, you set this intention:'] },
            { type: 'store-display',
              storeKey: 'sessionProfile.holdingQuestion',
              emptyText: '(No intention was set at the start of the session.)',
              style: 'accent-box',
            },
            { type: 'text', lines: [
              'Has anything shifted? Would you like to add to what you wrote?',
            ] },
            { type: 'prompt',
              prompt: '',
              placeholder: "What I'd like to add...",
              storeField: 'transitionData.intentionAdditions.integration',
            },
          ],
        },
      ],
    },

    // ── Screen 5: Focus Confirmation ────────────────────────────────────────
    {
      id: 'focus-confirm',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Your Focus', animation: 'sunset' },
            { type: 'text', lines: [
              'When you began, you said you were drawn to this session for:',
            ] },
            { type: 'store-display',
              storeKey: 'sessionProfile.primaryFocus',
              emptyText: 'Open exploration',
              style: 'accent-box',
              labelMap: {
                'self-understanding': 'Understanding myself more deeply',
                'relationship': 'A relationship in my life',
                'healing': "Processing something I've been carrying",
                'processing': "Processing something I've been carrying",
                'reconnecting': 'Reconnecting with a part of myself',
                'creativity': 'Something creative or existential',
                'open': 'I want to stay open',
              },
            },
            { type: 'text', lines: [
              'Does this still feel true? Or did something else become more important during the peak?',
            ] },
            { type: 'choice', key: 'focusChoice',
              options: [
                { id: 'keep', label: 'This still feels right' },
                { id: 'change', label: 'Something else came into focus',
                  route: { to: 'focus-edit', bookmark: true } },
              ],
            },
          ],
        },
      ],
    },

    // ── Screen 5B: Focus Edit (detour) ──────────────────────────────────────
    {
      id: 'focus-edit',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'What Came Into Focus?', animation: 'sunset' },
            { type: 'text', lines: [
              "That's completely normal. Sessions often reveal what actually needs attention.",
              '§',
              'What feels most important now?',
            ] },
            { type: 'selector', key: 'newFocus',
              columns: 1,
              multiSelect: false,
              prompt: '',
              options: FOCUS_OPTIONS,
            },
          ],
        },
        // Screen 5C — Relationship type (conditional on newFocus === 'relationship')
        {
          condition: { key: 'newFocus', equals: 'relationship' },
          blocks: [
            { type: 'header', title: 'Who Is It?', animation: 'sunset' },
            { type: 'text', lines: ['Who is the relationship with?'] },
            { type: 'selector', key: 'newRelationshipType',
              columns: 1,
              multiSelect: false,
              prompt: '',
              options: RELATIONSHIP_TYPES,
            },
          ],
        },
      ],
    },

    // ── Screen 6: Body Check-In (3rd) ──────────────────────────────────────
    {
      id: 'body-check-in-3',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Your Body Now', animation: 'sunset' },
            { type: 'text', lines: [
              "Let's check in with your body one more time. The intensity is different now. What do you notice?",
            ] },
            { type: 'body-check-in',
              phase: 'integration',
              instruction: 'Tap any that resonate.',
            },
          ],
        },
      ],
    },

    // ── Screen 7: Body Comparison ───────────────────────────────────────────
    {
      id: 'body-comparison-3',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Your Body Across the Session', animation: 'sunset' },
            { type: 'body-check-in',
              mode: 'comparison',
              comparisonPhases: ['opening', 'peak', 'integration'],
            },
          ],
        },
      ],
    },

    // ── Screen 8: Bridge / Tailored Activity Offer ──────────────────────────
    {
      id: 'bridge',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'A Moment of Reflection', animation: 'sunset' },

            // Focus-specific bridge text (6 variants)
            { type: 'text',
              condition: { storeValue: 'sessionData.effectiveFocus', equals: 'relationship' },
              lines: [
                'You came to this session with a relationship on your mind. One thing that can help during this window is writing to that person. Not to send. Just to clarify what\'s true for you.',
                '§',
                'Would you like to try this?',
              ] },

            { type: 'text',
              condition: { storeValue: 'sessionData.effectiveFocus', equals: 'self-understanding' },
              lines: [
                'You came to this session wanting to understand yourself more deeply. One way to work with what\'s here is to let different parts of yourself speak. A kind of inner dialogue between the part that questions and the part that knows.',
                '§',
                'Would you like to try this?',
              ] },

            { type: 'text',
              condition: { or: [
                { storeValue: 'sessionData.effectiveFocus', equals: 'processing' },
                { storeValue: 'sessionData.effectiveFocus', equals: 'healing' },
              ] },
              lines: [
                'You came to this session carrying something you wanted to process. One way to work with what\'s here is to notice what you\'re ready to let go of, and what you want to keep.',
                '§',
                'Would you like to try this?',
              ] },

            { type: 'text',
              condition: { storeValue: 'sessionData.effectiveFocus', equals: 'reconnecting' },
              lines: [
                'You came to this session wanting to reconnect with yourself. One way to work with what\'s here is to reclaim something you\'ve lost touch with. A feeling, a quality, a part of who you are.',
                '§',
                'Would you like to try this?',
              ] },

            { type: 'text',
              condition: { storeValue: 'sessionData.effectiveFocus', equals: 'creativity' },
              lines: [
                'You came to this session open to deeper questions. One way to work with what\'s here is to sit with what you encountered. Vision, meaning, mystery.',
                '§',
                'Would you like to try this?',
              ] },

            { type: 'text',
              condition: { storeValue: 'sessionData.effectiveFocus', equals: 'open' },
              lines: [
                'You came to this session without a fixed agenda. That takes trust. Even without a specific direction, something usually emerges. Would you like to take a few minutes to capture what came through?',
              ] },

            // Focus-gated choice options — only the option matching effectiveFocus shows
            { type: 'choice', key: 'tailoredChoice',
              options: [
                { id: 'relationship-yes', label: "Yes, I'd like to write",
                  condition: { storeValue: 'sessionData.effectiveFocus', equals: 'relationship' },
                  route: { to: 'letter-intro', bookmark: true } },
                { id: 'self-understanding-yes', label: "Yes, I'd like to try",
                  condition: { storeValue: 'sessionData.effectiveFocus', equals: 'self-understanding' },
                  route: { to: 'dialogue-intro', bookmark: true } },
                { id: 'processing-yes', label: "Yes, I'd like to explore",
                  condition: { or: [
                    { storeValue: 'sessionData.effectiveFocus', equals: 'processing' },
                    { storeValue: 'sessionData.effectiveFocus', equals: 'healing' },
                  ] },
                  route: { to: 'release-keep-intro', bookmark: true } },
                { id: 'reconnecting-yes', label: "Yes, I'd like to try",
                  condition: { storeValue: 'sessionData.effectiveFocus', equals: 'reconnecting' },
                  route: { to: 'reclaiming-intro', bookmark: true } },
                { id: 'creativity-yes', label: "Yes, I'd like to explore",
                  condition: { storeValue: 'sessionData.effectiveFocus', equals: 'creativity' },
                  route: { to: 'mystery-intro', bookmark: true } },
                { id: 'open-yes', label: "Yes, I'd like to reflect",
                  condition: { storeValue: 'sessionData.effectiveFocus', equals: 'open' },
                  route: { to: 'open-reflection-intro', bookmark: true } },
                { id: 'no', label: 'Continue without' },
              ],
            },
          ],
        },
      ],
    },

    // ── Screen 9: Journaling Detour Gate ────────────────────────────────────
    {
      id: 'journaling-gate',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'text', lines: [
              "Would you like to pause here for a few minutes of writing? These prompts are designed for this moment in the session, when the peak is still close but clarity is returning.",
            ] },
            { type: 'choice', key: 'wantsJournaling',
              options: [
                { id: 'yes', label: "Yes, I'd like to write",
                  route: { to: 'synthesis-journaling', bookmark: true } },
                { id: 'no', label: 'Continue without' },
              ],
            },
          ],
        },
      ],
    },

    // ── Screen 10: Adaptive Content ─────────────────────────────────────────
    {
      id: 'adaptive',
      type: 'screens',
      screens: [
        // Values Compass completed during peak
        {
          condition: { moduleCompleted: 'values-compass' },
          blocks: [
            { type: 'header', title: 'Your Values', animation: 'sunset' },
            { type: 'text', lines: [
              'Earlier, you mapped what matters most to you. As you move into a quieter phase, notice if those values feel different now. Sometimes the peak reshapes what we thought we knew about ourselves.',
            ] },
          ],
        },
        // Protector Dialogue completed
        {
          condition: { moduleCompleted: 'protector-dialogue' },
          blocks: [
            { type: 'header', title: 'Parts That Spoke', animation: 'sunset' },
            { type: 'text', lines: [
              'You met a part of yourself today. As the session softens, that part might still have something to say. You don\'t need to seek it out. Just notice if it surfaces.',
            ] },
          ],
        },
        // Stay With It completed
        {
          condition: { moduleCompleted: 'stay-with-it' },
          blocks: [
            { type: 'header', title: 'Staying With It', animation: 'sunset' },
            { type: 'text', lines: [
              'You practiced staying with difficulty during the peak. That skill stays with you beyond this session. It becomes easier to access with time.',
            ] },
          ],
        },
        // Helper Modal used during peak
        {
          condition: { helperUsedDuring: 'peak' },
          blocks: [
            { type: 'header', title: 'Reaching Out', animation: 'sunset' },
            { type: 'text', lines: [
              'During the peak, you reached out for support. That is not weakness. Knowing when to ask for help is one of the most important skills you can carry out of this session.',
            ] },
          ],
        },
      ],
    },

    // ── Screen 11: Nourish Yourself ─────────────────────────────────────────
    {
      id: 'nourish',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Nourish Yourself', animation: 'sunset' },
            { type: 'text', lines: [
              'Take a moment to drink some water. If you feel ready, have a small snack. Fruit, nuts, or something simple.',
              '§',
              'Your body has been working hard. Give it what it needs.',
            ] },
          ],
        },
      ],
    },

    // ── Screen 12: Enter Synthesis Phase ────────────────────────────────────
    {
      id: 'begin-integration',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Enter Synthesis Phase', animation: 'sunset' },
            { type: 'text', lines: [
              'The synthesis phase is about letting things settle. The emotional depth of the peak is still present, but your thinking mind is returning. The meeting of those two things is where the most useful work often happens.',
              '§',
              'There may be activities ahead, or you may want open space. Follow what feels right.',
            ] },
          ],
        },
      ],
    },

    // ── DETOUR: Synthesis Journaling ─────────────────────────────────────────
    {
      id: 'synthesis-journaling',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Synthesis Reflection', animation: 'sunset' },
            { type: 'text', lines: [
              'Take a few minutes to write. You don\'t need complete thoughts. Fragments and impressions are enough.',
            ] },
            { type: 'prompt',
              prompt: 'What did the peak show you that you didn\'t expect?',
              placeholder: 'What surprised me...',
            },
          ],
        },
        {
          blocks: [
            { type: 'prompt',
              prompt: 'Is there something you\'re carrying that you\'re ready to set down?',
              placeholder: "What I'm ready to let go of...",
            },
          ],
        },
        {
          blocks: [
            { type: 'prompt',
              prompt: 'What do you want to carry forward from today?',
              placeholder: 'What I want to keep...',
            },
          ],
        },
      ],
    },

    // ── DETOURS: Tailored activity sections (one per focus) ──────────────────
    ...letterUnsentSections,
    ...innerDialogueSections,
    ...releaseKeepSections,
    ...reclaimingSections,
    ...sittingWithMysterySections,
    ...openReflectionSections,
  ],
};

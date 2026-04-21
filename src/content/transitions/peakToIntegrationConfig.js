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
 * Routing model:
 *   - Main flow is linear: softening → phase-recap → body-check-ins →
 *     intention-checkin → focus-confirm → bridge → adaptive → nourish →
 *     begin-integration (terminal).
 *   - focus-confirm routes to one of two tail detours depending on choice:
 *     - keep + relationship focus → relationship-type detour (sub-type only)
 *     - change → focus-edit detour (focus selector + progressive-reveal
 *       sub-type selector appears below via persistBlocks)
 *     Both bookmark back to `bridge`.
 *   - bridge routes to the focus-specific tailored activity (one of 5) via
 *     `bookmark: true`. Each tailored activity is a single section with
 *     multiple screens so the bookmark pops only once the full activity
 *     completes; the user returns to `adaptive` afterward.
 *
 * Full copy in transition-copy-document.md → Synthesis Transition.
 */

import { FOCUS_OPTIONS, RELATIONSHIP_TYPES, FOCUS_SUBTYPES } from './shared';
import { letterUnsentSections } from './tailored/letterUnsent';
import { innerDialogueSections } from './tailored/innerDialogue';
import { releaseKeepSections } from './tailored/releaseKeep';
import { sittingWithMysterySections } from './tailored/sittingWithMystery';
import { openReflectionSections } from './tailored/openReflection';

// Shared core blocks for focus-edit (header + text + newFocus selector).
// Reused across screen 0 and 1 so that React's keyed reconciliation (under
// `persistBlocks: true`) keeps the focus selector mounted when transitioning.
const FOCUS_EDIT_CORE_BLOCKS = [
  { type: 'header', title: 'What Came Into Focus?', animation: 'sunset' },
  { type: 'text', lines: [
    "That's completely normal. Sessions often reveal what actually needs attention.",
    '§',
    'What feels most important now?',
  ] },
  { type: 'selector', key: 'newFocus',
    columns: 1, multiSelect: false, prompt: '',
    storeField: 'transitionData.newFocus',
    journalLabel: 'Focus',
    options: FOCUS_OPTIONS },
];

// Five mutually-exclusive sub-type selectors, one per focus. Block-level
// `condition: { key: 'newFocus', equals: X }` ensures only the one matching
// the user's picked focus is visible at any time. All share `key: 'focusSubtype'`
// and `storeField: 'transitionData.focusSubtype'` so the picked sub-type
// writes to a single field regardless of which focus surfaced the selector.
const SUBTYPE_SELECTOR_BLOCKS = [
  { type: 'selector', key: 'focusSubtype',
    condition: { key: 'newFocus', equals: 'self-understanding' },
    storeField: 'transitionData.focusSubtype',
    columns: 1, multiSelect: false,
    prompt: 'What part of yourself are you exploring?',
    journalLabel: 'Sub-focus',
    options: FOCUS_SUBTYPES['self-understanding'] },

  { type: 'selector', key: 'focusSubtype',
    condition: { key: 'newFocus', equals: 'healing' },
    storeField: 'transitionData.focusSubtype',
    columns: 1, multiSelect: false,
    prompt: 'What are you working with?',
    journalLabel: 'Sub-focus',
    options: FOCUS_SUBTYPES['healing'] },

  { type: 'selector', key: 'focusSubtype',
    condition: { key: 'newFocus', equals: 'relationship' },
    storeField: 'transitionData.focusSubtype',
    columns: 1, multiSelect: false,
    prompt: 'Who is the relationship with?',
    journalLabel: 'Relationship with',
    options: FOCUS_SUBTYPES['relationship'] },

  { type: 'selector', key: 'focusSubtype',
    condition: { key: 'newFocus', equals: 'creativity' },
    storeField: 'transitionData.focusSubtype',
    columns: 1, multiSelect: false,
    prompt: 'What is calling your attention?',
    journalLabel: 'Sub-focus',
    options: FOCUS_SUBTYPES['creativity'] },

  { type: 'selector', key: 'focusSubtype',
    condition: { key: 'newFocus', equals: 'open' },
    storeField: 'transitionData.focusSubtype',
    columns: 1, multiSelect: false,
    prompt: 'What best describes your orientation?',
    journalLabel: 'Sub-focus',
    options: FOCUS_SUBTYPES['open'] },
];

export const peakToIntegrationConfig = {
  id: 'peak-to-integration',

  onComplete: (store) => store.transitionToIntegration(),

  animation: 'sunset',

  statusBar: {
    leftLabel: 'Synthesis Transition',
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
    // ── 1. The Peak Is Softening ───────────────────────────────────────────
    {
      id: 'softening',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'The Peak Is Softening', animation: 'sunset' },
            { type: 'text', lines: [
              'The intensity is beginning to ease, but the openness remains.',
              '§',
              'This is a valuable window.',
              '§',
              'You still have access to what you experienced and may now have more clarity to reflect on it.',
              '§',
              'We call this phase Synthesis, where you can begin to bridge worlds and create something out of the intensity of the early session.',
            ] },
          ],
        },
      ],
    },

    // ── 2. Phase Recap ─────────────────────────────────────────────────────
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

    // ── 3. Body Check-In (3rd) ─────────────────────────────────────────────
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

    // ── 4. Body Comparison ─────────────────────────────────────────────────
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

    // ── 5. Synthesis Touchstone ────────────────────────────────────────────
    // Progressive reveal: user writes their synthesis touchstone → Continue
    // reveals the peak touchstone beneath → Continue reveals the opening
    // touchstone → Continue reveals a framing text + reflection prompt.
    // Each Continue press uses the persistBlocks auto-scroll so the new
    // block eases into view. Mirrors the Closing Ritual's cairn pattern at
    // a smaller scale (no synthesis/closing entries yet — those come later).
    {
      id: 'synthesis-touchstone',
      type: 'screens',
      persistBlocks: true,
      ritualFade: true,
      screens: (() => {
        const HEADER = { type: 'header', title: 'Synthesis Touchstone', animation: 'sunset' };
        const INTRO = { type: 'text', lines: [
          'Another touchstone, an automatic response to what you feel now.',
        ] };
        const SYNTHESIS_PROMPT = {
          type: 'prompt',
          prompt: 'Without overthinking it, what calls to you in this moment?',
          placeholder: 'A word or phrase...',
          rows: 3,
          storeField: 'transitionData.synthesisTouchstone',
          journalLabel: 'Synthesis touchstone',
        };
        const PEAK_DISPLAY = { type: 'store-display',
          storeKey: 'transitionData.peakTouchstone',
          leftLabel: 'Peak Transition',
          emptyText: '(no touchstone)',
          style: 'accent-box' };
        const OPENING_DISPLAY = { type: 'store-display',
          storeKey: 'transitionData.openingTouchstone',
          leftLabel: 'Opening Ritual',
          emptyText: '(no touchstone)',
          style: 'accent-box' };
        const FRAMING = { type: 'text', lines: [
          "A touchstone is a quick gut-check. Rather than reasoning through how you feel, it bypasses the intellectualizing and taps straight into your automatic reaction to the moment.",
        ] };
        const REFLECTION_PROMPT = {
          type: 'prompt',
          prompt: 'Do you notice anything when viewing these touchstones together?',
          placeholder: 'What I notice...',
          journalLabel: 'Synthesis touchstone reflection',
        };
        const BASE = [HEADER, INTRO, SYNTHESIS_PROMPT];
        return [
          { blocks: [...BASE] },
          { blocks: [...BASE, PEAK_DISPLAY] },
          { blocks: [...BASE, PEAK_DISPLAY, OPENING_DISPLAY] },
          { blocks: [...BASE, PEAK_DISPLAY, OPENING_DISPLAY, FRAMING, REFLECTION_PROMPT] },
        ];
      })(),
    },

    // ── 6. Return to Intention ─────────────────────────────────────────────
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
            { type: 'text',
              header: 'Has anything shifted? Would you like to add to what you wrote?' },
            { type: 'prompt',
              prompt: '',
              placeholder: "What I'd like to add...",
              storeField: 'transitionData.intentionAdditions.integration',
              journalLabel: 'Intention addition',
            },
          ],
        },
      ],
    },

    // ── 7. Focus Confirmation ──────────────────────────────────────────────
    // Three choice options, two of which are conditional:
    //   - keep-relationship  (effectiveFocus === 'relationship') routes to
    //     the relationship-type detour for sub-type capture.
    //   - keep               (effectiveFocus !== 'relationship') has no route,
    //     sequential advance → bridge.
    //   - change             routes to focus-edit detour.
    // Per-option `condition` filtering is applied in ScreensSection before
    // passing options into ChoiceBlock, so only one keep-variant shows.
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
              journalLabel: 'Original focus',
              labelMap: {
                'self-understanding': 'Understanding myself more deeply',
                'healing':            "Processing something I've been carrying",
                'relationship':       'A relationship in my life',
                'creativity':         'Something creative or existential',
                'open':               'Staying open to what comes',
              },
            },
            { type: 'text', lines: [
              'Does this still feel true? Or did something else become more important during the peak?',
            ] },
            { type: 'choice', key: 'focusChoice',
              options: [
                { id: 'keep-relationship',
                  label: 'This still feels right',
                  condition: { storeValue: 'effectiveFocus', equals: 'relationship' },
                  route: { to: 'relationship-type', bookmark: 'bridge' } },

                { id: 'keep',
                  label: 'This still feels right',
                  condition: { not: { storeValue: 'effectiveFocus', equals: 'relationship' } } },

                { id: 'change',
                  label: 'Something else came into focus',
                  route: { to: 'focus-edit', bookmark: 'bridge' } },
              ],
            },
          ],
        },
      ],
    },

    // ── 8. Bridge — Tailored Activity Offer ────────────────────────────────
    // Focus-specific text + one activity option. Only one Yes option is
    // visible at a time thanks to per-option condition filtering in
    // ScreensSection. Net UX: one focus-tailored paragraph + one Yes button
    // + "Continue without".
    {
      id: 'bridge',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'A Moment of Reflection', animation: 'sunset' },

            // Phrased in the present — "you may be/have" — so the copy reads
            // naturally whether the user kept their original intake focus or
            // changed to this one during focus-edit. No "you came to this
            // session…" origin framing.
            { type: 'text',
              condition: { storeValue: 'effectiveFocus', equals: 'relationship' },
              lines: [
                'You may have a relationship on your mind. One thing that can help during this window is writing to that person. Not to send. Just to clarify what\'s true for you.',
              ] },

            { type: 'text',
              condition: { storeValue: 'effectiveFocus', equals: 'self-understanding' },
              lines: [
                'You may be wanting to understand yourself more deeply. One way to work with what\'s here is to let different parts of yourself speak. A kind of inner dialogue between the part that questions and the part that knows.',
              ] },

            { type: 'text',
              condition: { storeValue: 'effectiveFocus', equals: 'healing' },
              lines: [
                'You may be carrying something you want to process. One way to work with what\'s here is to notice what you\'re ready to let go of, and what you want to keep.',
              ] },

            { type: 'text',
              condition: { storeValue: 'effectiveFocus', equals: 'creativity' },
              lines: [
                'You may be holding deeper questions. One way to work with what\'s here is to sit with what you encountered. Vision, meaning, mystery.',
              ] },

            { type: 'text',
              condition: { storeValue: 'effectiveFocus', equals: 'open' },
              lines: [
                'You may be moving without a fixed agenda. Even without a specific direction, something usually emerges — and there\'s an activity designed to help you capture it.',
              ] },

            // Universal handoff — sits above the choice buttons regardless of
            // focus, framing the activity offer below.
            { type: 'text', lines: [
              'Based on your focus, the activity below may be helpful to explore it further. You can also choose to continue if you wish.',
            ] },

            { type: 'choice', key: 'tailoredChoice',
              options: [
                // Labels match each activity's title so the user sees exactly
                // what they're choosing to explore, not a generic "Yes".
                { id: 'relationship-yes', label: "A letter you don't have to send",
                  condition: { storeValue: 'effectiveFocus', equals: 'relationship' },
                  route: { to: 'letter-unsent', bookmark: true } },
                { id: 'self-understanding-yes', label: 'A conversation with yourself',
                  condition: { storeValue: 'effectiveFocus', equals: 'self-understanding' },
                  route: { to: 'inner-dialogue', bookmark: true } },
                { id: 'healing-yes', label: 'What stays, what goes',
                  condition: { storeValue: 'effectiveFocus', equals: 'healing' },
                  route: { to: 'release-keep', bookmark: true } },
                { id: 'creativity-yes', label: 'Sitting with mystery',
                  condition: { storeValue: 'effectiveFocus', equals: 'creativity' },
                  route: { to: 'sitting-with-mystery', bookmark: true } },
                { id: 'open-yes', label: 'What emerged',
                  condition: { storeValue: 'effectiveFocus', equals: 'open' },
                  route: { to: 'open-reflection', bookmark: true } },
                { id: 'no', label: 'Continue without' },
              ],
            },
          ],
        },
      ],
    },

    // ── 9. Adaptive Content ────────────────────────────────────────────────
    {
      id: 'adaptive',
      type: 'screens',
      screens: [
        {
          condition: { moduleCompleted: 'values-compass' },
          blocks: [
            { type: 'header', title: 'Your Values', animation: 'sunset' },
            { type: 'text', lines: [
              'Earlier, you mapped what matters most to you. As you move into a quieter phase, notice if those values feel different now. Sometimes the peak reshapes what we thought we knew about ourselves.',
            ] },
          ],
        },
        {
          condition: { moduleCompleted: 'protector-dialogue' },
          blocks: [
            { type: 'header', title: 'Parts That Spoke', animation: 'sunset' },
            { type: 'text', lines: [
              'You met a part of yourself today. As the session softens, that part might still have something to say. You don\'t need to seek it out. Just notice if it surfaces.',
            ] },
          ],
        },
        {
          condition: { moduleCompleted: 'stay-with-it' },
          blocks: [
            { type: 'header', title: 'Staying With It', animation: 'sunset' },
            { type: 'text', lines: [
              'You practiced staying with difficulty during the peak. That skill stays with you beyond this session. It becomes easier to access with time.',
            ] },
          ],
        },
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

    // ── 10. Nourish Yourself ──────────────────────────────────────────────
    // (Bridge is 8, Adaptive is 9, Nourish is 10 — the comment was already
    //  correct for its final position.)
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

    // ── 11. Enter Synthesis Phase (terminal) ───────────────────────────────
    // `terminal: true` stops sequential advance from walking into the tail
    // detours (focus-edit, relationship-type, tailored activities) that
    // follow in the array. Continue is relabeled to "Complete".
    {
      id: 'begin-integration',
      type: 'screens',
      ritualFade: true,
      terminal: true,
      primaryLabel: 'Complete',
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

    // ─── TAIL DETOURS ──────────────────────────────────────────────────────

    // Focus edit (reached from focus-confirm 'change').
    // Two-screen progressive reveal via `persistBlocks: true`. Screen 0 is
    // just the core blocks (focus selector). Screen 1 re-renders the core
    // blocks (React reuses DOM thanks to persistBlocks) and adds 5
    // conditional sub-type selectors beneath — only the one matching the
    // picked `newFocus` renders.
    {
      id: 'focus-edit',
      type: 'screens',
      persistBlocks: true,
      ritualFade: true,
      screens: [
        { blocks: [...FOCUS_EDIT_CORE_BLOCKS] },
        { blocks: [...FOCUS_EDIT_CORE_BLOCKS, ...SUBTYPE_SELECTOR_BLOCKS] },
      ],
    },

    // Relationship type (reached from focus-confirm 'keep-relationship').
    // Single-screen section — user's focus is unchanged (still relationship),
    // they just pick the sub-type and continue. Shares `focusSubtype` with
    // focus-edit so the field is the single source of truth for sub-type.
    {
      id: 'relationship-type',
      type: 'screens',
      ritualFade: true,
      screens: [{
        blocks: [
          { type: 'header', title: 'Who Is It?', animation: 'sunset' },
          { type: 'text',
            header: 'Who is the relationship with?' },
          { type: 'selector', key: 'focusSubtype',
            columns: 1, multiSelect: false, prompt: '',
            storeField: 'transitionData.focusSubtype',
            journalLabel: 'Relationship with',
            options: RELATIONSHIP_TYPES },
        ],
      }],
    },

    // Tailored activities (one per focus; reached from bridge with
    // `bookmark: true`). Each is a single section with multiple screens so
    // the bookmark only pops once the whole activity completes, returning
    // the user to `adaptive` (the section after bridge in main flow).
    ...letterUnsentSections,
    ...innerDialogueSections,
    ...releaseKeepSections,
    ...sittingWithMysterySections,
    ...openReflectionSections,
  ],
};

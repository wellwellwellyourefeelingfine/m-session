/**
 * Peak Transition — Content config
 *
 * Come-Up → Peak transition. Triggered when phaseTransitions.activeTransition === 'come-up-to-peak'.
 * Completion fires transitionToPeak() on the session store.
 *
 * Full copy in transition-copy-document.md → Peak Transition.
 */

export const peakTransitionConfig = {
  id: 'peak-transition',

  onComplete: (store) => store.transitionToPeak(),

  animation: 'full-sun',

  statusBar: {
    leftLabel: 'Peak Transition',
    showSessionElapsed: true,
  },

  skip: {
    allowed: true,
    confirmMessage: 'Skip the transition and go directly to peak?',
  },

  journal: {
    saveOnComplete: true,
    titlePrefix: 'PEAK TRANSITION',
  },

  sections: [
    // ── Screen 1: You've Arrived (welcome / orientation) ──────────────────
    // Reassurance first — ground the user in where they are before showing stats.
    {
      id: 'arrived',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: "You've Arrived", animation: 'full-sun' },
            { type: 'text', lines: [
              'Something has shifted. You may have felt it building gradually or it may have arrived all at once.',
              '§',
              "However you got here, you don't need to figure anything out right now. Let the experience unfold. Be open to what arises. Curious about thoughts and feelings, without needing to direct them.",
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
            { type: 'header', title: 'The Come-Up', animation: 'full-sun' },
            { type: 'text', lines: [
              'A brief look back at the time you just spent and what you moved through.',
            ] },
            { type: 'phase-recap', scope: 'come-up' },
          ],
        },
      ],
    },

    // ── Screen 3: Body Check-In (2nd) ─────────────────────────────────────
    {
      id: 'body-check-in-2',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Your Body Now', animation: 'full-sun' },
            { type: 'text', lines: [
              'At the beginning of your session, we asked what you were feeling in your body. Let\'s come back to this. What sensations are present now?',
            ] },
            { type: 'body-check-in',
              phase: 'peak',
              instruction: 'Tap any that resonate.',
            },
          ],
        },
      ],
    },

    // ── Screen 4: Body Comparison ──────────────────────────────────────────
    {
      id: 'body-comparison-2',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: "What's Changed", animation: 'full-sun' },
            { type: 'body-check-in',
              mode: 'comparison',
              comparisonPhases: ['opening', 'peak'],
            },
          ],
        },
      ],
    },

    // ── Screen 5: Touchstone 2 ────────────────────────────────────────────
    // Mirrors the Opening Ritual's Touchstone page. User writes a word or
    // phrase; first Continue press saves it (via touchstone-prompt's
    // setPrimaryOverride) and transforms the textarea into an accent display.
    // Comparison text + expandable 1st-touchstone reveal fade in beneath
    // (gated on both touchstones being set). Second Continue advances.
    {
      id: 'peak-touchstone',
      type: 'screens',
      ritualFade: true,
      persistBlocks: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Touchstone Two', animation: 'full-sun' },
            { type: 'text', lines: [
              "Let's follow up with another touchstone.",
            ] },
            // DM Serif question, rendered via TextBlock's `header` field (same
            // styling as the prompt-question font used elsewhere).
            { type: 'text',
              header: "Is there a word or phrase that captures what feels most important to you right now?" },
            { type: 'touchstone-prompt',
              storeField: 'transitionData.peakTouchstone',
              placeholder: 'A word or phrase...',
              rows: 3,
              journalLabel: 'Touchstone 2' },
            // Comparison text + expandable reveal — gated only on the 2nd
            // touchstone being saved. ExpandableStoreDisplayBlock handles the
            // empty-opening-touchstone case internally.
            { type: 'text',
              condition: { storeValue: 'transitionData.peakTouchstone' },
              lines: [
                "If you'd like to, you can take a look at your touchstone from the opening ritual to compare to your touchstone now.",
              ] },
            { type: 'expandable-store-display',
              condition: { storeValue: 'transitionData.peakTouchstone' },
              storeKey: 'transitionData.openingTouchstone',
              showLabel: 'see 1st Touchstone',
              hideLabel: 'hide 1st Touchstone' },
          ],
        },
      ],
    },

    // ── Screen 6: Intention Review ─────────────────────────────────────────
    // Progressive reveal: first Continue press reveals an "Is anything coming
    // up?" prompt beneath the intention display, auto-scrolling into view.
    // Mirrors the Closing Ritual's touchstone-cairn pattern (persistBlocks
    // keeps the header + intention mounted; new blocks fade in below).
    {
      id: 'intention-review',
      type: 'screens',
      persistBlocks: true,
      ritualFade: true,
      screens: (() => {
        const HEADER = { type: 'header', title: 'Your Intention', animation: 'full-sun' };
        const INTRO = { type: 'text',
          condition: { storeValue: 'sessionProfile.holdingQuestion' },
          lines: ['Before your session, you set this intention:'] };
        const INTENTION_DISPLAY = { type: 'store-display',
          storeKey: 'sessionProfile.holdingQuestion',
          emptyText: '(No intention was set at the start of the session.)',
          style: 'accent-box' };
        const ADD_INTRO = { type: 'text',
          header: "Is anything coming up right now that you'd like to add?" };
        const ADD_PROMPT = { type: 'prompt',
          prompt: '',
          placeholder: "What I'd like to add...",
          storeField: 'transitionData.intentionAdditions.peak',
          journalLabel: 'Intention addition (peak)',
        };
        const BASE = [HEADER, INTRO, INTENTION_DISPLAY];
        return [
          { blocks: [...BASE] },
          { blocks: [...BASE, ADD_INTRO, ADD_PROMPT] },
        ];
      })(),
    },

    // ── Screen 7: Reassurance ─────────────────────────────────────────────
    {
      id: 'reassurance',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'This Is Normal', animation: 'full-sun' },
            { type: 'text', lines: [
              'The intensity of this moment can be surprising. You might feel a rush of energy or emotion. You might feel jaw tension, nausea, or a change in temperature. You might feel a quiet shift, or nothing dramatic at all.',
              '§',
              'All of this is the MDMA finding its way through your body. It is not a sign that something is wrong. It is a sign that something is working.',
              '§',
              'You are safe. If it feels like a lot, know that it will soon settle into something workable.',
            ] },
          ],
        },
      ],
    },

    // ── Screen 8: Let It Unfold ───────────────────────────────────────────
    {
      id: 'unfold',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Let It Unfold', animation: 'full-sun' },
            { type: 'text', lines: [
              'Your body might want to move. To stretch, shake, curl up, or dance. Or it might want complete stillness.',
              '§',
              'Follow what feels right. There is no correct way to be in this.',
            ] },
          ],
        },
      ],
    },

    // ── Screen 9: Begin Peak ───────────────────────────────────────────────
    {
      id: 'begin-peak',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Begin', animation: 'full-sun' },
            { type: 'text', lines: [
              "Take a few sips of water if you haven't already. When you're ready, we'll move into the peak phase of your session.",
              '§',
              "The activities ahead are designed for this window of openness. Take what feels right. Leave what doesn't.",
            ] },
          ],
        },
      ],
    },

  ],
};

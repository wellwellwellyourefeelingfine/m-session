/**
 * Opening Ritual — Content config
 *
 * Replaces the old PreSessionIntro component. Renders when
 * `substanceChecklistSubPhase === 'intro'` and fires `startSession()` on completion.
 *
 * Full copy lives in transition-copy-document.md → Opening Ritual section.
 */

export const openingRitualConfig = {
  id: 'opening-ritual',

  // Completion action — fired after exit overlay
  onComplete: (store) => store.startSession(),

  // Sun/moon animation for entrance/exit overlays + header blocks
  animation: 'sunrise',

  statusBar: {
    leftLabel: 'Opening Ritual',
    showSessionElapsed: false,
  },

  skip: {
    allowed: true,
    confirmMessage: 'Skip the opening ritual?',
    gateByReadiness: true,
  },

  journal: {
    saveOnComplete: true,
    titlePrefix: 'OPENING RITUAL',
  },

  sections: [
    // ── Screen 1: Prepare Your Space ────────────────────────────────────────
    {
      id: 'prepare-space',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Your Space', animation: 'sunrise' },
            { type: 'text', lines: [
              'Before we begin, take a moment to prepare where you are.',
              '§',
              'Dim the lights or light a candle. Put your phone on Do Not Disturb. Make sure you have water nearby and something comfortable to wear or wrap around yourself.',
              '§',
              'If you plan to write by hand, have a journal and pen within reach.',
              '§',
              'Take as long as you need. Continue when your space feels ready.',
            ] },
          ],
        },
      ],
    },

    // ── Screen 2: Voice Audio — Opening the Space ──────────────────────────
    {
      id: 'opening-audio',
      type: 'meditation',
      meditationId: 'transition-opening',
      animation: 'sunrise',
      showTranscript: true,
      composerOptions: { skipOpeningGong: true, skipClosingGong: true },
    },

    // ── Screen 3: Body Check-In (1st) ──────────────────────────────────────
    {
      id: 'body-check-in-1',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Your Body Right Now', animation: 'sunrise' },
            { type: 'body-check-in',
              phase: 'opening',
              prompt: 'Take a moment to notice your body. What sensations are present?',
              instruction: 'Tap any that resonate.',
            },
            { type: 'text', lines: [
              "We'll come back to this throughout your session.",
            ] },
          ],
        },
      ],
    },

    // ── Screen 4: Touchstone ───────────────────────────────────────────────
    {
      id: 'touchstone',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Touchstone', animation: 'sunrise' },
            { type: 'text', lines: [
              'Is there a word or phrase that captures what feels most important to you right now? It doesn\'t need to be precise. Just whatever comes.',
            ] },
            { type: 'prompt',
              prompt: '',
              placeholder: 'A word or phrase...',
              storeField: 'transitionData.openingTouchstone',
            },
            { type: 'text', lines: [
              'This will be available as an anchor you can return to at any point during your session.',
            ] },
          ],
        },
      ],
    },

    // ── Screen 5 + 6 merged: intention-moment (adaptive) ───────────────────
    // Two screens within one section, each gated by whether holdingQuestion exists.
    {
      id: 'intention-moment',
      type: 'screens',
      ritualFade: true,
      screens: [
        // Variant A — user has an intention
        {
          condition: { storeValue: 'sessionProfile.holdingQuestion' },
          blocks: [
            { type: 'header', title: 'Your Intention', animation: 'sunrise' },
            { type: 'text', lines: ['During your preparation, you wrote:'] },
            { type: 'store-display',
              storeKey: 'sessionProfile.holdingQuestion',
              emptyText: '',
              style: 'accent-box',
            },
            { type: 'text', lines: [
              'Sit with this for a moment. Does it still feel true?',
            ] },
            { type: 'choice', key: 'intentionAction',
              options: [
                { id: 'keep', label: 'This feels right' },
                { id: 'refine', label: "I'd like to refine it",
                  route: { to: 'intention-review-detour', bookmark: true } },
              ],
            },
          ],
        },

        // Variant B — user has no intention
        {
          condition: { not: { storeValue: 'sessionProfile.holdingQuestion' } },
          blocks: [
            { type: 'header', title: 'An Intention', animation: 'sunrise' },
            { type: 'text', lines: [
              'You haven\'t set an intention for this session yet. An intention is a single thread you can follow through the experience ahead — something you want to understand, release, or move toward.',
              '§',
              'We strongly recommend setting one before you begin. It doesn\'t need to be perfect. Even a rough direction gives the session a center of gravity to return to.',
            ] },
            { type: 'choice', key: 'intentionAction',
              options: [
                { id: 'set', label: 'Set an intention',
                  route: { to: 'intention-review-detour', bookmark: true } },
                { id: 'skip', label: 'Continue without' },
              ],
            },
          ],
        },
      ],
    },

    // ── Screen 7: Centering Breath Detour Gate ─────────────────────────────
    {
      id: 'centering-breath-gate',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'text', lines: [
              'Would you like a brief centering breath before you take your substance? This is a short guided exercise, about three minutes.',
            ] },
            { type: 'choice', key: 'wantsCenteringBreath',
              options: [
                { id: 'yes', label: "Yes, I'd like that",
                  route: { to: 'centering-breath', bookmark: true } },
                { id: 'no', label: 'Continue without' },
              ],
            },
          ],
        },
      ],
    },

    // ── Screen 8: Letting Go ───────────────────────────────────────────────
    {
      id: 'permission',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Letting Go', animation: 'sunrise' },
            { type: 'text', lines: [
              "You've prepared. You've set your intention. Now let it go.",
              '§',
              "You don't need to direct what happens next or make sure it works. The MDMA will soften the part of your mind that reacts to difficult thoughts with avoidance or defense. That process happens on its own.",
              '§',
              'Your only task is to stay present with whatever arises. Curious rather than controlling. Open rather than effortful.',
              '§',
              'If something difficult comes up, stay with it. If something beautiful comes, let it in.',
            ] },
          ],
        },
      ],
    },

    // ── Screen 9: Take Substance ───────────────────────────────────────────
    {
      id: 'substance-intake-record',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: "When You're Ready", animation: 'sunrise' },
            { type: 'text', lines: [
              'There is no rush.',
              '§',
              'Find a comfortable position. Take your substance with a few sips of water.',
            ] },
            { type: 'ingestion-time', mode: 'record' },
          ],
        },
      ],
    },

    // ── Screen 10: Confirm Ingestion Time ──────────────────────────────────
    {
      id: 'substance-intake-confirm',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Start Time', animation: 'sunrise' },
            { type: 'ingestion-time', mode: 'confirm' },
          ],
        },
      ],
    },

    // ── Screen 11: Begin Session ───────────────────────────────────────────
    {
      id: 'begin-session',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'The Session Has Begun', animation: 'sunrise' },
            { type: 'text', lines: [
              'For the next 30 to 60 minutes, the MDMA will come on gradually. Some people feel it quickly. For others it takes longer. There is nothing you need to do during this time except be here.',
              '§',
              'You might want to put on music, close your eyes, or just sit quietly. Follow whatever feels natural.',
            ] },
          ],
        },
      ],
    },

    // ─── DETOUR: Centering Breath ─────────────────────────────────────────
    {
      id: 'centering-breath',
      type: 'meditation',
      meditationId: 'transition-centering-breath',
      animation: 'sunrise',
      showTranscript: true,
      composerOptions: { skipOpeningGong: true, skipClosingGong: true },
    },

    // ─── DETOUR: Intention Review ─────────────────────────────────────────
    // 5-screen flow: brainstorm → reflection on brainstorm → pause →
    // write intention → confirmation.
    {
      id: 'intention-review-detour',
      type: 'screens',
      ritualFade: true,
      screens: [
        // Screen 1: Brainstorm
        {
          blocks: [
            { type: 'header', title: 'Brainstorm', animation: 'sunrise' },
            { type: 'text', lines: [
              'Before we shape an intention, take a few minutes to brainstorm.',
              '§',
              'Write down anything that comes to mind about this session. Your hopes, what you expect, what\'s been on your mind, what you want to encounter. Nothing needs to be polished or precise — let it flow.',
              '§',
              'Once you have it on the page, it\'s easier to find the intention inside it.',
            ] },
            { type: 'prompt',
              prompt: '',
              placeholder: 'Anything that comes to mind...',
            },
          ],
        },
        // Screen 2: Reflection on the brainstorm
        {
          blocks: [
            { type: 'header', title: 'What Stands Out?', animation: 'sunrise' },
            { type: 'text', lines: [
              'Look over what you just wrote.',
              '§',
              'Do you notice any themes? Anything that could be narrowed down? Is there something that came up that you didn\'t expect to write?',
            ] },
            { type: 'prompt',
              prompt: '',
              placeholder: 'What I notice...',
            },
          ],
        },
        // Screen 3: Education / pause — no input
        {
          blocks: [
            { type: 'header', title: 'A Pause', animation: 'sunrise' },
            { type: 'text', lines: [
              "You've laid the groundwork. Now it's time to write your intention.",
              '§',
              'Take a moment to close your eyes before you decide. Whatever comes, it\'s yours.',
            ] },
          ],
        },
        // Screen 4: The intention itself — simple, non-directive, writes to sessionProfile.holdingQuestion
        {
          blocks: [
            { type: 'header', title: 'My Intention', animation: 'sunrise' },
            { type: 'prompt',
              prompt: '',
              placeholder: 'Write your intention here...',
              storeField: 'sessionProfile.holdingQuestion',
            },
          ],
        },
        // Screen 5: Confirmation
        {
          blocks: [
            { type: 'header', title: 'Your Intention', animation: 'sunrise' },
            { type: 'store-display',
              storeKey: 'sessionProfile.holdingQuestion',
              emptyText: '(No intention set.)',
              style: 'accent-box',
            },
            { type: 'text', lines: [
              'This is your intention for today\'s session. You can return to it at any time.',
            ] },
          ],
        },
      ],
    },
  ],
};

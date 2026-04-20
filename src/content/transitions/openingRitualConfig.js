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

  // After the ritual completes, drop the user on the home tab (rather than
  // staying on the active tab). The tab swap happens during the exit
  // overlay's covered phase so it's invisible to the user.
  landingTab: 'home',

  // Sun/moon animation for entrance/exit overlays + header blocks
  animation: 'sunrise',

  statusBar: {
    leftLabel: 'Opening Ritual',
    showSessionElapsed: false,
  },

  skip: {
    allowed: true,
    confirmMessage: 'Skip the opening ritual?',
    // Skip-to-end is blocked until this section has been visited. Keeps users
    // from accidentally exiting the ritual before recording and confirming
    // their substance intake — without which the rest of the session breaks.
    // Detour Skip (pop bookmark → gate) is unaffected.
    requireVisited: 'substance-intake',
  },

  journal: {
    saveOnComplete: true,
    titlePrefix: 'OPENING RITUAL',
  },

  sections: [
    // ── Prepare Space ──────────────────────────────────────────────────────
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

    // ── Body Check-In ──────────────────────────────────────────────────────
    // Two screens, same header + same body-check-in + same closing text. On
    // Continue, the blocks above stay mounted (persistBlocks) and the prompt
    // on screen 2 fades in below them.
    {
      id: 'body-check-in-1',
      type: 'screens',
      ritualFade: true,
      persistBlocks: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Your Body Right Now', animation: 'sunrise' },
            { type: 'text', lines: [
              'MDMA is often felt strongly in the body. Paying attention to physical sensation can help you stay oriented throughout the session.',
            ] },
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
        {
          blocks: [
            { type: 'header', title: 'Your Body Right Now', animation: 'sunrise' },
            { type: 'text', lines: [
              'MDMA is often felt strongly in the body. Paying attention to physical sensation can help you stay oriented throughout the session.',
            ] },
            { type: 'body-check-in',
              phase: 'opening',
              prompt: 'Take a moment to notice your body. What sensations are present?',
              instruction: 'Tap any that resonate.',
            },
            { type: 'text', lines: [
              "We'll come back to this throughout your session.",
            ] },
            { type: 'prompt',
              prompt: 'If you\'d like, describe where these sensations live in your body — their textures, their shapes, their depths.',
              placeholder: 'Where I feel it...',
              storeField: 'transitionData.openingBodyLocation',
              journalLabel: 'Where I feel it',
            },
          ],
        },
      ],
    },

    // ── Touchstone ─────────────────────────────────────────────────────────
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
              rows: 3,
              storeField: 'transitionData.openingTouchstone',
              journalLabel: 'Touchstone',
            },
          ],
        },
      ],
    },

    // ── Crossroads — consolidated optional activities ──────────────────────
    // One gate, four optional activities + Continue. Each activity routes with
    // `bookmark: 'crossroads'` so the user returns here after completing it,
    // and can pick another (or continue) freely.
    {
      id: 'crossroads',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Before You Begin', animation: 'sunrise' },
            { type: 'text', lines: [
              'There are a few things you can do to prepare before you take your substance. Choose what feels right, or continue when you\'re ready.',
            ] },

            // Existing intention preview — only shown if one is saved
            { type: 'text',
              condition: { storeValue: 'sessionProfile.holdingQuestion' },
              lines: ['Your current intention:'],
            },
            { type: 'store-display',
              condition: { storeValue: 'sessionProfile.holdingQuestion' },
              storeKey: 'sessionProfile.holdingQuestion',
              emptyText: '',
              style: 'accent-box',
              journalLabel: 'Intention',
            },

            { type: 'choice', key: 'crossroadsChoice',
              options: [
                { id: 'intention', label: 'Set or review your intention',
                  route: { to: 'intention-review-detour', bookmark: 'crossroads' } },
                { id: 'centering', label: 'A centering breath',
                  route: { to: 'centering-breath', bookmark: 'crossroads' } },
                { id: 'gratitude', label: 'A moment of gratitude',
                  route: { to: 'gratitude-moment', bookmark: 'crossroads' } },
                { id: 'support', label: 'Check in with your support',
                  route: { to: 'support-person-checkin', bookmark: 'crossroads' } },
                { id: 'continue', label: "I'm ready to continue",
                  route: '_next' },
              ],
            },
          ],
        },
      ],
    },

    // ── Letting Go ─────────────────────────────────────────────────────────
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

    // ── Take Substance ─────────────────────────────────────────────────────
    // Single-screen flow. The `ingestion-time` block is fully self-contained:
    // initial "I've taken it" → time display + Confirm time → confirmation modal
    // → auto-advance on confirm. The `editable-dose` block is editable inline,
    // and changing the dose value resets any recorded ingestion time so the
    // user re-runs the intake from a clean state.
    {
      id: 'substance-intake',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: "When You're Ready", animation: 'sunrise' },
            { type: 'editable-dose' },
            { type: 'text', tightAbove: true, lines: [
              'Settle into a position you can stay in for a while.',
              '§',
              'Take your substance with a few sips of water.',
              '§',
              "There's no rush. Move at whatever pace feels right.",
            ] },
            { type: 'ingestion-time' },
          ],
        },
      ],
    },

    // ── Reassurance 1 — "What to expect" before the guided audio ───────────
    {
      id: 'reassurance-1',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Settling In', animation: 'sunrise' },
            { type: 'text', lines: [
              "The preparation is complete. The MDMA is in your system now, beginning its quiet work.",
              '§',
              "It's okay if you don't feel anything yet. Onset usually takes 30 to 60 minutes, and it varies from person to person. There's nothing you need to do to make it happen.",
              '§',
              "On the next page, you'll hear a brief guided opening. A few minutes to settle in, arrive in your body, and open the space for what's ahead.",
              '§',
              "Stay open. Let it unfold.",
            ] },
          ],
        },
      ],
    },

    // ── Voice Audio — Opening the Space (core of the post-ingestion arc) ───
    {
      id: 'opening-audio',
      type: 'meditation',
      meditationId: 'transition-opening',
      animation: 'sunrise',
      showTranscript: true,
      composerOptions: { skipOpeningGong: true, skipClosingGong: true },
    },

    // ── The Session Has Begun (terminal — final ritual page) ──────────────
    // Closes out the opening ritual. Continue advances past the last section
    // (terminal: true) → exit overlay → onComplete fires startSession().
    // Continue is relabeled "Complete" via `primaryLabel`.
    {
      id: 'reassurance-2',
      type: 'screens',
      ritualFade: true,
      terminal: true,
      primaryLabel: 'Complete',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Your Session Has Begun', animation: 'sunrise' },
            { type: 'text', lines: [
              'The space is open.',
              '§',
              'The next 30 to 60 minutes are yours to simply be.',
              '§',
              'Put on music if you\'d like. Close your eyes. Lie down. Follow whatever feels natural.',
              '§',
              'The helper will be available any time during your session. Tap the {icon:heart} at the top of the screen if anything comes up.',
            ] },
            { type: 'header',
              title: 'May this serve you well.',
              titleClassName: 'text-lg font-light text-center mt-6',
              animation: 'none' },
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
    // 6-screen flow: primer → brainstorm → reflection on brainstorm → pause →
    // write intention → confirmation.
    {
      id: 'intention-review-detour',
      type: 'screens',
      ritualFade: true,
      screens: [
        // Screen 1: Primer — what an intention is
        {
          blocks: [
            { type: 'header', title: 'Shaping an Intention', animation: 'sunrise' },
            { type: 'text', lines: [
              'An intention is how you want to meet what comes. A way of being — something you carry with you through the session.',
              '§',
              "It doesn't need to be completed or checked off. It shapes how you approach whatever arises.",
            ] },
            { type: 'expandable',
              showLabel: 'See examples',
              hideLabel: 'Hide examples',
              lineStyle: 'italic',
              lines: [
                'To stay with whatever arises',
                'To be honest about what I feel',
                'To soften when things get hard',
                'To trust my own experience',
                'To let things be what they are',
              ],
            },
          ],
        },
        // Screen 2: Brainstorm
        {
          blocks: [
            { type: 'header', title: 'Brainstorm', animation: 'sunrise' },
            { type: 'text', lines: [
              'Before shaping an intention, brainstorm.',
              '§',
              "Write down whatever's on your mind about this session. Your hopes, your worries, what you want to encounter. Nothing needs to be polished.",
              '§',
              "Once it's on the page, the intention inside it becomes easier to find.",
            ] },
            { type: 'prompt',
              prompt: '',
              placeholder: 'Anything that comes to mind...',
            },
          ],
        },
        // Screen 3: Reflection on the brainstorm
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
        // Screen 4: Education / pause — no input
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
        // Screen 5: The intention itself — simple, non-directive, writes to sessionProfile.holdingQuestion
        {
          blocks: [
            { type: 'header', title: 'My Intention', animation: 'sunrise' },
            { type: 'prompt',
              prompt: '',
              placeholder: 'Write your intention here...',
              storeField: 'sessionProfile.holdingQuestion',
              journalLabel: 'Intention',
            },
          ],
        },
        // Screen 6: Confirmation
        {
          blocks: [
            { type: 'header', title: 'Your Intention', animation: 'sunrise' },
            { type: 'store-display',
              storeKey: 'sessionProfile.holdingQuestion',
              emptyText: '(No intention set.)',
              style: 'accent-box',
            },
            { type: 'text', lines: [
              'Setting an intention primes the experience ahead.',
              '§',
              "Sessions rarely unfold exactly as imagined, and that's part of how they work.",
              '§',
              "What you've written here is the first step toward something meaningful.",
            ] },
          ],
        },
      ],
    },

    // ─── DETOUR: Gratitude Moment ─────────────────────────────────────────
    {
      id: 'gratitude-moment',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'A Moment of Gratitude', animation: 'sunrise' },
            { type: 'text', lines: [
              "Take a breath and bring to mind something you're grateful for as you enter this session.",
              '§',
              "It could be a person, a place, a support you're carrying with you. Something steady beneath you.",
              '§',
              "Name it here if you'd like, or simply hold it in your mind.",
            ] },
            { type: 'prompt',
              prompt: '',
              placeholder: 'Something I\'m grateful for...',
            },
            { type: 'text', lines: [
              'Continue when you\'re ready.',
            ] },
          ],
        },
      ],
    },

    // ─── DETOUR: Support-Person Check-In ──────────────────────────────────
    {
      id: 'support-person-checkin',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Your Support', animation: 'sunrise' },
            { type: 'text', lines: [
              'If someone is sitting with you today, this is a good moment to check in with them.',
              '§',
              "Let them know you're about to begin. Share anything you want them to know — a signal you might use if you need them, a reminder about what would be helpful, anything that would make you feel held.",
              '§',
              "If you're alone, consider sending a brief message to someone who knows what you're doing today. You don't have to go into detail — just let them know you're starting.",
              '§',
              "Take as long as you need. Continue when you're ready.",
            ] },
          ],
        },
      ],
    },
  ],
};

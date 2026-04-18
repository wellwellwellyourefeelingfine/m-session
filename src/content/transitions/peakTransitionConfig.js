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
    leftLabel: 'Transition',
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

    // ── Screen 3: One Word ────────────────────────────────────────────────
    {
      id: 'one-word',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'One Word', animation: 'full-sun' },
            { type: 'text', lines: [
              "If you could name what you're feeling right now in a single word or phrase, what would it be?",
            ] },
            { type: 'prompt',
              prompt: '',
              placeholder: "What's here right now...",
              storeField: 'transitionData.oneWord',
            },
            { type: 'text', lines: [
              'This is just for you. You can look back on it later.',
            ] },
          ],
        },
      ],
    },

    // ── Screen 4: Body Check-In (2nd) ─────────────────────────────────────
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

    // ── Screen 5: Body Comparison ──────────────────────────────────────────
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

    // ── Screen 6: Reassurance ─────────────────────────────────────────────
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
              'All of this is the substance finding its way through your body. It is not a sign that something is wrong. It is a sign that something is working.',
              '§',
              'You are safe. If it feels like a lot, know that it will soon settle into something workable.',
            ] },
          ],
        },
      ],
    },

    // ── Screen 7: Quick Grounding Gate ─────────────────────────────────────
    {
      id: 'grounding-gate',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'text', lines: [
              "Would you like to pause for a short grounding exercise before continuing? This takes about three minutes and can help if you're feeling activated or overwhelmed.",
            ] },
            { type: 'choice', key: 'wantsGrounding',
              options: [
                { id: 'yes', label: "Yes, I'd like to pause",
                  route: { to: 'peak-grounding', bookmark: true } },
                { id: 'no', label: "I'm okay, continue" },
              ],
            },
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

    // ── Screen 9: Adaptive Content ─────────────────────────────────────────
    {
      id: 'adaptive',
      type: 'screens',
      screens: [
        // Grounding meditation completed in come-up
        {
          condition: {
            or: [
              { moduleCompleted: 'simple-grounding' },
              { moduleCompleted: 'short-grounding' },
            ],
          },
          blocks: [
            { type: 'header', title: 'Returning', animation: 'full-sun' },
            { type: 'text', lines: [
              'You grounded yourself during the come-up. That steadiness is still in your body. You can return to your breath at any time during this phase.',
            ] },
          ],
        },
        // Music listening during come-up
        {
          condition: { moduleCompleted: 'music-listening' },
          blocks: [
            { type: 'header', title: 'Sound', animation: 'full-sun' },
            { type: 'text', lines: [
              'Music can work differently now that the effects have deepened. You might find that what you were listening to earlier lands in a new way.',
            ] },
          ],
        },
      ],
    },

    // ── Screen 10: Begin Peak ──────────────────────────────────────────────
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

    // ── DETOUR: Peak Grounding ─────────────────────────────────────────────
    {
      id: 'peak-grounding',
      type: 'meditation',
      meditationId: 'transition-peak-grounding',
      animation: 'full-sun',
      showTranscript: true,
      composerOptions: { skipOpeningGong: true, skipClosingGong: true },
    },
  ],
};

/**
 * Closing Ritual — Content config
 *
 * Triggered when phaseTransitions.activeTransition === 'session-closing'.
 * Completion fires completeSession() on the session store.
 *
 * Full copy in transition-copy-document.md → Closing Ritual.
 */

export const closingRitualConfig = {
  id: 'closing-ritual',

  onComplete: (store) => store.completeSession(),

  animation: 'moonrise',

  statusBar: {
    // Per-section statusLabel overrides this
    leftLabel: 'Closing',
    showSessionElapsed: true,
  },

  skip: {
    allowed: true,
    confirmMessage: 'Skip the closing ritual and complete your session?',
  },

  journal: {
    saveOnComplete: true,
    titlePrefix: 'CLOSING RITUAL',
  },

  sections: [
    // ── Screen 1: Honoring ─────────────────────────────────────────────────
    {
      id: 'honoring',
      type: 'screens',
      ritualFade: true,
      statusLabel: 'Closing',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Honoring This Experience', animation: 'moonrise' },
            { type: 'text', lines: [
              "You've moved through something meaningful today. Before we close, let's take some time to honor what you experienced and create a bridge to the days ahead.",
              '§',
              'There is no rush through what comes next. Take it at whatever pace feels right.',
            ] },
          ],
        },
      ],
    },

    // ── Screen 2: Tea Ritual (with expandable recommendations) ───────────────
    {
      id: 'tea',
      type: 'screens',
      statusLabel: 'Closing',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'A Moment to Pause', animation: 'moonrise' },
            { type: 'text', lines: [
              'This might be a good time to step away and make yourself something warm to drink. Go slowly. We\'ll be here when you come back.',
            ] },
            { type: 'expandable',
              showLabel: 'Recommendations',
              hideLabel: 'Hide recommendations',
              lines: [
                'Chamomile is calming and gentle on the stomach. Peppermint can help if you\'re feeling any residual nausea. Ginger is warming and grounding. Any caffeine-free tea or warm drink will do.',
                '§',
                'Avoid coffee or caffeinated tea for now. Your body is still processing, and stimulants can interfere with the natural wind-down.',
              ],
            },
            { type: 'text', lines: [
              "Continue whenever you're ready. There's no timer.",
            ] },
          ],
        },
      ],
    },

    // ── Screen 3: Session Summary ───────────────────────────────────────────
    {
      id: 'session-summary',
      type: 'screens',
      statusLabel: 'Your Session',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Your Session', animation: 'moonrise' },
            { type: 'text', lines: [
              'A look across the whole arc of today — each phase, the time you spent, and the activities you engaged with.',
            ] },
            { type: 'phase-recap', scope: 'full-session', showHelperCount: true },
          ],
        },
      ],
    },

    // ── Screen 4: Body Check-In (4th) ──────────────────────────────────────
    {
      id: 'body-check-in-4',
      type: 'screens',
      statusLabel: 'Check In',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Your Body Now', animation: 'moonrise' },
            { type: 'text', lines: [
              'One last time. As we close, notice your body. What sensations are present?',
            ] },
            { type: 'body-check-in',
              phase: 'closing',
              instruction: 'Tap any that resonate.',
            },
          ],
        },
      ],
    },

    // ── Screen 5: Body Comparison — Full Session ────────────────────────────
    {
      id: 'body-comparison-4',
      type: 'screens',
      statusLabel: 'Check In',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Your Body Across the Session', animation: 'moonrise' },
            { type: 'body-check-in',
              mode: 'comparison',
              comparisonPhases: ['opening', 'peak', 'integration', 'closing'],
            },
          ],
        },
      ],
    },

    // ── Screen 6: Voice Audio — Closing Reflection ──────────────────────────
    {
      id: 'closing-audio',
      type: 'meditation',
      meditationId: 'transition-closing',
      animation: 'moonrise',
      showTranscript: true,
      statusLabel: 'Reflection',
      composerOptions: { skipOpeningGong: true, skipClosingGong: true },
    },

    // ── Screen 7: Self-Gratitude ────────────────────────────────────────────
    {
      id: 'self-gratitude',
      type: 'screens',
      ritualFade: true,
      statusLabel: 'Gratitude',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'One Thing About Yourself', animation: 'moonrise' },
            { type: 'text', lines: [
              "Gratitude is easier when it's specific.",
              '§',
              'Right now, in this moment, what is one thing about yourself that you appreciate?',
            ] },
            { type: 'prompt',
              prompt: '',
              placeholder: 'One thing about myself I appreciate...',
              storeField: 'transitionData.selfGratitude',
            },
            { type: 'text', lines: [
              "This doesn't need to be grand. Something small and true is enough.",
            ] },
          ],
        },
      ],
    },

    // ── Screen 8: A Message Forward ─────────────────────────────────────────
    {
      id: 'future-message',
      type: 'screens',
      ritualFade: true,
      statusLabel: 'Future Self',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'A Message Forward', animation: 'moonrise' },
            { type: 'text', lines: [
              "Imagine yourself one week from now. You're back in ordinary life. The demands, the routines, the noise.",
              '§',
              'What do you want that version of you to remember from today?',
            ] },
            { type: 'prompt',
              prompt: '',
              placeholder: 'What I want to remember...',
              storeField: 'transitionData.futureMessage',
            },
            { type: 'text', lines: [
              "Write as if you're leaving a note for yourself to find.",
            ] },
          ],
        },
      ],
    },

    // ── Screen 9: Extended Letter Detour Gate ───────────────────────────────
    {
      id: 'letter-gate',
      type: 'screens',
      statusLabel: 'Future Self',
      screens: [
        {
          blocks: [
            { type: 'text', lines: [
              "Would you like to take more time to write to your future self? This is a longer, guided version of what you just started.",
            ] },
            { type: 'choice', key: 'wantsExtendedLetter',
              options: [
                { id: 'yes', label: "Yes, I'd like to write more",
                  route: { to: 'extended-letter', bookmark: true } },
                { id: 'no', label: 'Continue' },
              ],
            },
          ],
        },
      ],
    },

    // ── Screen 10: One Thing Different (Commitment) ─────────────────────────
    {
      id: 'commitment',
      type: 'screens',
      ritualFade: true,
      statusLabel: 'Commitment',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'One Thing Different', animation: 'moonrise' },
            { type: 'text', lines: [
              'Integration happens through action. Small, specific action.',
              '§',
              'As you return to your life, is there one thing you want to do differently? Not a whole life change. Just one thing.',
            ] },
            { type: 'prompt',
              prompt: '',
              placeholder: 'One thing I want to do differently...',
              storeField: 'transitionData.commitment',
            },
            { type: 'expandable',
              showLabel: 'See examples',
              hideLabel: 'Hide examples',
              lineStyle: 'italic',
              lines: [
                'Pause before reacting when I feel triggered',
                'Reach out to someone this week',
                'Spend ten minutes each morning in stillness',
                'Stop saying yes to things I don\'t want to do',
                'Tell someone what I\'m actually feeling',
              ],
            },
          ],
        },
      ],
    },

    // ── Screen 11: Closing Touchstone ───────────────────────────────────────
    {
      id: 'closing-touchstone',
      type: 'screens',
      ritualFade: true,
      statusLabel: 'Touchstone',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'A New Touchstone', animation: 'moonrise' },
            { type: 'text', lines: [
              'At the beginning of your session, you chose a touchstone. A word that captured what felt most important before you began.',
              '§',
              'Now, after everything you\'ve experienced, what word or phrase captures what you\'re carrying forward?',
            ] },
            { type: 'prompt',
              prompt: '',
              placeholder: "What I'm carrying forward...",
              storeField: 'transitionData.closingTouchstone',
            },
          ],
        },
      ],
    },

    // ── Screen 12: Touchstone Arc ───────────────────────────────────────────
    {
      id: 'touchstone-arc',
      type: 'screens',
      ritualFade: true,
      statusLabel: 'Touchstone',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Your Arc', animation: 'moonrise' },
            { type: 'touchstone-arc' },
            { type: 'text', lines: [
              'Look at these two words together. The distance between them is the work you did today.',
            ] },
            { type: 'prompt',
              prompt: 'What do you notice when you see them side by side?',
              placeholder: 'What I notice...',
              storeField: 'transitionData.touchstoneArcReflection',
            },
            { type: 'text', lines: [
              'You made this arc. Be proud of it.',
            ] },
          ],
        },
      ],
    },

    // ── Screen 13: Adaptive Content ─────────────────────────────────────────
    {
      id: 'adaptive',
      type: 'screens',
      statusLabel: 'Closing',
      screens: [
        // Booster was taken
        {
          condition: { storeValue: 'booster.status', equals: 'taken' },
          blocks: [
            { type: 'header', title: 'The Second Wave', animation: 'moonrise' },
            { type: 'text', lines: [
              'You chose to extend the session with a second dose. Notice how the two waves felt different. The second often brings a gentler clarity.',
            ] },
          ],
        },
        // Many journal entries (5+)
        {
          condition: { storeValue: 'journalCount', gte: 5 },
          blocks: [
            { type: 'header', title: 'What You Wrote', animation: 'moonrise' },
            { type: 'text', lines: [
              "You wrote a lot today. Those words are yours, and they'll mean different things when you read them tomorrow, or next week. That's part of the work.",
            ] },
          ],
        },
        // Protector Dialogue completed
        {
          condition: { moduleCompleted: 'protector-dialogue' },
          blocks: [
            { type: 'header', title: 'Parts That Spoke', animation: 'moonrise' },
            { type: 'text', lines: [
              "You spent time with parts of yourself that don't always get heard. That conversation doesn't end here. Those parts may show up again in the coming days, and when they do, you'll know how to listen.",
            ] },
          ],
        },
      ],
    },

    // ── Screen 14: Permission to Be Unfinished ──────────────────────────────
    {
      id: 'permission',
      type: 'screens',
      ritualFade: true,
      statusLabel: 'Closing',
      screens: [
        {
          blocks: [
            { type: 'header', title: "You Don't Need to Be Finished", animation: 'moonrise' },
            { type: 'text', lines: [
              "You don't need to have it all figured out. The work you did today will continue in you. In dreams. In quiet moments. In conversations you haven't had yet.",
              '§',
              "Integration is not a single event. It's a process that unfolds over days and weeks. Some of the most important realizations from today will arrive when you're not looking for them.",
            ] },
          ],
        },
      ],
    },

    // ── Screen 15: Before You Go ────────────────────────────────────────────
    {
      id: 'before-you-go',
      type: 'screens',
      statusLabel: 'Practical',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Before You Go', animation: 'moonrise' },
            { type: 'text', lines: [
              'A few practical things before we close.',
              '§',
              "This app stores everything locally on your device. Your journal entries, session notes, and responses aren't backed up anywhere else. We recommend saving a copy of what you wrote today.",
            ] },
            { type: 'data-download', buttonLabel: 'Download Session Data' },
          ],
        },
      ],
    },

    // ── Screen 16: Integration Takes Time ───────────────────────────────────
    {
      id: 'integration-time',
      type: 'screens',
      ritualFade: true,
      statusLabel: 'Integration',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Integration Takes Time', animation: 'moonrise' },
            { type: 'text', lines: [
              'The insights from today will continue to clarify over the coming days. Sometimes in unexpected moments. A conversation, a walk, a dream.',
              '§',
              'We encourage you to return to this app in a day or two. There is a short follow-up session designed to help you process what you experienced.',
              '§',
              'The follow-up will be available on your home screen after your session closes.',
            ] },
          ],
        },
      ],
    },

    // ── Screen 17: Take Care / Close ────────────────────────────────────────
    {
      id: 'close',
      type: 'screens',
      ritualFade: true,
      statusLabel: 'Complete',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Take Care', animation: 'moonrise' },
            { type: 'text', lines: [
              'This session is now complete. The space we opened is gently closing.',
              '§',
              'Talk about your experience with someone you trust when you feel ready. Sharing what you went through can deepen your understanding and help the insights settle.',
              '§',
              'Rest well tonight. Drink water. Eat something nourishing. Be gentle with yourself.',
              '§',
              "We'll be here when you're ready to return.",
            ] },
          ],
        },
      ],
    },

    // ── DETOUR: Extended Letter to Future Self ──────────────────────────────
    {
      id: 'extended-letter',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'A Longer Letter', animation: 'moonrise' },
            { type: 'text', lines: [
              'Take your time with this. Write to the version of you who will read this in a week, a month, or longer.',
            ] },
            { type: 'prompt',
              prompt: 'What do you most want to remember about how you feel right now?',
              placeholder: 'Right now, I feel...',
            },
          ],
        },
        {
          blocks: [
            { type: 'prompt',
              prompt: "What did you learn today that you don't want to forget?",
              placeholder: 'What I learned...',
            },
          ],
        },
        {
          blocks: [
            { type: 'prompt',
              prompt: 'What would you say to yourself on a hard day?',
              placeholder: 'On a hard day, remember...',
            },
          ],
        },
      ],
    },
  ],
};

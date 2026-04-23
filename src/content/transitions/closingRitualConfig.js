/**
 * Closing Ritual — Content config
 *
 * Triggered when phaseTransitions.activeTransition === 'session-closing'.
 * Completion fires completeSession() on the session store.
 *
 * Shape of the ritual:
 *   1. Honor → Pause (tea) → Session summary
 *   2. Body check-in + comparison (adjacent) → Closing touchstone →
 *      Touchstone cairn (all 4 touchstones layered) → Intention reflection
 *   3. Pre-reflection setup → Guided closing audio → Post-audio debrief
 *   4. Reflections crossroads: user picks which closing reflections to write
 *   5. Permission (integration + follow-up framing) → Before you go →
 *      Close (terminal)
 *
 * Tail detours (reached from the reflections crossroads, each bookmarks
 * back so the user can pick another activity or continue):
 *   - self-gratitude
 *   - future-letter (combined basic message + extended letter prompts)
 *   - commitment
 *
 * Full copy in transition-copy-document.md → Closing Ritual.
 */

// ─── Shared blocks used inside the tail-detour progressive reveals ──────────

// Reflection prompts — defined as module-level consts so the same object
// reference is shared across a detour's multiple screens. This is the same
// pattern the synthesis-transition tailored activities use, and it's what
// keeps `promptIndex` stable across a persistBlocks progressive reveal (see
// the dedupe note in useTransitionModuleState).

const SELF_GRATITUDE_PROMPT = {
  type: 'prompt',
  prompt: 'Right now, in this moment, what is one thing about yourself that you appreciate?',
  placeholder: 'One thing about myself I appreciate...',
  storeField: 'transitionData.selfGratitude',
  journalLabel: 'One thing about myself I appreciate',
};

const FUTURE_MESSAGE_PROMPT = {
  type: 'prompt',
  prompt: 'What do you want that version of you to remember from today?',
  placeholder: 'What I want to remember...',
  storeField: 'transitionData.futureMessage',
  journalLabel: 'A message forward',
};

const EXTENDED_LETTER_PROMPTS = [
  { type: 'prompt',
    prompt: 'What do you most want to remember about how you feel right now?',
    placeholder: 'Right now, I feel...',
    journalLabel: 'How I feel right now' },
  { type: 'prompt',
    prompt: "What did you learn today that you don't want to forget?",
    placeholder: 'What I learned...',
    journalLabel: "What I don't want to forget" },
  { type: 'prompt',
    prompt: 'What would you say to yourself on a hard day?',
    placeholder: 'On a hard day, remember...',
    journalLabel: 'On a hard day' },
];

const COMMITMENT_PROMPT = {
  type: 'prompt',
  prompt: 'As you return to your life, is there one thing you want to do differently? Not a whole life change. Just one thing.',
  placeholder: 'One thing I want to do differently...',
  storeField: 'transitionData.commitment',
  journalLabel: 'One thing I want to do differently',
};

const COMMITMENT_EXAMPLES = { type: 'expandable',
  showLabel: 'Examples',
  icon: 'circle-plus',
  lineStyle: 'italic',
  lines: [
    'Pause before reacting when I feel triggered',
    'Reach out to someone this week',
    'Spend ten minutes each morning in stillness',
    "Stop saying yes to things I don't want to do",
    "Tell someone what I'm actually feeling",
  ],
};

const CLOSING_TOUCHSTONE_PROMPT = {
  type: 'prompt',
  prompt: "What word or phrase captures what you're carrying forward?",
  placeholder: "What I'm carrying forward...",
  storeField: 'transitionData.closingTouchstone',
  journalLabel: 'Closing touchstone',
};

const TOUCHSTONE_ARC_REFLECTION = {
  type: 'prompt',
  prompt: 'What do you notice when you see them side by side?',
  placeholder: 'What I notice...',
  storeField: 'transitionData.touchstoneArcReflection',
  journalLabel: 'Touchstone arc reflection',
};

// Body-across-the-session reflection — used in the main flow's
// body-comparison-4 progressive reveal.
const BODY_ACROSS_SESSION_INTRO = { type: 'text', lines: [
  'A lot can change in the body through a session.',
  '§',
  'There is intelligence there — things that are felt but can\'t easily be put into words.',
  '§',
  'Take a moment to notice how those sensations have shifted.',
] };
const BODY_ACROSS_SESSION_PROMPT = {
  type: 'prompt',
  prompt: 'Do you notice any pattern or insight you want to carry into the days and weeks ahead?',
  placeholder: 'What I notice...',
  journalLabel: 'Body across the session',
};

export const closingRitualConfig = {
  id: 'closing-ritual',

  onComplete: (store) => store.completeSession(),

  // After the ritual completes, drop the user on the home tab so they see
  // their completed session state rather than the leftover active-tab view.
  // Tab swap happens during the exit overlay's covered phase (invisible to
  // the user) — same mechanism as the opening ritual.
  landingTab: 'home',

  animation: 'moonrise',

  statusBar: {
    // Single consistent label across the whole ritual — matches the
    // per-transition pattern used by opening-ritual, peak-transition, and
    // synthesis-transition. No per-section `statusLabel` overrides here;
    // keeping it uniform reads clearer in the progress bar than bouncing
    // between "Closing" / "Reflections" / "Practical" etc.
    leftLabel: 'Closing Ritual',
    showSessionElapsed: true,
  },

  skip: {
    // Main-flow skip disabled — the closing ritual fires completeSession() on
    // its terminal section, and that completion is the gate for follow-up
    // activities. Users must Continue through to the end rather than skipping
    // past it. Detour skip (e.g., exiting a reflection side trip) is
    // decoupled from this flag and still works.
    allowed: false,
  },

  journal: {
    saveOnComplete: true,
    titlePrefix: 'CLOSING RITUAL',
  },

  sections: [
    // ── 1. Honoring ────────────────────────────────────────────────────────
    {
      id: 'honoring',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Honoring This Experience', animation: 'moonrise' },
            { type: 'text', lines: [
              "You've moved through something meaningful today. Before we close, let's take some time to honor what you experienced and create a bridge to the days ahead.",
              '§',
              'There is no need to rush through what comes next. Take it at whatever pace feels right.',
            ] },
          ],
        },
      ],
    },

    // ── 2. Tea Ritual ──────────────────────────────────────────────────────
    // Two paragraphs of body copy, then the expandable recommendations at
    // the very end so the user sees the affordance after reading the setup.
    {
      id: 'tea',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'A Moment to Pause', animation: 'moonrise' },
            { type: 'text', lines: [
              "This might be a good time to step away and make yourself something warm to drink. Maybe some herbal tea?",
            ] },
            { type: 'text', lines: [
              "Continue whenever you're ready.",
            ] },
            { type: 'expandable',
              showLabel: 'Recommendations',
              icon: 'circle-plus',
              lines: [
                "Chamomile is calming and gentle on the stomach. Peppermint can help if you're feeling any residual nausea. Ginger is warming and grounding. Any caffeine-free tea or warm drink will do.",
                '§',
                'Avoid coffee or caffeinated tea for now. Your body is still processing, and stimulants can interfere with the natural wind-down.',
              ],
            },
          ],
        },
      ],
    },

    // ── 3. Session Summary ─────────────────────────────────────────────────
    {
      id: 'session-summary',
      type: 'screens',
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

    // ── 4. Body Check-In (4th) ─────────────────────────────────────────────
    {
      id: 'body-check-in-4',
      type: 'screens',
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

    // ── 5. Body Comparison — Full Session (with progressive reveal) ────────
    // Sits directly after "Your Body Now" so the two body pages read as a
    // single beat: pick sensations now, then see them layered across the
    // whole session. Same persistBlocks pattern used elsewhere — the
    // comparison grid stays mounted while a reflection text + journal
    // prompt fade in beneath on Continue.
    {
      id: 'body-comparison-4',
      type: 'screens',
      persistBlocks: true,
      screens: [
        { blocks: [
          { type: 'header', title: 'Your Body Across the Session', animation: 'moonrise' },
          { type: 'body-check-in',
            mode: 'comparison',
            comparisonPhases: ['opening', 'peak', 'integration', 'closing'],
          },
        ] },
        { blocks: [
          { type: 'header', title: 'Your Body Across the Session', animation: 'moonrise' },
          { type: 'body-check-in',
            mode: 'comparison',
            comparisonPhases: ['opening', 'peak', 'integration', 'closing'],
          },
          BODY_ACROSS_SESSION_INTRO,
          BODY_ACROSS_SESSION_PROMPT,
        ] },
      ],
    },

    // ── 6. Closing Touchstone ──────────────────────────────────────────────
    // User writes a final word/phrase that captures where they are now.
    // Value is read back on the cairn page below.
    {
      id: 'closing-touchstone-write',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Closing Touchstone', animation: 'moonrise' },
            { type: 'text', lines: [
              "Write a word or phrase that captures how you feel as this session comes to a close.",
            ] },
            CLOSING_TOUCHSTONE_PROMPT,
          ],
        },
      ],
    },

    // ── 7. Touchstone Cairn ────────────────────────────────────────────────
    // Progressive reveal: all four touchstones (opening → peak → synthesis →
    // closing) fade in one at a time. Final screen adds a reflection prompt
    // asking the user to read them together.
    {
      id: 'touchstone-cairn',
      type: 'screens',
      persistBlocks: true,
      ritualFade: true,
      screens: (() => {
        const HEADER = { type: 'header', title: 'Touchstone Cairn', animation: 'moonrise' };
        const INTRO = { type: 'text', lines: [
          "Let's take a look at the touchstones you've created throughout this session.",
        ] };
        const TOUCHSTONE_OPENING = { type: 'store-display',
          storeKey: 'transitionData.openingTouchstone',
          leftLabel: 'Opening Ritual',
          emptyText: '(no touchstone)',
          style: 'accent-box' };
        const TOUCHSTONE_PEAK = { type: 'store-display',
          storeKey: 'transitionData.peakTouchstone',
          leftLabel: 'Peak Transition',
          emptyText: '(no touchstone)',
          style: 'accent-box' };
        const TOUCHSTONE_SYNTHESIS = { type: 'store-display',
          storeKey: 'transitionData.synthesisTouchstone',
          leftLabel: 'Synthesis Transition',
          emptyText: '(no touchstone)',
          style: 'accent-box' };
        const TOUCHSTONE_CLOSING = { type: 'store-display',
          storeKey: 'transitionData.closingTouchstone',
          leftLabel: 'Closing Ritual',
          emptyText: '(no touchstone)',
          style: 'accent-box' };
        const REFLECTION_INTRO = { type: 'text', lines: [
          'Touchstones can be a useful way to quickly chart your gut feeling throughout a session. When you see them stacked here as a progression from opening to closing, you might notice a pattern or gain an insight.',
        ] };
        const REFLECTION_PROMPT = {
          type: 'prompt',
          prompt: 'What do the touchstones say about your session when read together?',
          placeholder: 'What I notice...',
          journalLabel: 'Touchstone cairn reflection',
          storeField: 'transitionData.touchstoneArcReflection',
        };
        const BASE = [HEADER, INTRO];
        return [
          { blocks: [...BASE] },
          { blocks: [...BASE, TOUCHSTONE_OPENING] },
          { blocks: [...BASE, TOUCHSTONE_OPENING, TOUCHSTONE_PEAK] },
          { blocks: [...BASE, TOUCHSTONE_OPENING, TOUCHSTONE_PEAK, TOUCHSTONE_SYNTHESIS] },
          { blocks: [...BASE, TOUCHSTONE_OPENING, TOUCHSTONE_PEAK, TOUCHSTONE_SYNTHESIS, TOUCHSTONE_CLOSING] },
          { blocks: [...BASE, TOUCHSTONE_OPENING, TOUCHSTONE_PEAK, TOUCHSTONE_SYNTHESIS, TOUCHSTONE_CLOSING,
            REFLECTION_INTRO, REFLECTION_PROMPT] },
        ];
      })(),
    },

    // ── 8. Intention Reflection ────────────────────────────────────────────
    // Shows the user's original intention alongside a reflection prompt so
    // they can see their arc from the beginning of the session to the end.
    {
      id: 'intention-reflection',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Your Intention', animation: 'moonrise' },
            { type: 'text', lines: [
              "Take a look at the intention you set at the beginning of this session.",
              '§',
              'Intentions can change or manifest in unexpected ways. Take a moment to appreciate what happened, and to reflect on the journey from that first intention to where you are now.',
            ] },
            { type: 'store-display',
              storeKey: 'sessionProfile.holdingQuestion',
              emptyText: '(No intention was set at the start of the session.)',
              style: 'accent-box',
              journalLabel: 'Original intention',
            },
            { type: 'prompt',
              prompt: 'What thoughts come to mind when reflecting on your intention?',
              placeholder: 'What comes to mind...',
              journalLabel: 'Intention reflection',
              storeField: 'transitionData.intentionReflection',
            },
          ],
        },
      ],
    },

    // ── 9. Prepare for the Guided Closing ──────────────────────────────────
    {
      id: 'pre-reflection-setup',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'A Guided Closing', animation: 'moonrise' },
            { type: 'text', lines: [
              'A brief guided reflection is ahead. It will help you close out the space you opened today.',
              '§',
              'Find a comfortable position — somewhere you can sit and take in the instructions without needing to move.',
              '§',
              "Continue when you're ready.",
            ] },
          ],
        },
      ],
    },

    // ── 10. Voice Audio — Closing Reflection ───────────────────────────────
    {
      id: 'closing-audio',
      type: 'meditation',
      meditationId: 'transition-closing',
      animation: 'moonrise',
      showTranscript: true,
      composerOptions: { skipOpeningGong: true, skipClosingGong: true },
    },

    // ── 11. Post-Audio Debrief ─────────────────────────────────────────────
    {
      id: 'closing-debrief',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Bridging the Space', animation: 'moonrise' },
            { type: 'text', lines: [
              'We hope this has helped you begin to bridge the space between today\'s session and your daily life.',
              '§',
              'For now, a few small reflections to plant the seeds for integration.',
            ] },
          ],
        },
      ],
    },

    // ── 12. Reflections Crossroads ─────────────────────────────────────────
    // One gate offering the user a list of short writing activities. Each
    // option routes to a tail detour with `bookmark: 'reflections-crossroads'`
    // so they return here afterward and can pick another — or "I'm ready to
    // continue" to advance. Mirrors the opening-ritual Crossroads pattern.
    {
      id: 'reflections-crossroads',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Reflections', animation: 'moonrise' },
            { type: 'text', lines: [
              'The following activities can help close out the session. Choose what feels right — or continue when you\'re ready.',
            ] },
            { type: 'choice', key: 'closingReflectionsChoice',
              options: [
                { id: 'self-gratitude', label: 'One thing about yourself',
                  route: { to: 'reflection-self-gratitude', bookmark: 'reflections-crossroads' } },
                { id: 'future-letter', label: 'Notes to your future self',
                  route: { to: 'reflection-future-letter', bookmark: 'reflections-crossroads' } },
                { id: 'commitment', label: 'One thing different',
                  route: { to: 'reflection-commitment', bookmark: 'reflections-crossroads' } },
                { id: 'continue', label: "I'm ready to continue",
                  route: '_next' },
              ],
            },
          ],
        },
      ],
    },

    // ── 13. Permission to Be Unfinished ────────────────────────────────────
    {
      id: 'permission',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: "You Don't Need to Be Finished", animation: 'moonrise' },
            { type: 'text', lines: [
              "You don't need to have it all figured out. The work you did today will continue in you. In dreams. In quiet moments. In conversations you haven't had yet.",
              '§',
              "Integration is not a single event. It's a process that unfolds over time. Some of the most important realizations from today will arrive when you're not looking for them.",
              '§',
              'Follow-up activities will be available here 8 hours from now, designed to support you in the days, weeks, and months ahead.',
            ] },
          ],
        },
      ],
    },

    // ── 14. Before You Go ──────────────────────────────────────────────────
    {
      id: 'before-you-go',
      type: 'screens',
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

    // ── 15. Take Care / Close (terminal) ───────────────────────────────────
    {
      id: 'close',
      type: 'screens',
      ritualFade: true,
      terminal: true,
      primaryLabel: 'Complete',
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

    // ─── TAIL DETOURS ──────────────────────────────────────────────────────
    // Reached only via the reflections-crossroads choice block. Each detour
    // is a single section with a bookmark back to the crossroads, so the
    // user can complete an activity and return to pick another.

    // ── Self-Gratitude ─────────────────────────────────────────────────────
    {
      id: 'reflection-self-gratitude',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'One Thing About Yourself', animation: 'moonrise' },
            { type: 'text', lines: [
              "Gratitude is easier when it's specific.",
            ] },
            SELF_GRATITUDE_PROMPT,
            { type: 'text', lines: [
              "This doesn't need to be grand. Something small and true is enough.",
            ] },
          ],
        },
      ],
    },

    // ── Future Letter (combined basic message + extended letter) ──────────
    // Single section, progressive reveal. The basic "message forward"
    // question is the first reveal; pressing Continue expands three longer
    // letter prompts beneath it. User can stop at any point by returning
    // to the crossroads via the Skip button (detour skip pops the bookmark).
    {
      id: 'reflection-future-letter',
      type: 'screens',
      persistBlocks: true,
      ritualFade: true,
      screens: (() => {
        const HEADER = { type: 'header', title: 'Notes to Your Future Self', animation: 'moonrise' };
        const INTRO = { type: 'text', lines: [
          "Imagine yourself one week from now. You're back in ordinary life — the demands, the routines, the noise.",
        ] };
        const BASE = [HEADER, INTRO];
        return [
          { blocks: [...BASE, FUTURE_MESSAGE_PROMPT] },
          { blocks: [...BASE, FUTURE_MESSAGE_PROMPT, EXTENDED_LETTER_PROMPTS[0]] },
          { blocks: [...BASE, FUTURE_MESSAGE_PROMPT, EXTENDED_LETTER_PROMPTS[0], EXTENDED_LETTER_PROMPTS[1]] },
          { blocks: [...BASE, FUTURE_MESSAGE_PROMPT, EXTENDED_LETTER_PROMPTS[0], EXTENDED_LETTER_PROMPTS[1], EXTENDED_LETTER_PROMPTS[2]] },
          { blocks: [
            ...BASE, FUTURE_MESSAGE_PROMPT, ...EXTENDED_LETTER_PROMPTS,
            { type: 'text',
              header: 'Leaving a note',
              lines: [
                "You've left a note for yourself to find. Come back to it when you need to remember today.",
              ] },
          ] },
        ];
      })(),
    },

    // ── Commitment ─────────────────────────────────────────────────────────
    {
      id: 'reflection-commitment',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'One Thing Different', animation: 'moonrise' },
            { type: 'text', lines: [
              'Integration happens through action. Small, specific action.',
            ] },
            COMMITMENT_PROMPT,
            COMMITMENT_EXAMPLES,
          ],
        },
      ],
    },

    // (The closing-touchstone + cairn + intention-reflection live in the
    //  main flow — see the three main-flow sections placed directly after
    //  `body-check-in-4`. The old detour version has been removed.)
  ],
};

/**
 * Intention Setting v2 — MasterModule content config.
 *
 * Pre-session activity. Replaces the legacy custom-component
 * IntentionSettingActivity (kept on disk during the cutover; reachable in
 * code via library id 'intention-setting' for reference, not surfaced in
 * any timeline configuration).
 *
 * See [/Users/jordanellingwood/.claude/plans/okay-great-this-looks-tidy-tiger.md]
 * for the migration design and the rationale behind each section's shape.
 *
 * Notable structural choices:
 *
 *   1. Multi-paragraph description sections use the dot-separator
 *      progressive reveal pattern (style sheet rule #7) — `persistBlocks: true`
 *      with shared TEXT/SEPARATOR consts and `tightAbove: true` on the
 *      separator AND the text following it.
 *
 *   2. The `write-intention` section has TWO screens with a shared
 *      WRITING_HEADER (title 'My Intention' + ascii-moon animation). Header
 *      continuity (rule #5) keeps the moon anchored across the screen
 *      transition while the body fades from prep text → textarea. This is
 *      the idiomatic replacement for the legacy auto-advancing moon
 *      transition. NO `persistBlocks` here — the body is meant to fully
 *      swap, not accumulate.
 *
 *   3. The `meditation` section sits at the array tail past `closing`
 *      (which is `terminal: true`). Reached only via the `meditation-offer`
 *      choice's named bookmark route — sequential walk-through cannot fall
 *      into it because closing's terminal flag fires `finalizeModule` first.
 *
 *   4. `journal: { saveOnComplete: false }` — the wrapper component
 *      (IntentionSettingMaster.jsx) owns the journal upsert end-to-end so
 *      it can update the intake-created entry rather than create a duplicate.
 *      Flipping this on would cause `useMasterModuleState.finalizeModule` to
 *      ALSO write a new entry via journalAssembler — a duplicate.
 */

import {
  TERRITORY_OPTIONS,
  FEELING_OPTIONS,
} from '../../../components/session/activities/intentionSettingContent';

// ── Shared header constants (rule #5: single JS reference for header continuity) ──
const WELCOME_HEADER = { type: 'header', title: 'Refine Your Intention', animation: 'leaf' };
const VS_EXP_HEADER = { type: 'header', title: 'Intention, Not Expectation', animation: 'leaf' };
const MED_OFFER_HEADER = { type: 'header', title: 'Slow Down First', animation: 'leaf' };
const TERRITORY_HEADER = { type: 'header', title: "What's Alive Right Now", animation: 'leaf' };
const FEELING_HEADER = { type: 'header', title: 'What Comes Up', animation: 'leaf' };
const ONE_THING_HEADER = { type: 'header', title: 'One Thing', animation: 'leaf' };
const STEMS_HEADER = { type: 'header', title: 'A Starting Point', animation: 'leaf' };
const WRITING_HEADER = { type: 'header', title: 'My Intention', animation: 'ascii-moon' };
const REFLECT_FEEL_HEADER = { type: 'header', title: 'Feel Into It', animation: 'leaf' };
const REFLECT_BENEATH_HEADER = { type: 'header', title: "What's Beneath It", animation: 'leaf' };
const CLOSING_HEADER = { type: 'header', title: 'Hold It Lightly', animation: 'ascii-diamond' };

// ── Shared dot-separator constants ──
const SEP_1 = { type: 'dot-separator', count: 1, tightAbove: true };
const SEP_2 = { type: 'dot-separator', count: 2, tightAbove: true };
const SEP_3 = { type: 'dot-separator', count: 3, tightAbove: true };

// ── Stem rows for the consolidated stems page.
// NOTE — TBD copy: the example sentences below are reasonable defaults
// matching the app's grounded, observational tone. The user should review
// and revise these in a follow-up; the stem block accepts any string.
const STEM_ROWS = [
  {
    prefix: 'Teach me…',
    example: 'Teach me what wants to be felt right now.',
    placeholder: 'Teach me to…',
  },
  {
    prefix: 'Show me…',
    example: "Show me the part of this I've been avoiding.",
    placeholder: 'Show me what…',
  },
  {
    prefix: 'Help me…',
    example: "Help me stay with what's here without rushing it.",
    placeholder: 'Help me…',
  },
];

export const intentionSettingV2Content = {
  idle: {
    title: 'Intention Setting',
    description:
      "A guided flow for refining what you want to bring to your session. We'll move through self-inquiry, writing warm-ups, and a quiet space to put your intention into words.",
    durationMinutes: 5,
  },
  idleAnimation: 'leaf',

  // Wrapper owns the journal write end-to-end. Setting this false prevents
  // useMasterModuleState.finalizeModule from creating a duplicate entry via
  // journalAssembler.
  journal: { saveOnComplete: false },

  sections: [
    // ──────────────────────────────────────────────────────────
    // 0. Welcome
    //
    // Single-paragraph welcome. The OLD module's getWelcomeContent defines
    // a bodySecondary that the renderer never displays (dead code), so we
    // intentionally render only the conditional body — matching actual OLD
    // behavior. No multi-paragraph reveal needed.
    // ──────────────────────────────────────────────────────────
    {
      id: 'welcome',
      type: 'screens',
      ritualFade: true,
      screens: [
        { blocks: [WELCOME_HEADER, { type: 'intention-welcome' }] },
      ],
    },

    // ──────────────────────────────────────────────────────────
    // 1. Intention vs. Expectation — multi-paragraph reveal with 3 separators
    //
    // Per-user direction: separators flank both the second text block AND
    // the example block, so the reveal reads as four discrete beats with
    // visual punctuation between every step. This intentionally extends
    // the dot-separator pattern beyond strict text→text — kept confined
    // to this section.
    //
    // Reveal order:
    //   TEXT_1 → SEP_1 → TEXT_2 → SEP_2 → EXAMPLE → SEP_3 → FOOTER
    // ──────────────────────────────────────────────────────────
    (() => {
      const TEXT_1 = { type: 'text', lines: [
        "An intention is a direction you want to face. It's not a destination you're demanding to arrive at.",
      ] };
      const TEXT_2 = { type: 'text', tightAbove: true, lines: [
        'An expectation tries to control the outcome. An intention stays open to how it unfolds.',
      ] };
      const EXAMPLE = {
        type: 'intention-example',
        tightAbove: true,
        expectation: "I will finally understand why I'm anxious and fix it.",
        intention: "I want to be open to learning what's beneath my anxiety.",
      };
      const FOOTER = { type: 'text', tightAbove: true, lines: [
        'The difference is subtle but important. Intentions leave room for the session to surprise you.',
      ] };
      return {
        id: 'intention-vs-expectation',
        type: 'screens',
        persistBlocks: true,
        ritualFade: true,
        screens: [
          { blocks: [VS_EXP_HEADER, TEXT_1] },
          { blocks: [VS_EXP_HEADER, TEXT_1, SEP_1, TEXT_2] },
          { blocks: [VS_EXP_HEADER, TEXT_1, SEP_1, TEXT_2, SEP_2, EXAMPLE] },
          { blocks: [VS_EXP_HEADER, TEXT_1, SEP_1, TEXT_2, SEP_2, EXAMPLE, SEP_3, FOOTER] },
        ],
      };
    })(),

    // ──────────────────────────────────────────────────────────
    // 2. Meditation Offer (gate) — single screen, all content together
    //
    // No reveal pattern; text + choice all fade in together. "Do the
    // Meditation" routes to the tail-detour meditation section with
    // bookmark='inquiry-territory'. "Continue Without" advances
    // sequentially via _next, landing on inquiry-territory directly.
    // ──────────────────────────────────────────────────────────
    {
      id: 'meditation-offer',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            MED_OFFER_HEADER,
            { type: 'text', lines: [
              'Before you begin working on your intention, you might find it helpful to settle in.',
              '§',
              'A short grounding meditation can help you move from thinking to feeling, which is where good intentions tend to live.',
            ] },
            {
              type: 'choice',
              key: 'meditationChoice',
              options: [
                {
                  id: 'meditate',
                  label: 'Do the Meditation',
                  route: { to: 'meditation', bookmark: 'inquiry-territory' },
                },
                {
                  id: 'skip',
                  label: 'Continue Without',
                  route: '_next',
                },
              ],
            },
          ],
        },
      ],
    },

    // ──────────────────────────────────────────────────────────
    // 3. Inquiry: Territory — single screen, no reveal
    // ──────────────────────────────────────────────────────────
    {
      id: 'inquiry-territory',
      type: 'screens',
      screens: [
        {
          blocks: [
            TERRITORY_HEADER,
            { type: 'text', lines: [
              'Without overthinking it, what area of your life feels most present or pressing right now?',
              '§',
              'Tap what resonates, or just sit with the question and continue.',
            ] },
            {
              type: 'selector',
              key: 'territory',
              multiSelect: false,
              options: TERRITORY_OPTIONS.map((o) => ({ id: o.value, label: o.label })),
            },
          ],
        },
      ],
    },

    // ──────────────────────────────────────────────────────────
    // 4. Inquiry: Feeling — single screen, no reveal
    // ──────────────────────────────────────────────────────────
    {
      id: 'inquiry-feeling',
      type: 'screens',
      screens: [
        {
          blocks: [
            FEELING_HEADER,
            { type: 'text', lines: [
              'When you think about that, what feeling shows up? Not what you think about it, but what you feel.',
              '§',
              "Again, just tap what's closest. There's no right answer.",
            ] },
            {
              type: 'selector',
              key: 'feeling',
              multiSelect: false,
              options: FEELING_OPTIONS.map((o) => ({ id: o.value, label: o.label })),
            },
          ],
        },
      ],
    },

    // ──────────────────────────────────────────────────────────
    // 5. Inquiry: One Thing — single-screen text-only reflective beat
    // ──────────────────────────────────────────────────────────
    {
      id: 'inquiry-one-thing',
      type: 'screens',
      screens: [
        {
          blocks: [
            ONE_THING_HEADER,
            { type: 'text', lines: [
              'If this session could help you with just one thing, what would it be?',
              '§',
              "You don't need to write it down yet. Just let the question sit for a moment.",
            ] },
          ],
        },
      ],
    },

    // ──────────────────────────────────────────────────────────
    // 6. Stems Consolidated — single screen, no reveal
    //
    // Replaces the OLD module's separate stems-education + stems-interactive
    // pages. StemIntentionBlock renders three independent toggle rows.
    // ──────────────────────────────────────────────────────────
    {
      id: 'stems-consolidated',
      type: 'screens',
      screens: [
        {
          blocks: [
            STEMS_HEADER,
            { type: 'text', lines: [
              'Many experienced facilitators suggest beginning an intention with a simple request.',
              '§',
              'Phrases like "Teach me," "Show me," or "Help me" put you in a posture of openness rather than control. They frame the session as a conversation, not a demand.',
            ] },
            { type: 'stem-intention', stems: STEM_ROWS },
          ],
        },
      ],
    },

    // ──────────────────────────────────────────────────────────
    // 7. Write Intention — TWO screens, header continuity, NO persistBlocks
    //
    // Both screens spread WRITING_HEADER (same JS reference, same index 0)
    // so ScreensSection detects matching title+animation across screens →
    // header doesn't re-fade → AsciiMoon stays anchored as body fades from
    // prep text → textarea. ritualFade extends body fade to 700ms for
    // ceremonial feel — the idiomatic replacement for the OLD module's
    // auto-advancing moon transition step.
    //
    // Prep beat is two short sentences inside ONE text block (no §) so it
    // doesn't trigger the multi-paragraph reveal pattern. The whole
    // section IS the moon-anchoring beat.
    // ──────────────────────────────────────────────────────────
    {
      id: 'write-intention',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            WRITING_HEADER,
            { type: 'intention-prep-text', lines: [
              "Now you'll have the chance to write out your intention.",
              'Take as long as you need.',
            ] },
          ],
        },
        {
          blocks: [
            WRITING_HEADER,
            { type: 'intention-prompt', placeholder: 'Write your intention here...', rows: 6 },
          ],
        },
      ],
    },

    // ──────────────────────────────────────────────────────────
    // 8. Reflection: Feel Into It — single screen, no reveal
    // ──────────────────────────────────────────────────────────
    {
      id: 'reflection-feel',
      type: 'screens',
      screens: [
        {
          blocks: [
            REFLECT_FEEL_HEADER,
            { type: 'text', lines: [
              'Read your intention back to yourself, slowly.',
              '§',
              'Does it land in your chest, or just in your head? A good intention usually carries some feeling behind it. Not just logic.',
            ] },
            { type: 'intention-prompt', placeholder: 'Write your intention here...', rows: 4 },
          ],
        },
      ],
    },

    // ──────────────────────────────────────────────────────────
    // 9. Reflection: What's Beneath — single screen, no reveal
    // ──────────────────────────────────────────────────────────
    {
      id: 'reflection-beneath',
      type: 'screens',
      screens: [
        {
          blocks: [
            REFLECT_BENEATH_HEADER,
            { type: 'text', lines: [
              'Sometimes the first thing we write is the surface layer. The real intention might live one level deeper.',
              '§',
              'Does your intention move you toward something you want? Or away from something you want to escape? Both are valid starting points, but "toward" tends to serve better during a session.',
            ] },
            { type: 'intention-prompt', placeholder: 'Write your intention here...', rows: 4 },
          ],
        },
      ],
    },

    // ──────────────────────────────────────────────────────────
    // 10. Closing — terminal: true, single screen, no reveal
    //
    // terminal: true ensures (a) sequential advance from this section ends
    // the module via finalizeModule, and (b) the meditation tail-detour
    // (idx 11) is excluded from the progress denominator (MasterModule.jsx
    // lines 181-184 slice at the first terminal section).
    //
    // The terminal flag also drives the Continue→Complete label flip on
    // this section's screen via the terminal-aware isLastSection predicate
    // in useMasterModuleState.
    // ──────────────────────────────────────────────────────────
    {
      id: 'closing',
      type: 'screens',
      ritualFade: true,
      terminal: true,
      screens: [
        {
          blocks: [
            CLOSING_HEADER,
            { type: 'text', lines: [
              "You've done the work of setting your intention. Now the most important thing is to hold it lightly.",
              '§',
              "MDMA sessions often go somewhere you didn't predict. The deepest experiences tend to follow their own path, not the one your mind mapped out in advance.",
              '§',
              'Trust that your intention has been heard. When the session begins, your only job is to stay present with whatever comes.',
            ] },
            { type: 'intention-display' },
          ],
        },
      ],
    },

    // ──────────────────────────────────────────────────────────
    // 11. Meditation — TAIL DETOUR
    //
    // Reached only via the named bookmark route from idx 2's choice.
    // Sequential walk-through into this section is impossible because
    // idx 10 (closing) is terminal: true — finalizeModule fires before
    // we ever reach idx 11 from idx 10.
    //
    // MeditationSection's onComplete + onSkip both fire onSectionComplete
    // (= state.advanceSection). With routeStack=['inquiry-territory'],
    // advanceSection pops the bookmark; stale-bookmark guard does NOT fire
    // (idx 3 ≠ idx 11, idx 3 < 12, 'inquiry-territory' not yet visited at
    // this point) → land on inquiry-territory cleanly.
    // ──────────────────────────────────────────────────────────
    {
      id: 'meditation',
      type: 'meditation',
      meditationId: 'short-grounding',
      animation: 'morphing-shapes',
      showTranscript: true,
    },
  ],
};

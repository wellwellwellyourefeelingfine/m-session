/**
 * Routing & Continuation Test Module
 *
 * Tests the flexible bookmark routing system + the DotSeparator progressive
 * reveal feature.
 *
 * SECTIONS:
 *   Index 0: intro          — single screen with flow description
 *   Index 1: education      — single screen, normal sequential
 *   Index 2: checkpoint     — choice: "Index 5" (bookmark at 4) or "Index 3 — next"
 *   Index 3: skipped        — should be SKIPPED when routing to 5
 *   Index 4: bookmark       — return point after index 5, has journal prompt
 *   Index 5: target         — route target from checkpoint, has journal prompt
 *   Index 6: final          — visited-section condition checks
 *   Index 7: dot-separator  — DotSeparator test (5 screens, 4 reveals testing counts 1–4)
 *
 * Expected flow when choosing "Index 5":  0 → 1 → 2 → 5 → 4 → 6 → 7 (skips 3, skips re-visit of 5)
 * Expected flow when choosing "Index 3":  0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 (normal sequential)
 */

// ── Shared block refs for the DotSeparator test section (index 7) ──────────
// Same JS reference reused across all 5 screens so React keyed reconciliation
// keeps the DOM stable for matching block indexes — only newly-mounted blocks
// run their entry animations on each reveal.

const DOT_TEST_HEADER = {
  type: 'header',
  title: 'Dot Separator Test',
  animation: 'ascii-moon',
};

const DOT_SEP_1 = { type: 'dot-separator', count: 1, tightAbove: true };
const DOT_SEP_2 = { type: 'dot-separator', count: 2, tightAbove: true };
const DOT_SEP_3 = { type: 'dot-separator', count: 3, tightAbove: true };
const DOT_SEP_4 = { type: 'dot-separator', count: 4, tightAbove: true };
const DOT_SEP_5 = { type: 'dot-separator', count: 5, tightAbove: true };
const DOT_SEP_6 = { type: 'dot-separator', count: 6, tightAbove: true };
const DOT_SEP_7 = { type: 'dot-separator', count: 7, tightAbove: true };

const DOT_TEXT_1 = { type: 'text', lines: [
  'First text block. No separator above it.',
  '§',
  'Press Continue to reveal the next paragraph with a 1-dot separator.',
] };
const DOT_TEXT_2 = { type: 'text', tightAbove: true, lines: [
  'Second text block. One dot animated in above.',
  '§',
  'Continue for a horizontal 2-dot separator.',
] };
const DOT_TEXT_3 = { type: 'text', tightAbove: true, lines: [
  'Third text block. Two dots staggered in.',
  '§',
  'Continue for a 3-dot triangle (two base dots, then apex on top).',
] };
const DOT_TEXT_4 = { type: 'text', tightAbove: true, lines: [
  'Fourth text block. Triangle of three dots above.',
  '§',
  'Continue for a 4-dot diamond (bottom-up bloom: bottom → left → right → top).',
] };
const DOT_TEXT_5 = { type: 'text', tightAbove: true, lines: [
  'Fifth text block. Four-dot diamond above.',
  '§',
  'Continue for a 5-dot diamond (center anchors first, then the same bloom).',
] };
const DOT_TEXT_6 = { type: 'text', tightAbove: true, lines: [
  'Sixth text block. Diamond with center above.',
  '§',
  'Continue for a 6-dot 3×2 grid (top row left-to-right, then bottom row).',
] };
const DOT_TEXT_7 = { type: 'text', tightAbove: true, lines: [
  'Seventh text block. 3×2 grid above.',
  '§',
  'Continue for 7 dots — the horizontal-line fallback that handles any count above 6.',
] };
const DOT_TEXT_8 = { type: 'text', tightAbove: true, lines: [
  'Eighth and final text block. Seven dots in a horizontal line above.',
  '§',
  'All seven DotSeparator counts (1 through 7) have now rendered. End of test.',
] };

export const routingTestModuleContent = {
  accentTerms: {
    routing: 'routing',
    bookmark: 'bookmark',
  },

  idleAnimation: 'moonrise',

  journal: {
    saveOnComplete: true,
    titlePrefix: 'ROUTING TEST',
  },

  sections: [
    // ── Index 0: Intro + Header Fade Tests (4 screens in one section) ──────
    {
      id: 'index-0-intro',
      type: 'screens',
      screens: [
        // Screen 1: "Header Fade Test" + Sunrise
        {
          blocks: [
            { type: 'header', title: 'Header Fade Test', animation: 'sunrise' },
            { type: 'text', lines: [
              'Screen 1 of 4 in this section.',
              '§',
              'Header: "Header Fade Test" + Sunrise.',
              '§',
              'Previewing the new sunrise animation across these screens.',
              'Next screen has the SAME title and SAME animation.',
              'Expected: nothing in the header should fade.',
            ] },
          ],
        },
        // Screen 2: Same title + same animation → header should NOT fade
        {
          blocks: [
            { type: 'header', title: 'Header Fade Test', animation: 'sunrise' },
            { type: 'text', lines: [
              'Screen 2 of 4.',
              '§',
              'Header: "Header Fade Test" + Sunrise (same as screen 1).',
              '§',
              'Next screen has the SAME title and SAME animation.',
              'Expected: nothing in the header should fade.',
            ] },
          ],
        },
        // Screen 3: Same title + same animation → header should still NOT fade
        {
          blocks: [
            { type: 'header', title: 'Header Fade Test', animation: 'sunrise' },
            { type: 'text', lines: [
              'Screen 3 of 4.',
              '§',
              'Header: "Header Fade Test" + Sunrise (same as screen 2).',
              '§',
              'Next screen has a DIFFERENT title but the SAME animation.',
              'Expected: animation stays, title fades to new text.',
            ] },
          ],
        },
        // Screen 4: Different title + same animation → only title should fade
        {
          blocks: [
            { type: 'header', title: 'Routing Overview', animation: 'sunrise' },
            { type: 'text', lines: [
              'Screen 4 of 4.',
              '§',
              'Header: "Routing Overview" + Sunrise (title changed, animation same).',
              '§',
              'This module tests the {routing} and {bookmark} system.',
              'Expected flow: 0 → 1 → 2 → 5 → 4 → 6',
              'Index 3 should be skipped.',
            ] },
          ],
        },
      ],
    },

    // ── Index 1: Education (ritual fade — slower, more intentional) ────────
    {
      id: 'index-1-education',
      type: 'screens',
      ritualFade: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Index 1 — Ritual Fade' },
            { type: 'text', lines: [
              'This section uses ritualFade: true.',
              '§',
              'Transitions should feel slower and more intentional (700ms vs 400ms).',
              '§',
              'Click Continue to feel the slower fade to the next screen.',
            ] },
          ],
        },
        {
          blocks: [
            { type: 'header', title: 'Index 1 — Ritual Fade' },
            { type: 'text', lines: [
              'Second ritual screen.',
              '§',
              'Click Continue to advance to index 2 (back to default snappy fade).',
            ] },
          ],
        },
      ],
    },

    // ── Index 2: Checkpoint ───────��───────────────────────────────���─────────
    {
      id: 'index-2-checkpoint',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Index 2 — Checkpoint' },
            { type: 'text', lines: [
              'Choose "Index 5" to test re-route with {bookmark} at index 4.',
              'Choose "Index 3" to test normal sequential flow.',
            ] },
            { type: 'choice', prompt: 'Where would you like to go next?', key: 'routeChoice',
              options: [
                { id: 'index5', label: 'Index 5', route: { to: 'index-5-target', bookmark: 'index-4-bookmark' } },
                { id: 'index3', label: 'Index 3 — next', route: 'index-3-skipped' },
              ] },
          ],
        },
      ],
    },

    // ── Index 3: Skipped (when routing to 5) ───────────��────────────────────
    {
      id: 'index-3-skipped',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Index 3' },
            { type: 'text', lines: [
              'If you chose "Index 5" at the checkpoint, you should NOT see this.',
              'If you chose "Index 3 — next", this is correct.',
            ] },
          ],
        },
      ],
    },

    // ── Index 4: Bookmark target ───────────────��────────────────────────────
    {
      id: 'index-4-bookmark',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Index 4 — Bookmark' },
            { type: 'text', lines: [
              'You should be here after completing index 5 (bookmark return).',
              'When you continue, index 5 should be skipped (already visited).',
            ] },
            { type: 'prompt', prompt: 'Index 4 journal prompt', placeholder: 'Write something or leave empty...' },
          ],
        },
      ],
    },

    // ���─ Index 5: Route target ───────────────────────────────────────────────
    {
      id: 'index-5-target',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Index 5 — Route Target' },
            { type: 'text', lines: [
              'You were routed here from the checkpoint at index 2.',
              'When you continue, the bookmark should return you to index 4.',
            ] },
            { type: 'prompt', prompt: 'Index 5 journal prompt', placeholder: 'Write something or leave empty...' },
          ],
        },
      ],
    },

    // ── Index 6: Final (routing recap) ──────────────────────────────────────
    // No longer terminal — flow continues to the DotSeparator test at index 7.
    {
      id: 'index-6-final',
      type: 'screens',
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Index 6 — Final' },
            { type: 'text', lines: [
              'If you see this, the routing worked.',
              '§',
              'Continue for the DotSeparator test.',
            ] },
            { type: 'text', condition: { visited: 'index-3-skipped' },
              lines: ['Index 3 was visited.'] },
            { type: 'text', condition: { notVisited: 'index-3-skipped' },
              lines: ['Index 3 was correctly skipped.'] },
            { type: 'text', condition: { visited: 'index-5-target' },
              lines: ['Index 5 was visited (correct).'] },
            { type: 'text', condition: { visited: 'index-4-bookmark' },
              lines: ['Index 4 was visited (correct).'] },
          ],
        },
      ],
    },

    // ── Index 7: DotSeparator Test ──────────────────────────────────────────
    // Validates the DotSeparator component across all seven supported counts
    // and their associated layout patterns. Same persistBlocks + shared
    // header + ritualFade pattern as Protector Dialogue Part 1's intro.
    // Each Continue press reveals the next text block preceded by a dot
    // separator with one more dot than the previous.
    //
    // Reveal 1 (initial): text 1 (no separator above).
    // Reveal 2: 1-dot separator + text 2.
    // Reveal 3: 2-dot horizontal separator + text 3.
    // Reveal 4: 3-dot triangle (two base + apex) + text 4.
    // Reveal 5: 4-dot diamond (bottom-up bloom) + text 5.
    // Reveal 6: 5-dot diamond + center (center anchors first) + text 6.
    // Reveal 7: 6-dot 3×2 grid (top row LTR, then bottom row LTR) + text 7.
    // Reveal 8: 7-dot horizontal line (the count >= 7 fallback) + text 8.
    //
    // Shared block refs (DOT_TEST_HEADER, DOT_SEP_*, DOT_TEXT_*) are reused
    // across screens so React reconciliation keeps them mounted — only the
    // newly-mounted blocks at the tail of each screen run their entry
    // animations (text fade-in for text blocks, dot-draw for separators).
    //
    // The separator's outer footprint is constant across all counts (the
    // SVG slot is sized for the diamond — the tallest pattern), so the
    // text-to-text gap stays identical regardless of which count is being
    // tested. This is the constraint that drives the slot-height design.
    {
      id: 'index-7-dot-separator-test',
      type: 'screens',
      persistBlocks: true,
      ritualFade: true,
      terminal: true,
      screens: [
        { blocks: [DOT_TEST_HEADER, DOT_TEXT_1] },
        { blocks: [DOT_TEST_HEADER, DOT_TEXT_1, DOT_SEP_1, DOT_TEXT_2] },
        { blocks: [DOT_TEST_HEADER, DOT_TEXT_1, DOT_SEP_1, DOT_TEXT_2, DOT_SEP_2, DOT_TEXT_3] },
        { blocks: [DOT_TEST_HEADER, DOT_TEXT_1, DOT_SEP_1, DOT_TEXT_2, DOT_SEP_2, DOT_TEXT_3, DOT_SEP_3, DOT_TEXT_4] },
        { blocks: [DOT_TEST_HEADER, DOT_TEXT_1, DOT_SEP_1, DOT_TEXT_2, DOT_SEP_2, DOT_TEXT_3, DOT_SEP_3, DOT_TEXT_4, DOT_SEP_4, DOT_TEXT_5] },
        { blocks: [DOT_TEST_HEADER, DOT_TEXT_1, DOT_SEP_1, DOT_TEXT_2, DOT_SEP_2, DOT_TEXT_3, DOT_SEP_3, DOT_TEXT_4, DOT_SEP_4, DOT_TEXT_5, DOT_SEP_5, DOT_TEXT_6] },
        { blocks: [DOT_TEST_HEADER, DOT_TEXT_1, DOT_SEP_1, DOT_TEXT_2, DOT_SEP_2, DOT_TEXT_3, DOT_SEP_3, DOT_TEXT_4, DOT_SEP_4, DOT_TEXT_5, DOT_SEP_5, DOT_TEXT_6, DOT_SEP_6, DOT_TEXT_7] },
        { blocks: [DOT_TEST_HEADER, DOT_TEXT_1, DOT_SEP_1, DOT_TEXT_2, DOT_SEP_2, DOT_TEXT_3, DOT_SEP_3, DOT_TEXT_4, DOT_SEP_4, DOT_TEXT_5, DOT_SEP_5, DOT_TEXT_6, DOT_SEP_6, DOT_TEXT_7, DOT_SEP_7, DOT_TEXT_8] },
      ],
    },
  ],
};

/**
 * Routing & Continuation Test Module
 *
 * Tests the flexible bookmark routing system.
 *
 * SECTIONS:
 *   Index 0: intro          — single screen with flow description
 *   Index 1: education      — single screen, normal sequential
 *   Index 2: checkpoint     — choice: "Index 5" (bookmark at 4) or "Index 3 — next"
 *   Index 3: skipped        — should be SKIPPED when routing to 5
 *   Index 4: bookmark       — return point after index 5, has journal prompt
 *   Index 5: target         — route target from checkpoint, has journal prompt
 *   Index 6: final          — visited-section condition checks
 *
 * Expected flow when choosing "Index 5":  0 → 1 → 2 → 5 → 4 → 6 (skips 3, skips re-visit of 5)
 * Expected flow when choosing "Index 3":  0 → 1 → 2 → 3 → 4 → 5 → 6 (normal sequential)
 */

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

    // ── Index 6: Final ────────────���─────────────────────────────────────────
    {
      id: 'index-6-final',
      type: 'screens',
      terminal: true,
      screens: [
        {
          blocks: [
            { type: 'header', title: 'Index 6 — Final' },
            { type: 'text', lines: [
              'If you see this, the routing worked.',
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
  ],
};

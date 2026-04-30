# Intention v2 — Post-Implementation Issue Tracker

A working list of issues found in the first implementation of `intentionSettingV2`. Each issue has a status, scope, and the precise change needed. We work through these one at a time.

**Files in scope (most issues):**
- [src/content/modules/master/intentionSettingV2.js](src/content/modules/master/intentionSettingV2.js)
- [src/components/active/modules/MasterModule/sectionRenderers/MeditationSection.jsx](src/components/active/modules/MasterModule/sectionRenderers/MeditationSection.jsx) (issues 3 & 4)
- [src/components/active/modules/MasterModule/useMasterModuleState.js](src/components/active/modules/MasterModule/useMasterModuleState.js) (issue 8)

---

## Issue 1 — Intention vs Expectation: more dot separators

**Status:** ☑ resolved

**Where:** `intention-vs-expectation` section, [intentionSettingV2.js](src/content/modules/master/intentionSettingV2.js) — the IIFE around lines 100–130

**Current shape (4 reveal screens, 1 separator):**
```
TEXT_1
TEXT_1 → SEP_1 → TEXT_2
TEXT_1 → SEP_1 → TEXT_2 → EXAMPLE
TEXT_1 → SEP_1 → TEXT_2 → EXAMPLE → FOOTER
```

**Target shape (6 reveal screens, 3 separators):**
```
TEXT_1
TEXT_1 → SEP_1 → TEXT_2
TEXT_1 → SEP_1 → TEXT_2 → SEP_2 → EXAMPLE
TEXT_1 → SEP_1 → TEXT_2 → SEP_2 → EXAMPLE → SEP_3 → FOOTER
```

(`SEP_2 = count: 2`, `SEP_3 = count: 3`. The example block and the footer both get `tightAbove: true` to snug to their separators.)

**Note:** This intentionally extends the dot-separator pattern beyond strict text→text — the user wants separators around the example block too. Keep this confined to this one section unless the user asks for the same elsewhere.

---

## Issue 2 — Slow Down First page: leaf animation, no separators, single screen

**Status:** ☑ resolved

**Where:** `meditation-offer` section, [intentionSettingV2.js](src/content/modules/master/intentionSettingV2.js)

**Changes:**
- Header animation: `morphing-shapes` → `leaf` (so it matches every other inquiry/reflection page)
- Drop `persistBlocks: true` and the multi-screen reveal
- Single screen with all blocks visible at once: header, both text paragraphs (combined into ONE text block with `§` separator), and the choice
- Drop `SEP_1` from this section

**Result:** all content (text + buttons) fades in together when the user lands on the page.

---

## Issue 3 — Progress bar shrinks to 0% on Basic Grounding idle

**Status:** ☑ resolved

**Where:** [MasterModule.jsx:174–177](src/components/active/modules/MasterModule/MasterModule.jsx) and the timer-based reporting inside `useMeditationPlayback`

**Root cause:** When the user routes into the `meditation` section, MasterModule's progress effect early-returns because `sectionType === 'meditation'`:

```js
const sectionType = state.currentSection?.type;
// Meditation/timer sections report their own progress — don't override
if (sectionType === 'meditation' || sectionType === 'timer') return;
```

That hands progress reporting to `useMeditationPlayback`, which reports timer-based progress: 0% at idle (no time elapsed), scaling as the audio plays. So entering the meditation idle reads "0% progress" → the progress bar visibly snaps backward.

**Fix options (pick one):**
1. **Hold the section-based progress until Begin is pressed.** While the meditation is on its idle stage (`!playback.hasStarted`), MasterModule should keep computing progress as if the meditation were a regular section step (use the `visitedCount`/`expectedTotal` formula). Only after Begin (when `hasStarted` flips true) hand off to timer-based progress.
2. **Don't let timer-based progress regress below the section base.** Floor the timer report at the meditation section's `sectionBase` value so the bar never visibly retreats.

Recommend option 1 — it matches user intent: progress accumulates by sections until the meditation actually plays.

**Implementation sketch:** add a `hasStarted` signal from MeditationSection up to MasterModule (via the existing progress channel or a new ref), and in the progress effect, skip the early-return when the meditation hasn't started yet.

---

## Issue 4 — Back from meditation playback skips the idle, jumps to gate

**Status:** ☑ resolved

**Where:** [MeditationSection.jsx:348–354](src/components/active/modules/MasterModule/sectionRenderers/MeditationSection.jsx)

**Root cause:** MeditationSection's `ModuleControlBar.onBack` is always wired to `onBackToPreviousSection`, which always navigates to the previous section in `sectionHistory`. There is no internal "back to idle" handler.

**Current behavior:**
- Idle stage → Back → previous section (correct: lands back on the gate)
- Playback stage → Back → previous section (wrong: should land on idle first)

**Target behavior:**
- Idle stage → Back → previous section (unchanged)
- Playback stage → Back → reset playback to idle stage; user sees the meditation's idle screen again with voice picker + Begin button. A subsequent Back from idle goes to the previous section.

**Implementation:** intercept `onBack` inside MeditationSection. If `playback.hasStarted` is true, reset to idle (likely via `playback.handleRestart` or a dedicated `playback.handleResetToIdle` if the hook doesn't expose one). Otherwise call `onBackToPreviousSection`.

If `useMeditationPlayback` doesn't currently support resetting cleanly back to the idle stage, that's a small extension to the hook. Either way the fix is local to MeditationSection + possibly the playback hook — generic improvement that benefits every meditation module.

---

## Issue 5 — Inquiry sections: drop dot separators, single screen each

**Status:** ☑ resolved

**Where:** `inquiry-territory`, `inquiry-feeling`, `inquiry-one-thing` sections in [intentionSettingV2.js](src/content/modules/master/intentionSettingV2.js)

**Changes (apply to all three):**
- Drop `persistBlocks: true`
- Collapse the multi-screen reveal into a single screen
- Combine the two text paragraphs into ONE text block with `§` between them
- Drop `SEP_1`
- Selector / inquiry beat sits in the same single screen alongside the text

For `inquiry-one-thing` (text-only): single screen, one combined text block, no selector.

---

## Issue 6 — My Intention prep beat: gray, centered, paragraph break

**Status:** ☑ resolved

**Where:** `write-intention` section, screen A's text block in [intentionSettingV2.js](src/content/modules/master/intentionSettingV2.js)

**Current:**
```js
{ type: 'text', lines: [
  "Now you'll have the chance to write out your intention. Take as long as you need.",
] }
```

**Target:** the prep text should be visually quieter to honor the moment — slightly gray, centered, two sentences split into two lines with a paragraph break.

**Approach options:**
1. Use the existing `text` block with `lines` split: `["Now you'll have the chance to write out your intention.", "§", "Take as long as you need."]`. Then either (a) extend the `text` block to support `align: 'center'` and `tone: 'muted'` props, or (b) create a small custom variant.
2. Simpler: render this as a custom one-off block (`intention-prep-text`) with hardcoded styling — centered, muted color (`var(--color-text-tertiary)`), `§` between sentences. ~15 lines.

Recommend option 2 for now (custom block) — it isolates the styling to a single use case without introducing new TextBlock props that might leak elsewhere. If this pattern recurs, generalize later.

---

## Issue 7 — Reflection + closing: drop unnecessary dot separators

**Status:** ☑ resolved

**Where:** `reflection-feel`, `reflection-beneath`, `closing` sections in [intentionSettingV2.js](src/content/modules/master/intentionSettingV2.js)

**Changes (apply to all three):**
- Drop `persistBlocks: true`
- Collapse the multi-screen reveals into single screens
- Combine paragraphs into ONE text block with `§` between them
- Drop the `SEP_1` / `SEP_2` separators
- Subsequent block (intention-prompt for reflection screens, intention-display for closing) sits in the same screen

The closing's `terminal: true` and `ritualFade: true` flags stay.

---

## Issue 8 — Final Continue should read "Complete"

**Status:** ☑ resolved

**Where:** [useMasterModuleState.js:465–466](src/components/active/modules/MasterModule/useMasterModuleState.js)

**Root cause:**
```js
const isLastSection = routeStack.length === 0
  && currentSectionIndex >= sections.length - 1;
```

This only flips true when `currentSectionIndex` is the LAST array index. Our `closing` sits at index 10, but the meditation tail-detour at index 11 is `sections.length - 1`. So when the user is on `closing`, `isLastSection` is false → ScreensSection's `getPrimaryLabel` returns "Continue" instead of "Complete".

**Fix:** treat a `terminal: true` section as effectively the last section. Update the predicate to:
```js
const firstTerminalIdx = sections.findIndex((s) => s.terminal === true);
const lastMainFlowIdx = firstTerminalIdx >= 0 ? firstTerminalIdx : sections.length - 1;
const isLastSection = routeStack.length === 0
  && currentSectionIndex >= lastMainFlowIdx;
```

Or even simpler:
```js
const isLastSection = routeStack.length === 0
  && (currentSection?.terminal === true || currentSectionIndex >= sections.length - 1);
```

Equivalent for our config; the first form is more explicit. Either is fine.

This is a generic MasterModule fix — protectorDialogueP1 doesn't use `terminal: true` for its last section so the bug never surfaced there. Worth flagging in the architecture doc that any future module using a terminal main-flow section gets this benefit automatically once fixed.

---

## Resolution order

The issues are independent — any order works. Suggested grouping for efficiency:

**Round 1 — content config edits (issues 1, 2, 5, 6, 7):** all in `intentionSettingV2.js`. One pass through the file. Issue 6 also touches a new tiny custom block file.

**Round 2 — MasterModule infrastructure fixes (issues 3, 4, 8):** generic improvements to MasterModule + MeditationSection that benefit other modules too. Each is self-contained.

**Round 3 — manual verification:** user runs the dev server and walks every path described in the original plan's Phase 4 verification (paths A–F).

---

## Additional follow-up (no issue yet, just noting)

- Stem example sentences in `STEM_ROWS` are placeholder defaults. User to provide final copy when convenient.
- Idle description copy in `idle.description` is a draft. User to revise.

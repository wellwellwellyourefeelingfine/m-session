# MasterModule Engine

> For UI conventions, idle-screen anatomy, copy rules, animation choices, dot separators, and content authoring guidance — see the [MasterModule Style Sheet](../src/components/active/modules/MasterModule/MasterModuleStyleSheet.md). This chapter covers the **engine**: state machine, section runner, block registry, routing internals, journal assembly, visit tracking, and persistence.

## Three-Layer Hierarchy

```
Section (control bar + lifecycle)
  └── Screen (one page the user sees)
       └── Blocks[] (vertical stack of visual components)
```

**Sections** own the control bar, lifecycle, and slot configuration. **Screens** represent one page the user sees. **Blocks** are atomic visual building blocks that can be freely composed on any screen.

### Section Types

| Type | Purpose | Key Config |
|------|---------|------------|
| `screens` | Step-through screen sequence | `screens[], hideTimer?, rightSlotViewer?, ritualFade?, persistBlocks?, terminal?` |
| `meditation` | Audio-synced meditation via `useMeditationPlayback` | `meditationId, animation?, showTranscript?, composerOptions?, terminal?` |
| `timer` | Countdown timer for music/dance/rest | `animation?, showAlarm?, recommendations?, allowAddTime?, terminal?` |
| `generate` | PNG generation with RevealOverlay | `generatorId, buttonLabel, saveToJournal?, imageName?, terminal?` |

Any section can set `terminal: true` to end the module cleanly when the user advances past it — see "Terminal Sections" below.

### Block Types

| Type | Props | Description |
|------|-------|-------------|
| `header` | `title?, animation?, animationProps?, titleClassName?` | Title text + centered animation (default: AsciiMoon) |
| `text` | `lines[]` | Paragraphs with markup: `§` = spacer, `{term}` = accent, `{#N}` = numbered |
| `prompt` | `prompt, context?, placeholder?` | Journaling textarea (respects journal font settings) |
| `selector` | `prompt, key, options[], columns?, multiSelect?, journal?` | Grid selection with optional follow-up textarea |
| `choice` | `prompt, key, options[{id, label, route?}]` | Selection that optionally routes to another section |
| `animation` | `animation, header?, lines?` | Standalone animation with optional text |
| `alarm` | `activityName` | Prompt to set native phone alarm |
| `review` | `assembleFrom[], editable?, header?, context?` | Assembled prompt response review/editing |

### Shorthand Screen Types

Screens with a `type` field auto-expand into `[headerBlock, contentBlock]` via `expandScreenToBlocks`. This is syntactic sugar — under the hood, every screen is blocks.

```javascript
// Shorthand:
{ type: 'text', header: 'Welcome', lines: ['Hello.'] }
// Equivalent explicit blocks:
{ blocks: [
  { type: 'header', title: 'Welcome', animation: 'ascii-moon' },
  { type: 'text', lines: ['Hello.'] },
] }
```

Use explicit `blocks` arrays when you need mixed content on one screen.

---

## Routing & Conditional Flow

Two complementary systems for dynamic module flow:

**Routing** — "leave this section and jump to a different one." Used for branching flows where entire sections are swapped.

**Conditions** — "stay in this section, but show/hide specific screens or blocks based on earlier choices." Used for inline content variation.

### Choice Block Routes

```javascript
// No route — saves value for conditional rendering, Continue goes to next screen
{ type: 'choice', prompt: 'How are you?', key: 'mood', options: [
  { id: 'calm', label: 'Calm' },
  { id: 'heavy', label: 'Heavy' },
] }

// String route (skip-ahead) — jump and continue forward from there
{ id: 'settled', label: 'Settled', route: 'med-d' }

// Object with bookmark: true — loop route, return to section after this one
{ id: 'breathe', label: 'Breathe', route: { to: 'breathing', bookmark: true } }

// Object with bookmark: 'section-id' — return to a named section
{ id: 'refine', label: 'Refine', route: { to: 'intention-flow', bookmark: 'gate-section' } }
```

**Persisted choices.** `choiceValues` is durable — a selection made on one visit persists across back-navigation and bookmark returns. If a user back-navigates to a choice screen, their prior selection stays visible. Gate patterns like the Opening Ritual Crossroads rely on this behavior.

### Sequential Advance & Visited Section Skipping

When advancing sequentially (no bookmark to pop), `advanceSection` automatically skips sections that have already been visited. This prevents replaying sections when routing creates non-linear paths.

### Terminal Sections

A section with `terminal: true` ends the module cleanly when the user advances past it, regardless of what sits after it in the array. This exists so modules can put routed-to "tail detour" sections *after* the user's final main section without risking sequential walk-through into them.

```javascript
sections: [
  // ... main flow ...
  { id: 'final-moment', type: 'screens', terminal: true, screens: [...] },
  // Tail detours — reachable only via routes, never via sequential advance
  { id: 'optional-breath', type: 'meditation', meditationId: '...' },
]
```

### History-Based Back Navigation

Back navigation follows the user's *actual visit path*, not the section array index. A `sectionHistory` stack records the sections the user came from, and `goBackToPreviousSection` pops it. Sequential advances and routes push the current section index; bookmark pops are treated as "closing a side trip" — they don't push the completed detour, and they pop the gate's entry if the round-trip ended where it started.

**Un-visit on back.** When the user presses Back, the section they're leaving is removed from `visitedSections`. This makes forward re-traversal work smoothly — the next Continue won't skip past the section they just backed out of.

**Back also prunes stale route-stack entries.** If the section the user back-navigates *into* is the current top of `routeStack`, the back handler drops that entry to prevent stale pops.

`canGoBackToPreviousSection` is simply `sectionHistory.length > 0`.

Both MasterModule and TransitionModule use the same history-based design. In TransitionModule, `sectionHistory` is persisted to `activeNavigation` so force-closing the app mid-transition preserves Back behavior on resume.

### Context-Aware Skip

When the user is inside a bookmark-routed detour (`routeStack` non-empty), Skip advances the section — popping the bookmark back to the gate. Skip means "abandon this detour activity," not "abandon the whole flow." When there's no active bookmark, Skip falls through to the parent's skip handler.

**Meditation sections always advance on skip.** `MeditationSection` hardcodes skip to fire `onSectionComplete` — meditation skip never abandons the flow, regardless of detour state.

**Skip-to-end gate (`skip.requireVisited`).** TransitionModule configs can gate main-flow skip on a specific section having been visited — e.g., the Opening Ritual gates skip-to-end on `substance-intake-confirm`.

**Disable main-flow skip entirely (`skip.allowed: false`).** Used for transitions that shouldn't be skippable (e.g., the Closing Ritual).

---

## Conditional Content

Any block or screen can have a `condition` field. It only renders when the condition passes.

```javascript
// Exact match
{ condition: { key: 'mood', equals: 'heavy' } }
// One-of match
{ condition: { key: 'mood', in: ['heavy', 'numb'] } }
// Has any value (truthy)
{ condition: { key: 'mood' } }
// Section was visited / not visited
{ condition: { visited: 'med-b' } }
{ condition: { notVisited: 'med-c' } }

// Compound: AND / OR / NOT
{ condition: { and: [{ key: 'mood', equals: 'heavy' }, { key: 'bodyArea', equals: 'chest' }] } }
{ condition: { or: [{ key: 'mood', equals: 'heavy' }, { visited: 'activation-section' }] } }
{ condition: { not: { storeValue: 'sessionProfile.holdingQuestion' } } }
```

**Transition-only conditions** (require `storeState` / `sessionData` in context — available in TransitionModule, not MasterModule):

```javascript
{ condition: { storeValue: 'sessionProfile.holdingQuestion' } }          // truthy
{ condition: { storeValue: 'booster.status', equals: 'taken' } }         // exact match
{ condition: { storeValue: 'journalCount', gte: 5 } }                    // numeric
{ condition: { moduleCompleted: 'values-compass' } }
{ condition: { helperUsedDuring: 'peak' } }
```

Conditions work on blocks, screens, review blocks, and journal entries. Evaluated by `evaluateCondition()` in `utils/evaluateCondition.js` against `choiceValues`, `selectorValues`, and `visitedSections`.

---

## Section Visit Tracking

`useMasterModuleState` tracks completed sections in a `visitedSections` array, updated each time `advanceSection()` or `routeToSection()` is called. Every block is tagged with its parent `sectionId` during indexing.

Section visits serve three purposes:
1. **Conditional content** — `condition: { visited: 'med-b' }` shows/hides blocks
2. **Sequential skip** — `advanceSection` skips already-visited sections
3. **Journal & review filtering** — prompts from unvisited sections are excluded

---

## Journal Assembly

Journal entries are built by `journalAssembler.js` on module/transition completion. Both MasterModule and TransitionModule use the same assembler. Two-layer filtering:

1. **Section visited?** — Each block carries a `sectionId`. If the section was never visited, all its blocks are excluded.
2. **Condition passed?** — If a block has a `condition` field and it fails, the block is excluded.

Blocks that pass both filters are always included, even if blank. Empty prompts are saved as `[no entry — 3:45 PM]` with a wall-clock timestamp (physical-journal compatibility).

**Captured block types:**

| Block | What lands in the journal |
|---|---|
| `prompt` | Prompt text (or `journalLabel` override), then the user's response or `[no entry — time]` |
| `selector` | Prompt text, then selected option label(s). If `journal: true`, follow-up text appended |
| `body-check-in` | `Body sensations (<phase>):` followed by comma-joined labels. Skipped in `mode: 'comparison'` |
| `ingestion-time` | `Substance taken at: 3:42 PM`. Only `mode: 'record'` emits (dedupe with `confirm`) |
| `store-display` | `<label>:` followed by store value. Deduplicated against prompts with the same `storeField` |

**`journalLabel` override.** Any capturable block can set `journalLabel: 'Touchstone'` to override the default label in the journal.

**Storing the entry.** MasterModule passes `sessionId`; TransitionModule omits it. Entries shorter than two lines (title only) are skipped.

---

## Section Config Flags

**`ritualFade: true`** — Slows screen transitions from 400ms (default) to 700ms for ceremonial moments.

**`persistBlocks: true`** — Blocks stay across screens instead of cross-fading. React's keyed reconciliation reuses DOM for blocks at matching indexes. Only newly-mounted blocks fade in. Also skips auto-scroll-to-top on advance. Keep identical blocks at identical indexes across screens to avoid remount.

**Meditation Variations** — Meditation sections automatically detect and render variation selectors when the content defines `variations` and `assembleVariation()`.

**PNG Generation** — The `generate` section type orchestrates: generate button → RevealOverlay → PNG creation → ImageViewerModal → advance. Generator functions are registered in `generators/registry.js` by ID.

---

## Central State

All user data persists across sections in `useMasterModuleState`:

| State | Shape | Description |
|-------|-------|-------------|
| `responses` | `{ promptIndex: text }` | Every prompt answer |
| `selectorValues` | `{ key: id \| [ids] }` | Every selector pick |
| `selectorJournals` | `{ key: text }` | Every selector follow-up text |
| `choiceValues` | `{ key: optionId }` | Every choice selection |
| `visitedSections` | `string[]` | Completed section IDs |
| `sectionHistory` | `number[]` | Stack of previously-visited section indexes |
| `generatedImages` | `{ generatorId: { blob, url } }` | Generated PNGs |

Each block also carries a `sectionId` tag linking it to its parent section for journal filtering.

---

## Custom Block Registry

`MasterModule` passes a `customBlockRegistry` into `ScreensSection`, which falls through to it for any block `type` not handled by the standard renderers. The registry lives at `src/components/active/modules/MasterModule/customBlocks/index.js` and is **empty by default** — it exists as an extension point.

A custom block receives `{ block, context }` with state reads, state writers, navigation, `reportReady`, `setPrimaryOverride`, and `accentTerms`. Unlike TransitionModule, MasterModule does not pass `storeState` — custom blocks subscribe to `useSessionStore` directly.

`sessionProfile` is the single source of truth for user-entered identity/intent/preferences data. Always write through `updateSessionProfile(field, value)`.

See [transition-module.md](transition-module.md) for TransitionModule's populated custom block registry.

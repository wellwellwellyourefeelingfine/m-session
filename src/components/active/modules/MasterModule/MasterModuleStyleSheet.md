# Master-Module Style Sheet

> **Read this before authoring or modifying any master module.**
> This is the single source of truth for design, UI, copy, and behavior conventions across the master-module system. The conventions exist for consistency, accessibility, and feel — drift is expensive to undo, so favor following the patterns here even when an alternative looks cleaner in isolation.
>
> *Last reviewed: 2026-04-26*

---

## Table of Contents

1. [Quick Start (the 5 rules)](#1-quick-start-the-5-rules)
2. [Authoring or Migrating a Module — Step-by-Step](#2-authoring-or-migrating-a-module--step-by-step)
3. [Reference Module](#3-reference-module)
4. [Conventions Reference](#4-conventions-reference)
   - [Headers](#headers)
   - [Body Text](#body-text)
   - [DM Serif Prompts](#dm-serif-prompts)
   - [Tone of Voice](#tone-of-voice)
5. [Anatomy](#5-anatomy)
6. [Animations & Transitions](#6-animations--transitions)
7. [Audio Meditations](#7-audio-meditations)
8. [Routing & Bookmarks](#8-routing--bookmarks)
9. [Tokens & Accent Terms](#9-tokens--accent-terms)
10. [Conditional Content](#10-conditional-content)
11. [Custom Blocks](#11-custom-blocks)
12. [Section Ordering Recommendations](#12-section-ordering-recommendations)
13. [Linked Parts Pattern](#13-linked-parts-pattern)
14. [Migration Checklist (legacy → v2)](#14-migration-checklist-legacy--v2)
15. [Appendix](#15-appendix)

---

## 1. Quick Start (the 6 rules)

If you remember nothing else from this doc, remember these:

1. **Headers are descriptors, not questions. Title Case, no terminal punctuation.**
   - ✓ `What Surfaced`, `Set This Aside`, `Bodily Feeling`
   - ✗ `What showed up?`, `Set this aside.`, `What is it afraid of?`
2. **The actual question goes in the DM Serif prompt slot directly above the input** — `prompt:` field on PromptBlock, ProtectorFieldBlock, or ChoiceBlock. Not in the header. Not buried in a body-text block.
3. **Module idle has title → subtitle (accent) → animation → description → time pill.** No expandable disclosure. If the module embeds a meditation, voice picker and accurate per-meditation duration live on the *meditation section's* idle, not the module idle.
4. **Tone is intelligent and grounded, not AI-affirming.** No `that's a real skill`, no `that matters more than you might think`, no two-beat motivational pacing (`Let it sit. Let it settle.`). Treat the user as an adult.
5. **For "two pages" that share a header and animation, combine them into ONE section with multiple screens** — header continuity only works within a single section. Spread the same JS reference (a `const SECTION_HEADER = {...}`) into each screen's `blocks` so React reconciliation matches by index.
6. **NEVER gate Continue on a filled-in input.** The app must be physical-journal compatible — a user can press Continue through every prompt without typing anything, because they're writing in their paper journal alongside. The journal assembler records `[no entry — HH:MM]` for any empty prompt so the user can map paper-journal timestamps back to in-app prompts later. No `requireForContinue: true`, no gating useEffect, no disabled buttons on empty textareas. Choices (selection-required by nature) are the only place gating is permitted, and even then only when the *flow* genuinely needs the value (e.g. a routing branch).

---

## 2. Authoring or Migrating a Module — Step-by-Step

### Greenfield: writing a new module config

1. Create `src/content/modules/master/myModule.js`. Default `export const myModuleContent = { ... }`.
2. Register it in [`src/content/modules/library.js`](../../../../content/modules/library.js): add a library entry with `type: 'my-module'`, `category`, `defaultDuration`, `allowedPhases`, `content: { masterModuleContent: myModuleContent }`.
3. Register the type in [`src/components/active/moduleRegistry.js`](../../moduleRegistry.js): `'my-module': MasterModule`.
4. Add it to a timeline in [`src/content/timeline/configurations.js`](../../../../content/timeline/configurations.js).
5. Author the content config:
   - **Idle** with `title`, `subtitle`, `description` (inline rich copy, no expandable). Override `durationMinutes` only when the library `defaultDuration` doesn't match the activity total.
   - **Sections** as an array. Pick section types per §12. Use shared header constants (per rule #5) for any section that has multiple screens.
   - **Journal** with `saveOnComplete: true` and a `titlePrefix` if the module collects responses.
6. Run through the [pre-merge checklist](#pre-merge-checklist) below.

### Migrating a legacy module to v2

See [§14 Migration Checklist](#14-migration-checklist-legacy--v2).

### Pre-merge checklist

Before considering a master-module change "done":

- [ ] All headers in Title Case, no terminal punctuation, descriptor-not-question
- [ ] Every input question lives in a DM Serif `prompt` slot directly above the input
- [ ] Idle screen has no expandable; description is inline and reads like editorial copy
- [ ] If embedded meditation: `meditation.fixedDuration` set if the audio has a measured length; voice picker auto-renders on the meditation idle
- [ ] Multi-screen sections use a shared JS-reference header constant; `persistBlocks: true` only when progressive-reveal is the intent
- [ ] If a section bookmarks to a sequentially-adjacent detour, the stale-bookmark guard is in `useMasterModuleState.advanceSection` — verify the round-trip lands on the next section, not back on the detour
- [ ] Tokens (`{protectorName}`, etc.) substitute correctly in every block that displays them; ChoiceBlock prompts also support tokens
- [ ] Read every new or modified screen's copy aloud. If it sounds patronizing, motivational, or like a wellness app's affirmation chatbot, rewrite it.

---

## 3. Reference Module

[`src/content/modules/master/protectorDialogueP1.js`](../../../../content/modules/master/protectorDialogueP1.js) is the canonical example. When in doubt about a pattern, look there first.

| Pattern | Where in protectorDialogueP1.js |
|---|---|
| Module idle with inline description, durationMinutes override | lines 83–101 |
| Shared header constant pattern (the rule #5 idiom) | lines 23–28, 41–45, 50–54 |
| Intro section: 3-screen progressive reveal with `persistBlocks` + `ritualFade` | lines 109–170 |
| Embedded meditation section (voice picker + loading screen handled in MeditationSection) | lines 170–179 |
| Combined section with continuous header across screens (naming + feel-toward) | lines 179–243 |
| Choice with bookmark-routed detour | lines 59–63 |
| Bookmarked detour (unblending) with `persistBlocks` 2-screen reveal | lines 243–291 |
| Per-option conditional response pattern | lines 72–79 (`FEEL_TOWARD_RECHECK_NOTES`) + the spread inside the unblending section |
| Body input with DM Serif prompt above it | lines 291–314 (body-location), 314–343 (message) |
| Ritual-fade closing with diamond animation | lines 343+ |

[`src/content/modules/master/protectorDialogueP2.js`](../../../../content/modules/master/protectorDialogueP2.js) demonstrates linked-part continuity (Part 2) — see §13.

---

## 4. Conventions Reference

### Headers

**Header copy: Title Case, no terminal punctuation.**

| ✓ | ✗ |
|---|---|
| `What Surfaced` | `What showed up?` |
| `Set This Aside` | `Set this aside.` |
| `Where In Your Body` | `Where in your body?` |
| `The Fear Beneath` | `What is it afraid of?` |
| `Closing Notes` | `That's it for now.` |
| `Going Deeper` | `Going deeper.` |

**The header is the section's *descriptor*, not the question being asked.** The question goes in the prompt slot below (see [DM Serif Prompts](#dm-serif-prompts)).

**Header is also where the per-section animation lives:**
```js
{ type: 'header', title: 'Bodily Feeling', animation: 'ascii-moon' }
```
Animation options: `'ascii-moon'` (default), `'ascii-diamond'` (closing/ritual moments), `'morphing-shapes'`, `'leaf'`, `'compass'`, `'wave'`, `'sunrise'`, `'full-sun'`, `'sunset'`, `'moonrise'`. `null` means no animation slot — for text-only beats like `What It Guards`.

### Body Text

Body text is **orienting copy** that sets up the prompt or carries education. It comes after the header/animation and *before* the DM Serif prompt slot.

- Renders via [TextBlock](./blockRenderers/TextBlock.jsx) using [renderContentLines](./utils/renderContentLines.jsx).
- Markup support: `§` (vertical spacer between paragraphs), `{accentTerm}` (accent-colored substitution), `{#N} text` (numbered list item with accent number), `{icon:NAME}` (inline icon).
- Should be conversational and concise. Two short paragraphs almost always beats one long one.
- **Don't repeat the prompt question in body text.** If the prompt is "What does it need from you?", the body text should orient (`Listen for what it asks of you, not what you ask of it...`) and trust the prompt below to ask.

### DM Serif Prompts

The DM Serif prompt slot is the **actual question or directive** — the line right above the input that tells the user what to write or pick. It renders in DM Serif Text at `text-base` size.

Three blocks support the `prompt` field:

| Block | Use case | File |
|---|---|---|
| `prompt` (PromptBlock) | Free-text journaling | [PromptBlock.jsx](./blockRenderers/PromptBlock.jsx) |
| `protector-field` | Protector-specific named field that mirrors to `sessionProfile.protector` | [ProtectorFieldBlock.jsx](./customBlocks/ProtectorFieldBlock.jsx) |
| `choice` (ChoiceBlock) | Multiple-choice selection (with optional routing) | [ChoiceBlock.jsx](./blockRenderers/ChoiceBlock.jsx) |

All three accept `prompt:` (renders as DM Serif text-base above the input) and substitute `{accentTerm}` tokens. `context:` (small uppercase mono caps) is also supported for a label above the prompt — use sparingly.

```js
// Good — question in the prompt slot, body text orients without repeating
{ type: 'text', lines: ["Now we'll put words to what just came up. Nothing precise — just whatever feels true."] },
{
  type: 'protector-field',
  field: 'name',
  prompt: 'In a word or short phrase, what would you call it?',
  placeholder: 'e.g., The Critic, The Wall, The Fixer...',
  ...
},
```

### Tone of Voice

The voice is **intelligent, grounded, observational.** Treat the user as an adult having a real experience. Do not affirm them, congratulate them, or narrate emotional payoff.

**Cut phrases and patterns:**

| ✗ Avoid | Why |
|---|---|
| `that's a real skill` | Pat-on-the-head |
| `you noticed something real` | Generic reward sticker |
| `that matters more than you might think` | Patronizing |
| `Let it sit. Let it settle.` | Two-beat motivational pacing reads as AI cadence |
| `One more question, and this one matters.` | Manufactured emphasis |
| `This is an important question.` | Tells the user their work is important — let it speak for itself |
| `you approached it with curiosity instead of combat` | Performative framing of the user's choice |
| `it knows you're paying attention` | Anthropomorphizing in a performative way |
| `Today, you deepened a relationship.` | Affirming sentence as a header |

**What good looks like (drawn from the Part 1 closing rewrite):**

> Don't try to analyze it yet. What surfaced is more honest before you shape it into a story about yourself.

> Patterns like this stay hidden by running quietly in the background. Naming one and turning toward it changes the relationship on its own. Nothing else is required of you right now.

Observational, specific, no affirmation. Trust the user to feel what they feel.

---

## 5. Anatomy

### Module-level idle screen

```
┌─────────────────────────────────┐
│           [TITLE]               │   <- DM Serif, large
│   [SUBTITLE — accent, mono caps]│   <- between title and animation
│                                 │
│        [animation]              │   <- ascii-moon by default
│                                 │
│   description description       │   <- inline rich copy, left-aligned
│   description description.      │
│                                 │
│        [time: 35 min]           │   <- duration pill, accent-bordered
└─────────────────────────────────┘
        [Begin]   (Skip)
```

Render order is fixed by [`IdleScreen` in ModuleLayout.jsx](../../capabilities/ModuleLayout.jsx). Don't add an expandable disclosure. The description should incorporate any framing that historically lived in an expandable.

`durationMinutes` lives on the `idle` config and overrides `module.duration` for display when the activity total differs from the library `defaultDuration` (e.g. when the library default is the meditation duration but the activity also has reflection screens around it).

The animation slot defaults to `ascii-moon`; override at the content config root with `idleAnimation: 'animation-name'` (string keys from the `ANIMATION_MAP` in [HeaderBlock.jsx](./blockRenderers/HeaderBlock.jsx)). The same animation keys work in section-level header blocks.

### Section-level screen anatomy (when a section asks for input)

```
┌─────────────────────────────────┐
│         [HEADER]                │   <- Title Case, no period
│                                 │
│        [animation]              │   <- per-screen, often shared
│                                 │
│   body text orienting the user. │   <- mono/serif primary, optional
│   §                             │
│   more body text if needed.     │
│                                 │
│   DM Serif prompt question?     │   <- the actual ask, text-base
│   ┌─────────────────────────┐   │
│   │  input / textarea       │   │
│   └─────────────────────────┘   │
└─────────────────────────────────┘
            [Continue]
```

For text-only beats (no input): omit the prompt slot. For choice-based beats: the choice options replace the input.

### Crucial — meditation idle vs module idle

When a module embeds a meditation section:

- **Module idle** shows the activity's *total* time (e.g. 35 min for a meditation + reflection module) and **does not** show the voice picker.
- **Meditation section idle** (the second idle the user lands on, after pressing Begin and going through any intro screens) shows the *meditation's* time (`meditation.fixedDuration`) and **the voice picker**.

This is auto-handled by [`MeditationSection`](./sectionRenderers/MeditationSection.jsx). Don't try to put the voice picker on the module idle. Don't try to put the activity total on the meditation idle.

---

## 6. Animations & Transitions

**Fade timing:**
- `FADE_DEFAULT = 400ms` — standard screen-to-screen body fade
- `FADE_RITUAL = 700ms` — slower, more intentional. Set `ritualFade: true` on the section to use it. Reserved for opening, closing, and other ceremonial beats.

**`persistBlocks: true` (on the section)** keeps body blocks at matching indexes mounted across screens — the progressive-reveal pattern. With this set, screens add new blocks rather than replacing the previous screen's content. Without it, every screen change fades the full body in/out.

**Header + animation continuity ACROSS screens within a section:** [`ScreensSection`](./sectionRenderers/ScreensSection.jsx) compares `headerBlock.title` and the resolved animation key between consecutive screens — when both match, neither fades on transition. The header stays anchored while only the body content fades.

**To extend continuity across what feels like "two pages" of one experience:** combine them into ONE section with multiple screens. Two SEPARATE sections always remount fresh DOM and re-fade everything, even if their headers happen to match — there's no cross-section persistence.

**Use the same JS reference for shared blocks across screens.** Define a `const SECTION_HEADER = { type: 'header', title: 'X', animation: 'Y' }` at the top of the content file and spread the same reference into every screen that shares it. React's keyed reconciliation matches blocks by index, so a shared reference at the same index keeps its DOM and avoids re-running its mount animations.

```js
// Top of content file
const NAMING_SECTION_HEADER = {
  type: 'header',
  title: 'What Surfaced',
  animation: 'ascii-moon',
};

// Inside the section
screens: [
  { blocks: [NAMING_SECTION_HEADER, /* screen 1 body */] },
  { blocks: [NAMING_SECTION_HEADER, /* screen 2 body */] },  // SAME ref → no re-fade
],
```

**Smooth scroll** between revealed blocks uses [`smoothScrollToElement`](../../../../utils/smoothScroll.js) — a custom quintic curve with a subtle landing overshoot (~9% peak, then settles). Defaults are right; callers don't pass `easing` or `duration`. Honors `prefers-reduced-motion` (instant jump).

---

## 7. Audio Meditations

Meditations are a section type (`type: 'meditation'`) inside an otherwise text/prompt-driven module. The section delegates to [`MeditationSection`](./sectionRenderers/MeditationSection.jsx).

**Duration display on the meditation idle:**
- If the meditation has a measured composed length (audio assembled from prompts + silences + gongs), set `meditation.fixedDuration` to that length in seconds. The meditation idle pill will show `Math.round(fixedDuration / 60)` minutes.
- Without `fixedDuration`, the pill falls back to `module.duration`, which is usually the *activity total*, not the meditation's actual length — that's wrong. Always set `fixedDuration` for meditations with measured audio.

**Voice picker:**
- When a meditation declares `audio.voices`, the picker auto-renders on the *meditation* idle (not the module idle).
- Initial selection comes from the user's global preference (`useAppStore.preferences.defaultVoiceId`) via [`resolveEffectiveVoiceId`](../../../../content/meditations/index.js).
- The selected voice is locked in when the user presses Begin — mid-session pill changes don't disturb in-flight playback.

**Loading screen between idle and active:**
- Pressing Begin runs `playback.handleBeginWithTransition` from [`useMeditationPlayback`](../../../../hooks/useMeditationPlayback.js), which:
  1. Fades out the idle screen
  2. Shows [`MeditationLoadingScreen`](../../capabilities/MeditationLoadingScreen.jsx) while it composes the audio for the chosen voice
  3. Fades the loading screen out once the audio is loaded and playing
- This is automatic — content authors don't wire it up.

**Module idle when the module embeds a meditation:**
- Don't put `voices` in the module-level `idle` config. The auto-derive that pulled meditation voices onto the module idle was deliberately removed — voice selection is the meditation idle's responsibility.
- `idle.durationMinutes` should be the *activity total* (meditation + surrounding screens), not just the meditation. Override the library `defaultDuration` if the library number doesn't reflect the full activity.

---

## 8. Routing & Bookmarks

A choice option's `route` field tells the master module to jump to a different section when the user picks that option:

```js
{ id: 'frustrated', label: 'Frustrated', route: { to: 'unblending', bookmark: true } }
```

**`bookmark: true`** auto-bookmarks at `currentSectionIndex + 1` — i.e., "after the detour completes, return to the section that follows the gate." This works cleanly when the detour lives somewhere *non-adjacent* in the section array (e.g., at the array tail).

**`bookmark: 'section-id'`** (named) explicitly names the section to land on after the detour. **Prefer named bookmarks for adjacent gate→detour layouts** (where the detour is the next section after the gate) — it makes the intent explicit and avoids the stale-bookmark trap.

**Stale-bookmark guard** (in [`useMasterModuleState.advanceSection`](./useMasterModuleState.js#L207)): when the bookmark target is the section we just finished or one already visited, the engine drops the bookmark and falls through to sequential advance. This was added to fix a bug where adjacent gate→detour layouts left the user on a blank screen.

**No bookmark** (`route: { to: 'somewhere' }` without the `bookmark` field) means "skip ahead to that section, no return point" — used for one-way branches.

**Special routes:** `route: { to: '_next' }` advances sequentially; `route: { to: '_complete' }` finalizes the module immediately.

---

## 9. Tokens & Accent Terms

`{tokenName}` in any text — body, prompt, choice option labels — substitutes runtime values via the `accentTerms` map. The substitution renders the value in the accent color via [`renderLineWithMarkup`](./utils/renderContentLines.jsx).

**Built-in tokens:**
- `{protectorName}` — resolves from `sessionProfile.protector.name`, falls back to `your protector`
- `{bodyLocation}` — resolves from `sessionProfile.protector.bodyLocation`, falls back to `in your body`

Tokens are merged into `accentTerms` at render time inside [`MasterModule.jsx`](./MasterModule.jsx). To add a new runtime token, extend the merge in MasterModule.

**Static accent terms** can be declared at the content config level via `content.accentTerms = { keyword: 'displayed text' }`. Useful for module-specific terminology.

**Markup syntax (handled by [`renderContentLines`](./utils/renderContentLines.jsx)):**

| Syntax | Effect |
|---|---|
| `§` | Vertical spacer between paragraphs (line on its own) |
| `{term}` | Accent-colored substitution from `accentTerms` |
| `{#N} text` | Numbered list item with accent-colored number |
| `{icon:NAME}` | Inline icon (currently `heart`) |

**Blocks that substitute tokens:**
- `text` (TextBlock) — full markup support
- `prompt` (PromptBlock) — `prompt` and `context` fields
- `protector-field` (ProtectorFieldBlock) — `prompt`, `context`, and `placeholder`
- `choice` (ChoiceBlock) — `prompt` and `context` (option labels are typically static)
- `header` (HeaderBlock) — `title` field (via `renderLineWithMarkup`)

The idle screen description does *not* run substitution (no protector context yet). Avoid using runtime tokens there.

---

## 10. Conditional Content

Blocks and screens can render conditionally via the `condition` field. Evaluated by [`evaluateCondition`](./utils/evaluateCondition.js).

**Common patterns:**

```js
// Show only when a choice has a specific value
{ type: 'text', condition: { key: 'feelTowardRecheck', equals: 'curious' }, lines: [...] }

// Show when value is one of several
{ type: 'text', condition: { key: 'feelTowardRecheck', in: ['frustrated', 'afraid', 'numb'] }, lines: [...] }

// Show when a section has been visited
{ ..., condition: { visited: 'unblending' } }

// Compound
{ ..., condition: { and: [{ key: 'a', equals: 'x' }, { not: { visited: 'b' } }] } }
```

**Per-option-response pattern** — the canonical use case is rendering one tailored response per choice option. Spread the options into per-option conditional blocks:

```js
// At top of content file
const FEEL_TOWARD_RECHECK_NOTES = {
  curious: 'Curiosity is the doorway. {protectorName} can feel the difference between being observed and being met.',
  warm: 'That warmth is the shift. {protectorName} has been working alone for a long time...',
  // ... one per option id
};

// Inside the section's screen blocks, after the choice
...FEEL_TOWARD_OPTIONS.map((opt) => ({
  type: 'text',
  condition: { key: 'feelTowardRecheck', equals: opt.id },
  lines: [FEEL_TOWARD_RECHECK_NOTES[opt.id]],
})),
```

Only the matching block renders; the others remain mounted but invisible. See [protectorDialogueP1.js lines 72–79 and the unblending section](../../../../content/modules/master/protectorDialogueP1.js) for the live example.

---

## 11. Custom Blocks

When a section needs behavior the standard block types can't express, add a custom block to [`./customBlocks/`](./customBlocks/). The contract — context shape, state writers, navigation, readiness gating, primary-button override, gotchas, reference implementations — is documented in detail at [`./customBlocks/index.js`](./customBlocks/index.js).

**Don't duplicate that doc here.** Read it before authoring a custom block.

**When to add one (rule of thumb):** the block needs to read or write session-store state in a way the standard blocks can't, OR the block has its own complex internal flow (the dialogue loop, the protector-reconnection welcome panel). For everything else — even somewhat-specialized inputs — extend an existing block (e.g., `protector-field` was added to handle named-field inputs that mirror to `sessionProfile.protector`).

### Existing custom blocks worth knowing about

| Block | Type key | Use case |
|---|---|---|
| [ExpandableBlock](../../session/TransitionModule/customBlocks/ExpandableBlock.jsx) | `'expandable'` | Collapsible disclosure — see "two modes" below |
| [ProtectorFieldBlock](./customBlocks/ProtectorFieldBlock.jsx) | `'protector-field'` | Named field that mirrors to `sessionProfile.protector` |
| [ProtectorReconnectionBlock](./customBlocks/ProtectorReconnectionBlock.jsx) | `'protector-reconnection'` | Welcome-back panel for Part 2 — reads name from Part 1, falls back to inline naming if Part 1 wasn't run |
| [DialogueLoopBlock](./customBlocks/DialogueLoopBlock.jsx) | `'dialogue-loop'` | Single-page written Q&A. Inputs reveal one-at-a-time as the user advances; after 2 completed exchanges, an "Ask more" link offers another cycle and Continue advances the section. Always uses the default "Continue" button label. |
| [MeditationTimePillBlock](./customBlocks/MeditationTimePillBlock.jsx) | `'meditation-time-pill'` | Display-only duration pill that reads from a meditation's `fixedDuration` |

### ExpandableBlock — two rendering modes

[ExpandableBlock](../../session/TransitionModule/customBlocks/ExpandableBlock.jsx) (registered as `'expandable'`) has two content modes; pick based on what you're showing:

- **`lines: [...]`** — free-text lines via [renderContentLines](./utils/renderContentLines.jsx), with full markup support (`§`, `{term}`, `{#N}`, `{icon:NAME}`). Use for prose, numbered intros, or simple bulleted notes.
- **`items: [{ name, description }]`** — bordered cards with the **name in uppercase mono caps** on top and the **description below in muted body text**. Optional **`footnote`** renders as italic text below the cards. Use for labeled lists where each entry is a name + short description.

```js
// Boxed-list mode — the protector examples disclosure on the naming screen
{
  type: 'expandable',
  showLabel: 'Examples of common protectors',
  icon: 'circle-plus',  // plus-in-circle, swaps to circle-skip when expanded
  alignment: 'left',     // 'left' | 'center' (the toggle label alignment)
  items: PROTECTOR_EXAMPLES,
  footnote: PROTECTOR_EXAMPLES_FOOTNOTE,
}
```

```js
// Lines mode — free-text disclosure (prose, numbered list, etc.)
{
  type: 'expandable',
  showLabel: 'More context',
  icon: 'circle-plus',
  lines: [
    'Some prose here.',
    '§',
    '{#1} First numbered item — accent number, regular description.',
    '{#2} Second item.',
  ],
}
```

**Style rules for the items mode:**
- Pick `items` whenever you have name+description pairs (examples, options, definitions). Don't simulate the boxed style with `lines` and manual markup.
- The card padding and inter-card gap are tuned for compactness; don't override.
- The `footnote` is italic and tertiary-color — reserve it for "these are starting points, your X might be different" type disclaimers, not for primary content.
- Default `icon: 'circle-plus'` is the affordance we want everywhere; the disclosure label itself doesn't change copy on expand (the icon swap is the cue).

---

## 12. Section Ordering Recommendations

A typical full-flow module (especially in peak/integration phase) follows:

```
education → (optional) meditation → reflection → integration
```

- **Education**: `screens` section(s) with text blocks. Sets the conceptual frame. `ritualFade: true` if it's the opening beat.
- **Meditation**: `meditation` section. The experiential center. Voice picker and loading screen handled.
- **Reflection**: `screens` section(s) with `protector-field` / `prompt` blocks. The user puts words to what surfaced.
- **Integration**: `screens` section with closing prompts (needs / what-might-replace / intention) and a closing beat (`ritualFade: true`, `ascii-diamond` animation).

**Section types:**

| Type | Use case | Required fields |
|---|---|---|
| `screens` | Text, prompts, choices, custom blocks — the workhorse | `screens: [{ blocks: [...] }, ...]` |
| `meditation` | Audio meditation with idle/loading/playback | `meditationId: 'some-id'` |
| `timer` | Fixed-duration silent or open-time activities | `durationSeconds` |
| `generate` | Image/asset generation step | `generatorId: 'some-id'` |

Most modules use only `screens` and `meditation`.

---

## 13. Linked Parts Pattern

For multi-part activities (e.g., `Dialogue with a Protector — Part 1` lives at peak phase, `Part 2` at integration phase):

- Both parts share a unified `idle.title` (e.g. `Dialogue with a Protector`) and per-part `idle.subtitle` (e.g. `Part 1: Meeting a Protector`, `Part 2: Understanding Your Protector`).
- Part 1 collects identity data into `sessionProfile.protector.{name, description, bodyLocation, message}` via `protector-field` blocks.
- Part 2's first section (`reconnect`) reads that data via the `protector-reconnection` custom block — handles the welcome-back and falls back to inline naming if the user runs Part 2 without Part 1.
- Library entries are linked via `linkedParts` — the timeline auto-adds the second part when the first is included.
- Tokens (`{protectorName}`, `{bodyLocation}`) substitute identically in both parts via the same `accentTerms` merge in MasterModule.

See [protectorDialogueShared.js](../../../../content/modules/master/protectorDialogueShared.js) for shared constants used by both parts (and historically the legacy modules during the cutover window).

---

## 14. Migration Checklist (legacy → MasterModule)

When converting a legacy custom-component module (a hand-written `*Module.jsx`) to a MasterModule content config:

1. **Map legacy steps to section types.** Each legacy step usually becomes either a screen inside a `screens` section or its own section. Group steps that share a header into one section with multiple screens (per rule #5).
2. **Rewrite headers.** Title Case, no terminal punctuation, descriptor-not-question. If the legacy header was a question, move the question text into the prompt slot of the input below it and pick a descriptive header (e.g. `What is it afraid of?` → header `The Fear Beneath`, prompt `What is {protectorName} afraid would happen if it stopped doing its job?`).
3. **Move questions out of body text into prompt slots.** Legacy modules often had `text` blocks with the question and `prompt: ''` on the input. Consolidate so the question is in the input's `prompt` field and the body text is purely orienting.
4. **Tighten body text for tone.** Cut `One more question, and this one matters.`, `This is an important question.`, `Let it sit. Let it settle.`, two-beat motivational pacing, AI-style affirmations. Replace with grounded, observational copy.
5. **Idle screen cleanup.** Remove any expandable disclosure. Inline the conceptual framing into the description. If the activity total differs from `defaultDuration`, set `idle.durationMinutes` and document why.
6. **Embedded meditations.** If the module includes audio, make sure `meditation.fixedDuration` is set (regenerate if needed via `node scripts/generate-audio-durations.mjs`). Don't put voice picker on the module idle.
7. **Routing.** Translate legacy step-skipping logic into `route` configs on choice options. Prefer **named bookmarks** for adjacent gate→detour layouts.
8. **Cutover strategy — pick one:**
   - **Direct cutover (preferred):** point the legacy library entry's `content.masterModuleContent` at the new content config and update `moduleRegistry` to map the legacy type → `MasterModule`. Same id, same library entry, just a swap of renderer + content. Lowest risk; no session-id migration needed.
   - **Dual-listing during a soak window:** add a parallel library entry with a `-v2` (or similar) id and route the timeline at it. After the soak, collapse back via a session-store migration that rewrites persisted ids — see `useSessionStore.js` ~v32 migration for the protector-dialogue precedent. Higher coordination cost; only worth it when you need both renderers active simultaneously.
9. **Delete the legacy `*Module.jsx`** once nothing imports it. Run `grep -rn "MyLegacyModule" src` and verify clean. Delete any legacy-only content/constants files that the renderer was the sole consumer of.
10. **Verify the session-store migration is end-to-end.** If you used dual-listing, write the migration BEFORE deleting the legacy entries — the persisted libraryIds need a remap to the canonical id, otherwise sessions persisted during the soak fail to render.

---

## 15. Appendix

### Smooth scroll easing

The default scroll curve in [`smoothScroll.js`](../../../../utils/smoothScroll.js) is a custom quintic with a subtle landing overshoot (~9% peak around `t=0.78`, settles to 1.0 at `t=1`). Three vanishing derivatives at `t=0` give a glass-smooth start; the overshoot reads as a small "give" at the landing instead of a hard stop. Honors `prefers-reduced-motion` (instant jump). Defaults are tuned; pass through unless there's a specific reason to override.

### Accessibility minimum

- Tap targets: any interactive button or option should be at least 44×44px. Choice options and primary buttons in `ModuleControlBar` already meet this; custom blocks must too.
- `prefers-reduced-motion` is respected by `smoothScroll`; if you add new animations, gate them behind the same media query check.
- Accent-color contrast: the accent terms render in `var(--accent)` against `var(--color-text-primary)` background. Contrast is set in the theme; don't hand-color text in modules.

### Telemetry / bookmark id stability

- Section ids and choice keys are persisted in user state for in-progress sessions (`visitedSections`, `responses`, `choiceValues`, `routeStack`). **Don't rename them casually** — a rename in a deployed build invalidates all in-progress sessions for that module.
- If a rename is required, add an explicit migration in `useSessionStore.js`'s session-restoration path.

### No "Well Done" intermediate page

The closing section's last-screen Continue press completes the module directly. [`finalizeModule`](./useMasterModuleState.js) saves the journal entry and fires the parent `onComplete` (which advances the timeline); MasterModule renders `null` while `modulePhase === 'complete'` so no intermediate "Well Done" page flashes between the user's final Continue and whatever the timeline shows next.

**What this means for authors:** don't add a "Complete" button screen, a final affirmation page, or a separate "ritual end" beat as the very last section. The closing section *is* the final UI the user sees from this module. Use `ritualFade: true` and the `ascii-diamond` animation on it to signal the moment-of-completion feel.

### Read-aloud copy check

A one-line discipline: **read every new or modified screen's copy aloud once before merging.** If it sounds patronizing, motivational, or like a wellness app's affirmation chatbot, rewrite it. Catches tone drift mechanically without any tooling.

### Where to update this doc

If you change a master-module convention as part of a code change, update this doc in the same PR. The pointer comments at the top of `MasterModule.jsx`, `ScreensSection.jsx`, and `protectorDialogueP1.js` direct everyone here — keeping it accurate is the only anti-rot mechanism that matters.

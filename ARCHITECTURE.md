# Architecture

Developer documentation for M-SESSION. For an overview of the project, see [README.md](README.md).

> **Terminology note:** The within-session Phase 3 is called **"Synthesis"** in all user-facing content but **`integration`** in all internal code. See [Architecture Decision #10](#10-phase-3-terminology-synthesis-ui--integration-code) for the full rationale and guidance.

---

## Directory Structure

```
src/
├── components/
│   ├── active/                    # Active session (meditation playback)
│   │   ├── modules/               # 25+ lazy-loaded custom module components
│   │   │   ├── shared/            # Shared module sub-components (cycle/, matrix/)
│   │   │   └── MasterModule/      # Content-driven universal module framework
│   │   │       ├── MasterModule.jsx         # Main orchestrator
│   │   │       ├── useMasterModuleState.js  # Central state management
│   │   │       ├── sectionRenderers/        # Screens, Meditation, Timer, Generate
│   │   │       ├── blockRenderers/          # Header, Text, Prompt, Selector, Choice, etc.
│   │   │       ├── generators/              # PNG generator registry
│   │   │       └── utils/                   # expandScreenToBlocks, evaluateCondition, etc.
│   │   ├── capabilities/          # Composable UI building blocks
│   │   │   ├── animations/        # BreathOrb, AsciiMoon, AsciiDiamond, MorphingShapes,
│   │   │   │                      #   Compass, LeafDraw, RevealOverlay
│   │   │   ├── hooks/             # useModuleState, useModuleTimer
│   │   │   ├── ModuleLayout.jsx   # Consistent layout wrapper
│   │   │   ├── ModuleControlBar.jsx
│   │   │   ├── ImageViewerModal.jsx  # Shared full-screen image viewer
│   │   │   └── TranscriptModal.jsx
│   │   ├── hooks/                 # useBreathController (breath timing engine)
│   │   ├── moduleRegistry.js      # Module type → component mapping
│   │   └── ActiveView.jsx         # Main orchestrator
│   ├── session/                   # Session flow & transition components
│   │   ├── SubstanceChecklist.jsx  # Pre-session preparation (5 steps)
│   │   ├── PreSessionIntro.jsx     # Pre-session ritual (6 steps + intention sub-flow)
│   │   ├── TransitionBuffer.jsx    # Reusable transition screen (quote + animation)
│   │   ├── ComeUpCheckIn.jsx       # Come-up phase check-in modal
│   │   ├── PeakTransition.jsx      # Come-up → peak transition (6 steps)
│   │   ├── PeakPhaseCheckIn.jsx    # Peak phase end-of-phase check-in
│   │   ├── BoosterConsiderationModal.jsx # Optional booster dose check-in
│   │   ├── IntegrationTransition.jsx # Peak → integration transition (5-9 steps)
│   │   ├── ClosingCheckIn.jsx      # Prompts user to begin closing ritual
│   │   ├── ClosingRitual.jsx       # 8-step closing ritual
│   │   ├── DataDownloadModal.jsx   # Session data download (text/JSON)
│   │   ├── PostCloseScreen.jsx     # Post-session animation
│   │   ├── activities/            # Pre-session activities
│   │   │   ├── IntentionSettingActivity.jsx  # Guided intention refinement
│   │   │   └── LifeGraphActivity.jsx         # Lifecycle visualization + PNG export
│   │   └── transitions/           # Transition step content & shared components
│   ├── ai/                        # AI Assistant components
│   │   ├── AIAssistantModal.jsx   # Main chat interface
│   │   ├── AIAssistantTab.jsx     # AI tab view
│   │   ├── AISettingsPanel.jsx    # Provider/model configuration
│   │   ├── ChatWindow.jsx
│   │   ├── ChatInput.jsx
│   │   ├── ChatMessage.jsx
│   │   └── ChatSidebar.jsx
│   ├── helper/                    # "What's happening?" support modal (heart icon in header)
│   │   ├── HelperModal.jsx        # Top-anchored sheet modal — major-view orchestrator
│   │   ├── HelperButton.jsx       # Heart icon trigger rendered inside Header
│   │   ├── HelperTopBar.jsx       # Back / title / close header bar
│   │   ├── CategoryGrid.jsx       # 2-column category card grid + slim emergency contact card
│   │   ├── CategoryHeader.jsx     # Wide category card shown above the triage flow
│   │   ├── RatingScale.jsx        # 0–10 bubble scale (supports `dimmed` completed state)
│   │   ├── TriageStepRunner.jsx   # V5 decision tree orchestrator (rating → choice(s) → result)
│   │   ├── TriageChoiceStep.jsx   # Single-select option cards inside the triage flow
│   │   ├── TriageResultStep.jsx   # Resolver result + activity suggestions + I-need-more-help expand
│   │   ├── ActivitySuggestions.jsx # Activity card list (reuses timeline ModuleCard)
│   │   ├── EmergencyFlow.jsx      # Emergency contact card / 911-112 / Fireside Project (rating 10)
│   │   ├── EmergencyContactCard.jsx # Shared bordered contact card with Call/Text + tap-to-copy
│   │   ├── EmergencyContactView.jsx # Dedicated contact page (header + card + edit + notes)
│   │   ├── AcknowledgeClose.jsx   # Acknowledge text shown when rating is 0
│   │   ├── PlaceholderCategory.jsx # "Coming soon" view for stub categories (low-mood, integration)
│   │   └── PreSessionContent.jsx  # Pre-session dimmed preview + explanatory overlay
│   ├── history/                   # Session history browsing
│   │   └── SessionHistoryModal.jsx # Accordion-style past sessions panel
│   ├── home/                      # Home view, follow-up section, pre-session view
│   ├── journal/                   # Entry list + editor + settings
│   ├── tools/                     # FAQ, dosage, settings, resources, philosophy, about
│   ├── intake/                    # Questionnaire components
│   ├── timeline/                  # Timeline editor components
│   ├── shared/                    # Reusable UI components (Icons, DurationPicker, etc.)
│   └── layout/                    # AppShell, Header, TabBar, SessionMenu
├── stores/
│   ├── useSessionStore.js         # Core session logic (~2,700 lines)
│   ├── useAppStore.js             # Global state (tabs, dark mode)
│   ├── useJournalStore.js         # Journal entries
│   ├── useAIStore.js              # AI assistant state + conversations
│   ├── useToolsStore.js           # Tools panel state
│   ├── useHelperStore.js          # Helper Modal open/closed state (transient, not persisted)
│   └── useSessionHistoryStore.js  # Archived session management
├── services/
│   ├── aiService.js               # AI provider API integration
│   ├── audioComposerService.js    # Composes TTS clips + silence + gong into single MP3 blob
│   ├── audioCacheService.js       # Caches fetched audio files (IndexedDB)
│   └── cryptoService.js           # API key encryption
├── hooks/
│   ├── useAudioPlayback.js        # Single <audio> element lifecycle (play/pause/resume)
│   ├── useMeditationPlayback.js   # Shared TTS meditation playback orchestration
│   ├── useSilenceTimer.js         # Gong-bookended silence timer (for non-TTS modules)
│   ├── useSyncedDuration.js       # Two-way duration sync between module UI and session store
│   ├── useWakeLock.js             # Screen Wake Lock API wrapper
│   ├── useInstallPrompt.js        # PWA install prompt detection
│   └── useTranscriptModal.js      # Meditation transcript viewer
├── content/
│   ├── modules/                   # Module definitions + content
│   │   ├── library.js             # All module definitions (metadata only — content extracted)
│   │   ├── journaling/            # Extracted journaling module content
│   │   │   ├── journalingContent.js           # Light, deep, gratitude, time capsule
│   │   │   ├── integrationReflectionContent.js
│   │   │   ├── relationshipsReflectionContent.js
│   │   │   ├── lifestyleReflectionContent.js
│   │   │   ├── spiritMeaningContent.js
│   │   │   ├── bodySomaticContent.js
│   │   │   └── natureConnectionContent.js
│   │   ├── protectorDialogueContent.js
│   │   ├── theCycleContent.js
│   │   ├── theDeepDiveReflectionContent.js
│   │   ├── valuesCompassContent.js
│   │   ├── musicRecommendations.js
│   │   ├── danceRecommendations.js
│   │   └── master/                # MasterModule content config files
│   ├── meditations/               # Meditation content + audio mappings (14 content files)
│   ├── intake/                    # 4-section questionnaire
│   ├── helper/                    # Helper Modal content
│   │   ├── categories.js          # 8 categories with `phases` arrays + decision-tree `steps`
│   │   ├── formatLog.js           # Journal entry formatter (V5 step-path format)
│   │   ├── resolverUtils.js       # classifyPhaseWindow, formatTimeContext, ACT id constants
│   │   └── resolvers/             # 6 per-category pure resolver functions (one per active category)
│   └── timeline/
│       └── configurations.js      # 11 timeline configs (5 focuses × 2 guidance + minimal)
├── utils/
│   ├── buildSystemPrompt.js       # AI context builder
│   ├── downloadSessionData.js     # Session data export (text + images)
│   ├── imageStorage.js            # IndexedDB image persistence
│   └── audioPath.js               # Audio file path resolution
└── App.jsx                        # Tab routing (views kept mounted)

public/
└── audio/
    └── meditations/
        ├── open-awareness/        # 26 TTS audio files
        ├── body-scan/             # 54 TTS audio files
        ├── self-compassion/       # 70 TTS audio files
        ├── simple-grounding/      # ~20 TTS audio files
        ├── short-grounding/       # ~10 TTS audio files
        ├── felt-sense/            # ~30 TTS audio files
        ├── leaves-on-a-stream/    # ~15 TTS audio files
        ├── stay-with-it/          # ~25 TTS audio files
        ├── protector/             # 16 TTS audio files
        ├── the-descent/           # Deep Dive meditation audio
        └── the-cycle-closing/     # Cycle closing meditation audio
```

---

## Module System

### Two-Tier Architecture

**1. Custom Components** (17+ lazy-loaded modules):

*Meditation:*
- `BreathMeditationModule` — BreathOrb + breath sequences
- `OpenAwarenessModule` — Audio-synced guided meditation (shared `useMeditationPlayback` hook)
- `BodyScanModule` — Audio-synced body scan (shared `useMeditationPlayback` hook)
- `SelfCompassionModule` — Audio-synced self-compassion with variation selector
- `SimpleGroundingModule` — Fixed-duration grounding meditation with audio prompts (also reused as a short 5-min come-up variant)

*Therapeutic Activities:*
- `FeltSenseModule` — Audio-synced felt sense meditation with variation selector (Focusing)
- `LeavesOnAStreamModule` — Audio-synced ACT defusion exercise
- `StayWithItModule` — Multi-phase: meditation → check-in → psychoeducation → journaling (Coherence Therapy)
- `ProtectorDialoguePart1Module` — 10-step IFS guided activity with embedded meditation (listen/read modes)
- `ProtectorDialoguePart2Module` — IFS protector work continuation with journaling
- `ValuesCompassModule` — Interactive ACT Matrix quadrant mapping with drag-and-drop + PNG export
- `TheDescentModule` — EFT relationship exploration: guided meditation + journaling (Part 1 of linked pair)
- `TheCycleModule` — EFT relationship cycle mapping with interactive diagram + closing meditation (Part 2)

*Journaling (shared framework):*
- `JournalingModule` — Flexible journaling framework with configurable screen types (text, prompt, selector). Supports `content.screens` array for any mix of education pages, writing prompts, and selector grids. Used by: light journaling, deep journaling, gratitude reflection, time capsule, parts work, therapy exercise, and 6 follow-up integration modules.

*Letter-Writing (custom modules):*
- `LetterWritingModule` — Guided letter to someone: education → recipient + 3 prompts → full review with salutation → closing reflection
- `InnerChildLetterModule` — Letter to younger self: age selection → 3 prompts → review → closing
- `FeelingDialogueModule` — Back-and-forth conversation with a named feeling (Gestalt/IFS): name feeling → 4 dialogue prompts → review → closing
- `CommittedActionLetterModule` — ACT-based value → barrier → willingness → commitment → review → closing

*Follow-Up Integration Modules (use JournalingModule framework):*
- `Integration Reflection` — What stayed, emotional check-in (selector), shifted perspectives, unresolved material
- `Relationships Reflection` — Who's on your mind, relationship shift (selector), patterns, communication
- `Lifestyle Reflection` — What's working, area for change (selector), boundaries, habits
- `Spirit & Meaning` — Ineffable experiences, spiritual experience (multi-select), purpose shifts, practices
- `Body & Somatic Awareness` — Body scan, physical changes (multi-select), somatic practices (multi-select)
- `Nature & Connection` — Nature relationship, elements (multi-select), nature practices (multi-select)

*Open-Ended:*
- `MusicListeningModule` — Duration picker, alarm prompt, genre recommendations
- `OpenSpaceModule` — Freeform rest with silence timer (`useSilenceTimer` hook)
- `LetsDanceModule` — Dance-focused music module with movement recommendations (peak phase)

*Pre-Session Activities:*
- `IntentionSettingActivity` — Guided intention refinement with self-inquiry prompts
- `LifeGraphActivity` — Lifecycle visualization exercise with PNG export

**2. MasterModule** (content-driven, no custom component code):

The MasterModule is a universal shared component that renders any module from a content configuration file. It supports the full range of module capabilities — meditation playback, education screens, journaling, interactive selection, timed activities, PNG generation, and conditional branching — all driven by content config alone.

All existing custom modules remain as-is. MasterModule is for new modules going forward.

### MasterModule Architecture

Three-layer hierarchy:

```
Section (control bar + lifecycle)
  └── Screen (one page the user sees)
       └── Blocks[] (vertical stack of visual components)
```

**Sections** own the control bar, lifecycle, and slot configuration. **Screens** represent one page the user sees. **Blocks** are atomic visual building blocks that can be freely composed on any screen.

#### Section Types

| Type | Purpose | Key Config |
|------|---------|------------|
| `screens` | Step-through screen sequence | `screens[], hideTimer?, rightSlotViewer?, ritualFade?, persistBlocks?, terminal?` |
| `meditation` | Audio-synced meditation via `useMeditationPlayback` | `meditationId, animation?, showTranscript?, composerOptions?, terminal?` |
| `timer` | Countdown timer for music/dance/rest | `animation?, showAlarm?, recommendations?, allowAddTime?, terminal?` |
| `generate` | PNG generation with RevealOverlay | `generatorId, buttonLabel, saveToJournal?, imageName?, terminal?` |

Any section (regardless of type) can set `terminal: true` to end the module cleanly when the user advances past it — useful when the section array contains tail detour sections that should only be reachable via routing. See "Terminal Sections" below.

#### Block Types

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

#### Shorthand Screen Types (Backward Compatible)

Screens with a `type` field auto-expand into `[headerBlock, contentBlock]`. This is syntactic sugar — under the hood, every screen is blocks.

```javascript
// Shorthand:
{ type: 'text', header: 'Welcome', lines: ['Hello.'] }

// Equivalent explicit blocks:
{ blocks: [
  { type: 'header', title: 'Welcome', animation: 'ascii-moon' },
  { type: 'text', lines: ['Hello.'] },
] }
```

Use explicit `blocks` arrays when you need mixed content on one screen:

```javascript
{ blocks: [
  { type: 'header', title: 'Check In', animation: 'leaf' },
  { type: 'text', lines: ['How are you feeling?'] },
  { type: 'selector', prompt: 'Pick one', key: 'mood', columns: 2,
    options: [{ id: 'calm', label: 'Calm' }, { id: 'heavy', label: 'Heavy' }] },
  { type: 'prompt', prompt: 'Say more?', placeholder: '...' },
] }
```

#### Routing & Conditional Flow

The MasterModule has two complementary systems for dynamic module flow:

**Routing** — "leave this section and jump to a different one." Used for branching flows where entire sections are swapped (e.g., Pendulation-style checkpoint → different meditation sections).

**Conditions** — "stay in this section, but show/hide specific screens or blocks based on earlier choices." Used for inline content variation (e.g., tailored text based on a check-in response).

#### Choice Block

The `choice` block type supports both systems:

```javascript
// Choice WITHOUT route — saves value for conditional rendering
{ type: 'choice', prompt: 'How are you?', key: 'mood', options: [
  { id: 'calm', label: 'Calm' },
  { id: 'heavy', label: 'Heavy' },
] }

// Choice WITH route — jumps to a different section on Continue
{ type: 'choice', prompt: 'How was that?', key: 'checkin', options: [
  { id: 'settled', label: 'Settled', route: 'closing-section' },
  { id: 'activated', label: 'Still activated', route: 'activation-section' },
] }
```

In all cases, the user selects an option and clicks Continue. Without a route, the flow continues to the next screen. With a route, three formats control what happens:

```javascript
// 1. Skip-ahead (no bookmark) — jump and continue forward from there
//    Most common. Used for Pendulation-style branching.
{ id: 'settled', label: 'Settled', route: 'med-d' }

// 2. Loop route with auto-bookmark — jump, then return to the section after this one
//    Used for detour flows (e.g., a gate where the user can do optional activities and return).
{ id: 'breathe', label: 'Breathe', route: { to: 'breathing', bookmark: true } }

// 3. Re-route with custom bookmark — jump, then return to a named section
//    Used when the return point is different from the next sequential section.
{ id: 'refine', label: 'Refine', route: { to: 'intention-flow', bookmark: 'gate-section' } }
```

**String** = skip-ahead. After the target section completes, the flow continues forward sequentially. Already-visited sections are automatically skipped.

**Object with `bookmark: true`** = loop route. After the target section completes, the flow returns to the section after the choice (the bookmark).

**Object with `bookmark: 'section-id'`** = re-route with custom return point. After the target completes, the flow returns to the named section.

**Persisted choices.** `choiceValues` is durable — a selection made on one visit persists across back-navigation and bookmark returns. If a user back-navigates to a choice screen, their prior selection stays visible (the selected option's button remains in the "selected" state). Pressing Continue re-fires whatever route is currently selected. This is by design: the UI honestly reflects what will happen, and re-traversing a previously-taken branch is a valid user action. Gate patterns like the Opening Ritual Crossroads rely on this behavior — a user can complete a detour, return to the gate, re-select the same option, and revisit it cleanly. The "un-visit on back" rule covers the complementary case: when a user backs all the way out of a branch, every section they pass through gets unvisited, so a clean back-and-retry works the same as a first-time traversal.

#### Sequential Advance & Visited Section Skipping

When advancing sequentially (no bookmark to pop), `advanceSection` automatically skips sections that have already been visited. This prevents replaying sections when routing creates non-linear paths.

For example: checkpoint at index 2 routes to index 5 (with bookmark at index 4). After completing index 5, the bookmark returns the user to index 4. After completing index 4, sequential advance checks index 5 — already visited — skips to index 6.

#### Terminal Sections

A section with `terminal: true` ends the module cleanly when the user advances past it, regardless of what sits after it in the array. This exists specifically so that modules can put routed-to "tail detour" sections *after* the user's final main section without risking a sequential walk-through into them.

```javascript
sections: [
  // ... main flow ...
  { id: 'final-moment', type: 'screens', terminal: true, screens: [...] },

  // Tail detours — reachable only via routes from earlier sections,
  // never via sequential advance from `final-moment`
  { id: 'optional-breath', type: 'meditation', meditationId: '...' },
  { id: 'optional-journal', type: 'screens', screens: [...] },
]
```

Without `terminal: true`, the user pressing Continue on `final-moment` would fall through to `optional-breath` and replay it — even if they never chose to route there earlier.

#### History-Based Back Navigation

Back navigation follows the user's *actual visit path*, not the section array index. A `sectionHistory` stack records the sections the user came from, and `goBackToPreviousSection` pops it. Sequential advances and routes push the current section index; bookmark pops (the return leg of a routed round-trip) are treated as "closing a side trip" — they don't push the completed detour, and they pop the gate's entry if the round-trip ended where it started. A completed detour leaves no residue in history.

This matters in any flow that routes non-linearly:

```
User flow: 0 → 1 → 2 (gate, user picks detour) → routes to 5 (bookmark: 2) → returns to 2 → 6

sectionHistory after each step:
  at 1: [0]
  at 2: [0, 1]
  at 5: [0, 1, 2]      ← routeToSection pushes the gate (2) on entry
  at 2: [0, 1]         ← bookmark-pop: continuationIndex (2) matches top, pop it
  at 6: [0, 1, 2]      ← sequential advance pushes 2

Pressing Back from 6: pops 2 → lands at 2   (back at the gate, without re-entering the detour)
Pressing Back from 2: pops 1 → lands at 1
```

For bookmarks whose return target isn't the current section (e.g. `bookmark: true`, which returns to the section *after* the gate), the bookmark-pop leaves history unchanged — Back from the post-detour section retraces to the branching point, skipping over the side trip.

**Un-visit on back.** When the user presses Back, the section they're leaving is removed from `visitedSections`. This makes forward re-traversal work smoothly — the next Continue won't skip past the section they just backed out of. Sections they didn't traverse backward remain visited, so the skip-visited logic still applies to branches they already completed.

**Back also prunes stale route-stack entries.** If the section the user back-navigates *into* is the current top of `routeStack` (i.e. the user returned to their bookmark manually instead of letting the activity complete and pop it), the back handler drops that entry. Without this, a subsequent Continue would fire the stale pop, land the user on the section they're already on, and consume one Continue press silently.

`canGoBackToPreviousSection` is simply `sectionHistory.length > 0` — Back is shown iff there's history to pop.

Both MasterModule and TransitionModule use the same history-based design. In TransitionModule, `sectionHistory` is persisted to `activeNavigation` alongside the rest of navigation state, so force-closing the app mid-transition preserves Back behavior on resume.

#### Context-Aware Skip

The Skip button is detour-aware. When the user is inside a bookmark-routed detour (the `routeStack` is non-empty), Skip advances the section — which pops the bookmark and returns the user to the gate. Skip there means "abandon this detour activity," not "abandon the whole flow." When there's no active bookmark, Skip falls through to the parent's skip handler: in TransitionModule that ends the entire transition (fires `config.onComplete`), and in MasterModule that abandons the module (fires the `onSkip` prop).

Both systems implement the same semantics — checked via `state.routeStack.length > 0` in each orchestrator's `handleSkip`. Gate-pattern content (like the Opening Ritual Crossroads) gets this behavior automatically without any per-module wiring.

Skip confirmation messages also follow the context: in a detour the dialog reads "Skip this activity?"; in main flow it reads the configured message (e.g. "Skip the opening ritual?") or the module's default.

**Meditation sections always advance on skip.** The context-aware skip logic above applies to `screens` sections, not `meditation` sections. MeditationSection hardcodes skip to fire `onSectionComplete` (which is `state.advanceSection` in both systems) — meditation skip never abandons the flow, regardless of detour state. In a detour it pops the bookmark back to the gate; in main flow it advances to the next section. This matches the common pattern of a user being partway through an audio meditation and wanting to move on without ending the whole ritual or module. MeditationSection does not accept an `onSkip` prop; orchestrators only pass `onSectionComplete`.

**Skip-to-end gate (`skip.requireVisited`).** TransitionModule configs can gate the main-flow "end the whole transition" behavior on a specific section having been visited. When `skip.requireVisited: 'section-id'` is set, the Skip button is hidden in main flow until that section id is in `visitedSections`. This keeps users from accidentally exiting a transition before a required checkpoint — e.g., the Opening Ritual gates skip-to-end on `substance-intake-confirm` so users can't bail out before recording and confirming their substance intake, which the rest of the session depends on. Detour Skip is unaffected (it pops the bookmark regardless).

**Disable main-flow skip entirely (`skip.allowed: false`).** Some transitions shouldn't be skippable to completion at all — e.g., the Closing Ritual, whose terminal section fires `completeSession()` and is the gate for follow-up activities unlocking. Setting `skip.allowed: false` on the transition config hides the Skip button in main flow everywhere, forcing the user to press Continue through to the end. Detour Skip is decoupled from this flag and still works, so a user can always exit a side trip back to its gate — what they can't do is bypass the main flow entirely.

#### Conditional Content

Any block or screen can have a `condition` field. It only renders when the condition passes.

**Simple conditions:**

```javascript
// Exact match on a choice or selector value
{ condition: { key: 'mood', equals: 'heavy' } }

// One-of match
{ condition: { key: 'mood', in: ['heavy', 'numb'] } }

// Has any value (truthy check)
{ condition: { key: 'mood' } }

// Section was visited
{ condition: { visited: 'med-b' } }

// Section was NOT visited
{ condition: { notVisited: 'med-c' } }
```

**Compound conditions (AND / OR / NOT):**

```javascript
// AND — all must be true
{ condition: { and: [
  { key: 'mood', equals: 'heavy' },
  { key: 'bodyArea', equals: 'chest' },
] } }

// OR — any must be true
{ condition: { or: [
  { key: 'mood', equals: 'heavy' },
  { visited: 'activation-section' },
] } }

// NOT — inverts any inner condition (wraps a single sub-condition)
{ condition: { not: { storeValue: 'sessionProfile.holdingQuestion' } } }

// Nested — heavy AND (chest OR shoulders)
{ condition: { and: [
  { key: 'mood', equals: 'heavy' },
  { or: [
    { key: 'bodyArea', equals: 'chest' },
    { key: 'bodyArea', equals: 'shoulders' },
  ] },
] } }
```

**Transition-only conditions (require `storeState` / `sessionData` in context — available in TransitionModule, not MasterModule):**

```javascript
// storeValue — dot-path lookup against the full session store
// Supports: equals, in, gte, gt, lte, lt, and (default) truthy check
{ condition: { storeValue: 'sessionProfile.holdingQuestion' } }          // has any value
{ condition: { storeValue: 'booster.status', equals: 'taken' } }         // exact match
{ condition: { storeValue: 'journalCount', gte: 5 } }                    // numeric
{ condition: { storeValue: 'modulesCompleted', in: ['values-compass'] } } // array-includes

// moduleCompleted — user finished this module in the session
{ condition: { moduleCompleted: 'values-compass' } }

// helperUsedDuring — user opened the HelperModal during this phase
{ condition: { helperUsedDuring: 'peak' } }
```

`storeValue` first resolves against `context.storeState` (the full session store snapshot) and falls back to `context.sessionData` (derived session-level data: `modulesCompleted`, `journalCount`, `helperUsedDuring`, `effectiveFocus`, etc.). Both are populated by `useTransitionModuleState` and passed through the condition context.

Conditions work on:
- **Blocks** — individual blocks within a screen are filtered; others on the same screen still render
- **Screens** — entire screens are skipped during navigation (forward and back)
- **Review blocks** — only prompts the user actually saw are shown
- **Journal entries** — only prompts the user saw are included (see Journal Assembly below)

Conditions are evaluated by `evaluateCondition()` in `utils/evaluateCondition.js` against `choiceValues`, `selectorValues`, and `visitedSections`.

#### Section Visit Tracking

`useMasterModuleState` tracks completed sections in a `visitedSections` array, updated each time `advanceSection()` or `routeToSection()` is called. Every block is tagged with its parent `sectionId` during indexing.

Section visits serve three purposes:

1. **Conditional content** — `condition: { visited: 'med-b' }` shows/hides blocks based on which sections the user went through
2. **Sequential skip** — `advanceSection` skips already-visited sections to prevent replays after non-linear routing
3. **Journal & review filtering** — prompts from unvisited sections are excluded from journal entries and review screens (the user never saw them)

```javascript
// Adaptive debrief screens based on path taken:
{ type: 'text', condition: { visited: 'med-b' },
  lines: ['Since you went through the activation section...'] }
{ type: 'text', condition: { notVisited: 'med-b' },
  lines: ['You skipped the activation section.'] }
```

#### Journal Assembly

Journal entries are built by `journalAssembler.js` on module/transition completion. Both MasterModule and TransitionModule use the same assembler — the same filter rules, the same output format. Two-layer filtering determines which blocks are included:

1. **Section visited?** — Each block carries a `sectionId`. If the section was never visited (due to routing), all its blocks are excluded.
2. **Condition passed?** — If a block has a `condition` field and it fails, the block is excluded.

Blocks that pass both filters are always included in the journal, even if the user left them blank. Empty prompts are saved as `[no entry — 3:45 PM]` with a wall-clock timestamp, supporting users who journal physically and need to cross-reference.

**Captured block types:**

| Block | What lands in the journal |
|---|---|
| `prompt` | Prompt text (or `journalLabel` override when `prompt` is empty), then the user's response (or `[no entry — time]`). |
| `selector` | Prompt text, then the selected option label(s) comma-joined. If `journal: true`, the follow-up text is appended. |
| `body-check-in` | `Body sensations (<phase>):` followed by the comma-joined labels of selected sensations. Reads from `storeState.transitionData.somaticCheckIns.<phase>`. Skipped in `mode: 'comparison'`. |
| `ingestion-time` | `Substance taken at: 3:42 PM` formatted from `storeState.substanceChecklist.ingestionTime`. Only emitted by the `mode: 'record'` instance — `mode: 'confirm'` is suppressed to avoid duplicating the same timestamp. |
| `store-display` | `<label>:` followed by the store value at `storeKey`. Label comes from `journalLabel`, or is auto-derived from the final dot-path segment. **Dedupe:** suppressed if a `prompt` with the same `storeField` was already emitted, and only one `store-display` per unique `storeKey` ever renders. |

**`journalLabel` override.** Any capturable block can set `journalLabel: 'Touchstone'` to override the default label in the journal (assembler auto-appends a colon). This is especially useful for prompts that render with an empty `prompt: ''` because their UI has separate surrounding text — without an override, they'd appear in the journal with a blank label line. Example:

```javascript
{ type: 'prompt',
  prompt: '',                                          // empty in UI — surrounding text carries it
  placeholder: 'A word or phrase...',
  storeField: 'transitionData.openingTouchstone',
  journalLabel: 'Touchstone',                          // "Touchstone:" in the journal entry
}
```

**Dedupe walkthrough** (Opening Ritual intention example). The intention shows up in three places: a `store-display` on the Crossroads, a `prompt` with `storeField: 'sessionProfile.holdingQuestion'` in the intention-review-detour, and a final `store-display` on the detour's confirmation screen. The assembler runs a first pass over all visible blocks to collect `storeField` paths used by prompts, then on the emit pass:

- If the user visited the detour: the prompt wins; both `store-display`s are suppressed → intention appears once.
- If the user didn't visit the detour but had a saved intention: the Crossroads `store-display` emits; no prompt with matching `storeField` was visible → intention appears once.
- No intention at all: the `store-display` is conditional on the value, so nothing emits.

**What's NOT captured:** `choice` block selections (branching signals — the downstream branch's prompts capture meaningful content), ingestion-time `confirm` mode (dedupe with `record`), and any `store-display` whose value is already represented by a `prompt` or earlier `store-display`.

**Storing the entry.** After assembly, the entry is saved via `useJournalStore.addEntry`:
- MasterModule passes `sessionId` so the entry binds to the session record.
- TransitionModule omits `sessionId` (transitions may complete outside a fully-active session state); entries match to a session by timestamp window.
- Entries shorter than two lines (title only) are skipped — no empty journal pollution.

#### Fade Speed (ritualFade)

Screens sections support two fade speeds for transitions between screens:

- **Default** (400ms) — snappy, used for most content
- **Ritual** (700ms) — slower and more intentional, used for moments that warrant slowing down

To use ritual fade, add `ritualFade: true` to the section config:

```javascript
{
  id: 'closing-reflection',
  type: 'screens',
  ritualFade: true,
  screens: [
    { type: 'text', header: 'Take this with you', lines: [...] },
    { type: 'prompt', prompt: 'What stayed with you?', placeholder: '...' },
  ]
}
```

The flag applies to all screen transitions within the section (title, animation, and body fades all use the same duration). This matches the pace used in `PreSessionIntro.jsx` for ritual moments.

#### Block Persistence (persistBlocks)

By default, advancing between screens in a section fades the entire body out and the new body in. For a section that wants blocks to *stay* across screens — same selector still visible, same body-check-in still showing the user's picks — set `persistBlocks: true` on the section. The body wrapper no longer fades between screens; React's keyed reconciliation reuses DOM for blocks at matching indexes, so unchanged blocks don't re-render or re-animate. Only newly-mounted blocks fade in, via the `animate-fade-in` class applied automatically when `persistBlocks` is set.

```javascript
{
  id: 'body-check-in',
  type: 'screens',
  persistBlocks: true,
  screens: [
    // Screen 1: header + selector + closing text
    { blocks: [
      { type: 'header', title: 'Your Body', animation: 'sunrise' },
      { type: 'body-check-in', phase: 'opening', prompt: '...' },
      { type: 'text', lines: ["We'll come back to this."] },
    ] },
    // Screen 2: same three blocks + a new prompt that fades in below them
    { blocks: [
      { type: 'header', title: 'Your Body', animation: 'sunrise' },
      { type: 'body-check-in', phase: 'opening', prompt: '...' },
      { type: 'text', lines: ["We'll come back to this."] },
      { type: 'prompt', prompt: 'Describe where it lives...', placeholder: '...' },
    ] },
  ],
}
```

**Constraints to keep in mind:**
- Keep identical blocks at identical indexes across screens. If you change block types at the same index (e.g., index 2 is `text` on screen 1 and `prompt` on screen 2), React unmounts and remounts, so that block re-animates — not what you want for "persistent" blocks.
- Block state that lives in the store (body-check-in picks, prompt responses, selector values) persists regardless of screen transitions; `persistBlocks` controls only the *visual* transition, not state.
- `persistBlocks` also skips the auto-scroll-to-top on advance, so the user stays anchored as new content appears below.

When `persistBlocks` is off (default), the body crossfade runs as before — no visual change to any existing section.

#### Meditation Variations

Meditation sections automatically detect and render variation selectors when the meditation content defines `variations` and `assembleVariation()`. The idle screen shows variation buttons instead of a duration picker. Each variation has a label, description, and fixed duration.

#### PNG Generation

The `generate` section type orchestrates: generate button → RevealOverlay → PNG creation → ImageViewerModal → seamless advance to next section. Generator functions are registered in `generators/registry.js` by ID. The content config references them by `generatorId`.

#### Central State

All user data persists across sections in `useMasterModuleState`:

| State | Shape | Description |
|-------|-------|-------------|
| `responses` | `{ promptIndex: text }` | Every prompt answer |
| `selectorValues` | `{ key: id \| [ids] }` | Every selector pick |
| `selectorJournals` | `{ key: text }` | Every selector follow-up text |
| `choiceValues` | `{ key: optionId }` | Every choice selection |
| `visitedSections` | `string[]` | Completed section IDs (for routing, conditions, journal filtering) |
| `sectionHistory` | `number[]` | Stack of previously-visited section indexes — drives history-based Back nav |
| `generatedImages` | `{ generatorId: { blob, url } }` | Generated PNGs |

Each block in the system also carries a `sectionId` tag linking it to its parent section, enabling the two-layer journal filtering described above.

#### Custom Block Registry

`MasterModule` passes a `customBlockRegistry` into `ScreensSection`, which falls through to it for any block `type` not handled by the standard renderers. The registry lives at `src/components/active/modules/MasterModule/customBlocks/index.js` and is **empty by default** — it exists as an extension point for future module-specific blocks (e.g. a block that lets a module refine `sessionProfile.holdingQuestion`).

Register a new block by adding it to the map keyed by the string `type` used in content configs:

```javascript
import RefineIntentionBlock from './RefineIntentionBlock';

const MASTER_CUSTOM_BLOCKS = {
  'refine-intention': RefineIntentionBlock,
};
```

A custom block receives `{ block, context }`. The `context` includes state reads (`responses`, `selectorValues`, `choiceValues`, `selectorJournals`, `visitedSections`, `conditionContext`), state writers (`setPromptResponse`, `toggleSelector`, `setSelectorJournal`, `setChoiceValue`), navigation (`advanceSection`, `routeToSection`), readiness gating (`reportReady`), primary-button override (`setPrimaryOverride`), and `accentTerms`.

**Session-store access.** Unlike TransitionModule, MasterModule does not pass `storeState` or `sessionData` in the context. Custom blocks that need session-wide state subscribe to `useSessionStore` directly via selectors:

```javascript
import { useSessionStore } from '../../../../../stores/useSessionStore';

const holdingQuestion = useSessionStore((s) => s.sessionProfile.holdingQuestion);
const updateSessionProfile = useSessionStore((s) => s.updateSessionProfile);
updateSessionProfile('holdingQuestion', value);
```

`sessionProfile` is the single source of truth for all user-entered identity, intent, and preferences data — `holdingQuestion`, `touchstone`, `primaryFocus`, `guidanceLevel`, `plannedDosageMg`, safety fields, etc. Always write through `updateSessionProfile(field, value)` so auto-derivations (like `dosageFeedback`) stay consistent; never mutate the slice directly.

**Caveats.**
- `condition: { storeValue: 'sessionProfile.X' }` does not work on MasterModule custom-block configs (the condition context doesn't include `storeState`). Subscribe to the store inside the component and branch in JSX instead.
- Namespace `reportReady` keys per-instance (e.g. `` `refine-intention-${block.storeField}` ``) to avoid collisions with other blocks' keys.
- If a block overrides the primary button while auto-saving on blur, clear the override with a short `setTimeout` to avoid a blur→click race — see `TouchstonePromptBlock`'s `OVERRIDE_CLEAR_DELAY_MS` for the full explanation.

Working reference implementations live in TransitionModule: `EditableDoseBlock` (simplest — read field, write via `updateSessionProfile` on save) and `TouchstonePromptBlock` (edit/display mode toggle with primary-override + readiness gating).

### Adding a New Module with MasterModule

**Step 1: Create the content file** in `src/content/modules/master/myModule.js`:

```javascript
export const myModuleContent = {
  accentTerms: { key_concept: 'Key Concept' },
  idle: { animation: 'ascii-moon' },
  completion: { title: 'Well done', message: 'Take a moment.' },
  journal: { saveOnComplete: true, titlePrefix: 'MY MODULE' },

  sections: [
    {
      id: 'intro',
      type: 'screens',
      screens: [
        { type: 'text', header: 'Welcome', lines: ['Introduction with {key_concept}.'] },
        { type: 'prompt', prompt: 'What brings you here?', placeholder: 'Write freely...' },
      ],
    },
    {
      id: 'meditation',
      type: 'meditation',
      meditationId: 'open-awareness',
      animation: 'morphing-shapes',
      showTranscript: true,
    },
    {
      id: 'reflection',
      type: 'screens',
      screens: [
        { type: 'prompt', prompt: 'What stayed with you?', placeholder: '...' },
      ],
    },
  ],
};
```

**Step 2: Register in `library.js`**:

```javascript
import { myModuleContent } from './master/myModule';

// In MODULE_TYPES:
'my-module': { label: 'My Module', intensity: 3 },

// In moduleLibrary:
{
  id: 'my-module',
  type: 'my-module',
  category: 'activity',
  title: 'My Module',
  description: 'A guided activity with meditation and journaling.',
  defaultDuration: 20,
  allowedPhases: ['peak', 'integration'],
  tags: ['guided'],
  framework: ['general'],
  content: {
    instructions: 'Description for the idle screen.',
    masterModuleContent: myModuleContent,
  },
}
```

**Step 3: Register in `moduleRegistry.js`**:

```javascript
// In CUSTOM_MODULES:
'my-module': MasterModule,
```

Done. No custom component code needed.

### Complex Example: Branching Meditation (Pendulation-Style)

A module with multiple meditation sections, checkpoint routing, and adaptive debrief:

```javascript
export const branchingModuleContent = {
  journal: { saveOnComplete: true, titlePrefix: 'BRANCHING MODULE' },

  sections: [
    { id: 'med-a', type: 'meditation', meditationId: 'section-a',
      composerOptions: { skipClosingGong: true } },

    { id: 'checkpoint', type: 'screens', hideTimer: true, screens: [
      { type: 'choice', prompt: 'How was that?', key: 'checkpoint1', options: [
        { id: 'settled', label: 'Settled', route: 'med-d' },
        { id: 'activated', label: 'Still activated', route: 'med-b' },
        { id: 'frozen', label: 'Heavy or frozen', route: 'med-c' },
      ] },
    ] },

    { id: 'med-b', type: 'meditation', meditationId: 'section-b',
      composerOptions: { skipOpeningGong: true, skipClosingGong: true } },

    { id: 'med-c', type: 'meditation', meditationId: 'section-c',
      composerOptions: { skipOpeningGong: true, skipClosingGong: true } },

    { id: 'med-d', type: 'meditation', meditationId: 'section-d',
      composerOptions: { skipOpeningGong: true } },

    { id: 'debrief', type: 'screens', screens: [
      { type: 'text', lines: ['Core debrief — always shown.'] },
      { type: 'text', condition: { visited: 'med-b' },
        lines: ['You went through the activation section...'] },
      { type: 'text', condition: { visited: 'med-c' },
        lines: ['You went through the freeze section...'] },
      { type: 'prompt', prompt: 'What did you notice?' },
    ] },
  ],
};
```

This produces: opening gong on section A only, no gongs on B/C, closing gong on D only. Checkpoint uses string routes (skip-ahead) so each path continues forward to debrief after the last meditation. Debrief screens adapt based on which sections were visited via `condition: { visited: '...' }`.

### Adding a Custom Component (Fallback)

For modules with highly interactive UIs that can't be expressed via content config (e.g., drag-and-drop, interactive diagrams), create a custom component:

1. Create `components/active/modules/MyModule.jsx`:
```javascript
export default function MyModule({ module, onComplete, onSkip, onProgressUpdate }) {
  return (
    <ModuleLayout>
      {/* Your UI */}
      <ModuleControlBar onComplete={onComplete} onSkip={onSkip} />
    </ModuleLayout>
  );
}
```

2. Register in `moduleRegistry.js`:
```javascript
import MyModule from './modules/MyModule';
export const CUSTOM_MODULES = { ...existing, 'my-type': MyModule };
```

### MasterModule File Structure

```
src/components/active/modules/MasterModule/
  MasterModule.jsx              # Main orchestrator
  useMasterModuleState.js       # Central state (navigation, data, conditions)
  sectionRenderers/
    ScreensSection.jsx          # Step-through screens with block rendering
    MeditationSection.jsx       # Audio-synced meditation (variable duration, variations, back-nav)
    TimerSection.jsx            # Countdown timer + optional recommendations
    GenerateSection.jsx         # PNG generation + RevealOverlay orchestration
  blockRenderers/
    HeaderBlock.jsx             # Title + configurable animation
    TextBlock.jsx               # Paragraphs with markup
    PromptBlock.jsx             # Journaling textarea
    SelectorBlock.jsx           # Grid selection
    ChoiceBlock.jsx             # Routing checkpoint
    AnimationBlock.jsx          # Standalone animation
    AlarmBlock.jsx              # Set alarm prompt
    ReviewBlock.jsx             # Assembled response review
    MeditationAudioBlock.jsx    # Paused indicator + fading prompt text
  generators/
    registry.js                 # Generator ID → async PNG function
  customBlocks/
    index.js                    # Custom-block registry (empty extension point)
  utils/
    expandScreenToBlocks.js     # Shorthand → blocks conversion
    evaluateCondition.js        # Condition evaluation (choice, selector, visited)
    renderContentLines.jsx      # Shared text markup renderer
    journalAssembler.js         # Builds journal entry from collected data

src/content/modules/master/     # Content config files for MasterModule-based modules
```

### Adding a Meditation Module (with Audio)

For modules that use the shared `useMeditationPlayback` hook with pre-recorded TTS audio:

**Step 1: Define the content** in `src/content/meditations/<name>.js`:

```javascript
export const myMeditation = {
  id: 'my-meditation',
  title: 'My Meditation',
  description: 'Brief description for the idle screen.',
  speakingRate: 150,          // words per minute (use 90 for slower-paced scripts)
  minDuration: 600,           // 10 min in seconds (for variable-duration)
  maxDuration: 1800,          // 30 min in seconds
  durationSteps: [10, 15, 20, 25, 30],  // minutes
  defaultDuration: 10,
  audio: {
    basePath: '/audio/meditations/my-meditation/',
    format: 'mp3',
  },
  prompts: [
    {
      id: 'intro-1',                // also the audio filename: intro-1.mp3
      text: 'Begin by finding a comfortable position.',
      baseSilenceAfter: 5,          // 5 seconds of silence after this prompt
      silenceExpandable: true,      // silence scales with longer durations
      silenceMax: 15,               // never exceed 15 seconds even at max duration
    },
    {
      id: 'core-1',
      text: 'Bring awareness to your breath.',
      baseSilenceAfter: 8,
      silenceExpandable: true,
      silenceMax: 30,
    },
    // ... more prompts
  ],
};
```

**Step 2: Register in the meditation library** in `src/content/meditations/index.js`:

```javascript
import { myMeditation } from './my-meditation';

export const meditationLibrary = {
  ...existing,
  'my-meditation': myMeditation,
};

export { myMeditation };
```

**Step 3: Create the component** in `src/components/active/modules/MyMeditationModule.jsx`.

The component pattern is near-identical across TTS meditation modules. Copy an existing module as a template (e.g. `OpenAwarenessModule.jsx` for a plain guided meditation, `SelfCompassionModule.jsx` if you need variations) and update:

1. The meditation ID passed to `getMeditationById(...)` and `useMeditationPlayback({ meditationId, ... })`.
2. The `useMemo`-computed `[timedSequence, totalDuration]` — the only part that varies per meditation. `calculateSilenceMultiplier` + `generateTimedSequence` handle prompt pacing and audio timing; both are imported from `content/meditations/index.js`.
3. Optional slot content: `leftSlot` for a `VolumeButton`, `rightSlot` for a `SlotButton` opening a `TranscriptModal`. For variable-duration meditations pass `durationMinutes` + step handlers to `IdleScreen` — it renders the inline `DurationPill` with `<` / `>` arrows (no modal). See `BodyScanModule.jsx` for the canonical example.

Everything else — session-store integration, pause/resume, audio-text sync, seek, completion, skip, progress reporting — is handled inside `useMeditationPlayback`; the component is a thin wrapper that composes `IdleScreen`, a `MeditationLoadingScreen` (during `preparing` / `preparing-leaving` transition stages), current-prompt text, `CompletionScreen`, and `ModuleControlBar`.

**Step 4: Register the component** in `src/components/active/moduleRegistry.js`:

```javascript
import MyMeditationModule from './modules/MyMeditationModule';
export const CUSTOM_MODULES = { ...existing, 'my-meditation': MyMeditationModule };
```

**Step 5: Add to the module library** in `src/content/modules/library.js`:

```javascript
{
  id: 'my-meditation',
  type: 'my-meditation',    // matches moduleRegistry key
  title: 'My Meditation',
  defaultDuration: 10,
  allowedPhases: ['peak', 'integration'],
}
```

**Step 6: Generate audio** — create `scripts/generate-my-meditation-audio.mjs` following the pattern of existing scripts. Use `--dry-run` first, then generate with `ELEVENLABS_API_KEY`.

**Step 7: Build and test** — `npm run build`, then verify the full flow: idle screen → begin → prompts with audio → pause/resume → mute toggle → completion.

### Adding a Journaling Module (No Custom Component)

The `JournalingModule` framework supports configurable screen types, making it possible to create rich multi-screen journaling activities without writing any custom component code.

**Screen types available:**
- `text` — Education/reflection page with header and content lines (supports `§` spacers)
- `prompt` — DM Serif prompt question with textarea (optional `context` description above)
- `selector` — Grid of selectable options (2 or 3 columns, single or multi-select) with optional textarea

**Step 1: Create content file** in `src/content/modules/journaling/myContent.js`:

```javascript
export const myContent = {
  screens: [
    { type: 'text', header: 'Introduction', lines: ['First paragraph.', '§', 'Second paragraph.'] },
    { type: 'prompt', prompt: 'What do you notice?', context: 'Optional description.', placeholder: 'Write here...' },
    { type: 'selector', prompt: 'How do you feel?', key: 'feeling', columns: 2, multiSelect: false,
      options: [{ id: 'calm', label: 'Calm' }, { id: 'energized', label: 'Energized' }],
      journal: { prompt: 'Say more?', placeholder: 'Details...', rows: 3 } },
    { type: 'text', header: 'Closing', lines: ['Final reflection.'] },
  ],
};
```

**Step 2: Add module definition** in `library.js` with `content: myContent` (imported).

**Step 3: Register** in `moduleRegistry.js` as `JournalingModule`.

**Legacy format** (still supported): `content.introScreens` + `content.prompts` + `content.closingScreens`.

### Duration Sync Hook

All modules with variable duration use the shared `useSyncedDuration` hook for two-way sync between the module's UI and the session store:

```javascript
import useSyncedDuration from '../../../hooks/useSyncedDuration';

const duration = useSyncedDuration(module, { hasStarted });
// duration.selected     — current duration in minutes
// duration.setSelected  — set duration (updates local + syncs to store)
// duration.handleChange — alias for setSelected, kept for caller ergonomics
```

The idle-screen UI for variable-duration modules is an inline `DurationPill` with `<` / `>` arrows (see `ModuleLayout.jsx`), clamped at the meditation's `durationSteps` bounds. The legacy `DurationPicker` modal is retired from all idle screens; it remains only in `OpenSpaceModule` for its mid-session "tap elapsed time to extend" affordance (distinct from the idle pill). On the Home tab, `ModuleCard` and `AltSessionModuleModal` render duration as read-only text — duration edits funnel through `ModuleDetailModal`'s own ± stepper. Cross-surface sync is store-driven: any writer calls `updateModuleDuration(instanceId, minutes)` and every reader re-renders.

### Intensity Rating

Modules use a numeric 1–5 intensity scale (not string labels). Set via the `intensity` field on each module definition:

```javascript
{ id: 'my-module', intensity: 3, ... }  // 1=low, 3=moderate, 5=high
```

Displayed in the module detail modal as filled/unfilled dots.

### Follow-Up Phase Lock

The follow-up phase uses a single 8-hour phase-level time lock (`followUp.phaseUnlockTime`) rather than per-module locks. All follow-up activities become available simultaneously once the phase unlocks. The lock is checked in:
- `ActiveView.jsx` — follow-up landing page shows countdown when locked
- `AltSessionModuleModal.jsx` — Begin button disabled with countdown when locked
- `TimelineEditor.jsx` — follow-up module cards render a lock icon when locked

### Pre-Session & Follow-Up Timeline Editing

Both the pre-session and follow-up timelines support editing (reorder + remove) via the same `isEditMode` state in `TimelineEditor`. During completed sessions, `isEditMode` is passed as `false` to the three main PhaseSections (`isEditMode={isCompletedSession ? false : isEditMode}`) so the completed session record is locked. The follow-up section is the only section that can toggle edit mode during completed sessions.

**Completed module handling** in both timelines:

- **Graying**: `ModuleCard` accepts a `grayWhenCompleted` prop that triggers `opacity-50` + tertiary text for completed/skipped modules outside of active sessions. This is opt-in to avoid affecting the completed session view (which uses `phaseCompleted` for its own opacity handling).
- **Sort order**: Both lists use `sortCompletedFirst` — completed modules float to the top sorted by `completedAt` timestamp; upcoming modules stay below in their original `order`.
- **Edit locking**: Completed modules are excluded from edit mode — no remove button, no reorder arrows. Only upcoming modules can be edited.
- **Skip behavior**: Skipping a pre-session or follow-up module calls `abandonModule` which resets to `upcoming` — the user can retry later. No "Skipped" status is recorded.

### Module Addition Gating

`canAddModuleToPhase(moduleId, phase)` in `library.js` enforces hard gates:
- Follow-up modules (`isFollowUpModule`) blocked outside `follow-up` phase
- Booster module (`isBoosterModule`) blocked outside `peak` and `integration` phases
- All other modules are allowed in any phase — recommendations are expressed via `recommendedPhases` and surfaced through the Recommended filter in the library modal, not through gating

### Booster Card Placement

The booster is the only module whose visual position is computed at render time rather than from its stored `order`. `TimelineEditor.computeBoosterPlacement()` walks cumulative durations starting from the end of come-up, through peak modules, then through integration modules, and slots the booster card at the first index where elapsed time crosses the 90-min mark. Whichever phase contains the crossover gets the card — so the user can add the booster to either peak or integration and the placement is identical. Sessions shorter than 90 min total pin the card to the end of integration. The trigger logic (`shouldShowBooster`) is independent: it always fires at `min(90, fullyArrivedAt + 30)` minutes since ingestion, ignoring `module.phase` entirely.

---

### TransitionModule Architecture

TransitionModule is a parallel system to MasterModule designed for **session transitions** — the ceremonial arcs between phases (Opening Ritual, Peak Transition, Peak → Integration, Closing Ritual). It shares MasterModule's section/screen/block model and renderers but diverges on two axes: persistence (transitions span real wall-clock time and must survive app closes) and lifecycle (transitions never have an idle page — the user is already committed when it starts).

#### Shared with MasterModule

TransitionModule reuses the same section types (`screens`, `meditation`), the same block types, the same routing model (`to:`, `bookmark: true | 'section-id'`), the same skip-visited semantics, the same history-based back navigation, the same `terminal: true` and `persistBlocks` flags, and the same `ScreensSection` / `MeditationSection` renderers. Content authors learn one model for both systems.

#### Key differences from MasterModule

| Concern | MasterModule | TransitionModule |
|---|---|---|
| Starts at | `modulePhase: 'idle'` (user taps Begin) | `modulePhase: 'active'` (no idle screen) |
| State storage | All `useState` — local only | Mirrored to `sessionStore.transitionData.activeNavigation` on every change |
| Close + reopen | Starts over from the idle page | Resumes at exact section + screen + responses |
| `sectionHistory` | Plain `useState` | Persisted in `activeNavigation` — Back works on resume |
| Journal save | `addEntry` with `sessionId` | `addEntry` without `sessionId` + writes `transitionData.completedAt.<id>` |
| Cross-store field mirroring | None | Prompts with `storeField: 'sessionProfile.x'` flow to that path on every advance |
| Custom block registry | Wired through but empty by default — extension point for future module-specific blocks | Populated with transition-specific blocks (see below) |

#### Persistence model

Every navigation change writes the full `activeNavigation` blob to `sessionStore.transitionData`:

```javascript
activeNavigation: {
  transitionId,          // which transition owns this blob ('opening-ritual', 'peak-transition', ...)
  currentSectionIndex,
  visitedSections,
  routeStack,
  sectionHistory,        // persisted; Back survives force-close
  screenIndex,
  responses,
  selectorValues,
  selectorJournals,
  choiceValues,
  blockReadiness,
}
```

The session store itself persists to localStorage via Zustand's `persist` middleware, so backgrounding the app or force-closing preserves everything. On mount, `useTransitionModuleState` checks whether `persistedNav.transitionId === transitionId` and, if so, initializes all React state from the persisted blob instead of defaults.

Selectors and choices write to the store immediately. Prompt responses (textareas) stay local while the user is typing and flush on blur / section advance / transition completion — the "hybrid sync strategy" that avoids per-keystroke localStorage thrash.

#### Cross-store field mirroring (`storeField`)

A prompt block can declare `storeField: 'sessionProfile.holdingQuestion'` to have its value mirrored to a separate store path on every advance. This is how the Opening Ritual's intention prompt populates `sessionProfile.holdingQuestion` without the ritual needing custom state logic:

```javascript
{ type: 'prompt',
  prompt: 'Write your intention...',
  placeholder: '...',
  storeField: 'sessionProfile.holdingQuestion' }
```

Supported prefixes: `sessionProfile.*` (routes to `updateSessionProfile`) and `transitionData.*` (routes to `updateTransitionData`).

#### Custom block registry

Both MasterModule and TransitionModule pass a `customBlockRegistry` into `ScreensSection`, which falls through to it for any block type not handled by the standard renderers. MasterModule's registry is empty by default (see *MasterModule → Custom Block Registry* for the extension-point pattern). TransitionModule's registry is populated with transition-specific blocks that interact with session-wide state like `substanceChecklist` and `transitionData`:

| Block type | Purpose |
|---|---|
| `body-check-in` | 10-sensation grid (warmth, tingling, openness, lightness, energy, softness, heaviness, stillness, expansion, tension) + "Something I can't name"; writes to `transitionData.somaticCheckIns.<phase>`. Supports `mode: 'select'` (default, interactive) and `mode: 'comparison'` (read-only, shows layered picks across multiple phases via a stacked-opacity grid). |
| `ingestion-time` | Self-contained substance intake flow: pristine ("I've taken it" button) → recorded (time displayed in an accent box, click to edit inline, "Confirm time" button below) → confirming (modal "Are you sure? Once confirmed you can't change it.") → confirmed (time + check icon, read-only). Gates Continue via `reportReady` until the user clicks Confirm in the modal, then auto-advances the section via `context.advanceSection()`. Reads/writes `substanceChecklist.ingestionTime` and `ingestionTimeConfirmed`; auto-resets to pristine if those values are cleared (e.g. by `editable-dose` on a dose change). No `mode` prop. |
| `editable-dose` | Inline-editable display of `sessionProfile.plannedDosageMg`. Renders a small label and a tight accent box around the value. Tap to edit inline (number input in the same box, Save text-button + Cancel beneath). Save writes back via `updateSessionProfile`. If the new value differs from the prior one AND ingestion time was already recorded, calls `resetSubstanceIntake` to wipe the recorded/confirmed time — keeps the recorded intake coherent with the dose the user actually intends to take. |
| `action` | Generic store-action button with a small allowlist (currently `recordIngestionTime`, `confirmIngestionTime`). Fires the named action and reports readiness. |
| `store-display` | Read-only render of any dot-path store value in a styled container (`style: 'accent-box' | 'plain' | 'italic'`). Used for showing the user's saved intention, focus label, touchstone, etc. Supports `labelMap` for translating raw values to display labels. |
| `expandable` | Collapsible text section — click-to-reveal, click-to-hide. Uses the shared `renderContentLines` utility so it supports `§` spacers and `{accent}` terms like regular text blocks. |
| `touchstone-arc` | Presentational SVG that displays the opening + closing touchstones with a connecting arc. Reads from `transitionData.openingTouchstone` / `closingTouchstone`. |
| `touchstone-prompt` | Prompt textarea that locks to an accent-bordered display on save (click to re-edit). Uses `setPrimaryOverride` to swap Continue → Save while editing; clears the override on a short delay to avoid blur→click races. Writes via `storeField` (`sessionProfile.*` or `transitionData.*`). |
| `expandable-store-display` | Collapsible read-only display of a store value — combines `expandable` and `store-display` semantics. |
| `phase-recap` | Summary statistics for a phase (`come-up | peak | integration | full-session`) — duration, journal entries, optional helper-modal count. Purely presentational. |
| `data-download` | Button that opens the existing `DataDownloadModal` for exporting session data. |

TransitionModule custom blocks receive the same base `context` as MasterModule blocks (state reads, writers, navigation, `reportReady`, `setPrimaryOverride`, `accentTerms`) plus two TransitionModule-only additions: `sessionData` (derived session-level data — `modulesCompleted`, `journalCount`, `helperUsedDuring`, `effectiveFocus`) and `storeState` (full session store snapshot). These also feed the condition evaluator, enabling `storeValue`-based conditions at the block-config level.

#### Block readiness gating

Any custom block can call `context.reportReady(blockKey, isReady)` to disable the Continue button. Used by `IngestionTimeBlock` (Continue disabled until the user records/confirms their intake time) and any other block that needs to gate advance until an action is taken. Block readiness resets automatically on screen change, so blocks don't need explicit cleanup. (The reset is applied synchronously alongside `setScreenIndex` in `handleNext` / `handleBack` — see *Module Boundary Fades* for why this matters.)

#### Terminal + tail-detour pattern in transitions

The Opening Ritual uses `terminal: true` on `begin-session` plus a Crossroads section to consolidate optional activities (centering breath, intention review, gratitude, support-person check-in) as tail detours reachable only via routing:

```javascript
sections: [
  // ... main flow including a 'crossroads' section with choice routes ...
  { id: 'begin-session', type: 'screens', terminal: true, screens: [...] },

  // Tail detours — only entered via `bookmark: 'crossroads'` from the Crossroads
  { id: 'centering-breath', type: 'meditation', meditationId: '...' },
  { id: 'intention-review-detour', type: 'screens', screens: [...] },
  { id: 'gratitude-moment', type: 'screens', screens: [...] },
  { id: 'support-person-checkin', type: 'screens', screens: [...] },
]
```

User flow: Crossroads → pick activity → route fires with `bookmark: 'crossroads'` → activity runs → bookmark pops back to Crossroads → pick another or Continue. The terminal flag on `begin-session` prevents sequential advance from walking into the tail detours after the session starts.

#### File structure

```
src/components/session/TransitionModule/
  TransitionModule.jsx              # Main orchestrator
  useTransitionModuleState.js       # Central state + activeNavigation persistence
  customBlocks/
    index.js                        # Registry mapping block `type` → component
    ActionBlock.jsx                 # Generic store-action button (allowlisted)
    BodyCheckInBlock.jsx            # Sensation grid (select + comparison modes)
    DataDownloadBlock.jsx           # Opens DataDownloadModal
    EditableDoseBlock.jsx           # Inline-editable plannedDosageMg
    ExpandableBlock.jsx             # Click-to-reveal text section
    ExpandableStoreDisplayBlock.jsx # Expandable variant of store-display
    IngestionTimeBlock.jsx          # Record/confirm substance intake
    PhaseRecapBlock.jsx             # Phase summary stats
    StoreDisplayBlock.jsx           # Read-only store-value display
    TouchstoneArcBlock.jsx          # Opening + closing touchstone SVG arc
    TouchstonePromptBlock.jsx       # Prompt → accent-box display, click to edit

src/content/transitions/            # Content config files
  openingRitualConfig.js            # Opening Ritual (pre-session → begin-session)
  peakTransitionConfig.js           # Come-up → Peak
  peakToIntegrationConfig.js        # Peak → Integration
  closingRitualConfig.js            # Integration → Closing
  shared.js                         # Shared snippets reused across configs
  somaticSensations.js              # 10-sensation list for body-check-in
```

Section renderers (`ScreensSection`, `MeditationSection`) are imported from MasterModule — no parallel implementation.

---

## Progress Bar System

A unified `ModuleStatusBar` sits below the header in all Active tab contexts — active session phases, pre-session, preview activity, transitions, follow-up, and closing ritual. It renders a 1px progress line and a flexible status row with left label, center content, and right content slots.

### Architecture

```
Module (reports progress)
  → onProgressUpdate callback
    → ActiveView.handleProgressUpdate() stores state
      → ModuleStatusBar renders progress line + status row
        → ModuleProgressBar (internal 1px fill bar)
```

Every module receives `onProgressUpdate` as a prop via `ModuleRenderer`. Modules report progress using the `useProgressReporter` hook, which provides four methods:

```javascript
const report = useProgressReporter(onProgressUpdate);

report.step(3, 10);      // Step 3 of 10 → 30% progress (mode: 'step')
report.timer(45, 120);   // 45s of 120s → 37.5% progress (mode: 'timer')
report.raw(42.5);        // Pre-computed 42.5% (mode: 'step')
report.idle();            // 0% progress (mode: 'idle')
```

### Two Progress Modes

**Timer-based** — for meditations, silence timers, timed activities. The `useMeditationPlayback` and `useSilenceTimer` hooks call `onProgressUpdate` directly with `mode: 'timer'`, providing elapsed/total seconds. The status bar shows `MM:SS / MM:SS` in the center.

**Step-based** — for step-through screens, journaling, transitions, follow-up flows. Modules call `report.step(current, total)` or `report.raw(percentage)`. The status bar shows the progress line only (no timer display).

**Hybrid modules** (e.g., Pendulation, Protector Dialogue Part 1, Shaking the Tree) switch between modes. During step phases they call `report.step()`, during meditation/timer phases the playback hook takes over. The progress bar transitions seamlessly.

### Context Labels

`ModuleStatusBar` receives its label as a prop — it has no internal logic about phases or contexts.

| Context | Left Label | Center | Right |
|---------|-----------|--------|-------|
| Active session | `Phase 1 · Come-Up` / `Phase 2 · Peak` / `Phase 3 · Synthesis` | Module timer | Session elapsed (`H:MM:SS`) |
| Preview activity | `Pre-Session` | Module timer | Exit button |
| Substance checklist | `Preparation` | — | `X of Y` step count |
| Opening ritual | `Opening Ritual` | — | `X of Y` step count |
| Transitions | `Transition` | Session elapsed | — |
| Closing ritual | Dynamic step label | Session elapsed | — |
| Follow-up modules | Dynamic step label | — | — |

### MasterModule Progress

MasterModule uses **cumulative visited-based progress** with screen-level granularity. This handles conditional screens, routing, and out-of-order section traversal.

**Formula:**
```
expectedTotal = visitedCount + 1 + unvisitedRemaining
sectionBase = visitedCount / expectedTotal
sectionWeight = 1 / expectedTotal
screenFraction = visibleScreenPosition / totalVisibleScreens

progress = (sectionBase + sectionWeight × screenFraction) × 100
```

- `visitedCount` = number of completed sections (from `visitedSections` array)
- `unvisitedRemaining` = sections not yet visited and not the current one, **restricted to sections at or before the first `terminal: true` section** (see *Terminal-awareness* below)
- `screenFraction` = position within the current `screens` section (reported by `ScreensSection` via `onScreenChange` callback)

**Why cumulative, not index-based:** Routing can visit sections out of array order (e.g., index 2 → 5 → 4 → 6). Using `currentSectionIndex / totalSections` would give "free" credit for skipped sections. The cumulative approach counts only what the user actually completed, and shrinks the denominator when sections become unreachable.

**Terminal-awareness (tail detours):** When the section array contains a `terminal: true` section followed by additional "tail detour" sections (reachable only via bookmark routing from earlier), the formula slices the array at the first terminal entry before computing `unvisitedRemaining`:

```js
const firstTerminalIdx = sections.findIndex((s) => s.terminal === true);
const mainFlowSections = firstTerminalIdx >= 0
  ? sections.slice(0, firstTerminalIdx + 1)
  : sections;
const unvisitedRemaining = mainFlowSections
  .filter((s) => s.id !== currentId && !visitedSections.includes(s.id)).length;
```

Without this, tail detours that the user can no longer reach (they've already passed the routing gate) would stay in `unvisitedRemaining` and leave permanent "dead weight" at the end of the progress bar — e.g., the opening ritual's final page would read ~71% instead of 100% because four tail detours after `reassurance-2` were being counted. Detours the user *did* visit via routing still contribute to progress via `visitedSections` → `visitedCount`, so taking a detour doesn't penalize progress — only unreachable ones are excluded. Both `MasterModule` and `TransitionModule` apply this filter identically.

**Section type behavior:**
- `screens` — progress advances per-screen within the section's weight
- `meditation` / `timer` — sub-components report their own timer progress directly (MasterModule does not override)
- `generate` — treated as a single step at the section's base progress

### Key Files

| File | Role |
|------|------|
| `src/components/active/ModuleStatusBar.jsx` | Unified status bar: progress line + left/center/right slots |
| `src/components/active/capabilities/ModuleProgressBar.jsx` | Internal 1px progress line (used only by ModuleStatusBar and IntakeFlow) |
| `src/hooks/useProgressReporter.js` | Convenience hook: `step()`, `timer()`, `raw()`, `idle()` |
| `src/components/active/ActiveView.jsx` | Orchestrates: owns `moduleProgressState`, passes `handleProgressUpdate` to `ModuleRenderer`, builds status bar labels |
| `src/components/active/ModuleRenderer.jsx` | Passes `onProgressUpdate` as a common prop to all module components |

---

## Module Boundary Fades

Both `ActiveView` (for MasterModule instances and follow-up library modules) and `TransitionModule` (for phase transitions) coordinate smooth fade-outs at module boundaries so the `ModuleStatusBar` and `ModuleControlBar` never disappear abruptly. Individual bar elements also fade in when they first become visible mid-module. Four mechanisms handle four situations — all use the same `animate-fadeIn` CSS keyframe (300 ms, defined in `index.css`) or short opacity transitions.

### Intra-module (screen-to-screen, section-to-section)

Within a single MasterModule or TransitionModule, the `ModuleControlBar` is rendered as a sibling of `ModuleLayout` inside each section renderer's fragment return. When a section changes, React commits the old renderer's unmount and the new renderer's mount in a single frame, so the Continue button appears continuous — there's no visible gap. No wrapper-level `animate-fadeIn` is applied to the keyed section-change wrapper in `TransitionModule`; a fade there would ramp the button from opacity 0→1 on every section transition and produce a visible flash.

`blockReadiness` (the Continue-gating map for custom blocks like `IngestionTimeBlock`) is cleared **synchronously alongside** `setScreenIndex` inside `ScreensSection.handleNext` / `handleBack` — not via a reactive `useEffect`. Doing it in the same state-update batch avoids the child-effect-before-parent-effect race that could otherwise flip `Continue` enabled → disabled → enabled during a screen change.

### MasterModule end (module → next module)

`ActiveView` wraps every `ModuleStatusBar` + `ModuleRenderer` pairing in a **keyed fade wrapper**:

```jsx
<div
  key={currentModule?.instanceId ?? 'open-space'}
  className={`transition-opacity duration-500 ${isExiting ? '' : 'animate-fadeIn'}`}
  style={{ opacity: isExiting ? 0 : 1, pointerEvents: isExiting ? 'none' : 'auto' }}
>
  <ModuleStatusBar ... />
  <ModuleRenderer ... onComplete={...} onSkip={...} />
</div>
```

Four render sites use this pattern: pre-session active module, come-up phase, peak/integration phases, and follow-up library modules (all in `ActiveView.jsx`).

A shared helper `fadeOutThenDo(instanceId, action)` wraps the store action that would otherwise unmount the module synchronously:

1. Sets `moduleExitingId = instanceId` → wrapper fades to opacity 0 over `MODULE_EXIT_FADE_MS` (500 ms), gates `pointerEvents: 'none'` to prevent double-click on the invisible button.
2. After 500 ms, fires the real store action (`completeModule`, `skipModule`, `completePreSessionModule`, or `abandonModule`).
3. The store swap changes `currentModule.instanceId` → the wrapper's `key` changes → old wrapper unmounts, new wrapper mounts with `animate-fadeIn` playing from opacity 0 → 1.

Every `ModuleRenderer` in `ActiveView` passes its `onComplete` and `onSkip` through `fadeOutThenDo`. Modules themselves never need to know about the fade — from inside the module, `onComplete()` still looks synchronous.

### TransitionModule end (phase → next phase)

`TransitionModule` has its own ritual-moon exit overlay via `TransitionOverlay` (standardized on `AsciiMoon` for all four transitions). When the last section completes or the user hits Skip in main flow, `overlayPhase` flips to `'exiting'` and the overlay mounts and fades in at z-index 60 full-viewport.

When `overlayPhase === 'exiting'`, the content wrapper around `ModuleStatusBar` + the current section's `ModuleControlBar` also flips to `opacity: 0` with `transition-opacity duration-700`. The bars fade out in parallel with the overlay's 700 ms fade-in so both animations finish at roughly the same moment — no "bars hang around while the overlay slowly darkens" effect, no opacity-0 gap before unmount. The app's background color matches the overlay background, so the few frames where both are partly transparent remain visually uniform.

The last section continues to render through `modulePhase === 'complete'` (there is *no* early `return null` for that state) so the `ModuleControlBar` remains mounted until `TransitionModule` itself unmounts when `handleExitComplete` fires `config.onComplete` at the end of the overlay's exit sequence.

Skip in `handleSkip` routes through `setOverlayPhase('exiting')` rather than calling `config.onComplete` directly, so Skip produces the same ritual-moon fade as natural completion.

### Per-element mount fade (bars and buttons)

Chrome elements fade in individually **when they first mount** mid-module — not when their props change. This is handled by attaching `animate-fadeIn` to the conditionally-rendered elements themselves:

| Element | File | Triggers on |
|---|---|---|
| `ModuleStatusBar` (whole bar) | `src/components/active/ModuleStatusBar.jsx` | Bar appears for the first time (e.g., step 2 of `SubstanceChecklist` after the index step hides it) |
| Back button | `src/components/active/capabilities/ModuleControlBar.jsx` | `showBack` flips false → true (e.g., on screen 2+ of a `ScreensSection`) |
| Skip button | same | `showSkip` flips false → true |
| Seek back / forward | same | `showSeekControls` flips false → true (typically on meditation start) |
| Volume, Transcript slot content | `src/components/active/modules/MasterModule/sectionRenderers/MeditationSection.jsx` — wrapped in `<div className="animate-fadeIn">` inside the `leftSlot` / `rightSlot` props | Meditation starts and the slot child goes from `null` to mounted |

Because `animate-fadeIn` is a CSS keyframe rather than a CSS transition, it only fires on mount — prop changes on an already-mounted element never replay the animation. No fade-out is added for any of these elements; when they're no longer needed they just unmount.

These per-element fades compose cleanly with the module-level fades above: on module mount, the `ActiveView` keyed wrapper's `animate-fadeIn` plays alongside `ModuleStatusBar`'s own `animate-fadeIn` (both 300 ms), producing a unified smooth entry. The global `@media (prefers-reduced-motion)` rule in `index.css` collapses both animation and transition durations to 0.01 ms, so these fades are respected automatically.

### Key files

| File | Role |
|------|------|
| `src/components/active/ActiveView.jsx` | `moduleExitingId` state, `fadeOutThenDo` helper, keyed fade wrappers at all 4 module render sites |
| `src/components/session/TransitionModule/TransitionModule.jsx` | Exit overlay covers content (no opacity flip on the inner wrapper), Skip routed through overlay |
| `src/components/session/TransitionModule/TransitionOverlay.jsx` | Ritual-moon entrance + exit overlay, used by every TransitionModule |
| `src/components/active/modules/MasterModule/sectionRenderers/ScreensSection.jsx` | Synchronous `setBlockReadiness({})` alongside `setScreenIndex` in `handleNext` / `handleBack` |
| `src/components/active/ModuleStatusBar.jsx` | `animate-fadeIn` on bar outer `<div>` for first-mount fade |
| `src/components/active/capabilities/ModuleControlBar.jsx` | `animate-fadeIn` on Back / Skip / Seek buttons when they conditionally mount |
| `src/components/active/modules/MasterModule/sectionRenderers/MeditationSection.jsx` | Wraps `leftSlot` / `rightSlot` children in `<div className="animate-fadeIn">` |

---

## Timeline Generation

The intake questionnaire captures a **primary focus** and **guidance level**, which together determine the activity timeline generated for the session. This produces 11 distinct configurations.

### Focus Areas

| Focus | Theme | Unique Modules |
|-------|-------|----------------|
| Self-Understanding | Values, patterns, inner parts | Values Compass, Open Awareness |
| Emotional Healing | Self-compassion, processing, release | Protector Dialogue (linked pair), Stay With It |
| Relationship | Attachment, EFT exploration | The Descent + The Cycle (linked pair), Let's Dance |
| Creativity & Insight | Open flow, embodiment, play | Let's Dance, Open Awareness, Felt Sense |
| Open Exploration | Balanced mix (default) | Broad sampling across all module types |

### Guidance Levels

| Level | Description |
|-------|-------------|
| Full | Pre-session activities (intention setting, life graph) + fuller module set per phase |
| Moderate | Fewer pre-session activities + lighter module set (removes ~2-3 modules vs full) |
| Minimal | No pre-session activities, lightweight structure across all phases |

### Configuration Structure

Defined in `src/content/timeline/configurations.js`:

```javascript
TIMELINE_CONFIGS[focus][guidanceLevel] = {
  preSession: [{ libraryId, duration }],  // optional
  comeUp:     [{ libraryId, duration }],
  peak:       [{ libraryId, duration }],
  integration:[{ libraryId, duration }],
}
// Linked modules add: { linkedGroup, linkedRole }
// Minimal is a flat object (no guidance sub-keys)
```

### Generation Flow

`generateTimelineFromIntake()` in `useSessionStore.js`:
1. Reads `sessionProfile.primaryFocus` (fallback: `'open'`) and `sessionProfile.guidanceLevel` (fallback: `'full'`)
2. Looks up the matching configuration from `TIMELINE_CONFIGS`
3. Builds module instances from the config (assigns `instanceId`, `order`, `phase`, library content)
4. Resolves linked module groups (e.g., `'protector'` → shared `linkedGroupId`)
5. Inserts booster check-in as post-processing — auto-seeded into peak at order 1. The stored `phase`/`order` is bookkeeping only; visual placement is recomputed at render time (see "Booster Card Placement").
6. Calculates phase durations and precaches audio

---

## Audio Meditation System

Eleven meditation modules use pre-recorded TTS audio with synchronized text display, all sharing a unified playback architecture. All support 10-second skip-back/skip-forward controls during playback.

### Meditations

| Meditation | Audio Files | Duration | Unique Feature |
|------------|:-----------:|----------|----------------|
| Open Awareness | 26 | 10-30 min (variable) | Conditional prompts for longer sessions (20+ min) |
| Body Scan | 54 | 10-15 min (variable) | Silence expansion concentrated in later body regions |
| Self-Compassion | 70 | ~11-15 min (fixed per variation) | 3 variations assembled from shared core + variation clips |
| Simple Grounding | ~20 | ~9 min (fixed) | Sequential grounding steps |
| Short Grounding | ~10 | ~5 min (fixed) | Compact grounding for come-up phase |
| Felt Sense | ~30 | ~10-15 min (fixed per variation) | 2 variations: gentle practice + going deeper |
| Leaves on a Stream | ~15 | ~8 min (fixed) | ACT defusion exercise |
| Stay With It | ~25 | 10-25 min (variable) | Multi-phase: meditation → check-in → psychoeducation → journaling |
| Protector Dialogue | 16 | 8-12 min (fixed) | Part of 2-part IFS activity; listen/read modes |
| The Descent | — | ~10 min (fixed) | EFT relationship exploration meditation (Part 1 of linked pair) |
| The Cycle Closing | — | ~5 min (fixed) | EFT closing meditation after cycle mapping (Part 2) |

### Architecture

```
Content Definition (src/content/meditations/<name>.js)
  ↓ prompts[] with baseSilenceAfter, silenceExpandable, silenceMax
  ↓
Component useMemo → builds [timedSequence, totalDuration]
  ↓ uses generateTimedSequence() from content/meditations/index.js
  ↓
useMeditationPlayback hook (src/hooks/useMeditationPlayback.js)
  ↓ orchestrates timer, audio-text sync, prompt progression, pause/resume
  ↓
audioComposerService (src/services/audioComposerService.js)
  ↓ fetches TTS clips, composes gong + clips + silence into single MP3 blob
  ↓ returns blobUrl + promptTimeMap for audio-text sync
  ↓
useAudioPlayback hook (src/hooks/useAudioPlayback.js)
  ↓ plays the single composed blob via <audio> element
  ↓ iOS screen-lock resilient (single continuous audio keeps session alive)
  ↓
Audio source files (public/audio/meditations/<name>/<promptId>.<format>)
```

### Audio-Text Sync

- Audio leads text by **200ms** — text fades in after audio starts
- Text fades out **2s into silence** after audio finishes
- **Fallback**: If audio fails or is muted, text displays for 8s then fades out
- Prompt phases: `hidden` → `fading-in` → `visible` → `fading-out`

### Content Property Reference

Every meditation prompt uses these properties:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique prompt ID, also used as audio filename |
| `text` | string | Yes | Display text shown to user |
| `baseSilenceAfter` | number | Yes | Base silence duration in seconds after this prompt |
| `silenceExpandable` | boolean | No | Whether silence can scale with duration selection |
| `silenceMax` | number | No | Maximum silence in seconds (caps expansion) |
| `conditional` | object | No | e.g. `{ minDuration: 20 }` — only include for sessions >= 20 min |

### Meditation-Level Properties

Each meditation object in `src/content/meditations/<name>.js` exports:

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique meditation ID (matches registry key) |
| `title` | string | Display title |
| `description` | string | Brief description shown on idle screen |
| `speakingRate` | number | Words per minute for duration estimation (e.g. 150 or 90) |
| `prompts` | array | Array of prompt objects (see above) |
| `audio` | object | `{ basePath, format, [defaultVoice, voices] }` — see below |
| `minDuration` | number | Minimum duration in seconds (for variable-duration meditations) |
| `maxDuration` | number | Maximum duration in seconds |
| `durationSteps` | array | Available duration steps in minutes (e.g. `[10, 15, 20, 25, 30]`) |

`audio` minimum shape: `{ basePath: '/audio/meditations/<name>/', format: 'mp3' }`. Meditations that offer multiple voice readings add `defaultVoice: 'voiceId'` and `voices: [{ id, label, subfolder }]`. The default voice's clips live at `basePath` root (`subfolder: ''`); alternate voices live in nested subfolders. See **Voice System** below and `MEDITATION_AUDIO_SYSTEM.md` for the full data flow.

Self-Compassion also uses: `variations`, `defaultVariation`, `assembleVariation()`, and shared clip segments instead of a flat `prompts` array.

### Shared Hook: `useMeditationPlayback`

All TTS meditation components delegate playback to this shared hook. It handles:

1. Session store integration (start/pause/resume/reset via Zustand)
2. Single-blob audio composition (gong + TTS clips + silence via `audioComposerService`)
3. Prompt progression based on wall-clock time (iOS-resilient, survives screen lock)
4. Audio-text synchronization (audio leads text by 200ms, fade in/out)
5. 10-second skip-back/skip-forward seeking with instant prompt text sync
6. Media Session API for iOS lock-screen play/pause controls
7. Store-to-audio sync (bridges booster modal pause/resume to audio element)
8. Timer reporting to parent via `onProgressUpdate`
9. Phase derivation (`idle` / `loading` / `active` / `completed`) and primary button state

**Signature:** `useMeditationPlayback({ meditationId, moduleInstanceId, timedSequence, totalDuration, onComplete, onSkip, onProgressUpdate })` — see the hook source for the full parameter and return shapes. Notable returns: state booleans (`hasStarted`, `isPlaying`, `isComplete`), playback position (`elapsedTime`, `currentPrompt`, `promptPhase`), the nested `audio` controller, control handlers (`handleStart`, `handleBeginWithTransition`, `handlePauseResume`, `handleSkip`, `handleSeekRelative`), and UI helpers (`getPhase`, `getPrimaryButton`) that feed directly into `ModuleControlBar` props. `handleBeginWithTransition` is the modern begin flow — sequences idle-leaving → preparing (with a `MeditationLoadingScreen` fade-in and a minimum visible duration) → preparing-leaving → active, reading the current stage via the returned `transitionStage` value.

### Voice System

Meditations can offer multiple voice readings of the same prompt set. Today only **Simple Grounding** ships voice variants (Thoughtful Theo + Relaxing Rachel), but the architecture scales.

**Content:** Each meditation's `audio` object declares `voices: [{ id, label, subfolder }]` plus `defaultVoice`. Alternate voices live in nested subfolders under `basePath`; the default voice's clips sit at the root.

**Preference:** `useAppStore.preferences.defaultVoiceId` (persisted, seeded to `'theo'` via v1 migration). Read by `precacheAudioForTimeline(modules, voiceId)` when the session store builds a timeline, so the PWA cache warms with the user's preferred voice.

**Settings UI (`src/components/tools/SettingsTool.jsx`):** Default Voice row with `<` / `>` cycler + Preview button. Uses a **commit-on-tab-leave** model — the cycler writes to a local `pendingVoiceId` while the user is on the Tools tab; only when `currentTab` transitions away does the effect call `setPreference` and kick off a re-precache. Rapid toggling produces zero network work. Preview button plays `/audio/voice-previews/<voiceId>.mp3` via a plain `new Audio()` with a 150ms volume fade on stop.

**Voice-preview copy standard:** Every voice uses the same preview text (see `scripts/generate-simple-grounding-audio.mjs` header comment and `MEDITATION_AUDIO_SYSTEM.md` → Voice System for the canonical wording). Same ElevenLabs settings as the voice's production meditation clips. Saved to `public/audio/voice-previews/<voiceId>.mp3`.

**Idle screen voice pill:** Rendered inside `IdleScreen` (from `ModuleLayout.jsx`) when `meditation.audio.voices.length > 1`. Module owns `selectedVoiceId` local state, initialized from the preference via `resolveEffectiveVoiceId()` and kept in sync via a `useEffect`. Snapshotted at `handleBeginWithTransition` so mid-session pill toggles can't affect in-flight audio.

**Key helpers (in `src/content/meditations/index.js`):**
- `resolveVoiceBasePath(audioConfig, voiceId)` — returns `basePath + subfolder` for the voice, or plain `basePath` for meditations without voices.
- `resolveEffectiveVoiceId(audioConfig, preferredVoiceId)` — returns the preferred voice if present in this meditation, else `defaultVoice`, else `null`.
- `getAvailableVoices()` — deduplicated voice list across the library; used by Settings.
- `generateTimedSequence(..., { voiceId })` — threads `voiceId` into `audioSrc` resolution so each clip URL points at the right folder.
- `estimateMeditationDurationSeconds(meditation, { voiceId })` — voice-aware idle-screen "time: X min" estimate.

### Audio Generation

Audio files are generated using ElevenLabs TTS via scripts in `scripts/`. Each meditation has its own generation script that imports prompts from the content definition and outputs MP3 files to the corresponding `public/audio/meditations/<name>/` directory.

| Script | Voice | Output Directory |
|--------|-------|------------------|
| `generate-body-scan-audio.mjs` | Oliver Silk | `public/audio/meditations/body-scan/` |
| `generate-self-compassion-audio.mjs` | Oliver Silk | `public/audio/meditations/self-compassion/` |
| `generate-simple-grounding-audio.mjs` | Oliver Silk | `public/audio/meditations/simple-grounding/` |
| `generate-protector-audio.mjs` | Theo Silk | `public/audio/meditations/protector/` |
| `generate-felt-sense-audio.mjs` | Theo Silk | `public/audio/meditations/felt-sense/` |
| `generate-leaves-on-a-stream-audio.mjs` | Theo Silk | `public/audio/meditations/leaves-on-a-stream/` |
| `generate-stay-with-it-audio.mjs` | Theo Silk | `public/audio/meditations/stay-with-it/` |
| `generate-the-descent-audio.mjs` | Theo Silk | `public/audio/meditations/the-descent/` |
| `generate-the-cycle-closing-audio.mjs` | Theo Silk | `public/audio/meditations/the-cycle-closing/` |
| `generate-silence-blocks.mjs` | — | Pre-rendered silence MP3 blocks for blob composition |

**Voices:**

| Voice | ID | Typical Settings |
|-------|----|------------------|
| Oliver Silk | `jfIS2w2yJi0grJZPyEsk` | stability 0.88, similarity 0.88, speed 0.70 |
| Theo Silk | `UmQN7jS1Ee8B1czsUtQh` | stability 0.65, similarity 0.70, style 0, speed 0.87, speaker_boost on |
| Relaxing Rachel | `ROMJ9yK1NAMuu1ggrjDW` | stability 0.80, similarity 0.75, style 0.50, speed 0.81, speaker_boost on |

**Usage:**
```bash
# Dry run — preview prompts and filenames, no API calls
node scripts/generate-<name>-audio.mjs --dry-run

# Generate all audio files
ELEVENLABS_API_KEY=your_key node scripts/generate-<name>-audio.mjs

# Resume from a specific prompt index (0-based) — skips earlier prompts
ELEVENLABS_API_KEY=your_key node scripts/generate-<name>-audio.mjs --start 5

# Regenerate a single prompt by ID
ELEVENLABS_API_KEY=your_key node scripts/generate-<name>-audio.mjs --only settling-01

# List all voices on your ElevenLabs account
ELEVENLABS_API_KEY=your_key node scripts/generate-<name>-audio.mjs --list-voices
```

**Creating a new generation script:**

1. Define prompts in `src/content/meditations/<name>.js` (each prompt needs an `id` and `text`)
2. Copy an existing script (e.g. `generate-protector-audio.mjs`) as a template
3. Update: `VOICE_ID`, `VOICE_SETTINGS`, `SPEECH_SPEED`, `OUTPUT_DIR`, and the content import
4. Run `--dry-run` first to verify prompt count and text, then generate
5. Each prompt's `id` becomes its filename (e.g. `settling-01` → `settling-01.mp3`)
6. The content file's `audio.basePath` must match the output directory path relative to `public/`

**Audio spec:** 44100 Hz, mono, 128 kbps CBR MP3 (`mp3_44100_128` format in ElevenLabs API). The `audioComposerService` composes these clips with silence gaps and a gong into a single playback blob at runtime.

---

## Helper Modal (V5)

The Helper Modal is the "What's happening?" support overlay accessed via a heart-icon button in the header. V5 replaces the V4 flat rating-to-route system with a **phase-aware decision tree** per category: rating → choice(s) → resolver-generated result. The same intensity rating produces wildly different advice depending on where the user is in the session, what part of their body they're feeling, what kind of resistance is showing up, etc.

### Activation & Phase Gating

- Trigger: `HelperButton` (heart icon, accent color, stroke width 3) lives in `Header.jsx` between the AI tab and the hamburger menu.
- Visibility gate: button only renders when `sessionPhase` is `'pre-session'`, `'active'`, or `'completed'`.
- Open mechanism: button calls `useHelperStore.openHelper()`. AppShell conditionally mounts `<HelperModal />` via `React.lazy` + `Suspense` based on `isOpen`, mirroring the BoosterModal/ModuleLibraryDrawer pattern. The entire helper subsystem (~5,000 lines across 28 files) is code-split into its own chunk and only downloaded on first open.
- Close mechanism: `handleClose` sets a local `isClosing` flag (triggers exit animation), then `setTimeout(closeHelper, 350)` unmounts the modal after the slide-out completes.
- Each open is a fresh React mount with fresh `useState`, so there are never leftover-state bugs.

### Major-View State Machine

`HelperModal` owns a 3-case `currentStep` state machine:

| Step | Content |
|------|---------|
| `'initial'` | `CategoryGrid` — 2-column category grid + slim full-width emergency contact card at the bottom. (`PreSessionContent` overrides this when `sessionPhase === 'pre-session'`.) |
| `'triage'` | `TriageStepRunner` walking the selected category's decision tree, OR `PlaceholderCategory` for stub categories without a `steps` array. |
| `'emergency-contact'` | `EmergencyContactView` — dedicated page with category-style header, contact card, edit toggle, notes textarea, and an "I need more help" expand for the full EmergencyFlow. |

`stepHistory` is a stack used by the top-bar back button to navigate between major views. Inside the triage flow, the runner manages its own back navigation imperatively via `useImperativeHandle`; the parent's back button delegates to `triageRunnerRef.current.goBack()` first and only falls through to the major-view stack when the runner reports there's nothing left to pop.

### Decision Tree Architecture

Each category in `helperCategories` declares a `steps` array describing the decision tree:

```js
{
  id: 'intense-feeling',
  phases: ['active', 'follow-up'],
  icon: 'HandIcon',
  label: 'Intense feeling',
  description: '...',          // shown on the grid card
  expandedDescription: '...',  // shown inside CategoryHeader during triage
  acknowledgeText: '...',      // shown for rating 0
  steps: [
    { type: 'rating',  id: 'intensity', prompt: '...', journalLabel: 'Intensity' },
    { type: 'choice',  id: 'bodyLocation', prompt: '...',
      showWhen: (state) => state.intensity >= 1 && state.intensity <= 9,
      options: [...] },
    { type: 'result',  resolve: resolveIntenseFeeling },
  ],
}
```

Three step types:

| Type | Purpose |
|------|---------|
| `rating` | 0–10 bubble scale (`RatingScale`) — captures a numeric value into `triageState[id]` |
| `choice` | Single-select option cards (`TriageChoiceStep`) — captures a string value into `triageState[id]` |
| `result` | Calls a resolver function `(triageState, sessionContext) → ResultPayload` and renders via `TriageResultStep` |

`showWhen` is an optional predicate that hides a step when its result would be undefined or irrelevant. `journalLabel` is a short noun (e.g. "Vividness", "Body location") used in journal entries.

### TriageStepRunner — Stacking Step Flow

Steps render as a stack: each completed step stays visible, and the next step fades in beneath it via the `animate-fadeIn` CSS keyframe (which only runs once per mount). Existing steps don't re-mount when the next one appears, so they never re-fade or flicker. The user accumulates a visible triage path on the page.

**Forward navigation:** the runner writes the value into `triageState`, then schedules `advanceFrom(...)` after a 300ms beat (so the user sees their selection register on the bubble or card before the next step appears). On advance, the runner also calls `requestScroll()` which increments a `scrollTick` state — a `useEffect` watching that tick calls `bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })`, smoothly bringing the new content into view as it fades in.

**Retroactive editing:** locked steps stay tappable. When the user taps a different option on a previously-completed step, `truncateStateAfter` wipes any downstream answers, the new value is written, and `advanceFrom` re-walks from that point. Visual: snap-update with no fade animation (the user is making a direct correction and expects an instant response).

**Back navigation:** the runner's `goBack` fades out the current active step's container via `fadingOutFromIndex`, then decrements `activeIndex` after a 200ms timer. If activeIndex is already 0, returns `false` so the parent can navigate back to the category grid.

**Hardcoded rating overrides:**
- Rating `0` → renders `AcknowledgeClose` with the category's `acknowledgeText` beneath the locked rating. No further steps walked.
- Rating `10` → renders `EmergencyFlow` beneath the locked rating. Bypasses all subsequent steps. (Rating 9 walks the normal decision tree as the high end of the regular range.)

**Locked-step appearance:** rating bubbles dim non-selected to 30% opacity but stay tappable. Choice cards highlight the selected option and dim the others. "Locked" is purely visual — completed steps remain interactive for retroactive editing.

### Session Context & Phase-Aware Resolvers

On mount, `HelperModal` builds a `sessionContext` object via `useMemo`:

```js
{
  // Active-session fields (null/post-session during follow-up)
  minutesSinceIngestion,    // wall-clock minutes from substanceChecklist.ingestionTime, or null
  timelinePhase,            // state.timeline.currentPhase ('come-up' | 'peak' | 'integration' | null)
  phaseWindow,              // classified by classifyPhaseWindow(minutes)
  hasEmergencyContact,      // boolean
  // Follow-up fields (null during active session)
  daysSinceSession,         // days since session.closedAt, or null
  timeWindow,               // classified by classifyFollowUpWindow(days): 'acute' | 'early' | 'mid' | 'late' | null
}
```

`phaseWindow` is derived purely from minutes since ingestion (independent of the user's manually-advanced timeline phase). The windows:

| Window | Minutes | Used by resolvers for... |
|---|---|---|
| `pre-onset` | 0–19 | Anticipatory anxiety framing |
| `come-up` | 20–60 | Sympathomimetic activation, "this is your body adjusting" framing |
| `early-peak` | 61–90 | Transition copy, between come-up and full effects |
| `peak` | 91–210 | Full processing window, somatic-experiencing tools |
| `late-session` | 211–360 | Synthesis, integration, letter-writing tools |
| `post-session` | 361+ | Residual effects only |

`timeWindow` is derived from days since session completion (`session.closedAt`). The windows:

| Window | Days | Used by follow-up resolvers for... |
|---|---|---|
| `acute` | 0–3 | Serotonin dip window, highest vulnerability |
| `early` | 4–14 | Still settling, insights fresh but fading |
| `mid` | 15–60 | Active integration period |
| `late` | 61+ | Long-term integration |

Resolvers (`src/content/helper/resolvers/*.js`) are pure functions: `(triageState, sessionContext) → ResultPayload`. No store access, no React, no side effects. Each of the 8 categories has its own resolver file. Active-session resolvers branch on `phaseWindow`; follow-up resolvers branch on `timeWindow`. Both read from the same `sessionContext` object.

A `ResultPayload` looks like:

```js
{
  timeContextLine?: "You're about 47 minutes in.",  // come-up + early-peak only
  message: "Pressure in the chest during the peak often signals...",
  secondaryMessage?: "If you're worried, the options below are for you.",
  activityIntro?: "These can help you stay with what's happening.",
  activities?: [{ id: 'simple-grounding' }, { id: 'body-scan' }],
  activityPaths?: [                  // ego-dissolution identity branch only
    { label: 'This feels scary', activities: [...] },
    { label: 'This feels expansive', activities: [...] },
  ],
  showEmergencyCard?: true,          // chest-heart come-up
  supportResources?: [               // follow-up categories only
    { type: 'fireside' },            // Fireside Project call/text card
    { type: 'emergency-contact' },   // saved contact call/text card
    { type: 'find-therapist' },      // advisory card (no action buttons)
  ],
}
```

`formatTimeContext(minutes, phaseWindow)` in `resolverUtils.js` returns the time line only when `phaseWindow` is `come-up` or `early-peak`, hidden in `peak` / `late-session` / `null`. Time is shown to the exact minute ("about 19 minutes in"), not rounded. `formatFollowUpTimeContext(days, timeWindow)` returns a time line for `acute` and `early` windows only.

The `ACT` constant in `resolverUtils.js` is a shared dictionary mapping short keys to `{ id }` objects, e.g. `ACT.simpleGrounding = { id: 'simple-grounding' }`. Resolvers reference activities as `[ACT.simpleGrounding, ACT.bodyScan]`. `ActivitySuggestions` looks up display text via `getModuleById(activity.id)`, so a bare `{ id }` is sufficient.

### Categories — Cross-Phase Eligibility

`helperCategories` in `src/content/helper/categories.js` is the canonical list. Each category declares a `phases` ARRAY indicating where it should appear:

| Category | `phases` | Notes |
|---|---|---|
| Intense feeling | `['active', 'follow-up']` | Core category, appears in both phases |
| Trauma | `['active', 'follow-up']` | Core |
| Resistance | `['active', 'follow-up']` | Core |
| Grief | `['active', 'follow-up']` | Core |
| Ego dissolution | `['active']` | Active session only |
| I feel so good | `['active']` | Active session only |
| Low mood | `['follow-up']` | Follow-up only — severity × quality × functioning × timeWindow |
| Integration | `['follow-up']` | Follow-up only — stuckType × timeWindow |

`HelperModal` filters with `helperCategories.filter((c) => c.phases?.includes(phaseKey))`, where `phaseKey` is `'follow-up'` when `sessionPhase === 'completed'`, otherwise `'active'`. The 4 core categories appear in both grids.

### Modal Height — Single Rule

```js
const isExpanded =
  (currentStep === 'triage' && hasRatedInTriage) ||
  (currentStep === 'emergency-contact' && (isEditingContact || isContactEmergencyExpanded));
```

- **Default (`DEFAULT_MODAL_HEIGHT_PX`, currently 540px):** category grid, contact view in read mode, pre-session preview, follow-up placeholder, freshly-entered triage view before any rating commit.
- **Expanded (`min(95vh, calc(100vh - var(--tabbar-height) - 12px))`):** triggered by ANY of three things — the user committing a rating in a triage flow, tapping the contact card's Edit toggle, or tapping the contact view's "I need more help" expand button. Stays expanded for the rest of the flow until the user navigates back past the trigger.

The runner reports `hasRatedInTriage` upward via an `onRatingCommittedChange` callback. The contact view reports `isEditingContact` and `isContactEmergencyExpanded` upward via similar prop callbacks. All three states are owned by `HelperModal` so the height derivation lives in one place.

The 350ms `cubic-bezier(0.65, 0, 0.35, 1)` height transition is on the panel itself; all internal content fades happen alongside it.

### Emergency Contact Surface

The user's emergency contact lives at `state.sessionProfile.emergencyContactDetails` as `{ name, phone, notes }` (extended from `{ name, phone }` in v25 of the session store). It's captured during intake's `contact-input` question and editable from `SubstanceChecklist.jsx`, the dedicated `EmergencyContactView`, and the rating-10 `EmergencyFlow`.

**`EmergencyContactCard.jsx`** is the shared bordered card displaying the contact. Used in three places:

1. Inside `EmergencyFlow` (rating 10 result and "I need more help" expand)
2. Inside `EmergencyContactView` (the dedicated contact page)
3. Inside `TriageResultStep` when a resolver sets `showEmergencyCard: true` (chest-heart come-up)

Card features:
- **Name + Number on a single line** when both fit, with name left-aligned and number right-aligned via `justify-between`. Wraps to two lines when content would overflow (`flex-wrap` + `whitespace-nowrap` on the inner groups).
- **Tap-to-copy on the number** — tapping the number value writes it to the clipboard via `navigator.clipboard.writeText` (with a `document.execCommand('copy')` fallback for older webviews) and briefly swaps the text to "Copied" in accent color for 1.5s.
- **First-name-only Call/Text buttons** — labels show only the first name (split on whitespace), e.g. "Joe Dirt" → "Call Joe" / "Text Joe".
- **Optional Edit/Save toggle in the top-right corner** — when an `onEditToggle` callback is passed, a small uppercase "Edit" pill renders at `top: 8, right: 12`. Flips to accent-colored "Save" when `isEditing` is true. The card's top padding bumps up when the toggle is present so the small text doesn't overlap the value row.

**`EmergencyContactView.jsx`** is the dedicated contact page, reachable via the wide contact card on the initial step. Contains:

1. Wide CategoryHeader-style header with PhoneIcon escutcheon
2. `EmergencyContactCard` (with `hideLabel`, edit toggle, and `onContactAction` for journal logging)
3. **Animated edit-mode inputs** — name + phone text fields hidden behind a CSS grid `1fr/0fr` trick that smoothly grows/collapses while opacity-fading in/out, all in sync with the modal's 350ms height transition. Tracked via `inert` (not `aria-hidden`) to avoid focus warnings on collapse. Contains a secondary pill-shaped "Save" button beneath the phone input, functionally identical to the corner toggle.
4. **Notes box** — bordered textarea for emergency contact notes with concrete-examples placeholder. Auto-saves on blur. When focused with content, an inline pill-shaped "Save" affordance fades in at the bottom-center; tapping it (via `onMouseDown` to fire before blur, with `e.preventDefault()` to avoid passive-listener warnings) blurs the textarea and dismisses the mobile keyboard.
5. **"I need more help" expand/collapse** — beneath the notes box, an accent-colored button with a `CirclePlusIcon` that flips to `CircleSkipIcon` when expanded. Tapping fades in the full `EmergencyFlow` (with `hideContactCard` so the contact card isn't duplicated). The expand state is reported up to `HelperModal` so the modal grows to its expanded height.

**`EmergencyFlow.jsx`** renders inside the rating-10 emergency override AND inside the contact view's "I need more help" expand. Contains:

1. Reassurance text ("If something feels serious right now, trust that...")
2. `EmergencyContactCard` (suppressed via `hideContactCard` when called from `EmergencyContactView` to avoid duplication)
3. Emergency Services row (911 / 112)
4. Fireside Project card (psychedelic peer support — call or text)

All buttons in `EmergencyFlow` and `EmergencyContactCard` are `<a>` tags with `tel:` / `sms:` hrefs, plus inline `textDecoration: 'none'` and the `no-underline` Tailwind class to override the global `a` underline rule in `src/index.css`. All buttons fire an `onAction(label)` callback before navigation so `HelperModal` can write a journal entry capturing the action.

### Pre-Session Mode

When `sessionPhase === 'pre-session' && currentStep === 'initial'`, the modal renders `PreSessionContent` instead of the live `CategoryGrid`. This view shows the same `CategoryGrid` component with `categoriesDimmed` set to `true` — the 6 category cards are wrapped in `inert` and `opacity: 0.3` so they're visible but non-interactive. A centered explanatory overlay card sits over the dimmed grid with a heart icon and one short paragraph explaining what the modal becomes once the session is underway.

**Critical exception:** the wide emergency contact card at the BOTTOM of `CategoryGrid` stays fully interactive in pre-session, so the user CAN navigate to `EmergencyContactView` and set up their contact details before the session begins. `CategoryGrid`'s `categoriesDimmed` prop wraps only the inner category grid `<div>` in inert — the contact card below it is unaffected. The pre-session render path also passes `currentStep === 'initial'` as a guard so navigating to `'emergency-contact'` from pre-session correctly falls through to the normal `EmergencyContactView` switch case.

### Inserting Activities — Active and Follow-up

When the user taps an activity card from a triage result, `HelperModal.handleActivitySelect` calls `useSessionStore.insertAtActive(libraryId)`. This action:

1. Determines the target phase: `state.timeline.currentPhase` during an active session, OR `'follow-up'` when `sessionPhase === 'completed'`. This lets the helper modal insert activities into the follow-up timeline post-session.
2. Creates a new module instance at `order: 0` in the target phase
3. Resets the previously-active module's status from `'active'` back to `'upcoming'` and clears its `startedAt`
4. Sets `inOpenSpace: false` so `ActiveView`'s auto-start logic picks up the new module
5. Navigates to the active tab via `useAppStore.getState().setCurrentTab('active')`
6. Calls `precacheAudioForModule(libraryId)` (non-blocking)

The action also handles linked parent modules (e.g. `protector-dialogue`) by creating both Part 1 and Part 2 with a shared `linkedGroupId`. Part 2's phase tracks Part 1: in active session it goes to `integration`; in follow-up it stays in `follow-up`.

### Journal Logging — Create on Action

Journal entries are created **only when the user takes a real action**, not on category select / rating select / step navigation. The "action" surfaces are:

- Tapping an activity card in a triage result → `handleActivitySelect`
- Tapping a Call/Text/911/112/Fireside button anywhere in the modal → `handleEmergencyAction`
- Tapping a Call/Text button on the dedicated emergency contact view → `handleEmergencyAction`

The runner stashes its current `triageState` and the current resolved result, and `HelperModal` builds the entry at action time using `formatHelperModalLog` from `src/content/helper/formatLog.js`. The format captures the full triage path:

```
HELPER MODAL

Category: Intense feeling
Intensity: 5/10
Body location: Chest or heart
Phase window: Come-up (~30 min)
Activity chosen: Simple Grounding
```

Follow-up entries use a different header and time context:

```
HELPER MODAL (FOLLOW-UP)

Category: Low mood
Severity: 5/10
Quality: Flat and empty
Functioning: I'm getting through my day, but it's hard
Time window: Acute (2 days)
Activity chosen: Self-Compassion
```

`buildStepResponses(category, triageState)` is a helper in `formatLog.js` that walks the category's `steps` array and emits `[{ label, value }]` pairs (using each step's `journalLabel` and the matched option label). Steps that the user didn't reach (because of `showWhen` or rating overrides) are omitted.

Entries triggered from the standalone emergency contact view (no `triageState`) omit `categoryLabel`, step responses, and phase window cleanly.

### File Layout

```
src/components/helper/
  HelperModal.jsx              # Major-view orchestrator + journal entry creation
  HelperButton.jsx             # Heart trigger in Header
  HelperTopBar.jsx             # Back / "What's happening?" / close header bar
  CategoryGrid.jsx             # 2-column grid + slim emergency contact card; supports `categoriesDimmed`
  CategoryHeader.jsx           # Wide category card shown above the triage flow
  RatingScale.jsx              # 0–10 bubble scale, supports `dimmed` for completed state
  TriageStepRunner.jsx         # Stacking decision-tree orchestrator (forwardRef + goBack)
  TriageChoiceStep.jsx         # Single-select option cards
  TriageResultStep.jsx         # Resolver result + activities + support resources + I-need-more-help expand
  ActivitySuggestions.jsx      # Activity card list (reuses ModuleCard)
  SupportResourceCard.jsx     # Follow-up support resource cards (Fireside, emergency contact, find-therapist)
  EmergencyContactCard.jsx     # Shared contact card with name/number + Call/Text + tap-to-copy + edit toggle
  EmergencyContactView.jsx     # Dedicated contact page (header + card + edit + notes + I-need-more-help expand)
  EmergencyFlow.jsx            # Full emergency content (contact + 911/112 + Fireside); supports `hideContactCard`
  AcknowledgeClose.jsx         # Acknowledgment text shown when rating is 0
  PlaceholderCategory.jsx      # "Coming soon" view for future stub categories
  PreSessionContent.jsx        # Pre-session dimmed preview + explanatory overlay

src/content/helper/
  categories.js                # 8 categories with `phases` arrays + `steps` decision trees
  formatLog.js                 # formatHelperModalLog + buildStepResponses (V5 step-path format, follow-up variant)
  resolverUtils.js             # classifyPhaseWindow, classifyFollowUpWindow, formatTimeContext, formatFollowUpTimeContext, ACT id constants
  resolvers/
    intense-feeling.js         # resolveIntenseFeeling (intensity × bodyLocation × phaseWindow)
    trauma.js                  # resolveTrauma (vividness × dualAwareness × phaseWindow)
    resistance.js              # resolveResistance (strength × resistanceType × phaseWindow)
    grief.js                   # resolveGrief (intensity × expression × phaseWindow)
    ego-dissolution.js         # resolveEgoDissolution (disorientation × experienceType × phaseWindow)
    feel-good.js               # resolveFeelGood (energy × energyFeeling × phaseWindow)
    low-mood.js                # resolveLowMood (severity × quality × functioning × timeWindow)
    integration-difficulty.js  # resolveIntegrationDifficulty (stuckType × timeWindow)

src/stores/useHelperStore.js   # isOpen / openHelper / closeHelper (transient, not persisted)
```

---

## AI Assistant

An optional AI assistant for session support:

- **Providers**: Supports Anthropic, OpenAI, and OpenRouter APIs
- **Key Storage**: Encrypted with session-based encryption (auto-expires)
- **Context**: Builds system prompts with session state awareness
- **Components**: `AIAssistantModal`, `ChatWindow`, `ChatSidebar`
- **Store**: `useAIStore.js` manages conversations, settings, streaming

---

## Breath Controller System

The `useBreathController` hook is the core timing engine for all breathing animations:

```javascript
const controller = useBreathController({
  sequences: [
    { type: 'cycles', count: 6, pattern: { inhale: 4, exhale: 4 } },
    { type: 'duration', seconds: 60, pattern: { inhale: 5, hold: 2, exhale: 7 } },
    { type: 'idle', duration: 150, label: 'Free Breathing' }
  ],
  onComplete: () => {},
  onSequenceChange: (index) => {}
});

// Returns: phase, phaseProgress, moonAngle, currentCycle, overallProgress,
//          isRunning, start(), pause(), resume(), stop()
```

---

## State Management

All stores use Zustand with `persist` middleware for localStorage backup.

### useSessionStore (Core)

```javascript
{
  sessionPhase: 'not-started' | 'intake' | 'pre-session' |
                'substance-checklist' | 'active' | 'paused' | 'completed',

  intake: {
    currentSection, currentQuestionIndex, isComplete,
    showSafetyWarnings, showMedicationWarning,
    // Navigation + completion flags only. User-entered answers live in
    // `sessionProfile` (migrated out of `intake.responses` in store v24).
  },
  sessionProfile: {
    // Universal per-session user-data slice. Holds every value the user enters
    // during this session — intake questionnaire answers, the substance plan
    // (hasSubstance/hasTested/hasPreparedDosage/plannedDosageMg/dosageFeedback),
    // the intention artifacts (touchstone, intentionJournalEntryId,
    // focusJournalEntryId), and the emergency contact. Written via the single
    // universal `updateSessionProfile(field, value)` action; auto-derives
    // `dosageFeedback` whenever `plannedDosageMg` is written.
    //
    // Per-session, not global: each session has its own profile that travels
    // with the session through archive/restore, never destroyed by `resetSession`
    // (which always runs after the prior session is safely snapshotted into the
    // history store). Only `deleteSession()` permanently removes a profile.
    //
    // Includes: experienceLevel, sessionMode, primaryFocus, holdingQuestion,
    // emotionalState, guidanceLevel, sessionDuration, considerBooster,
    // safeSpace, heartConditions, psychiatricHistory, medications,
    // emergencyContactDetails: { name, phone, notes },  // (notes added in v25)
    // hasSubstance, hasTestedSubstance, hasPreparedDosage,
    // plannedDosageMg, dosageFeedback, touchstone,
    // intentionJournalEntryId, focusJournalEntryId,
    // ... and a handful of reserved fields (experienceLevel, activityPreferences,
    // hasMDMA, hasTested, etc.) collected by intake but not yet read by any
    // consumer. See useSessionStore.js for the full shape (35 fields total).
  },
  substanceChecklist: {
    hasTakenSubstance, ingestionTime, ingestionTimeConfirmed,
    // Ingestion-event runtime state only. The user-entered substance fields
    // (hasSubstance, plannedDosageMg, etc.) moved to sessionProfile in v24.
  },
  preSubstanceActivity: {
    substanceChecklistSubPhase, completedActivities,
    // Navigation + completion tracking only. Intention artifacts (touchstone,
    // intentionJournalEntryId, focusJournalEntryId) moved to sessionProfile in v24.
  },

  timeline: {
    currentPhase: 'come-up' | 'peak' | 'integration',
    targetDuration, phases: { comeUp, peak, integration }
  },

  modules: {
    items: [/* module instances */],
    currentModuleInstanceId: string | null,
    history: [/* completed/skipped modules */]
  },

  comeUpCheckIn: { responses, currentResponse, hasIndicatedFullyArrived, nextPromptAt, ... },

  booster: {
    considerBooster, status: 'pending' | 'prompted' | 'taken' | 'skipped' | 'snoozed' | 'expired',
    checkInResponses: { experienceQuality, physicalState, trajectory }
  },

  phaseTransitions: {
    activeTransition: 'come-up-to-peak' | 'peak-to-integration' | 'session-closing' | null
  },

  transitionCaptures: {
    peak: { bodySensations, oneWord },
    integration: { editedIntention, newFocus, tailoredActivityResponse },
    closing: { selfGratitude, futureMessage, commitment }
  },

  session: { closedAt, finalDurationSeconds },

  followUp: {
    phaseUnlockTime: null,       // ms timestamp when follow-up modules unlock (8h post-session)
  }
}
```

**Key Actions:**
- `startSession()`, `completeModule()`, `skipModule()`, `abandonModule()`
- `addModule(libraryId, phase, position)` — pre-session timeline editing (handles linked parents)
- `insertAtActive(libraryId)` — runtime module injection (used by Helper Modal). Inserts at position 0 in the current phase (`timeline.currentPhase`, OR `'follow-up'` when `sessionPhase === 'completed'`), resets the previously-active module to upcoming, navigates to the active tab, and precaches audio. Handles linked-parent modules (e.g. protector-dialogue) by creating Part 1 + Part 2 with a shared `linkedGroupId`; Part 2's phase tracks Part 1 (`integration` during active session, `follow-up` after completion).
- `abandonModule(instanceId)` — resets a module to `upcoming` (clears `startedAt`, `completedAt`), marks any journal entries written during the attempt, clears meditation playback, and clears the appropriate active module pointer (`activePreSessionModule` for pre-session, `currentModuleInstanceId` for follow-up). Used by the skip button override in pre-session and follow-up contexts — these phases don't record "skipped" status; the user can simply retry later. Active-session modules continue using `skipModule()` which records the skip and auto-advances.
- `updateSessionProfile(field, value)` — universal user-data writer. Auto-derives `dosageFeedback` when `plannedDosageMg` is written. Replaced the old per-slice writers (`updateIntakeResponse`, `updateSubstanceChecklist`, `setTouchstone`, `setIntentionJournalEntryId`, `setFocusJournalEntryId`) in store v24.
- `beginPeakTransition()`, `transitionToPeak()`, `transitionToIntegration()`
- `recordCheckInResponse()`, `recordIngestionTime()`, `confirmIngestionTime()`
- `setSubstanceChecklistSubPhase()`, `completePreSubstanceActivity()`
- `updateTransitionCapture()`, `updateClosingCapture()`, `completeSession()`

### `sessionProfile` — design rationale

The `sessionProfile` slice is the **single source of truth for every value the user enters during a session**, regardless of which screen captured it. Before v24, this data was scattered across `intake.responses` (the questionnaire), `substanceChecklist` (the dosage + substance answers), and `preSubstanceActivity` (intention artifacts), with cross-slice writes (e.g., `SubstanceChecklist.jsx` Step 4 writing to `intake.responses.emergencyContactDetails`). The slice consolidates all of that.

**Lifecycle.** A session profile is born when a session starts, lives forever inside its parent session (preserved across the archive/restore cycle), and is only destroyed when the parent session is explicitly deleted via `useSessionHistoryStore.deleteSession()`. `resetSession()` only ever runs *after* the prior session has been safely snapshotted into the history store via `archiveAndReset()` or `loadSession()`, so `resetSession` is never a user-data-loss path in normal use.

**Per-session, not global.** Each session has its own profile. Two sessions never share data. Starting a new session never pre-fills any field from a prior session — even emergency contact details. This is intentional: it lets users genuinely change their intention, focus, dosage, or contact between sessions.

**Read sites.** The most-read fields are `holdingQuestion`, `plannedDosageMg`, `emergencyContactDetails`, `primaryFocus`, and `guidanceLevel`. Grep `useSessionStore((s) => s.sessionProfile.*` for the live list of call sites.

**What did NOT move into `sessionProfile`.** The semantic line is *answers vs. event state*: `sessionProfile` holds answers, `substanceChecklist` holds event state. So `ingestionTime`, `hasTakenSubstance`, and `ingestionTimeConfirmed` stay in `substanceChecklist` (they're captured timestamps marking the ingestion *event*, not user answers). Similarly, `intake.{currentSection, currentQuestionIndex, isComplete, showSafetyWarnings, showMedicationWarning}` stay in `intake` because they're navigation/completion flags, not answers. And `preSubstanceActivity.{substanceChecklistSubPhase, completedActivities}` stay in `preSubstanceActivity` because they track screen completion, not user answers.

**Migration.** Store v24 added `sessionProfile` and the v23→v24 migration; v25 added `notes` to `emergencyContactDetails`. The migration runs in two places: the Zustand `persist` middleware on first load after the new bundle ships, and `useSessionHistoryStore.loadSession()` for archived sessions still in an older shape. The function is pure (no `set`/`get` calls) so it's safe to run in either context. No archive data is lost — old archives migrate on demand when the user loads them.

**Adding a new field.** To capture a new piece of user data: (1) add the default to the `sessionProfile` initial state in `useSessionStore.js`, (2) add it to the `resetSession()` payload, (3) add a v(N-1)→vN migration case if the default isn't `null` (otherwise the `??` fallback in `migrateSessionState` handles it), (4) read/write at the call site via `useSessionStore((s) => s.sessionProfile.fieldName)` and `updateSessionProfile('fieldName', value)`. No new actions, no new slices. Auto-archived, auto-migrated, auto-included in the export.

### useHelperStore (Helper Modal trigger bridge)

Minimal unpersisted store (`{ isOpen, openHelper, closeHelper }`) that bridges the trigger button in `Header.jsx` and the modal mount point in `AppShell.jsx` — they live in separate component trees and can't share React state. The modal is conditionally mounted (`{isHelperOpen && <HelperModal />}`), so each open is a fresh mount with no leftover state.

### localStorage Keys

| Key | Store |
|-----|-------|
| `mdma-guide-session-state` | useSessionStore |
| `mdma-guide-app-state` | useAppStore |
| `mdma-guide-journal-state` | useJournalStore |
| `mdma-guide-ai-state` | useAIStore |
| `mdma-guide-session-history` | useSessionHistoryStore |

`useHelperStore` and `useToolsStore` are intentionally **not** persisted — they hold transient UI state only.

---

## Design System

### CSS Variables (`index.css`)

```css
/* Light Mode */
--bg-primary: #F5F5F0;
--text-primary: #3A3A3A;
--accent: #E8A87C;        /* Warm orange */

/* Dark Mode (.dark) */
--bg-primary: #1A1A1A;
--accent: #9D8CD9;        /* Soft purple */
```

### Typography
- **Primary font:** Azeret Mono (monospace) — all body text, uppercase by default
- **Secondary font:** DM Serif Text (serif) — headers/titles, normal case
- **Pattern:** Use CSS variables for colors to enable dark mode

### Accent Button Style

For important, high-visibility UI elements, use the accent-colored button pattern:

```jsx
className="border border-[var(--accent)] bg-[var(--accent-bg)]"
```

**Use sparingly** - this style draws attention and should be reserved for:
- Primary call-to-action buttons (e.g., "Complete intake to begin")
- Currently selected options in choice lists
- Important status indicators

The accent color adapts to light/dark mode (orange in light, purple in dark).

### Circle Spacer

A small stroke-only circle used as a visual separator between content sections:

```jsx
<div className="flex justify-center mb-4">
  <div className="circle-spacer" />
</div>
```

- **Size:** 6px diameter
- **Stroke:** 1.5px, tertiary text color
- **Fill:** None (stroke only)
- **Usage:** Between paragraphs or content blocks to provide subtle visual rhythm
- **Class:** `.circle-spacer` defined in `index.css`

### Custom Animations

Keyframe animations defined in `index.css`:

| Keyframe | Purpose | Easing / duration |
|----------|---------|-------------------|
| `fadeIn` / `fadeOut` | Backdrop overlays for all sheet modals | `0.3s ease-out` |
| `slideUp` | Bottom-sheet modal entrance (`translateY(100%) → 0`) | `0.35s cubic-bezier(0.65, 0, 0.35, 1)` |
| `slideDownOut` | Bottom-sheet modal exit (`translateY(0) → 100%`) | `0.35s cubic-bezier(0.65, 0, 0.35, 1)` |
| `slideDownIn` | Top-anchored modal entrance — used by HelperModal (`translateY(-100%) → 0`) | `0.35s cubic-bezier(0.65, 0, 0.35, 1)` |
| `slideUpOut` | Top-anchored modal exit (`translateY(0) → -100%`) | `0.35s cubic-bezier(0.65, 0, 0.35, 1)` |
| `slideDown` | Small popover drop-in (`translateY(-20px) → 0`) — used by AISettingsPanel | `0.3s ease-out` |
| `slideUpSmall` | Minimized check-in/booster status bar (small 20px nudge with opacity fade) | `0.3s ease-out` |
| `slideInFromRight` / `slideOutToRight` / `slideInFromLeft` / `slideOutToLeft` | Horizontal slides for journal navigation and AI sidebar | `0.3s ease-out forwards` |
| `breath-idle`, `orb-glow` | BreathOrb visualization | varies |

The four full-slide keyframes (`slideUp`, `slideDownOut`, `slideDownIn`, `slideUpOut`) animate **transform only — no opacity**. This is intentional: modal panels should feel like solid physical objects sliding into view, not ghostly UI elements that fade in. The backdrop overlay has its own fade (via `fadeIn` / `fadeOut`) — that's where any "gentle dimming" comes from.

The `cubic-bezier(0.65, 0, 0.35, 1)` curve is a symmetric ease-in-out that accelerates smoothly out of rest, hits peak speed in the middle, and decelerates to a soft stop. Used consistently across all four full-slide keyframes for a unified feel.

### Scroll Reveal System

A scroll-triggered entrance animation system ported from the landing page. Elements start invisible and shifted down 24px, then fade+slide into view as they enter the viewport. Staggered delay classes create a cascading effect within each section.

**CSS classes** (defined in `index.css`):
- `.rv` — base class: `opacity: 0; transform: translateY(24px)` with 0.9s expo-out transition
- `.rv.visible` — revealed state: `opacity: 1; transform: translateY(0)`
- `.rv-d1` through `.rv-d5` — stagger delays in 80ms increments (0.08s–0.40s)

**Hook** (`src/hooks/useScrollReveal.js`): takes a container ref, creates a single `IntersectionObserver` (threshold 0.08, rootMargin `0px 0px -30px 0px`). Hero elements marked with `data-rv-hero` are revealed on mount via double-`requestAnimationFrame`. Non-hero elements are revealed on scroll intersection and immediately unobserved (one-shot). Observer is disconnected on unmount.

**Currently used on**: `ActiveEmptyState.jsx` only (the "Begin Your Journey" page).

**Altered-state UX note**: This system should be used sparingly within the app. It works well on the initial welcome page because the user is guaranteed to be sober and in a normal state. During an active session, scroll-triggered motion animations can be disorienting when the user is in an altered state. The app's in-session design philosophy favors static layouts and minimal motion — content should be present and stable when it appears, not animating into place. Reserve scroll reveal for pre-session contexts where the user is not under the influence.

Respects `prefers-reduced-motion` via the existing global rule that collapses `transition-duration` to `0.01ms`.

### Modal Layout Pattern (Sheet Modals)

All sheet modals (`HelperModal`, `BoosterConsiderationModal`, `ModuleLibraryDrawer`, `ComeUpCheckIn`, `JournalSettings`, the home follow-up modals, `DataDownloadModal`, `PeakPhaseCheckIn`, `ClosingCheckIn`, etc.) follow the same structural template:

```jsx
<div className="fixed inset-0 z-50">                                     {/* outer wrapper, no animation */}
  <div                                                                   {/* backdrop — sibling */}
    className={`absolute inset-0 bg-black/25 ${
      isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
    }`}
    onClick={handleClose}
  />
  <div                                                                   {/* panel — sibling */}
    className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md
      bg-[var(--color-bg)] rounded-t-2xl flex flex-col overflow-hidden ${
        isClosing ? 'animate-slideDownOut' : 'animate-slideUp'
      }`}
    style={{ height: modalHeight }}
  >
    {/* panel content */}
  </div>
</div>
```

**Critical: the backdrop and panel must be SIBLINGS, not parent/child.** CSS opacity is multiplicative across the parent/child tree — if the panel is rendered inside a fading backdrop wrapper, the panel inherits that opacity multiplier and visually fades alongside the backdrop, even if the panel's own slide keyframe doesn't change opacity. Both BoosterModal and HelperModal had this exact bug at one point and were restructured to use sibling layout.

For top-anchored modals (currently only `HelperModal`), invert the positioning: `flex items-start` parent isn't needed — use `absolute top-0 left-1/2 -translate-x-1/2` on the panel, and use `animate-slideDownIn` / `animate-slideUpOut` instead of `slideUp` / `slideDownOut`. The `-100%` translateY is relative to the modal's own height, so the slide always covers the full distance regardless of body height (this is why height transitions between e.g. 75vh ↔ 95vh don't break the slide animation).

**Close handler pattern** — match the animation duration:

```javascript
const [isClosing, setIsClosing] = useState(false);

const handleClose = () => {
  if (isClosing) return;
  setIsClosing(true);
  setTimeout(() => {
    onClose(); // or store action like closeHelper()
  }, 350); // matches the 0.35s slide-out keyframe
};
```

The flag swaps the slide-in class for the slide-out class, the timeout waits for the exit animation to complete, then the parent removes the modal from the DOM. **Always 350ms now** — was previously 300ms before the easing/duration update.

### Animation Components

#### BreathOrb (`capabilities/animations/BreathOrb.jsx`)

A breathing visualization with orbital moon animation:
- **Main orb** scales smoothly with breath phases (inhale expands, exhale contracts)
- **Orbital ring** with moon marker that travels the circumference
- **Center text** shows current phase label + countdown
- **Idle state** uses gentle 4-second pulse animation

Driven by `useBreathController` hook which manages all timing logic.

#### AsciiMoon (`capabilities/animations/AsciiMoon.jsx`)

A looping ASCII art moon animation displayed on the Active tab before session starts:
- **Characters**: Uses 'M', 'D', 'M', 'A' letters for dark areas, punctuation for lit areas
- **Animation**: 10-second cycle - waxing → full → waning → new
- **Rendering**: 50ms frame updates with staggered character changes for organic feel
- **Grid**: 20x20 character grid with eased phase transitions

#### AsciiDiamond (`capabilities/animations/AsciiDiamond.jsx`)

A compact looping ASCII art diamond animation for smaller visual accents:
- **Characters**: Uses 'L', 'O', 'V', 'E' for dense areas, punctuation for lit areas
- **Animation**: 8-second cycle - fills from center outward, empties from center outward
- **Grid**: 7x7 character grid (~1/3 the size of AsciiMoon)
- **Used in**: SubstanceChecklist Step 4, TransitionBuffer, HomeView welcome

#### MorphingShapes (`capabilities/animations/MorphingShapes.jsx`)

Three overlapping shapes (stroke only) that slowly morph with polyrhythmic timing:
- **Shape A**: circle → square → circle (CSS border-radius)
- **Shape B**: square → circle → square (CSS border-radius, opposite phase)
- **Shape C**: center point → full circle → center point (SVG, 2/3 duration ratio)
- **Color**: Always renders in accent color
- **Props**: `size`, `strokeWidth`, `duration`

#### TransitionBuffer (`session/TransitionBuffer.jsx`)

A reusable transition screen for smooth flow between sections:
- **Sequence**: blank (300ms) → fade in (800ms) → hold (2s) → fade out (800ms) → blank (300ms)
- **Content**: AsciiDiamond animation + randomly selected quote with attribution
- **Usage**: Pass `onComplete` callback; component calls it when animation finishes
- **Total duration**: ~4.2 seconds
- **Quotes**: 7 curated quotes (Rogers, Rilke, Krishnamurti, Marcus Aurelius, Saint-Exupery, Pascal)

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Main entry | `src/App.jsx` |
| Session state | `src/stores/useSessionStore.js` |
| Module routing | `src/components/active/moduleRegistry.js` |
| Module definitions | `src/content/modules/library.js` |
| MasterModule orchestrator | `src/components/active/modules/MasterModule/MasterModule.jsx` |
| MasterModule state | `src/components/active/modules/MasterModule/useMasterModuleState.js` |
| MasterModule content files | `src/content/modules/master/` |
| Block renderers | `src/components/active/modules/MasterModule/blockRenderers/` |
| Section renderers | `src/components/active/modules/MasterModule/sectionRenderers/` |
| Condition evaluator | `src/components/active/modules/MasterModule/utils/evaluateCondition.js` |
| Generator registry | `src/components/active/modules/MasterModule/generators/registry.js` |
| Image viewer modal | `src/components/active/capabilities/ImageViewerModal.jsx` |
| Timeline configurations | `src/content/timeline/configurations.js` |
| Breath engine | `src/components/active/hooks/useBreathController.js` |
| Orb animation | `src/components/active/capabilities/animations/BreathOrb.jsx` |
| ASCII moon | `src/components/active/capabilities/animations/AsciiMoon.jsx` |
| ASCII diamond | `src/components/active/capabilities/animations/AsciiDiamond.jsx` |
| Transition buffer | `src/components/session/TransitionBuffer.jsx` |
| Audio playback | `src/hooks/useAudioPlayback.js` |
| Meditation playback | `src/hooks/useMeditationPlayback.js` |
| Meditation content registry | `src/content/meditations/index.js` |
| Design tokens | `src/index.css` |
| Pre-session flow | `src/components/session/PreSessionIntro.jsx` |
| Pre-session activities | `src/components/session/activities/` |
| Substance checklist | `src/components/session/SubstanceChecklist.jsx` |
| Come-up check-in | `src/components/session/ComeUpCheckIn.jsx` |
| Peak transition | `src/components/session/PeakTransition.jsx` |
| Booster check-in | `src/components/session/BoosterConsiderationModal.jsx` |
| Integration transition | `src/components/session/IntegrationTransition.jsx` |
| Closing ritual | `src/components/session/ClosingRitual.jsx` |
| Closing ritual content | `src/components/session/transitions/content/closingRitualContent.js` |
| Data download modal | `src/components/session/DataDownloadModal.jsx` |
| Data export utility | `src/utils/downloadSessionData.js` |
| Follow-up activities | Library modules with `isFollowUpModule: true` in `src/content/modules/library.js` (run via `JournalingModule`) |
| Follow-up module modal | `src/components/home/AltSessionModuleModal.jsx` (shared with pre-session) |
| AI assistant | `src/components/ai/AIAssistantModal.jsx` |
| Helper Modal orchestrator | `src/components/helper/HelperModal.jsx` |
| Helper Modal trigger button | `src/components/helper/HelperButton.jsx` |
| Helper Modal store | `src/stores/useHelperStore.js` |
| Helper categories + decision trees | `src/content/helper/categories.js` |
| Helper resolver utilities (`classifyPhaseWindow`, `ACT`) | `src/content/helper/resolverUtils.js` |
| Helper resolvers (one per active category) | `src/content/helper/resolvers/*.js` |
| Helper journal entry formatter | `src/content/helper/formatLog.js` |
| Triage step runner (decision-tree orchestrator) | `src/components/helper/TriageStepRunner.jsx` |
| Shared emergency contact card | `src/components/helper/EmergencyContactCard.jsx` |
| Dedicated emergency contact view | `src/components/helper/EmergencyContactView.jsx` |
| Session menu (hamburger) | `src/components/layout/SessionMenu.jsx` |
| Session history modal | `src/components/history/SessionHistoryModal.jsx` |
| Session history store | `src/stores/useSessionHistoryStore.js` |
| Values Compass content | `src/content/modules/valuesCompassContent.js` |
| The Cycle content | `src/content/modules/theCycleContent.js` |
| Deep Dive content | `src/content/modules/theDeepDiveReflectionContent.js` |
| Image storage | `src/utils/imageStorage.js` |

---

## Conventions

### Naming
- Views: `*View.jsx` (HomeView, ActiveView)
- Modules: `*Module.jsx` (BreathingModule)
- Hooks: `use*.js` (useBreathController)

### Styling
- Prefer Tailwind utilities over custom CSS
- Use CSS variables for colors (enables dark mode)
- Animations defined in `index.css` with `@keyframes`

---

## Data Export

Session data can be downloaded in three places:
1. **Closing Ritual** (Step 6: "Before You Go") — via `DataDownloadModal`
2. **Settings tool** (Tools tab) — via download buttons with confirmation
3. **Hamburger menu** → "Export Session" — via `DataDownloadModal`

### Formats

- **Text (.txt)**: Human-readable session record with divider-separated sections
- **Images (.png)**: Session-created images (e.g. Values Compass) downloaded as separate PNG files

### Data Included

| Section | Source |
|---------|--------|
| Session metadata | Timestamps, duration, dosage, booster status |
| Intention & touchstone | Intake + pre-session intro |
| Peak transition captures | One-word, body sensations |
| Integration transition captures | Edited intention, focus changes, tailored activity |
| Closing reflections | Self-gratitude, future message, commitment |
| Come-up check-in responses | Timestamped feeling responses |
| Booster check-in responses | Experience quality, physical state, trajectory |
| Module completion history | All completed/skipped activities with timestamps |
| Follow-up reflections | Check-in, revisit, integration (if completed) |
| All journal entries | Both session-created and personal/manual entries |

Follow-up data is included only if those modules have been completed. Downloads during the closing ritual will gracefully omit follow-up sections since they unlock 24-48 hours later.

### Implementation

`src/utils/downloadSessionData.js` reads directly from Zustand stores via `getState()` (no React hooks needed) and generates the export at download time.

---

## Session History

Sessions can be archived and restored via the hamburger menu in the header.

### How It Works
- **Archive**: "New Session" saves the current session state + journal entries to `useSessionHistoryStore`, then resets both stores
- **Restore**: "Past Sessions" opens an accordion panel where users can browse archived sessions and load them back (current session is auto-archived first)
- **Storage**: All archived sessions are stored in localStorage under `mdma-guide-session-history`

### Hamburger Menu (`SessionMenu`)

Entry point for session lifecycle actions: dark/light toggle, New Session (archive current → reset), Past Sessions (accordion UI for browsing/loading archives), Export Session (opens `DataDownloadModal`).

### Known Limitation
Journal images stored in IndexedDB are not included in archives. Users should download images before archiving a session.

---

## Architecture Decisions

1. **Views kept mounted after first visit** (hidden with CSS, not unmounted)
   - Why: Meditation timers must survive tab switches
   - Home and Active are eagerly loaded on app launch; Journal and Tools are lazy-loaded on first tab visit via `React.lazy` + `Suspense`
   - HomeView was evaluated for lazy-loading but only saved ~4 KB gzipped from the initial bundle (most of its imports are shared with other eagerly-loaded code), while adding ~64 KB of duplicated code across chunk boundaries — not worth the trade-off

2. **Phase transitions as components** (PeakTransition, IntegrationTransition, ClosingRitual)
   - Why: Supportive, personalized experience between phases with user captures

3. **Capability system for modules**
   - Why: Extensible architecture where new modules can be added via config alone (custom components used when richer interaction is needed)

4. **Registry pattern for module routing**
   - Why: Clean separation between module types and components

5. **Audio-text sync with audio leading**
   - Why: More natural experience; text confirms what user hears

6. **Time-locked follow-up modules**
   - Why: Integration benefits from distance; 24-48h delay encourages reflection

7. **Local-only data with export**
   - Why: Privacy-first; no accounts or cloud sync; user owns their data via download

8. **Sheet modals use sibling backdrop+panel layout, not parent/child**
   - Why: CSS opacity is multiplicative, so a panel inside a fading backdrop wrapper inherits the fade. Slide keyframes animate transform only; the backdrop fades independently. See *Design System → Modal Layout Pattern* for the full pattern and close-handler timing.

9. **Helper Modal trigger lives in Header, modal mounts in AppShell, bridged by `useHelperStore`**
   - Why: The button and the modal live in different component trees (Header is a Header child, the modal mounts at AppShell level so its `fixed` positioning and z-index don't get scoped under any particular tab view). They can't share local React state, so we use a tiny dedicated Zustand store as the bridge. This mirrors how the AI assistant uses `useAIStore.isModalOpen` for the same trigger-in-header / modal-elsewhere pattern. The helper modal is conditionally mounted (`{isHelperOpen && <HelperModal />}`) so each open is a fresh component mount with fresh state — no leftover-state bugs.

10. **Phase 3 terminology: "Synthesis" (UI) / `integration` (code)**

   In the MDMA therapy community, "integration" universally refers to the post-session therapeutic work — the non-drug sessions, journaling, and reflection that happen in the days and weeks *after* an experience. Our app originally used "Integration" for the third within-session phase (come-up → peak → integration), which created a terminology collision: users familiar with the clinical literature would see "Integration Phase" and think of post-session work, not the in-session wind-down.

   The phase was renamed to **"Synthesis"** in all user-facing content. The term captures what defines this phase: emotional openness from the peak is still present, but cognitive clarity is returning — the meeting of those two things is what makes the therapeutic work possible.

   **Internal code still uses `integration` everywhere.** Zustand persists session state to localStorage, so any user with an existing or archived session has `currentPhase: 'integration'` on their device. Renaming the internal key would break those sessions. The display-only approach avoids this entirely.

   **Practical guidance for developers:**

   | Context | Term to use | Examples |
   |---------|------------|---------|
   | User-facing strings (UI text, button labels, status bar, FAQ, export labels, journal headers) | **Synthesis** or **Synthesis Phase** | "Continue to Synthesis Phase", "PHASE 3 — SYNTHESIS", "Enter Synthesis Phase" |
   | Internal code (state keys, function names, variable names, filenames, component names, phase values in module configs) | **`integration`** | `currentPhase: 'integration'`, `transitionToIntegration()`, `IntegrationTransition.jsx`, `allowedPhases: ['peak', 'integration']` |
   | Post-session follow-up work (closing ritual encouragement, follow-up modules, FAQ about the general concept) | **Integration** (the community term) | "Integration Takes Time", "Integration Reflection", "What's integration and why does it matter?" |

   **Where the boundary lives:** Every file that maps an internal `'integration'` key to a display string has a lookup object or switch statement (e.g., `PHASE_NAMES`, `PHASE_CONFIG`, `getPhaseName()`). The key stays `'integration'`; the value says `'Synthesis'`. If you add a new place that displays the phase name, follow this same pattern.

---

## Timer Strategy

### PWA Limitation Context

PWAs cannot reliably fire notifications or alarms when backgrounded or screen-locked. JavaScript execution is suspended, `setTimeout`/`setInterval` don't fire, and there is no Web Alarm API. This is a platform limitation, not a solvable code problem.

### Two-Layer Approach

#### Layer 1: Native Alarm Prompt (Primary)

For timed modules (music breaks, extended meditations), prompt users to set a backup alarm using their phone's native clock app before beginning:

> "Set an alarm for 20 minutes, then return here to begin."

```
[ Open Clock App ]      [ I've Set My Alarm ]
```

Deep links (best-effort, not universally supported):
- **iOS**: `clock-alarm://` — opens Clock app
- **Android**: Intent varies by device; fallback to instruction text

#### Layer 2: Internal Timestamp Timer (Secondary)

Track elapsed time using `Date.now()` comparisons, not intervals:

```javascript
const startTime = Date.now();
const duration = 20 * 60 * 1000;

// On visibility change or user return:
const elapsed = Date.now() - startTime;
const remaining = Math.max(0, duration - elapsed);
const isComplete = elapsed >= duration;
```

This allows graceful reconciliation when the user returns—whether early, on time, or late.

**Graceful Completion States:**
- **Early return**: Show remaining time, option to continue waiting or proceed
- **On-time return**: "Your rest is complete. Continue when ready."
- **Late return**: "Welcome back. Take your time—continue when ready."

### Wake Lock Usage

Use the Screen Wake Lock API only for modules requiring continuous visual attention:

| Module Type | Wake Lock | Rationale |
|-------------|-----------|-----------|
| Breathing exercises | Yes | User follows visual animation |
| Audio meditations | Yes | Keeps audio session alive |
| Music/rest breaks | No | User is away from screen |
| Journaling | No | User interaction keeps screen awake |

```javascript
// Request wake lock for visual modules
const wakeLock = await navigator.wakeLock.request('screen');

// Release when module completes
wakeLock.release();
```

### Philosophy Alignment

This approach aligns with the app's non-directive philosophy. Rigid timing isn't essential—the app guides rather than dictates. Users are trusted to manage their own experience, with the app providing supportive structure that adapts to however they return.

---

## Bundle Size

The production build uses Vite's default 500 KB chunk size warning threshold. The main `index` chunk sits around ~700 KB minified (~197 KB gzipped) as of April 2026. This is above the threshold but acceptable for a PWA — the service worker caches all chunks after first load, so repeat visits are instant.

**What's in the main chunk:** Session store (~3,600 LOC), HomeView, IntakeFlow, TimelineEditor, all shared components/icons/utilities, and third-party deps (React, Zustand). These are all interconnected via shared imports and don't split cleanly.

**What's lazy-loaded:**
- ActiveView, JournalView, ToolsView (tab-level code splitting via `React.lazy`)
- HelperModal (entire helper subsystem: 17 components, 8 resolvers, 3 content files)
- All 25+ session modules (via `moduleRegistry.js`)

**Guidelines for keeping the bundle in check:**
- New self-contained features (modals, overlays, drawers) that are user-initiated should use `React.lazy` — the HelperModal pattern in `AppShell.jsx` is the template
- New session modules get lazy-loading for free via the module registry
- Before lazy-loading a component, verify its imports are mostly unique to it — shared dependencies stay in the common chunk regardless, and excessive splitting can *increase* total payload through duplication
- Run `npm run build` and check the chunk sizes when adding substantial new code

---

## Current Limitations

- PWA offline mode not fully tested
- No user accounts or cloud sync
- Journal images (IndexedDB blobs) are not preserved when archiving sessions

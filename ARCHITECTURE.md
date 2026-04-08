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
│   ├── followup/                  # Follow-up modules (8h+ post-session, phase-level lock)
│   │   ├── FollowUpCheckIn.jsx    # How-are-you check-in
│   │   ├── FollowUpRevisit.jsx    # Revisit session writings
│   │   ├── FollowUpIntegration.jsx # Integration reflection
│   │   ├── FollowUpValuesCompass.jsx # Revisit values compass (conditional)
│   │   └── content/              # Follow-up step content
│   ├── ai/                        # AI Assistant components
│   │   ├── AIAssistantModal.jsx   # Main chat interface
│   │   ├── AIAssistantTab.jsx     # AI tab view
│   │   ├── AISettingsPanel.jsx    # Provider/model configuration
│   │   ├── ChatWindow.jsx
│   │   ├── ChatInput.jsx
│   │   ├── ChatMessage.jsx
│   │   └── ChatSidebar.jsx
│   ├── helper/                    # "What's happening?" support modal (heart icon in header)
│   │   ├── HelperModal.jsx        # Top-anchored sheet modal — multi-step rating/result flow
│   │   ├── HelperButton.jsx       # Heart icon trigger rendered inside Header
│   │   ├── HelperTopBar.jsx       # Back / title / close header bar
│   │   ├── CategoryGrid.jsx       # 2-column category card grid (initial step)
│   │   ├── CategoryHeader.jsx     # Wide category card shown above the rating scale
│   │   ├── RatingScale.jsx        # 0–10 bubble scale
│   │   ├── ActivitySuggestions.jsx # Activity result block (reuses timeline ModuleCard)
│   │   ├── EmergencyFlow.jsx      # Emergency contact / 911 / 112 / Fireside Project block
│   │   ├── AcknowledgeClose.jsx   # Acknowledge text shown when rating is 0
│   │   └── PreSessionContent.jsx  # Pre-session informational text
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
│   │   ├── categories.js          # 6 active + 2 follow-up categories with routing/copy
│   │   └── formatLog.js           # Journal entry formatter for helper interactions
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
- `SimpleGroundingModule` — Fixed-duration grounding meditation with audio prompts
- `SimpleGroundingModule` (reused) — Short 5-min grounding variant for come-up phase

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
| `screens` | Step-through screen sequence | `screens[], hideTimer?, rightSlotViewer?, ritualFade?` |
| `meditation` | Audio-synced meditation via `useMeditationPlayback` | `meditationId, animation?, showTranscript?, composerOptions?` |
| `timer` | Countdown timer for music/dance/rest | `animation?, showAlarm?, recommendations?, allowAddTime?` |
| `generate` | PNG generation with RevealOverlay | `generatorId, buttonLabel, saveToJournal?, imageName?` |

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

#### Sequential Advance & Visited Section Skipping

When advancing sequentially (no bookmark to pop), `advanceSection` automatically skips sections that have already been visited. This prevents replaying sections when routing creates non-linear paths.

For example: checkpoint at index 2 routes to index 5 (with bookmark at index 4). After completing index 5, the bookmark returns the user to index 4. After completing index 4, sequential advance checks index 5 — already visited — skips to index 6.

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

**Compound conditions (AND / OR):**

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

// Nested — heavy AND (chest OR shoulders)
{ condition: { and: [
  { key: 'mood', equals: 'heavy' },
  { or: [
    { key: 'bodyArea', equals: 'chest' },
    { key: 'bodyArea', equals: 'shoulders' },
  ] },
] } }
```

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

Journal entries are built by `journalAssembler.js` on module completion. Two-layer filtering determines which prompts are included:

1. **Section visited?** — Each block carries a `sectionId`. If the section was never visited (due to routing), all its prompts are excluded.
2. **Condition passed?** — If a prompt has a `condition` field and it fails, the prompt is excluded.

Prompts that pass both filters are always included in the journal, even if the user left them blank. Empty prompts are saved as `[no entry — 3:45 PM]` with a wall-clock timestamp, supporting users who journal physically and need to cross-reference.

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
| `generatedImages` | `{ generatorId: { blob, url } }` | Generated PNGs |

Each block in the system also carries a `sectionId` tag linking it to its parent section, enabling the two-layer journal filtering described above.

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
    MeditationSection.jsx       # Audio-synced meditation (variable duration + variations)
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

**Step 3: Create the component** in `src/components/active/modules/MyMeditationModule.jsx`:

```javascript
import { useState, useMemo } from 'react';
import { getModuleById } from '../../../content/modules';
import {
  getMeditationById,
  calculateSilenceMultiplier,
  generateTimedSequence,
} from '../../../content/meditations';
import { useMeditationPlayback } from '../../../hooks/useMeditationPlayback';
import ModuleLayout, { CompletionScreen, IdleScreen } from '../capabilities/ModuleLayout';
import ModuleControlBar, { VolumeButton, SlotButton } from '../capabilities/ModuleControlBar';
import TranscriptModal, { TranscriptIcon } from '../capabilities/TranscriptModal';
import DurationPicker from '../../shared/DurationPicker';

export default function MyMeditationModule({ module, onComplete, onSkip, onProgressUpdate }) {
  const libraryModule = getModuleById(module.libraryId);
  const meditation = getMeditationById('my-meditation');

  const [selectedDuration, setSelectedDuration] = useState(
    module.duration || libraryModule?.defaultDuration || 10
  );
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  // Build timed sequence — this is the only part unique to each meditation
  const [timedSequence, totalDuration] = useMemo(() => {
    if (!meditation) return [[], 0];
    const durationSeconds = selectedDuration * 60;
    const silenceMultiplier = calculateSilenceMultiplier(meditation.prompts, durationSeconds);
    const sequence = generateTimedSequence(meditation.prompts, silenceMultiplier, {
      speakingRate: meditation.speakingRate || 150,
      audioConfig: meditation.audio,
    });
    const total = sequence.length > 0 ? sequence[sequence.length - 1].endTime : durationSeconds;
    return [sequence, total];
  }, [meditation, selectedDuration]);

  // Shared hook handles timer, audio-text sync, prompt progression, etc.
  const playback = useMeditationPlayback({
    meditationId: 'my-meditation',
    moduleInstanceId: module.instanceId,
    timedSequence,
    totalDuration,
    onComplete,
    onSkip,
    onProgressUpdate,
  });

  if (!meditation) {
    return (
      <>
        <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
          <p className="uppercase tracking-wider text-xs text-[var(--color-text-secondary)] text-center">
            Meditation content not found.
          </p>
        </ModuleLayout>
        <ModuleControlBar
          phase="completed"
          primary={{ label: 'Continue', onClick: onComplete }}
          showSkip={false}
        />
      </>
    );
  }

  return (
    <>
      <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
        {!playback.hasStarted && (
          <div className="text-center animate-fadeIn">
            <IdleScreen title={meditation.title} description={meditation.description} />
            <button
              onClick={() => setShowDurationPicker(true)}
              className="mt-6 px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)]
                hover:border-[var(--color-text-tertiary)] transition-colors"
            >
              <span className="text-2xl font-light">{selectedDuration}</span>
              <span className="text-sm ml-1">min</span>
            </button>
          </div>
        )}
        {playback.hasStarted && !playback.isComplete && (
          <div className="text-center px-4">
            {!playback.isPlaying && (
              <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider mb-4 animate-pulse">
                Paused
              </p>
            )}
            <p className={`text-[var(--color-text-secondary)] text-sm leading-relaxed transition-opacity duration-300 ${
              playback.promptPhase === 'visible' || playback.promptPhase === 'fading-in' ? 'opacity-100' : 'opacity-0'
            }`}>
              {playback.currentPrompt?.text || ''}
            </p>
          </div>
        )}
        {playback.isComplete && <CompletionScreen />}
      </ModuleLayout>
      <ModuleControlBar
        phase={playback.getPhase()}
        primary={playback.getPrimaryButton()}
        showSkip={!playback.isComplete}
        onSkip={playback.handleSkip}
        skipConfirmMessage="Skip this meditation?"
        showSeekControls={playback.hasStarted && !playback.isComplete && !playback.isLoading}
        onSeekBack={() => playback.handleSeekRelative(-10)}
        onSeekForward={() => playback.handleSeekRelative(10)}
        leftSlot={
          playback.hasStarted && !playback.isComplete ? (
            <VolumeButton volume={playback.audio.volume} onVolumeChange={playback.audio.setVolume} />
          ) : null
        }
        rightSlot={
          playback.hasStarted && !playback.isComplete ? (
            <SlotButton icon={<TranscriptIcon />} label="View transcript" onClick={() => {}} />
          ) : null
        }
      />
      <DurationPicker
        isOpen={showDurationPicker}
        onClose={() => setShowDurationPicker(false)}
        onSelect={setSelectedDuration}
        currentDuration={selectedDuration}
        durationSteps={meditation.durationSteps}
        minDuration={meditation.minDuration / 60}
        maxDuration={meditation.maxDuration / 60}
      />
    </>
  );
}
```

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

All modules with variable duration should use the shared `useSyncedDuration` hook for two-way sync between the module's UI and the session store:

```javascript
import useSyncedDuration from '../../../hooks/useSyncedDuration';

const duration = useSyncedDuration(module, { hasStarted });
// duration.selected       — current duration in minutes
// duration.setSelected    — set duration (syncs to store)
// duration.showPicker     — boolean for picker visibility
// duration.setShowPicker  — toggle picker
// duration.handleChange   — change handler (local + store)
```

This ensures duration changes from the timeline card modal are reflected in the module's idle screen and vice versa.

### Intensity Rating

Modules use a numeric 1–5 intensity scale (not string labels). Set via the `intensity` field on each module definition:

```javascript
{ id: 'my-module', intensity: 3, ... }  // 1=low, 3=moderate, 5=high
```

Displayed in the module detail modal as filled/unfilled dots.

### Follow-Up Phase Lock

The follow-up phase uses a single 8-hour phase-level time lock (`followUp.phaseUnlockTime`) rather than per-module locks. All follow-up activities become available simultaneously once the phase unlocks. The lock is checked in:
- `ActiveView.jsx` — follow-up landing page shows countdown when locked
- `FollowUpModuleModal.jsx` / `AltSessionModuleModal.jsx` — Begin button disabled with countdown when locked

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
- `unvisitedRemaining` = sections not yet visited and not the current one
- `screenFraction` = position within the current `screens` section (reported by `ScreensSection` via `onScreenChange` callback)

**Why cumulative, not index-based:** Routing can visit sections out of array order (e.g., index 2 → 5 → 4 → 6). Using `currentSectionIndex / totalSections` would give "free" credit for skipped sections. The cumulative approach counts only what the user actually completed, and shrinks the denominator when sections become unreachable.

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
1. Reads `responses.primaryFocus` (fallback: `'open'`) and `responses.guidanceLevel` (fallback: `'full'`)
2. Looks up the matching configuration from `TIMELINE_CONFIGS`
3. Builds module instances from the config (assigns `instanceId`, `order`, `phase`, library content)
4. Resolves linked module groups (e.g., `'protector'` → shared `linkedGroupId`)
5. Inserts booster check-in as post-processing (after first peak module, if applicable)
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
| `audio` | object | `{ basePath: '/audio/meditations/<name>/', format: 'mp3' }` |
| `minDuration` | number | Minimum duration in seconds (for variable-duration meditations) |
| `maxDuration` | number | Maximum duration in seconds |
| `durationSteps` | array | Available duration steps in minutes (e.g. `[10, 15, 20, 25, 30]`) |

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

**Parameters:**
```javascript
useMeditationPlayback({
  meditationId,       // 'open-awareness' | 'body-scan' | 'self-compassion'
  moduleInstanceId,   // module.instanceId
  timedSequence,      // pre-computed by component's useMemo
  totalDuration,      // total duration in seconds
  onComplete,         // callback when user clicks Continue after completion
  onSkip,             // callback when user confirms skip
  onProgressUpdate,      // optional callback for ModuleStatusBar
})
```

**Returns:**
```javascript
{
  hasStarted, isPlaying, isComplete,    // state booleans
  elapsedTime, currentPrompt,           // playback position
  promptPhase,                          // 'hidden' | 'fading-in' | 'visible' | 'fading-out'
  audio,                                // useAudioPlayback instance (volume, setVolume, toggleMute)
  handleStart, handlePauseResume,       // control handlers
  handleComplete, handleSkip,
  handleRestart, handleSeekRelative,    // restart from beginning, seek ±N seconds
  getPhase, getPrimaryButton,           // UI helpers
}
```

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
| Theo Silk | `UmQN7jS1Ee8B1czsUtQh` | stability 0.75, similarity 0.70, speed 0.69, speaker_boost on |

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

## Helper Modal

The Helper Modal is the "What's happening?" support overlay accessed via a heart-icon button in the header. It provides phase-aware emotional support content during a session: a category grid → 0–10 rating scale → inline result content (acknowledge / activity suggestions / emergency contacts) that cross-fades based on the rating.

### Activation & Phase Gating

- Trigger: `HelperButton` (heart icon, accent color) lives in `Header.jsx` between the AI tab and the hamburger menu.
- Visibility gate: button only renders when `sessionPhase` is `'pre-session'`, `'active'`, or `'completed'`.
- Open mechanism: button calls `useHelperStore.openHelper()`. AppShell conditionally mounts `<HelperModal />` based on `isOpen`, mirroring the BoosterModal/ModuleLibraryDrawer pattern.
- Close mechanism: `handleClose` sets a local `isClosing` flag (triggers exit animation), then `setTimeout(closeHelper, 350)` unmounts the modal after the slide-out completes.

### Multi-Step Flow

The modal manages a small step machine via local React state:

| Step | Content |
|------|---------|
| `'initial'` | Category grid (6 active or 2 follow-up categories from `helperCategories`) |
| `'category'` | `CategoryHeader` + prompt + `RatingScale` + inline result block |

After the user selects a rating, `displayedRating` drives an inline cross-fade between three result components: `AcknowledgeClose` (rating 0), `ActivitySuggestions` (1–8, with the `max-activity` or `gentle-activity` set selected based on the rating's routing range), or `EmergencyFlow` (9–10). The modal does NOT navigate to a new step — all results render inline beneath the rating scale on the same `'category'` page so the user can rapidly tap different ratings and watch the suggestions cross-fade. Only the modal's body height transitions (75vh ↔ 95vh via the `isExpanded` flag) when a rating is first selected.

### Activity Card Reuse

`ActivitySuggestions` reuses the timeline `ModuleCard` component for visual consistency with the home timeline. It constructs synthetic module instances (`{ instanceId: 'helper-...', libraryId, title, duration, status: 'upcoming' }`) and passes them to `ModuleCard` with `isActiveSession={false}` and `canRemove={false}`. A scoped `<style>` block in `ActivitySuggestions.jsx` applies tighter padding to `.helper-activity-card > div > div` so the card is shorter inside the helper modal context — without modifying `ModuleCard` itself.

### Emergency Flow

`EmergencyFlow` reads `intake.responses.emergencyContactDetails` (a `{ name, phone }` object captured during intake's `contact-input` question). It renders three compact cards inline:

1. Emergency contact card (named `tel:` link if details exist, generic prompt if not)
2. Emergency services row (911 / 112 buttons)
3. Fireside Project card (psychedelic peer support — call or text)

Reassurance copy is intentionally agnostic ("If something feels serious right now, trust that. The options below are here for you — pick whichever feels most useful.") so the modal doesn't presume the user's experience.

### Inserting Activities Mid-Session

When a user taps an activity card from `ActivitySuggestions`, the helper modal calls `useSessionStore.insertAtActive(libraryId)`. This action:

1. Creates a new module instance at `order: 0` in the current phase
2. Resets the previously-active module's status from `'active'` back to `'upcoming'` and clears its `startedAt`
3. Sets `inOpenSpace: false` so `ActiveView`'s auto-start logic picks up the new module
4. Navigates to the active tab via `useAppStore.getState().setCurrentTab('active')`
5. Calls `precacheAudioForModule(libraryId)` (non-blocking)

The action also handles linked parent modules (e.g. `protector-dialogue`) by creating both Part 1 and Part 2 with a shared `linkedGroupId`, identical to the existing `addModule` linked-creation logic.

### Journal Logging

Each helper modal interaction creates a journal entry on category selection (via `useJournalStore.addEntry({ source: 'session', moduleTitle: 'Helper Modal' })`). The entry is updated in place as the user picks a rating, then again if they select an activity. The format is plain text built by `formatHelperModalLog()` in `src/content/helper/formatLog.js`.

### Categories & Routing

`src/content/helper/categories.js` defines the full category set. Each category object has:

| Field | Description |
|-------|-------------|
| `id` | React key + journal log identifier |
| `phase` | `'active'` (6 categories) or `'follow-up'` (2 stub categories) |
| `icon` | Icon component name from `Icons.jsx` |
| `label`, `description` | Card display text |
| `prompt` | Rating prompt question |
| `routing.ranges` | Array of `{ min, max, route }` mapping rating values to result types |
| `acknowledgeText` | Rating-0 result content |
| `maxActivityIntro`, `gentleActivityIntro` | Intro text above suggestion lists |
| `maxActivitySuggestions`, `gentleActivitySuggestions` | Arrays of `{ id, label, description }` referencing `library.js` IDs |

The `getRouteForRating(category, rating)` helper resolves a rating value to one of `'acknowledge-close' | 'max-activity' | 'gentle-activity' | 'emergency'` by walking the `routing.ranges` array.

### File Layout

```
src/components/helper/
  HelperModal.jsx           # Multi-step orchestrator
  HelperButton.jsx          # Heart trigger in Header
  HelperTopBar.jsx          # Back / "What's happening?" / close header bar
  CategoryGrid.jsx          # 2-column grid (initial step)
  CategoryHeader.jsx        # Wide category card shown above the rating scale
  RatingScale.jsx           # 0–10 bubble scale (matches LifeGraph milestone rating)
  ActivitySuggestions.jsx   # Activity result block (reuses ModuleCard)
  EmergencyFlow.jsx         # Emergency contacts (rating 9–10 result)
  AcknowledgeClose.jsx      # Acknowledgment (rating 0 result)
  PreSessionContent.jsx     # Static informational text for pre-session phase

src/content/helper/
  categories.js             # Category configs + getRouteForRating helper
  formatLog.js              # formatHelperModalLog (journal entry serializer)

src/stores/useHelperStore.js  # isOpen / openHelper / closeHelper
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
    responses: {
      // ... all questionnaire responses ...
      emergencyContactDetails: { name, phone }, // structured contact for Helper Modal emergency flow
    },
  },
  substanceChecklist: { plannedDosageMg, ingestionTime, ... },
  preSubstanceActivity: { touchstone, completedActivities, ... },

  timeline: {
    currentPhase: 'come-up' | 'peak' | 'integration',
    targetDuration, phases: { comeUp, peak, integration }
  },

  modules: {
    items: [/* module instances */],
    currentModuleInstanceId: string | null,
    history: [/* completed/skipped modules */]
  },

  comeUpCheckIn: { responses, currentResponse, hasIndicatedFullyArrived, ... },

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
    unlockTimes: { checkIn, revisit, integration },
    modules: {
      checkIn: { status, feeling, note },
      revisit: { status, reflection },
      integration: { status, emerged, commitmentStatus, commitmentResponse }
    }
  }
}
```

**Key Actions:**
- `startSession()`, `completeModule()`, `skipModule()`
- `addModule(libraryId, phase, position)` — pre-session timeline editing (handles linked parents)
- `insertAtActive(libraryId)` — runtime mid-session module injection (used by Helper Modal); inserts at position 0 in the current phase, resets the previously-active module to upcoming, navigates to the active tab, and precaches audio
- `beginPeakTransition()`, `transitionToPeak()`, `transitionToIntegration()`
- `recordCheckInResponse()`, `recordIngestionTime()`, `confirmIngestionTime()`
- `setSubstanceChecklistSubPhase()`, `completePreSubstanceActivity()`
- `updateTransitionCapture()`, `updateClosingCapture()`, `completeSession()`
- `completeFollowUpModule()`, `updateFollowUpModule()`

### useHelperStore (Helper Modal trigger bridge)

A minimal Zustand store with no persistence — exists solely to bridge the trigger button (`HelperButton` in `Header.jsx`) and the modal mount point (`AppShell.jsx`), since they live in different component trees.

```javascript
{
  isOpen: false,
  openHelper: () => set({ isOpen: true }),
  closeHelper: () => set({ isOpen: false }),
}
```

The modal is conditionally mounted in `AppShell` via `{isHelperOpen && <HelperModal />}`, so each open is a fresh component mount with fresh `useState` initial values. State does not persist across sessions or reloads.

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
| Follow-up: Check-in | `src/components/followup/FollowUpCheckIn.jsx` |
| Follow-up: Revisit | `src/components/followup/FollowUpRevisit.jsx` |
| Follow-up: Integration | `src/components/followup/FollowUpIntegration.jsx` |
| Follow-up: Values Compass | `src/components/followup/FollowUpValuesCompass.jsx` |
| AI assistant | `src/components/ai/AIAssistantModal.jsx` |
| Helper Modal orchestrator | `src/components/helper/HelperModal.jsx` |
| Helper Modal trigger button | `src/components/helper/HelperButton.jsx` |
| Helper Modal store | `src/stores/useHelperStore.js` |
| Helper categories + routing | `src/content/helper/categories.js` |
| Helper journal entry formatter | `src/content/helper/formatLog.js` |
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

### State Updates
- Always use Zustand actions, never mutate directly
- Use `set()` for updates, `get()` to read current state in actions

### Styling
- Prefer Tailwind utilities over custom CSS
- Use CSS variables for colors (enables dark mode)
- Animations defined in `index.css` with `@keyframes`

### Error Handling
- Use optional chaining (`?.`) extensively
- Provide fallbacks for missing data

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
The header hamburger menu provides four functions:
1. **Dark/Light mode toggle** — pill-shaped switch with accent colors
2. **New Session** — archive current session and start fresh
3. **Past Sessions** — browse and load archived sessions (accordion UI)
4. **Export Session** — download current session data (text/JSON)

### Known Limitation
Journal images stored in IndexedDB are not included in archives. Users should download images before archiving a session.

---

## Architecture Decisions

1. **All views kept mounted** (hidden with CSS, not unmounted)
   - Why: Meditation timers must survive tab switches

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
   - Why: CSS opacity is multiplicative across the parent/child tree. If the panel is rendered inside a fading backdrop wrapper, the panel inherits the parent's opacity multiplier and visually fades alongside the backdrop — even if the panel's own slide keyframe doesn't change opacity. Both BoosterModal and HelperModal had this exact bug at one point. The fix is a non-animating outer `<div className="fixed inset-0 z-50">` with backdrop and panel as absolute-positioned siblings inside.
   - The slide keyframes (`slideUp`, `slideDownOut`, `slideDownIn`, `slideUpOut`) animate transform only (no opacity) so panels feel like solid physical objects, not ghostly UI overlays. The backdrop fades on its own via the separate `fadeIn` / `fadeOut` keyframes. See "Modal Layout Pattern" in the Design System section.

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

## Current Limitations

- PWA offline mode not fully tested
- No user accounts or cloud sync
- Journal images (IndexedDB blobs) are not preserved when archiving sessions

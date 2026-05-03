# TransitionModule Architecture

TransitionModule is a parallel system to MasterModule designed for **session transitions** — the ceremonial arcs between phases (Opening Ritual, Peak Transition, Peak → Integration, Closing Ritual). It shares MasterModule's section/screen/block model and renderers but diverges on two axes: persistence (transitions span real wall-clock time and must survive app closes) and lifecycle (transitions never have an idle page — the user is already committed when it starts).

## Shared with MasterModule

TransitionModule reuses the same section types (`screens`, `meditation`), the same block types, the same routing model (`to:`, `bookmark: true | 'section-id'`), the same skip-visited semantics, the same history-based back navigation, the same `terminal: true` and `persistBlocks` flags, and the same `ScreensSection` / `MeditationSection` renderers. Content authors learn one model for both systems.

## Key Differences from MasterModule

| Concern | MasterModule | TransitionModule |
|---|---|---|
| Starts at | `modulePhase: 'idle'` (user taps Begin) | `modulePhase: 'active'` (no idle screen) |
| State storage | All `useState` — local only | Mirrored to `sessionStore.transitionData.activeNavigation` on every change |
| Close + reopen | Starts over from the idle page | Resumes at exact section + screen + responses |
| `sectionHistory` | Plain `useState` | Persisted in `activeNavigation` — Back works on resume |
| Journal save | `addEntry` with `sessionId` | `addEntry` without `sessionId` + writes `transitionData.completedAt.<id>` |
| Cross-store field mirroring | None | Prompts with `storeField: 'sessionProfile.x'` flow to that path on every advance |
| Custom block registry | Empty by default | Populated with transition-specific blocks (see below) |

## Persistence Model

Every navigation change writes the full `activeNavigation` blob to `sessionStore.transitionData`:

```javascript
activeNavigation: {
  transitionId,          // which transition owns this blob
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

The session store persists to localStorage via Zustand's `persist` middleware. On mount, `useTransitionModuleState` checks whether `persistedNav.transitionId === transitionId` and initializes from the persisted blob if so.

Selectors and choices write to the store immediately. Prompt responses stay local while typing and flush on blur / section advance / transition completion — the "hybrid sync strategy" that avoids per-keystroke localStorage thrash.

## Cross-Store Field Mirroring (`storeField`)

A prompt block can declare `storeField: 'sessionProfile.holdingQuestion'` to have its value mirrored to a separate store path on every advance. This is how the Opening Ritual's intention prompt populates `sessionProfile.holdingQuestion` without custom state logic.

Supported prefixes: `sessionProfile.*` (routes to `updateSessionProfile`) and `transitionData.*` (routes to `updateTransitionData`).

## Custom Block Registry

TransitionModule's registry is populated with transition-specific blocks that interact with session-wide state:

| Block type | Purpose |
|---|---|
| `body-check-in` | 10-sensation grid; writes to `transitionData.somaticCheckIns.<phase>`. Supports `mode: 'select'` and `mode: 'comparison'` (read-only stacked-opacity grid) |
| `ingestion-time` | Self-contained substance intake flow: pristine → recorded → confirming → confirmed. Gates Continue via `reportReady`. Reads/writes `substanceChecklist.ingestionTime` and `ingestionTimeConfirmed` |
| `editable-dose` | Inline-editable `sessionProfile.plannedDosageMg`. If dose changes after ingestion recorded, calls `resetSubstanceIntake` |
| `action` | Generic store-action button with a small allowlist (currently `recordIngestionTime`, `confirmIngestionTime`) |
| `store-display` | Read-only render of any dot-path store value (`style: 'accent-box' | 'plain' | 'italic'`). Supports `labelMap` |
| `expandable` | Collapsible text section with `renderContentLines` support |
| `touchstone-arc` | Presentational SVG displaying opening + closing touchstones with connecting arc |
| `touchstone-prompt` | Prompt textarea that locks to accent-bordered display on save. Uses `setPrimaryOverride` |
| `expandable-store-display` | Collapsible read-only display of a store value |
| `phase-recap` | Summary statistics for a phase — duration, journal entries, optional helper-modal count |
| `data-download` | Button that opens `DataDownloadModal` |

TransitionModule custom blocks receive the base context plus `sessionData` (derived session-level data) and `storeState` (full session store snapshot), enabling `storeValue`-based conditions.

## Block Readiness Gating

Any custom block can call `context.reportReady(blockKey, isReady)` to disable Continue. Block readiness resets automatically on screen change (synchronously alongside `setScreenIndex` — not via `useEffect`).

## Terminal + Tail-Detour Pattern

The Opening Ritual uses `terminal: true` on `begin-session` plus a Crossroads section to consolidate optional activities as tail detours:

```javascript
sections: [
  // ... main flow including 'crossroads' with choice routes ...
  { id: 'begin-session', type: 'screens', terminal: true, screens: [...] },
  // Tail detours — only entered via `bookmark: 'crossroads'`
  { id: 'centering-breath', type: 'meditation', meditationId: '...' },
  { id: 'intention-review-detour', type: 'screens', screens: [...] },
  { id: 'gratitude-moment', type: 'screens', screens: [...] },
]
```

## File Structure

```
src/components/session/TransitionModule/
  TransitionModule.jsx              # Main orchestrator
  useTransitionModuleState.js       # Central state + activeNavigation persistence
  customBlocks/
    index.js                        # Registry mapping block `type` → component
    ActionBlock.jsx                 # Generic store-action button
    BodyCheckInBlock.jsx            # Sensation grid (select + comparison)
    DataDownloadBlock.jsx           # Opens DataDownloadModal
    EditableDoseBlock.jsx           # Inline-editable plannedDosageMg
    ExpandableBlock.jsx             # Click-to-reveal text
    ExpandableStoreDisplayBlock.jsx # Expandable store-display variant
    IngestionTimeBlock.jsx          # Record/confirm substance intake
    PhaseRecapBlock.jsx             # Phase summary stats
    StoreDisplayBlock.jsx           # Read-only store-value display
    TouchstoneArcBlock.jsx          # Opening + closing touchstone SVG
    TouchstonePromptBlock.jsx       # Prompt → accent-box display

src/content/transitions/            # Content config files
  openingRitualConfig.js
  peakTransitionConfig.js
  peakToIntegrationConfig.js
  closingRitualConfig.js
  shared.js                         # Shared snippets reused across configs
  somaticSensations.js              # 10-sensation list for body-check-in
```

Section renderers (`ScreensSection`, `MeditationSection`) are imported from MasterModule — no parallel implementation.

# Helper Modal (V5)

The Helper Modal is the "What's happening?" support overlay accessed via a heart-icon button in the header. V5 replaces the V4 flat rating-to-route system with a **phase-aware decision tree** per category: rating → choice(s) → resolver-generated result. The same intensity rating produces wildly different advice depending on where the user is in the session, what part of their body they're feeling, what kind of resistance is showing up, etc.

## Activation & Phase Gating

- Trigger: `HelperButton` (heart icon, accent color, stroke width 3) lives in `Header.jsx`
- Visibility gate: button only renders when `sessionPhase` is `'pre-session'`, `'active'`, or `'completed'`
- Open mechanism: button calls `useHelperStore.openHelper()`. AppShell conditionally mounts `<HelperModal />` via `React.lazy` + `Suspense`. The entire helper subsystem (~5,000 lines across 28 files) is code-split into its own chunk
- Each open is a fresh React mount with fresh `useState` — no leftover-state bugs

## Major-View State Machine

`HelperModal` owns a 3-case `currentStep` state machine:

| Step | Content |
|------|---------|
| `'initial'` | `CategoryGrid` — 2-column category grid + slim full-width emergency contact card. (`PreSessionContent` overrides this when `sessionPhase === 'pre-session'`.) |
| `'triage'` | `TriageStepRunner` walking the selected category's decision tree, OR `PlaceholderCategory` for stubs |
| `'emergency-contact'` | `EmergencyContactView` — dedicated page with contact card, edit toggle, notes textarea, and "I need more help" expand |

`stepHistory` is a stack used by the top-bar back button. Inside triage, the runner manages its own back navigation via `useImperativeHandle`; the parent's back delegates to `triageRunnerRef.current.goBack()` first.

## Decision Tree Architecture

Each category in `helperCategories` declares a `steps` array:

```js
{
  id: 'intense-feeling',
  phases: ['active', 'follow-up'],
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
| `rating` | 0–10 bubble scale — captures numeric value into `triageState[id]` |
| `choice` | Single-select option cards — captures string value into `triageState[id]` |
| `result` | Calls a resolver function `(triageState, sessionContext) → ResultPayload` |

**Hardcoded rating overrides:** Rating `0` → `AcknowledgeClose`. Rating `10` → `EmergencyFlow`. Rating 9 walks the normal tree.

## TriageStepRunner — Stacking Step Flow

Steps render as a stack: each completed step stays visible, next step fades in beneath via `animate-fadeIn`. Existing steps don't re-mount.

**Retroactive editing:** locked steps stay tappable. Tapping a different option on a completed step wipes downstream answers and re-walks from that point (snap-update, no fade).

**Back navigation:** the runner's `goBack` fades out the current step, then decrements `activeIndex`. If already at 0, returns `false` so the parent navigates back to the grid.

## Session Context & Phase-Aware Resolvers

On mount, `HelperModal` builds a `sessionContext` object:

```js
{
  minutesSinceIngestion,    // wall-clock minutes from ingestionTime, or null
  timelinePhase,            // 'come-up' | 'peak' | 'integration' | null
  phaseWindow,              // classified by classifyPhaseWindow(minutes)
  hasEmergencyContact,
  daysSinceSession,         // days since session.closedAt, or null
  timeWindow,               // 'acute' | 'early' | 'mid' | 'late' | null
}
```

**Active-session phase windows:**

| Window | Minutes | Used for... |
|---|---|---|
| `pre-onset` | 0–19 | Anticipatory anxiety framing |
| `come-up` | 20–60 | Sympathomimetic activation framing |
| `early-peak` | 61–90 | Transition copy |
| `peak` | 91–210 | Full processing window, somatic tools |
| `late-session` | 211–360 | Synthesis, integration tools |
| `post-session` | 361+ | Residual effects only |

**Follow-up time windows:**

| Window | Days | Used for... |
|---|---|---|
| `acute` | 0–3 | Serotonin dip window, highest vulnerability |
| `early` | 4–14 | Still settling, insights fresh |
| `mid` | 15–60 | Active integration period |
| `late` | 61+ | Long-term integration |

Resolvers (`src/content/helper/resolvers/*.js`) are pure functions: `(triageState, sessionContext) → ResultPayload`. No store access, no React.

A `ResultPayload`:

```js
{
  timeContextLine?: "You're about 47 minutes in.",
  message: "Pressure in the chest during the peak often signals...",
  secondaryMessage?: "...",
  activityIntro?: "These can help you stay with what's happening.",
  activities?: [{ id: 'simple-grounding' }, { id: 'body-scan' }],
  activityPaths?: [{ label: 'This feels scary', activities: [...] }],
  showEmergencyCard?: true,
  supportResources?: [{ type: 'fireside' }, { type: 'emergency-contact' }],
}
```

## Categories — Cross-Phase Eligibility

| Category | `phases` | Notes |
|---|---|---|
| Intense feeling | `['active', 'follow-up']` | Core |
| Trauma | `['active', 'follow-up']` | Core |
| Resistance | `['active', 'follow-up']` | Core |
| Grief | `['active', 'follow-up']` | Core |
| Ego dissolution | `['active']` | Active session only |
| I feel so good | `['active']` | Active session only |
| Low mood | `['follow-up']` | Follow-up only |
| Integration | `['follow-up']` | Follow-up only |

## Modal Height — Single Rule

```js
const isExpanded =
  (currentStep === 'triage' && hasRatedInTriage) ||
  (currentStep === 'emergency-contact' && (isEditingContact || isContactEmergencyExpanded));
```

- **Default (540px):** category grid, contact view in read mode, pre-session preview
- **Expanded (`min(95vh, calc(100vh - var(--tabbar-height) - 12px))`):** rating committed, edit toggle active, or "I need more help" expanded

## Emergency Contact Surface

The user's emergency contact lives at `sessionProfile.emergencyContactDetails` as `{ name, phone, notes }`. Captured during intake, editable from `SubstanceChecklist.jsx`, `EmergencyContactView`, and `EmergencyFlow`.

**`EmergencyContactCard.jsx`** — shared bordered card with name + number, tap-to-copy, first-name-only Call/Text buttons, optional edit toggle. Used in `EmergencyFlow`, `EmergencyContactView`, and `TriageResultStep` (when `showEmergencyCard: true`).

**`EmergencyContactView.jsx`** — dedicated contact page with header, card, animated edit-mode inputs (CSS grid `1fr/0fr` trick), notes textarea, and "I need more help" expand.

**`EmergencyFlow.jsx`** — reassurance text, contact card, emergency services (911/112), Fireside Project card.

## Pre-Session Mode

When `sessionPhase === 'pre-session'`, the modal shows `PreSessionContent` — the `CategoryGrid` with `categoriesDimmed: true` (cards wrapped in `inert` + `opacity: 0.3`). The emergency contact card at the bottom stays fully interactive.

## Inserting Activities

When the user taps an activity card, `insertAtActive(libraryId)`:
1. Determines target phase: `timeline.currentPhase` during active, `'follow-up'` when completed
2. Creates module at `order: 0`, resets previously-active module to `upcoming`
3. Sets `inOpenSpace: false`, navigates to active tab, precaches audio
4. Handles linked parent modules by creating both parts

## Journal Logging

Entries are created **only on user action** (activity tap, Call/Text button), not on navigation. `formatHelperModalLog` from `formatLog.js` captures the full triage path.

## File Layout

```
src/components/helper/
  HelperModal.jsx              # Major-view orchestrator + journal entry creation
  HelperButton.jsx             # Heart trigger in Header
  HelperTopBar.jsx             # Back / "What's happening?" / close header bar
  CategoryGrid.jsx             # 2-column grid + emergency contact card
  CategoryHeader.jsx           # Wide category card above triage flow
  RatingScale.jsx              # 0–10 bubble scale
  TriageStepRunner.jsx         # Stacking decision-tree orchestrator
  TriageChoiceStep.jsx         # Single-select option cards
  TriageResultStep.jsx         # Resolver result + activities + support resources
  ActivitySuggestions.jsx      # Activity card list
  SupportResourceCard.jsx      # Follow-up support resource cards
  EmergencyContactCard.jsx     # Shared contact card
  EmergencyContactView.jsx     # Dedicated contact page
  EmergencyFlow.jsx            # Full emergency content
  AcknowledgeClose.jsx         # Rating 0 acknowledgment
  PlaceholderCategory.jsx      # "Coming soon" stubs
  PreSessionContent.jsx        # Pre-session dimmed preview

src/content/helper/
  categories.js                # 8 categories with decision trees
  formatLog.js                 # Journal entry formatter
  resolverUtils.js             # Phase classification, ACT id constants
  resolvers/
    intense-feeling.js         # intensity × bodyLocation × phaseWindow
    trauma.js                  # vividness × dualAwareness × phaseWindow
    resistance.js              # strength × resistanceType × phaseWindow
    grief.js                   # intensity × expression × phaseWindow
    ego-dissolution.js         # disorientation × experienceType × phaseWindow
    feel-good.js               # energy × energyFeeling × phaseWindow
    low-mood.js                # severity × quality × functioning × timeWindow
    integration-difficulty.js  # stuckType × timeWindow

src/stores/useHelperStore.js   # isOpen / openHelper / closeHelper (transient)
```

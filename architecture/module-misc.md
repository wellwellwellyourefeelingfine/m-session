# Module Miscellaneous Systems

### Duration Sync Hook

All modules with variable duration use the shared `useSyncedDuration` hook for two-way sync between the module's UI and the session store:

```javascript
const duration = useSyncedDuration(module, { hasStarted });
// duration.selected     — current duration in minutes
// duration.setSelected  — set duration (updates local + syncs to store)
// duration.handleChange — alias for setSelected
```

The idle-screen UI for variable-duration modules is the shared `DurationPill` with `<` / `>` arrows (defined in `ModuleLayout.jsx`), clamped at the meditation's `durationSteps` bounds. `OpenSpaceModule` uses the same pill in both idle and active states — mid-session arrow taps resize the silence-timer blob in place, with `canStepBack` constrained so the user can't shorten below already-elapsed time. On the Home tab, `ModuleCard` and `AltSessionModuleModal` render duration as read-only text; duration edits funnel through `ModuleDetailModal`'s own ± stepper. Cross-surface sync is store-driven: any writer calls `updateModuleDuration(instanceId, minutes)` and every reader re-renders.

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

Both the pre-session and follow-up timelines support editing (reorder + remove) via the same `isEditMode` state in `TimelineEditor`. During completed sessions, `isEditMode` is passed as `false` to the three main PhaseSections so the completed session record is locked. The follow-up section is the only section that can toggle edit mode during completed sessions.

**Completed module handling** in both timelines:
- **Graying**: `ModuleCard` accepts a `grayWhenCompleted` prop that triggers `opacity-50` + tertiary text for completed/skipped modules outside of active sessions.
- **Sort order**: Both lists use `sortCompletedFirst` — completed modules float to the top sorted by `completedAt` timestamp; upcoming modules stay below in their original `order`.
- **Edit locking**: Completed modules are excluded from edit mode — no remove button, no reorder arrows.
- **Skip behavior**: Skipping a pre-session or follow-up module calls `abandonModule` which resets to `upcoming` — the user can retry later.

### Module Addition Gating

`canAddModuleToPhase(moduleId, phase)` in `library.js` enforces hard gates:
- Follow-up modules (`isFollowUpModule`) blocked outside `follow-up` phase
- Booster module (`isBoosterModule`) blocked outside `peak` and `integration` phases
- All other modules are allowed in any phase — recommendations are expressed via `recommendedPhases` and surfaced through the Recommended filter in the library modal, not through gating

### Booster Card Placement

The booster is the only module whose visual position is computed at render time rather than from its stored `order`. `TimelineEditor.computeBoosterPlacement()` walks cumulative durations starting from the end of come-up, through peak modules, then through integration modules, and slots the booster card at the first index where elapsed time crosses the 90-min mark. Whichever phase contains the crossover gets the card — so the user can add the booster to either peak or integration and the placement is identical. Sessions shorter than 90 min total pin the card to the end of integration. The trigger logic (`shouldShowBooster`) is independent: it always fires at `min(90, fullyArrivedAt + 30)` minutes since ingestion, ignoring `module.phase` entirely.

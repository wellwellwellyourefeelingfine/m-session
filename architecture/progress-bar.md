# Progress Bar System

A unified `ModuleStatusBar` sits below the header in all Active tab contexts — active session phases, pre-session, preview activity, transitions, follow-up, and closing ritual. It renders a 1px progress line and a flexible status row with left label, center content, and right content slots.

## Architecture

```
Module (reports progress)
  → onProgressUpdate callback
    → ActiveView.handleProgressUpdate() stores state
      → ModuleStatusBar renders progress line + status row
        → ModuleProgressBar (internal 1px fill bar)
```

Every module receives `onProgressUpdate` as a prop via `ModuleRenderer`. Modules report progress using the `useProgressReporter` hook:

```javascript
const report = useProgressReporter(onProgressUpdate);

report.step(3, 10);      // Step 3 of 10 → 30% progress (mode: 'step')
report.timer(45, 120);   // 45s of 120s → 37.5% progress (mode: 'timer')
report.raw(42.5);        // Pre-computed 42.5% (mode: 'step')
report.idle();            // 0% progress (mode: 'idle')
```

## Two Progress Modes

**Timer-based** — for meditations, silence timers, timed activities. The `useMeditationPlayback` and `useSilenceTimer` hooks call `onProgressUpdate` directly with `mode: 'timer'`, providing elapsed/total seconds. The status bar shows `MM:SS / MM:SS` in the center.

**Step-based** — for step-through screens, journaling, transitions, follow-up flows. Modules call `report.step(current, total)` or `report.raw(percentage)`. The status bar shows the progress line only (no timer display).

**Hybrid modules** (e.g., Pendulation, Protector Dialogue Part 1) switch between modes. During step phases they call `report.step()`, during meditation/timer phases the playback hook takes over. The progress bar transitions seamlessly.

## Context Labels

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

## MasterModule Progress

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
- `unvisitedRemaining` = sections not yet visited, **restricted to sections at or before the first `terminal: true` section** (see below)
- `screenFraction` = position within the current `screens` section (via `onScreenChange` callback)

**Why cumulative, not index-based:** Routing can visit sections out of array order. Using `currentSectionIndex / totalSections` would give "free" credit for skipped sections. The cumulative approach counts only what the user actually completed.

**Terminal-awareness (tail detours):** The formula slices the array at the first terminal entry before computing `unvisitedRemaining`:

```js
const firstTerminalIdx = sections.findIndex((s) => s.terminal === true);
const mainFlowSections = firstTerminalIdx >= 0
  ? sections.slice(0, firstTerminalIdx + 1)
  : sections;
const unvisitedRemaining = mainFlowSections
  .filter((s) => s.id !== currentId && !visitedSections.includes(s.id)).length;
```

Without this, unreachable tail detours would leave permanent "dead weight" at the end of the progress bar. Detours the user *did* visit via routing still contribute via `visitedSections`. Both `MasterModule` and `TransitionModule` apply this filter identically.

**Section type behavior:**
- `screens` — progress advances per-screen within the section's weight
- `meditation` / `timer` — sub-components report their own timer progress directly
- `generate` — treated as a single step at the section's base progress

## Key Files

| File | Role |
|------|------|
| `src/components/active/ModuleStatusBar.jsx` | Unified status bar: progress line + left/center/right slots |
| `src/components/active/capabilities/ModuleProgressBar.jsx` | Internal 1px progress line (used only by ModuleStatusBar and IntakeFlow) |
| `src/hooks/useProgressReporter.js` | Convenience hook: `step()`, `timer()`, `raw()`, `idle()` |
| `src/components/active/ActiveView.jsx` | Orchestrates: owns `moduleProgressState`, passes `handleProgressUpdate` to `ModuleRenderer`, builds status bar labels |
| `src/components/active/ModuleRenderer.jsx` | Passes `onProgressUpdate` as a common prop to all module components |

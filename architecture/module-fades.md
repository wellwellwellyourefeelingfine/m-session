# Module Boundary Fades

> For intra-section fades (screen-to-screen within MasterModule, `persistBlocks` reveals, dot separators) — see the [MasterModule Style Sheet §6](../src/components/active/modules/MasterModule/MasterModuleStyleSheet.md#6-animations--transitions). This chapter covers system-level boundary fades between modules and transitions.

Both `ActiveView` (for MasterModule instances and follow-up library modules) and `TransitionModule` coordinate smooth fade-outs at module boundaries so the `ModuleStatusBar` and `ModuleControlBar` never disappear abruptly. Individual bar elements also fade in when they first become visible mid-module. Four mechanisms handle four situations — all use the same `animate-fadeIn` CSS keyframe (300 ms, defined in `index.css`) or short opacity transitions.

## Intra-Module (screen-to-screen, section-to-section)

Within a single MasterModule or TransitionModule, the `ModuleControlBar` is rendered as a sibling of `ModuleLayout` inside each section renderer's fragment return. When a section changes, React commits the old renderer's unmount and the new renderer's mount in a single frame, so the Continue button appears continuous.

`blockReadiness` (the Continue-gating map for custom blocks) is cleared **synchronously alongside** `setScreenIndex` inside `ScreensSection.handleNext` / `handleBack` — not via a reactive `useEffect`. Doing it in the same state-update batch avoids the child-effect-before-parent-effect race that could flip Continue enabled → disabled → enabled during a screen change.

## MasterModule End (module → next module)

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

Four render sites use this pattern in `ActiveView.jsx`: pre-session active module, come-up phase, peak/integration phases, and follow-up library modules.

A shared helper `fadeOutThenDo(instanceId, action)` wraps the store action:

1. Sets `moduleExitingId = instanceId` → wrapper fades to opacity 0 over `MODULE_EXIT_FADE_MS` (500 ms), gates `pointerEvents: 'none'`
2. After 500 ms, fires the real store action (`completeModule`, `skipModule`, etc.)
3. The store swap changes `currentModule.instanceId` → the wrapper's `key` changes → old wrapper unmounts, new wrapper mounts with `animate-fadeIn`

Modules never need to know about the fade — `onComplete()` looks synchronous from inside.

## TransitionModule End (phase → next phase)

`TransitionModule` has its own ritual-moon exit overlay via `TransitionOverlay` (standardized on `AsciiMoon` for all four transitions). When the last section completes, `overlayPhase` flips to `'exiting'` and the overlay mounts at z-index 60.

The content wrapper flips to `opacity: 0` with `transition-opacity duration-700`. The bars fade out in parallel with the overlay's 700 ms fade-in so both animations finish together.

The last section continues to render through `modulePhase === 'complete'` (no early `return null`) so the `ModuleControlBar` remains mounted until `handleExitComplete` fires `config.onComplete`.

Skip routes through `setOverlayPhase('exiting')` rather than calling `config.onComplete` directly — same ritual-moon fade as natural completion.

## Per-Element Mount Fade

Chrome elements fade in individually **when they first mount** mid-module:

| Element | File | Triggers on |
|---|---|---|
| `ModuleStatusBar` (whole bar) | `ModuleStatusBar.jsx` | Bar appears for the first time |
| Back button | `ModuleControlBar.jsx` | `showBack` flips false → true |
| Skip button | same | `showSkip` flips false → true |
| Seek back / forward | same | `showSeekControls` flips false → true |
| Volume, Transcript slots | `MeditationSection.jsx` | Meditation starts, slot child mounts |

Because `animate-fadeIn` is a CSS keyframe, it only fires on mount — prop changes on an already-mounted element never replay the animation. No fade-out is added; elements just unmount. The global `@media (prefers-reduced-motion)` rule collapses durations to 0.01 ms.

## Key Files

| File | Role |
|------|------|
| `src/components/active/ActiveView.jsx` | `moduleExitingId` state, `fadeOutThenDo` helper, keyed fade wrappers |
| `src/components/session/TransitionModule/TransitionModule.jsx` | Exit overlay, Skip routed through overlay |
| `src/components/session/TransitionModule/TransitionOverlay.jsx` | Ritual-moon entrance + exit overlay |
| `src/components/active/modules/MasterModule/sectionRenderers/ScreensSection.jsx` | Synchronous `setBlockReadiness({})` alongside `setScreenIndex` |
| `src/components/active/ModuleStatusBar.jsx` | `animate-fadeIn` on bar outer `<div>` |
| `src/components/active/capabilities/ModuleControlBar.jsx` | `animate-fadeIn` on Back / Skip / Seek buttons |
| `src/components/active/modules/MasterModule/sectionRenderers/MeditationSection.jsx` | `animate-fadeIn` on slot children |

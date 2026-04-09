/**
 * Tutorial reveal scheduling.
 *
 * When Generate Timeline kicks off the moon/reveal animation, HomeView calls
 * scheduleTutorialReveal() to record the wall-clock time at which the tutorial
 * should appear (after the animation finishes + a "look around" buffer).
 *
 * TimelineTutorialTrigger calls getTutorialRevealDelay() when it mounts to
 * compute its remaining delay. Reads are idempotent — there is no "consume"
 * semantics — so the value survives StrictMode's simulated remount, late
 * mounts, or any number of re-renders without collapsing to the wrong delay.
 *
 * Resets on page refresh when the module re-initialises.
 */

// Must match the cumulative timing in HomeView#handleIntakeComplete:
// moon-enter (50) → moon-visible hold → moon-exit (2750) → reveal (3550) →
// cleanup (4700). Total reveal animation = 4700ms.
const REVEAL_ANIMATION_MS = 4700;

// How long the user should see the clean timeline before the tutorial fades in.
const POST_REVEAL_BUFFER_MS = 3000;

// Fallback delay when there is no pending reveal (e.g. page refresh, or the
// "Show Tutorial" menu item un-dismissing after the animation is long gone).
const REFRESH_FALLBACK_MS = 500;

let _tutorialReadyAt = 0;

/** Called by HomeView the moment the reveal animation starts. */
export function scheduleTutorialReveal() {
  _tutorialReadyAt = Date.now() + REVEAL_ANIMATION_MS + POST_REVEAL_BUFFER_MS;
}

/** Returns ms until the tutorial should show. Safe to call any number of times. */
export function getTutorialRevealDelay() {
  const remaining = _tutorialReadyAt - Date.now();
  return remaining > 0 ? remaining : REFRESH_FALLBACK_MS;
}

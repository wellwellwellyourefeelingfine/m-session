/**
 * Module-level flag for tutorial reveal delay.
 * Set when Generate Timeline triggers the reveal animation.
 * Consumed by TimelineTutorialTrigger to decide delay duration.
 * Resets on page refresh (module re-initializes).
 */
let _pending = false;

export function setRevealAnimationPending() { _pending = true; }

export function consumeRevealAnimationPending() {
  const v = _pending;
  _pending = false;
  return v;
}

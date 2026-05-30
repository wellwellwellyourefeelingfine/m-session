/**
 * Tutorial delay bridge.
 *
 * Two trigger paths set different delays before the tutorial effect fires:
 * - Post-intake completion: 7000ms (waits for reveal animation + buffer)
 * - Hamburger menu "Show Tutorial": 50ms (near-instant)
 *
 * Starts as `null` — the tutorial does NOT auto-trigger on first visit.
 * Only fires after an explicit `setTutorialDelay(ms)` call.
 * Resets to null on page refresh.
 */
let _delay = null;

export function setTutorialDelay(ms) { _delay = ms; }
export function getTutorialDelay() { return _delay; }

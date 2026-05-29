/**
 * Tutorial delay bridge.
 *
 * Two trigger paths set different delays before the tutorial effect fires:
 * - First visit to home tab: 2000ms (gentle reveal after tab switch)
 * - Hamburger menu "Show Tutorial": 50ms (near-instant)
 *
 * Reads are idempotent (no mutation), so StrictMode re-runs get the same value.
 * Resets to the default 2000ms on page refresh.
 */
let _delay = 2000;

export function setTutorialDelay(ms) { _delay = ms; }
export function getTutorialDelay() { return _delay; }

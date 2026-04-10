/**
 * Tutorial delay bridge.
 *
 * Two trigger paths set different delays before the tutorial effect fires:
 * - Generate Timeline button: 7000ms (waits for reveal animation + buffer)
 * - Hamburger menu "Show Tutorial": 50ms (near-instant)
 *
 * Reads are idempotent (no mutation), so StrictMode re-runs get the same value.
 * Resets to the default 50ms on page refresh.
 */
let _delay = 50;

export function setTutorialDelay(ms) { _delay = ms; }
export function getTutorialDelay() { return _delay; }

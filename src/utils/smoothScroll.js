/**
 * smoothScrollToElement
 *
 * Animate an element's scrollable ancestor to bring the element to its top
 * edge. Replaces `scrollIntoView({ behavior: 'smooth' })` when the browser
 * default feels too abrupt against surrounding fade animations.
 *
 * Default curve is a quintic with a small landing overshoot — the scroll
 * presses gently past the target and drifts back, instead of stopping
 * cold. Honors `prefers-reduced-motion` (instant jump).
 *
 * Only one animation runs at a time. A module-scoped `activeRafId` tracks
 * the in-flight RAF and cancels it before any new call. Without this,
 * overlapping calls (e.g. a user rapidly clicking Continue through a
 * persistBlocks reveal) produce parallel RAF loops that race for
 * `container.scrollTop` each frame — the latest call captures
 * `startScrollTop` against a moving target, and the visible animation
 * compresses into what looks like a sudden jump. The cancellation makes
 * "latest call wins" the unambiguous contract.
 */

// Quintic landing curve. Coefficients solved from:
//   f(0)=0, f'(0)=0, f''(0)=0   glass-smooth start (no perceptible kick)
//   f(1)=1, f'(1)=0              lands at target with zero velocity
//   f(0.85) ≈ 1.07               sets the overshoot (peak ~9% near t=0.78,
//                                drifts back to 1.0)
function easeOutGive(t) {
  return ((13 * t - 29) * t + 17) * t * t * t;
}

// Module-scope tracker for the in-flight scroll animation. Holds the
// `requestAnimationFrame` id of the next-frame callback; null when no
// animation is running. See the file's top docstring for why.
let activeRafId = null;

// Walks up the DOM to find the first ancestor that's actually scrollable on
// the Y axis (overflow-y: auto | scroll, and scrollable content inside).
// Falls back to document.scrollingElement for top-level scroll containers.
function findScrollableParent(element) {
  let current = element?.parentElement;
  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    const canScroll = (overflowY === 'auto' || overflowY === 'scroll')
      && current.scrollHeight > current.clientHeight;
    if (canScroll) return current;
    current = current.parentElement;
  }
  return document.scrollingElement || document.documentElement;
}

export function smoothScrollToElement(element, options = {}) {
  if (!element) return;

  // Cancel any in-flight scroll animation before starting a new one. Runs
  // before any other work so the cancellation is unconditional — even an
  // early return below leaves the previous animation cleanly stopped
  // rather than letting it race against the user's intent.
  if (activeRafId !== null) {
    cancelAnimationFrame(activeRafId);
    activeRafId = null;
  }

  const {
    duration = 900,
    easing = easeOutGive,
    offset = 0,
    container: explicitContainer,
  } = options;

  const container = explicitContainer || findScrollableParent(element);
  if (!container) return;

  // Honor reduced-motion — jump directly, no animation.
  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Compute where the element sits relative to the container's scroll origin.
  // Using getBoundingClientRect keeps this correct regardless of transforms
  // or nested scroll contexts.
  const elRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const relativeTop = elRect.top - containerRect.top + container.scrollTop;
  const targetScrollTop = Math.max(0, relativeTop - offset);

  const startScrollTop = container.scrollTop;
  const distance = targetScrollTop - startScrollTop;
  if (Math.abs(distance) < 1) return;

  if (prefersReduced || duration <= 0) {
    container.scrollTop = targetScrollTop;
    return;
  }

  const startTime = performance.now();

  function frame(now) {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);
    container.scrollTop = startScrollTop + distance * easing(t);
    if (t < 1) {
      activeRafId = requestAnimationFrame(frame);
    } else {
      activeRafId = null;
    }
  }
  activeRafId = requestAnimationFrame(frame);
}

/**
 * smoothScrollToElement
 *
 * Scroll an element's nearest scrollable ancestor so the element lands at
 * `align: 'start'` (top) with controllable duration + easing. Replaces
 * `element.scrollIntoView({ behavior: 'smooth' })` when the browser's
 * default smooth-scroll timing feels too abrupt.
 *
 * Respects `prefers-reduced-motion`: jumps instantly when that media query
 * matches.
 *
 * Defaults chosen for the transition-module progressive reveal: 700ms with
 * a cubic ease-out curve so the scroll leads the eye without feeling slow.
 */

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

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

  const {
    duration = 700,
    easing = easeOutCubic,
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
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

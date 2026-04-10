import { useEffect } from 'react';

/**
 * Scroll-triggered reveal animations using IntersectionObserver.
 *
 * Elements with class "rv" start hidden (opacity:0, translateY:24px).
 * When they scroll into view, "visible" is added for a CSS transition.
 * Elements with data-rv-hero get "visible" immediately on mount.
 * Each element is unobserved after reveal (one-shot).
 *
 * @param {React.RefObject} containerRef - ref to the container element
 */
export function useScrollReveal(containerRef) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Hero elements: reveal after first paint via double-rAF so the
    // browser paints opacity:0 first, then the transition plays.
    const heroes = container.querySelectorAll('.rv[data-rv-hero]');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        heroes.forEach((el) => el.classList.add('visible'));
      });
    });

    // Below-fold elements: observe with IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );

    const targets = container.querySelectorAll('.rv:not([data-rv-hero])');
    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [containerRef]);
}

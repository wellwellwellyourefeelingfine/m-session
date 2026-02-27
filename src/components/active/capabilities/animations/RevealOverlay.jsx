/**
 * RevealOverlay Component
 *
 * Full-screen overlay with AsciiMoon animation used as a dramatic
 * reveal transition (e.g., before showing a generated image).
 *
 * Timeline:
 *   0ms        — mount, opacity 0
 *   2×rAF      — fade in (800ms ease), show moon
 *   ~3050ms    — moon fades out (800ms ease)
 *   ~4050ms    — overlay fades out (1500ms ease)
 *   ~5550ms    — onDone() fires
 */

import { useState, useEffect } from 'react';
import AsciiMoon from './AsciiMoon';

export default function RevealOverlay({ isActive, onDone }) {
  const [visible, setVisible] = useState(false);
  const [showMoon, setShowMoon] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    // Double rAF ensures the browser paints opacity:0 before we transition to opacity:1.
    // A simple setTimeout(…, 50) can fire before the first paint, skipping the transition.
    let raf1, raf2;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setVisible(true);
        setShowMoon(true);
      });
    });

    // Hold for ~2.5s after fade-in, then moon fades out
    const t1 = setTimeout(() => setShowMoon(false), 3050);

    // Overlay fades to transparent
    const t2 = setTimeout(() => setFadingOut(true), 4050);

    // Done
    const t3 = setTimeout(() => onDone(), 5550);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isActive, onDone]);

  if (!isActive) return null;

  return (
    <div
      className="fixed inset-0 z-[61] bg-[var(--color-bg)] flex items-center justify-center"
      style={{
        opacity: fadingOut ? 0 : visible ? 1 : 0,
        transition: fadingOut ? 'opacity 1500ms ease' : 'opacity 800ms ease',
        pointerEvents: fadingOut ? 'none' : 'auto',
      }}
    >
      <div
        style={{
          opacity: showMoon && visible ? 1 : 0,
          transition: 'opacity 800ms ease',
        }}
      >
        <AsciiMoon />
      </div>
    </div>
  );
}

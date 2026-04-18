/**
 * TransitionOverlay — full-screen ceremony overlay shown at transition entrance and exit.
 *
 * Covers the entire viewport (above header and tab bar) with a background wash
 * and the transition's sun/moon animation. Manages its own fade-in → hold →
 * fade-out lifecycle, calls onComplete when the sequence finishes.
 *
 * Props:
 *   animation: 'sunrise' | 'full-sun' | 'sunset' | 'moonrise'
 *   phase: 'entering' | 'exiting'
 *   onComplete: () => void   — called when the fade-out completes
 */

import { useEffect, useState } from 'react';
import Sunrise from '../../active/capabilities/animations/Sunrise';
import FullSun from '../../active/capabilities/animations/FullSun';
import Sunset from '../../active/capabilities/animations/Sunset';
import Moonrise from '../../active/capabilities/animations/Moonrise';

const ANIMATION_MAP = {
  'sunrise': Sunrise,
  'full-sun': FullSun,
  'sunset': Sunset,
  'moonrise': Moonrise,
};

const FADE_IN_MS = 800;
const HOLD_ENTRANCE_MS = 2500;
const HOLD_EXIT_MS = 2000;
const FADE_OUT_MS = 800;

export default function TransitionOverlay({ animation, phase, onComplete }) {
  const [opacity, setOpacity] = useState(0);
  const Animation = ANIMATION_MAP[animation];

  useEffect(() => {
    let cancelled = false;

    // Fade in
    const rafId = requestAnimationFrame(() => {
      if (!cancelled) setOpacity(1);
    });

    const holdMs = phase === 'entering' ? HOLD_ENTRANCE_MS : HOLD_EXIT_MS;

    // Start fade out after hold
    const fadeOutTimer = setTimeout(() => {
      if (cancelled) return;
      setOpacity(0);
    }, FADE_IN_MS + holdMs);

    // Call onComplete after fade out finishes
    const completeTimer = setTimeout(() => {
      if (cancelled) return;
      onComplete?.();
    }, FADE_IN_MS + holdMs + FADE_OUT_MS);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [phase, onComplete]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 60,
        backgroundColor: 'var(--color-bg-primary)',
        opacity,
        transition: `opacity ${FADE_IN_MS}ms ease-in-out`,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      {Animation && <Animation size={200} strokeWidth={2} />}
    </div>
  );
}

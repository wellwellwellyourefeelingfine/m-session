/**
 * TransitionOverlay — full-viewport ceremony overlay shown at transition entrance and exit.
 *
 * Standardized on AsciiMoon for all transitions (opening ritual, peak,
 * peak→synthesis, closing) so every ritual entry/exit uses the same visual
 * language as the begin-session overlay on the Home tab. The legacy
 * `animation` prop is accepted but ignored for backward-compatibility with
 * existing config files.
 *
 * Sequence (matches the begin-session overlay on Home):
 *   1. Mount with opacity 0 (overlay + moon)
 *   2. Fade in overlay + moon together (700ms)
 *   3. Hold (entering: 1500ms, exiting: 1000ms)
 *   4. Moon fades out first (700ms) — overlay stays opaque
 *   5. Overlay fades out (700ms) — reveals what's beneath
 *   6. onComplete fires
 *
 * Props:
 *   animation: string (ignored — kept for backward compat)
 *   phase: 'entering' | 'exiting'
 *   onCovered: () => void   — called when the overlay first reaches full opacity
 *                              (use this to swap content beneath without flashes)
 *   onComplete: () => void  — called when the overlay fade-out completes
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import AsciiMoon from '../../active/capabilities/animations/AsciiMoon';

const FADE_MS = 700;
const HOLD_ENTRANCE_MS = 1500;
const HOLD_EXIT_MS = 1000;

export default function TransitionOverlay({ phase, onCovered, onComplete }) {
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [moonOpacity, setMoonOpacity] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // Fade in overlay + moon together on next frame (so the initial
    // opacity-0 paint commits first and CSS can transition to 1).
    const rafId = requestAnimationFrame(() => {
      if (cancelled) return;
      setOverlayOpacity(1);
      setMoonOpacity(1);
    });

    // Fully-covered moment — fires when the overlay finishes its fade-in.
    // Anything beneath can be safely swapped here without a visible flash.
    const coveredTimer = setTimeout(() => {
      if (cancelled) return;
      onCovered?.();
    }, FADE_MS);

    const holdMs = phase === 'entering' ? HOLD_ENTRANCE_MS : HOLD_EXIT_MS;

    // Moon fades out first
    const moonExitTimer = setTimeout(() => {
      if (cancelled) return;
      setMoonOpacity(0);
    }, FADE_MS + holdMs);

    // Overlay fades out after the moon is gone, revealing what's beneath
    const overlayExitTimer = setTimeout(() => {
      if (cancelled) return;
      setOverlayOpacity(0);
    }, FADE_MS + holdMs + FADE_MS);

    // Complete once the overlay fade-out finishes
    const completeTimer = setTimeout(() => {
      if (cancelled) return;
      onComplete?.();
    }, FADE_MS + holdMs + FADE_MS + FADE_MS);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      clearTimeout(coveredTimer);
      clearTimeout(moonExitTimer);
      clearTimeout(overlayExitTimer);
      clearTimeout(completeTimer);
    };
  }, [phase, onCovered, onComplete]);

  // Rendered via portal to document.body so the overlay DOM sits outside the
  // tab/phase React tree. This is the same pattern HomeView's Begin Session
  // overlay uses — it keeps the overlay visible across tab switches (tabs use
  // `display: none`, which would hide anything rendered inside them) and
  // survives TransitionModule remounts driven by store-state changes.
  return createPortal(
    <>
      {/* Background overlay — covers the full viewport including header + tabbar */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: 60,
          backgroundColor: 'var(--color-bg)',
          opacity: overlayOpacity,
          transition: `opacity ${FADE_MS}ms ease-in-out`,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
      {/* Moon — floats above the overlay, centered on the full viewport */}
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{
          zIndex: 61,
          opacity: moonOpacity,
          transition: `opacity ${FADE_MS}ms ease-in-out`,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <AsciiMoon />
      </div>
    </>,
    document.body
  );
}

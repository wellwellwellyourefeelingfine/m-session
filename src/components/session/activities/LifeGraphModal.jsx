/**
 * LifeGraphModal Component
 *
 * Full-screen overlay for displaying the generated life graph PNG.
 * Supports pinch-to-zoom, pan when zoomed, share/download export.
 * Matches MatrixModal UX: X close top-left, export top-right, floating Done.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

const FADE_MS = 400;

export default function LifeGraphModal({ isOpen, closing, onClose, graphUrl, graphBlob }) {
  const [entered, setEntered] = useState(false);
  const imageWrapperRef = useRef(null);
  const transformRef = useRef({ scale: 1, x: 0, y: 0 });
  const gestureRef = useRef({
    activePointers: new Map(),
    initialDistance: 0,
    initialScale: 1,
    initialCenter: { x: 0, y: 0 },
    initialTranslate: { x: 0, y: 0 },
  });

  // Lock body scroll + fade in
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      let raf1, raf2;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          setEntered(true);
        });
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
        document.body.style.overflow = '';
      };
    } else {
      setEntered(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Reset transform when modal opens
  useEffect(() => {
    if (isOpen) {
      transformRef.current = { scale: 1, x: 0, y: 0 };
      const el = imageWrapperRef.current;
      if (el) el.style.transform = '';
    }
  }, [isOpen]);

  // Pinch-to-zoom + pan (iOS-optimised)
  useEffect(() => {
    if (!isOpen) return;
    const el = imageWrapperRef.current;
    if (!el) return;

    let lastTap = 0;

    const getDistance = (p1, p2) =>
      Math.sqrt((p1.clientX - p2.clientX) ** 2 + (p1.clientY - p2.clientY) ** 2);

    const applyTransform = () => {
      const t = transformRef.current;
      el.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.scale})`;
    };

    const handleTouchStart = (e) => {
      const g = gestureRef.current;
      for (const touch of e.changedTouches) {
        g.activePointers.set(touch.identifier, touch);
      }
      if (g.activePointers.size === 2) {
        const [p1, p2] = [...g.activePointers.values()];
        g.initialDistance = getDistance(p1, p2);
        g.initialScale = transformRef.current.scale;
        g.initialCenter = { x: (p1.clientX + p2.clientX) / 2, y: (p1.clientY + p2.clientY) / 2 };
        g.initialTranslate = { x: transformRef.current.x, y: transformRef.current.y };
      } else if (g.activePointers.size === 1) {
        const [p1] = [...g.activePointers.values()];
        // Double-tap detection
        const now = Date.now();
        if (now - lastTap < 300) {
          el.style.transition = 'transform 0.25s ease-out';
          if (transformRef.current.scale > 1.05) {
            transformRef.current = { scale: 1, x: 0, y: 0 };
          } else {
            transformRef.current = { scale: 2, x: 0, y: 0 };
          }
          applyTransform();
          setTimeout(() => { el.style.transition = ''; }, 250);
        }
        lastTap = now;
        g.initialCenter = { x: p1.clientX, y: p1.clientY };
        g.initialTranslate = { x: transformRef.current.x, y: transformRef.current.y };
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const g = gestureRef.current;
      for (const touch of e.changedTouches) {
        g.activePointers.set(touch.identifier, touch);
      }
      if (g.activePointers.size === 2) {
        const [p1, p2] = [...g.activePointers.values()];
        const distance = getDistance(p1, p2);
        const center = { x: (p1.clientX + p2.clientX) / 2, y: (p1.clientY + p2.clientY) / 2 };
        const scale = Math.max(0.5, Math.min(4, g.initialScale * (distance / g.initialDistance)));
        transformRef.current.scale = scale;
        transformRef.current.x = g.initialTranslate.x + (center.x - g.initialCenter.x);
        transformRef.current.y = g.initialTranslate.y + (center.y - g.initialCenter.y);
        applyTransform();
      } else if (g.activePointers.size === 1 && transformRef.current.scale > 1) {
        const [p1] = [...g.activePointers.values()];
        transformRef.current.x = g.initialTranslate.x + (p1.clientX - g.initialCenter.x);
        transformRef.current.y = g.initialTranslate.y + (p1.clientY - g.initialCenter.y);
        applyTransform();
      }
    };

    const handleTouchEnd = (e) => {
      for (const touch of e.changedTouches) {
        gestureRef.current.activePointers.delete(touch.identifier);
      }
      // Snap back if pinched below 1×
      if (gestureRef.current.activePointers.size === 0 && transformRef.current.scale < 1) {
        el.style.transition = 'transform 0.25s ease-out';
        transformRef.current = { scale: 1, x: 0, y: 0 };
        applyTransform();
        setTimeout(() => { el.style.transition = ''; }, 250);
      }
    };

    const handleTouchCancel = () => {
      gestureRef.current.activePointers.clear();
    };

    // Prevent Safari's native gesture events from fighting custom touch handling
    const preventGesture = (e) => e.preventDefault();

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchCancel);
    el.addEventListener('gesturestart', preventGesture);
    el.addEventListener('gesturechange', preventGesture);
    el.addEventListener('gestureend', preventGesture);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchCancel);
      el.removeEventListener('gesturestart', preventGesture);
      el.removeEventListener('gesturechange', preventGesture);
      el.removeEventListener('gestureend', preventGesture);
    };
  }, [isOpen]);

  const handleExport = useCallback(async () => {
    if (!graphBlob) return;
    try {
      const file = new File([graphBlob], 'life-graph.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Life Graph' });
        return;
      }
      // Fallback: download
      const url = URL.createObjectURL(graphBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `life-graph-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Life graph export failed:', err);
      }
    }
  }, [graphBlob]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-[var(--color-bg)] flex flex-col"
      style={{
        opacity: closing ? 0 : entered ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: closing ? 'none' : 'auto',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))',
          paddingBottom: '0.75rem',
          backgroundColor: 'color-mix(in srgb, var(--color-bg) 85%, transparent)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <button
          onClick={onClose}
          className="text-[var(--color-text-secondary)] text-sm w-8 h-8 flex items-center justify-center"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="1" y1="1" x2="13" y2="13" />
            <line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>
        <button
          onClick={handleExport}
          className="text-[var(--color-text-secondary)] w-8 h-8 flex items-center justify-center"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2v8M4 6l4 4 4-4M2 12h12" />
          </svg>
        </button>
      </div>

      {/* Graph image with pinch-to-zoom */}
      <div className="flex-1 overflow-hidden flex items-center justify-center px-4 pb-4">
        <div
          ref={imageWrapperRef}
          className="w-full max-w-lg"
          style={{ touchAction: 'none' }}
        >
          {graphUrl && (
            <img
              src={graphUrl}
              alt="Your Life Graph"
              className="w-full object-contain"
              style={{ maxHeight: '70vh' }}
              draggable={false}
            />
          )}
        </div>
      </div>

      {/* Floating Done button */}
      <div
        className="absolute bottom-0 left-0 right-0 flex justify-center"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          onClick={onClose}
          className="px-8 py-2.5 rounded-full text-[11px] uppercase tracking-wider font-medium
            bg-[var(--accent)] text-white shadow-lg active:scale-[0.97] transition-transform"
        >
          Done
        </button>
      </div>
    </div>
  );
}

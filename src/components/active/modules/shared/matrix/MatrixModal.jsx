/**
 * Shared Matrix Modal component for the Values Compass.
 * Extracted from ValuesCompassModule for reuse in follow-up modules.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import DraggableChip, { ChipInput, ExamplesDrawer } from './DraggableChip';
import MatrixGrid from './MatrixGrid';
import { exportMatrixAsPNG } from './exportMatrixAsPNG';
import {
  QUADRANT_ORDER,
  QUADRANT_CONFIG,
  AXIS_LABELS,
  QUADRANT_LABELS,
} from '../../../../../content/modules/valuesCompassContent';

const FADE_MS = 400;

// ─── QuadrantWorkArea ───────────────────────────────────────────────────────

export function QuadrantWorkArea({ chips, onAddChip, onMoveChip, onRemoveChip, config }) {
  const containerRef = useRef(null);
  const [showInput, setShowInput] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const handleAddFromInput = useCallback((text) => {
    onAddChip(text);
    setShowInput(false);
  }, [onAddChip]);

  const handleAddFromExample = useCallback((text) => {
    onAddChip(text);
  }, [onAddChip]);

  const addedTexts = useMemo(() => chips.map((c) => c.text), [chips]);

  // Border edges: subtle lines on the edges that will become the matrix center
  const borderClasses = useMemo(() => {
    const edges = config.borderEdges || [];
    const classes = [];
    if (edges.includes('left')) classes.push('border-l');
    if (edges.includes('right')) classes.push('border-r');
    if (edges.includes('top')) classes.push('border-t');
    if (edges.includes('bottom')) classes.push('border-b');
    return classes.join(' ');
  }, [config.borderEdges]);

  return (
    <div className="w-full">
      {/* Work area with heat map */}
      <div
        ref={containerRef}
        className={`relative w-full aspect-square rounded-sm ${borderClasses}`}
        style={{
          borderStyle: 'solid',
          borderColor: 'color-mix(in srgb, var(--color-border) 40%, transparent)',
          borderLeftWidth: config.borderEdges?.includes('left') ? '1px' : '0',
          borderRightWidth: config.borderEdges?.includes('right') ? '1px' : '0',
          borderTopWidth: config.borderEdges?.includes('top') ? '1px' : '0',
          borderBottomWidth: config.borderEdges?.includes('bottom') ? '1px' : '0',
        }}
      >
        {/* Heat map gradient */}
        <div
          className="absolute inset-0 pointer-events-none rounded-sm"
          style={{
            background: `radial-gradient(ellipse at ${config.gradientOrigin}, var(--accent) 0%, transparent 70%)`,
            opacity: 0.15,
          }}
        />

        {/* Axis labels with arrows */}
        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[7px] uppercase tracking-wider text-[var(--color-text-tertiary)] opacity-40 pointer-events-none">
          {AXIS_LABELS.top} ↑
        </span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[7px] uppercase tracking-wider text-[var(--color-text-tertiary)] opacity-40 pointer-events-none">
          ↓ {AXIS_LABELS.bottom}
        </span>
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[7px] uppercase tracking-wider text-[var(--color-text-tertiary)] opacity-40 pointer-events-none">
          ← {AXIS_LABELS.left}
        </span>
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[7px] uppercase tracking-wider text-[var(--color-text-tertiary)] opacity-40 pointer-events-none">
          {AXIS_LABELS.right} →
        </span>

        {/* Chips */}
        {chips.map((chip) => (
          <DraggableChip
            key={chip.id}
            chip={chip}
            onMove={onMoveChip}
            onRemove={onRemoveChip}
            containerRef={containerRef}
            disabled={false}
            editMode={false}
          />
        ))}

      </div>

      {/* Controls below work area */}
      <div className="mt-4 space-y-3">
        {showInput ? (
          <ChipInput
            onAdd={handleAddFromInput}
            onCancel={() => setShowInput(false)}
          />
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInput(true)}
              className="flex items-center gap-1.5 px-4 py-2 border rounded-full text-xs uppercase tracking-wider
                transition-all border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <span className="text-sm leading-none">+</span>
              Add your own
            </button>
            <button
              onClick={() => setShowExamples(true)}
              className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]
                hover:text-[var(--color-text-secondary)] transition-colors underline underline-offset-2"
            >
              Examples
            </button>
          </div>
        )}
      </div>

      {/* Examples drawer */}
      {showExamples && (
        <ExamplesDrawer
          examples={config.examples}
          addedTexts={addedTexts}
          onAdd={handleAddFromExample}
          onClose={() => setShowExamples(false)}
        />
      )}
    </div>
  );
}

// ─── ReferenceChips ─────────────────────────────────────────────────────────

export function ReferenceChips({ quadrants, showQuadrants }) {
  const [expanded, setExpanded] = useState(false);
  const items = useMemo(() => {
    const result = [];
    for (const qId of showQuadrants) {
      const chips = quadrants[qId];
      if (chips?.length > 0) {
        result.push({ qId, label: QUADRANT_LABELS[qId], chips });
      }
    }
    return result;
  }, [quadrants, showQuadrants]);

  if (items.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2"
      >
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          className={`transition-transform duration-200 ${expanded ? 'rotate-45' : ''}`}
        >
          <line x1="5" y1="1" x2="5" y2="9" />
          <line x1="1" y1="5" x2="9" y2="5" />
        </svg>
        See previous choices
      </button>
      {expanded && (
        <div className="space-y-2 animate-fadeIn">
          {items.map(({ qId, label, chips }) => (
            <div key={qId}>
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">
                {label}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <span
                    key={chip.id}
                    className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider
                      text-[var(--color-text-secondary)] border border-[var(--color-border)] opacity-75"
                  >
                    {chip.text}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── View Matrix Icon ───────────────────────────────────────────────────────

export const ViewMatrixIcon = ({ inline } = {}) => (
  <svg
    width={inline ? "12" : "16"}
    height={inline ? "12" : "16"}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    style={inline ? { display: 'inline-block', verticalAlign: 'middle', margin: '0 2px' } : undefined}
  >
    <rect x="1" y="1" width="6" height="6" rx="0.5" />
    <rect x="9" y="1" width="6" height="6" rx="0.5" />
    <rect x="1" y="9" width="6" height="6" rx="0.5" />
    <rect x="9" y="9" width="6" height="6" rx="0.5" />
  </svg>
);

// ─── Matrix Modal ───────────────────────────────────────────────────────────

export default function MatrixModal({ isOpen, closing, onClose, quadrants, onUpdateChipPosition }) {
  const [mode, setMode] = useState('view');
  const matrixWrapperRef = useRef(null);
  const transformRef = useRef({ scale: 1, x: 0, y: 0 });
  const gestureRef = useRef({
    activePointers: new Map(),
    initialDistance: 0,
    initialScale: 1,
    initialCenter: { x: 0, y: 0 },
    initialTranslate: { x: 0, y: 0 },
  });

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Pinch-to-zoom + pan (view mode only)
  useEffect(() => {
    if (!isOpen || mode === 'edit') return;
    const el = matrixWrapperRef.current;
    if (!el) return;

    const getDistance = (p1, p2) => Math.sqrt((p1.clientX - p2.clientX) ** 2 + (p1.clientY - p2.clientY) ** 2);

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
        g.initialTranslate = { x: transformRef.current.x, y: transformRef.current.y };
      } else if (g.activePointers.size === 1) {
        const [p1] = [...g.activePointers.values()];
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
        const scale = Math.max(0.5, Math.min(4, g.initialScale * (distance / g.initialDistance)));
        transformRef.current.scale = scale;
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
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, mode]);

  // Smart zoom-out on entering edit mode
  useEffect(() => {
    if (mode === 'edit' && transformRef.current.scale > 1.25) {
      const el = matrixWrapperRef.current;
      if (el) {
        transformRef.current = { scale: 1, x: 0, y: 0 };
        el.style.transition = 'transform 400ms ease';
        el.style.transform = 'translate(0px, 0px) scale(1)';
        const cleanup = () => { el.style.transition = ''; };
        el.addEventListener('transitionend', cleanup, { once: true });
      }
    }
  }, [mode]);

  const handleMoveChip = useCallback((chipId, x, y) => {
    // Find which quadrant this chip belongs to
    for (const qId of QUADRANT_ORDER) {
      const chip = quadrants[qId]?.find((c) => c.id === chipId);
      if (chip) {
        onUpdateChipPosition(qId, chipId, x, y);
        break;
      }
    }
  }, [quadrants, onUpdateChipPosition]);

  const handleToggleMode = useCallback(() => {
    setMode((m) => m === 'view' ? 'edit' : 'view');
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const blob = await exportMatrixAsPNG(quadrants);
      const file = new File([blob], 'values-compass.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Values Compass' });
        return;
      }

      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `values-compass-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Matrix export failed:', err);
      }
    }
  }, [quadrants]);

  // Click on empty grid space exits edit mode
  const handleGridClick = useCallback((e) => {
    if (mode === 'edit' && e.target === e.currentTarget) {
      setMode('view');
    }
  }, [mode]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-[var(--color-bg)] flex flex-col"
      style={{
        opacity: closing ? 0 : 1,
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
          onClick={handleToggleMode}
          className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]
            px-3 py-1.5 border border-[var(--color-border)] rounded-full"
        >
          {mode === 'view' ? 'Edit' : 'Done'}
        </button>
        <button
          onClick={handleSave}
          className="text-[var(--color-text-secondary)] w-8 h-8 flex items-center justify-center"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2v8M4 6l4 4 4-4M2 12h12" />
          </svg>
        </button>
      </div>

      {/* Matrix */}
      <div className="flex-1 overflow-hidden flex items-center justify-center px-4 pb-4" onClick={handleGridClick}>
        <div
          ref={matrixWrapperRef}
          className="w-full max-w-md"
          style={{ touchAction: mode === 'edit' ? 'none' : 'manipulation' }}
        >
          <MatrixGrid
            quadrants={quadrants}
            mode={mode}
            onMoveChip={handleMoveChip}
          />
        </div>
      </div>

      {/* Floating Done button */}
      {mode === 'view' && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}>
          <button
            onClick={onClose}
            className="px-8 py-2.5 rounded-full text-[11px] uppercase tracking-wider font-medium
              bg-[var(--accent)] text-white shadow-lg active:scale-[0.97] transition-transform"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

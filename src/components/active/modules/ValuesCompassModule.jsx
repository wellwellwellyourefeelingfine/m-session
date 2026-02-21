/**
 * ValuesCompassModule Component
 *
 * An ACT Matrix exercise with progressive quadrant building:
 * 1. Introduction (5 screens — overview, quadrants, axes, placement, big picture)
 * 2. Four quadrant-building phases — add chips via free-text or examples, drag to position
 * 3. Matrix reveal — full-screen modal with assembled 4-quadrant view
 * 4. Journaling (3 screens, last skippable)
 * 5. Closing screen
 *
 * No audio/meditation component. Self-paced, ~20-30 minutes.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useJournalStore } from '../../../stores/useJournalStore';
import { useSessionStore } from '../../../stores/useSessionStore';

import ModuleLayout from '../capabilities/ModuleLayout';
import ModuleControlBar, { SlotButton } from '../capabilities/ModuleControlBar';
import AsciiMoon from '../capabilities/animations/AsciiMoon';
import CompassAnimation from '../capabilities/animations/Compass';

import {
  INTRO_SCREENS,
  QUADRANT_CONFIG,
  QUADRANT_ORDER,
  REVEAL_CONTENT,
  JOURNALING_SCREENS,
  CLOSING_CONTENT,
  AXIS_LABELS,
  QUADRANT_LABELS,
} from '../../../content/modules/valuesCompassContent';

import { saveImage } from '../../../utils/imageStorage';

// ─── Constants ──────────────────────────────────────────────────────────────

const FADE_MS = 400;
const PHASE_SEQUENCE = [
  'idle', 'intro-a', 'intro-b', 'intro-c', 'intro-d', 'intro-e',
  'q1', 'q1-transition',
  'q2', 'q2-transition',
  'q3', 'q3-transition',
  'q4', 'q4-transition',
  'reveal-prompt', 'reveal-modal',
  'journal-a', 'journal-b', 'journal-c',
  'closing',
];

// ─── Render helpers ─────────────────────────────────────────────────────────

function renderContentLines(lines, { small } = {}) {
  const textClass = small
    ? 'text-[var(--color-text-primary)] text-xs leading-relaxed'
    : 'text-[var(--color-text-primary)] text-sm leading-relaxed';

  return (
    <div className="space-y-0">
      {lines.map((line, i) => {
        if (line === '§') {
          return (
            <div key={i} className="flex justify-center my-4">
              <div className="circle-spacer" />
            </div>
          );
        }
        // Structured line with serif title + body
        if (typeof line === 'object' && line.title) {
          return (
            <p key={i} className={textClass}>
              <span className="font-serif text-sm text-[var(--accent)]">{line.title}</span>{' '}
              {line.body}
            </p>
          );
        }
        return (
          <p key={i} className={textClass}>
            {line}
          </p>
        );
      })}
    </div>
  );
}

// ─── ChipInput ──────────────────────────────────────────────────────────────

function ChipInput({ onAdd, onCancel }) {
  const inputRef = useRef(null);
  const [text, setText] = useState('');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (trimmed) {
      onAdd(trimmed);
      setText('');
    }
  }, [text, onAdd]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  }, [handleSubmit, onCancel]);

  return (
    <div className="flex items-center gap-2 animate-fadeIn">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (!text.trim()) onCancel(); }}
        placeholder="Type a word or phrase..."
        maxLength={60}
        className="flex-1 bg-transparent border-b border-[var(--color-border)] focus:border-[var(--accent)]
          text-[var(--color-text-primary)] text-xs uppercase tracking-wider py-2 outline-none
          placeholder:text-[var(--color-text-tertiary)] placeholder:normal-case"
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="text-[var(--accent)] text-xs uppercase tracking-wider px-2 py-1
          disabled:opacity-30 transition-opacity"
      >
        Add
      </button>
    </div>
  );
}

// ─── ExamplesDrawer ─────────────────────────────────────────────────────────

function ExamplesDrawer({ examples, addedTexts, onAdd, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const addedSet = useMemo(
    () => new Set(addedTexts.map((t) => t.toLowerCase())),
    [addedTexts]
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[55] bg-black/30"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-[56] bg-[var(--color-bg)] border-t border-[var(--color-border)]
        rounded-t-xl max-h-[60vh] flex flex-col animate-slideUp"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Examples
          </span>
          <button
            onClick={onClose}
            className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]"
          >
            Done
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 scrollable">
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => {
              const isAdded = addedSet.has(example.toLowerCase());
              return (
                <button
                  key={example}
                  onClick={() => { if (!isAdded) onAdd(example); }}
                  disabled={isAdded}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-[10px] uppercase tracking-wider
                    transition-all ${
                    isAdded
                      ? 'border-[var(--color-border)] text-[var(--color-text-tertiary)] opacity-40'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                  }`}
                >
                  {!isAdded && (
                    <span className="text-[var(--accent)] text-xs leading-none">+</span>
                  )}
                  {example}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── DraggableChip ──────────────────────────────────────────────────────────

function DraggableChip({ chip, onMove, onRemove, containerRef, disabled, editMode, matrixView }) {
  const chipRef = useRef(null);
  const isDragging = useRef(false);
  const startOffset = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    setDragging(true);

    chipRef.current?.setPointerCapture(e.pointerId);

    const rect = chipRef.current.getBoundingClientRect();
    startOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, [disabled]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging.current || !containerRef?.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const chipEl = chipRef.current;
    if (!chipEl) return;
    const chipW = chipEl.offsetWidth;
    const chipH = chipEl.offsetHeight;

    let newX = (e.clientX - startOffset.current.x - containerRect.left) / (containerRect.width - chipW);
    let newY = (e.clientY - startOffset.current.y - containerRect.top) / (containerRect.height - chipH);

    newX = Math.max(0, Math.min(1, newX));
    newY = Math.max(0, Math.min(1, newY));

    onMove(chip.id, newX, newY);
  }, [chip.id, onMove, containerRef]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
    setDragging(false);
  }, []);

  const posStyle = {
    position: 'absolute',
    left: `${chip.x * 85}%`,
    top: `${chip.y * 85}%`,
    touchAction: disabled ? 'auto' : 'none',
    transform: dragging ? 'scale(1.08)' : 'scale(1)',
    transition: dragging ? 'none' : 'transform 150ms ease, left 0ms, top 0ms',
    zIndex: dragging ? 10 : 1,
  };

  return (
    <div
      ref={chipRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={posStyle}
      className={`inline-flex items-start text-[10px] uppercase tracking-wider select-none
        ${matrixView && !editMode
          ? 'gap-1 text-[var(--color-text-primary)] cursor-default'
          : matrixView && editMode
            ? 'gap-1 px-2.5 py-1 rounded-full border border-dashed border-[var(--color-text-tertiary)] text-[var(--color-text-primary)] cursor-grab whitespace-nowrap max-w-[80%]'
            : 'gap-1 px-2.5 py-1 rounded-full border border-[var(--accent)] text-[var(--color-text-primary)] bg-transparent cursor-grab whitespace-nowrap max-w-[80%]'
        }
        ${disabled ? 'cursor-default' : ''}
        ${dragging ? 'cursor-grabbing' : ''}`}
    >
      {!editMode && (
        <span className="text-[var(--color-text-primary)] text-[14px] leading-[0.85] flex-shrink-0">&bull;</span>
      )}
      <span className={matrixView && !editMode ? '' : 'truncate'}>{chip.text}</span>
      {!disabled && onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(chip.id); }}
          className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] text-[11px] ml-0.5 leading-none flex-shrink-0"
        >
          &times;
        </button>
      )}
    </div>
  );
}

// ─── QuadrantWorkArea ───────────────────────────────────────────────────────

function QuadrantWorkArea({ chips, onAddChip, onMoveChip, onRemoveChip, config }) {
  const containerRef = useRef(null);
  const [showInput, setShowInput] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const prevChipCount = useRef(chips.length);

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

function ReferenceChips({ quadrants, showQuadrants }) {
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
    <div className="mb-4 space-y-2">
      {items.map(({ qId, label, chips }) => (
        <div key={qId}>
          <span className="text-[8px] uppercase tracking-wider text-[var(--color-text-secondary)] block mb-1">
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
  );
}

// ─── Quadrant Cell (extracted to avoid useRef in .map) ──────────────────────

function QuadrantCell({ id, gridArea, chips, mode, onMoveChip }) {
  const qRef = useRef(null);
  return (
    <div
      ref={qRef}
      className="relative overflow-visible"
      style={{ gridArea }}
    >
      <span
        className={`absolute font-serif text-xs tracking-wide pointer-events-none ${
          id === 'q3' ? 'top-1.5 left-2' :
          id === 'q4' ? 'top-1.5 right-2 text-right' :
          id === 'q2' ? 'bottom-1.5 left-2' :
          'bottom-1.5 right-2 text-right'
        }`}
        style={{ color: 'var(--accent)', opacity: 0.7, textTransform: 'none' }}
      >
        {QUADRANT_LABELS[id]}
      </span>
      {(chips || []).map((chip) => (
        <DraggableChip
          key={chip.id}
          chip={chip}
          onMove={mode === 'edit' ? onMoveChip : undefined}
          onRemove={null}
          containerRef={qRef}
          disabled={mode !== 'edit'}
          editMode={mode === 'edit'}
          matrixView
        />
      ))}
    </div>
  );
}

// ─── Matrix Grid (used in both modal and canvas) ────────────────────────────

const QUADRANT_LAYOUT = [
  { id: 'q3', gridArea: '1 / 1' },
  { id: 'q4', gridArea: '1 / 2' },
  { id: 'q2', gridArea: '2 / 1' },
  { id: 'q1', gridArea: '2 / 2' },
];

function MatrixGrid({ quadrants, mode, onMoveChip }) {
  const axisColor = 'color-mix(in srgb, var(--accent) 30%, transparent)';

  return (
    <div className="relative w-full aspect-square">
      {/* Heat map gradient from center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, var(--accent) 0%, transparent 60%)',
          opacity: 0.15,
        }}
      />

      {/* Grid */}
      <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
        {QUADRANT_LAYOUT.map(({ id, gridArea }) => (
          <QuadrantCell
            key={id}
            id={id}
            gridArea={gridArea}
            chips={quadrants[id]}
            mode={mode}
            onMoveChip={onMoveChip}
          />
        ))}
      </div>

      {/* Vertical axis — arrows inside container, line stops at arrow bases */}
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none" style={{ top: '8%', bottom: '8%' }}>
        {/* Line — inset 6px from each end to terminate at arrow base */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '6px', bottom: '6px', width: '1px', backgroundColor: axisColor }} />
        {/* Arrow up */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2"
          style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: `6px solid ${axisColor}` }} />
        {/* Arrow down */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: `6px solid ${axisColor}` }} />
      </div>

      {/* Horizontal axis — arrows inside container, line stops at arrow bases */}
      <div className="absolute top-1/2 -translate-y-1/2 pointer-events-none" style={{ left: '14%', right: '14%' }}>
        {/* Line — inset 6px from each end to terminate at arrow base */}
        <div className="absolute top-1/2 -translate-y-1/2" style={{ left: '6px', right: '6px', height: '1px', backgroundColor: axisColor }} />
        {/* Arrow left */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2"
          style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderRight: `6px solid ${axisColor}` }} />
        {/* Arrow right */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2"
          style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `6px solid ${axisColor}` }} />
      </div>

      {/* Axis labels — positioned outside the shortened axes */}
      <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[7px] uppercase tracking-wider text-[var(--color-text-tertiary)] opacity-60 pointer-events-none">
        {AXIS_LABELS.top}
      </span>
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[7px] uppercase tracking-wider text-[var(--color-text-tertiary)] opacity-60 pointer-events-none">
        {AXIS_LABELS.bottom}
      </span>
      <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[7px] uppercase tracking-wider text-[var(--color-text-tertiary)] opacity-60 pointer-events-none">
        {AXIS_LABELS.left}
      </span>
      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[7px] uppercase tracking-wider text-[var(--color-text-tertiary)] opacity-60 pointer-events-none">
        {AXIS_LABELS.right}
      </span>
    </div>
  );
}

// ─── Matrix Modal ───────────────────────────────────────────────────────────

function MatrixModal({ isOpen, closing, onClose, quadrants, onUpdateChipPosition }) {
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
    </div>
  );
}

// ─── Reveal Overlay ─────────────────────────────────────────────────────────

function RevealOverlay({ isActive, onDone }) {
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

// ─── PNG Export ──────────────────────────────────────────────────────────────

async function exportMatrixAsPNG(quadrants) {
  const scale = 3;
  const BASE = 420;
  const MATRIX = 360;
  const PAD = 30;
  const FOOTER = 40;

  const canvas = document.createElement('canvas');
  canvas.width = BASE * scale;
  canvas.height = (BASE + FOOTER) * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  const isDark = document.documentElement.classList.contains('dark');
  const bg = isDark ? '#1A1A1A' : '#F5F5F0';
  const accent = isDark ? '#9D8CD9' : '#E8A87C';
  const textPrimary = isDark ? '#E5E5E5' : '#3A3A3A';
  const textTertiary = isDark ? '#666666' : '#999999';
  const border = isDark ? '#333333' : '#D0D0D0';
  const chipBg = isDark ? '#2A2A2A' : '#ECECEC';

  // Wait for fonts
  await document.fonts.ready;

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, BASE, BASE + FOOTER);

  const cx = PAD + MATRIX / 2;
  const cy = PAD + MATRIX / 2;

  // Heat map gradient
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, MATRIX * 0.45);
  grad.addColorStop(0, accent + '28');
  grad.addColorStop(1, accent + '00');
  ctx.fillStyle = grad;
  ctx.fillRect(PAD, PAD, MATRIX, MATRIX);

  // Grid lines (accent color, semi-opaque)
  const accentLine = accent + '4D'; // ~30% opacity
  ctx.strokeStyle = accentLine;
  ctx.lineWidth = 0.5;
  const arrowSize = 3;
  // Shortened vertical axis — line terminates at arrow bases
  const vTop = PAD + MATRIX * 0.08;
  const vBot = PAD + MATRIX * 0.92;
  ctx.beginPath();
  ctx.moveTo(cx, vTop + arrowSize);
  ctx.lineTo(cx, vBot - arrowSize);
  ctx.stroke();
  // Shortened horizontal axis — line terminates at arrow bases
  const hLeft = PAD + MATRIX * 0.14;
  const hRight = PAD + MATRIX * 0.86;
  ctx.beginPath();
  ctx.moveTo(hLeft + arrowSize, cy);
  ctx.lineTo(hRight - arrowSize, cy);
  ctx.stroke();

  // Arrow heads
  ctx.fillStyle = accentLine;
  // Up arrow
  ctx.beginPath();
  ctx.moveTo(cx, vTop);
  ctx.lineTo(cx - arrowSize, vTop + arrowSize);
  ctx.lineTo(cx + arrowSize, vTop + arrowSize);
  ctx.fill();
  // Down arrow
  ctx.beginPath();
  ctx.moveTo(cx, vBot);
  ctx.lineTo(cx - arrowSize, vBot - arrowSize);
  ctx.lineTo(cx + arrowSize, vBot - arrowSize);
  ctx.fill();
  // Left arrow
  ctx.beginPath();
  ctx.moveTo(hLeft, cy);
  ctx.lineTo(hLeft + arrowSize, cy - arrowSize);
  ctx.lineTo(hLeft + arrowSize, cy + arrowSize);
  ctx.fill();
  // Right arrow
  ctx.beginPath();
  ctx.moveTo(hRight, cy);
  ctx.lineTo(hRight - arrowSize, cy - arrowSize);
  ctx.lineTo(hRight - arrowSize, cy + arrowSize);
  ctx.fill();

  // Axis labels
  ctx.fillStyle = textTertiary;
  ctx.font = '6px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('AWAY', PAD + MATRIX * 0.05, cy + 3);
  ctx.fillText('TOWARD', PAD + MATRIX * 0.95, cy + 3);
  ctx.fillText('EXTERNAL ACTIONS', cx, PAD + 8);
  ctx.fillText('INNER EXPERIENCE', cx, PAD + MATRIX - 4);

  // Quadrant offsets: q3(TL) q4(TR) q2(BL) q1(BR)
  const offsets = {
    q3: { x: PAD, y: PAD },
    q4: { x: cx, y: PAD },
    q2: { x: PAD, y: cy },
    q1: { x: cx, y: cy },
  };
  const half = MATRIX / 2;

  // Quadrant labels (serif, accent color) — positioned at corner opposite origin
  ctx.font = '9px serif';
  ctx.fillStyle = accent + 'B3'; // ~70% opacity
  // q3 (top-left): label at top-left
  ctx.textAlign = 'left';
  ctx.fillText(QUADRANT_LABELS.q3 || '', offsets.q3.x + 4, offsets.q3.y + 12);
  // q4 (top-right): label at top-right
  ctx.textAlign = 'right';
  ctx.fillText(QUADRANT_LABELS.q4 || '', offsets.q4.x + half - 4, offsets.q4.y + 12);
  // q2 (bottom-left): label at bottom-left
  ctx.textAlign = 'left';
  ctx.fillText(QUADRANT_LABELS.q2 || '', offsets.q2.x + 4, offsets.q2.y + half - 6);
  // q1 (bottom-right): label at bottom-right
  ctx.textAlign = 'right';
  ctx.fillText(QUADRANT_LABELS.q1 || '', offsets.q1.x + half - 4, offsets.q1.y + half - 6);

  // Draw chips
  ctx.font = '7px monospace';
  ctx.textAlign = 'left';
  for (const [qId, chips] of Object.entries(quadrants)) {
    const off = offsets[qId];
    if (!off || !chips) continue;
    for (const chip of chips) {
      const chipX = off.x + 6 + chip.x * (half - 40);
      const chipY = off.y + 20 + chip.y * (half - 30);

      const textWidth = ctx.measureText(chip.text.toUpperCase()).width;
      const chipW = textWidth + 10;
      const chipH = 14;

      // Chip background
      ctx.fillStyle = chipBg;
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, chipW, chipH, 7);
      ctx.fill();

      // Chip border
      ctx.strokeStyle = border;
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, chipW, chipH, 7);
      ctx.stroke();

      // Chip text
      ctx.fillStyle = textPrimary;
      ctx.fillText(chip.text.toUpperCase(), chipX + 5, chipY + 10);
    }
  }

  // Footer
  ctx.fillStyle = textTertiary;
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`VALUES COMPASS · ${new Date().toLocaleDateString()}`, BASE / 2, BASE + FOOTER / 2 + 3);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

// ─── View Matrix Button (SlotButton for journaling phases) ──────────────────

const ViewMatrixIcon = ({ inline } = {}) => (
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

// ─── Matrix Schematic (used on idle + reveal-prompt pages) ──────────────────

function MatrixSchematic({ variant = 'full', maxWidth = 'max-w-[280px]' }) {
  const showAxisLabels = variant !== 'quadrants-only';
  const showQuadrantLabels = variant !== 'axes-only';

  return (
    <div className={`relative w-full aspect-square ${maxWidth} mx-auto`}>
      {/* Radial gradient heat map from center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, var(--accent) 0%, transparent 60%)',
          opacity: 0.15,
        }}
      />

      {/* Vertical line */}
      <div
        className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2"
        style={{ width: '1px', backgroundColor: 'var(--accent)' }}
      />
      {/* Horizontal line */}
      <div
        className="absolute top-1/2 left-0 right-0 -translate-y-1/2"
        style={{ height: '1px', backgroundColor: 'var(--accent)' }}
      />

      {/* Axis labels */}
      {showAxisLabels && (
        <>
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-1.5 text-[10px] text-[var(--color-text-primary)] uppercase tracking-wider">
            External Actions
          </span>
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-1.5 text-[10px] text-[var(--color-text-primary)] uppercase tracking-wider">
            Inner Experience
          </span>
          <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2 text-[10px] text-[var(--color-text-primary)] uppercase tracking-wider">
            Away
          </span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-2 text-[10px] text-[var(--color-text-primary)] uppercase tracking-wider">
            Toward
          </span>
        </>
      )}

      {/* Quadrant labels — centered within each quadrant, each word on its own line */}
      {showQuadrantLabels && (
        <>
          <span className="absolute top-3/4 left-3/4 -translate-x-1/2 -translate-y-1/2 font-serif text-base text-[var(--color-text-primary)] text-center leading-tight" style={{ textTransform: 'none' }}>
            What<br />Matters
          </span>
          <span className="absolute top-3/4 left-1/4 -translate-x-1/2 -translate-y-1/2 font-serif text-base text-[var(--color-text-primary)] text-center leading-tight" style={{ textTransform: 'none' }}>
            Inner<br />Obstacles
          </span>
          <span className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 font-serif text-base text-[var(--color-text-primary)] text-center leading-tight" style={{ textTransform: 'none' }}>
            Away<br />Moves
          </span>
          <span className="absolute top-1/4 left-3/4 -translate-x-1/2 -translate-y-1/2 font-serif text-base text-[var(--color-text-primary)] text-center leading-tight" style={{ textTransform: 'none' }}>
            Toward<br />Moves
          </span>
        </>
      )}
    </div>
  );
}

// ─── Schematic Modal (shows matrix key before reveal) ────────────────────────

function SchematicModal({ isOpen, closing, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

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
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))',
          paddingBottom: '0.75rem',
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
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
          Matrix Key
        </span>
        <div className="w-8" />
      </div>
      <div className="flex-1 flex items-center justify-center px-8 pb-8">
        <MatrixSchematic />
      </div>
    </div>
  );
}

// ─── Main Module Component ──────────────────────────────────────────────────

export default function ValuesCompassModule({ onComplete, onSkip, onTimerUpdate }) {
  // ── Phase state ──
  const [phase, setPhase] = useState('idle');
  const [isVisible, setIsVisible] = useState(true);

  // ── Quadrant data ──
  const [quadrants, setQuadrants] = useState({ q1: [], q2: [], q3: [], q4: [] });

  // ── Journal text ──
  const [journalNoticing, setJournalNoticing] = useState('');
  const [journalTowardMove, setJournalTowardMove] = useState('');
  const [journalCompassion, setJournalCompassion] = useState('');

  // ── Matrix modal ──
  const [showMatrix, setShowMatrix] = useState(false);
  const [matrixClosing, setMatrixClosing] = useState(false);
  const [showRevealOverlay, setShowRevealOverlay] = useState(false);
  const [revealKey, setRevealKey] = useState(0);

  // ── Schematic modal (pre-reveal matrix key) ──
  const [showSchematic, setShowSchematic] = useState(false);
  const [schematicClosing, setSchematicClosing] = useState(false);

  // ── Store hooks ──
  const addEntry = useJournalStore((s) => s.addEntry);
  const ingestionTime = useSessionStore((s) => s.substanceChecklist.ingestionTime);
  const updateCapture = useSessionStore((s) => s.updateValuesCompassCapture);
  const sessionId = ingestionTime ? new Date(ingestionTime).toISOString() : null;

  // ── Hide timer for all phases ──
  useEffect(() => {
    onTimerUpdate?.({ showTimer: false, progress: 0, elapsed: 0, total: 0, isPaused: false });
  }, [onTimerUpdate]);

  // ── Phase transitions ──
  const fadeToPhase = useCallback((nextPhase) => {
    setIsVisible(false);
    setTimeout(() => {
      setPhase(nextPhase);
      setIsVisible(true);
    }, FADE_MS);
  }, []);

  // ── Chip management ──
  const addChip = useCallback((quadrantId, text) => {
    const chip = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      x: 0.2 + Math.random() * 0.5,
      y: 0.2 + Math.random() * 0.5,
    };
    setQuadrants((prev) => ({
      ...prev,
      [quadrantId]: [...prev[quadrantId], chip],
    }));
  }, []);

  const moveChip = useCallback((quadrantId, chipId, x, y) => {
    setQuadrants((prev) => ({
      ...prev,
      [quadrantId]: prev[quadrantId].map((c) =>
        c.id === chipId ? { ...c, x, y } : c
      ),
    }));
  }, []);

  const removeChip = useCallback((quadrantId, chipId) => {
    setQuadrants((prev) => ({
      ...prev,
      [quadrantId]: prev[quadrantId].filter((c) => c.id !== chipId),
    }));
  }, []);

  const updateChipPosition = useCallback((quadrantId, chipId, x, y) => {
    moveChip(quadrantId, chipId, x, y);
  }, [moveChip]);

  // ── Journal save ──
  const saveJournalEntry = useCallback(async () => {
    let content = 'VALUES COMPASS\n';
    let hasContent = false;
    const hasQuadrantData = QUADRANT_ORDER.some((qId) => quadrants[qId].length > 0);

    const quadrantLabels = {
      q1: 'What Matters',
      q2: 'What Gets in the Way',
      q3: 'What I Do When Hooked',
      q4: 'What I\'d Do Instead',
    };

    for (const qId of QUADRANT_ORDER) {
      const chips = quadrants[qId];
      if (chips.length > 0) {
        content += `\n${quadrantLabels[qId]}:\n`;
        chips.forEach((c) => { content += `  - ${c.text}\n`; });
        hasContent = true;
      }
    }

    if (journalNoticing.trim()) {
      content += `\nWhat I noticed:\n${journalNoticing.trim()}\n`;
      hasContent = true;
    }
    if (journalTowardMove.trim()) {
      content += `\nOne toward move:\n${journalTowardMove.trim()}\n`;
      hasContent = true;
    }
    if (journalCompassion.trim()) {
      content += `\nSelf-compassion note:\n${journalCompassion.trim()}\n`;
      hasContent = true;
    }

    if (hasContent) {
      const entry = addEntry({
        content: content.trim(),
        source: 'session',
        sessionId,
        moduleTitle: 'Values Compass',
        hasImage: hasQuadrantData,
      });

      // Generate and save matrix PNG to IndexedDB
      if (hasQuadrantData) {
        try {
          const blob = await exportMatrixAsPNG(quadrants);
          await saveImage(entry.id, blob);
        } catch (err) {
          console.warn('Failed to save matrix image:', err);
        }
      }
    }

    // Save quadrant data to store for potential reconstruction
    updateCapture('quadrants', quadrants);
    updateCapture('completedAt', Date.now());
  }, [quadrants, journalNoticing, journalTowardMove, journalCompassion, addEntry, sessionId, updateCapture]);

  // ── Completion ──
  const handleComplete = useCallback(async () => {
    await saveJournalEntry();
    onComplete();
  }, [saveJournalEntry, onComplete]);

  const handleSkip = useCallback(async () => {
    await saveJournalEntry();
    onSkip();
  }, [saveJournalEntry, onSkip]);

  // ── Current quadrant helper ──
  const currentQuadrantId = phase.startsWith('q') && !phase.includes('transition') ? phase : null;
  const currentQuadrantConfig = currentQuadrantId ? QUADRANT_CONFIG[currentQuadrantId] : null;
  const currentQuadrantChips = currentQuadrantId ? quadrants[currentQuadrantId] : [];
  const meetsMinimum = currentQuadrantConfig ? currentQuadrantChips.length >= currentQuadrantConfig.minItems : true;

  // ── Previous quadrants for reference chips ──
  const previousQuadrants = useMemo(() => {
    const idx = QUADRANT_ORDER.indexOf(currentQuadrantId);
    return idx > 0 ? QUADRANT_ORDER.slice(0, idx) : [];
  }, [currentQuadrantId]);

  // ── Reveal sequence ──
  const revealTimerRef = useRef(null);

  const handleReveal = useCallback(() => {
    // Clear any pending timer from a previous reveal
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    // Ensure matrix is hidden, then start fresh overlay (key forces remount)
    setShowMatrix(false);
    setRevealKey((k) => k + 1);
    setShowRevealOverlay(true);
    // Delay matrix open until overlay is fully opaque (~900ms after fade-in starts)
    revealTimerRef.current = setTimeout(() => setShowMatrix(true), 900);
  }, []);

  const handleRevealDone = useCallback(() => {
    setShowRevealOverlay(false);
    setPhase('reveal-modal');
  }, []);

  const matrixCloseTimerRef = useRef(null);

  const handleCloseMatrix = useCallback(() => {
    // Hide underlying content immediately so it doesn't show through the fading modal
    setIsVisible(false);
    setMatrixClosing(true);
    if (matrixCloseTimerRef.current) clearTimeout(matrixCloseTimerRef.current);
    matrixCloseTimerRef.current = setTimeout(() => {
      setShowMatrix(false);
      setMatrixClosing(false);
      // Jump straight to journal-a and fade it in (no double-fade)
      setPhase('journal-a');
      setIsVisible(true);
    }, FADE_MS);
  }, []);

  // ── View Matrix in journaling phases ──
  const handleViewMatrix = useCallback(() => {
    setShowMatrix(true);
  }, []);

  const handleCloseMatrixView = useCallback(() => {
    // Fade out the modal overlay smoothly
    setMatrixClosing(true);
    if (matrixCloseTimerRef.current) clearTimeout(matrixCloseTimerRef.current);
    matrixCloseTimerRef.current = setTimeout(() => {
      setShowMatrix(false);
      setMatrixClosing(false);
    }, FADE_MS);
  }, []);

  // ── Schematic modal (matrix key) ──
  const schematicCloseTimerRef = useRef(null);

  const handleViewSchematic = useCallback(() => {
    setShowSchematic(true);
  }, []);

  const handleCloseSchematic = useCallback(() => {
    setSchematicClosing(true);
    if (schematicCloseTimerRef.current) clearTimeout(schematicCloseTimerRef.current);
    schematicCloseTimerRef.current = setTimeout(() => {
      setShowSchematic(false);
      setSchematicClosing(false);
    }, FADE_MS);
  }, []);

  // Determine if we've passed the reveal point
  const hasRevealed = useMemo(() => {
    const revealIdx = PHASE_SEQUENCE.indexOf('reveal-modal');
    const currentIdx = PHASE_SEQUENCE.indexOf(phase);
    return currentIdx >= revealIdx;
  }, [phase]);

  // ── Journal text getters/setters ──
  const journalValues = { 'noticing': journalNoticing, 'toward-move': journalTowardMove, 'compassion': journalCompassion };
  const journalSetters = { 'noticing': setJournalNoticing, 'toward-move': setJournalTowardMove, 'compassion': setJournalCompassion };

  // ── Back navigation ──
  const getBackPhase = useCallback(() => {
    const idx = PHASE_SEQUENCE.indexOf(phase);
    if (idx <= 0) return null;
    // Skip transition phases when going back
    let target = idx - 1;
    while (target > 0 && PHASE_SEQUENCE[target].includes('transition')) {
      target--;
    }
    return PHASE_SEQUENCE[target];
  }, [phase]);

  const handleBack = useCallback(() => {
    const backPhase = getBackPhase();
    if (backPhase) fadeToPhase(backPhase);
  }, [getBackPhase, fadeToPhase]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  const renderContent = () => {
    // ── Idle ──
    if (phase === 'idle') {
      return (
        <div className="text-center animate-fadeIn">
          <h2 className="font-serif text-2xl text-[var(--color-text-primary)] mb-4 normal-case">
            Values Compass
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-14">
            Map what matters, what gets in the way, and what you&apos;d do differently.
          </p>
          <MatrixSchematic />
        </div>
      );
    }

    // ── Intro screens ──
    if (phase.startsWith('intro-')) {
      const introIndex = { 'intro-a': 0, 'intro-b': 1, 'intro-c': 2, 'intro-d': 3, 'intro-e': 4 }[phase];
      const screen = INTRO_SCREENS[introIndex];
      if (!screen) return null;

      // Page 1: compass animation + lines (original format)
      if (phase === 'intro-a') {
        return (
          <div className="space-y-0">
            <h2 className="font-serif text-xl text-[var(--color-text-primary)] mb-6 normal-case text-center">
              Values Compass
            </h2>
            <div className="flex justify-center pb-6">
              <CompassAnimation />
            </div>
            {renderContentLines(screen.lines)}
          </div>
        );
      }

      // Pages 2-5: structured format with optional header, schematic, tip
      const schematicMaxW =
        screen.schematic === 'full' ? 'max-w-[280px]' :
        screen.schematic === 'axes-only' ? 'max-w-[180px]' :
        'max-w-[220px]';
      const schematicPadding =
        screen.schematic === 'quadrants-only' ? 'py-4' :
        screen.schematic === 'axes-only' ? 'py-8' :
        'py-8';
      return (
        <div
          className={`space-y-4 ${screen.showKeyTip ? 'pb-16' : ''}`}
          style={{ minHeight: 'calc(100vh - var(--header-height) - var(--bottom-chrome) - 4rem)' }}
        >
          {screen.header && (
            <h2 className="font-serif text-xl text-[var(--color-text-primary)] normal-case text-center mb-2">
              {screen.header}
            </h2>
          )}
          {screen.topLines && renderContentLines(screen.topLines, { small: true })}
          {screen.schematic && (
            <div className={schematicPadding}>
              <MatrixSchematic
                variant={screen.schematic === 'full' ? 'full' : screen.schematic}
                maxWidth={schematicMaxW}
              />
            </div>
          )}
          {screen.bottomLines && renderContentLines(screen.bottomLines, { small: true })}
          {screen.lines && renderContentLines(screen.lines, { small: true })}
          {screen.showKeyTip && (
            <p className="text-[10px] text-[var(--color-text-tertiary)] text-center normal-case mt-6">
              Tip: You can view the Matrix Key at any time by pressing the{' '}
              <ViewMatrixIcon inline /> button in the bottom right of the control bar.
            </p>
          )}
        </div>
      );
    }

    // ── Quadrant building phases ──
    if (currentQuadrantId && currentQuadrantConfig) {
      return (
        <div className="space-y-4 pb-28">
          {/* Reference chips from previous quadrants */}
          <ReferenceChips quadrants={quadrants} showQuadrants={previousQuadrants} />

          {/* Title */}
          <h3 className="font-serif text-lg text-[var(--color-text-primary)] normal-case leading-snug">
            {currentQuadrantConfig.title}
          </h3>

          {/* Prompt */}
          <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed">
            {currentQuadrantConfig.prompt.split('\n\n').map((para, i) => (
              <span key={i}>
                {i > 0 && <><br /><br /></>}
                {para}
              </span>
            ))}
          </p>

          {/* Work area */}
          <QuadrantWorkArea
            chips={currentQuadrantChips}
            onAddChip={(text) => addChip(currentQuadrantId, text)}
            onMoveChip={(chipId, x, y) => moveChip(currentQuadrantId, chipId, x, y)}
            onRemoveChip={(chipId) => removeChip(currentQuadrantId, chipId)}
            config={currentQuadrantConfig}
          />

          {/* Minimum items hint */}
          {!meetsMinimum && currentQuadrantChips.length > 0 && (
            <p className="text-[9px] text-[var(--color-text-tertiary)] text-center normal-case">
              Add at least {currentQuadrantConfig.minItems} item{currentQuadrantConfig.minItems > 1 ? 's' : ''} to continue
            </p>
          )}
        </div>
      );
    }

    // ── Transition texts ──
    if (phase.includes('transition')) {
      const qId = phase.replace('-transition', '');
      const config = QUADRANT_CONFIG[qId];
      return (
        <div className="text-center">
          <div className="flex justify-center pb-6">
            <CompassAnimation />
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed italic normal-case">
            {config?.transition || ''}
          </p>
        </div>
      );
    }

    // ── Reveal prompt ──
    if (phase === 'reveal-prompt') {
      return (
        <div className="text-center">
          <h2 className="font-serif text-2xl text-[var(--color-text-primary)] normal-case mb-14">
            {REVEAL_CONTENT.title}
          </h2>

          <MatrixSchematic />

          <button
            onClick={handleReveal}
            className="mt-14 w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)]
              text-xs uppercase tracking-wider transition-all active:scale-[0.98]"
          >
            {REVEAL_CONTENT.buttonLabel}
          </button>
        </div>
      );
    }

    // ── Reveal modal phase (matrix is showing, nothing behind it) ──
    if (phase === 'reveal-modal') {
      return null;
    }

    // ── Journaling ──
    if (phase.startsWith('journal-')) {
      const journalIndex = { 'journal-a': 0, 'journal-b': 1, 'journal-c': 2 }[phase];
      const screen = JOURNALING_SCREENS[journalIndex];
      if (!screen) return null;

      const value = journalValues[screen.id] || '';
      const setter = journalSetters[screen.id];

      return (
        <div className="space-y-4">
          <h3 className="font-serif text-xl text-[var(--color-text-primary)] normal-case leading-snug">
            {screen.title}
          </h3>
          <p className="text-[var(--color-text-tertiary)] text-xs leading-relaxed">
            {screen.prompt.split('\n\n').map((para, i) => (
              <span key={i}>
                {i > 0 && <><br /><br /></>}
                {para}
              </span>
            ))}
          </p>
          <textarea
            value={value}
            onChange={(e) => setter?.(e.target.value)}
            placeholder={screen.placeholder}
            rows={5}
            className="w-full bg-transparent border border-[var(--color-border)] rounded-sm p-3
              text-[var(--color-text-primary)] text-sm leading-relaxed resize-none
              focus:border-[var(--accent)] focus:outline-none transition-colors
              placeholder:text-[var(--color-text-tertiary)] placeholder:normal-case"
          />
        </div>
      );
    }

    // ── Closing ──
    if (phase === 'closing') {
      return (
        <div className="text-center">
          <div className="flex justify-center pb-6">
            <CompassAnimation />
          </div>
          {renderContentLines(CLOSING_CONTENT.lines)}
        </div>
      );
    }

    return null;
  };

  // ── Control bar config per phase ──
  const matrixSlot = hasRevealed ? (
    <SlotButton icon={<ViewMatrixIcon />} label="Matrix" onClick={handleViewMatrix} />
  ) : (
    <SlotButton icon={<ViewMatrixIcon />} label="Key" onClick={handleViewSchematic} />
  );

  const getControlBarProps = () => {
    const base = { showSkip: true, onSkip: handleSkip, skipConfirmMessage: 'Skip this exercise?', rightSlot: matrixSlot };

    if (phase === 'idle') {
      return { ...base, phase: 'idle', primary: { label: 'Begin', onClick: () => fadeToPhase('intro-a') } };
    }
    if (phase === 'intro-a') {
      return { ...base, phase: 'active', primary: { label: 'Continue', onClick: () => fadeToPhase('intro-b') } };
    }
    if (phase === 'intro-b') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase('intro-c') },
        showBack: true, onBack: () => fadeToPhase('intro-a'),
      };
    }
    if (phase === 'intro-c') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase('intro-d') },
        showBack: true, onBack: () => fadeToPhase('intro-b'),
      };
    }
    if (phase === 'intro-d') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase('intro-e') },
        showBack: true, onBack: () => fadeToPhase('intro-c'),
      };
    }
    if (phase === 'intro-e') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Begin', onClick: () => fadeToPhase('q1') },
        showBack: true, onBack: () => fadeToPhase('intro-d'),
      };
    }
    if (currentQuadrantId) {
      const nextPhase = `${currentQuadrantId}-transition`;
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase(nextPhase), disabled: !meetsMinimum },
        showBack: true,
        onBack: handleBack,
      };
    }
    if (phase.includes('transition')) {
      const qId = phase.replace('-transition', '');
      const qIdx = QUADRANT_ORDER.indexOf(qId);
      const nextPhase = qIdx < QUADRANT_ORDER.length - 1 ? QUADRANT_ORDER[qIdx + 1] : 'reveal-prompt';
      return { ...base, phase: 'active', primary: { label: 'Continue', onClick: () => fadeToPhase(nextPhase) } };
    }
    if (phase === 'reveal-prompt') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', disabled: true },
        showBack: true, onBack: () => fadeToPhase('q4'),
      };
    }
    if (phase === 'reveal-modal') {
      // Matrix modal handles its own controls; minimal control bar
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: handleCloseMatrix },
        rightSlot: null,
      };
    }
    if (phase === 'journal-a') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase('journal-b') },
        showBack: true, onBack: () => { setShowMatrix(false); fadeToPhase('reveal-prompt'); },
      };
    }
    if (phase === 'journal-b') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase('journal-c') },
        showBack: true, onBack: () => fadeToPhase('journal-a'),
      };
    }
    if (phase === 'journal-c') {
      return {
        ...base, phase: 'active',
        primary: { label: 'Continue', onClick: () => fadeToPhase('closing') },
        showBack: true, onBack: () => fadeToPhase('journal-b'),
      };
    }
    if (phase === 'closing') {
      return { ...base, phase: 'completed', primary: { label: 'Complete', onClick: handleComplete }, showSkip: false, showBack: true, onBack: () => fadeToPhase('journal-c') };
    }

    return base;
  };

  const controlBarProps = getControlBarProps();

  return (
    <>
      <ModuleLayout layout={{ centered: true, maxWidth: 'sm' }}>
        <div
          className={`transition-opacity duration-[400ms] ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
          {renderContent()}
        </div>
      </ModuleLayout>

      <ModuleControlBar {...controlBarProps} />

      {/* Matrix modal (for reveal and view-again during journaling) */}
      <MatrixModal
        isOpen={showMatrix}
        closing={matrixClosing}
        onClose={phase === 'reveal-modal' ? handleCloseMatrix : handleCloseMatrixView}
        quadrants={quadrants}
        onUpdateChipPosition={updateChipPosition}
      />

      {/* Schematic modal (matrix key, shown before reveal) */}
      <SchematicModal
        isOpen={showSchematic}
        closing={schematicClosing}
        onClose={handleCloseSchematic}
      />

      {/* Reveal overlay animation (key forces remount for fresh state on repeat) */}
      <RevealOverlay key={revealKey} isActive={showRevealOverlay} onDone={handleRevealDone} />
    </>
  );
}

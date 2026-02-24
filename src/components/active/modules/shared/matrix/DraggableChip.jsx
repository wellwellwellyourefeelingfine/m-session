/**
 * Shared chip components for the Values Compass matrix.
 * Extracted from ValuesCompassModule for reuse in follow-up modules.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

// ─── ChipInput ──────────────────────────────────────────────────────────────

export function ChipInput({ onAdd, onCancel }) {
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

export function ExamplesDrawer({ examples, addedTexts, onAdd, onClose }) {
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

export default function DraggableChip({ chip, onMove, onRemove, containerRef, disabled, editMode, matrixView }) {
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

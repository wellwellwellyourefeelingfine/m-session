/**
 * Shared matrix schematic components for the Values Compass.
 * Extracted from ValuesCompassModule for reuse in follow-up modules.
 */

import { useRef } from 'react';
import DraggableChip from './DraggableChip';
import { QUADRANT_LABELS } from '../../../../../content/modules/valuesCompassContent';

// ─── Matrix Schematic (static reference diagram) ────────────────────────────

export function MatrixSchematic({ variant = 'full', maxWidth = 'max-w-[280px]' }) {
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
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-1.5 text-[10px] text-[var(--color-text-primary)] uppercase tracking-wider whitespace-nowrap">
            External Actions
          </span>
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full pt-1.5 text-[10px] text-[var(--color-text-primary)] uppercase tracking-wider whitespace-nowrap">
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

// ─── Focused Matrix Schematic (half-matrix with user's chips) ────────────────

export function FocusedMatrixSchematic({ side, quadrants }) {
  const topRef = useRef(null);
  const bottomRef = useRef(null);

  // side='left' → q3 (away moves) on top, q2 (inner obstacles) on bottom
  // side='right' → q4 (toward moves) on top, q1 (what matters) on bottom
  const topQ = side === 'left' ? 'q3' : 'q4';
  const bottomQ = side === 'left' ? 'q2' : 'q1';
  const topChips = quadrants[topQ] || [];
  const bottomChips = quadrants[bottomQ] || [];

  return (
    <div className="relative max-w-[60vw] mx-auto" style={{ aspectRatio: '1 / 1.8' }}>
      {/* Radial gradient from the axis edge */}
      <div
        className="absolute inset-0 pointer-events-none rounded-sm"
        style={{
          background: side === 'left'
            ? 'radial-gradient(circle at 100% 50%, var(--accent) 0%, transparent 65%)'
            : 'radial-gradient(circle at 0% 50%, var(--accent) 0%, transparent 65%)',
          opacity: 0.1,
        }}
      />

      {/* Vertical axis line along the inner edge */}
      <div
        className={`absolute top-0 bottom-0 ${side === 'left' ? 'right-0' : 'left-0'}`}
        style={{ width: '1px', backgroundColor: 'color-mix(in srgb, var(--accent) 35%, transparent)' }}
      />

      {/* Horizontal axis line at center */}
      <div
        className="absolute left-0 right-0 top-1/2 -translate-y-1/2"
        style={{ height: '1px', backgroundColor: 'color-mix(in srgb, var(--accent) 35%, transparent)' }}
      />

      {/* Top quadrant (actions) */}
      <div ref={topRef} className="absolute top-0 left-0 right-0 bottom-1/2 overflow-visible">
        <span
          className={`absolute font-serif text-[11px] tracking-wide pointer-events-none opacity-60
            ${side === 'left' ? 'top-2 left-2' : 'top-2 right-2 text-right'}`}
          style={{ color: 'var(--color-text-secondary)', textTransform: 'none' }}
        >
          {QUADRANT_LABELS[topQ]}
        </span>
        {topChips.map((chip) => (
          <DraggableChip
            key={chip.id}
            chip={chip}
            onMove={undefined}
            onRemove={null}
            containerRef={topRef}
            disabled
            editMode={false}
            matrixView
          />
        ))}
      </div>

      {/* Bottom quadrant (inner experience) */}
      <div ref={bottomRef} className="absolute top-1/2 left-0 right-0 bottom-0 overflow-visible">
        <span
          className={`absolute font-serif text-[11px] tracking-wide pointer-events-none opacity-60
            ${side === 'left' ? 'bottom-2 left-2' : 'bottom-2 right-2 text-right'}`}
          style={{ color: 'var(--color-text-secondary)', textTransform: 'none' }}
        >
          {QUADRANT_LABELS[bottomQ]}
        </span>
        {bottomChips.map((chip) => (
          <DraggableChip
            key={chip.id}
            chip={chip}
            onMove={undefined}
            onRemove={null}
            containerRef={bottomRef}
            disabled
            editMode={false}
            matrixView
          />
        ))}
      </div>

      {/* Axis labels */}
      <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-wider text-[var(--color-text-tertiary)] opacity-50 pointer-events-none whitespace-nowrap">
        actions
      </span>
      <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-wider text-[var(--color-text-tertiary)] opacity-50 pointer-events-none whitespace-nowrap">
        inner experience
      </span>
      {side === 'left' && (
        <span className="absolute top-1/2 -translate-y-1/2 -left-5 text-[8px] uppercase tracking-wider text-[var(--color-text-tertiary)] opacity-50 pointer-events-none">
          away
        </span>
      )}
      {side === 'right' && (
        <span className="absolute top-1/2 -translate-y-1/2 -right-8 text-[8px] uppercase tracking-wider text-[var(--color-text-tertiary)] opacity-50 pointer-events-none">
          toward
        </span>
      )}
    </div>
  );
}

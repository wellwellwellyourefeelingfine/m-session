/**
 * Shared matrix grid components for the Values Compass.
 * Extracted from ValuesCompassModule for reuse in follow-up modules.
 */

import { useRef } from 'react';
import DraggableChip from './DraggableChip';
import { AXIS_LABELS, QUADRANT_LABELS } from '../../../../../content/modules/valuesCompassContent';

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

// ─── Matrix Grid Layout ─────────────────────────────────────────────────────

const QUADRANT_LAYOUT = [
  { id: 'q3', gridArea: '1 / 1' },
  { id: 'q4', gridArea: '1 / 2' },
  { id: 'q2', gridArea: '2 / 1' },
  { id: 'q1', gridArea: '2 / 2' },
];

export default function MatrixGrid({ quadrants, mode, onMoveChip }) {
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

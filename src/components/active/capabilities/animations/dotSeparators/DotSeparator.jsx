/**
 * DotSeparator — Tiny accent-colored dots that draw in like ink from a marker.
 *
 * Used to visually punctuate consecutive text blocks in `persistBlocks`
 * progressive-reveal sections. The pattern depends on `count`:
 *
 *    1 — single centered dot
 *    2 — horizontal pair
 *    3 — triangle (2 base dots + 1 apex on top)
 *    4 — diamond (no center): top, left, right, bottom
 *    5 — diamond + center
 *    6 — 3×2 grid (3 dots top row, 3 dots bottom row)
 *   7+ — horizontal line fallback
 *
 * The slot has a CONSTANT outer height across all counts, sized for the
 * tallest pattern (the diamond at counts 4 and 5). Patterns shorter than
 * the slot are vertically centered, so a count=1 separator has empty
 * vertical space within the slot — but the outer footprint stays constant,
 * keeping text-to-text spacing identical regardless of count. Slot width
 * varies per-pattern (the wrapper's `flex justify-center` centers each
 * SVG on the page).
 *
 * Animation order is per-pattern. Counts 3–5 follow a "bottom-up bloom" —
 * for the triangle the two base dots reveal before the apex; for the
 * diamond the bottom dot reveals first, then the sides, then the top; for
 * the diamond + center the center anchors first, then the same bloom.
 * Count 6 reveals top-row left-to-right then bottom-row left-to-right.
 * All counts use the same sequential stagger interval — delay for dot N
 * is `initialDelay + order * stagger`. Counts 4–6 outlast the smooth-scroll
 * window by 60–340ms; the user is at rest when the trailing dots resolve.
 *
 * Each dot is an SVG <path> (M + 2 arcs, the same convention LeafDrawV2
 * and Sunrise use for their drawn-in dots) that reveals in two phases:
 *   1. STROKE DRAW — `stroke-dashoffset` animates from full circumference
 *      to 0, tracing the outline of the disc like a pen.
 *   2. FILL-IN — `fill-opacity` fades from 0 to 1 as the trailing portion
 *      of the stroke draw, so the user sees pen → outline → ink fills disc.
 *
 * The fill matters for rendering quality, not animation feel: a stroke-only
 * thick ring whose inner edge collapses to r=0 rasterizes less cleanly at
 * zoom than a true filled circle. The fill makes the final state a TRUE
 * filled disc, matching the rendering quality of the TabBar active-tab dot.
 *
 * Animation is pure CSS keyframes (`dot-stroke-draw` + `dot-fill-in`,
 * defined in index.css), so `prefers-reduced-motion` is honored
 * automatically by the global PRM rule. Each animation uses
 * `animation-fill-mode: both` so the FROM state holds before the per-dot
 * delay elapses and the TO state locks afterward — no flash, no replay
 * on back-then-forward navigation.
 *
 * Renders inside a centering wrapper. No interactivity — `aria-hidden` and
 * non-focusable, since this is purely visual punctuation.
 */

import { memo } from 'react';

// Fill animation runs as the trailing portion of the stroke draw. 48%
// gives the user a clear "pen traces outline first, then ink fills"
// progression — at the halfway mark of the draw, the stroke is well
// into its arc and the fill has just started fading in.
const FILL_FRACTION = 0.48;

// Per-count dot positions and animation order. Each (dx, dy) is relative
// to the pattern's bounding-box center; the component places the pattern
// center at the SVG slot center. Positive dy = down (matches SVG coords).
// `order` drives the per-dot stagger: delay = initialDelay + order * stagger.
function getDotPositions(count, hGap, vGap) {
  switch (count) {
    case 1:
      return [{ dx: 0, dy: 0, order: 0 }];

    case 2:
      return [
        { dx: -hGap / 2, dy: 0, order: 0 },
        { dx:  hGap / 2, dy: 0, order: 1 },
      ];

    case 3:
      // triangle: two base dots first (left → right), then top apex
      return [
        { dx: -hGap / 2, dy:  vGap / 2, order: 0 }, // bottom-left
        { dx:  hGap / 2, dy:  vGap / 2, order: 1 }, // bottom-right
        { dx:  0,        dy: -vGap / 2, order: 2 }, // top apex
      ];

    case 4:
      // diamond, bottom-up bloom: bottom → left → right → top
      return [
        { dx:  0,    dy:  vGap, order: 0 }, // bottom
        { dx: -hGap, dy:  0,    order: 1 }, // left
        { dx:  hGap, dy:  0,    order: 2 }, // right
        { dx:  0,    dy: -vGap, order: 3 }, // top
      ];

    case 5:
      // diamond + center: center anchors first, then bottom-up bloom
      return [
        { dx:  0,    dy:  0,    order: 0 }, // center anchor
        { dx:  0,    dy:  vGap, order: 1 }, // bottom
        { dx: -hGap, dy:  0,    order: 2 }, // left
        { dx:  hGap, dy:  0,    order: 3 }, // right
        { dx:  0,    dy: -vGap, order: 4 }, // top
      ];

    case 6:
      // 3×2 grid: top row left-to-right, then bottom row left-to-right
      return [
        { dx: -hGap, dy: -vGap / 2, order: 0 }, // top-left
        { dx:  0,    dy: -vGap / 2, order: 1 }, // top-center
        { dx:  hGap, dy: -vGap / 2, order: 2 }, // top-right
        { dx: -hGap, dy:  vGap / 2, order: 3 }, // bottom-left
        { dx:  0,    dy:  vGap / 2, order: 4 }, // bottom-center
        { dx:  hGap, dy:  vGap / 2, order: 5 }, // bottom-right
      ];

    default: {
      // 7+: horizontal line, sequential left-to-right
      const positions = [];
      const startX = -((count - 1) / 2) * hGap;
      for (let i = 0; i < count; i++) {
        positions.push({ dx: startX + i * hGap, dy: 0, order: i });
      }
      return positions;
    }
  }
}

function DotSeparator({
  count = 1,
  size = 8,
  color = 'var(--accent)',
  gap = 10,
  vGap = 10,
  stagger = 140,
  drawDuration = 420,
  initialDelay = 120,
}) {
  const radius = size / 4;
  const strokeWidth = size / 2;
  const circumference = Math.PI * size / 2; // 2 * π * radius
  const fillDuration = drawDuration * FILL_FRACTION;

  const positions = getDotPositions(count, gap, vGap);
  const maxAbsDx = positions.length === 0
    ? 0
    : Math.max(...positions.map((p) => Math.abs(p.dx)));

  // Slot dimensions. Height is CONSTANT across all counts (sized for the
  // tallest pattern — the diamond at counts 4 and 5) so the separator's
  // outer layout footprint stays identical regardless of count. Width
  // shrinks for narrower patterns; the wrapper's `flex justify-center`
  // centers each on the page.
  const pad = 2;
  const slotHeight = 2 * vGap + size + 2 * pad;
  const svgWidth = 2 * maxAbsDx + size + 2 * pad;
  const svgHeight = slotHeight;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  return (
    <div className="flex justify-center w-full" aria-hidden="true">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ overflow: 'visible' }}
        focusable="false"
      >
        {positions.map((pos, i) => {
          const cx = centerX + pos.dx;
          const cy = centerY + pos.dy;
          // Closed circle as M + 2 arcs — matches the convention used by
          // LeafDrawV2 and Sunrise so all three rasterize through the same
          // SVG path-rendering codepath.
          const dotPath
            = `M${cx},${cy - radius} `
            + `A${radius},${radius} 0 1,1 ${cx},${cy + radius} `
            + `A${radius},${radius} 0 1,1 ${cx},${cy - radius}`;
          const delay = initialDelay + pos.order * stagger;
          const fillDelay = delay + drawDuration - fillDuration;
          return (
            <path
              key={i}
              d={dotPath}
              fill={color}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={circumference}
              shapeRendering="geometricPrecision"
              style={{
                '--dot-circumference': circumference,
                animation:
                  `dot-stroke-draw ${drawDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}ms both, `
                  + `dot-fill-in ${fillDuration}ms ease-out ${fillDelay}ms both`,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}

export default memo(DotSeparator);

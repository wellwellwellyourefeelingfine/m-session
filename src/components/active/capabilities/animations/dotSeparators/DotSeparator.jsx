/**
 * DotSeparator — Tiny accent-colored dots that draw in like ink from a marker.
 *
 * Used to visually punctuate consecutive text blocks in `persistBlocks`
 * progressive-reveal sections. Each dot is an SVG <path> (M + 2 arcs, the
 * same convention LeafDrawV2 and Sunrise use for their drawn-in dots) that
 * reveals in two phases:
 *
 *   1. STROKE DRAW — `stroke-dashoffset` animates from full circumference
 *      to 0, tracing the outline of the disc like a pen.
 *   2. FILL-IN — `fill-opacity` fades from 0 to 1 as the trailing portion
 *      of the stroke draw, so the user sees pen → outline → ink fills disc.
 *
 * The fill matters for rendering quality, not animation feel. A stroke-only
 * thick ring whose inner edge collapses to r=0 (which is what we'd get from
 * `r = size/4, sw = size/2` alone) rasterizes less cleanly at zoom than a
 * true filled circle — there's a degenerate "stroke meets itself at the
 * center" geometry that some rasterizers handle inelegantly. Adding the
 * fill makes the final state a TRUE filled disc, matching the rendering
 * quality of the TabBar active-tab dot (CSS `border-radius:50%` on a
 * solid-fill element). The stroke is what provides the pen-draw effect
 * during reveal; the fill is what provides the clean rasterization at rest.
 *
 * Visual sizing matches the TabBar active-tab dot (8px solid accent disc).
 * `shape-rendering="geometricPrecision"` forces the highest-quality
 * rasterization pathway. `strokeLinecap="round"` + `strokeLinejoin="round"`
 * match LeafDrawV2/Sunrise so the seam at the path's start/end joins
 * smoothly during the dashoffset reveal.
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

function DotSeparator({
  count = 1,
  size = 8,
  color = 'var(--accent)',
  gap = 10,
  stagger = 140,
  drawDuration = 420,
  initialDelay = 120,
}) {
  const radius = size / 4;
  const strokeWidth = size / 2;
  const circumference = Math.PI * size / 2; // 2 * π * radius
  const fillDuration = drawDuration * FILL_FRACTION;

  // ViewBox padding so stroke caps don't clip at the edges.
  const pad = 2;
  const innerWidth = count <= 1 ? size : (count - 1) * gap + size;
  const totalWidth = innerWidth + pad * 2;
  const totalHeight = size + pad * 2;

  return (
    <div className="flex justify-center w-full" aria-hidden="true">
      <svg
        width={totalWidth}
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        focusable="false"
      >
        {Array.from({ length: count }, (_, i) => {
          const cx = pad + size / 2 + i * gap;
          const cy = pad + size / 2;
          // Closed circle as M + 2 arcs — matches the convention used by
          // LeafDrawV2 and Sunrise for their drawn-in dots, so all three
          // rasterize through the same SVG path-rendering codepath.
          const dotPath
            = `M${cx},${cy - radius} `
            + `A${radius},${radius} 0 1,1 ${cx},${cy + radius} `
            + `A${radius},${radius} 0 1,1 ${cx},${cy - radius}`;
          const delay = initialDelay + i * stagger;
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

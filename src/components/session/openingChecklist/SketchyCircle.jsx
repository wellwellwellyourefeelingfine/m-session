/**
 * SketchyCircle — one continuous hand-drawn loop that circles a focal point
 * a little more than twice, animated as if someone is drawing with a thick
 * crayon.
 *
 * A single `<path>` with 8 cubic Bezier segments — one explicit `C` followed
 * by seven `S` (smooth) commands. Using `S` forces each segment's incoming
 * control point to be the reflection of the previous segment's outgoing
 * control, guaranteeing C1 continuity at every join. Each arc is a
 * near-perfect quarter-circle with mild control-point wobble (~2-3 units on
 * a 100-unit canvas), so the whole thing reads as "a hand approximately
 * drawing a circle" rather than "a shape made of visible arcs".
 *
 * The path sweeps ~750° total — two full loops plus a ~30° overshoot — so
 * the ending stroke visibly crosses over the starting stroke near the top.
 *
 * Animation loops forever:
 *   draw (~2.6s, ease-in → linear → ease-out) → hold (~3s) → fade out (~0.8s)
 *   → restart (invisible because the path is fully dashed-off on cycle start).
 *
 * Props:
 *   size: number — rendered width/height in px (default 140)
 *   strokeWidth: number — stroke thickness (default 3 — thick crayon feel)
 *   color: string — stroke color (default var(--accent))
 */

export default function SketchyCircle({
  size = 140,
  strokeWidth = 3,
  color = 'var(--accent)',
}) {
  // 8 segments: 4 per loop. Control points intentionally pushed/pulled ~6-10
  // units away from the mathematical circle position, with per-segment radius
  // drifting between ~36 and ~48. Each quadrant bulges or dips a bit
  // differently so the two passes don't mirror each other. Still reads as
  // "roughly a circle", just clearly drawn by an unsteady hand.
  const d = [
    'M 50 10',
    // ── Loop 1 (r drifts 36→44) ─────────────────────────────
    'C 78 9, 94 24, 89 54',       // 12 → 3, bulges right-up then pulls in
    'S 66 86, 47 92',              // 3 → 6, drops hard then drifts left
    'S 4 68, 13 46',               // 6 → 9, pulls out left then tightens
    'S 32 15, 55 7',               // 9 → just past 12, top flattens high
    // ── Loop 2 (r drifts 38→48, ends past start) ───────────
    'S 96 22, 96 54',              // 12 → 3, wide swing right
    'S 66 96, 45 93',              // 3 → 6, drops wider
    'S 2 74, 4 44',                // 6 → 9, pulls far left
    'S 22 13, 28 13',              // 9 → ~11 o'clock, finishes horizontal (no hook)
  ].join(' ');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="100"
        style={{
          // dash=100 (=pathLength), gap=200 (=2×pathLength). The oversized gap
          // ensures that at the "invisible" offset (105) the nearest dash sits
          // fully off the path — no round-cap artifact protrudes onto the path.
          strokeDasharray: '100 200',
          strokeDashoffset: 105,
          animation: 'sketchy-circle-loop 6400ms infinite',
        }}
      />

      <style>{`
        @keyframes sketchy-circle-loop {
          /* Pre-draw delay (0 → 1.5% ≈ 100ms) — path invisible, hand hovers */
          0% {
            stroke-dashoffset: 105;
            opacity: 1;
            animation-timing-function: linear;
          }

          /* Draw phase (1.5% → 42.5% ≈ 2626ms) — ease-in, linear middle, ease-out */
          1.5% {
            stroke-dashoffset: 105;
            animation-timing-function: cubic-bezier(0.4, 0, 1, 1);
          }
          8.5% {
            stroke-dashoffset: 97;
            animation-timing-function: linear;
          }
          37.5% {
            stroke-dashoffset: 8;
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
          42.5% {
            stroke-dashoffset: 0;
            opacity: 1;
            animation-timing-function: linear;
          }

          /* Hold phase (42.5 → 88% ≈ 2912ms) */
          88% {
            stroke-dashoffset: 0;
            opacity: 1;
            animation-timing-function: ease-in-out;
          }

          /* Fade-out phase (88 → 100% ≈ 770ms) */
          100% {
            stroke-dashoffset: 0;
            opacity: 0;
          }
        }
      `}</style>
    </svg>
  );
}

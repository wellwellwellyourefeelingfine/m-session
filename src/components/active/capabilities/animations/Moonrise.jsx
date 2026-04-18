/**
 * Moonrise — crescent moon above horizon with small accent stars.
 * Used by the Closing Ritual transition.
 *
 * Gentle upward drift. 2-3 small stars with staggered subtle pulse.
 */

import Horizon, { HORIZON_Y_RATIO } from './Horizon';

const DEFAULT_SIZE = 160;

export default function Moonrise({ size = DEFAULT_SIZE, strokeWidth = 2 }) {
  const horizonY = size * HORIZON_Y_RATIO;
  const moonCx = size / 2;
  // Moon sits above the horizon (fully visible)
  const moonCy = horizonY - size * 0.22;
  const moonR = size * 0.12;

  // Crescent created by overlapping two circles — outer minus inner shape.
  // We draw an arc path for the crescent.
  const crescentInset = moonR * 0.55;  // horizontal offset of the "bite" circle

  // Stars — 3 small dots, staggered positions above/around the moon
  const stars = [
    { cx: moonCx - size * 0.28, cy: horizonY - size * 0.42, r: size * 0.012, delay: '0s' },
    { cx: moonCx + size * 0.30, cy: horizonY - size * 0.34, r: size * 0.010, delay: '1.2s' },
    { cx: moonCx + size * 0.18, cy: horizonY - size * 0.55, r: size * 0.014, delay: '2.4s' },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Moon + star cluster — gentle upward drift */}
      <g style={{ animation: 'moonrise-drift 7s ease-in-out infinite' }}>
        {/* Stars (accent fill, subtle pulse) */}
        {stars.map((star, i) => (
          <circle
            key={i}
            cx={star.cx}
            cy={star.cy}
            r={star.r}
            fill="var(--accent)"
            style={{
              animation: 'moonrise-star 3.5s ease-in-out infinite',
              animationDelay: star.delay,
            }}
          />
        ))}

        {/* Crescent — path combining an outer arc and an inner bite */}
        <path
          d={describeCrescent(moonCx, moonCy, moonR, crescentInset)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      </g>

      <Horizon size={size} strokeWidth={strokeWidth} />

      <style>{`
        @keyframes moonrise-drift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes moonrise-star {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </svg>
  );
}

/**
 * Build an SVG path for a crescent moon shape:
 * outer full arc + inner partial arc cut out (standard crescent construction).
 */
function describeCrescent(cx, cy, r, inset) {
  // Outer circle: start at top, sweep to bottom (clockwise, large arc)
  const topX = cx;
  const topY = cy - r;
  const bottomX = cx;
  const bottomY = cy + r;

  // Inner (bite) circle: radius slightly smaller, centered offset-right
  const innerR = r * 0.82;
  const innerCx = cx + inset;

  return [
    `M ${topX} ${topY}`,
    `A ${r} ${r} 0 1 0 ${bottomX} ${bottomY}`,   // outer arc: top → bottom, going LEFT (crescent opens right)
    `A ${innerR} ${innerR} 0 1 1 ${topX} ${topY}`, // inner arc: bottom → top, coming back via the bite
    'Z',
  ].join(' ');
}

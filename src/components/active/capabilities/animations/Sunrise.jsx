/**
 * Sunrise — sun peeking above a flat horizon line.
 * Used by the Opening Ritual transition.
 *
 * Gentle pulse on the visible arc, short radiating rays emerging from above.
 */

import Horizon, { HORIZON_Y_RATIO } from './Horizon';

const DEFAULT_SIZE = 160;

export default function Sunrise({ size = DEFAULT_SIZE, strokeWidth = 2 }) {
  const horizonY = size * HORIZON_Y_RATIO;
  const sunCx = size / 2;
  const sunCy = horizonY;       // sun center sits on the horizon
  const sunR = size * 0.16;     // ~26px at size=160 — half visible above horizon

  // Ray lines emerging from the visible (upper) arc
  const rays = [
    { angle: -90, length: 0.12 },   // top
    { angle: -65, length: 0.10 },
    { angle: -115, length: 0.10 },
    { angle: -40, length: 0.08 },
    { angle: -140, length: 0.08 },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Gentle pulse on the entire sun group */}
      <g style={{ transformOrigin: `${sunCx}px ${sunCy}px`, animation: 'sun-breathe 5s ease-in-out infinite' }}>
        {/* Rays (drawn first so arc renders on top) */}
        {rays.map((ray, i) => {
          const rad = (ray.angle * Math.PI) / 180;
          const innerR = sunR + size * 0.03;
          const outerR = sunR + size * (0.03 + ray.length);
          const x1 = sunCx + innerR * Math.cos(rad);
          const y1 = sunCy + innerR * Math.sin(rad);
          const x2 = sunCx + outerR * Math.cos(rad);
          const y2 = sunCy + outerR * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="var(--accent)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{
                animation: `sun-ray-pulse 4s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          );
        })}

        {/* Sun — full circle, but clipped to only show the upper half above horizon */}
        <clipPath id={`sunrise-clip-${size}`}>
          <rect x={0} y={0} width={size} height={horizonY} />
        </clipPath>
        <circle
          cx={sunCx}
          cy={sunCy}
          r={sunR}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          clipPath={`url(#sunrise-clip-${size})`}
        />
      </g>

      {/* Horizon line — outside the breathing group so it stays rock steady */}
      <Horizon size={size} strokeWidth={strokeWidth} />

      <style>{`
        @keyframes sun-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes sun-ray-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </svg>
  );
}

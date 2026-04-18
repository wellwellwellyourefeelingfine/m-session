/**
 * FullSun — sun fully risen above horizon, rays radiating outward.
 * Used by the Peak Transition.
 *
 * The circle is centered above the horizon. Rays pulse in length, giving a
 * bright, open impression.
 */

import Horizon, { HORIZON_Y_RATIO } from './Horizon';

const DEFAULT_SIZE = 160;

export default function FullSun({ size = DEFAULT_SIZE, strokeWidth = 2 }) {
  const horizonY = size * HORIZON_Y_RATIO;
  const sunCx = size / 2;
  // Sun sits a comfortable distance above the horizon, centered vertically
  const sunCy = horizonY - size * 0.28;
  const sunR = size * 0.13;

  // 8 rays evenly spaced around the sun
  const rays = Array.from({ length: 8 }, (_, i) => ({
    angle: (i / 8) * 360 - 90,  // start at top, go clockwise
  }));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Rays — pulse individually in length */}
      <g style={{ transformOrigin: `${sunCx}px ${sunCy}px` }}>
        {rays.map((ray, i) => {
          const rad = (ray.angle * Math.PI) / 180;
          const innerR = sunR + size * 0.04;
          const x1 = sunCx + innerR * Math.cos(rad);
          const y1 = sunCy + innerR * Math.sin(rad);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x1}
              y2={y1}
              stroke="var(--accent)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{
                animation: `full-sun-ray 4s ease-in-out infinite`,
                animationDelay: `${(i / 8) * 4}s`,
                transform: `translate(${size * 0.08 * Math.cos(rad)}px, ${size * 0.08 * Math.sin(rad)}px)`,
                transformOrigin: `${x1}px ${y1}px`,
              }}
            />
          );
        })}
      </g>

      {/* Sun */}
      <circle
        cx={sunCx}
        cy={sunCy}
        r={sunR}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={strokeWidth}
        style={{
          transformOrigin: `${sunCx}px ${sunCy}px`,
          animation: 'full-sun-breathe 5s ease-in-out infinite',
        }}
      />

      {/* Horizon */}
      <Horizon size={size} strokeWidth={strokeWidth} />

      <style>{`
        @keyframes full-sun-breathe {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.92; }
        }
        @keyframes full-sun-ray {
          0%, 100% { transform: scale(0.7); opacity: 0.6; }
          50% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </svg>
  );
}

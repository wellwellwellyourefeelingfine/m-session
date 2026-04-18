/**
 * Sunset — sun descending toward horizon, partially visible.
 * Used by the Peak-to-Integration (Synthesis) Transition.
 *
 * The circle sits 60-70% above the horizon. Fewer, shorter rays than FullSun.
 * Subtle downward-drift animation loop.
 */

import Horizon, { HORIZON_Y_RATIO } from './Horizon';

const DEFAULT_SIZE = 160;

export default function Sunset({ size = DEFAULT_SIZE, strokeWidth = 2 }) {
  const horizonY = size * HORIZON_Y_RATIO;
  const sunCx = size / 2;
  // Sun center sits just above the horizon — about 60-70% visible above the line
  const sunR = size * 0.15;
  const sunCy = horizonY - sunR * 0.35;  // ~65% of circle above horizon

  // Fewer, shorter rays — mostly the upper arc
  const rays = [
    { angle: -90, length: 0.08 },   // straight up
    { angle: -60, length: 0.07 },
    { angle: -120, length: 0.07 },
    { angle: -30, length: 0.06 },
    { angle: -150, length: 0.06 },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Sun group — subtle downward drift */}
      <g style={{ animation: 'sunset-drift 8s ease-in-out infinite' }}>
        {/* Rays */}
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
                animation: `sunset-ray-fade 5s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          );
        })}

        {/* Sun — full circle, clipped so only the portion above horizon shows */}
        <clipPath id={`sunset-clip-${size}`}>
          <rect x={0} y={0} width={size} height={horizonY} />
        </clipPath>
        <circle
          cx={sunCx}
          cy={sunCy}
          r={sunR}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          clipPath={`url(#sunset-clip-${size})`}
        />
      </g>

      <Horizon size={size} strokeWidth={strokeWidth} />

      <style>{`
        @keyframes sunset-drift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(3px); }
        }
        @keyframes sunset-ray-fade {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </svg>
  );
}

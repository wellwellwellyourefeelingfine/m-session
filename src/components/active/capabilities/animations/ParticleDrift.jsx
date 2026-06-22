import { memo } from 'react';

const PARTICLES = [
  { x: 24, y: 34, r: 2.1, dx: 6, dy: -5, delay: -1 },
  { x: 41, y: 26, r: 1.7, dx: -5, dy: 4, delay: -8 },
  { x: 63, y: 33, r: 2.4, dx: 4, dy: 7, delay: -4 },
  { x: 86, y: 24, r: 1.8, dx: -6, dy: 5, delay: -12 },
  { x: 97, y: 51, r: 2.2, dx: 5, dy: -3, delay: -6 },
  { x: 76, y: 68, r: 1.7, dx: -4, dy: -7, delay: -15 },
  { x: 53, y: 78, r: 2.1, dx: 6, dy: -2, delay: -10 },
  { x: 30, y: 88, r: 1.8, dx: -3, dy: -6, delay: -3 },
  { x: 21, y: 58, r: 1.5, dx: 7, dy: 3, delay: -14 },
  { x: 62, y: 55, r: 1.4, dx: -5, dy: 5, delay: -5 },
];

export default memo(function ParticleDrift({ size = 120 }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      style={{
        overflow: 'visible',
        color: 'color-mix(in srgb, var(--accent) 72%, var(--color-text-primary) 28%)',
        opacity: 0.96,
      }}
    >
      <style>{`
        @keyframes particle-drift {
          0%, 100% {
            transform: translate(calc(var(--drift-x) * -0.35px), calc(var(--drift-y) * 0.25px));
            opacity: 0.42;
          }
          50% {
            transform: translate(calc(var(--drift-x) * 1px), calc(var(--drift-y) * 1px));
            opacity: 0.92;
          }
        }

        @keyframes particle-trail {
          0%, 100% { stroke-dashoffset: 0; opacity: 0.18; }
          50% { stroke-dashoffset: -14; opacity: 0.48; }
        }

        .particle-drift {
          transform-box: fill-box;
          transform-origin: center;
          animation: particle-drift 14s ease-in-out infinite;
          animation-delay: var(--particle-delay);
        }

        .particle-trail {
          animation: particle-trail 14s ease-in-out infinite;
          animation-delay: var(--particle-delay);
          stroke-dasharray: 6 9;
        }

        @media (prefers-reduced-motion: reduce) {
          .particle-drift,
          .particle-trail { animation: none; opacity: 0.68; }
        }
      `}</style>

      <g fill="none" stroke="currentColor" strokeLinecap="round" vectorEffect="non-scaling-stroke">
        {PARTICLES.map((particle) => (
          <g
            key={`${particle.x}-${particle.y}`}
            className="particle-drift"
            style={{
              '--drift-x': particle.dx,
              '--drift-y': particle.dy,
              '--particle-delay': `${particle.delay}s`,
            }}
          >
            <path
              className="particle-trail"
              d={`M${particle.x - particle.dx * 0.8} ${particle.y - particle.dy * 0.8} L${particle.x} ${particle.y}`}
              strokeWidth="1.9"
              opacity="0.42"
            />
            <circle cx={particle.x} cy={particle.y} r={particle.r} fill="currentColor" stroke="none" />
          </g>
        ))}
      </g>
    </svg>
  );
});

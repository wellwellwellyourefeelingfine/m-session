import { memo } from 'react';

const POINTS = [
  { x: 25, y: 38, r: 2.6, delay: -1.2, dx: 4, dy: -3 },
  { x: 43, y: 29, r: 2.1, delay: -4.1, dx: -3, dy: 3 },
  { x: 62, y: 43, r: 2.9, delay: -2.6, dx: 3, dy: 4 },
  { x: 82, y: 31, r: 2.2, delay: -5.4, dx: -4, dy: -2 },
  { x: 95, y: 56, r: 2.5, delay: -0.8, dx: 2, dy: 4 },
  { x: 72, y: 76, r: 2.0, delay: -3.7, dx: -3, dy: -3 },
  { x: 48, y: 70, r: 2.5, delay: -6.2, dx: 4, dy: 2 },
  { x: 31, y: 89, r: 2.0, delay: -2.0, dx: -2, dy: -4 },
];

const LINES = [
  [0, 1], [1, 2], [2, 3], [2, 6], [3, 4], [4, 5], [5, 6], [6, 7],
];

export default memo(function ConstellationDrift({ size = 120 }) {
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
        @keyframes constellation-drift {
          0%, 100% { transform: translate(-4px, 3px) rotate(-1.8deg); }
          50% { transform: translate(4px, -3px) rotate(2.2deg); }
        }

        @keyframes constellation-pulse {
          0%, 100% {
            opacity: 0.48;
            transform: translate(calc(var(--dot-dx) * -0.45px), calc(var(--dot-dy) * 0.35px)) scale(0.9);
          }
          50% {
            opacity: 0.94;
            transform: translate(calc(var(--dot-dx) * 1px), calc(var(--dot-dy) * 1px)) scale(1.12);
          }
        }

        @keyframes constellation-line-flow {
          0% { stroke-dashoffset: 0; opacity: 0.3; }
          50% { opacity: 0.58; }
          100% { stroke-dashoffset: -32; opacity: 0.3; }
        }

        .constellation-group {
          transform-origin: 60px 60px;
          animation: constellation-drift 18s ease-in-out infinite;
        }

        .constellation-line {
          animation: constellation-line-flow 18s ease-in-out infinite;
          stroke-dasharray: 6 10;
        }

        .constellation-dot {
          transform-box: fill-box;
          transform-origin: center;
          animation: constellation-pulse 10s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .constellation-group,
          .constellation-line,
          .constellation-dot { animation: none; }
        }
      `}</style>

      <g className="constellation-group" fill="none" stroke="currentColor" strokeLinecap="round">
        {LINES.map(([from, to]) => (
          <line
            key={`${from}-${to}`}
            className="constellation-line"
            x1={POINTS[from].x}
            y1={POINTS[from].y}
            x2={POINTS[to].x}
            y2={POINTS[to].y}
            strokeWidth="2"
            opacity="0.52"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {POINTS.map((point, index) => (
          <circle
            key={`${point.x}-${point.y}`}
            className="constellation-dot"
            cx={point.x}
            cy={point.y}
            r={point.r}
            fill="currentColor"
            stroke="none"
            style={{
              '--dot-dx': point.dx,
              '--dot-dy': point.dy,
              animationDelay: `${point.delay + index * 0.1}s`,
            }}
          />
        ))}
      </g>
    </svg>
  );
});

import { memo } from 'react';

const SHAPES = [
  {
    points: '60 17 97 39 97 81 60 103 23 81 23 39',
    delay: -1,
    opacity: 0.64,
  },
  {
    points: '60 28 88 60 60 92 32 60',
    delay: -5,
    opacity: 0.76,
  },
  {
    points: '60 40 79 50 79 70 60 80 41 70 41 50',
    delay: -9,
    opacity: 0.86,
  },
];

export default memo(function GeometricPulse({ size = 120 }) {
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
        @keyframes geometric-pulse {
          0%, 100% {
            transform: scale(0.88) rotate(-5deg);
            opacity: 0.42;
            stroke-width: 1.7;
          }
          50% {
            transform: scale(1.04) rotate(5deg);
            opacity: 0.94;
            stroke-width: 2.8;
          }
        }

        @keyframes geometric-dash {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -64; }
        }

        .geometric-shape {
          transform-box: view-box;
          transform-origin: 60px 60px;
          animation:
            geometric-pulse 15s ease-in-out infinite,
            geometric-dash 24s linear infinite;
          animation-delay: var(--geometry-delay), var(--geometry-delay);
          stroke-dasharray: 22 16;
        }

        @media (prefers-reduced-motion: reduce) {
          .geometric-shape { animation: none; opacity: 0.72; }
        }
      `}</style>

      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        {SHAPES.map((shape) => (
          <polygon
            key={shape.points}
            className="geometric-shape"
            points={shape.points}
            opacity={shape.opacity}
            strokeWidth="2.75"
            style={{ '--geometry-delay': `${shape.delay}s` }}
          />
        ))}
        <circle cx="60" cy="60" r="3.1" fill="currentColor" opacity="0.72" stroke="none" />
      </g>
    </svg>
  );
});

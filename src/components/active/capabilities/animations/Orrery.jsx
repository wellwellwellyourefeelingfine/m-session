import { memo } from 'react';

const BODIES = [
  { r: 17, size: 2.4, dur: 18, delay: -3, opacity: 0.82 },
  { r: 29, size: 3.1, dur: 31, delay: -12, opacity: 0.76 },
  { r: 42, size: 2.35, dur: 47, delay: -23, opacity: 0.68 },
];

export default memo(function Orrery({ size = 120 }) {
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
        @keyframes orrery-turn {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes orrery-center {
          0%, 100% { opacity: 0.52; transform: scale(0.92); }
          50% { opacity: 0.9; transform: scale(1.08); }
        }

        @keyframes orrery-trail {
          0% { stroke-dashoffset: 0; opacity: 0.22; }
          50% { opacity: 0.42; }
          100% { stroke-dashoffset: -92; opacity: 0.22; }
        }

        .orrery-orbiting {
          transform-origin: 60px 60px;
          animation: orrery-turn var(--orrery-duration) linear infinite;
          animation-delay: var(--orrery-delay);
        }

        .orrery-center {
          transform-box: fill-box;
          transform-origin: center;
          animation: orrery-center 12s ease-in-out infinite;
        }

        .orrery-orbit {
          animation: orrery-trail 20s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .orrery-orbiting,
          .orrery-orbit,
          .orrery-center { animation: none; }
        }
      `}</style>

      <g fill="none" stroke="currentColor" strokeLinecap="round" vectorEffect="non-scaling-stroke">
        {BODIES.map((body) => (
          <circle
            key={`orbit-${body.r}`}
            className="orrery-orbit"
            cx="60"
            cy="60"
            r={body.r}
            strokeWidth="1.85"
            strokeDasharray="18 20"
            opacity="0.28"
          />
        ))}

        <circle className="orrery-center" cx="60" cy="60" r="4.2" fill="currentColor" stroke="none" />

        {BODIES.map((body, index) => (
          <g
            key={body.r}
            className="orrery-orbiting"
            style={{
              '--orrery-duration': `${body.dur}s`,
              '--orrery-delay': `${body.delay}s`,
            }}
          >
            <circle
              cx={60 + body.r}
              cy="60"
              r={body.size}
              fill="currentColor"
              stroke="none"
              opacity={body.opacity}
            />
              {index === 1 && (
                <circle
                  cx={60 + body.r + 5}
                  cy="60"
                r="1.2"
                fill="currentColor"
                stroke="none"
                opacity="0.5"
              />
            )}
          </g>
        ))}
      </g>
    </svg>
  );
});

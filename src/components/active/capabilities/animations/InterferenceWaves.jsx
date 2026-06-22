import { memo } from 'react';

const CENTER = { x: 60, y: 60 };
const SOURCE_DISTANCE = 18;
const SOURCES = [
  { x: CENTER.x - SOURCE_DISTANCE, y: CENTER.y, delay: -1.4 },
  { x: CENTER.x + SOURCE_DISTANCE, y: CENTER.y, delay: -4.1 },
];
const PATH_DIFFERENCES = [-16, -10, -5, 0, 5, 10, 16];

function asinh(value) {
  return Math.log(value + Math.sqrt(value * value + 1));
}

function buildHyperbolaPath(pathDifference) {
  if (pathDifference === 0) {
    return `M${CENTER.x} 19 C${CENTER.x - 4} 34 ${CENTER.x - 4} 48 ${CENTER.x} ${CENTER.y} C${CENTER.x + 4} 72 ${CENTER.x + 4} 86 ${CENTER.x} 101`;
  }

  const semiMajor = Math.abs(pathDifference) / 2;
  const semiMinor = Math.sqrt(SOURCE_DISTANCE * SOURCE_DISTANCE - semiMajor * semiMajor);
  const sign = Math.sign(pathDifference);
  const uMax = Math.min(asinh(42 / semiMinor), asinh((50 - semiMajor) / semiMajor));
  const steps = 18;
  const points = [];

  for (let index = 0; index <= steps; index++) {
    const t = -uMax + (2 * uMax * index) / steps;
    const x = CENTER.x + sign * semiMajor * Math.cosh(t);
    const y = CENTER.y + semiMinor * Math.sinh(t);
    points.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }

  return `M${points.join(' L')}`;
}

const INTERFERENCE_BANDS = PATH_DIFFERENCES.map((difference) => ({
  difference,
  d: buildHyperbolaPath(difference),
}));

export default memo(function InterferenceWaves({ size = 120 }) {
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
        @keyframes source-wavefront {
          0% {
            transform: scale(0.18);
            opacity: 0;
            stroke-width: 3.2;
          }
          14% {
            opacity: 0.82;
          }
          72% {
            transform: scale(1);
            opacity: 0.28;
            stroke-width: 1.15;
          }
          100% {
            transform: scale(1.16);
            opacity: 0;
            stroke-width: 0.8;
          }
        }

        @keyframes interference-band-pulse {
          0%, 100% {
            stroke-dashoffset: 0;
            opacity: 0.26;
            stroke-width: 1.4;
          }
          50% {
            stroke-dashoffset: -16;
            opacity: 0.74;
            stroke-width: 2.25;
          }
        }

        @keyframes interference-source-breathe {
          0%, 100% { transform: scale(0.92); opacity: 0.66; }
          50% { transform: scale(1.12); opacity: 0.92; }
        }

        .source-wavefront {
          transform-box: view-box;
          transform-origin: var(--source-x) var(--source-y);
          animation: source-wavefront 8.8s ease-out infinite;
          animation-delay: var(--wave-delay);
        }

        .interference-band {
          animation: interference-band-pulse 9.6s ease-in-out infinite;
          animation-delay: var(--band-delay);
          stroke-dasharray: 11 10;
        }

        .interference-source {
          transform-box: fill-box;
          transform-origin: center;
          animation: interference-source-breathe 8.8s ease-in-out infinite;
          animation-delay: var(--source-delay);
        }

        @media (prefers-reduced-motion: reduce) {
          .source-wavefront,
          .interference-band,
          .interference-source { animation: none; opacity: 0.62; }
        }
      `}</style>

      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        {SOURCES.map((source, sourceIndex) => (
          <g
            key={`${source.x}-${source.y}`}
            style={{
              '--source-x': `${source.x}px`,
              '--source-y': `${source.y}px`,
              '--source-delay': `${source.delay}s`,
            }}
          >
            {[16, 28, 40].map((radius, ringIndex) => (
              <circle
                key={`${source.x}-${radius}`}
                className="source-wavefront"
                cx={source.x}
                cy={source.y}
                r={radius}
                strokeWidth="2"
                opacity="0.32"
                style={{
                  '--wave-delay': `${source.delay - ringIndex * 2.1 - sourceIndex * 0.35}s`,
                }}
              />
            ))}
          </g>
        ))}

        {INTERFERENCE_BANDS.map((band, index) => (
          <path
            key={band.d}
            className="interference-band"
            d={band.d}
            strokeWidth={band.difference === 0 ? 2.2 : 1.75}
            opacity={band.difference === 0 ? 0.52 : 0.36}
            style={{ '--band-delay': `${index * -0.7}s` }}
          />
        ))}

        {SOURCES.map((source) => (
          <circle
            key={`source-${source.x}`}
            className="interference-source"
            cx={source.x}
            cy={source.y}
            r="3"
            fill="currentColor"
            stroke="none"
            style={{ '--source-delay': `${source.delay}s` }}
          />
        ))}
      </g>
    </svg>
  );
});

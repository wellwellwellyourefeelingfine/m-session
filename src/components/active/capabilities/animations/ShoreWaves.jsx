import { memo } from 'react';

const WAVE_PATHS = [
  'M12 48 C23 42 32 54 43 48 S63 42 74 48 S94 54 108 48',
  'M10 62 C23 56 34 68 46 62 S67 56 79 62 S98 68 110 62',
  'M14 77 C26 71 37 83 49 77 S69 71 82 77 S99 83 106 77',
];

export default memo(function ShoreWaves({ size = 120 }) {
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
        @keyframes shore-wave-lap {
          0%, 100% { transform: translateY(-5px) scaleX(0.965); opacity: 0.34; }
          48% { transform: translateY(6px) scaleX(1.018); opacity: 0.92; }
          72% { transform: translateY(10px) scaleX(0.995); opacity: 0.58; }
        }

        @keyframes shore-break-weight {
          0%, 100% { stroke-width: 1.55; }
          48% { stroke-width: 3.25; }
          72% { stroke-width: 2.2; }
        }

        @keyframes shore-foam-drift {
          0%, 100% { stroke-dashoffset: 0; opacity: 0.28; }
          50% { stroke-dashoffset: -28; opacity: 0.72; }
        }

        .shore-wave {
          transform-box: fill-box;
          transform-origin: center;
          animation: shore-wave-lap 13s ease-in-out infinite;
        }

        .shore-foam {
          animation: shore-foam-drift 13s ease-in-out infinite;
        }

        .shore-crest {
          animation: shore-break-weight 13s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .shore-wave,
          .shore-foam,
          .shore-crest { animation: none; opacity: 0.72; }
        }
      `}</style>

      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M18 95 C32 90 45 95 58 91 C72 86 84 91 101 84"
          strokeWidth="2.25"
          opacity="0.52"
          vectorEffect="non-scaling-stroke"
        />

        {WAVE_PATHS.map((d, index) => (
          <g key={d} className="shore-wave" style={{ animationDelay: `${index * -3.2}s` }}>
            <path
              className="shore-crest"
              d={d}
              strokeWidth={2.35 - index * 0.1}
              opacity={0.72 - index * 0.08}
              vectorEffect="non-scaling-stroke"
              style={{ animationDelay: `${index * -3.2}s` }}
            />
            <path
              className="shore-foam"
              d={d}
              strokeWidth="1.55"
              strokeDasharray="7 12"
              opacity="0.32"
              vectorEffect="non-scaling-stroke"
              style={{ animationDelay: `${index * -3.2}s` }}
            />
          </g>
        ))}
      </g>
    </svg>
  );
});

import { memo } from 'react';

const CLOUDS = [
  {
    outline: 'M14 60 C22 47 38 47 45 58 C54 43 76 43 84 59 C95 57 105 64 109 76 C90 84 57 84 31 78 C22 76 16 70 14 60',
    wisps: [
      'M27 61 C39 55 52 55 66 61',
      'M45 72 C59 68 77 68 93 73',
    ],
    y: -4,
    duration: 32,
    delay: -9,
    opacity: 0.78,
  },
  {
    outline: 'M21 43 C30 34 42 36 47 46 C55 35 72 36 78 48 C86 47 94 53 98 62 C81 68 55 68 35 64 C27 62 22 55 21 43',
    wisps: [
      'M34 48 C45 44 56 45 68 50',
      'M42 58 C54 55 68 56 82 61',
    ],
    y: 17,
    duration: 40,
    delay: -22,
    opacity: 0.58,
  },
];

export default memo(function FractalClouds({ size = 120 }) {
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
        @keyframes cloud-drift {
          0%, 100% { transform: translate(-10px, var(--cloud-y)); }
          50% { transform: translate(10px, calc(var(--cloud-y) - 2px)); }
        }

        @keyframes cloud-line-breathe {
          0%, 100% { stroke-dashoffset: 0; opacity: calc(var(--cloud-opacity) * 0.62); }
          50% { stroke-dashoffset: -22; opacity: var(--cloud-opacity); }
        }

        .cloud-drift-group {
          animation: cloud-drift var(--cloud-duration) ease-in-out infinite;
          animation-delay: var(--cloud-delay);
        }

        .cloud-line {
          animation: cloud-line-breathe var(--cloud-duration) ease-in-out infinite;
          animation-delay: var(--cloud-delay);
          stroke-dasharray: 18 12;
        }

        @media (prefers-reduced-motion: reduce) {
          .cloud-drift-group,
          .cloud-line { animation: none; opacity: var(--cloud-opacity); }
        }
      `}</style>

      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        {CLOUDS.map((cloud) => (
          <g
            key={cloud.outline}
            className="cloud-drift-group"
            style={{
              '--cloud-y': `${cloud.y}px`,
              '--cloud-duration': `${cloud.duration}s`,
              '--cloud-delay': `${cloud.delay}s`,
              '--cloud-opacity': cloud.opacity,
            }}
          >
            <path
              className="cloud-line"
              d={cloud.outline}
              strokeWidth="2.8"
              opacity={cloud.opacity}
            />
            {cloud.wisps.map((wisp) => (
              <path
                key={wisp}
                className="cloud-line"
                d={wisp}
                strokeWidth="2.15"
                opacity={cloud.opacity * 0.68}
              />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
});

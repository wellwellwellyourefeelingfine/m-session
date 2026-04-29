import { memo } from 'react';

const RINGS = [
  'M60 18 C74 18 86 27 94 39 C103 53 101 69 92 82 C82 96 66 102 50 99 C35 96 24 86 20 70 C16 55 21 39 33 29 C41 22 49 18 60 18',
  'M60 31 C70 31 79 37 85 46 C91 56 90 67 84 77 C77 88 65 93 53 91 C42 89 33 82 30 70 C27 59 31 48 40 40 C46 34 53 31 60 31',
  'M60 43 C67 43 73 47 77 53 C81 60 80 68 75 75 C70 82 63 85 55 84 C48 83 42 78 40 70 C38 63 41 55 46 50 C50 46 55 43 60 43',
  'M60 54 C64 54 68 56 70 60 C73 65 72 70 69 74 C66 78 61 80 56 78 C52 77 49 73 48 68 C47 63 50 59 53 56 C55 55 58 54 60 54',
];

export default memo(function ContourRings({ size = 120 }) {
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
        @keyframes contour-rings-breathe {
          0%, 100% { transform: scale(0.976) rotate(-0.8deg); opacity: 0.48; }
          50% { transform: scale(1.032) rotate(1deg); opacity: 0.9; }
        }

        @keyframes contour-rings-dash {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -96; }
        }

        .contour-ring {
          transform-box: fill-box;
          transform-origin: center;
          animation:
            contour-rings-breathe 14s ease-in-out infinite,
            contour-rings-dash 28s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .contour-ring { animation: none; opacity: 0.58; }
        }
      `}</style>

      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {RINGS.map((d, index) => (
          <path
            key={d}
            className="contour-ring"
            d={d}
            strokeWidth={index === 0 ? 3 : 2.5}
            strokeDasharray={`${18 + index * 7} ${17 + index * 5}`}
            vectorEffect="non-scaling-stroke"
            style={{
              animationDelay: `${index * -2.6}s, ${index * -4.5}s`,
              opacity: 0.48 + index * 0.1,
            }}
          />
        ))}
        <circle cx="60" cy="67" r="2.7" fill="currentColor" opacity="0.58" />
      </g>
    </svg>
  );
});

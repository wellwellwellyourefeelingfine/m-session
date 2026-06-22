import { memo } from 'react';

const OUTER_A = 'M60 22 C77 23 93 38 94 56 C95 76 78 94 58 91 C39 88 24 76 26 57 C28 38 43 20 60 22';
const OUTER_B = 'M61 19 C80 18 91 39 88 57 C85 76 76 92 57 95 C37 98 22 78 28 57 C34 37 42 23 61 19';
const OUTER_C = 'M59 24 C75 18 96 32 99 52 C102 72 84 88 63 94 C42 100 25 82 23 62 C21 42 40 30 59 24';

const INNER_A = 'M60 39 C71 40 80 49 80 61 C80 73 70 82 58 80 C47 78 39 70 40 58 C41 47 50 38 60 39';
const INNER_B = 'M61 36 C73 36 79 50 76 62 C73 75 65 83 53 81 C42 79 37 68 41 56 C45 44 50 37 61 36';
const INNER_C = 'M58 41 C70 35 82 45 83 58 C84 70 72 79 60 82 C48 85 38 74 37 61 C36 49 46 43 58 41';

export default memo(function OrganicMorph({ size = 120 }) {
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
        @keyframes organic-morph-outer {
          0%, 100% {
            d: path('${OUTER_A}');
            transform: rotate(-2deg) scale(0.98);
            opacity: 0.82;
          }
          45% {
            d: path('${OUTER_B}');
            transform: rotate(2deg) scale(1.03);
            opacity: 0.92;
          }
          72% {
            d: path('${OUTER_C}');
            transform: rotate(0deg) scale(1);
            opacity: 0.74;
          }
        }

        @keyframes organic-morph-inner {
          0%, 100% {
            d: path('${INNER_A}');
            transform: rotate(3deg) scale(0.96);
            opacity: 0.48;
          }
          45% {
            d: path('${INNER_B}');
            transform: rotate(-2deg) scale(1.04);
            opacity: 0.76;
          }
          72% {
            d: path('${INNER_C}');
            transform: rotate(1deg) scale(1);
            opacity: 0.58;
          }
        }

        .organic-shape {
          transform-box: view-box;
          transform-origin: 60px 60px;
          animation: organic-morph-outer 18s ease-in-out infinite;
        }

        .organic-inner {
          transform-box: view-box;
          transform-origin: 60px 60px;
          animation: organic-morph-inner 18s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .organic-shape,
          .organic-inner { animation: none; opacity: 0.72; }
        }
      `}</style>

      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        <path className="organic-shape" d={OUTER_A} strokeWidth="3.1" />
        <path className="organic-inner" d={INNER_A} strokeWidth="2.25" />
        <circle cx="60" cy="60" r="2.9" fill="currentColor" opacity="0.62" stroke="none" />
      </g>
    </svg>
  );
});

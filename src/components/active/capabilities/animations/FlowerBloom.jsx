import { memo } from 'react';

const PETAL_PATH = 'M60 58 C50 45 51 28 60 18 C69 28 70 45 60 58';
const SMALL_PETAL_PATH = 'M60 60 C54 52 55 41 60 34 C65 41 66 52 60 60';
const PETALS = Array.from({ length: 8 }, (_, index) => index * 45);
const INNER_PETALS = Array.from({ length: 8 }, (_, index) => index * 45 + 22.5);

export default memo(function FlowerBloom({ size = 120 }) {
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
        @keyframes flower-bloom-outer {
          0%, 100% { transform: rotate(var(--petal-angle)) scale(0.78); opacity: 0.42; }
          46%, 58% { transform: rotate(var(--petal-angle)) scale(1.04); opacity: 0.9; }
        }

        @keyframes flower-bloom-inner {
          0%, 100% { transform: rotate(var(--petal-angle)) scale(0.82); opacity: 0.36; }
          50%, 64% { transform: rotate(var(--petal-angle)) scale(1); opacity: 0.78; }
        }

        @keyframes flower-bloom-center {
          0%, 100% { transform: scale(0.88); opacity: 0.48; }
          50% { transform: scale(1.1); opacity: 0.82; }
        }

        .flower-petal {
          transform-box: view-box;
          transform-origin: 60px 60px;
          animation: flower-bloom-outer 16s ease-in-out infinite;
        }

        .flower-petal-inner {
          transform-box: view-box;
          transform-origin: 60px 60px;
          animation: flower-bloom-inner 16s ease-in-out infinite;
        }

        .flower-center {
          transform-box: fill-box;
          transform-origin: center;
          animation: flower-bloom-center 16s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .flower-petal,
          .flower-petal-inner,
          .flower-center { animation: none; opacity: 0.5; }
        }
      `}</style>

      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        {PETALS.map((angle, index) => (
          <path
            key={`outer-${angle}`}
            className="flower-petal"
            d={PETAL_PATH}
            strokeWidth="2.55"
            style={{
              '--petal-angle': `${angle}deg`,
              animationDelay: `${index * -0.28}s`,
            }}
          />
        ))}

        {INNER_PETALS.map((angle, index) => (
          <path
            key={`inner-${angle}`}
            className="flower-petal-inner"
            d={SMALL_PETAL_PATH}
            strokeWidth="2.1"
            style={{
              '--petal-angle': `${angle}deg`,
              animationDelay: `${index * -0.22 - 1.6}s`,
            }}
          />
        ))}

        <circle className="flower-center" cx="60" cy="60" r="3.6" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
});

import { memo } from 'react';

const RIPPLES = [
  { radius: 34, delay: 0, width: 2.65, opacity: 0.9 },
  { radius: 28, delay: 0.42, width: 2.25, opacity: 0.72 },
  { radius: 21, delay: 0.84, width: 1.9, opacity: 0.56 },
];

export default memo(function DropRipple({ size = 120 }) {
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
        @keyframes drop-fall {
          0%, 9% {
            transform: translateY(-18px) scale(0.72);
            opacity: 0.12;
          }
          16% {
            opacity: 0.92;
          }
          29% {
            transform: translateY(24px) scale(0.92);
            opacity: 0.96;
          }
          34%, 100% {
            transform: translateY(27px) scale(0.2);
            opacity: 0;
          }
        }

        @keyframes impact-dot {
          0%, 29%, 100% { transform: scale(0.2); opacity: 0; }
          34% { transform: scale(1.15); opacity: 0.86; }
          50% { transform: scale(0.5); opacity: 0.32; }
        }

        @keyframes circular-ripple {
          0%, 24% {
            transform: scale(0.16);
            opacity: 0.12;
            stroke-width: var(--ripple-width);
          }
          34% {
            opacity: var(--ripple-opacity);
          }
          72% {
            transform: scale(1);
            opacity: calc(var(--ripple-opacity) * 0.42);
            stroke-width: 1.2;
          }
          100% {
            transform: scale(1.12);
            opacity: 0.08;
            stroke-width: 0.8;
          }
        }

        @keyframes waterline-rest {
          0%, 100% { transform: translateY(0); opacity: 0.48; }
          36% { transform: translateY(1.5px); opacity: 0.72; }
          54% { transform: translateY(-0.5px); opacity: 0.56; }
        }

        .falling-drop {
          transform-box: view-box;
          transform-origin: 60px 68px;
          animation: drop-fall 7.5s ease-in-out infinite;
        }

        .impact-dot {
          transform-box: fill-box;
          transform-origin: center;
          animation: impact-dot 7.5s ease-out infinite;
        }

        .drop-ripple-ring {
          transform-box: view-box;
          transform-origin: 60px 72px;
          animation: circular-ripple 7.5s ease-out infinite both;
          animation-delay: var(--ripple-delay);
        }

        .waterline {
          animation: waterline-rest 7.5s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .falling-drop,
          .impact-dot,
          .drop-ripple-ring,
          .waterline { animation: none; opacity: 0.62; }
        }
      `}</style>

      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        <path
          className="waterline"
          d="M26 73 C38 70 48 74 60 72 C73 70 83 74 95 71"
          strokeWidth="2.15"
          opacity="0.5"
        />
        <ellipse cx="60" cy="72" rx="15" ry="3.4" strokeWidth="1.2" opacity="0.22" />

        <circle
          className="falling-drop"
          cx="60"
          cy="44"
          r="2.8"
          fill="currentColor"
          stroke="none"
        />

        <circle className="impact-dot" cx="60" cy="72" r="3.2" fill="currentColor" stroke="none" />

        {RIPPLES.map((ripple) => (
          <circle
            key={ripple.radius}
            className="drop-ripple-ring"
            cx="60"
            cy="72"
            r={ripple.radius}
            strokeWidth={ripple.width}
            opacity={ripple.opacity}
            style={{
              '--ripple-delay': `${ripple.delay}s`,
              '--ripple-width': ripple.width,
              '--ripple-opacity': ripple.opacity,
            }}
          />
        ))}
      </g>
    </svg>
  );
});

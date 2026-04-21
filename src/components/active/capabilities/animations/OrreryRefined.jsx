import { memo } from 'react';

const ORBITS = [
  { radius: 15, body: 2.2, duration: 14, delay: -3, tilt: 0.66, angle: -18, opacity: 0.88 },
  { radius: 27, body: 3.1, duration: 27, delay: -11, tilt: 0.58, angle: 18, opacity: 0.82, moon: true },
  { radius: 39, body: 2.4, duration: 44, delay: -19, tilt: 0.52, angle: -8, opacity: 0.72 },
  { radius: 48, body: 1.8, duration: 68, delay: -31, tilt: 0.46, angle: 28, opacity: 0.62 },
];

export default memo(function OrreryRefined({ size = 120 }) {
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
        @keyframes refined-orrery-turn {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes refined-orrery-dash {
          0% { stroke-dashoffset: 0; opacity: 0.2; }
          50% { opacity: 0.46; }
          100% { stroke-dashoffset: -84; opacity: 0.2; }
        }

        @keyframes refined-orrery-core {
          0%, 100% { transform: scale(0.94); opacity: 0.56; }
          50% { transform: scale(1.08); opacity: 0.9; }
        }

        @keyframes refined-orrery-moon {
          0% { transform: rotate(0deg) translateX(6px); }
          100% { transform: rotate(360deg) translateX(6px); }
        }

        .refined-orbit-plane {
          transform-box: view-box;
          transform-origin: 60px 60px;
          transform: rotate(var(--orbit-angle)) scaleY(var(--orbit-tilt));
        }

        .refined-orbit-path {
          animation: refined-orrery-dash 22s linear infinite;
          animation-delay: var(--orbit-delay);
          stroke-dasharray: 18 16;
        }

        .refined-orbiting-body {
          transform-origin: 60px 60px;
          animation: refined-orrery-turn var(--orbit-duration) linear infinite;
          animation-delay: var(--orbit-delay);
        }

        .refined-core {
          transform-box: fill-box;
          transform-origin: center;
          animation: refined-orrery-core 11s ease-in-out infinite;
        }

        .refined-moon {
          transform-box: fill-box;
          transform-origin: center;
          animation: refined-orrery-moon 7s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .refined-orbit-path,
          .refined-orbiting-body,
          .refined-core,
          .refined-moon { animation: none; }
        }
      `}</style>

      <g fill="none" stroke="currentColor" strokeLinecap="round" vectorEffect="non-scaling-stroke">
        <circle className="refined-core" cx="60" cy="60" r="4.4" fill="currentColor" stroke="none" />
        <circle className="refined-core" cx="60" cy="60" r="8.6" strokeWidth="1.3" opacity="0.28" />

        {ORBITS.map((orbit) => (
          <g
            key={`${orbit.radius}-${orbit.angle}`}
            className="refined-orbit-plane"
            style={{
              '--orbit-angle': `${orbit.angle}deg`,
              '--orbit-tilt': orbit.tilt,
              '--orbit-duration': `${orbit.duration}s`,
              '--orbit-delay': `${orbit.delay}s`,
            }}
          >
            <circle
              className="refined-orbit-path"
              cx="60"
              cy="60"
              r={orbit.radius}
              strokeWidth="1.75"
              opacity="0.34"
            />
            <g className="refined-orbiting-body">
              <circle
                cx={60 + orbit.radius}
                cy="60"
                r={orbit.body}
                fill="currentColor"
                stroke="none"
                opacity={orbit.opacity}
              />
              {orbit.moon && (
                <circle
                  className="refined-moon"
                  cx={60 + orbit.radius}
                  cy="60"
                  r="1.1"
                  fill="currentColor"
                  stroke="none"
                  opacity="0.58"
                />
              )}
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
});

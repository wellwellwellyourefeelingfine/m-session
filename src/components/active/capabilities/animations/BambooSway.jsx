import { memo } from 'react';

const TREES = [
  {
    trunk: 'M28 106 C26 88 31 75 30 58 C29 42 36 30 42 18',
    branches: [
      'M32 67 C23 60 18 50 16 39',
      'M34 57 C45 52 53 44 57 33',
      'M31 78 C43 73 51 65 56 55',
    ],
    crown: [
      'M19 42 C29 31 43 29 54 39',
      'M17 53 C30 44 46 45 59 55',
      'M22 65 C34 57 48 59 58 69',
    ],
    delay: -3,
    width: 3,
  },
  {
    trunk: 'M58 108 C56 88 62 73 60 54 C58 37 65 25 72 14',
    branches: [
      'M61 61 C48 55 40 45 36 32',
      'M62 48 C77 43 86 33 91 20',
      'M59 77 C47 72 38 63 33 52',
      'M63 72 C78 67 88 58 94 46',
    ],
    crown: [
      'M37 35 C52 21 75 22 91 35',
      'M34 50 C53 37 78 38 96 52',
      'M39 66 C55 54 78 55 93 68',
    ],
    delay: -8,
    width: 3.4,
  },
  {
    trunk: 'M88 106 C90 89 86 75 89 58 C92 42 88 30 82 18',
    branches: [
      'M88 66 C99 60 105 51 108 40',
      'M88 52 C76 47 69 38 65 27',
      'M88 82 C99 76 105 68 108 58',
    ],
    crown: [
      'M67 39 C78 30 94 31 105 42',
      'M64 53 C78 44 96 45 110 56',
      'M68 67 C80 59 96 61 107 72',
    ],
    delay: -5,
    width: 2.8,
  },
];

export default memo(function BambooSway({ size = 120 }) {
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
        @keyframes tree-sway {
          0%, 100% { transform: rotate(-2.2deg) skewX(-0.8deg); opacity: 0.66; }
          50% { transform: rotate(3deg) skewX(1.1deg); opacity: 0.92; }
        }

        @keyframes tree-leaf-breathe {
          0%, 100% { stroke-dashoffset: 0; opacity: 0.36; }
          50% { stroke-dashoffset: -18; opacity: 0.74; }
        }

        .tree-sway-group {
          transform-box: view-box;
          transform-origin: 60px 110px;
          animation: tree-sway 16s ease-in-out infinite;
          animation-delay: var(--tree-delay);
        }

        .tree-crown-line {
          animation: tree-leaf-breathe 16s ease-in-out infinite;
          animation-delay: var(--tree-delay);
          stroke-dasharray: 14 10;
        }

        @media (prefers-reduced-motion: reduce) {
          .tree-sway-group,
          .tree-crown-line { animation: none; opacity: 0.72; }
        }
      `}</style>

      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        <path
          d="M18 109 C36 104 49 109 64 105 C80 101 95 106 109 101"
          strokeWidth="2.4"
          opacity="0.52"
        />

        {TREES.map((tree) => (
          <g
            key={tree.trunk}
            className="tree-sway-group"
            style={{ '--tree-delay': `${tree.delay}s` }}
          >
            <path d={tree.trunk} strokeWidth={tree.width + 0.4} opacity="0.92" />

            {tree.branches.map((branch) => (
              <path key={branch} d={branch} strokeWidth="2.2" opacity="0.74" />
            ))}

            {tree.crown.map((crown) => (
              <path
                key={crown}
                className="tree-crown-line"
                d={crown}
                strokeWidth="2.55"
                opacity="0.66"
              />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
});

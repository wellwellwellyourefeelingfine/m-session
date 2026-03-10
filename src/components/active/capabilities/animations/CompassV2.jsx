import { useEffect, useRef, memo } from 'react';

const TOTAL = 13;

export default memo(function CompassV2Animation({ size = 100 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const drawStart = 0.16;
    const drawEnd = 0.30;
    const undrawStart = 0.82;
    const undrawEnd = 0.96;

    // Body elements: outer frame + needle only (inner circle has custom animations)
    const elements = [
      { id: 'compassv2-outer-frame' },
      { id: 'compassv2-needle' },
    ];

    function getLen(el) {
      if (el.tagName === 'circle') {
        return Math.ceil(2 * Math.PI * parseFloat(el.getAttribute('r')));
      }
      return Math.ceil(el.getTotalLength());
    }

    const styleEl = document.createElement('style');
    let css = '';

    // Body elements: draw/undraw
    elements.forEach((item, i) => {
      const el = svg.querySelector(`#${item.id}`);
      if (!el) return;
      const len = getLen(el);

      css += `
        #${item.id} {
          stroke-dasharray: ${len};
          stroke-dashoffset: ${len};
          animation: compassv2-draw-${i} ${TOTAL}s linear infinite;
        }
        @keyframes compassv2-draw-${i} {
          0%                        { stroke-dashoffset: ${len}; }
          ${drawStart * 100}%       { stroke-dashoffset: ${len}; }
          ${drawEnd * 100}%         { stroke-dashoffset: 0; }
          ${undrawStart * 100}%     { stroke-dashoffset: 0; }
          ${undrawEnd * 100}%       { stroke-dashoffset: ${len}; }
          100%                      { stroke-dashoffset: ${len}; }
        }
      `;
    });

    // Inner circle: starts at ring position (cy=16, r=6), scales up to full size (cy=84, r=27)
    css += `
      #compassv2-inner-circle {
        animation:
          compassv2-inner-shape ${TOTAL}s ease-in-out infinite,
          compassv2-inner-exit ${TOTAL}s linear infinite;
      }
      @keyframes compassv2-inner-shape {
        0%    { cy: 16px; r: 6px; }
        10%   { cy: 84px; r: 27px; }
        96%   { cy: 84px; r: 27px; }
        100%  { cy: 16px; r: 6px; }
      }
      @keyframes compassv2-inner-exit {
        0%    { stroke-dashoffset: 0; opacity: 1; }
        82%   { stroke-dashoffset: 0; opacity: 1; }
        94%   { stroke-dashoffset: 100; opacity: 1; }
        96%   { stroke-dashoffset: 100; opacity: 0; }
        100%  { stroke-dashoffset: 100; opacity: 0; }
      }
    `;

    // Ring 2: draws in at top after needle spin, stays visible through end
    const ring2El = svg.querySelector('#compassv2-ring-2');
    if (ring2El) {
      const ring2Len = getLen(ring2El);
      css += `
        #compassv2-ring-2 {
          stroke-dasharray: ${ring2Len};
          stroke-dashoffset: ${ring2Len};
          opacity: 0;
          animation:
            compassv2-ring2-draw ${TOTAL}s linear infinite,
            compassv2-ring2-opacity ${TOTAL}s linear infinite;
        }
        @keyframes compassv2-ring2-draw {
          0%    { stroke-dashoffset: ${ring2Len}; }
          50%   { stroke-dashoffset: ${ring2Len}; }
          58%   { stroke-dashoffset: 0; }
          100%  { stroke-dashoffset: 0; }
        }
        @keyframes compassv2-ring2-opacity {
          0%    { opacity: 0; }
          50%   { opacity: 0; }
          51%   { opacity: 1; }
          100%  { opacity: 1; }
        }
      `;
    }

    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  const height = size * 1.35;

  return (
    <svg
      ref={svgRef}
      viewBox="2 4 116 140"
      width={size}
      height={height}
      style={{ overflow: 'visible', color: 'var(--accent)', opacity: 0.7 }}
    >
      {/* Inner circle: starts at ring position, scales up to full compass inner circle */}
      <circle
        id="compassv2-inner-circle"
        cx="60" cy="16" r="6"
        pathLength="100"
        strokeDasharray="100"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ring 2: draws in at top after needle spin, stays visible through end */}
      <circle
        id="compassv2-ring-2"
        cx="60" cy="16" r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <g style={{
        transform: 'translateY(12px)',
        animation: `${TOTAL}s linear infinite compassv2-group-fade`,
      }}>

        {/* Outer frame with 4 triangular points */}
        <path
          id="compassv2-outer-frame"
          d="M 60,22 L 68,35 A 38,38 0 0,1 97,64 L 106,72 L 97,80 A 38,38 0 0,1 68,109 L 60,120 L 52,109 A 38,38 0 0,1 23,80 L 14,72 L 23,64 A 38,38 0 0,1 52,35 L 60,22"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Diamond needle — spins independently */}
        <g style={{
          transformOrigin: '60px 72px',
          animation: `${TOTAL}s ease-in-out infinite compassv2-needle-spin`,
        }}>
          <path
            id="compassv2-needle"
            d="M 60,54 L 66,72 L 60,90 L 54,72 L 60,54"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

      </g>

      <style>{`
        @keyframes compassv2-needle-spin {
          0%   { transform: rotate(0deg); }
          30%  { transform: rotate(0deg); }
          50%  { transform: rotate(720deg); }
          100% { transform: rotate(720deg); }
        }

        @keyframes compassv2-group-fade {
          0%   { opacity: 0; }
          16%  { opacity: 0; }
          17%  { opacity: 1; }
          96%  { opacity: 1; }
          98%  { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
    </svg>
  );
});

import { useEffect, useRef, memo } from 'react';

export default memo(function CompassAnimation({ size = 100 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const TOTAL = 14;
    const drawStart = 0.02;
    const drawEndDefault = 0.26;
    const drawEndFast = 0.10;
    const undrawStart = 0.60;
    const undrawEndDefault = 0.74;
    const undrawEndFast = 0.64;

    const elements = [
      { id: 'compass-ring', fast: true },
      { id: 'compass-outer-frame', fast: false },
      { id: 'compass-inner-circle', fast: false },
      { id: 'compass-needle', fast: false },
    ];

    function getLen(el) {
      if (el.tagName === 'circle') {
        return Math.ceil(2 * Math.PI * parseFloat(el.getAttribute('r')));
      }
      return Math.ceil(el.getTotalLength());
    }

    const styleEl = document.createElement('style');
    let css = '';

    elements.forEach((item, i) => {
      const el = svg.querySelector(`#${item.id}`);
      if (!el) return;
      const len = getLen(el);
      const drawEnd = item.fast ? drawEndFast : drawEndDefault;
      const undrawEnd = item.fast ? undrawEndFast : undrawEndDefault;

      css += `
        #${item.id} {
          stroke-dasharray: ${len};
          stroke-dashoffset: ${len};
          animation: compass-draw-${i} ${TOTAL}s linear infinite;
        }
        @keyframes compass-draw-${i} {
          0%                        { stroke-dashoffset: ${len}; }
          ${drawStart * 100}%       { stroke-dashoffset: ${len}; }
          ${drawEnd * 100}%         { stroke-dashoffset: 0; }
          ${undrawStart * 100}%     { stroke-dashoffset: 0; }
          ${undrawEnd * 100}%       { stroke-dashoffset: ${len}; }
          100%                      { stroke-dashoffset: ${len}; }
        }
      `;
    });

    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  const height = size * 1.25;

  return (
    <svg
      ref={svgRef}
      viewBox="2 4 116 128"
      width={size}
      height={height}
      style={{ overflow: 'visible', color: 'var(--accent)', opacity: 0.7 }}
    >
      <g style={{
        animation: '14s linear infinite compass-group-fade',
      }}>

        {/* Top ring */}
        <circle
          id="compass-ring"
          cx="60" cy="16" r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Outer frame with 4 triangular points */}
        <path
          id="compass-outer-frame"
          d="M 60,22 L 68,35 A 38,38 0 0,1 97,64 L 106,72 L 97,80 A 38,38 0 0,1 68,109 L 60,120 L 52,109 A 38,38 0 0,1 23,80 L 14,72 L 23,64 A 38,38 0 0,1 52,35 L 60,22"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner circle */}
        <circle
          id="compass-inner-circle"
          cx="60" cy="72" r="27"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Diamond needle — spins independently */}
        <g style={{
          transformOrigin: '60px 72px',
          animation: '14s ease-in-out infinite compass-needle-spin',
        }}>
          <path
            id="compass-needle"
            d="M 60,54 L 66,72 L 60,90 L 54,72 L 60,54"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

      </g>

      <style>{`
        @keyframes compass-needle-spin {
          0%   { transform: rotate(0deg); }
          26%  { transform: rotate(0deg); }
          60%  { transform: rotate(1080deg); }
          100% { transform: rotate(1080deg); }
        }

        @keyframes compass-group-fade {
          0%   { opacity: 0; }
          1.5% { opacity: 1; }
          74%  { opacity: 1; }
          76%  { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
    </svg>
  );
});
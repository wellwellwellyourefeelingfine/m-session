import { useEffect, useRef, memo } from 'react';

const HOLD_AFTER_DRAW = 1;          // 1s hold after compass fully drawn before needle spins
const TOTAL = 13 + HOLD_AFTER_DRAW; // 14s

// Absolute times (seconds) for every keyframe event.
// Events at or before bodyDrawEnd are at their original times;
// everything after is shifted by HOLD_AFTER_DRAW so the leaf-draw and needle-spin
// phases keep their original real-time speeds.
const T = {
  innerCenterArrived: 1.3,                      // big inner circle reaches center
  groupFadeStart:     2.08,                     // body group fade-in begins
  groupFadeEnd:       2.21,                     // body group fully visible
  bodyDrawStart:      2.08,                     // frame & needle start drawing
  bodyDrawEnd:        3.9,                      // === LOOP ANCHOR: compass fully drawn ===

  // 1s hold inserted here
  needleSpinStart:    3.9  + HOLD_AFTER_DRAW,   // 4.9s
  needleSpinEnd:      6.5  + HOLD_AFTER_DRAW,   // 7.5s
  ring2DrawStart:     6.5  + HOLD_AFTER_DRAW,   // 7.5s
  ring2OpacityOff:    6.5  + HOLD_AFTER_DRAW,   // 7.5s
  ring2OpacityOn:     6.63 + HOLD_AFTER_DRAW,   // 7.63s
  ring2DrawEnd:       7.54 + HOLD_AFTER_DRAW,   // 8.54s

  bodyUndrawStart:    10.66 + HOLD_AFTER_DRAW,  // 11.66s
  innerUndrawEnd:     12.22 + HOLD_AFTER_DRAW,  // 13.22s
  bodyUndrawEnd:      12.48 + HOLD_AFTER_DRAW,  // 13.48s
  innerOpacityOut:    12.48 + HOLD_AFTER_DRAW,  // 13.48s
  groupFadeOutStart:  12.48 + HOLD_AFTER_DRAW,  // 13.48s
  groupFadeOutEnd:    12.74 + HOLD_AFTER_DRAW,  // 13.74s
  innerShapeReturn:   12.48 + HOLD_AFTER_DRAW,  // 13.48s — inner morphs back to top
};

const pct = (s) => `${(s / TOTAL) * 100}%`;
const LOOP_DELAY = -T.bodyDrawEnd; // -3.9s — shifts visible loop start to "compass fully drawn"

export default memo(function CompassV2Animation({ size = 120 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

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
          animation: compassv2-draw-${i} ${TOTAL}s linear ${LOOP_DELAY}s infinite;
        }
        @keyframes compassv2-draw-${i} {
          0%                              { stroke-dashoffset: ${len}; }
          ${pct(T.bodyDrawStart)}         { stroke-dashoffset: ${len}; }
          ${pct(T.bodyDrawEnd)}           { stroke-dashoffset: 0; }
          ${pct(T.bodyUndrawStart)}       { stroke-dashoffset: 0; }
          ${pct(T.bodyUndrawEnd)}         { stroke-dashoffset: ${len}; }
          100%                            { stroke-dashoffset: ${len}; }
        }
      `;
    });

    // Inner circle: starts at ring position (cy=16, r=6), scales up to full size (cy=84, r=27)
    css += `
      #compassv2-inner-circle {
        animation:
          compassv2-inner-shape ${TOTAL}s ease-in-out ${LOOP_DELAY}s infinite,
          compassv2-inner-exit ${TOTAL}s linear ${LOOP_DELAY}s infinite;
      }
      @keyframes compassv2-inner-shape {
        0%                              { cy: 16px; r: 6px; }
        ${pct(T.innerCenterArrived)}    { cy: 84px; r: 27px; }
        ${pct(T.innerShapeReturn)}      { cy: 84px; r: 27px; }
        100%                            { cy: 16px; r: 6px; }
      }
      @keyframes compassv2-inner-exit {
        0%                              { stroke-dashoffset: 0; opacity: 1; }
        ${pct(T.bodyUndrawStart)}       { stroke-dashoffset: 0; opacity: 1; }
        ${pct(T.innerUndrawEnd)}        { stroke-dashoffset: 100; opacity: 1; }
        ${pct(T.innerOpacityOut)}       { stroke-dashoffset: 100; opacity: 0; }
        100%                            { stroke-dashoffset: 100; opacity: 0; }
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
            compassv2-ring2-draw ${TOTAL}s linear ${LOOP_DELAY}s infinite,
            compassv2-ring2-opacity ${TOTAL}s linear ${LOOP_DELAY}s infinite;
        }
        @keyframes compassv2-ring2-draw {
          0%                              { stroke-dashoffset: ${ring2Len}; }
          ${pct(T.ring2DrawStart)}        { stroke-dashoffset: ${ring2Len}; }
          ${pct(T.ring2DrawEnd)}          { stroke-dashoffset: 0; }
          100%                            { stroke-dashoffset: 0; }
        }
        @keyframes compassv2-ring2-opacity {
          0%                              { opacity: 0; }
          ${pct(T.ring2OpacityOff)}       { opacity: 0; }
          ${pct(T.ring2OpacityOn)}        { opacity: 1; }
          100%                            { opacity: 1; }
        }
      `;
    }

    // Needle spin and group fade — moved here from inline JSX <style> so they share T/pct.
    css += `
      @keyframes compassv2-needle-spin {
        0%                              { transform: rotate(0deg); }
        ${pct(T.needleSpinStart)}       { transform: rotate(0deg); }
        ${pct(T.needleSpinEnd)}         { transform: rotate(720deg); }
        100%                            { transform: rotate(720deg); }
      }
      @keyframes compassv2-group-fade {
        0%                              { opacity: 0; }
        ${pct(T.groupFadeStart)}        { opacity: 0; }
        ${pct(T.groupFadeEnd)}          { opacity: 1; }
        ${pct(T.groupFadeOutStart)}     { opacity: 1; }
        ${pct(T.groupFadeOutEnd)}       { opacity: 0; }
        100%                            { opacity: 0; }
      }
    `;

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
      {/* Inner circle: initial JSX values match the loop-start frame (big circle at center)
          to avoid a first-paint flicker before the keyframes attach in useEffect.
          The compassv2-inner-shape animation overrides cy/r once it starts. */}
      <circle
        id="compassv2-inner-circle"
        cx="60" cy="84" r="27"
        pathLength="100"
        strokeDasharray="100"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ring 2: draws in at top after needle spin, stays visible through end.
          Initial opacity 0 to match the loop-start frame (ring 2 not yet visible). */}
      <circle
        id="compassv2-ring-2"
        cx="60" cy="16" r="6"
        opacity="0"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <g style={{
        transform: 'translateY(12px)',
        animation: `${TOTAL}s linear ${LOOP_DELAY}s infinite compassv2-group-fade`,
      }}>

        {/* Outer frame with 4 triangular points */}
        <path
          id="compassv2-outer-frame"
          d="M 60,22 L 68,35 A 38,38 0 0,1 97,64 L 106,72 L 97,80 A 38,38 0 0,1 68,109 L 60,120 L 52,109 A 38,38 0 0,1 23,80 L 14,72 L 23,64 A 38,38 0 0,1 52,35 L 60,22"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Diamond needle — spins independently */}
        <g style={{
          transformOrigin: '60px 72px',
          animation: `${TOTAL}s ease-in-out ${LOOP_DELAY}s infinite compassv2-needle-spin`,
        }}>
          <path
            id="compassv2-needle"
            d="M 60,54 L 66,72 L 60,90 L 54,72 L 60,54"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

      </g>
    </svg>
  );
});

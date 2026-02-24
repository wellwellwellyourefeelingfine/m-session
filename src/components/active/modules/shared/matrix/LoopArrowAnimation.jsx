/**
 * Shared Loop Arrow Animation for the Values Compass stuck/vital loop.
 * Extracted from ValuesCompassModule for reuse in follow-up modules.
 */

export default function LoopArrowAnimation({ side, visible }) {
  // Mirror for right side
  const transform = side === 'right' ? 'scaleX(-1)' : undefined;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 300ms ease',
        transform,
      }}
    >
      <svg
        viewBox="0 0 100 180"
        className="w-full h-full"
        fill="none"
        style={{ color: 'var(--accent)' }}
      >
        {/* Arrow 1: bottom → top (right arc) */}
        <path
          className="vc-loop-arrow-1"
          d="M 60,125 C 88,110 88,70 60,55"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Arrowhead 1: chevron aligned to arc tangent at (60,55) */}
        <polyline
          className="vc-loop-head-1"
          points="67,60 60,55 66,50"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Arrow 2: top → bottom (left arc) */}
        <path
          className="vc-loop-arrow-2"
          d="M 40,55 C 12,70 12,110 40,125"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Arrowhead 2: chevron aligned to arc tangent at (40,125) */}
        <polyline
          className="vc-loop-head-2"
          points="33,120 40,125 34,130"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>

      <style>{`
        .vc-loop-arrow-1 {
          stroke-dasharray: 130;
          animation: vc-loop-draw1 5s ease-out infinite;
        }
        .vc-loop-head-1 {
          animation: vc-loop-head1 5s ease-out infinite;
        }
        .vc-loop-arrow-2 {
          stroke-dasharray: 130;
          animation: vc-loop-draw2 5s ease-out infinite;
        }
        .vc-loop-head-2 {
          animation: vc-loop-head2 5s ease-out infinite;
        }
        @keyframes vc-loop-draw1 {
          0%   { stroke-dashoffset: 130; opacity: 1; }
          16%  { stroke-dashoffset: 0; opacity: 1; }
          80%  { stroke-dashoffset: 0; opacity: 1; }
          90%  { stroke-dashoffset: 0; opacity: 0; }
          100% { stroke-dashoffset: 130; opacity: 0; }
        }
        @keyframes vc-loop-head1 {
          0%   { opacity: 0; }
          15%  { opacity: 0; }
          16%  { opacity: 1; }
          80%  { opacity: 1; }
          90%  { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes vc-loop-draw2 {
          0%   { stroke-dashoffset: 130; opacity: 0; }
          24%  { stroke-dashoffset: 130; opacity: 1; }
          40%  { stroke-dashoffset: 0; opacity: 1; }
          80%  { stroke-dashoffset: 0; opacity: 1; }
          90%  { stroke-dashoffset: 0; opacity: 0; }
          100% { stroke-dashoffset: 130; opacity: 0; }
        }
        @keyframes vc-loop-head2 {
          0%   { opacity: 0; }
          39%  { opacity: 0; }
          40%  { opacity: 1; }
          80%  { opacity: 1; }
          90%  { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

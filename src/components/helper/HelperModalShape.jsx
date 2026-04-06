/**
 * HelperModalShape
 * SVG component rendering the manila envelope bottom edge with centered hanging tab.
 * Uses ResizeObserver to dynamically compute the path from container width.
 *
 * The fill path extends upward (negative Y) by CORNER_RADIUS to overlap with the modal body.
 * A separate stroke-only path draws the visible border along the bottom edge and tab.
 */

import { useRef, useState, useEffect } from 'react';
import { CORNER_RADIUS, TAB_DEPTH, buildModalPath, buildModalStrokePath } from './buildModalPath';

export default function HelperModalShape({ onClick, isOpen }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    setWidth(el.offsetWidth);

    return () => observer.disconnect();
  }, []);

  const svgHeight = TAB_DEPTH + CORNER_RADIUS;

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{
        height: TAB_DEPTH,
        marginTop: -CORNER_RADIUS,
      }}
    >
      <svg
        width={width}
        height={svgHeight}
        viewBox={`0 ${-CORNER_RADIUS} ${width} ${svgHeight}`}
        className="absolute top-0 left-0"
        style={{ overflow: 'visible' }}
      >
        {/* Fill — covers the shape area and overlaps upward into modal body */}
        <path
          d={buildModalPath(width)}
          fill="var(--bg-primary)"
          stroke="none"
        />
        {/* Stroke — only the visible bottom edge + tab outline, matching header border */}
        <path
          d={buildModalStrokePath(width)}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
        />
      </svg>
      {/* Heart icon centered in tab — single SVG with circle + heart at same coordinate space for consistent 2px stroke */}
      <button
        onClick={onClick}
        className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center"
        style={{
          top: CORNER_RADIUS + (TAB_DEPTH / 2) - 16,
          width: 32,
          height: 32,
        }}
        aria-label={isOpen ? 'Close support menu' : 'Open support menu'}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="var(--accent)"
            strokeWidth="2"
            fill="var(--bg-primary)"
          />
          {/* Heart path drawn at the same scale as the circle so strokeWidth matches exactly */}
          <path
            d="M10.5 14.5a3.25 3.25 0 0 1 5.67-2.17.33.33 0 0 0 .48 0A3.24 3.24 0 0 1 22 14.5c0 1.35-.89 2.36-1.77 3.25l-3.24 3.14a1.18 1.18 0 0 1-1.77.01L12.27 17.7c-.89-.88-1.77-1.89-1.77-3.25"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </button>
    </div>
  );
}

/**
 * MorphingShapes Component
 *
 * Four overlapping shapes (stroke only) that slowly morph:
 * - Shape A: circle → square → circle
 * - Shape B: square → circle → square
 * - Shape C: center point → full circle → center point (synced with outer shapes)
 * - Shape D: same as C, but phase-shifted by 90°
 *
 * Creates a contemplative, layered animation.
 * Designed for the Co-Star inspired aesthetic.
 */

export default function MorphingShapes({
  className = '',
  size = 48,
  strokeWidth = 1.5,
  duration = 8, // seconds for full cycle
}) {
  // SVG circle needs radius that accounts for stroke
  const maxRadius = (size / 2) - (strokeWidth / 2);

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size, color: 'var(--accent)' }}
    >
      {/* Keyframes defined inline for self-contained component */}
      <style>{`
        @keyframes morph-circle-to-square {
          0%, 100% { border-radius: 50%; }
          50% { border-radius: 4%; }
        }
        @keyframes morph-square-to-circle {
          0%, 100% { border-radius: 4%; }
          50% { border-radius: 50%; }
        }
        @keyframes pulse-radius {
          0%, 100% { r: 0.3px; }
          50% { r: ${maxRadius}px; }
        }
      `}</style>

      {/* Shape 1: Starts as circle */}
      <div
        className="absolute inset-0 border-current"
        style={{
          borderWidth: strokeWidth,
          borderStyle: 'solid',
          animation: `morph-circle-to-square ${duration}s ease-in-out infinite`,
        }}
      />

      {/* Shape 2: Starts as square */}
      <div
        className="absolute inset-0 border-current"
        style={{
          borderWidth: strokeWidth,
          borderStyle: 'solid',
          animation: `morph-square-to-circle ${duration}s ease-in-out infinite`,
        }}
      />

      {/* Shape 3: SVG circle that pulses from center (constant stroke width) */}
      <svg
        className="absolute inset-0"
        width={size}
        height={size}
        style={{ overflow: 'visible' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r="0.3"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          style={{
            animation: `pulse-radius ${duration}s ease-in-out infinite`,
          }}
        />
      </svg>

      {/* Shape 4: Second pulsing circle, offset by 90° phase */}
      <svg
        className="absolute inset-0"
        width={size}
        height={size}
        style={{ overflow: 'visible' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r="0.3"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          style={{
            animation: `pulse-radius ${duration}s ease-in-out infinite`,
            animationDelay: `${duration / 4}s`,
          }}
        />
      </svg>
    </div>
  );
}

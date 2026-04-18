/**
 * Horizon — shared horizontal line used by the four transition animations
 * (Sunrise, FullSun, Sunset, Moonrise). Kept as a sub-component so all four
 * animations render the exact same horizon position and stroke weight.
 */

const DEFAULT_SIZE = 160;
const HORIZON_Y_RATIO = 0.72;  // horizon sits at 72% of viewport height

export default function Horizon({ size = DEFAULT_SIZE, strokeWidth = 2 }) {
  const y = size * HORIZON_Y_RATIO;
  return (
    <line
      x1={0}
      y1={y}
      x2={size}
      y2={y}
      stroke="var(--accent)"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  );
}

export { HORIZON_Y_RATIO };

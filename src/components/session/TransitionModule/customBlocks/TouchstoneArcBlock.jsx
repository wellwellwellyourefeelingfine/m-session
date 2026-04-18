/**
 * TouchstoneArcBlock — Displays opening + closing touchstones with a connecting arc.
 *
 * Purely presentational. The reflection prompt that follows is a standard
 * prompt block on the same screen.
 *
 * Config:
 *   { type: 'touchstone-arc' }
 */

import { useSessionStore } from '../../../../stores/useSessionStore';

const SVG_WIDTH = 280;
const SVG_HEIGHT = 120;

export default function TouchstoneArcBlock() {
  const openingTouchstone = useSessionStore((s) => s.transitionData?.openingTouchstone);
  const closingTouchstone = useSessionStore((s) => s.transitionData?.closingTouchstone);

  const hasOpening = openingTouchstone && openingTouchstone.trim().length > 0;
  const hasClosing = closingTouchstone && closingTouchstone.trim().length > 0;

  if (!hasOpening && !hasClosing) {
    return (
      <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider text-center italic">
        No touchstones recorded.
      </p>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Arc connector SVG between the two touchstones */}
      <div className="relative flex flex-col items-center">
        {/* Opening (top) */}
        <div className="flex flex-col items-center mb-2">
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
            Before
          </span>
          <p
            className="text-base text-[var(--color-text-primary)] text-center px-4"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            {hasOpening ? openingTouchstone : '—'}
          </p>
        </div>

        {/* Arc between */}
        <svg
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="my-2"
          aria-hidden="true"
        >
          <path
            d={`M 20 10 Q ${SVG_WIDTH / 2} ${SVG_HEIGHT + 10} ${SVG_WIDTH - 20} 10`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="4 6"
            opacity={0.7}
          />
          {/* Endpoint dots */}
          <circle cx={20} cy={10} r={3} fill="var(--accent)" />
          <circle cx={SVG_WIDTH - 20} cy={10} r={3} fill="var(--accent)" />
        </svg>

        {/* Closing (bottom) */}
        <div className="flex flex-col items-center mt-2">
          <p
            className="text-base text-[var(--color-text-primary)] text-center px-4"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            {hasClosing ? closingTouchstone : '—'}
          </p>
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mt-1">
            After
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * CategoryGrid
 * 2-column grid of category cards with circular icon escutcheons.
 * Each card has a circle overlapping the top-left corner containing the icon,
 * with a serif title and description below.
 */

import * as Icons from '../shared/Icons';

const CIRCLE_SIZE = 40;
const CIRCLE_OFFSET = -10; // how far the circle overhangs the card edges

export default function CategoryGrid({ categories, onSelect }) {
  return (
    <div
      className="grid grid-cols-2 gap-x-5 gap-y-5"
      style={{
        paddingTop: -CIRCLE_OFFSET,
        paddingLeft: -CIRCLE_OFFSET,
      }}
    >
      {categories.map((cat) => {
        const IconComponent = Icons[cat.icon];
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat)}
            className="relative text-left border transition-colors overflow-visible flex flex-col items-start rounded-md"
            style={{
              borderColor: 'var(--color-border)',
              padding: `6px 12px 8px 12px`,
            }}
          >
            {/* Circular escutcheon — overlaps top-left corner of card */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                width: CIRCLE_SIZE,
                height: CIRCLE_SIZE,
                top: CIRCLE_OFFSET,
                left: CIRCLE_OFFSET,
                borderRadius: '50%',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--bg-primary)',
                zIndex: 1,
              }}
            >
              {IconComponent && <IconComponent size={26} strokeWidth={2.5} className="text-[var(--accent)]" />}
            </div>
            {/* Title — serif, flush with the top of the card, with a small left margin
                so it sits just to the right of the icon circle (not behind it) */}
            <p
              className="text-[15px] m-0"
              style={{
                fontFamily: "'DM Serif Text', serif",
                textTransform: 'none',
                lineHeight: 1.2,
                color: 'var(--color-text-primary)',
                paddingLeft: CIRCLE_SIZE + CIRCLE_OFFSET - 5,
              }}
            >
              {cat.label}
            </p>
            {/* Description — full width, flows right after the title */}
            <p
              className="text-[10px] uppercase tracking-wider leading-relaxed mt-2"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {cat.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

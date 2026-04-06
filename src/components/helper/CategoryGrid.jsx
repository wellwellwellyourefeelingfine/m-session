/**
 * CategoryGrid
 * 2-column grid of category cards with circular icon escutcheons.
 * Each card has a circle overlapping the top-left corner containing the icon,
 * with serif title and description below.
 * Cards start hidden (opacity 0) and stagger-fade in when `stagger` becomes true.
 */

import * as Icons from '../shared/Icons';

const CIRCLE_SIZE = 40;
const CIRCLE_OFFSET = -10; // how far the circle overhangs the card edges

export default function CategoryGrid({ categories, onSelect, stagger = false }) {
  return (
    <div className="grid grid-cols-2 gap-3" style={{ paddingTop: -CIRCLE_OFFSET, paddingLeft: -CIRCLE_OFFSET }}>
      {categories.map((cat, index) => {
        const IconComponent = Icons[cat.icon];
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat)}
            className="relative text-left border transition-colors overflow-visible"
            style={{
              borderColor: 'var(--color-border)',
              padding: `8px 12px 12px 12px`,
              opacity: 0,
              animation: stagger
                ? `fadeIn 150ms var(--ease-out) ${index * 60}ms forwards`
                : undefined,
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
              {IconComponent && <IconComponent size={20} className="text-[var(--accent)]" />}
            </div>
            {/* Title — serif, indented past the icon circle, naturally wrapping */}
            <p
              className="text-[15px]"
              style={{
                fontFamily: "'DM Serif Text', serif",
                textTransform: 'none',
                lineHeight: 1.2,
                color: 'var(--color-text-primary)',
                paddingLeft: CIRCLE_SIZE + CIRCLE_OFFSET - 4,
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

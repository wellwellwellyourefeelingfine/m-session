/**
 * CategoryHeader
 * Wide variant of the category card shown after a category is selected.
 * Spans the full width of the modal with the same escutcheon icon, larger title,
 * and a darker description below.
 */

import * as Icons from '../shared/Icons';

const CIRCLE_SIZE = 40;
const CIRCLE_OFFSET = -10;

export default function CategoryHeader({ category }) {
  if (!category) return null;
  const IconComponent = Icons[category.icon];

  return (
    <div
      className="relative w-full border rounded-md flex flex-col items-start"
      style={{
        borderColor: 'var(--color-border)',
        padding: '8px 14px 12px 14px',
      }}
    >
      {/* Circular escutcheon — overlaps top-left corner */}
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
      {/* Title — slightly larger than the grid card title */}
      <p
        className="text-[18px] m-0"
        style={{
          fontFamily: "'DM Serif Text', serif",
          textTransform: 'none',
          lineHeight: 1.2,
          color: 'var(--color-text-primary)',
          paddingLeft: CIRCLE_SIZE + CIRCLE_OFFSET - 5,
        }}
      >
        {category.label}
      </p>
      {/* Description — darker than the grid card description for readability */}
      <p
        className="text-[10px] uppercase tracking-wider leading-relaxed mt-2"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {category.description}
      </p>
    </div>
  );
}

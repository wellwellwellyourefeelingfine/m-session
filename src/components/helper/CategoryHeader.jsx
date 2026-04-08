/**
 * CategoryHeader
 * Wide variant of the category card shown after a category is selected.
 * Spans the full width of the modal with the same escutcheon icon, larger title,
 * and a multi-sentence first-person expanded description below.
 *
 * The description uses readable body typography (sentence case, relaxed leading)
 * rather than the all-caps tracking-wider treatment used on the grid cards,
 * since the expanded description is several sentences and meant to be read.
 *
 * Falls back to `category.description` (the brief grid copy) if a category
 * hasn't been authored an `expandedDescription` yet — keeps the follow-up
 * stub categories rendering correctly.
 */

import * as Icons from '../shared/Icons';

// Match the tightened escutcheon dimensions used by CategoryGrid so the icon
// sits in the same visual relationship to the card on both screens.
const CIRCLE_SIZE = 36;
const CIRCLE_OFFSET = -8;

export default function CategoryHeader({ category }) {
  if (!category) return null;
  const IconComponent = Icons[category.icon];
  const descriptionText = category.expandedDescription || category.description;

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
      {/* Expanded description — readable body copy in sentence case so a 3–4
          sentence first-person blurb is easy to scan on either light or dark mode. */}
      <p
        className="text-[12px] leading-relaxed mt-2"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {descriptionText}
      </p>
    </div>
  );
}

/**
 * CategoryGrid
 * 2-column grid of category cards with circular icon escutcheons.
 * Each card has a circle overlapping the top-left corner containing the icon,
 * with a serif title and description below.
 *
 * Below the grid, a single full-width emergency contact card sits as the bottom
 * row. It uses the same escutcheon language as the category cards but is wider,
 * slightly taller, and routes to the EmergencyContactView page when tapped.
 */

import * as Icons from '../shared/Icons';
import { PhoneIcon, CompassIcon } from '../shared/Icons';

// Circle is sized to sit closely around the 26px icon (was 40 — now hugs tighter).
// CIRCLE_OFFSET is recalculated so the icon's visual center stays in the same
// place on the card despite the smaller circle:
//   center = CIRCLE_OFFSET + CIRCLE_SIZE / 2
//   old:    -10 + 20 = 10
//   new:     -8 + 18 = 10  ✓
const CIRCLE_SIZE = 36;
const CIRCLE_OFFSET = -8; // how far the circle overhangs the card edges
// Fixed card height — sized to fit a 3-line description with tight padding.
// All category cards share this height regardless of their description length,
// so descriptions no longer drive box size.
//   4 (top pad) + 18 (title 15px×1.2) + 6 (title→desc gap)
//   + ~42 (3 lines × 10px × 1.375 leading-snug) + 4 (bottom pad) ≈ 74px
const CARD_HEIGHT_PX = 74;

export default function CategoryGrid({
  categories,
  onSelect,
  emergencyContact,
  onSelectEmergencyContact,
  intention,
  onSelectIntention,
  // When true, the 6 category cards are dimmed and made non-interactive
  // (used by the pre-session preview). The wide emergency contact card
  // at the bottom stays fully active so the user can still set up their
  // contact details before their session begins.
  categoriesDimmed = false,
}) {
  const contactName = emergencyContact?.name?.trim() || '';
  const contactPhone = emergencyContact?.phone?.trim() || '';
  const hasContact = Boolean(contactName || contactPhone);
  // Format: "{name} — {phone}" when both are present, otherwise whichever exists.
  const contactDescription = hasContact
    ? [contactName, contactPhone].filter(Boolean).join(' — ')
    : 'Tap to add details';

  const intentionText = (intention || '').trim();
  const hasIntention = intentionText.length > 0;
  const intentionDescription = hasIntention ? intentionText : 'Tap to add your intention';

  return (
    <div
      style={{
        paddingTop: -CIRCLE_OFFSET,
        paddingLeft: -CIRCLE_OFFSET,
      }}
    >
      <div
        className="grid grid-cols-2 gap-x-5 gap-y-4"
        // `inert` blocks all interaction (clicks, focus, screen-reader
        // announcement) when the categories are dimmed. The grid sub-tree
        // becomes purely visual.
        inert={categoriesDimmed || undefined}
        aria-hidden={categoriesDimmed || undefined}
        style={categoriesDimmed ? { opacity: 0.3, pointerEvents: 'none' } : undefined}
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
                padding: `8px 12px 8px 12px`,
                height: CARD_HEIGHT_PX,
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
                className="text-[9px] uppercase tracking-wider leading-snug mt-[4px]"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {cat.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Slim full-width intention card — sits below the grid, above the
          emergency contact card. Tap opens the dedicated IntentionView for
          view/edit. The description preview can wrap to TWO lines (line-clamp-2);
          the tightened mt gap + tighter bottom padding + leading-tight absorb
          the existing whitespace below the line so the card's total height is
          essentially unchanged. A minHeight pins the 1-line state to the same
          visual height as the emergency contact card below. */}
      {onSelectIntention && (
        <button
          type="button"
          onClick={onSelectIntention}
          className="relative w-full text-left border transition-colors overflow-visible flex flex-col items-start rounded-md mt-4"
          style={{
            borderColor: 'var(--color-border)',
            padding: '4px 14px 2px 14px',
            minHeight: '52px',
          }}
        >
          {/* Circular escutcheon — same overhang as category cards */}
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
            <CompassIcon size={22} className="text-[var(--accent)]" />
          </div>
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
            My Intention
          </p>
          <p
            className="text-[10px] uppercase tracking-wider leading-tight mt-[10px] w-full line-clamp-2 overflow-hidden"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {intentionDescription}
          </p>
        </button>
      )}

      {/* Slim full-width emergency contact card — sits below the grid.
          Intentionally short: title + name/phone line, no description block. */}
      {onSelectEmergencyContact && (
        <button
          type="button"
          onClick={onSelectEmergencyContact}
          className="relative w-full text-left border transition-colors overflow-visible flex flex-col items-start rounded-md mt-4"
          style={{
            borderColor: 'var(--color-border)',
            padding: '4px 14px 6px 14px',
          }}
        >
          {/* Circular escutcheon — same overhang as category cards */}
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
            <PhoneIcon size={22} className="text-[var(--accent)]" />
          </div>
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
            Emergency Contact
          </p>
          <p
            className="text-[10px] uppercase tracking-wider leading-snug mt-[10px]"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {contactDescription}
          </p>
        </button>
      )}
    </div>
  );
}

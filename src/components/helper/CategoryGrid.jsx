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

// Description typography — explicit values so the clamp math is exact.
// 9px mono at 13px line-height × 3 lines = 39px of description box.
const DESC_FONT_SIZE_PX = 9;
const DESC_LINE_HEIGHT_PX = 13;
const DESC_MAX_LINES = 3;
const DESC_BLOCK_HEIGHT_PX = DESC_LINE_HEIGHT_PX * DESC_MAX_LINES; // 39

// Wide-card (intention + emergency contact) descriptions are intentionally
// two px larger than the category-card descriptions — those cards have a lot
// more horizontal room, so the bigger type sits more comfortably and reads
// better at a glance.
const WIDE_DESC_FONT_SIZE_PX = 11;
const WIDE_DESC_LINE_HEIGHT_PX = 14;

// Fixed height for the wide cards (intention + emergency contact). Sized
// so toggling between 1-line and 2-line descriptions never changes the
// card's outer height. With justify-between the description anchors near
// the bottom of the card and grows upward into the title→description gap.
//
// Bottom padding is intentionally small (6px) so the description sits low
// in the card; that frees up vertical space above the description and gives
// the 2-line case ~8px of breathing room below the title rather than
// crowding up against it.
//   6  (top pad)
// + 18 (title: 15px × 1.2)
// + 28 (description: 2 × 14px, the worst case)
// +  6 (bottom pad)
// +  8 (residual gap above description, distributed by justify-between)
// = 66
const WIDE_CARD_HEIGHT_PX = 66;
const WIDE_CARD_PADDING = '4px 14px 6px 14px';

// Fixed card height — sized so every card has room for the full 3-line
// description with tight, deterministic padding.
//   8  (top pad)
// + 18 (title: 15px × 1.2)
// +  4 (title → description gap)
// + 42 (description: 3 × 14px)
// +  8 (bottom pad)
// = 80
const CARD_HEIGHT_PX = 80;

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
                padding: `4px 12px 8px 12px`,
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
                className="text-[16px] m-0"
                style={{
                  fontFamily: "'DM Serif Text', serif",
                  textTransform: 'none',
                  lineHeight: 1.15,
                  color: 'var(--color-text-primary)',
                  paddingLeft: CIRCLE_SIZE + CIRCLE_OFFSET - 5,
                }}
              >
                {cat.label}
              </p>
              {/* Description — Azeret Mono uppercase. Clamped to exactly 3
                  lines with an ellipsis. The explicit lineHeight + maxHeight
                  pair guarantees the text never overflows the card, even if
                  the browser doesn't honor -webkit-line-clamp. Positioned 2px
                  lower than before via marginTop to give more breathing room
                  above the description text. */}
              <p
                className="m-0 w-full uppercase tracking-wider"
                style={{
                  fontFamily: "'Azeret Mono', monospace",
                  color: 'var(--color-text-tertiary)',
                  opacity: 0.7,
                  fontSize: `${DESC_FONT_SIZE_PX}px`,
                  lineHeight: `${DESC_LINE_HEIGHT_PX}px`,
                  marginTop: '6px',
                  maxHeight: `${DESC_BLOCK_HEIGHT_PX}px`,
                  display: '-webkit-box',
                  WebkitLineClamp: DESC_MAX_LINES,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {cat.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Slim full-width intention card — sits below the grid, above the
          emergency contact card. Title sits at the top in normal flow,
          description uses auto margins to center vertically in the remaining
          space. This works for both 1-line and 2-line descriptions. */}
      {onSelectIntention && (
        <button
          type="button"
          onClick={onSelectIntention}
          className="relative w-full text-left border transition-colors overflow-visible flex flex-col items-start rounded-md mt-4"
          style={{
            borderColor: 'var(--color-border)',
            padding: WIDE_CARD_PADDING,
            height: `${WIDE_CARD_HEIGHT_PX}px`,
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
            className="text-[16px] m-0"
            style={{
              fontFamily: "'DM Serif Text', serif",
              textTransform: 'none',
              lineHeight: 1.15,
              color: 'var(--color-text-primary)',
              paddingLeft: CIRCLE_SIZE + CIRCLE_OFFSET - 5,
            }}
          >
            My Intention
          </p>
          {/* Auto margins center the description vertically in the remaining
              space below the title. Works for both 1-line and 2-line cases:
              flex distributes space equally above and below the description. */}
          <p
            className="w-full text-center uppercase tracking-wider"
            style={{
              margin: '0',
              marginTop: 'auto',
              marginBottom: 'auto',
              fontFamily: "'Azeret Mono', monospace",
              color: 'var(--color-text-tertiary)',
              fontSize: `${WIDE_DESC_FONT_SIZE_PX}px`,
              lineHeight: `${WIDE_DESC_LINE_HEIGHT_PX}px`,
              maxHeight: `${WIDE_DESC_LINE_HEIGHT_PX * 2}px`,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {intentionDescription}
          </p>
        </button>
      )}

      {/* Slim full-width emergency contact card — sits below the grid.
          Title at top, description centered vertically in the remaining space
          using auto margins (same as intention card above). */}
      {onSelectEmergencyContact && (
        <button
          type="button"
          onClick={onSelectEmergencyContact}
          className="relative w-full text-left border transition-colors overflow-visible flex flex-col items-start rounded-md mt-4"
          style={{
            borderColor: 'var(--color-border)',
            padding: WIDE_CARD_PADDING,
            height: `${WIDE_CARD_HEIGHT_PX}px`,
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
            className="text-[16px] m-0"
            style={{
              fontFamily: "'DM Serif Text', serif",
              textTransform: 'none',
              lineHeight: 1.15,
              color: 'var(--color-text-primary)',
              paddingLeft: CIRCLE_SIZE + CIRCLE_OFFSET - 5,
            }}
          >
            Emergency Contact
          </p>
          <p
            className="w-full text-center truncate uppercase tracking-wider"
            style={{
              margin: '0',
              marginTop: 'auto',
              marginBottom: 'auto',
              fontFamily: "'Azeret Mono', monospace",
              color: 'var(--color-text-tertiary)',
              fontSize: `${WIDE_DESC_FONT_SIZE_PX}px`,
              lineHeight: `${WIDE_DESC_LINE_HEIGHT_PX}px`,
            }}
          >
            {contactDescription}
          </p>
        </button>
      )}
    </div>
  );
}

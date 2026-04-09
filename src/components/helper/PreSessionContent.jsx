/**
 * PreSessionContent
 * The pre-session view of the Helper Modal. Shows the EXACT same category
 * grid + emergency contact card the user will see during their session,
 * but the 6 category cards are dimmed/inert. A centered explanatory card
 * overlays the grid explaining what the helper modal is for.
 *
 * The wide emergency contact card at the BOTTOM of the grid stays fully
 * interactive even in pre-session, so the user can navigate into the
 * EmergencyContactView and set up their contact details before the session
 * begins. CategoryGrid handles the partial dimming via its `categoriesDimmed`
 * prop — only the 6 category cards are wrapped in inert, the contact card
 * is rendered live below them.
 *
 * The point: instead of a single line of text that says "this exists,"
 * the user gets a real preview of the surface, which makes it much more
 * obvious what tools will be available to them mid-session, AND they can
 * still take an active step (set up their emergency contact) right now.
 */

import CategoryGrid from './CategoryGrid';
import { helperCategories } from '../../content/helper/categories';
import { HeartIcon } from '../shared/Icons';

export default function PreSessionContent({ emergencyContact, onSelectEmergencyContact }) {
  // Use the same active-phase categories the in-session modal would show.
  const activeCategories = helperCategories.filter((c) => c.phases?.includes('active'));

  return (
    <div className="relative animate-fadeIn">
      {/* Real CategoryGrid with dimmed categories. The contact card at the
          bottom remains fully interactive so the user can set up their
          emergency contact during pre-session. */}
      <CategoryGrid
        categories={activeCategories}
        onSelect={() => {}}
        emergencyContact={emergencyContact}
        onSelectEmergencyContact={onSelectEmergencyContact}
        categoriesDimmed
      />

      {/* Centered explanatory overlay. Absolutely positioned over the
          dimmed category grid only — sized so it doesn't extend down over
          the live emergency contact card at the bottom. */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center px-4 pointer-events-none"
        style={{ top: 0, bottom: '92px' }}
      >
        <div
          className="relative w-full max-w-[300px] border rounded-md text-center pointer-events-auto"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--bg-primary)',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
            padding: '14px 16px 16px 16px',
          }}
        >
          {/* Heart icon, matching the helper button in the header */}
          <div className="flex justify-center" style={{ marginBottom: '8px' }}>
            <HeartIcon size={22} strokeWidth={3} className="text-[var(--accent)]" />
          </div>

          <h3
            className="text-[16px] m-0"
            style={{
              fontFamily: "'DM Serif Text', serif",
              textTransform: 'none',
              color: 'var(--color-text-primary)',
              lineHeight: 1.2,
            }}
          >
            For when you need it
          </h3>

          <p
            className="text-[11px] leading-relaxed mt-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Once your session is underway, this menu becomes your
            in-the-moment companion. Tap a category that matches what
            you&rsquo;re feeling and you&rsquo;ll get phase-aware guidance
            and tailored activity suggestions.
          </p>
        </div>
      </div>
    </div>
  );
}

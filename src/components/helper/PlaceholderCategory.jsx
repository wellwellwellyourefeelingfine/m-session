/**
 * PlaceholderCategory
 * Tiny "Coming soon" view shown when the user taps a category that doesn't
 * yet have a V5 step tree defined. Currently used by the two follow-up
 * categories (`low-mood`, `integration-difficulty`) which are out of scope
 * for the V5 release and deferred to V6.
 *
 * Renders the standard CategoryHeader so the user still sees what they
 * tapped, plus a calm explanation that this category isn't ready yet.
 */

import CategoryHeader from './CategoryHeader';

export default function PlaceholderCategory({ category }) {
  return (
    <div className="space-y-5 animate-fadeIn">
      <div style={{ marginTop: '1px' }}>
        <CategoryHeader category={category} />
      </div>

      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        This category will be available soon. For now, the active session
        categories on the previous page can still help.
      </p>
    </div>
  );
}

/**
 * Resolve a header block's animation key. Distinguishes three cases:
 *
 *   undefined → defaults to 'ascii-moon'
 *   null      → no animation (text-heavy beat)
 *   'name'    → explicit animation
 *
 * Two consecutive screens with explicit `animation: null` are treated as the
 * same (no fade), and a transition from null → ascii-moon (or vice versa)
 * fades the animation slot.
 */
export default function resolveAnimationKey(headerBlock) {
  if (!headerBlock) return null;
  if (headerBlock.animation === null) return null;
  return headerBlock.animation || 'ascii-moon';
}

/**
 * DotSeparatorBlock — Block renderer for `{ type: 'dot-separator', count: N }`.
 *
 * Thin wrapper around the shared DotSeparator SVG. Used to visually punctuate
 * consecutive text blocks in `persistBlocks` progressive-reveal sections —
 * authors place a separator with `count: N` between text-block N and
 * text-block N+1, where the count matches the index of the text block below.
 *
 * The block opts out of `animate-fade-in` via a type-specific check in
 * ScreensSection's bodyBlocks map (so the 6px translateY + opacity keyframe
 * doesn't apply). The DotSeparator component handles its own draw-in entry
 * animation via stroke-dashoffset.
 */

import DotSeparator from '../../../capabilities/animations/dotSeparators/DotSeparator';

export default function DotSeparatorBlock({ screen }) {
  return <DotSeparator count={screen.count ?? 1} />;
}

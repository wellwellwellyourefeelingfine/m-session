/**
 * expandScreenToBlocks
 *
 * Converts a shorthand screen (with a `type` field) into an explicit blocks array.
 * If the screen already has a `blocks` array, it passes through unchanged.
 *
 * Shorthand expansion prepends a header block (title + AsciiMoon) to the content block,
 * matching the current default behavior where every screen has a header above it.
 *
 * The `animation` screen type is self-contained and does NOT get a header prepended.
 *
 * @param {object} screen - Screen config (shorthand or explicit)
 * @param {string} moduleTitle - Fallback title if screen has no header
 * @returns {object[]} Array of block configs
 */
export default function expandScreenToBlocks(screen, moduleTitle) {
  // Already explicit blocks — pass through
  if (screen.blocks) return screen.blocks;

  // Animation screens are self-contained (no header prepended)
  if (screen.type === 'animation') {
    return [{
      type: 'animation',
      animation: screen.animation,
      header: screen.header,
      lines: screen.lines,
    }];
  }

  // All other shorthand types: prepend a header block
  const headerBlock = {
    type: 'header',
    title: screen.header || moduleTitle,
    animation: 'ascii-moon',
  };

  // Build the content block — strip the 'header' field to avoid duplication
  const { header: _h, ...contentProps } = screen;
  const contentBlock = { ...contentProps };

  return [headerBlock, contentBlock];
}

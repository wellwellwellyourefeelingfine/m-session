/**
 * Manila envelope SVG path builder.
 * Pure utility — no React, no side effects. Separated for testability and fast refresh compliance.
 */

// Tunable constants (px)
export const CORNER_RADIUS = 16;
export const TAB_BEVEL_RADIUS = 12;
export const TAB_BOTTOM_RADIUS = 8;
export const TAB_WIDTH = 72;
export const TAB_DEPTH = 48; // how far the tab hangs below the main line

/**
 * Build the SVG path for the manila envelope bottom edge.
 * Draws left-to-right: bottom-left corner → left horizontal → tab entry → tab bottom → tab exit → right horizontal → bottom-right corner.
 * The path starts and ends at y = -CORNER_RADIUS (extending upward to overlap the modal body).
 */
export function buildModalPath(width) {
  const midX = width / 2;
  const tabHalf = TAB_WIDTH / 2;
  const mainY = 0;
  const tabY = TAB_DEPTH;

  const leftEnd = midX - tabHalf - TAB_BEVEL_RADIUS - 4;
  const rightStart = midX + tabHalf + TAB_BEVEL_RADIUS + 4;

  return [
    `M 0,${-CORNER_RADIUS}`,
    `Q 0,${mainY} ${CORNER_RADIUS},${mainY}`,
    `L ${leftEnd},${mainY}`,
    `Q ${midX - tabHalf - 4},${mainY} ${midX - tabHalf},${mainY + TAB_BEVEL_RADIUS}`,
    `L ${midX - tabHalf + 2},${tabY - TAB_BOTTOM_RADIUS}`,
    `Q ${midX - tabHalf + 2},${tabY} ${midX - tabHalf + TAB_BOTTOM_RADIUS + 2},${tabY}`,
    `L ${midX + tabHalf - TAB_BOTTOM_RADIUS - 2},${tabY}`,
    `Q ${midX + tabHalf - 2},${tabY} ${midX + tabHalf - 2},${tabY - TAB_BOTTOM_RADIUS}`,
    `L ${midX + tabHalf},${mainY + TAB_BEVEL_RADIUS}`,
    `Q ${midX + tabHalf + 4},${mainY} ${rightStart},${mainY}`,
    `L ${width - CORNER_RADIUS},${mainY}`,
    `Q ${width},${mainY} ${width},${-CORNER_RADIUS}`,
  ].join(' ');
}

/**
 * Build a stroke-only version of the path that only includes the visible bottom edge
 * (from the left corner bevel, along the main line, around the tab, and to the right corner bevel).
 * This excludes the vertical sides that overlap with the modal body.
 */
export function buildModalStrokePath(width) {
  const midX = width / 2;
  const tabHalf = TAB_WIDTH / 2;
  const mainY = 0;
  const tabY = TAB_DEPTH;

  const leftEnd = midX - tabHalf - TAB_BEVEL_RADIUS - 4;
  const rightStart = midX + tabHalf + TAB_BEVEL_RADIUS + 4;

  return [
    // Start at left corner, just at the main line
    `M 0,${mainY}`,
    `L ${CORNER_RADIUS},${mainY}`,
    `L ${leftEnd},${mainY}`,
    `Q ${midX - tabHalf - 4},${mainY} ${midX - tabHalf},${mainY + TAB_BEVEL_RADIUS}`,
    `L ${midX - tabHalf + 2},${tabY - TAB_BOTTOM_RADIUS}`,
    `Q ${midX - tabHalf + 2},${tabY} ${midX - tabHalf + TAB_BOTTOM_RADIUS + 2},${tabY}`,
    `L ${midX + tabHalf - TAB_BOTTOM_RADIUS - 2},${tabY}`,
    `Q ${midX + tabHalf - 2},${tabY} ${midX + tabHalf - 2},${tabY - TAB_BOTTOM_RADIUS}`,
    `L ${midX + tabHalf},${mainY + TAB_BEVEL_RADIUS}`,
    `Q ${midX + tabHalf + 4},${mainY} ${rightStart},${mainY}`,
    `L ${width - CORNER_RADIUS},${mainY}`,
    `L ${width},${mainY}`,
  ].join(' ');
}

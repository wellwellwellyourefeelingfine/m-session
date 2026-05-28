/**
 * Strip hidden elements, unused defs, and embedded raster images from SVGs.
 * Keeps only visible elements that actually render.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Process these SVGs
const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node clean-svg.mjs <file1.svg> [file2.svg ...]');
  process.exit(1);
}

for (const file of files) {
  const path = resolve(file);
  let svg = readFileSync(path, 'utf-8');
  const before = Buffer.byteLength(svg);

  // 1. Remove entire elements with display:none (including their children).
  //    These are multi-line, so we use a regex that matches the opening tag
  //    with display:none through to its closing tag or self-closing end.
  //    We run multiple passes since nested hidden elements may exist.
  let prevLen;
  do {
    prevLen = svg.length;

    // Remove <g ...display:none...>...</g> blocks (greedy match inner content
    // but the group's own closing </g> is the nearest one — we handle nesting
    // by iterating until stable).
    svg = svg.replace(/<g\b[^>]*display:none[^>]*>[\s\S]*?<\/g>/g, '');

    // Remove self-closing elements with display:none (e.g. <rect ... display:none ... />)
    svg = svg.replace(/<(?!g\b)[a-zA-Z]+\b[^>]*display:none[^>]*\/>/g, '');

    // Remove <image .../> elements (embedded rasters) — even visible ones
    // since this logo shouldn't have any raster images
    svg = svg.replace(/<image\b[\s\S]*?\/>/g, '');

  } while (svg.length !== prevLen);

  // 2. Remove elements with display:none in remaining content (non-group tags
  //    with children, like <text ...display:none...>...</text>)
  svg = svg.replace(/<(text|rect|circle|ellipse|path|use)\b[^>]*display:none[^>]*>[\s\S]*?<\/\1>/g, '');

  // 3. Collect all referenced IDs (url(#...), xlink:href="#...", href="#...")
  const refIds = new Set();
  const urlRefs = svg.matchAll(/url\(#([^)]+)\)/g);
  for (const m of urlRefs) refIds.add(m[1]);
  const hrefRefs = svg.matchAll(/(?:xlink:)?href="#([^"]+)"/g);
  for (const m of hrefRefs) refIds.add(m[1]);

  // 4. Remove unused gradient/filter/clipPath defs — anything in <defs> with
  //    an id that's not referenced. We do this iteratively since removing one
  //    def may make another unreferenced.
  do {
    prevLen = svg.length;

    // Re-scan references after each pass
    refIds.clear();
    for (const m of svg.matchAll(/url\(#([^)]+)\)/g)) refIds.add(m[1]);
    for (const m of svg.matchAll(/(?:xlink:)?href="#([^"]+)"/g)) refIds.add(m[1]);

    // Remove unreferenced elements inside defs
    svg = svg.replace(/<(linearGradient|radialGradient|filter|clipPath)\b[^>]*\bid="([^"]*)"[^>]*>[\s\S]*?<\/\1>/g,
      (match, tag, id) => refIds.has(id) ? match : '');

    // Also self-closing variants
    svg = svg.replace(/<(linearGradient|radialGradient|filter|clipPath)\b[^>]*\bid="([^"]*)"[^>]*\/>/g,
      (match, tag, id) => refIds.has(id) ? match : '');

  } while (svg.length !== prevLen);

  // 5. Clean up empty <defs></defs> or defs with only whitespace
  svg = svg.replace(/<defs\b[^>]*>\s*<\/defs>/g, '');

  // 6. Remove empty <g></g> wrappers left behind
  do {
    prevLen = svg.length;
    svg = svg.replace(/<g\b[^>]*>\s*<\/g>/g, '');
  } while (svg.length !== prevLen);

  // 7. Remove Inkscape comment
  svg = svg.replace(/<!--\s*Created with Inkscape[^>]*-->\s*/g, '');

  // 8. Collapse excessive whitespace / blank lines
  svg = svg.replace(/\n\s*\n\s*\n/g, '\n');

  const after = Buffer.byteLength(svg);
  writeFileSync(path, svg);
  console.log(`${file}: ${(before/1024).toFixed(0)}KB → ${(after/1024).toFixed(0)}KB (saved ${((before-after)/1024).toFixed(0)}KB, ${((1-after/before)*100).toFixed(0)}% reduction)`);
}

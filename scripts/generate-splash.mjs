/**
 * Generate PWA splash screens for iOS.
 * Uses the `canvas` npm package (already a devDependency).
 *
 * Produces 8 PNGs: 4 iPhone sizes × light/dark.
 * Logo is centered at ~28% of screen width.
 */

import { createCanvas, loadImage } from 'canvas';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, '..', 'public');
const ASSETS = '/Users/jordanellingwood/Desktop/Claude-Code/ASSETS-M-session/LOGO-ASSETS/Logo-asset-FINALS';

const SIZES = [
  [1170, 2532],
  [1284, 2778],
  [1179, 2556],
  [1290, 2796],
];

const THEMES = [
  { name: 'light', bg: '#F5F5F0', logo: `${ASSETS}/MM-Light-V3-trans-1024.png` },
  { name: 'dark',  bg: '#1A1A1A', logo: `${ASSETS}/MM-msession-square-DARK-trans-1024.png` },
];

// Logo renders at 28% of screen width, centered vertically
const LOGO_RATIO = 0.28;

async function main() {
  for (const theme of THEMES) {
    const logoImg = await loadImage(theme.logo);

    for (const [w, h] of SIZES) {
      const canvas = createCanvas(w, h);
      const ctx = canvas.getContext('2d');

      // Fill background
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, w, h);

      // Center logo
      const logoSize = Math.round(w * LOGO_RATIO);
      const x = Math.round((w - logoSize) / 2);
      const y = Math.round((h - logoSize) / 2);
      ctx.drawImage(logoImg, x, y, logoSize, logoSize);

      // Write PNG
      const filename = `splash-${theme.name}-${w}x${h}.png`;
      const buf = canvas.toBuffer('image/png');
      writeFileSync(resolve(PUBLIC, filename), buf);
      console.log(`  ${filename} (${(buf.length / 1024).toFixed(0)} KB)`);
    }
  }
  console.log('\nDone — 8 splash screens written to public/');
}

main().catch((err) => { console.error(err); process.exit(1); });

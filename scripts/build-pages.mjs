// Copies marketing-site files into dist/ as part of `npm run build`.
//
// Why this exists: the previous build step was a long shell `cp` chain with a
// hand-curated allowlist of files (landing-page.html, about.html, notes.html, ...).
// Every new HTML page, CSS file, or hero image required editing that allowlist,
// and forgetting to do so caused silent 404s in production. This script encodes
// the rules instead.
//
// Rules:
//   1. All *.html at repo root           → dist/
//      Plus: landing-page.html           → dist/index.html
//   2. All *.css at repo root            → dist/
//   3. Browser *.js at repo root         → dist/   (excludes *.config.js — those are Node tooling)
//   4. A short enumerated list of files from public/ → dist/
//      (public/ also contains PWA-only assets like pwa-*.png, audio/, splash-*.png,
//       which must NOT land at the marketing-site root. Hence the enumeration.)
//   5. public/notes/                      → dist/notes/   (recursive)
//
// When adding a new marketing asset:
//   - HTML / CSS / browser JS at repo root: nothing to do here, it's automatic.
//   - A new file under public/ that needs to be at the marketing root: add it
//     to PUBLIC_ROOT_ASSETS below.
//   - A new directory under public/ (like public/notes/) that needs to ship at
//     /<name>/ on the marketing site: add a cp() call at the bottom.

import { copyFile, cp, readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');

// Files in public/ that need to live at the marketing-site root.
// (Not auto-globbed because public/ mixes marketing + PWA assets.)
const PUBLIC_ROOT_ASSETS = [
  'og-image.png',
  'robots.txt',
  'sitemap.xml',
  'apple-touch-icon.png',
  'site-icons.svg',
  'empathogenic-business-card-msession-front-v1-2048px.png',
  'empathogenic-business-card-msession-front-DARK-v1.png',
];

const rootEntries = await readdir(root);
const publicEntries = await readdir(join(root, 'public'));

await mkdir(dist, { recursive: true });

// 1. HTML pages
const htmlFiles = rootEntries.filter((f) => f.endsWith('.html'));
await Promise.all(
  htmlFiles.map((f) => copyFile(join(root, f), join(dist, f)))
);
// landing-page.html also serves as the root index
await copyFile(join(root, 'landing-page.html'), join(dist, 'index.html'));

// 2. CSS files
const cssFiles = rootEntries.filter((f) => f.endsWith('.css'));
await Promise.all(
  cssFiles.map((f) => copyFile(join(root, f), join(dist, f)))
);

// 3. Browser JS (everything ending in .js except *.config.js)
const jsFiles = rootEntries.filter(
  (f) => f.endsWith('.js') && !f.endsWith('.config.js')
);
await Promise.all(
  jsFiles.map((f) => copyFile(join(root, f), join(dist, f)))
);

// 4. Marketing assets from public/
const favicons = publicEntries.filter((f) => f.startsWith('favicon-'));
const publicAssets = [...PUBLIC_ROOT_ASSETS, ...favicons];
await Promise.all(
  publicAssets.map((f) =>
    copyFile(join(root, 'public', f), join(dist, f))
  )
);

// 5. Recursive copies — directories of marketing assets. Add new dirs here.
await cp(join(root, 'public', 'notes'), join(dist, 'notes'), { recursive: true });

console.log(
  `[build-pages] copied ${htmlFiles.length} HTML, ${cssFiles.length} CSS, ${jsFiles.length} JS, ${publicAssets.length} public assets, and 1 directory (notes) into dist/`
);

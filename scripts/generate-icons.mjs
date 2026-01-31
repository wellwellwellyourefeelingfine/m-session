/**
 * Generate PWA icons from AsciiMoon pattern
 * Renders a static frame of the moon at ~half phase (most visually interesting)
 * and exports as PNG at all required sizes.
 *
 * Usage: node scripts/generate-icons.mjs
 */

import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

// ── Moon rendering logic (ported from AsciiMoon.jsx) ──

const DENSE = ['M', 'D', 'M', 'A'];
const SPARSE = ['.', ':', ';', ',', "'", '`', '-'];
const MID = ['+', '=', '*', '~'];

const SIZE = 20;
const CENTER_X = SIZE / 2;
const CENTER_Y = SIZE / 2;
const RADIUS = 8;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function renderMoon(phase) {
  const rows = [];
  for (let y = 0; y < SIZE; y++) {
    let row = '';
    for (let x = 0; x < SIZE; x++) {
      const dx = x - CENTER_X + 0.5;
      const dy = y - CENTER_Y + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const inCircle = dist <= RADIUS;

      if (!inCircle) {
        row += pick(MID);
        continue;
      }

      const nx = 0.1 + (x / SIZE) * 0.8;
      const threshold = nx + (Math.random() * 0.15 - 0.075);

      let lit;
      if (phase <= 0.5) {
        lit = threshold < phase * 2;
      } else {
        lit = threshold >= (phase - 0.5) * 2;
      }

      row += lit ? pick(SPARSE) : pick(DENSE);
    }
    rows.push(row);
  }
  return rows;
}

// ── PNG generation ──

function renderToPng(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background: light theme
  ctx.fillStyle = '#F5F5F0';
  ctx.fillRect(0, 0, size, size);

  // Render moon at phase 0.35 (waxing crescent — distinctive shape)
  const rows = renderMoon(0.35);

  // Calculate font size to fill the canvas with minimal padding
  const padding = size * 0.05;
  const availableSize = size - padding * 2;

  // Characters taller than wide in monospace — use width as constraint
  const charWidth = availableSize / SIZE;
  const charHeight = availableSize / SIZE;
  const fontSize = Math.floor(charHeight * 1.1);

  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = 'top';

  // Light mode accent: warm pastel orange
  const accentColor = '#E8A87C';

  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      const px = padding + x * charWidth;
      const py = padding + y * charHeight;

      // Background chars (outside circle) get lower opacity
      const dx = x - CENTER_X + 0.5;
      const dy = y - CENTER_Y + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const inCircle = dist <= RADIUS;

      if (inCircle) {
        // Moon body — lit chars slightly brighter
        const isLit = SPARSE.includes(ch);
        ctx.globalAlpha = isLit ? 0.9 : 0.65;
      } else {
        // Background
        ctx.globalAlpha = 0.2;
      }

      ctx.fillStyle = accentColor;
      ctx.fillText(ch, px, py);
    }
  }

  ctx.globalAlpha = 1.0;
  return canvas.toBuffer('image/png');
}

// ── Splash screen generation (portrait, moon centered) ──

function renderSplashPng(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background: light theme (#F5F5F0)
  ctx.fillStyle = '#F5F5F0';
  ctx.fillRect(0, 0, width, height);

  // Render moon at phase 0.35 (same as icons)
  const rows = renderMoon(0.35);

  // Moon should be a reasonable size — use ~40% of the shorter dimension (width)
  const moonSize = Math.floor(width * 0.4);
  const charWidth = moonSize / SIZE;
  const charHeight = moonSize / SIZE;
  const fontSize = Math.floor(charHeight * 1.1);

  // Center the moon in the canvas (slightly above center for visual balance)
  const offsetX = (width - moonSize) / 2;
  const offsetY = (height - moonSize) / 2 - height * 0.05;

  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = 'top';

  // Light mode accent: warm pastel orange
  const accentColor = '#E8A87C';

  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      const px = offsetX + x * charWidth;
      const py = offsetY + y * charHeight;

      const dx = x - CENTER_X + 0.5;
      const dy = y - CENTER_Y + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const inCircle = dist <= RADIUS;

      if (inCircle) {
        const isLit = SPARSE.includes(ch);
        ctx.globalAlpha = isLit ? 0.9 : 0.65;
      } else {
        ctx.globalAlpha = 0.2;
      }

      ctx.fillStyle = accentColor;
      ctx.fillText(ch, px, py);
    }
  }

  // Add "m-session" text below the moon
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = accentColor;
  const titleFontSize = Math.floor(width * 0.045);
  ctx.font = `${titleFontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('m-session', width / 2, offsetY + moonSize + height * 0.04);

  ctx.globalAlpha = 1.0;
  return canvas.toBuffer('image/png');
}

// ── Generate all sizes ──

console.log('Icons:');
const sizes = [
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 },
];

for (const { name, size } of sizes) {
  const buf = renderToPng(size);
  const path = join(PUBLIC_DIR, name);
  writeFileSync(path, buf);
  console.log(`  ${name} (${size}x${size})`);
}

console.log('\nSplash screens:');
const splashes = [
  { name: 'splash-1170x2532.png', width: 1170, height: 2532 },
  { name: 'splash-1284x2778.png', width: 1284, height: 2778 },
  { name: 'splash-1179x2556.png', width: 1179, height: 2556 },
  { name: 'splash-1290x2796.png', width: 1290, height: 2796 },
];

for (const { name, width, height } of splashes) {
  const buf = renderSplashPng(width, height);
  const path = join(PUBLIC_DIR, name);
  writeFileSync(path, buf);
  console.log(`  ${name} (${width}x${height})`);
}

// OG image (1200x630 landscape for social sharing)
console.log('\nOG image:');
function renderOgImage() {
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#F5F5F0';
  ctx.fillRect(0, 0, width, height);

  // Moon — smaller since landscape, offset to the left
  const rows = renderMoon(0.35);
  const moonSize = Math.floor(height * 0.5);
  const charWidth = moonSize / SIZE;
  const charHeight = moonSize / SIZE;
  const fontSize = Math.floor(charHeight * 1.1);

  const moonX = width * 0.22 - moonSize / 2;
  const moonY = (height - moonSize) / 2;

  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = 'top';
  const accentColor = '#E8A87C';

  for (let y = 0; y < rows.length; y++) {
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      const px = moonX + x * charWidth;
      const py = moonY + y * charHeight;
      const dx = x - CENTER_X + 0.5;
      const dy = y - CENTER_Y + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const inCircle = dist <= RADIUS;
      ctx.globalAlpha = inCircle ? (SPARSE.includes(ch) ? 0.9 : 0.65) : 0.2;
      ctx.fillStyle = accentColor;
      ctx.fillText(ch, px, py);
    }
  }

  // Title text — right side
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#333';
  ctx.font = '52px serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('m-session', width * 0.42, height * 0.4);

  // Tagline
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#666';
  ctx.font = '20px monospace';
  ctx.fillText('guided meditation & journaling', width * 0.42, height * 0.55);
  ctx.fillText('for intentional experiences', width * 0.42, height * 0.62);

  ctx.globalAlpha = 1.0;
  return canvas.toBuffer('image/png');
}

const ogBuf = renderOgImage();
writeFileSync(join(PUBLIC_DIR, 'og-image.png'), ogBuf);
console.log('  og-image.png (1200x630)');

console.log('\nAll icons, splash screens, and OG image generated in public/');

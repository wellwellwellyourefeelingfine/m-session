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

  // Background: match app theme
  ctx.fillStyle = '#1A1A1A';
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

  // Accent color from the app (purple)
  const accentColor = '#9D8CD9';

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
        ctx.globalAlpha = isLit ? 0.85 : 0.6;
      } else {
        // Background
        ctx.globalAlpha = 0.25;
      }

      ctx.fillStyle = accentColor;
      ctx.fillText(ch, px, py);
    }
  }

  ctx.globalAlpha = 1.0;
  return canvas.toBuffer('image/png');
}

// ── Generate all sizes ──

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

console.log('\nAll icons generated in public/');

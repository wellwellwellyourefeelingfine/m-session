#!/usr/bin/env node
// Generates OG images (1200×630) for light and dark modes
// Usage: node scripts/generate-og-images.mjs

import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Read logo PNGs and encode as base64 data URIs
const logoLight = readFileSync(resolve(root, 'public/m-session-logo-light.png'));
const logoLightB64 = `data:image/png;base64,${logoLight.toString('base64')}`;

const logoBlack = readFileSync(resolve(root, 'public/m-session-logo-black.png'));
const logoBlackB64 = `data:image/png;base64,${logoBlack.toString('base64')}`;

function buildHTML(mode) {
  const isDark = mode === 'dark';
  const bg = isDark ? '#0a0a0c' : '#f2f0eb';
  const titleColor = isDark ? '#f2f0eb' : '#1a1a1a';
  const subtitleColor = isDark ? 'rgba(242,240,235,0.55)' : 'rgba(26,26,26,0.45)';
  const logoSrc = isDark ? logoBlackB64 : logoLightB64;
  const dividerColor = isDark ? 'rgba(242,240,235,0.12)' : 'rgba(26,26,26,0.10)';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@400;500&family=DM+Serif+Text&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      width: 1200px;
      height: 630px;
      background: ${bg};
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .card {
      display: flex;
      align-items: center;
      gap: 64px;
      padding: 0 100px;
      width: 100%;
    }

    .logo-wrap {
      flex-shrink: 0;
    }

    .logo-wrap img {
      width: 220px;
      height: 220px;
      object-fit: contain;
    }

    .divider {
      width: 1px;
      height: 180px;
      background: ${dividerColor};
      flex-shrink: 0;
    }

    .text {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .title {
      font-family: 'DM Serif Text', serif;
      font-size: 72px;
      font-weight: 400;
      color: ${titleColor};
      line-height: 1;
      letter-spacing: -1px;
    }

    .subtitle {
      font-family: 'Azeret Mono', monospace;
      font-size: 15px;
      font-weight: 500;
      color: ${subtitleColor};
      text-transform: uppercase;
      letter-spacing: 3px;
      line-height: 1.7;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-wrap">
      <img src="${logoSrc}" alt="M" />
    </div>
    <div class="divider"></div>
    <div class="text">
      <div class="title">m-session</div>
      <div class="subtitle">Guided support for intentional<br>MDMA experiences</div>
    </div>
  </div>
</body>
</html>`;
}

async function generate() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

  for (const mode of ['light', 'dark']) {
    const html = buildHTML(mode);
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 1500));

    const outPath = mode === 'light'
      ? resolve(root, 'public/og-image.png')
      : resolve(root, 'public/og-image-dark.png');

    await page.screenshot({
      path: outPath,
      type: 'png',
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });

    console.log(`✓ Generated ${mode} → ${outPath}`);
  }

  await browser.close();
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});

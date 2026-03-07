#!/usr/bin/env node
// Captures app screenshots for README documentation
// Usage: node scripts/capture-screenshots.mjs
//
// Prerequisites: dev server running at localhost:5173
//   npm run dev  (in another terminal)
//
// Output: docs/screenshots/*.png

import puppeteer from 'puppeteer';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'docs/screenshots');

const MOBILE = { width: 390, height: 844 };
const PORT = process.env.PORT || '5175';
const APP_URL = `http://localhost:${PORT}/app/`;
const LANDING_URL = `http://localhost:${PORT}/`;

async function waitForApp(page) {
  // Wait for React to render
  await page.waitForSelector('[data-testid], header, main, .tab-bar, h1, h2', {
    timeout: 10000,
  }).catch(() => {});
  // Let animations settle
  await new Promise(r => setTimeout(r, 2000));
}

async function capture(page, name) {
  const path = resolve(outDir, `${name}.png`);
  await page.screenshot({ path, type: 'png' });
  console.log(`  ✓ ${name}.png`);
}

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ ...MOBILE, deviceScaleFactor: 2 });

  // ── Home Screen (Light Mode) ──────────────────────────
  console.log('\n📱 Home screen (light)...');
  // Clear any existing state so we get the fresh welcome screen
  await page.goto(APP_URL, { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await page.evaluate(() => {
    localStorage.removeItem('mdma-guide-session-state');
    localStorage.removeItem('mdma-guide-app-state');
  });
  await page.reload({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await waitForApp(page);
  await capture(page, 'home-light');

  // ── Home Screen (Dark Mode) ───────────────────────────
  console.log('🌙 Home screen (dark)...');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
    // Also persist it so the app picks it up
    const appState = JSON.parse(localStorage.getItem('mdma-guide-app-state') || '{}');
    if (appState.state) {
      appState.state.isDarkMode = true;
    } else {
      appState.state = { isDarkMode: true };
    }
    localStorage.setItem('mdma-guide-app-state', JSON.stringify(appState));
  });
  await new Promise(r => setTimeout(r, 500));
  await capture(page, 'home-dark');

  // Reset dark mode
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('mdma-guide-app-state');
  });

  // ── Landing Page (Light Mode, Desktop) ────────────────
  console.log('🖥️  Landing page...');
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  await page.goto(LANDING_URL, { waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
  await capture(page, 'landing-desktop');

  // ── Landing Page (Mobile) ─────────────────────────────
  await page.setViewport({ ...MOBILE, deviceScaleFactor: 2 });
  await page.reload({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
  await capture(page, 'landing-mobile');

  await browser.close();
  console.log(`\n✅ Screenshots saved to docs/screenshots/`);
  console.log('\nTip: For active session screenshots (meditation, journal, etc.),');
  console.log('capture manually from the app in the desired state.\n');
}

run().catch(err => {
  console.error('Screenshot capture failed:', err.message);
  process.exit(1);
});

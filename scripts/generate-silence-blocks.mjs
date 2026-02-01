/**
 * Generate Silence MP3 Blocks + Soft Gong
 *
 * Creates pre-generated silence MP3 files matching TTS clip format
 * (44100 Hz, mono, 128kbps) for use in client-side audio composition.
 *
 * Also generates a volume-adjusted gong file (66% volume) for embedding
 * in the composed meditation stream.
 *
 * Prerequisites: ffmpeg must be installed and available in PATH.
 *
 * Usage: node scripts/generate-silence-blocks.mjs [--dry-run]
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const DRY_RUN = process.argv.includes('--dry-run');

// Audio format matching TTS clips
const SAMPLE_RATE = 44100;
const CHANNELS = 1; // mono
const BITRATE = '128k';

// Silence durations to generate (in seconds)
const SILENCE_DURATIONS = [0.5, 1, 5, 10, 30, 60];

// Paths
const SILENCE_DIR = resolve(projectRoot, 'public/audio/silence');
const GONG_SRC = resolve(projectRoot, 'public/audio/meditation-bell.mp3');
const GONG_SOFT_DST = resolve(projectRoot, 'public/audio/meditation-bell-soft.mp3');

// Gong volume (matching GONG_VOLUME = 0.66 in useMeditationPlayback.js)
const GONG_VOLUME = 0.66;

function run(cmd, description) {
  console.log(`\n${description}`);
  console.log(`  $ ${cmd}`);
  if (!DRY_RUN) {
    execSync(cmd, { stdio: 'inherit' });
  }
}

function main() {
  console.log('=== Silence Block & Soft Gong Generator ===');
  if (DRY_RUN) console.log('(DRY RUN — no files will be created)\n');

  // Create silence directory
  if (!existsSync(SILENCE_DIR) && !DRY_RUN) {
    mkdirSync(SILENCE_DIR, { recursive: true });
    console.log(`Created directory: ${SILENCE_DIR}`);
  }

  // Generate silence blocks
  for (const duration of SILENCE_DURATIONS) {
    const filename = `silence-${duration}s.mp3`;
    const outputPath = resolve(SILENCE_DIR, filename);

    run(
      `ffmpeg -y -f lavfi -i anullsrc=r=${SAMPLE_RATE}:cl=mono -t ${duration} -ab ${BITRATE} -ar ${SAMPLE_RATE} -ac ${CHANNELS} "${outputPath}"`,
      `Generating ${filename} (${duration}s of silence, mono, ${SAMPLE_RATE}Hz, ${BITRATE})`
    );
  }

  // Generate soft gong (volume-adjusted + converted to mono 128kbps to match TTS)
  if (!existsSync(GONG_SRC)) {
    console.error(`\nError: Gong source not found at ${GONG_SRC}`);
    process.exit(1);
  }

  run(
    `ffmpeg -y -i "${GONG_SRC}" -af "volume=${GONG_VOLUME}" -ac ${CHANNELS} -ar ${SAMPLE_RATE} -ab ${BITRATE} "${GONG_SOFT_DST}"`,
    `Generating meditation-bell-soft.mp3 (${Math.round(GONG_VOLUME * 100)}% volume, mono, ${SAMPLE_RATE}Hz, ${BITRATE})`
  );

  console.log('\n=== Done ===');
  if (!DRY_RUN) {
    console.log(`\nGenerated files:`);
    for (const duration of SILENCE_DURATIONS) {
      console.log(`  public/audio/silence/silence-${duration}s.mp3`);
    }
    console.log(`  public/audio/meditation-bell-soft.mp3`);
  }
}

main();

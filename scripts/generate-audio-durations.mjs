/**
 * Generate Audio Duration Manifest
 *
 * Scans all meditation audio directories, computes accurate durations
 * from MP3 file sizes (CBR 128kbps = 16,000 bytes/sec), and writes
 * a JSON manifest for use by the duration calculation functions.
 *
 * This replaces the inaccurate word-count-based WPM estimates with
 * precise byte-derived durations.
 *
 * Usage: node scripts/generate-audio-durations.mjs
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const AUDIO_BASE = resolve(projectRoot, 'public/audio/meditations');
const OUTPUT_PATH = resolve(projectRoot, 'src/content/meditations/audio-durations.json');
const CBR_BYTES_PER_SECOND = 16000;

/**
 * Read ID3v2 tag size from an MP3 file header.
 * Returns the number of bytes occupied by the tag (including header), or 0 if none.
 */
function getID3TagSize(filePath) {
  const buf = readFileSync(filePath, { length: 10 });
  // ID3v2 header: "ID3" + version (2 bytes) + flags (1 byte) + size (4 bytes synchsafe)
  if (buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
    const size = ((buf[6] & 0x7F) << 21) |
                 ((buf[7] & 0x7F) << 14) |
                 ((buf[8] & 0x7F) << 7)  |
                  (buf[9] & 0x7F);
    return size + 10; // +10 for the header itself
  }
  return 0;
}

// Scan all meditation audio directories
const manifest = {};
let totalClips = 0;

const dirs = readdirSync(AUDIO_BASE, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

for (const dir of dirs) {
  const dirPath = resolve(AUDIO_BASE, dir);
  const files = readdirSync(dirPath)
    .filter(f => f.endsWith('.mp3'))
    .sort();

  if (files.length === 0) continue;

  const durations = {};
  for (const file of files) {
    const filePath = resolve(dirPath, file);
    const fileSize = statSync(filePath).size;
    const id3Size = getID3TagSize(filePath);
    const audioBytes = fileSize - id3Size;
    const duration = Math.round((audioBytes / CBR_BYTES_PER_SECOND) * 100) / 100; // 2 decimal places
    const promptId = basename(file, '.mp3');
    durations[promptId] = duration;
    totalClips++;
  }

  manifest[dir] = durations;
}

// Write manifest
writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + '\n');

console.log(`Generated audio duration manifest:`);
console.log(`  ${dirs.length} meditations, ${totalClips} clips`);
console.log(`  Output: ${OUTPUT_PATH}`);

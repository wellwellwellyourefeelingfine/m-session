/**
 * Generate Self-Compassion Meditation Audio
 *
 * Calls the ElevenLabs TTS API to generate MP3 files for all 70 clips.
 * Clips span 3 groups: 42 core + 15 relationship + 13 going deeper.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=your_key node scripts/generate-self-compassion-audio.mjs
 *
 * Options:
 *   --dry-run       Print clips and filenames without calling the API
 *   --list-voices   List all voices available to your account
 *   --start N       Start from clip index N (0-based, for resuming after errors)
 *   --only ID       Generate only a specific clip by ID (e.g. --only core-01)
 *   --group GROUP   Generate only clips from a group: core, relationship, or deeper
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// --- Configuration ---
const VOICE_ID = 'jfIS2w2yJi0grJZPyEsk'; // Oliver Silk
const MODEL_ID = 'eleven_multilingual_v2';
const OUTPUT_FORMAT = 'mp3_44100_128'; // High quality MP3
const API_BASE = 'https://api.elevenlabs.io/v1';

// Voice settings tuned for slow, meditative speech
const VOICE_SETTINGS = {
  stability: 0.88,
  similarity_boost: 0.88,
  style: 0.0,
  use_speaker_boost: false,
};

// Speech speed (0.25-4.0, where 1.0 = normal pace)
const SPEECH_SPEED = 0.70;

// Delay between requests to respect rate limits (ms)
const REQUEST_DELAY = 1200;

// --- Resolve paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'audio', 'meditations', 'self-compassion');

// --- Import clips from content definition ---
const { selfCompassionMeditation } = await import('../src/content/meditations/self-compassion.js');

// Build a flat list of all unique clips across all variations
// Core clips come from the default variation, then add relationship and going-deeper extras
const allClips = [];
const seenIds = new Set();

for (const variationKey of ['default', 'relationship', 'going-deeper']) {
  const clips = selfCompassionMeditation.assembleVariation(variationKey);
  for (const clip of clips) {
    if (!seenIds.has(clip.id)) {
      seenIds.add(clip.id);
      allClips.push(clip);
    }
  }
}

// --- Parse CLI args ---
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const listVoices = args.includes('--list-voices');
const startIdx = args.includes('--start') ? parseInt(args[args.indexOf('--start') + 1], 10) : 0;
const onlyId = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const groupFilter = args.includes('--group') ? args[args.indexOf('--group') + 1] : null;

// --- Validate ---
const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey && !dryRun) {
  console.error('Error: ELEVENLABS_API_KEY environment variable is required.');
  console.error('Usage: ELEVENLABS_API_KEY=your_key node scripts/generate-self-compassion-audio.mjs');
  process.exit(1);
}

// --- List available voices ---
if (listVoices) {
  if (!apiKey) {
    console.error('Error: ELEVENLABS_API_KEY is required to list voices.');
    process.exit(1);
  }

  console.log('Fetching available voices...\n');
  const res = await fetch(`${API_BASE}/voices`, {
    headers: { 'xi-api-key': apiKey },
  });

  if (!res.ok) {
    console.error(`API error ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const { voices } = await res.json();
  console.log(`Found ${voices.length} voices:\n`);

  for (const v of voices) {
    const category = v.category || 'unknown';
    const labels = v.labels
      ? Object.entries(v.labels).map(([k, val]) => `${k}: ${val}`).join(', ')
      : '';
    console.log(`  ${v.name}`);
    console.log(`    ID:       ${v.voice_id}`);
    console.log(`    Category: ${category}`);
    if (labels) console.log(`    Labels:   ${labels}`);
    console.log();
  }

  console.log('To use a voice, update VOICE_ID in this script.');
  process.exit(0);
}

// --- Main ---
async function generateAudio(clipId, text) {
  const url = `${API_BASE}/text-to-speech/${VOICE_ID}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      output_format: OUTPUT_FORMAT,
      voice_settings: VOICE_SETTINGS,
      speed: SPEECH_SPEED,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getClipGroup(id) {
  if (id.startsWith('core-')) return 'core';
  if (id.startsWith('rel-')) return 'relationship';
  if (id.startsWith('deep-')) return 'deeper';
  return 'unknown';
}

async function main() {
  const totalChars = allClips.reduce((sum, c) => sum + c.text.length, 0);

  console.log(`Self-Compassion Audio Generator`);
  console.log(`===============================`);
  console.log(`Voice: Oliver Silk (${VOICE_ID})`);
  console.log(`Model: ${MODEL_ID}`);
  console.log(`Total unique clips: ${allClips.length}`);
  console.log(`  Core: ${allClips.filter(c => c.id.startsWith('core-')).length}`);
  console.log(`  Relationship: ${allClips.filter(c => c.id.startsWith('rel-')).length}`);
  console.log(`  Going Deeper: ${allClips.filter(c => c.id.startsWith('deep-')).length}`);
  console.log(`Total characters: ${totalChars}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log();

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
  }

  // Filter clips based on CLI args
  let filtered = allClips.map((c, i) => ({ ...c, index: i }));

  if (onlyId) {
    filtered = filtered.filter(c => c.id === onlyId);
    if (filtered.length === 0) {
      console.error(`Error: No clip found with ID "${onlyId}"`);
      console.error(`Available IDs: ${allClips.map(c => c.id).join(', ')}`);
      process.exit(1);
    }
  } else if (groupFilter) {
    filtered = filtered.filter(c => getClipGroup(c.id) === groupFilter);
    if (filtered.length === 0) {
      console.error(`Error: No clips found for group "${groupFilter}"`);
      console.error(`Available groups: core, relationship, deeper`);
      process.exit(1);
    }
    console.log(`Filtering to group: ${groupFilter} (${filtered.length} clips)\n`);
  } else if (startIdx > 0) {
    filtered = filtered.filter(c => c.index >= startIdx);
  }

  if (dryRun) {
    console.log('DRY RUN — no API calls will be made.\n');
    for (const clip of filtered) {
      const filename = `${clip.id}.mp3`;
      const group = getClipGroup(clip.id);
      console.log(`[${clip.index + 1}/${allClips.length}] ${filename} (${group})`);
      console.log(`  Text: "${clip.text}"`);
      console.log(`  Chars: ${clip.text.length}`);
      console.log();
    }
    console.log(`Total files: ${filtered.length}`);
    console.log(`Total characters: ${filtered.reduce((s, c) => s + c.text.length, 0)}`);
    return;
  }

  // Generate audio for each clip
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < filtered.length; i++) {
    const clip = filtered[i];
    const filename = `${clip.id}.mp3`;
    const filepath = path.join(OUTPUT_DIR, filename);
    const group = getClipGroup(clip.id);

    console.log(`[${clip.index + 1}/${allClips.length}] Generating ${filename} (${group})...`);
    console.log(`  "${clip.text.substring(0, 60)}${clip.text.length > 60 ? '...' : ''}"`);

    try {
      const audioBuffer = await generateAudio(clip.id, clip.text);
      await writeFile(filepath, audioBuffer);
      const sizeKB = (audioBuffer.length / 1024).toFixed(1);
      console.log(`  Saved (${sizeKB} KB)`);
      successCount++;
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      console.error(`  To retry this clip: --only ${clip.id}`);
      console.error(`  To resume from here: --start ${clip.index}`);
      errorCount++;
    }

    // Rate limit delay (skip on last item)
    if (i < filtered.length - 1) {
      await sleep(REQUEST_DELAY);
    }
  }

  console.log();
  console.log(`Done! ${successCount} succeeded, ${errorCount} failed.`);
  if (errorCount > 0) {
    console.log(`Re-run with --start or --only to retry failed clips.`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

/**
 * Generate Stay With It Meditation Audio
 *
 * Calls the ElevenLabs TTS API to generate MP3 files for all 23 prompts.
 * "Stay With It" — Reconsolidation meditation
 *
 * Usage:
 *   ELEVENLABS_API_KEY=your_key node scripts/generate-stay-with-it-audio.mjs
 *
 * Options:
 *   --dry-run       Print prompts and filenames without calling the API
 *   --list-voices   List all voices available to your account
 *   --start N       Start from prompt index N (0-based, for resuming after errors)
 *   --only ID       Generate only a specific prompt by ID (e.g. --only arriving-01)
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// --- Configuration ---
const VOICE_ID = 'UmQN7jS1Ee8B1czsUtQh'; // Theo Silk
const MODEL_ID = 'eleven_multilingual_v2';
const OUTPUT_FORMAT = 'mp3_44100_128'; // High quality MP3
const API_BASE = 'https://api.elevenlabs.io/v1';

// Voice settings tuned for Theo Silk meditative delivery
// Speed: 0.7-1.2 (1.0 = normal pace; 0.7 = slowest allowed)
const VOICE_SETTINGS = {
  stability: 0.85,
  similarity_boost: 0.70,
  style: 0.0,
  use_speaker_boost: true,
  speed: 0.81,
};

// Delay between requests to respect rate limits (ms)
const REQUEST_DELAY = 1200;

// --- Resolve paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'audio', 'meditations', 'stay-with-it');

// --- Import prompts from content definition ---
const { stayWithItMeditation } = await import('../src/content/meditations/stay-with-it.js');
const allPrompts = stayWithItMeditation.prompts;

// --- Parse CLI args ---
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const listVoices = args.includes('--list-voices');
const startIdx = args.includes('--start') ? parseInt(args[args.indexOf('--start') + 1], 10) : 0;
const onlyId = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

// --- Validate ---
const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey && !dryRun) {
  console.error('Error: ELEVENLABS_API_KEY environment variable is required.');
  console.error('Usage: ELEVENLABS_API_KEY=your_key node scripts/generate-stay-with-it-audio.mjs');
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
async function generateAudio(promptId, text) {
  const url = `${API_BASE}/text-to-speech/${VOICE_ID}?output_format=${OUTPUT_FORMAT}`;

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
      voice_settings: VOICE_SETTINGS,
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

async function main() {
  const totalChars = allPrompts.reduce((sum, p) => sum + p.text.length, 0);

  console.log(`Stay With It Audio Generator`);
  console.log(`============================`);
  console.log(`Voice: Theo Silk (${VOICE_ID})`);
  console.log(`Model: ${MODEL_ID}`);
  console.log(`Total prompts: ${allPrompts.length}`);
  console.log(`Total characters: ${totalChars}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log();

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
  }

  // Filter prompts based on CLI args
  let filtered = allPrompts.map((p, i) => ({ ...p, index: i }));

  if (onlyId) {
    filtered = filtered.filter(p => p.id === onlyId);
    if (filtered.length === 0) {
      console.error(`Error: No prompt found with ID "${onlyId}"`);
      console.error(`Available IDs: ${allPrompts.map(p => p.id).join(', ')}`);
      process.exit(1);
    }
  } else if (startIdx > 0) {
    filtered = filtered.filter(p => p.index >= startIdx);
  }

  if (dryRun) {
    console.log('DRY RUN — no API calls will be made.\n');
    for (const prompt of filtered) {
      const filename = `${prompt.id}.mp3`;
      console.log(`[${prompt.index + 1}/${allPrompts.length}] ${filename}`);
      console.log(`  Text: "${prompt.text}"`);
      console.log(`  Chars: ${prompt.text.length}`);
      if (prompt.conditional) {
        console.log(`  Conditional: minDuration >= ${prompt.conditional.minDuration} min`);
      }
      console.log();
    }
    console.log(`Total files: ${filtered.length}`);
    console.log(`Total characters: ${filtered.reduce((s, p) => s + p.text.length, 0)}`);
    return;
  }

  // Generate audio for each prompt
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < filtered.length; i++) {
    const prompt = filtered[i];
    const filename = `${prompt.id}.mp3`;
    const filepath = path.join(OUTPUT_DIR, filename);

    console.log(`[${prompt.index + 1}/${allPrompts.length}] Generating ${filename}...`);
    console.log(`  "${prompt.text.substring(0, 60)}${prompt.text.length > 60 ? '...' : ''}"`);

    try {
      const audioBuffer = await generateAudio(prompt.id, prompt.text);
      await writeFile(filepath, audioBuffer);
      const sizeKB = (audioBuffer.length / 1024).toFixed(1);
      console.log(`  Saved (${sizeKB} KB)`);
      successCount++;
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      console.error(`  To retry this prompt: --only ${prompt.id}`);
      console.error(`  To resume from here: --start ${prompt.index}`);
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
    console.log(`Re-run with --start or --only to retry failed prompts.`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

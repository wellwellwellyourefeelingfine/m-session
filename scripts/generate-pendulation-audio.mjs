/**
 * Generate Pendulation Meditation Audio
 *
 * Calls the ElevenLabs TTS API to generate MP3 files for all ~131 prompts
 * across 5 audio sections (A, B, B-Ground, C, D).
 * "Pendulation" — Somatic Experiencing (Peter Levine)
 *
 * Usage:
 *   ELEVENLABS_API_KEY=your_key node scripts/generate-pendulation-audio.mjs
 *
 * Options:
 *   --dry-run       Print prompts and filenames without calling the API
 *   --list-voices   List all voices available to your account
 *   --start N       Start from prompt index N (0-based, for resuming after errors)
 *   --end N         Stop after prompt index N (0-based, use with --start for ranges)
 *   --only ID       Generate only a specific prompt by ID (e.g. --only a-settle-01)
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

// Voice settings — standard Theo Silk meditative delivery
// Speed is set per-prompt (see getSpeedForPrompt below)
const VOICE_SETTINGS = {
  stability: 0.80,
  similarity_boost: 0.80,
  style: 0.0,
  use_speaker_boost: true,
};

// --- Speed configuration ---
// Gradual step-down from 0.91 (lightest) to 0.83 (deepest) based on
// section intensity. As the meditation deepens, the voice slows to
// match the increasingly internal, somatic quality of the guidance.
//
// Section A (Core Practice) — 6 parts with progressive depth:
//   Settling In  → Resourcing → Felt Sense Tracking →
//   Approaching Activation → Pendulation → Voo Sound
//
// Sections B–D — branching paths at their own intensity levels:
//   B  = fight/flight processing (deep)
//   B-Ground = grounding after activation (lighter, returning)
//   C  = freeze support (deepest, most internal)
//   D  = closing integration (coming back up)

const SPEED_MAP = [
  // Section A — gradual descent through core practice
  { prefix: 'a-settle',   speed: 0.89 },  // Opening, settling in
  { prefix: 'a-resource', speed: 0.89 },  // Building safety resources
  { prefix: 'a-track',    speed: 0.89 },  // Turning attention inward
  { prefix: 'a-activate', speed: 0.88 },  // Approaching activation
  { prefix: 'a-voo',      speed: 0.86 },  // Voo sound — deep somatic discharge
  { prefix: 'a-pend',     speed: 0.86 },  // Pendulation — sustained internal work

  // Section B-Ground — grounding after activation (same as B)
  { prefix: 'b-ground',   speed: 0.85 },  // Returning, calming

  // Section B — survival response processing
  { prefix: 'b-',         speed: 0.85 },  // Fight/flight — intense, deep

  // Section C — freeze support (deepest work)
  { prefix: 'c-',         speed: 0.84 },  // Freeze — slowest, most held

  // Section D — closing integration
  { prefix: 'd-',         speed: 0.85 },  // Coming back, integrating
];

function getSpeedForPrompt(promptId) {
  const match = SPEED_MAP.find(entry => promptId.startsWith(entry.prefix));
  return match ? match.speed : 0.87; // fallback to moderate pace
}

// Delay between requests to respect rate limits (ms)
const REQUEST_DELAY = 1200;

// --- Resolve paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public', 'audio', 'meditations', 'pendulation');

// --- Import prompts from content definition ---
const { pendulationMeditation } = await import('../src/content/meditations/pendulation.js');

// Gather all prompts from all sections into a flat array with section labels
const SECTION_ORDER = ['a', 'b', 'bGround', 'c', 'd'];
const allPrompts = [];
for (const key of SECTION_ORDER) {
  const section = pendulationMeditation.sections[key];
  for (const prompt of section.prompts) {
    allPrompts.push({ ...prompt, sectionKey: key, sectionLabel: section.label });
  }
}

// --- Parse CLI args ---
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const listVoices = args.includes('--list-voices');
const startIdx = args.includes('--start') ? parseInt(args[args.indexOf('--start') + 1], 10) : 0;
const endIdx = args.includes('--end') ? parseInt(args[args.indexOf('--end') + 1], 10) : Infinity;
const onlyId = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

// --- Validate ---
const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey && !dryRun) {
  console.error('Error: ELEVENLABS_API_KEY environment variable is required.');
  console.error('Usage: ELEVENLABS_API_KEY=your_key node scripts/generate-pendulation-audio.mjs');
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
/**
 * Generate audio for a single prompt.
 * Each prompt is generated independently (no chaining) to prevent
 * cumulative volume drift across successive generations.
 *
 * @returns {{ buffer: Buffer }}
 */
async function generateAudio(promptId, text, speed) {
  const url = `${API_BASE}/text-to-speech/${VOICE_ID}?output_format=${OUTPUT_FORMAT}`;

  const body = {
    text,
    model_id: MODEL_ID,
    voice_settings: { ...VOICE_SETTINGS, speed },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer) };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const totalChars = allPrompts.reduce((sum, p) => sum + p.text.length, 0);

  // Section summary
  const sectionCounts = {};
  for (const key of SECTION_ORDER) {
    sectionCounts[key] = pendulationMeditation.sections[key].prompts.length;
  }

  console.log(`Pendulation Audio Generator`);
  console.log(`===========================`);
  console.log(`Voice: Theo Silk (${VOICE_ID})`);
  console.log(`Model: ${MODEL_ID}`);
  console.log(`Speed: 0.91 (lightest) → 0.83 (deepest) — gradual step-down`);
  console.log(`Total prompts: ${allPrompts.length}`);
  console.log(`Total characters: ${totalChars}`);
  console.log(`Sections: ${SECTION_ORDER.map(k => `${k}(${sectionCounts[k]})`).join(', ')}`);
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
  } else {
    if (startIdx > 0) {
      filtered = filtered.filter(p => p.index >= startIdx);
    }
    if (endIdx < Infinity) {
      filtered = filtered.filter(p => p.index <= endIdx);
    }
  }

  if (dryRun) {
    console.log('DRY RUN — no API calls will be made.\n');
    let currentSection = null;
    for (const prompt of filtered) {
      if (prompt.sectionKey !== currentSection) {
        currentSection = prompt.sectionKey;
        console.log(`\n--- Section ${currentSection.toUpperCase()} (${prompt.sectionLabel}) ---\n`);
      }
      const filename = `${prompt.id}.mp3`;
      const speed = getSpeedForPrompt(prompt.id);
      console.log(`[${prompt.index + 1}/${allPrompts.length}] ${filename}  (speed: ${speed})`);
      console.log(`  Text: "${prompt.text}"`);
      console.log(`  Chars: ${prompt.text.length}`);
      console.log();
    }
    console.log(`Total files: ${filtered.length}`);
    console.log(`Total characters: ${filtered.reduce((s, p) => s + p.text.length, 0)}`);
    return;
  }

  // Generate audio for each prompt (no chaining — each prompt is independent
  // to prevent cumulative volume drift across successive generations)
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < filtered.length; i++) {
    const prompt = filtered[i];
    const filename = `${prompt.id}.mp3`;
    const filepath = path.join(OUTPUT_DIR, filename);

    const speed = getSpeedForPrompt(prompt.id);
    console.log(`[${prompt.index + 1}/${allPrompts.length}] Generating ${filename} (${prompt.sectionLabel}, speed: ${speed})...`);
    console.log(`  "${prompt.text.substring(0, 60)}${prompt.text.length > 60 ? '...' : ''}"`);

    try {
      const { buffer } = await generateAudio(prompt.id, prompt.text, speed);
      await writeFile(filepath, buffer);
      const sizeKB = (buffer.length / 1024).toFixed(1);
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
  console.log();
  console.log('Next step: node scripts/generate-audio-durations.mjs');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

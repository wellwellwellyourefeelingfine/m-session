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
 *   --voice KEY     Voice preset to use: theo or rachel (default: theo)
 *   --start N       Start from prompt index N (0-based, for resuming after errors)
 *   --end N         Stop after prompt index N (0-based, use with --start for ranges)
 *   --only ID       Generate only a specific prompt by ID (e.g. --only a-settle-01)
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// --- Configuration ---
const OUTPUT_FORMAT = 'mp3_44100_128'; // High quality MP3
const API_BASE = 'https://api.elevenlabs.io/v1';

const VOICE_PRESETS = {
  theo: {
    label: 'Theo Silk',
    voiceId: 'UmQN7jS1Ee8B1czsUtQh',
    modelId: 'eleven_multilingual_v2',
    outputSubdir: null,
    defaultSpeed: 0.87,
    speedMap: [
      // Section A — gradual descent through core practice
      { prefix: 'a-settle',   speed: 0.89 },  // Opening, settling in
      { prefix: 'a-resource', speed: 0.89 },  // Building safety resources
      { prefix: 'a-track',    speed: 0.89 },  // Turning attention inward
      { prefix: 'a-activate', speed: 0.88 },  // Approaching activation
      { prefix: 'a-voo',      speed: 0.86 },  // Voo sound — deep somatic discharge
      { prefix: 'a-pend',     speed: 0.86 },  // Pendulation — sustained internal work
      { prefix: 'b-ground',   speed: 0.85 },  // Returning, calming
      { prefix: 'b-',         speed: 0.85 },  // Fight/flight — intense, deep
      { prefix: 'c-',         speed: 0.84 },  // Freeze — slowest, most held
      { prefix: 'd-',         speed: 0.85 },  // Coming back, integrating
    ],
    settings: {
      stability: 0.80,
      similarity_boost: 0.80,
      style: 0.0,
      use_speaker_boost: true,
    },
  },
  rachel: {
    label: 'Relaxing Rachel - Calm & Soothing',
    voiceId: 'ROMJ9yK1NAMuu1ggrjDW',
    modelId: 'eleven_multilingual_v2',
    outputSubdir: 'relaxing-rachel',
    defaultSpeed: 0.81,
    speedMap: [],
    settings: {
      stability: 0.80,
      similarity_boost: 0.75,
      style: 0.50,
      use_speaker_boost: true,
    },
  },
};

function getSpeedForPrompt(promptId) {
  const match = (selectedVoice.speedMap || []).find(entry => promptId.startsWith(entry.prefix));
  return match ? match.speed : selectedVoice.defaultSpeed;
}

// Delay between requests to respect rate limits (ms)
const REQUEST_DELAY = 1200;

// --- Resolve paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

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
const voiceKey = args.includes('--voice') ? args[args.indexOf('--voice') + 1] : 'theo';
const startIdx = args.includes('--start') ? parseInt(args[args.indexOf('--start') + 1], 10) : 0;
const endIdx = args.includes('--end') ? parseInt(args[args.indexOf('--end') + 1], 10) : Infinity;
const onlyId = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const selectedVoice = VOICE_PRESETS[voiceKey];
if (!selectedVoice) {
  console.error(`Error: Unknown voice preset "${voiceKey}".`);
  console.error(`Available voices: ${Object.keys(VOICE_PRESETS).join(', ')}`);
  process.exit(1);
}

const OUTPUT_DIR = path.join(
  PROJECT_ROOT,
  'public',
  'audio',
  'meditations',
  'pendulation',
  ...(selectedVoice.outputSubdir ? [selectedVoice.outputSubdir] : []),
);

function loadApiKey() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  if (process.env.ELEVENLABS_API) return process.env.ELEVENLABS_API;

  const envPath = path.join(PROJECT_ROOT, '.env');
  if (!existsSync(envPath)) return null;

  const envText = readFileSync(envPath, 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (key !== 'ELEVENLABS_API_KEY' && key !== 'ELEVENLABS_API') continue;

    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    return value;
  }

  return null;
}

// --- Validate ---
const apiKey = loadApiKey();
if (!apiKey && !dryRun) {
  console.error('Error: ELEVENLABS_API_KEY or ELEVENLABS_API is required.');
  console.error('Set it in the environment or in .env, then run node scripts/generate-pendulation-audio.mjs');
  process.exit(1);
}

// --- List available voices ---
if (listVoices) {
  if (!apiKey) {
    console.error('Error: ELEVENLABS_API_KEY or ELEVENLABS_API is required to list voices.');
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

  console.log(`To use a preset, pass --voice ${Object.keys(VOICE_PRESETS).join('|')}.`);
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
  const url = `${API_BASE}/text-to-speech/${selectedVoice.voiceId}?output_format=${OUTPUT_FORMAT}`;

  const body = {
    text,
    model_id: selectedVoice.modelId,
    voice_settings: { ...selectedVoice.settings, speed },
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
  console.log(`Voice: ${selectedVoice.label} (${selectedVoice.voiceId})`);
  console.log(`Model: ${selectedVoice.modelId}`);
  console.log(`Settings: ${JSON.stringify(selectedVoice.settings)}`);
  console.log(`Default speed: ${selectedVoice.defaultSpeed}`);
  if (selectedVoice.speedMap?.length) {
    console.log(`Custom speed rules: ${selectedVoice.speedMap.length}`);
  }
  console.log(`Total prompts: ${allPrompts.length}`);
  console.log(`Total characters: ${totalChars}`);
  console.log(`Sections: ${SECTION_ORDER.map(k => `${k}(${sectionCounts[k]})`).join(', ')}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log();

  // Ensure output directory exists
  if (!dryRun && !existsSync(OUTPUT_DIR)) {
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

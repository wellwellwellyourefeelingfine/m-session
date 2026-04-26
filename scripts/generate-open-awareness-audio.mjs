/**
 * Generate Open Awareness Meditation Audio
 *
 * Calls the ElevenLabs TTS API to generate MP3 files for all prompts.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=your_key node scripts/generate-open-awareness-audio.mjs
 *   node scripts/generate-open-awareness-audio.mjs --voice rachel --dry-run
 *
 * Options:
 *   --dry-run       Print prompts and filenames without calling the API
 *   --list-voices   List all voices available to your account
 *   --voice NAME    Voice preset: theo (default) or rachel
 *   --start N       Start from prompt index N (0-based, for resuming after errors)
 *   --only ID       Generate only a specific prompt by ID (e.g. --only opening-01)
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUTPUT_FORMAT = 'mp3_44100_128';
const API_BASE = 'https://api.elevenlabs.io/v1';

const VOICE_PRESETS = {
  theo: {
    label: 'Theo Silk',
    voiceId: 'UmQN7jS1Ee8B1czsUtQh',
    modelId: 'eleven_multilingual_v2',
    outputSubdir: null,
    settings: {
      stability: 0.65,
      similarity_boost: 0.70,
      style: 0.0,
      use_speaker_boost: true,
      speed: 0.87,
    },
  },
  rachel: {
    label: 'Relaxing Rachel - Calm & Soothing',
    voiceId: 'ROMJ9yK1NAMuu1ggrjDW',
    modelId: 'eleven_multilingual_v2',
    outputSubdir: 'relaxing-rachel',
    settings: {
      stability: 0.80,
      similarity_boost: 0.75,
      style: 0.50,
      use_speaker_boost: true,
      speed: 0.81,
    },
  },
};

const REQUEST_DELAY = 1200;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const { openAwarenessMeditation } = await import('../src/content/meditations/open-awareness.js');
const allPrompts = openAwarenessMeditation.prompts;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const listVoices = args.includes('--list-voices');
const voiceKey = args.includes('--voice') ? args[args.indexOf('--voice') + 1] : 'theo';
const startIdx = args.includes('--start') ? parseInt(args[args.indexOf('--start') + 1], 10) : 0;
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
  'open-awareness',
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

const apiKey = loadApiKey();
if (!apiKey && !dryRun) {
  console.error('Error: ELEVENLABS_API_KEY or ELEVENLABS_API is required.');
  console.error('Set it in the environment or in .env, then run node scripts/generate-open-awareness-audio.mjs');
  process.exit(1);
}

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
      ? Object.entries(v.labels).map(([key, value]) => `${key}: ${value}`).join(', ')
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

async function generateAudio(text) {
  const url = `${API_BASE}/text-to-speech/${selectedVoice.voiceId}?output_format=${OUTPUT_FORMAT}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: selectedVoice.modelId,
      voice_settings: selectedVoice.settings,
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
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const totalChars = allPrompts.reduce((sum, prompt) => sum + prompt.text.length, 0);

  console.log('Open Awareness Audio Generator');
  console.log('==============================');
  console.log(`Voice: ${selectedVoice.label} (${selectedVoice.voiceId})`);
  console.log(`Model: ${selectedVoice.modelId}`);
  console.log(`Settings: ${JSON.stringify(selectedVoice.settings)}`);
  console.log(`Total prompts: ${allPrompts.length}`);
  console.log(`Total characters: ${totalChars}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log();

  if (!dryRun && !existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
  }

  let filtered = allPrompts.map((prompt, index) => ({ ...prompt, index }));

  if (onlyId) {
    filtered = filtered.filter((prompt) => prompt.id === onlyId);
    if (filtered.length === 0) {
      console.error(`Error: No prompt found with ID "${onlyId}"`);
      console.error(`Available IDs: ${allPrompts.map((prompt) => prompt.id).join(', ')}`);
      process.exit(1);
    }
  } else if (startIdx > 0) {
    filtered = filtered.filter((prompt) => prompt.index >= startIdx);
  }

  if (dryRun) {
    console.log('DRY RUN - no API calls will be made.\n');
    for (const prompt of filtered) {
      const filename = `${prompt.id}.mp3`;
      console.log(`[${prompt.index + 1}/${allPrompts.length}] ${filename}`);
      console.log(`  Text: "${prompt.text}"`);
      console.log(`  Chars: ${prompt.text.length}`);
      console.log();
    }
    console.log(`Total files: ${filtered.length}`);
    console.log(`Total characters: ${filtered.reduce((sum, prompt) => sum + prompt.text.length, 0)}`);
    return;
  }

  let succeeded = 0;
  let failed = 0;

  for (const prompt of filtered) {
    const filename = `${prompt.id}.mp3`;
    const filepath = path.join(OUTPUT_DIR, filename);

    console.log(`[${prompt.index + 1}/${allPrompts.length}] Generating ${filename}...`);
    console.log(`  "${prompt.text.substring(0, 60)}${prompt.text.length > 60 ? '...' : ''}"`);

    try {
      const audioBuffer = await generateAudio(prompt.text);
      await writeFile(filepath, audioBuffer);
      const sizeKB = (audioBuffer.length / 1024).toFixed(1);
      console.log(`  Saved (${sizeKB} KB)`);
      succeeded += 1;
    } catch (error) {
      console.error(`  Failed: ${error.message}`);
      failed += 1;
    }

    if (prompt !== filtered[filtered.length - 1]) {
      await sleep(REQUEST_DELAY);
    }
  }

  console.log();
  console.log(`Done! ${succeeded} succeeded, ${failed} failed.`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

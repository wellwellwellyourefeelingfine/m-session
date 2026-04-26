/**
 * Generate Short Grounding Meditation Audio
 *
 * Calls the ElevenLabs TTS API to generate MP3 files for all 15 clips.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=your_key node scripts/generate-short-grounding-audio.mjs
 *   node scripts/generate-short-grounding-audio.mjs --voice rachel --dry-run
 *
 * Options:
 *   --dry-run       Print clips and filenames without calling the API
 *   --list-voices   List all voices available to your account
 *   --voice NAME    Voice preset: theo (default) or rachel
 *   --start N       Start from clip index N (0-based, for resuming after errors)
 *   --only ID       Generate only a specific clip by ID (e.g. --only settle-01)
 *   --section SEC   Generate only clips from a section: settle, contact, senses, breath, or close
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

const { shortGroundingMeditation } = await import('../src/content/meditations/short-grounding.js');
const allClips = shortGroundingMeditation.prompts;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const listVoices = args.includes('--list-voices');
const voiceKey = args.includes('--voice') ? args[args.indexOf('--voice') + 1] : 'theo';
const startIdx = args.includes('--start') ? parseInt(args[args.indexOf('--start') + 1], 10) : 0;
const onlyId = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const sectionFilter = args.includes('--section') ? args[args.indexOf('--section') + 1] : null;

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
  'short-grounding',
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
  console.error('Set it in the environment or in .env, then run node scripts/generate-short-grounding-audio.mjs');
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
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getClipSection(id) {
  if (id.startsWith('settle-')) return 'settle';
  if (id.startsWith('contact-')) return 'contact';
  if (id.startsWith('senses-')) return 'senses';
  if (id.startsWith('breath-')) return 'breath';
  if (id.startsWith('close-')) return 'close';
  return 'unknown';
}

function getSectionLabel(section) {
  const labels = {
    settle: 'Settling',
    contact: 'Grounding Through Contact',
    senses: 'Grounding Through Senses',
    breath: 'Breath',
    close: 'Closing',
  };
  return labels[section] || section;
}

async function main() {
  const totalChars = allClips.reduce((sum, c) => sum + c.text.length, 0);

  console.log('Short Grounding Audio Generator');
  console.log('================================');
  console.log(`Voice: ${selectedVoice.label} (${selectedVoice.voiceId})`);
  console.log(`Model: ${selectedVoice.modelId}`);
  console.log(`Settings: ${JSON.stringify(selectedVoice.settings)}`);
  console.log(`Total clips: ${allClips.length}`);
  console.log(`  Settling: ${allClips.filter(c => c.id.startsWith('settle-')).length}`);
  console.log(`  Contact:  ${allClips.filter(c => c.id.startsWith('contact-')).length}`);
  console.log(`  Senses:   ${allClips.filter(c => c.id.startsWith('senses-')).length}`);
  console.log(`  Breath:   ${allClips.filter(c => c.id.startsWith('breath-')).length}`);
  console.log(`  Closing:  ${allClips.filter(c => c.id.startsWith('close-')).length}`);
  console.log(`Total characters: ${totalChars}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log();

  if (!dryRun && !existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
  }

  let filtered = allClips.map((c, i) => ({ ...c, index: i }));

  if (onlyId) {
    filtered = filtered.filter(c => c.id === onlyId);
    if (filtered.length === 0) {
      console.error(`Error: No clip found with ID "${onlyId}"`);
      console.error(`Available IDs: ${allClips.map(c => c.id).join(', ')}`);
      process.exit(1);
    }
  } else if (sectionFilter) {
    filtered = filtered.filter(c => getClipSection(c.id) === sectionFilter);
    if (filtered.length === 0) {
      console.error(`Error: No clips found for section "${sectionFilter}"`);
      console.error('Available sections: settle, contact, senses, breath, close');
      process.exit(1);
    }
    console.log(`Filtering to section: ${getSectionLabel(sectionFilter)} (${filtered.length} clips)\n`);
  } else if (startIdx > 0) {
    filtered = filtered.filter(c => c.index >= startIdx);
  }

  if (dryRun) {
    console.log('DRY RUN - no API calls will be made.\n');
    for (const clip of filtered) {
      const filename = `${clip.id}.mp3`;
      const section = getSectionLabel(getClipSection(clip.id));
      console.log(`[${clip.index + 1}/${allClips.length}] ${filename} (${section})`);
      console.log(`  Text: "${clip.text}"`);
      console.log(`  Chars: ${clip.text.length}`);
      console.log();
    }
    console.log(`Total files: ${filtered.length}`);
    console.log(`Total characters: ${filtered.reduce((s, c) => s + c.text.length, 0)}`);
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < filtered.length; i++) {
    const clip = filtered[i];
    const filename = `${clip.id}.mp3`;
    const filepath = path.join(OUTPUT_DIR, filename);
    const section = getSectionLabel(getClipSection(clip.id));

    console.log(`[${clip.index + 1}/${allClips.length}] Generating ${filename} (${section})...`);
    console.log(`  "${clip.text.substring(0, 60)}${clip.text.length > 60 ? '...' : ''}"`);

    try {
      const audioBuffer = await generateAudio(clip.text);
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

    if (i < filtered.length - 1) {
      await sleep(REQUEST_DELAY);
    }
  }

  console.log();
  console.log(`Done! ${successCount} succeeded, ${errorCount} failed.`);
  if (errorCount > 0) {
    console.log('Re-run with --start or --only to retry failed clips.');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

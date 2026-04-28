/**
 * Generate Centering Breath Meditation Audio
 *
 * Calls the ElevenLabs TTS API to generate MP3 files for all 37 clips of the
 * transition-centering-breath meditation. Usable as a standalone grounding
 * module in any phase, and also offered as a detour in the Opening Ritual.
 *
 * Clips span 7 sections: orientation (intro/posture), settling in, body
 * release, natural breath awareness, paced 4-in/6-out breathing, centering,
 * close.
 *
 * Per-prompt speed: counted paced-breathing clips (paced-N-in, paced-N-out)
 * use a slightly slower 0.85 to give space for each count. All other clips
 * use the Session Grounding profile's 0.87.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=your_key node scripts/generate-transition-centering-breath-audio.mjs
 *
 * Options:
 *   --dry-run       Print clips and filenames without calling the API
 *   --list-voices   List all voices available to your account
 *   --voice KEY     Voice preset to use: theo or rachel (default: theo)
 *   --start N       Start from clip index N (0-based, for resuming after errors)
 *   --only ID       Generate only a specific clip by ID (e.g. --only paced-1-in)
 *   --section SEC   Generate only clips from a section (e.g. --section paced)
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
      // Counted in/out prompts: "One. Two. Three. Four." — slower for timing
      { pattern: /^paced-[1-4]-(in|out)$/, speed: 0.85 },
    ],
    settings: {
      stability: 0.80,
      similarity_boost: 0.77,
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

function getSpeedForPrompt(clipId) {
  for (const { pattern, speed } of selectedVoice.speedMap || []) {
    if (pattern.test(clipId)) return speed;
  }
  return selectedVoice.defaultSpeed;
}

// Delay between requests to respect rate limits (ms)
const REQUEST_DELAY = 1200;

// --- Resolve paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// --- Import clips from content definition ---
const { transitionCenteringBreath } = await import('../src/content/meditations/transition-centering-breath.js');

const allClips = transitionCenteringBreath.prompts;

// --- Parse CLI args ---
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
  'transition-centering-breath',
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
  console.error('Set it in the environment or in .env, then run node scripts/generate-transition-centering-breath-audio.mjs');
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
async function generateAudio(clipId, text) {
  const url = `${API_BASE}/text-to-speech/${selectedVoice.voiceId}?output_format=${OUTPUT_FORMAT}`;
  const speed = getSpeedForPrompt(clipId);

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
      voice_settings: { ...selectedVoice.settings, speed },
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

// Order matters: check longer/more-specific prefixes before shorter ones.
const SECTION_PREFIXES = [
  { prefix: 'settling-', section: 'settling' },
  { prefix: 'release-',  section: 'release' },
  { prefix: 'natural-',  section: 'natural' },
  { prefix: 'paced-',    section: 'paced' },
  { prefix: 'center-',   section: 'center' },
  { prefix: 'posture-',  section: 'posture' },
  { prefix: 'close-',    section: 'close' },
  { prefix: 'intro',     section: 'intro' },
];

function getClipSection(id) {
  for (const { prefix, section } of SECTION_PREFIXES) {
    if (id.startsWith(prefix)) return section;
  }
  return 'unknown';
}

const SECTION_LABELS = {
  intro: 'Intro',
  posture: 'Posture',
  settling: 'Settling In',
  release: 'Body Release',
  natural: 'Natural Breath',
  paced: 'Paced Breathing',
  center: 'Centering',
  close: 'Close',
};

function getSectionLabel(section) {
  return SECTION_LABELS[section] || section;
}

async function main() {
  const totalChars = allClips.reduce((sum, c) => sum + c.text.length, 0);
  const sectionCounts = SECTION_PREFIXES.map(({ section }) => ({
    section,
    count: allClips.filter(c => getClipSection(c.id) === section).length,
  }));
  const customSpeedClipCount = allClips.filter(c => getSpeedForPrompt(c.id) !== selectedVoice.defaultSpeed).length;

  console.log(`Centering Breath Audio Generator`);
  console.log(`================================`);
  console.log(`Voice: ${selectedVoice.label} (${selectedVoice.voiceId})`);
  console.log(`Model: ${selectedVoice.modelId}`);
  console.log(`Settings: ${JSON.stringify(selectedVoice.settings)}`);
  console.log(`Total clips: ${allClips.length}`);
  for (const { section, count } of sectionCounts) {
    if (count > 0) {
      console.log(`  ${getSectionLabel(section).padEnd(18)} ${count}`);
    }
  }
  console.log(`Default speed: ${selectedVoice.defaultSpeed} (${allClips.length - customSpeedClipCount} clips)`);
  if (customSpeedClipCount > 0) {
    console.log(`Custom speed: ${customSpeedClipCount} clip(s)`);
  }
  console.log(`Total characters: ${totalChars}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log();

  // Ensure output directory exists
  if (!dryRun && !existsSync(OUTPUT_DIR)) {
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
  } else if (sectionFilter) {
    filtered = filtered.filter(c => getClipSection(c.id) === sectionFilter);
    if (filtered.length === 0) {
      console.error(`Error: No clips found for section "${sectionFilter}"`);
      console.error(`Available sections: ${SECTION_PREFIXES.map(s => s.section).join(', ')}`);
      process.exit(1);
    }
    console.log(`Filtering to section: ${getSectionLabel(sectionFilter)} (${filtered.length} clips)\n`);
  } else if (startIdx > 0) {
    filtered = filtered.filter(c => c.index >= startIdx);
  }

  if (dryRun) {
    console.log('DRY RUN — no API calls will be made.\n');
    for (const clip of filtered) {
      const filename = `${clip.id}.mp3`;
      const section = getSectionLabel(getClipSection(clip.id));
      const speed = getSpeedForPrompt(clip.id);
      console.log(`[${clip.index + 1}/${allClips.length}] ${filename} (${section}, speed ${speed})`);
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
    const section = getSectionLabel(getClipSection(clip.id));
    const speed = getSpeedForPrompt(clip.id);

    console.log(`[${clip.index + 1}/${allClips.length}] Generating ${filename} (${section}, speed ${speed})...`);
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

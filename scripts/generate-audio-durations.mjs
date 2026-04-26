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
 * Manifest shape:
 *   {
 *     "<meditation-id>": {
 *       "<prompt-id>": <duration-seconds>,            // root-level (default voice)
 *       "<voice-id>": {                                // alternate voice variants
 *         "<prompt-id>": <duration-seconds>
 *       }
 *     }
 *   }
 *
 * Voice-variant keys come from the meditation's `audio.voices` config,
 * NOT the on-disk subfolder name — that way the runtime lookup
 * `manifest[medId][voiceId][promptId]` works directly with the voice id
 * the engine has at hand. If the meditation file can't be loaded or
 * doesn't declare a matching voice, the subfolder name is used as a
 * fallback so no data is lost.
 *
 * Usage: node scripts/generate-audio-durations.mjs
 */

import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const AUDIO_BASE = resolve(projectRoot, 'public/audio/meditations');
const MEDITATIONS_DIR = resolve(projectRoot, 'src/content/meditations');
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

function scanClipDurations(dirPath) {
  const files = readdirSync(dirPath)
    .filter(f => f.endsWith('.mp3'))
    .sort();

  const durations = {};
  for (const file of files) {
    const filePath = resolve(dirPath, file);
    const fileSize = statSync(filePath).size;
    const id3Size = getID3TagSize(filePath);
    const audioBytes = fileSize - id3Size;
    const duration = Math.round((audioBytes / CBR_BYTES_PER_SECOND) * 100) / 100;
    const promptId = basename(file, '.mp3');
    durations[promptId] = duration;
  }
  return durations;
}

/**
 * Build a `subfolder → voice id` map for a given meditation by dynamically
 * importing its content module and reading `audio.voices`. Returns an empty
 * map if the file doesn't exist, doesn't export a meditation matching the
 * id, or doesn't declare voices — callers fall back to the subfolder name.
 */
async function loadVoiceIdMap(meditationId) {
  const filePath = resolve(MEDITATIONS_DIR, `${meditationId}.js`);
  if (!existsSync(filePath)) return {};

  try {
    const mod = await import(pathToFileURL(filePath).href);
    for (const exp of Object.values(mod)) {
      if (
        exp && typeof exp === 'object'
        && exp.id === meditationId
        && Array.isArray(exp.audio?.voices)
      ) {
        const map = {};
        for (const voice of exp.audio.voices) {
          if (!voice?.id) continue;
          // Strip trailing slash so the key matches the on-disk directory name.
          const cleanSubfolder = (voice.subfolder || '').replace(/\/$/, '');
          if (cleanSubfolder) map[cleanSubfolder] = voice.id;
        }
        return map;
      }
    }
  } catch {
    // Module load failed — graceful fallback to subfolder names.
  }
  return {};
}

/**
 * Scan all meditation audio directories and write the manifest.
 *
 * Layout:
 *   public/audio/meditations/<med-id>/                — root MP3s (default voice)
 *   public/audio/meditations/<med-id>/<subfolder>/    — alternate voice
 *
 * Each `<subfolder>` is mapped to the corresponding `voice.id` declared in
 * the meditation file's `audio.voices` array, so the runtime engine can
 * look up `manifest[medId][voiceId][promptId]` directly.
 */
async function main() {
  const manifest = {};
  let totalClips = 0;
  let totalVoiceVariants = 0;

  const dirs = readdirSync(AUDIO_BASE, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  for (const dir of dirs) {
    const dirPath = resolve(AUDIO_BASE, dir);
    const entries = readdirSync(dirPath, { withFileTypes: true });

    const rootDurations = scanClipDurations(dirPath);
    const subDirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort();

    if (Object.keys(rootDurations).length === 0 && subDirs.length === 0) continue;

    const medEntry = { ...rootDurations };
    totalClips += Object.keys(rootDurations).length;

    // Resolve subfolder → voice id once per meditation; fall back to the
    // subfolder name when the meditation doesn't declare voices (or its
    // file isn't loadable).
    const voiceIdMap = await loadVoiceIdMap(dir);

    for (const subDirName of subDirs) {
      const voiceDurations = scanClipDurations(resolve(dirPath, subDirName));
      if (Object.keys(voiceDurations).length === 0) continue;
      const voiceKey = voiceIdMap[subDirName] || subDirName;
      medEntry[voiceKey] = voiceDurations;
      totalClips += Object.keys(voiceDurations).length;
      totalVoiceVariants++;
    }

    manifest[dir] = medEntry;
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`Generated audio duration manifest:`);
  console.log(`  ${dirs.length} meditations, ${totalClips} clips, ${totalVoiceVariants} alternate voice variant(s)`);
  console.log(`  Output: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * =============================================================================
 * Master Audio — Loudness Normalization + Plosive Softening
 * =============================================================================
 *
 * Offline audio mastering pipeline for the project's TTS meditation clips.
 * Reads pristine TTS output from `audio-source/meditations/`, applies
 * professional-grade mastering, and writes shipped clips to
 * `public/audio/meditations/`.
 *
 * -----------------------------------------------------------------------------
 * Why this exists
 * -----------------------------------------------------------------------------
 *
 * ElevenLabs TTS clips ship at slightly different perceived volumes across
 * sentences and meditations, and individual phrases can begin with harsh
 * plosives (P, B) or fricatives (F, T-sh) that feel abrupt at meditation
 * volume in quiet rooms. This script fixes both problems in a way that
 * matches how real meditation-app audio is mastered (Waking Up, Calm,
 * Headspace all ship pre-mastered audio — none of them process at runtime).
 *
 * Doing this offline — rather than in the browser at playback time — is
 * essential because the app's playback engine depends on byte-accurate
 * invariants of the mastered files (see "Invariants" below). Runtime
 * processing would require decoding MP3 → PCM → processing → re-encoding,
 * which would break those invariants and regress the iOS blob-URL resume
 * system.
 *
 * -----------------------------------------------------------------------------
 * The pipeline (per clip)
 * -----------------------------------------------------------------------------
 *
 * 1. MEASURE (loudnorm pass 1, output discarded)
 *    Run `ffmpeg -af loudnorm=print_format=json -f null -` to measure the
 *    clip's integrated loudness, true peak, loudness range, threshold, and
 *    the target offset ffmpeg computed. These values are captured from
 *    stderr as JSON.
 *
 * 2. MASTER (loudnorm pass 2, in linear mode, plus fade-in)
 *    Feed the measured values back into `loudnorm=...:linear=true:...`.
 *    Linear mode applies a single static gain adjustment across the entire
 *    clip — it does NOT compress, limit, or alter dynamics. This is the
 *    professional way to use `loudnorm` when you already know your source
 *    has well-behaved peaks (which ElevenLabs output does). Dynamic mode
 *    would squash breath and whisper texture, which we don't want for
 *    meditation.
 *
 *    Chained with `afade=t=in:st=0:d=<ms>:curve=exp` to apply an
 *    exponential fade-in at the very start of each clip. Exponential
 *    (equivalent to a linear fade in dB space) is the perceptually
 *    "natural" shape for fade-ins — it starts very quietly and accelerates
 *    to full level, which is exactly what softens plosive attacks without
 *    being audibly noticeable as a fade. 8ms is long enough to take the
 *    edge off a P/B/F pop but short enough that no listener will perceive
 *    the clip as "fading in."
 *
 * 3. ENCODE (CBR 128kbps mono 44.1kHz, no metadata headers)
 *    Re-encode the processed PCM back to MP3 with flags that enforce the
 *    project's byte-math invariants (see "Invariants" below).
 *
 * -----------------------------------------------------------------------------
 * Invariants the mastered output MUST preserve
 * -----------------------------------------------------------------------------
 *
 * The app's audio composer (src/services/audioComposerService.js) and
 * playback hook (src/hooks/useAudioPlayback.js) rely on:
 *
 *   • CBR 128kbps encoding       → `bytes / 16000 = seconds` exactly.
 *                                  Duration calculations, promptTimeMap
 *                                  offsets, and the resume/seek byte-slice
 *                                  logic all depend on this identity.
 *
 *   • 44.1kHz sample rate        → matches silence blocks and gong file.
 *                                  Mismatched sample rates cause clicks at
 *                                  concatenation boundaries.
 *
 *   • Mono (single channel)      → matches silence blocks and gong file.
 *                                  Mismatched channels cause distortion or
 *                                  silent output at concatenation points.
 *
 *   • No ID3v2 tag               → runtime ID3 stripping in the app
 *                                  becomes a no-op (cleaner, faster, and
 *                                  on-disk byte counts match audio content).
 *
 *   • No Xing/LAME VBR header    → even CBR encodes normally write a Xing
 *                                  info frame at the start. Stripping it
 *                                  (`-write_xing 0`) removes ~417 bytes of
 *                                  silence-padded metadata so the first
 *                                  audio frame starts at byte 0.
 *
 * Changing any of the encoding flags below without understanding the
 * downstream impact will break playback timing, seeking, or concatenation.
 *
 * -----------------------------------------------------------------------------
 * Source/Dest workflow — why we keep pristine masters
 * -----------------------------------------------------------------------------
 *
 * `audio-source/meditations/` holds the UNMASTERED original TTS output from
 * ElevenLabs. These files are the gold masters and must never be modified
 * in place.
 *
 * `public/audio/meditations/` holds the MASTERED output and is what ships
 * to users via the production build.
 *
 * This split ensures that future re-masters (for example, if we want to
 * change the LUFS target or fade curve) always start from pristine source,
 * never from an already-mastered file. Re-mastering a mastered file is
 * "generational loss" — each MP3 transcoding generation introduces tiny
 * audible artifacts. A single generation on mono speech at 128kbps is
 * imperceptible; cascaded generations add up. The split prevents cascading.
 *
 * When generating new TTS clips, the `scripts/generate-*-audio.mjs` scripts
 * should write to `audio-source/meditations/<id>/` FIRST, then this script
 * is run to produce the shipped `public/audio/meditations/<id>/` output.
 *
 * -----------------------------------------------------------------------------
 * After running this script
 * -----------------------------------------------------------------------------
 *
 * 1. Regenerate the audio duration manifest:
 *      node scripts/generate-audio-durations.mjs
 *    (or pass `--regen-manifest` to this script to chain it automatically)
 *
 *    The manifest at `src/content/meditations/audio-durations.json` caches
 *    per-clip byte-derived durations. Mastering changes the byte count of
 *    every clip (typically by a few hundred bytes due to frame alignment
 *    shifts), so the manifest goes stale and must be rebuilt.
 *
 * 2. Fixed-duration meditations: re-check the `fixedDuration` value in
 *    `src/content/meditations/<id>.js` files. The sum of clip durations
 *    plus silences may have shifted by 1–2 seconds total. Usually fine to
 *    leave alone, but check against the new manifest if anything feels off.
 *
 * 3. Cache invalidation: returning users have cached clips in the browser's
 *    `audio-cache` Cache Storage. Those cached bytes will diverge from the
 *    newly-deployed files. The runtime cache validator
 *    (`isValidMp3Buffer` in audioComposerService.js) catches truly broken
 *    entries but will accept stale-but-valid MP3s. Consider bumping a
 *    cache version constant or forcing a cache clear on the next app
 *    release if seek behavior looks off in the field.
 *
 * 4. Spot-check one variable-duration meditation (Body Scan) end-to-end on
 *    a real device. Silence-multiplier binary search recalibrates from the
 *    new manifest, so total duration may shift by a second or two. Timer
 *    should still match idle-screen estimate within 5s.
 *
 * -----------------------------------------------------------------------------
 * Parameters (defaults are production values — change deliberately)
 * -----------------------------------------------------------------------------
 *
 *   --lufs <value>      Integrated loudness target (default: -18)
 *                       Industry norms: podcast -16, audiobook -18 to -20,
 *                       Spotify normalization -14. Meditation sits in the
 *                       soft-but-not-quiet range: -18 LUFS is the sweet
 *                       spot. Lower (e.g. -20) = more headroom, softer.
 *
 *   --tp <value>        True peak ceiling in dBTP (default: -1.5)
 *                       Prevents inter-sample overshoot on consumer DACs.
 *                       -1.5 dBTP is the EBU-recommended safety margin.
 *
 *   --lra <value>       Loudness range target (default: 11)
 *                       Only meaningful in dynamic mode. In linear mode
 *                       (which we use) it's effectively informational.
 *
 *   --fade-in <secs>    Fade-in duration (default: 0.008 = 8ms)
 *                       5–15ms is the imperceptible range. Below 5ms leaves
 *                       plosive edges audible; above 15ms the fade itself
 *                       becomes noticeable. 8ms is tuned for the current
 *                       ElevenLabs Theo Silk voice and meditation context.
 *
 *   --fade-curve <name> ffmpeg afade curve (default: exp)
 *                       Options: `exp` (exponential — linear in dB, natural
 *                       for fade-in), `tri` (linear amplitude), `qsin`
 *                       (quarter-sine, gentle), `esin` (exponential sine,
 *                       smoothest), `log` (logarithmic — starts fast).
 *                       For plosive softening, `exp` or `esin` are the
 *                       preferred choices. See ffmpeg afade filter docs.
 *
 *   --source <path>     Source directory (default: audio-source/meditations)
 *   --dest <path>       Destination directory (default: public/audio/meditations)
 *
 * -----------------------------------------------------------------------------
 * Prerequisites
 * -----------------------------------------------------------------------------
 *
 *   ffmpeg must be installed and available in PATH. Verify:
 *     ffmpeg -version
 *
 *   macOS install:
 *     brew install ffmpeg
 *
 *   The ffmpeg binary must include the `libmp3lame` encoder and the
 *   `loudnorm` and `afade` filters. Homebrew's default build has all three.
 *
 * -----------------------------------------------------------------------------
 * Usage
 * -----------------------------------------------------------------------------
 *
 *   node scripts/master-audio.mjs                          # all meditations
 *   node scripts/master-audio.mjs --meditation body-scan   # one meditation only
 *   node scripts/master-audio.mjs --limit 3                # first 3 clips per folder (test)
 *   node scripts/master-audio.mjs --dry-run                # print plan, no writes
 *   node scripts/master-audio.mjs --regen-manifest         # chain manifest rebuild
 *   node scripts/master-audio.mjs --verbose                # full loudnorm JSON per clip
 *
 * Typical first-run workflow:
 *   1. Confirm `audio-source/meditations/` contains pristine TTS output
 *   2. `node scripts/master-audio.mjs --meditation body-scan --limit 3`
 *      and A/B the output vs source by ear
 *   3. If happy: `node scripts/master-audio.mjs --regen-manifest`
 *   4. Build and device-test one full meditation end-to-end
 *
 * -----------------------------------------------------------------------------
 * Design decisions documented for future us
 * -----------------------------------------------------------------------------
 *
 *   • No compressor. Linear-mode loudnorm preserves the natural dynamics
 *     of the TTS delivery. Meditation speech has narrow dynamic range
 *     already; compression would flatten breath/whisper texture that we
 *     want to keep. If we ever add music beds or multi-voice clips, revisit.
 *
 *   • No de-esser. ffmpeg's built-in deesser is coarse. If sibilance ever
 *     becomes a problem, the better tool is `acompressor` with a sidechain
 *     EQ'd to 5–8kHz, or offline processing in a proper DAW.
 *
 *   • No high-pass filter. ElevenLabs output is already clean at low
 *     frequencies. Adding HPF would risk thinning the voice. Revisit if we
 *     ever record real-voice meditations.
 *
 *   • Why `linear=true` in loudnorm pass 2: by default `loudnorm` operates
 *     dynamically (adjusts gain per-block across the clip). Linear mode
 *     applies one static gain factor, which is transparent and predictable.
 *     Requires pass 1 measurements; ffmpeg falls back to dynamic if peaks
 *     would clip after linear scaling.
 *
 *   • Why strip the Xing header: LAME writes a VBR info frame even on CBR
 *     encodes. It's technically valid MP3 (a frame of silence with
 *     metadata) but it means the first ~26ms of the file is silence
 *     padding, which shifts our byte-offset timing. `-write_xing 0` omits it.
 *
 * =============================================================================
 */

import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, basename, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// ---------- Arg parsing ----------

function parseArgs(argv) {
  const flags = new Set();
  const opts = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next !== undefined && !next.startsWith('--')) {
      opts[key] = next;
      i++;
    } else {
      flags.add(key);
    }
  }
  return { flags, opts };
}

const { flags, opts } = parseArgs(process.argv);

const SOURCE_DIR = resolve(projectRoot, opts.source ?? 'audio-source/meditations');
const DEST_DIR = resolve(projectRoot, opts.dest ?? 'public/audio/meditations');
const MEDITATION_FILTER = opts.meditation ?? null;
const LIMIT = opts.limit ? parseInt(opts.limit, 10) : 0;
const DRY_RUN = flags.has('dry-run');
const REGEN_MANIFEST = flags.has('regen-manifest');
const VERBOSE = flags.has('verbose');

const TARGET_I = parseFloat(opts.lufs ?? '-18');
const TARGET_TP = parseFloat(opts.tp ?? '-1.5');
const TARGET_LRA = parseFloat(opts.lra ?? '11');
const FADE_IN_SECS = parseFloat(opts['fade-in'] ?? '0.008');
const FADE_CURVE = opts['fade-curve'] ?? 'exp';

const SAMPLE_RATE = 44100;
const CHANNELS = 1;
const BITRATE = '128k';

// ---------- Preflight ----------

function preflight() {
  const check = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  if (check.error || check.status !== 0) {
    console.error('ERROR: ffmpeg not found in PATH.');
    console.error('Install with `brew install ffmpeg` (macOS) and try again.');
    process.exit(1);
  }

  if (!existsSync(SOURCE_DIR)) {
    console.error(`ERROR: source directory does not exist: ${SOURCE_DIR}`);
    console.error('Create it and copy pristine TTS clips before running this script.');
    console.error('Expected layout: audio-source/meditations/<meditation-id>/<prompt-id>.mp3');
    process.exit(1);
  }
}

// ---------- Loudness analysis (pass 1) ----------

function measureLoudness(inputPath) {
  const filter = `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:print_format=json`;
  const result = spawnSync(
    'ffmpeg',
    ['-hide_banner', '-nostats', '-i', inputPath, '-af', filter, '-f', 'null', '-'],
    { encoding: 'utf8' }
  );

  if (result.status !== 0) {
    throw new Error(`Loudness measurement failed for ${inputPath}:\n${result.stderr}`);
  }

  // ffmpeg writes the JSON report to stderr. Grab the last JSON object.
  const blocks = result.stderr.match(/\{[\s\S]*?\}/g);
  if (!blocks || blocks.length === 0) {
    throw new Error(`No loudnorm JSON found in ffmpeg output for ${inputPath}`);
  }
  return JSON.parse(blocks[blocks.length - 1]);
}

// ---------- Master (pass 2) ----------

function masterFile(inputPath, outputPath, measured) {
  const loudnorm = [
    `loudnorm=I=${TARGET_I}`,
    `TP=${TARGET_TP}`,
    `LRA=${TARGET_LRA}`,
    `measured_I=${measured.input_i}`,
    `measured_TP=${measured.input_tp}`,
    `measured_LRA=${measured.input_lra}`,
    `measured_thresh=${measured.input_thresh}`,
    `offset=${measured.target_offset}`,
    `linear=true`,
    `print_format=summary`,
  ].join(':');

  const fadeIn = `afade=t=in:st=0:d=${FADE_IN_SECS}:curve=${FADE_CURVE}`;
  const filterChain = `${loudnorm},${fadeIn}`;

  const args = [
    '-hide_banner',
    '-nostats',
    '-y',
    '-i', inputPath,
    '-af', filterChain,
    '-ar', String(SAMPLE_RATE),
    '-ac', String(CHANNELS),
    '-c:a', 'libmp3lame',
    '-b:a', BITRATE,
    '-write_xing', '0',
    '-id3v2_version', '0',
    '-map_metadata', '-1',
    outputPath,
  ];

  const result = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`Mastering failed for ${inputPath}:\n${result.stderr}`);
  }
  return result.stderr; // summary text for optional verbose logging
}

// ---------- Directory iteration ----------

function listMeditationDirs() {
  let dirs = readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  if (MEDITATION_FILTER) {
    dirs = dirs.filter(d => d === MEDITATION_FILTER);
    if (dirs.length === 0) {
      console.error(`ERROR: no meditation directory named "${MEDITATION_FILTER}" in ${SOURCE_DIR}`);
      process.exit(1);
    }
  }
  return dirs;
}

function listClips(meditationDir) {
  const clips = readdirSync(meditationDir)
    .filter(f => f.endsWith('.mp3'))
    .sort();
  return LIMIT > 0 ? clips.slice(0, LIMIT) : clips;
}

function formatBytes(n) {
  return n.toLocaleString();
}

// ---------- Main ----------

function main() {
  preflight();

  console.log('Audio Mastering');
  console.log(`  Source:     ${relative(projectRoot, SOURCE_DIR)}/`);
  console.log(`  Dest:       ${relative(projectRoot, DEST_DIR)}/`);
  console.log(`  Target:     ${TARGET_I} LUFS  |  ${TARGET_TP} dBTP  |  LRA ${TARGET_LRA}`);
  console.log(`  Fade-in:    ${(FADE_IN_SECS * 1000).toFixed(1)}ms  (curve: ${FADE_CURVE})`);
  console.log(`  Encoding:   CBR ${BITRATE}  ${SAMPLE_RATE}Hz  mono  (no ID3, no Xing)`);
  if (DRY_RUN) console.log('  DRY RUN — no files will be written');
  console.log('');

  const meditations = listMeditationDirs();
  let totalProcessed = 0;
  let totalFailed = 0;
  const failures = [];

  for (const med of meditations) {
    const srcMedDir = resolve(SOURCE_DIR, med);
    const dstMedDir = resolve(DEST_DIR, med);
    const clips = listClips(srcMedDir);

    if (clips.length === 0) {
      console.log(`${med}/  (no mp3 files, skipping)`);
      continue;
    }

    console.log(`${med}/  (${clips.length} clip${clips.length === 1 ? '' : 's'})`);

    if (!DRY_RUN && !existsSync(dstMedDir)) {
      mkdirSync(dstMedDir, { recursive: true });
    }

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const srcPath = resolve(srcMedDir, clip);
      const dstPath = resolve(dstMedDir, clip);
      const srcBytes = statSync(srcPath).size;
      const label = `  [${i + 1}/${clips.length}] ${clip}`;

      if (DRY_RUN) {
        console.log(`${label}   ${formatBytes(srcBytes)} bytes  →  (would master)`);
        continue;
      }

      try {
        const measured = measureLoudness(srcPath);
        const summary = masterFile(srcPath, dstPath, measured);
        const dstBytes = statSync(dstPath).size;

        const inputI = parseFloat(measured.input_i).toFixed(1);
        const outputI = TARGET_I.toFixed(1);
        console.log(
          `${label}   ${inputI} → ${outputI} LUFS   ${formatBytes(srcBytes)} → ${formatBytes(dstBytes)} bytes`
        );
        if (VERBOSE) {
          console.log('    measured:', JSON.stringify(measured));
          console.log('    summary:\n' + summary.split('\n').map(l => '      ' + l).join('\n'));
        }
        totalProcessed++;
      } catch (err) {
        totalFailed++;
        failures.push({ clip: `${med}/${clip}`, message: err.message });
        console.log(`${label}   FAILED — ${err.message.split('\n')[0]}`);
      }
    }
    console.log('');
  }

  console.log('---');
  console.log(`Processed:  ${totalProcessed}`);
  if (totalFailed > 0) {
    console.log(`Failed:     ${totalFailed}`);
    for (const f of failures) console.log(`  - ${f.clip}: ${f.message.split('\n')[0]}`);
  }

  if (REGEN_MANIFEST && !DRY_RUN && totalProcessed > 0) {
    console.log('\nRegenerating audio duration manifest...');
    const result = spawnSync('node', [resolve(__dirname, 'generate-audio-durations.mjs')], {
      stdio: 'inherit',
    });
    if (result.status !== 0) {
      console.error('Manifest regeneration failed.');
      process.exit(1);
    }
  } else if (!REGEN_MANIFEST && !DRY_RUN && totalProcessed > 0) {
    console.log('\nReminder: run `node scripts/generate-audio-durations.mjs` to update the manifest.');
  }

  if (totalFailed > 0) process.exit(1);
}

main();

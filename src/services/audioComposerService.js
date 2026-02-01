/**
 * Audio Composer Service
 *
 * Composes a single continuous MP3 blob from TTS clips + silence blocks + gong,
 * enabling uninterrupted playback on iOS even when the screen locks.
 *
 * How it works:
 * 1. Receives a timedSequence (from generateTimedSequence) with startTime/endTime per prompt
 * 2. Fetches all clip MP3 files and pre-generated silence blocks as ArrayBuffers
 * 3. Decomposes silence gaps into combinations of silence block files (60s + 30s + 5s + 1s etc.)
 * 4. Concatenates everything (gong preamble → clips interleaved with silence → closing gong)
 * 5. Returns a blob URL + a promptTimeMap for text synchronization
 *
 * MP3 is a frame-based format — frames are independently decodable, so raw byte
 * concatenation produces valid audio without decoding or re-encoding.
 */

// All TTS clips and silence blocks are CBR 128kbps (16,000 bytes per second)
const CBR_BYTES_PER_SECOND = 16000;

// Available silence block durations (descending order for greedy decomposition)
const SILENCE_BLOCKS = [60, 30, 10, 5, 1, 0.5];
const SILENCE_BASE_PATH = '/audio/silence/silence-';
const SILENCE_FORMAT = 'mp3';

const GONG_SOFT_SRC = '/audio/meditation-bell-soft.mp3';

/**
 * Decompose a duration (in seconds) into a list of silence block filenames.
 * Uses greedy algorithm with available block sizes.
 * Rounds to nearest 0.5s (our smallest block).
 *
 * @param {number} durationSeconds - Target silence duration
 * @returns {string[]} Array of silence block URLs
 */
export function decomposeSilence(durationSeconds) {
  // Round to nearest 0.5s
  let remaining = Math.round(durationSeconds * 2) / 2;
  const blocks = [];

  for (const blockSize of SILENCE_BLOCKS) {
    while (remaining >= blockSize - 0.001) { // small epsilon for float comparison
      blocks.push(`${SILENCE_BASE_PATH}${blockSize}s.${SILENCE_FORMAT}`);
      remaining -= blockSize;
      remaining = Math.round(remaining * 2) / 2; // re-round to avoid float drift
    }
  }

  return blocks;
}

/**
 * Fetch an audio file as an ArrayBuffer.
 * Tries Cache API first (for offline/SW support), falls back to network fetch.
 *
 * @param {string} url - Audio file URL
 * @returns {Promise<ArrayBuffer>}
 */
async function fetchAudioBuffer(url) {
  // Try cache first
  if ('caches' in window) {
    try {
      const cache = await caches.open('audio-cache');
      const cached = await cache.match(url);
      if (cached) return cached.arrayBuffer();
    } catch {
      // Fall through to network
    }
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${url} (${response.status})`);
  }
  return response.arrayBuffer();
}

/**
 * Estimate MP3 duration from byte length assuming CBR 128kbps.
 * All our TTS clips and silence blocks are generated at 128kbps CBR,
 * so: duration = byteLength / 16000
 *
 * @param {ArrayBuffer} buffer - The MP3 file data
 * @returns {number} Duration in seconds
 */
function estimateMp3Duration(buffer) {
  return buffer.byteLength / CBR_BYTES_PER_SECOND;
}

/**
 * Build the concatenation plan from a timed sequence.
 * Returns an ordered list of { type, url, duration } entries describing
 * what to concatenate and where each prompt lands in the final audio.
 *
 * @param {Array} timedSequence - From generateTimedSequence()
 * @param {Object} options
 * @param {number} options.gongDelay - Seconds of silence before opening gong (default 1)
 * @param {number} options.gongPreamble - Total seconds before first TTS prompt (default 8)
 * @param {Map} [bufferMap] - Map of URL → ArrayBuffer for computing real durations
 * @returns {{ plan: Array, promptTimeMap: Array, totalDuration: number }}
 */
export function buildConcatenationPlan(timedSequence, { gongDelay = 1, gongPreamble = 8 } = {}, bufferMap = null) {
  const plan = [];
  const promptTimeMap = [];
  let currentTime = 0;

  // --- Opening gong preamble ---
  // silence before gong
  if (gongDelay > 0) {
    const silenceBlocks = decomposeSilence(gongDelay);
    for (const url of silenceBlocks) {
      plan.push({ type: 'silence', url });
    }
    currentTime += gongDelay;
  }

  // Opening gong
  plan.push({ type: 'gong', url: GONG_SOFT_SRC });
  const gongBuffer = bufferMap?.get(GONG_SOFT_SRC);
  const gongDuration = gongBuffer ? estimateMp3Duration(gongBuffer) : 7.5;
  // The gong plays, and remaining preamble time overlaps with gong ring-out
  // We add silence to fill the gap between gong end and first TTS
  const silenceAfterGong = Math.max(0, gongPreamble - gongDelay - gongDuration);
  if (silenceAfterGong > 0) {
    const silenceBlocks = decomposeSilence(silenceAfterGong);
    for (const url of silenceBlocks) {
      plan.push({ type: 'silence', url });
    }
  }
  currentTime = gongPreamble; // snap to exact preamble time

  // --- TTS clips interleaved with silence ---
  for (let i = 0; i < timedSequence.length; i++) {
    const prompt = timedSequence[i];
    const promptAudioStart = currentTime;

    // Add TTS clip
    if (prompt.audioSrc) {
      plan.push({ type: 'clip', url: prompt.audioSrc, promptIndex: i });
    }

    // Use real duration from MP3 byte size when available, fall back to estimate
    const clipBuffer = prompt.audioSrc ? bufferMap?.get(prompt.audioSrc) : null;
    const clipDuration = clipBuffer ? estimateMp3Duration(clipBuffer) : prompt.speakingDuration;
    currentTime += clipDuration;

    const promptAudioEnd = currentTime;

    // Add silence after clip
    const silenceDuration = prompt.silenceDuration;
    if (silenceDuration > 0) {
      const silenceBlocks = decomposeSilence(silenceDuration);
      for (const url of silenceBlocks) {
        plan.push({ type: 'silence', url });
      }
      currentTime += silenceDuration;
    }

    // Record prompt time position in the composed audio
    promptTimeMap.push({
      promptIndex: i,
      audioTimeStart: promptAudioStart,
      audioTimeEnd: promptAudioEnd,
      // Full slot includes the silence after the clip
      slotEnd: currentTime,
      text: prompt.text,
      id: prompt.id,
    });
  }

  // --- Closing gong ---
  // Small silence before closing gong
  const closingSilence = decomposeSilence(1);
  for (const url of closingSilence) {
    plan.push({ type: 'silence', url });
  }
  currentTime += 1;

  plan.push({ type: 'gong', url: GONG_SOFT_SRC });
  currentTime += gongDuration;

  return {
    plan,
    promptTimeMap,
    totalDuration: currentTime,
  };
}

/**
 * Compose a meditation into a single continuous MP3 blob.
 *
 * @param {Array} timedSequence - From generateTimedSequence()
 * @param {Object} options
 * @param {number} options.gongDelay - Seconds of silence before opening gong
 * @param {number} options.gongPreamble - Total seconds before first TTS prompt
 * @returns {Promise<{ blobUrl: string, promptTimeMap: Array, totalDuration: number }>}
 */
export async function composeMeditationAudio(timedSequence, options = {}) {
  // First pass: collect all URLs we'll need (using estimated durations just for URL collection)
  const { plan: dryRunPlan } = buildConcatenationPlan(timedSequence, options);
  const uniqueUrls = [...new Set(dryRunPlan.map(entry => entry.url))];

  // Fetch all audio files in parallel
  const bufferMap = new Map();
  const fetchResults = await Promise.allSettled(
    uniqueUrls.map(async (url) => {
      const buffer = await fetchAudioBuffer(url);
      bufferMap.set(url, buffer);
    })
  );

  // Check for critical failures (TTS clips are critical, silence blocks less so)
  for (let i = 0; i < fetchResults.length; i++) {
    if (fetchResults[i].status === 'rejected') {
      const url = uniqueUrls[i];
      const isSilence = url.includes('/silence/');
      if (!isSilence) {
        console.error(`[AudioComposer] Critical: failed to fetch ${url}`, fetchResults[i].reason);
        throw new Error(`Failed to fetch meditation audio: ${url}`);
      }
      console.warn(`[AudioComposer] Non-critical: failed to fetch silence ${url}`);
    }
  }

  // Second pass: rebuild plan with real durations from fetched buffers
  const { plan, promptTimeMap, totalDuration } = buildConcatenationPlan(timedSequence, options, bufferMap);

  // Calculate total byte length
  let totalBytes = 0;
  for (const entry of plan) {
    const buffer = bufferMap.get(entry.url);
    if (buffer) totalBytes += buffer.byteLength;
  }

  // Concatenate all buffers into a single Uint8Array
  const composed = new Uint8Array(totalBytes);
  let offset = 0;
  for (const entry of plan) {
    const buffer = bufferMap.get(entry.url);
    if (buffer) {
      composed.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }
  }

  // Create blob and URL
  const blob = new Blob([composed], { type: 'audio/mpeg' });
  const blobUrl = URL.createObjectURL(blob);

  return {
    blobUrl,
    promptTimeMap,
    totalDuration,
  };
}

/**
 * Revoke a previously created blob URL to free memory.
 * Call this when the meditation completes or the component unmounts.
 *
 * @param {string} blobUrl - The blob URL to revoke
 */
export function revokeMeditationBlobUrl(blobUrl) {
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
  }
}

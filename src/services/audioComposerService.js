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
export const CBR_BYTES_PER_SECOND = 16000;

// Available silence block durations (descending order for greedy decomposition)
const SILENCE_BLOCKS = [60, 30, 10, 5, 1, 0.5];
const SILENCE_BASE_PATH = '/audio/silence/silence-';
const SILENCE_FORMAT = 'mp3';

const GONG_SOFT_SRC = '/audio/meditation-bell-soft.mp3';

/**
 * Detect and return the size of an ID3v2 tag at the start of an ArrayBuffer.
 * Returns 0 if no ID3v2 tag is found.
 *
 * @param {ArrayBuffer} buffer - The MP3 file data
 * @returns {number} Size of the ID3v2 tag in bytes (header + body), or 0
 */
function getID3TagSize(buffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 10) return 0;
  // ID3v2 header: "ID3" magic bytes
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    // Size is a 28-bit synchsafe integer (4 bytes, 7 bits each)
    const size = ((bytes[6] & 0x7F) << 21) |
                 ((bytes[7] & 0x7F) << 14) |
                 ((bytes[8] & 0x7F) << 7) |
                 (bytes[9] & 0x7F);
    return size + 10; // 10-byte header + declared size
  }
  return 0;
}

/**
 * Strip the ID3v2 tag from an ArrayBuffer, returning only the audio data.
 * Returns the original buffer if no ID3 tag is found.
 *
 * @param {ArrayBuffer} buffer - The MP3 file data
 * @returns {ArrayBuffer} Audio data without ID3 tag
 */
function stripID3Tag(buffer) {
  const tagSize = getID3TagSize(buffer);
  if (tagSize > 0 && tagSize < buffer.byteLength) {
    return buffer.slice(tagSize);
  }
  return buffer;
}

/**
 * Compute the actual duration of silence blocks from their fetched buffers.
 * Falls back to the nominal duration if buffers aren't available.
 *
 * @param {string[]} blockUrls - Silence block file URLs from decomposeSilence()
 * @param {number} nominalDuration - The nominal silence duration in seconds
 * @param {Map|null} bufferMap - Map of URL → ArrayBuffer
 * @returns {number} Actual silence duration in seconds
 */
function actualSilenceDuration(blockUrls, nominalDuration, bufferMap) {
  if (!bufferMap) return nominalDuration;
  let total = 0;
  for (const url of blockUrls) {
    const buf = bufferMap.get(url);
    if (buf) {
      total += estimateMp3Duration(buf);
    }
  }
  return total || nominalDuration;
}

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
 * Check if an ArrayBuffer starts with valid MP3 data (MPEG sync word or ID3v2 tag).
 * Used to detect stale cache entries that contain HTML instead of audio.
 *
 * @param {ArrayBuffer} buffer
 * @returns {boolean}
 */
function isValidMp3Buffer(buffer) {
  if (buffer.byteLength < 3) return false;
  const h = new Uint8Array(buffer, 0, 3);
  // ID3v2 tag header
  if (h[0] === 0x49 && h[1] === 0x44 && h[2] === 0x33) return true;
  // MPEG audio frame sync word (11 bits set)
  if (h[0] === 0xFF && (h[1] & 0xE0) === 0xE0) return true;
  return false;
}

/**
 * Fetch an audio file as an ArrayBuffer.
 * Tries Cache API first (for offline/SW support), falls back to network fetch.
 * Validates cached entries are actual MP3 data — evicts stale HTML responses
 * that can occur when a service worker caches SPA fallback pages.
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
      if (cached) {
        const buffer = await cached.arrayBuffer();
        if (isValidMp3Buffer(buffer)) return buffer;
        // Stale/invalid entry (e.g. HTML from SPA fallback) — evict and fetch fresh
        await cache.delete(url);
      }
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
 * Find the next valid MPEG audio frame boundary at or after `offset`.
 *
 * MPEG sync word: 11 bits set = first byte 0xFF, second byte has top 3 bits set (0xE0 mask).
 * For CBR 128kbps 44100Hz, frame size is 417-418 bytes. We scan up to one full frame forward.
 * If no sync found, returns the original offset as fallback.
 *
 * @param {Uint8Array} bytes - The full composed MP3 data
 * @param {number} offset - Starting byte position to search from
 * @returns {number} The byte offset of the next frame boundary
 */
export function findNextFrameBoundary(bytes, offset) {
  const maxScan = Math.min(offset + 418, bytes.length - 1);
  for (let i = offset; i < maxScan; i++) {
    if (bytes[i] === 0xFF && (bytes[i + 1] & 0xE0) === 0xE0) {
      return i;
    }
  }
  return offset;
}

/**
 * Concatenate audio buffers from a plan into a single Uint8Array.
 * Shared by composeMeditationAudio and composeSilenceTimer.
 *
 * @param {Array} plan - Ordered list of { url } entries
 * @param {Map} bufferMap - Map of URL → ArrayBuffer
 * @returns {Uint8Array} Concatenated audio data
 */
function concatenateBuffers(plan, bufferMap) {
  let totalBytes = 0;
  for (const entry of plan) {
    const buffer = bufferMap.get(entry.url);
    if (buffer) totalBytes += buffer.byteLength;
  }
  const composed = new Uint8Array(totalBytes);
  let offset = 0;
  for (const entry of plan) {
    const buffer = bufferMap.get(entry.url);
    if (buffer) {
      composed.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }
  }
  return composed;
}

/**
 * Collect all unique audio URLs needed for a meditation composition.
 * Lightweight alternative to a full dry-run buildConcatenationPlan — returns
 * only the URL set without building the plan or computing timings.
 *
 * @param {Array} timedSequence - From generateTimedSequence()
 * @param {Object} options
 * @param {number} options.gongDelay - Seconds of silence before opening gong (default 1)
 * @param {number} options.gongPreamble - Total seconds before first TTS prompt (default 8)
 * @returns {string[]} Array of unique audio URLs to fetch
 */
function collectAudioUrls(timedSequence, { gongDelay = 1, gongPreamble = 8 } = {}) {
  const urls = new Set();
  urls.add(GONG_SOFT_SRC);

  // Preamble silence
  if (gongDelay > 0) {
    for (const url of decomposeSilence(gongDelay)) urls.add(url);
  }
  // Gap between gong end and first prompt (uses estimated gong duration for URL collection)
  const estimatedGap = Math.max(0, gongPreamble - gongDelay - 7.5);
  if (estimatedGap > 0) {
    for (const url of decomposeSilence(estimatedGap)) urls.add(url);
  }

  // Clips + post-clip silence
  for (const prompt of timedSequence) {
    if (prompt.audioSrc) urls.add(prompt.audioSrc);
    if (prompt.silenceDuration > 0) {
      for (const url of decomposeSilence(prompt.silenceDuration)) urls.add(url);
    }
  }

  // Closing silence
  for (const url of decomposeSilence(1)) urls.add(url);

  return [...urls];
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
      currentTime += actualSilenceDuration(silenceBlocks, silenceDuration, bufferMap);
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
  currentTime += actualSilenceDuration(closingSilence, 1, bufferMap);

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
  // Collect all unique URLs needed (lightweight — no full plan build)
  const uniqueUrls = collectAudioUrls(timedSequence, options);

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

  // Strip ID3 tags from all buffers to prevent mid-stream DEMUXER errors
  // when concatenated bytes contain ID3 headers between audio frames
  for (const [url, buffer] of bufferMap) {
    const stripped = stripID3Tag(buffer);
    if (stripped !== buffer) {
      bufferMap.set(url, stripped);
    }
  }

  // Build plan with real durations from fetched buffers
  const { plan, promptTimeMap, totalDuration } = buildConcatenationPlan(timedSequence, options, bufferMap);

  // Concatenate and create blob
  const composed = concatenateBuffers(plan, bufferMap);
  const blob = new Blob([composed], { type: 'audio/mpeg' });
  const blobUrl = URL.createObjectURL(blob);

  return {
    blobUrl,
    composedBytes: composed,
    promptTimeMap,
    totalDuration,
  };
}

/**
 * Compose a silence timer into a single continuous MP3 blob.
 * Structure: [gongDelay silence] [gong] [preamble gap] [N seconds silence] [1s silence] [gong] [1s silence]
 *
 * Used by modules that need a background timer resilient to iOS screen lock.
 * The audio element keeps playing even when the screen is off, so the closing
 * gong fires at the correct time.
 *
 * @param {number} durationSeconds - The user-visible timer duration in seconds
 * @param {Object} options
 * @param {number} options.gongDelay - Seconds of silence before opening gong (default 1)
 * @param {number} options.gongPreamble - Total seconds before timer starts (default 3)
 * @param {boolean} options.skipOpeningGong - If true, omit opening gong and preamble (for mid-session resize)
 * @returns {Promise<{ blobUrl: string, totalDuration: number, preambleEnd: number }>}
 */
export async function composeSilenceTimer(durationSeconds, { gongDelay = 1, gongPreamble = 3, skipOpeningGong = false } = {}) {
  // Build the concatenation plan
  const plan = [];

  // Collect all URLs we need first (for parallel fetch)
  const urlSet = new Set();
  urlSet.add(GONG_SOFT_SRC);

  // Pre-calculate silence blocks for each section
  const delaySilence = (!skipOpeningGong && gongDelay > 0) ? decomposeSilence(gongDelay) : [];
  const mainSilence = durationSeconds > 0 ? decomposeSilence(durationSeconds) : [];
  const closingGap = decomposeSilence(1);
  const trailingSilence = decomposeSilence(1);

  for (const url of [...delaySilence, ...mainSilence, ...closingGap, ...trailingSilence]) {
    urlSet.add(url);
  }

  // Fetch all audio files in parallel
  const uniqueUrls = [...urlSet];
  const bufferMap = new Map();
  const fetchResults = await Promise.allSettled(
    uniqueUrls.map(async (url) => {
      const buffer = await fetchAudioBuffer(url);
      bufferMap.set(url, buffer);
    })
  );

  // Check for failures
  for (let i = 0; i < fetchResults.length; i++) {
    if (fetchResults[i].status === 'rejected') {
      const url = uniqueUrls[i];
      if (!url.includes('/silence/')) {
        throw new Error(`Failed to fetch audio: ${url}`);
      }
      console.warn(`[AudioComposer] Non-critical: failed to fetch silence ${url}`);
    }
  }

  const gongBuffer = bufferMap.get(GONG_SOFT_SRC);
  const gongDuration = gongBuffer ? estimateMp3Duration(gongBuffer) : 7.5;

  // --- Build plan ---

  let preambleEnd = 0;

  if (!skipOpeningGong) {
    // 1. Silence before opening gong
    for (const url of delaySilence) {
      plan.push({ url });
    }

    // 2. Opening gong
    plan.push({ url: GONG_SOFT_SRC });

    // 3. Preamble gap (fill remaining time between gong end and timer start)
    const preambleGap = Math.max(0, gongPreamble - gongDelay - gongDuration);
    if (preambleGap > 0) {
      const gapBlocks = decomposeSilence(preambleGap);
      for (const url of gapBlocks) {
        plan.push({ url });
        urlSet.add(url);
      }
      // Fetch any new blocks from preamble gap decomposition
      for (const url of gapBlocks) {
        if (!bufferMap.has(url)) {
          try {
            bufferMap.set(url, await fetchAudioBuffer(url));
          } catch {
            console.warn(`[AudioComposer] Failed to fetch gap silence ${url}`);
          }
        }
      }
    }

    preambleEnd = gongPreamble;
  }

  // 4. Main silence (the timer duration)
  for (const url of mainSilence) {
    plan.push({ url });
  }

  // 5. Closing gap
  for (const url of closingGap) {
    plan.push({ url });
  }

  // 6. Closing gong
  plan.push({ url: GONG_SOFT_SRC });

  // 7. Trailing silence
  for (const url of trailingSilence) {
    plan.push({ url });
  }

  // Calculate total duration
  const totalDuration = preambleEnd + durationSeconds + 1 + gongDuration + 1;

  // Concatenate and create blob
  const composed = concatenateBuffers(plan, bufferMap);
  const blob = new Blob([composed], { type: 'audio/mpeg' });
  const blobUrl = URL.createObjectURL(blob);

  return {
    blobUrl,
    composedBytes: composed,
    totalDuration,
    preambleEnd,
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

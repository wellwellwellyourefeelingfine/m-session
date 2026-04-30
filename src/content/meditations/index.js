/**
 * Meditation Content Registry
 * Central hub for all guided meditation content and utilities
 */

import audioDurations from './audio-durations.json' with { type: 'json' };
import { audioPath } from '../../utils/audioPath';
import { openAwarenessMeditation } from './open-awareness';
import { bodyScanMeditation } from './body-scan';
import { selfCompassionMeditation } from './self-compassion';
import { simpleGroundingMeditation } from './simple-grounding';
import { protectorDialogueMeditation } from './protector-dialogue';
import { leavesOnAStreamMeditation } from './leaves-on-a-stream';
import { stayWithItMeditation } from './stay-with-it';
import { feltSenseMeditation } from './felt-sense';
import { shortGroundingMeditation } from './short-grounding';
import { theDescentMeditation } from './the-descent';
import { theCycleClosingMeditation } from './the-cycle-closing';
import { pendulationMeditation } from './pendulation';
import { transitionOpening } from './transition-opening';
import { transitionCenteringBreath } from './transition-centering-breath';
import { transitionClosing } from './transition-closing';

// Registry of all available meditations. Modules consume these via
// `getMeditationById(id)`; no individual named re-exports are needed.
export const meditationLibrary = {
  'open-awareness': openAwarenessMeditation,
  'body-scan': bodyScanMeditation,
  'self-compassion': selfCompassionMeditation,
  'simple-grounding': simpleGroundingMeditation,
  'protector-dialogue': protectorDialogueMeditation,
  'leaves-on-a-stream': leavesOnAStreamMeditation,
  'stay-with-it': stayWithItMeditation,
  'felt-sense': feltSenseMeditation,
  'short-grounding': shortGroundingMeditation,
  'the-descent': theDescentMeditation,
  'the-cycle-closing': theCycleClosingMeditation,
  'pendulation': pendulationMeditation,
  'transition-opening': transitionOpening,
  'transition-centering-breath': transitionCenteringBreath,
  'transition-closing': transitionClosing,
};

/**
 * Get a meditation by its ID
 */
export function getMeditationById(meditationId) {
  return meditationLibrary[meditationId] || null;
}

/**
 * Collect every unique voice variant declared across all meditations in
 * `meditationLibrary`. Deduplicated by voice id, preserving first-seen order.
 * Used by Settings to render the default-voice picker without requiring a
 * hand-maintained list.
 *
 * @returns {Array<{ id: string, label: string }>}
 */
export function getAvailableVoices() {
  const seen = new Map();
  for (const meditation of Object.values(meditationLibrary)) {
    const voices = meditation?.audio?.voices;
    if (!Array.isArray(voices)) continue;
    for (const voice of voices) {
      if (voice?.id && !seen.has(voice.id)) {
        seen.set(voice.id, { id: voice.id, label: voice.label });
      }
    }
  }
  return Array.from(seen.values());
}

/**
 * Get all available meditations
 */
export function getAllMeditations() {
  return Object.values(meditationLibrary);
}

/**
 * Get the speaking duration for a prompt from the audio duration manifest.
 *
 * Lookup order when voiceId is supplied and points to an alternate voice
 * variant: manifest[medId][voiceId][promptId] → manifest[medId][promptId].
 * Alternate voices that have their own nested manifest entry drive accurate
 * timing; otherwise we fall through to the default voice's manifest entry.
 *
 * Throws if no manifest entry exists — the manifest is the single source of
 * truth for clip timing. Regenerate via `node scripts/generate-audio-durations.mjs`
 * after adding or replacing any audio clip.
 *
 * @param {string|null} meditationId - Meditation ID for manifest lookup
 * @param {Object} prompt - Prompt object with id
 * @param {string|null} voiceId - Optional voice variant ID
 * @returns {number} Duration in seconds
 */
export function getClipDuration(meditationId, prompt, voiceId = null) {
  const medEntry = meditationId ? audioDurations[meditationId] : null;
  if (medEntry) {
    if (voiceId) {
      const voiceEntry = medEntry[voiceId];
      if (voiceEntry && typeof voiceEntry === 'object' && typeof voiceEntry[prompt.id] === 'number') {
        return voiceEntry[prompt.id];
      }
    }
    const flat = medEntry[prompt.id];
    if (typeof flat === 'number') return flat;
  }
  throw new Error(
    `Missing audio-durations manifest entry for ${meditationId}/${prompt.id}` +
    (voiceId ? ` (voice: ${voiceId})` : '') +
    '. Regenerate via `node scripts/generate-audio-durations.mjs`.'
  );
}

/**
 * Calculate the total duration of a meditation given a silence multiplier.
 * Reads actual MP3 durations from the audio manifest.
 *
 * @param {Array} prompts - Array of prompt objects with baseSilenceAfter
 * @param {number} silenceMultiplier - Multiplier for expandable silence (1.0 = base)
 * @param {string|null} meditationId - Meditation ID for manifest lookup
 * @param {string|null} voiceId - Voice variant ID
 * @returns {number} Total duration in seconds
 */
export function calculateMeditationDuration(prompts, silenceMultiplier = 1.0, meditationId = null, voiceId = null) {
  let totalSeconds = 0;

  prompts.forEach((prompt) => {
    const speakingTime = getClipDuration(meditationId, prompt, voiceId);

    // Calculate silence
    let silence = prompt.baseSilenceAfter;
    if (prompt.silenceExpandable) {
      const expandedSilence = prompt.baseSilenceAfter * silenceMultiplier;
      silence = Math.min(expandedSilence, prompt.silenceMax || expandedSilence);
    }

    totalSeconds += speakingTime + silence;
  });

  return totalSeconds;
}

/**
 * Calculate the silence multiplier needed to achieve a target duration.
 * Uses binary search to find the optimal multiplier.
 *
 * @param {Array} prompts - Array of prompt objects
 * @param {number} targetDurationSeconds - Target duration in seconds
 * @param {string|null} meditationId - Meditation ID for manifest lookup
 * @param {string|null} voiceId - Voice variant ID
 * @returns {number} The silence multiplier to use
 */
export function calculateSilenceMultiplier(prompts, targetDurationSeconds, meditationId = null, voiceId = null) {
  // Calculate base duration (multiplier = 1.0)
  const baseDuration = calculateMeditationDuration(prompts, 1.0, meditationId, voiceId);

  // If target is at or below base, use minimum multiplier
  if (targetDurationSeconds <= baseDuration) {
    return 1.0;
  }

  // Calculate max possible duration
  const maxDuration = calculateMeditationDuration(prompts, 10.0, meditationId, voiceId);

  // If target exceeds max, cap at what's achievable
  if (targetDurationSeconds >= maxDuration) {
    return 10.0;
  }

  // Binary search for the right multiplier
  let low = 1.0;
  let high = 10.0;
  let iterations = 0;
  const maxIterations = 20;
  const tolerance = 5; // Within 5 seconds is acceptable

  while (iterations < maxIterations) {
    const mid = (low + high) / 2;
    const duration = calculateMeditationDuration(prompts, mid, meditationId, voiceId);

    if (Math.abs(duration - targetDurationSeconds) <= tolerance) {
      return mid;
    }

    if (duration < targetDurationSeconds) {
      low = mid;
    } else {
      high = mid;
    }

    iterations++;
  }

  return (low + high) / 2;
}

/**
 * Extract meditation ID from an audio config's basePath.
 * e.g. '/audio/meditations/body-scan/' → 'body-scan'
 */
function meditationIdFromAudioConfig(audioConfig) {
  if (!audioConfig?.basePath) return null;
  const match = audioConfig.basePath.match(/meditations\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * Resolve the base path to the audio clips for a given voice. When the
 * meditation declares a `voices` array and a matching voiceId is supplied,
 * returns basePath + voice.subfolder. Otherwise falls back to basePath.
 */
export function resolveVoiceBasePath(audioConfig, voiceId) {
  if (!audioConfig?.basePath) return '';
  if (!voiceId || !Array.isArray(audioConfig.voices)) return audioConfig.basePath;
  const voice = audioConfig.voices.find((v) => v.id === voiceId);
  if (!voice) return audioConfig.basePath;
  return `${audioConfig.basePath}${voice.subfolder || ''}`;
}

/**
 * Pick the effective voice ID for a meditation given a caller-supplied
 * preference. Returns null when the meditation has no voices declared.
 */
export function resolveEffectiveVoiceId(audioConfig, preferredVoiceId = null) {
  if (!Array.isArray(audioConfig?.voices) || audioConfig.voices.length === 0) return null;
  if (preferredVoiceId && audioConfig.voices.some((v) => v.id === preferredVoiceId)) {
    return preferredVoiceId;
  }
  return audioConfig.defaultVoice || audioConfig.voices[0]?.id || null;
}

// Composer overhead constants — must stay in sync with GONG_DELAY/GONG_PREAMBLE
// in useMeditationPlayback.js and the closing-gong logic in audioComposerService.js.
const COMPOSER_OVERHEAD_WITH_GONGS = 17;    // ~8s opening preamble + ~9s closing (1s silence + 7.6s gong)
const COMPOSER_OVERHEAD_WITHOUT_GONGS = 2;  // 1s lead-in + 1s trailing

/**
 * Estimate the expected total meditation duration for a given voice, in seconds.
 * Sums per-prompt speaking + silence (voice-aware via the audio-durations manifest)
 * and adds a small constant for the opening/closing gong window.
 *
 * Pass `variationKey` to estimate a specific variation's duration via
 * `meditation.assembleVariation(variationKey)`; otherwise falls back to
 * `meditation.prompts` for non-variation meditations.
 *
 * Intended for idle-screen previews — once playback starts, the progress bar
 * uses the exact byte-derived duration from the composed blob instead.
 */
export function estimateMeditationDurationSeconds(meditation, { voiceId = null, variationKey = null, silenceMultiplier = 1.0, includeGongs = true } = {}) {
  const prompts = variationKey != null && typeof meditation?.assembleVariation === 'function'
    ? meditation.assembleVariation(variationKey)
    : meditation?.prompts;
  if (!prompts?.length) return 0;
  const medId = meditation.id;
  const effectiveVoiceId = resolveEffectiveVoiceId(meditation.audio, voiceId);
  const promptsTotal = calculateMeditationDuration(
    prompts,
    silenceMultiplier,
    medId,
    effectiveVoiceId,
  );
  const overhead = includeGongs ? COMPOSER_OVERHEAD_WITH_GONGS : COMPOSER_OVERHEAD_WITHOUT_GONGS;
  return promptsTotal + overhead;
}

/**
 * Generate a timed prompt sequence for playback.
 * Reads actual MP3 durations from the audio manifest.
 *
 * @param {Array} prompts - Array of prompt objects with baseSilenceAfter
 * @param {number} silenceMultiplier - Multiplier for expandable silence
 * @param {Object} options
 * @param {Object} options.audioConfig - Audio config with basePath and format, or null
 * @param {string} [options.meditationId] - Explicit meditation ID (derived from audioConfig if omitted)
 * @param {string} [options.voiceId] - Optional voice variant ID
 * @returns {Array} Array of { id, text, speakingDuration, silenceDuration, startTime, endTime, audioSrc }
 */
export function generateTimedSequence(prompts, silenceMultiplier = 1.0, { audioConfig = null, meditationId = null, voiceId = null } = {}) {
  const medId = meditationId || meditationIdFromAudioConfig(audioConfig);
  const effectiveVoiceId = audioConfig ? resolveEffectiveVoiceId(audioConfig, voiceId) : null;
  const voiceBasePath = audioConfig ? resolveVoiceBasePath(audioConfig, effectiveVoiceId) : '';
  const sequence = [];
  let currentTime = 0;

  prompts.forEach((prompt) => {
    const speakingDuration = getClipDuration(medId, prompt, effectiveVoiceId);

    // Calculate silence duration
    let silenceDuration = prompt.baseSilenceAfter;
    if (prompt.silenceExpandable) {
      const expandedSilence = prompt.baseSilenceAfter * silenceMultiplier;
      silenceDuration = Math.min(expandedSilence, prompt.silenceMax || expandedSilence);
    }

    const totalDuration = speakingDuration + silenceDuration;

    sequence.push({
      id: prompt.id,
      text: prompt.text,
      speakingDuration,
      silenceDuration,
      startTime: currentTime,
      endTime: currentTime + totalDuration,
      audioSrc: audioConfig
        ? audioPath(`${voiceBasePath}${prompt.id}.${audioConfig.format}`)
        : null,
    });

    currentTime += totalDuration;
  });

  return sequence;
}

/**
 * Format seconds as MM:SS
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

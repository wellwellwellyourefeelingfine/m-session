/**
 * Meditation Content Registry
 * Central hub for all guided meditation content and utilities
 */

import audioDurations from './audio-durations.json' with { type: 'json' };
import { audioPath } from '../../utils/audioPath';
import { breathAwarenessMeditation } from './breath-awareness';
import {
  guidedBreathOrbMeditation,
  generateBreathSequences,
  generateTimedPrompts,
} from './guided-breath-orb';
import { calmingBreath15Min } from './calming-breath-15min';
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

// Registry of all available meditations
export const meditationLibrary = {
  'breath-awareness-default': breathAwarenessMeditation,
  'guided-breath-orb': guidedBreathOrbMeditation,
  'calming-breath-15min': calmingBreath15Min,
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

// Re-export guided breath orb utilities
export { generateBreathSequences, generateTimedPrompts, guidedBreathOrbMeditation };

// Re-export calming breath meditation
export { calmingBreath15Min };

// Re-export open awareness meditation
export { openAwarenessMeditation };

// Re-export body scan meditation
export { bodyScanMeditation };

// Re-export self-compassion meditation
export { selfCompassionMeditation };

// Re-export simple grounding meditation
export { simpleGroundingMeditation };

// Re-export protector dialogue meditation
export { protectorDialogueMeditation };

// Re-export leaves on a stream meditation
export { leavesOnAStreamMeditation };

// Re-export stay with it meditation
export { stayWithItMeditation };

// Re-export felt sense meditation
export { feltSenseMeditation };

// Re-export short grounding meditation
export { shortGroundingMeditation };

// Re-export the descent meditation
export { theDescentMeditation };

// Re-export the cycle closing meditation
export { theCycleClosingMeditation };

// Re-export pendulation meditation
export { pendulationMeditation };

// Re-export audio duration utilities
export { audioDurations };

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
 * Default speaking rate for duration estimation (words per minute)
 */
const DEFAULT_SPEAKING_RATE = 150;

/**
 * Get the speaking duration for a prompt, using the audio duration manifest
 * when available (accurate byte-based duration) and falling back to
 * word-count estimation when no audio file exists.
 *
 * Lookup order when voiceId is supplied and points to an alternate voice
 * variant: manifest[medId][voiceId][promptId] → manifest[medId][promptId] →
 * word-count fallback. This lets alternate voices that have their own
 * nested manifest entry drive accurate timing while falling back cleanly
 * to the default voice's timing when a variant is incomplete.
 *
 * @param {string|null} meditationId - Meditation ID for manifest lookup
 * @param {Object} prompt - Prompt object with id and text
 * @param {number} speakingRate - Words per minute fallback
 * @param {string|null} voiceId - Optional voice variant ID
 * @returns {number} Duration in seconds
 */
export function getClipDuration(meditationId, prompt, speakingRate = DEFAULT_SPEAKING_RATE, voiceId = null) {
  if (meditationId) {
    const medEntry = audioDurations[meditationId];
    if (medEntry) {
      if (voiceId) {
        const voiceEntry = medEntry[voiceId];
        if (voiceEntry && typeof voiceEntry === 'object' && voiceEntry[prompt.id]) {
          return voiceEntry[prompt.id];
        }
      }
      const flat = medEntry[prompt.id];
      if (typeof flat === 'number') return flat;
    }
  }
  // Fallback to word-count estimate for meditations without pre-recorded audio
  const wordCount = prompt.text.split(' ').length;
  return (wordCount / speakingRate) * 60;
}

/**
 * Calculate the total duration of a meditation given a silence multiplier.
 * Uses actual MP3 durations from the audio manifest when meditationId is provided.
 *
 * @param {Array} prompts - Array of prompt objects with baseSilenceAfter
 * @param {number} silenceMultiplier - Multiplier for expandable silence (1.0 = base)
 * @param {number} speakingRate - Words per minute fallback (default 150)
 * @param {string|null} meditationId - Meditation ID for manifest lookup
 * @returns {number} Total duration in seconds
 */
export function calculateMeditationDuration(prompts, silenceMultiplier = 1.0, speakingRate = DEFAULT_SPEAKING_RATE, meditationId = null, voiceId = null) {
  let totalSeconds = 0;

  prompts.forEach((prompt) => {
    const speakingTime = getClipDuration(meditationId, prompt, speakingRate, voiceId);

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
 * @param {number} speakingRate - Words per minute fallback (default 150)
 * @param {string|null} meditationId - Meditation ID for manifest lookup
 * @returns {number} The silence multiplier to use
 */
export function calculateSilenceMultiplier(prompts, targetDurationSeconds, speakingRate = DEFAULT_SPEAKING_RATE, meditationId = null, voiceId = null) {
  // Calculate base duration (multiplier = 1.0)
  const baseDuration = calculateMeditationDuration(prompts, 1.0, speakingRate, meditationId, voiceId);

  // If target is at or below base, use minimum multiplier
  if (targetDurationSeconds <= baseDuration) {
    return 1.0;
  }

  // Calculate max possible duration
  const maxDuration = calculateMeditationDuration(prompts, 10.0, speakingRate, meditationId, voiceId);

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
    const duration = calculateMeditationDuration(prompts, mid, speakingRate, meditationId, voiceId);

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
const COMPOSER_OVERHEAD_WITH_GONGS = 12;    // ~8s opening preamble + ~4s closing
const COMPOSER_OVERHEAD_WITHOUT_GONGS = 2;  // 1s lead-in + 1s trailing

/**
 * Estimate the expected total meditation duration for a given voice, in seconds.
 * Sums per-prompt speaking + silence (voice-aware via the audio-durations manifest)
 * and adds a small constant for the opening/closing gong window.
 *
 * Intended for idle-screen previews — once playback starts, the progress bar
 * uses the exact byte-derived duration from the composed blob instead.
 */
export function estimateMeditationDurationSeconds(meditation, { voiceId = null, silenceMultiplier = 1.0, includeGongs = true } = {}) {
  if (!meditation?.prompts) return 0;
  const medId = meditation.id;
  const effectiveVoiceId = resolveEffectiveVoiceId(meditation.audio, voiceId);
  const speakingRate = meditation.speakingRate || DEFAULT_SPEAKING_RATE;
  const promptsTotal = calculateMeditationDuration(
    meditation.prompts,
    silenceMultiplier,
    speakingRate,
    medId,
    effectiveVoiceId,
  );
  const overhead = includeGongs ? COMPOSER_OVERHEAD_WITH_GONGS : COMPOSER_OVERHEAD_WITHOUT_GONGS;
  return promptsTotal + overhead;
}

/**
 * Generate a timed prompt sequence for playback.
 * Uses actual MP3 durations from the audio manifest when available.
 *
 * @param {Array} prompts - Array of prompt objects with baseSilenceAfter
 * @param {number} silenceMultiplier - Multiplier for expandable silence
 * @param {Object} options
 * @param {number} options.speakingRate - Words per minute fallback (default 150)
 * @param {Object} options.audioConfig - Audio config with basePath and format, or null
 * @param {string} [options.meditationId] - Explicit meditation ID (derived from audioConfig if omitted)
 * @param {string} [options.voiceId] - Optional voice variant ID
 * @returns {Array} Array of { id, text, speakingDuration, silenceDuration, startTime, endTime, audioSrc }
 */
export function generateTimedSequence(prompts, silenceMultiplier = 1.0, { speakingRate = DEFAULT_SPEAKING_RATE, audioConfig = null, meditationId = null, voiceId = null } = {}) {
  const medId = meditationId || meditationIdFromAudioConfig(audioConfig);
  const effectiveVoiceId = audioConfig ? resolveEffectiveVoiceId(audioConfig, voiceId) : null;
  const voiceBasePath = audioConfig ? resolveVoiceBasePath(audioConfig, effectiveVoiceId) : '';
  const sequence = [];
  let currentTime = 0;

  prompts.forEach((prompt) => {
    const speakingDuration = getClipDuration(medId, prompt, speakingRate, effectiveVoiceId);

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

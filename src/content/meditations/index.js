/**
 * Meditation Content Registry
 * Central hub for all guided meditation content and utilities
 */

import { breathAwarenessMeditation } from './breath-awareness';
import {
  guidedBreathOrbMeditation,
  generateBreathSequences,
  generateTimedPrompts,
} from './guided-breath-orb';
import { calmingBreath15Min } from './calming-breath-15min';
import { openAwarenessMeditation } from './open-awareness';

// Registry of all available meditations
export const meditationLibrary = {
  'breath-awareness-default': breathAwarenessMeditation,
  'guided-breath-orb': guidedBreathOrbMeditation,
  'calming-breath-15min': calmingBreath15Min,
  'open-awareness': openAwarenessMeditation,
};

// Re-export guided breath orb utilities
export { generateBreathSequences, generateTimedPrompts, guidedBreathOrbMeditation };

// Re-export calming breath meditation
export { calmingBreath15Min };

// Re-export open awareness meditation
export { openAwarenessMeditation };

/**
 * Get a meditation by its ID
 */
export function getMeditationById(meditationId) {
  return meditationLibrary[meditationId] || null;
}

/**
 * Get all available meditations
 */
export function getAllMeditations() {
  return Object.values(meditationLibrary);
}

/**
 * Constants for duration calculation
 */
const AVERAGE_SPEAKING_RATE = 150; // words per minute

/**
 * Calculate the total duration of a meditation given a silence multiplier
 * @param {Array} prompts - Array of prompt objects
 * @param {number} silenceMultiplier - Multiplier for expandable silence (1.0 = base)
 * @returns {number} Total duration in seconds
 */
export function calculateMeditationDuration(prompts, silenceMultiplier = 1.0) {
  let totalSeconds = 0;

  prompts.forEach((prompt) => {
    // Estimate speaking time (words / rate * 60)
    const wordCount = prompt.text.split(' ').length;
    const speakingTime = (wordCount / AVERAGE_SPEAKING_RATE) * 60;

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
 * Calculate the silence multiplier needed to achieve a target duration
 * Uses binary search to find the optimal multiplier
 * @param {Array} prompts - Array of prompt objects
 * @param {number} targetDurationSeconds - Target duration in seconds
 * @returns {number} The silence multiplier to use
 */
export function calculateSilenceMultiplier(prompts, targetDurationSeconds) {
  // Calculate base duration (multiplier = 1.0)
  const baseDuration = calculateMeditationDuration(prompts, 1.0);

  // If target is at or below base, use minimum multiplier
  if (targetDurationSeconds <= baseDuration) {
    return 1.0;
  }

  // Calculate max possible duration
  const maxDuration = calculateMeditationDuration(prompts, 10.0); // High multiplier to find ceiling

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
    const duration = calculateMeditationDuration(prompts, mid);

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
 * Generate a timed prompt sequence for playback
 * @param {Array} prompts - Array of prompt objects
 * @param {number} silenceMultiplier - Multiplier for expandable silence
 * @returns {Array} Array of { prompt, speakingDuration, silenceDuration, totalDuration, startTime }
 */
export function generateTimedSequence(prompts, silenceMultiplier = 1.0) {
  const sequence = [];
  let currentTime = 0;

  prompts.forEach((prompt) => {
    // Calculate speaking time
    const wordCount = prompt.text.split(' ').length;
    const speakingDuration = (wordCount / AVERAGE_SPEAKING_RATE) * 60;

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
      totalDuration,
      startTime: currentTime,
      endTime: currentTime + totalDuration,
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

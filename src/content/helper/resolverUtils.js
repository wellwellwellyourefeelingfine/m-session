/**
 * Helper Modal V5 — Shared resolver utilities
 *
 * Pure helpers used by every per-category resolver in src/content/helper/resolvers/.
 * No store access, no React. These functions are testable in isolation.
 */

// ============================================
// PHASE WINDOW CLASSIFICATION
// ============================================

/**
 * Maps minutes-since-ingestion to a pharmacologically meaningful window label.
 *
 * | Window         | Minutes | Pharmacological context                                            |
 * |----------------|---------|--------------------------------------------------------------------|
 * | pre-onset      | 0–19    | Nothing yet. Anticipatory anxiety possible.                        |
 * | come-up        | 20–60   | Sympathomimetic activation: heart rate, jaw, warmth, anxiety       |
 * | early-peak     | 61–90   | Transition from stimulant to entactogenic. Perceptual shifts.      |
 * | peak           | 91–210  | Full effects: emotional openness, trauma processing window         |
 * | late-session   | 211–360 | Tapering. Cognitive clarity returning. Synthesis territory.        |
 * | post-session   | 361+    | Residual only                                                       |
 *
 * Returns null when minutes is null (no ingestion recorded).
 */
export function classifyPhaseWindow(minutes) {
  if (minutes === null || minutes === undefined) return null;
  if (minutes < 20) return 'pre-onset';
  if (minutes <= 60) return 'come-up';
  if (minutes <= 90) return 'early-peak';
  if (minutes <= 210) return 'peak';
  if (minutes <= 360) return 'late-session';
  return 'post-session';
}

// ============================================
// TIME CONTEXT FORMATTING
// ============================================

/**
 * Format the time context line shown above the result message.
 * Only returns a string when the user is in `come-up` or `early-peak` AND
 * minutesSinceIngestion is available. Returns undefined otherwise so resolvers
 * can spread the field without conditional checks.
 *
 * Uses the exact minute count rather than rounding, e.g. "about 19 minutes in"
 * not "about 20 minutes in", so the modal feels precise about timing.
 */
export function formatTimeContext(minutes, phaseWindow) {
  if (minutes === null || minutes === undefined) return undefined;
  if (phaseWindow !== 'come-up' && phaseWindow !== 'early-peak') return undefined;
  const label = minutes === 1 ? 'minute' : 'minutes';
  return `You're about ${minutes} ${label} in.`;
}

// ============================================
// FOLLOW-UP WINDOW CLASSIFICATION
// ============================================

/**
 * Maps days-since-session to a follow-up window label.
 *
 * | Window | Days  | Context                                                    |
 * |--------|-------|------------------------------------------------------------|
 * | acute  | 0–3   | Serotonin dip window, highest vulnerability                |
 * | early  | 4–14  | Still settling, insights fresh but fading                  |
 * | mid    | 15–60 | Active integration period                                  |
 * | late   | 61+   | Long-term integration                                      |
 *
 * Returns null when days is null (no session completion recorded).
 */
export function classifyFollowUpWindow(days) {
  if (days === null || days === undefined) return null;
  if (days <= 3) return 'acute';
  if (days <= 14) return 'early';
  if (days <= 60) return 'mid';
  return 'late';
}

// ============================================
// FOLLOW-UP TIME CONTEXT FORMATTING
// ============================================

/**
 * Format the time context line for follow-up result screens.
 * Only returns a string when the user is in `acute` or `early` AND
 * daysSinceSession is available. Returns undefined otherwise so resolvers
 * can spread the field without conditional checks.
 *
 * Acute: exact days. Early: approximate days. Mid/late: not shown.
 */
export function formatFollowUpTimeContext(days, timeWindow) {
  if (days === null || days === undefined) return undefined;
  if (timeWindow === 'acute') {
    const label = days === 1 ? 'day' : 'days';
    return `It's been ${days} ${label} since your session.`;
  }
  if (timeWindow === 'early') {
    return `It's been about ${days} days since your session.`;
  }
  return undefined;
}

// ============================================
// ACTIVITY ID SHORTCUTS
// ============================================

/**
 * Shared activity references. Resolvers spread these into their activity arrays:
 *   activities: [ACT.simpleGrounding, ACT.bodyScan]
 *
 * `ActivitySuggestions` looks up display text via `getModuleById(activity.id)`,
 * so a bare `{ id }` object is sufficient. Keeping these as a single dictionary
 * prevents string-id drift across resolvers.
 *
 * Module IDs MUST match library IDs in src/content/modules/library.js.
 */
export const ACT = {
  simpleGrounding: { id: 'simple-grounding' },
  shortGrounding: { id: 'short-grounding' },
  bodyScan: { id: 'body-scan' },
  openAwareness: { id: 'open-awareness' },
  selfCompassion: { id: 'self-compassion' },
  music: { id: 'music-listening' },
  shaking: { id: 'shaking-the-tree' },
  letsDance: { id: 'lets-dance' },
  valuesCompass: { id: 'values-compass' },
  protectorDialogue: { id: 'protector-dialogue' },
  feltSense: { id: 'felt-sense' },
  stayWithIt: { id: 'stay-with-it' },
  mappingTheTerritory: { id: 'mapping-the-territory' },
  leavesOnAStream: { id: 'leaves-on-a-stream' },
  pendulation: { id: 'pendulation' },
  letterWriting: { id: 'letter-writing' },
  innerChildLetter: { id: 'inner-child-letter' },
  feelingDialogue: { id: 'feeling-dialogue' },
  gratitudeReflection: { id: 'therapy-gratitude' },

  // Follow-up integration activities
  integrationReflection: { id: 'integration-reflection-journal' },
  bodySomatic: { id: 'body-somatic' },
  natureConnection: { id: 'nature-connection' },
  relationshipsReflection: { id: 'relationships-reflection' },
  lifestyleReflection: { id: 'lifestyle-reflection' },
  spiritMeaning: { id: 'spirit-meaning' },
  lightJournaling: { id: 'light-journaling' },
};

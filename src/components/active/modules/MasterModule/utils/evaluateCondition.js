/**
 * evaluateCondition
 *
 * Pure function that evaluates a condition object against the current module state.
 * Used to conditionally show/hide blocks and screens based on user choices,
 * selector values, visited sections, or (for transitions) session-level data.
 *
 * Condition shapes:
 *   { key: 'checkIn', equals: 'heavy' }                  — exact match
 *   { key: 'checkIn', in: ['heavy', 'numb'] }            — one-of match
 *   { key: 'mood' }                                       — has any value (truthy)
 *   { visited: 'section-b' }                              — section was visited
 *   { notVisited: 'section-c' }                           — section was NOT visited
 *   { and: [condition, condition, ...] }                   — ALL conditions must pass
 *   { or: [condition, condition, ...] }                    — ANY condition must pass
 *   { not: <condition> }                                   — inverts any inner condition
 *
 * Transition-module extensions (read from context.sessionData when present):
 *   { storeValue: 'sessionProfile.holdingQuestion' }      — dot-path truthy check (has any value)
 *   { storeValue: 'booster.status', equals: 'taken' }     — dot-path equality
 *   { storeValue: 'journalCount', gte: 5 }                — numeric comparison (gte/gt/lte/lt)
 *   { moduleCompleted: 'values-compass' }                 — sessionData.modulesCompleted includes id
 *   { helperUsedDuring: 'peak' }                          — sessionData.helperUsedDuring.peak === true
 *
 *   undefined / null                                      — always true (no condition = show)
 *
 * @param {object|undefined} condition - The condition to evaluate
 * @param {object} context - Current evaluation context
 * @param {object} context.choiceValues    - { key: optionId }
 * @param {object} context.selectorValues  - { key: optionId | [optionIds] }
 * @param {string[]} context.visitedSections
 * @param {object} [context.sessionData]   - Derived session-level data (transition-only)
 * @param {object} [context.storeState]    - Full session store snapshot (transition-only, for storeValue paths)
 * @returns {boolean} Whether the condition passes
 */
export default function evaluateCondition(condition, context) {
  const {
    choiceValues = {},
    selectorValues = {},
    visitedSections = [],
    sessionData,
    storeState,
  } = context || {};

  // No condition → always show
  if (!condition) return true;

  // Compound: AND — all sub-conditions must pass
  if (condition.and) {
    return condition.and.every((sub) => evaluateCondition(sub, context));
  }

  // Compound: OR — any sub-condition must pass
  if (condition.or) {
    return condition.or.some((sub) => evaluateCondition(sub, context));
  }

  // Compound: NOT — inverts any inner condition
  if (condition.not !== undefined) {
    return !evaluateCondition(condition.not, context);
  }

  // Key-based: check choiceValues first, then selectorValues
  if (condition.key) {
    const value = choiceValues[condition.key] ?? selectorValues[condition.key];

    if (condition.equals !== undefined) {
      return value === condition.equals;
    }

    if (condition.in) {
      if (Array.isArray(value)) {
        return condition.in.some((v) => value.includes(v));
      }
      return condition.in.includes(value);
    }

    // Truthy check — key has any value
    return value != null && value !== '' && !(Array.isArray(value) && value.length === 0);
  }

  // Section visit checks
  if (condition.visited) {
    return visitedSections.includes(condition.visited);
  }
  if (condition.notVisited) {
    return !visitedSections.includes(condition.notVisited);
  }

  // ── Transition-only extensions ──────────────────────────────────────────

  // storeValue: dot-path lookup against storeState (full store), falling back to sessionData
  if (condition.storeValue) {
    const value = resolvePath(condition.storeValue, storeState, sessionData);

    if (condition.equals !== undefined) return value === condition.equals;
    if (condition.in) {
      if (Array.isArray(value)) return condition.in.some((v) => value.includes(v));
      return condition.in.includes(value);
    }
    if (condition.gte !== undefined) return typeof value === 'number' && value >= condition.gte;
    if (condition.gt !== undefined) return typeof value === 'number' && value > condition.gt;
    if (condition.lte !== undefined) return typeof value === 'number' && value <= condition.lte;
    if (condition.lt !== undefined) return typeof value === 'number' && value < condition.lt;

    // Truthy check — value has any value
    return value != null && value !== '' && !(Array.isArray(value) && value.length === 0);
  }

  // moduleCompleted: derived list of completed module IDs
  if (condition.moduleCompleted) {
    const completed = sessionData?.modulesCompleted || [];
    return completed.includes(condition.moduleCompleted);
  }

  // helperUsedDuring: derived per-phase boolean map
  if (condition.helperUsedDuring) {
    return sessionData?.helperUsedDuring?.[condition.helperUsedDuring] === true;
  }

  // Unknown condition shape → show (safe default)
  return true;
}

/**
 * Resolve a dot-path against a primary object, falling back to a secondary.
 * Primary: the full session store state. Secondary: sessionData.
 * @param {string} path - dot-path, e.g. 'sessionProfile.holdingQuestion'
 * @param {object} primary
 * @param {object} secondary
 */
function resolvePath(path, primary, secondary) {
  const parts = path.split('.');
  // Try primary first
  let value = primary;
  for (const part of parts) {
    if (value == null || typeof value !== 'object') { value = undefined; break; }
    value = value[part];
  }
  if (value !== undefined) return value;

  // Fall back to secondary (sessionData)
  value = secondary;
  for (const part of parts) {
    if (value == null || typeof value !== 'object') return undefined;
    value = value[part];
  }
  return value;
}

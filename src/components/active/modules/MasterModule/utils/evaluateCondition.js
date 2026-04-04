/**
 * evaluateCondition
 *
 * Pure function that evaluates a condition object against the current module state.
 * Used to conditionally show/hide blocks and screens based on user choices,
 * selector values, or visited sections.
 *
 * Condition shapes:
 *   { key: 'checkIn', equals: 'heavy' }        — exact match
 *   { key: 'checkIn', in: ['heavy', 'numb'] }  — one-of match
 *   { key: 'mood' }                             — has any value (truthy)
 *   { visited: 'section-b' }                    — section was visited
 *   { notVisited: 'section-c' }                 — section was NOT visited
 *   { and: [condition, condition, ...] }         — ALL conditions must pass
 *   { or: [condition, condition, ...] }          — ANY condition must pass
 *   undefined / null                            — always true (no condition = show)
 *
 * @param {object|undefined} condition - The condition to evaluate
 * @param {object} context - Current module state
 * @param {object} context.choiceValues - { key: optionId }
 * @param {object} context.selectorValues - { key: optionId | [optionIds] }
 * @param {string[]} context.visitedSections - Array of completed section IDs
 * @returns {boolean} Whether the condition passes
 */
export default function evaluateCondition(condition, context) {
  const { choiceValues = {}, selectorValues = {}, visitedSections = [] } = context || {};

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

  // Key-based: check choiceValues first, then selectorValues
  if (condition.key) {
    const value = choiceValues[condition.key] ?? selectorValues[condition.key];

    // Exact match
    if (condition.equals !== undefined) {
      return value === condition.equals;
    }

    // One-of match
    if (condition.in) {
      if (Array.isArray(value)) {
        return condition.in.some((v) => value.includes(v));
      }
      return condition.in.includes(value);
    }

    // Truthy check (key has any value)
    return value != null;
  }

  // Section visit checks
  if (condition.visited) {
    return visitedSections.includes(condition.visited);
  }
  if (condition.notVisited) {
    return !visitedSections.includes(condition.notVisited);
  }

  // Unknown condition shape → show (safe default)
  return true;
}

/**
 * journalAssembler
 *
 * Builds a journal entry text string from collected MasterModule responses.
 * Always includes prompt questions the user saw (based on conditions), even if
 * they didn't type anything — marks unanswered prompts with "no entry" + timestamp
 * to support users who journal physically.
 *
 * @param {object} params
 * @param {string} params.titlePrefix - Entry title (e.g. 'EXAMPLE ACTIVITY')
 * @param {object[]} params.allScreens - Flat array of all blocks across all sections
 * @param {object} params.responses - Prompt responses keyed by promptIndex
 * @param {object} params.selectorValues - Selector selections keyed by screen key
 * @param {object} params.selectorJournals - Selector journal text keyed by screen key
 * @param {object} [params.conditionContext] - { choiceValues, selectorValues, visitedSections }
 * @returns {string} Formatted journal entry text
 */

import evaluateCondition from './evaluateCondition';

export function assembleJournalEntry({
  titlePrefix = 'MODULE',
  allScreens = [],
  responses = {},
  selectorValues = {},
  selectorJournals = {},
  conditionContext = null,
}) {
  let content = `${titlePrefix}\n`;

  const now = new Date();
  const timestamp = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  allScreens.forEach((screen) => {
    // Skip blocks from sections the user never reached (due to routing)
    if (screen.sectionId && conditionContext?.visitedSections) {
      if (!conditionContext.visitedSections.includes(screen.sectionId)) return;
    }

    // Skip blocks hidden by conditions (user never saw them)
    if (screen.condition && conditionContext) {
      if (!evaluateCondition(screen.condition, conditionContext)) return;
    }

    if (screen.type === 'prompt') {
      content += `\n${screen.prompt}\n`;
      if (responses[screen.promptIndex]?.trim()) {
        content += `${responses[screen.promptIndex].trim()}\n`;
      } else {
        content += `[no entry — ${timestamp}]\n`;
      }
    }

    if (screen.type === 'selector') {
      content += `\n${screen.prompt}\n`;
      const selected = selectorValues[screen.key];
      if (selected) {
        if (Array.isArray(selected)) {
          const labels = selected.map(
            (id) => screen.options.find((o) => o.id === id)?.label || id
          );
          content += `${labels.join(', ')}\n`;
        } else {
          const label = screen.options.find((o) => o.id === selected)?.label || selected;
          content += `${label}\n`;
        }
      }
      if (screen.journal && selectorJournals[screen.key]?.trim()) {
        content += `${selectorJournals[screen.key].trim()}\n`;
      }
    }
  });

  return content.trim();
}

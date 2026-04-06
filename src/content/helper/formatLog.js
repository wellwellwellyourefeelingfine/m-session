/**
 * Format a Helper Modal interaction as a journal entry string.
 * Fields are omitted when null/undefined.
 */

const ROUTE_LABELS = {
  'acknowledge-close': 'Acknowledged',
  'max-activity': 'Active activity suggestions',
  'gentle-activity': 'Gentle activity suggestions',
  'emergency': 'Emergency support',
};

export function formatHelperModalLog({ categoryLabel, rating, route, activityChosen, escalatedToEmergency }) {
  const lines = ['HELPER MODAL'];
  lines.push('');

  if (categoryLabel) {
    lines.push(`Category: ${categoryLabel}`);
  }

  if (rating !== null && rating !== undefined) {
    lines.push(`Rating: ${rating}/10`);
  }

  if (route) {
    lines.push(`Route: ${ROUTE_LABELS[route] || route}`);
  }

  if (activityChosen) {
    lines.push(`Activity chosen: ${activityChosen}`);
  }

  if (escalatedToEmergency) {
    lines.push('Escalated to emergency: Yes');
  }

  return lines.join('\n');
}

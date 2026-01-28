/**
 * Session Data Download Utility
 * Generates and downloads session data in text or JSON format
 */

import { useSessionStore } from '../stores/useSessionStore';
import { useJournalStore } from '../stores/useJournalStore';

/**
 * Format a date nicely for display
 */
function formatDate(date) {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Format duration in seconds to human-readable string
 */
function formatDuration(seconds) {
  if (!seconds) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Get session data from stores
 */
function getSessionData() {
  const sessionState = useSessionStore.getState();
  const journalState = useJournalStore.getState();

  const {
    intake,
    substanceChecklist,
    preSubstanceActivity,
    transitionCaptures,
    session,
    booster,
  } = sessionState;

  // Get session journal entries
  const journalEntries = journalState.entries.filter(
    (entry) => entry.source === 'session'
  );

  return {
    session: {
      startedAt: substanceChecklist?.ingestionTime,
      closedAt: session?.closedAt,
      finalDurationSeconds: session?.finalDurationSeconds,
      status: sessionState.sessionPhase,
    },
    intake: intake?.responses || {},
    substanceChecklist: {
      plannedDosageMg: substanceChecklist?.plannedDosageMg,
      dosageFeedback: substanceChecklist?.dosageFeedback,
      ingestionTime: substanceChecklist?.ingestionTime,
    },
    booster: booster?.status !== 'pending' ? {
      status: booster?.status,
      takenAt: booster?.boosterTakenAt,
    } : null,
    intention: {
      original: intake?.responses?.holdingQuestion || '',
      touchstone: preSubstanceActivity?.touchstone || '',
    },
    transitionCaptures,
    journalEntries: journalEntries.map((entry) => ({
      id: entry.id,
      timestamp: entry.createdAt,
      title: entry.title,
      content: entry.content,
      moduleTitle: entry.moduleTitle,
    })),
  };
}

/**
 * Generate human-readable text export
 */
export function generateTextExport() {
  const data = getSessionData();
  const divider = '═'.repeat(60);
  const subDivider = '─'.repeat(60);

  let text = `${divider}
MDMA SESSION RECORD
${divider}

Date: ${formatDate(data.session.startedAt)}
Duration: ${formatDuration(data.session.finalDurationSeconds)}
Started: ${formatDate(data.session.startedAt)}
Ended: ${formatDate(data.session.closedAt)}
`;

  // Dosage
  if (data.substanceChecklist.plannedDosageMg) {
    text += `\nDosage: ${data.substanceChecklist.plannedDosageMg}mg`;
    if (data.substanceChecklist.dosageFeedback) {
      text += ` (${data.substanceChecklist.dosageFeedback})`;
    }
  }

  // Booster
  if (data.booster && data.booster.status === 'taken') {
    text += `\nBooster: Taken at ${formatDate(data.booster.takenAt)}`;
  }

  // Intention
  if (data.intention.original || data.intention.touchstone) {
    text += `\n\n${subDivider}
INTENTION
${subDivider}
`;
    if (data.intention.original) {
      text += `\n${data.intention.original}`;
    }
    if (data.intention.touchstone) {
      text += `\n\nTouchstone: ${data.intention.touchstone}`;
    }
  }

  // Peak Transition
  const peak = data.transitionCaptures?.peak;
  if (peak && (peak.bodySensations?.length || peak.oneWord)) {
    text += `\n\n${subDivider}
PEAK TRANSITION
${subDivider}
`;
    if (peak.oneWord) {
      text += `\nOne Word: ${peak.oneWord}`;
    }
    if (peak.bodySensations?.length) {
      text += `\nBody Sensations: ${peak.bodySensations.join(', ')}`;
    }
  }

  // Integration Transition
  const integration = data.transitionCaptures?.integration;
  if (integration && (integration.editedIntention || integration.tailoredActivityResponse)) {
    text += `\n\n${subDivider}
INTEGRATION TRANSITION
${subDivider}
`;
    if (integration.editedIntention) {
      text += `\nIntention Addition: ${integration.editedIntention}`;
    }
    if (integration.newFocus) {
      text += `\nFocus Changed To: ${integration.newFocus}`;
    }
    const activityResponse = integration.tailoredActivityResponse;
    if (activityResponse && typeof activityResponse === 'object' && Object.keys(activityResponse).length > 0) {
      text += `\n\nTailored Activity Response:`;
      Object.entries(activityResponse).forEach(([key, value]) => {
        if (value) {
          text += `\n  ${key}: ${value}`;
        }
      });
    }
  }

  // Closing Ritual
  const closing = data.transitionCaptures?.closing;
  if (closing && (closing.selfGratitude || closing.futureMessage || closing.commitment)) {
    text += `\n\n${subDivider}
CLOSING REFLECTIONS
${subDivider}
`;
    if (closing.selfGratitude) {
      text += `\nOne thing about myself I appreciate:\n${closing.selfGratitude}`;
    }
    if (closing.futureMessage) {
      text += `\n\nMessage to my future self:\n${closing.futureMessage}`;
    }
    if (closing.commitment) {
      text += `\n\nOne thing I want to do differently:\n${closing.commitment}`;
    }
  }

  // Journal Entries
  if (data.journalEntries?.length > 0) {
    text += `\n\n${subDivider}
JOURNAL ENTRIES
${subDivider}
`;
    data.journalEntries.forEach((entry) => {
      text += `\n[${formatDate(entry.timestamp)}]`;
      if (entry.moduleTitle) {
        text += ` — ${entry.moduleTitle}`;
      }
      text += `\n${entry.content}\n`;
    });
  }

  text += `\n${divider}
`;

  return text;
}

/**
 * Generate JSON export
 */
export function generateJsonExport() {
  const data = getSessionData();

  return JSON.stringify({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    ...data,
  }, null, 2);
}

/**
 * Trigger file download in browser
 */
export function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get filename with date
 */
function getFilename(extension) {
  const date = new Date().toISOString().split('T')[0];
  return `session-${date}.${extension}`;
}

/**
 * Download session data in specified format
 * @param {'txt' | 'json'} format - The export format
 */
export function downloadSessionData(format) {
  if (format === 'txt') {
    const content = generateTextExport();
    downloadFile(content, getFilename('txt'), 'text/plain');
  } else if (format === 'json') {
    const content = generateJsonExport();
    downloadFile(content, getFilename('json'), 'application/json');
  }
}

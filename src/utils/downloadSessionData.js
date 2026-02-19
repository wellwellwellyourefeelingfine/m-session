/**
 * Session Data Download Utility
 * Generates and downloads session data in text or JSON format
 */

import { useSessionStore } from '../stores/useSessionStore';
import { useJournalStore } from '../stores/useJournalStore';
import { getProtectorLabel } from '../content/modules/protectorDialogueContent';

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
    comeUpCheckIn,
    followUp,
    modules,
  } = sessionState;

  // Get ALL journal entries (both session-created and manual)
  // Sort by creation time, oldest first
  const allJournalEntries = [...journalState.entries].sort(
    (a, b) => a.createdAt - b.createdAt
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
      checkInResponses: booster?.checkInResponses || null,
    } : null,
    intention: {
      original: intake?.responses?.holdingQuestion || '',
      touchstone: preSubstanceActivity?.touchstone || '',
    },
    comeUpCheckIn: comeUpCheckIn?.responses?.length > 0 ? {
      responses: comeUpCheckIn.responses,
    } : null,
    transitionCaptures,
    // Include module completion history
    moduleHistory: modules?.history?.length > 0 ? modules.history.map((item) => ({
      instanceId: item.instanceId,
      libraryId: item.libraryId,
      title: item.title,
      phase: item.phase,
      duration: item.duration,
      status: item.status,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
    })) : null,
    // Include follow-up module responses
    followUp: followUp?.modules ? {
      checkIn: followUp.modules.checkIn?.status === 'completed' ? {
        completedAt: followUp.modules.checkIn.completedAt,
        feeling: followUp.modules.checkIn.feeling,
        note: followUp.modules.checkIn.note,
      } : null,
      revisit: followUp.modules.revisit?.status === 'completed' ? {
        completedAt: followUp.modules.revisit.completedAt,
        reflection: followUp.modules.revisit.reflection,
      } : null,
      integration: followUp.modules.integration?.status === 'completed' ? {
        completedAt: followUp.modules.integration.completedAt,
        emerged: followUp.modules.integration.emerged,
        commitmentStatus: followUp.modules.integration.commitmentStatus,
        commitmentResponse: followUp.modules.integration.commitmentResponse,
      } : null,
    } : null,
    // Include ALL journal entries (session + manual)
    journalEntries: allJournalEntries.map((entry) => ({
      id: entry.id,
      timestamp: entry.createdAt,
      updatedAt: entry.updatedAt,
      title: entry.title,
      content: entry.content,
      source: entry.source, // 'session' or 'manual'
      moduleTitle: entry.moduleTitle,
      tags: entry.tags,
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

  // Protector Dialogue
  const protector = data.transitionCaptures?.protectorDialogue;
  if (protector?.protectorType) {
    const label = getProtectorLabel(protector.protectorType, protector.customProtectorName);
    text += `\n\n${subDivider}
PROTECTOR DIALOGUE
${subDivider}
`;
    text += `\nProtector: ${label}`;
    if (protector.bodyLocation) {
      text += `\nBody Location: ${protector.bodyLocation}`;
    }
    if (protector.protectorMessage) {
      text += `\n\nMessage to Protector:\n${protector.protectorMessage}`;
    }
  }

  // Stay With It Check-In
  const stayWithIt = data.transitionCaptures?.stayWithIt;
  if (stayWithIt?.checkInResponse) {
    const responseLabels = {
      'lighter': 'Lighter, like something loosened',
      'still-processing': 'Still processing, not sure yet',
      'heavy': 'Heavy or weighed down',
      'numb': 'Blank or numb',
      'activated': 'Anxious, restless, or stirred up',
    };
    text += `\n\n${subDivider}
STAY WITH IT CHECK-IN
${subDivider}
`;
    text += `\nResponse: ${responseLabels[stayWithIt.checkInResponse] || stayWithIt.checkInResponse}`;
  }

  // Come-Up Check-In Responses
  if (data.comeUpCheckIn?.responses?.length > 0) {
    text += `\n\n${subDivider}
COME-UP CHECK-INS
${subDivider}
`;
    data.comeUpCheckIn.responses.forEach((response) => {
      const responseLabels = {
        'waiting': 'Still waiting',
        'starting': 'Starting to feel it',
        'fully-arrived': 'Fully arrived',
      };
      text += `\n[${response.minutesSinceIngestion} min]: ${responseLabels[response.response] || response.response}`;
    });
  }

  // Booster Check-In Responses
  if (data.booster?.checkInResponses) {
    const responses = data.booster.checkInResponses;
    const hasResponses = responses.experienceQuality || responses.physicalState || responses.trajectory;
    if (hasResponses) {
      text += `\n\nBooster Check-In Responses:`;
      if (responses.experienceQuality) {
        text += `\n  Experience Quality: ${responses.experienceQuality}`;
      }
      if (responses.physicalState) {
        text += `\n  Physical State: ${responses.physicalState}`;
      }
      if (responses.trajectory) {
        text += `\n  Trajectory: ${responses.trajectory}`;
      }
    }
  }

  // Module History
  if (data.moduleHistory?.length > 0) {
    text += `\n\n${subDivider}
COMPLETED ACTIVITIES
${subDivider}
`;
    data.moduleHistory.forEach((module) => {
      text += `\n• ${module.title}`;
      if (module.phase) {
        text += ` (${module.phase})`;
      }
      if (module.status === 'skipped') {
        text += ' [skipped]';
      }
      if (module.completedAt) {
        text += `\n  Completed: ${formatDate(module.completedAt)}`;
      }
    });
  }

  // Follow-Up Module Responses
  const hasFollowUpData = data.followUp?.checkIn || data.followUp?.revisit || data.followUp?.integration;
  if (hasFollowUpData) {
    text += `\n\n${subDivider}
FOLLOW-UP REFLECTIONS
${subDivider}
`;
    if (data.followUp.checkIn) {
      text += `\n[Check-In — ${formatDate(data.followUp.checkIn.completedAt)}]`;
      if (data.followUp.checkIn.feeling) {
        text += `\nFeeling: ${data.followUp.checkIn.feeling}`;
      }
      if (data.followUp.checkIn.note) {
        text += `\nNote: ${data.followUp.checkIn.note}`;
      }
    }
    if (data.followUp.revisit) {
      text += `\n\n[Revisit — ${formatDate(data.followUp.revisit.completedAt)}]`;
      if (data.followUp.revisit.reflection) {
        text += `\nReflection: ${data.followUp.revisit.reflection}`;
      }
    }
    if (data.followUp.integration) {
      text += `\n\n[Integration — ${formatDate(data.followUp.integration.completedAt)}]`;
      if (data.followUp.integration.emerged) {
        text += `\nWhat's Emerged: ${data.followUp.integration.emerged}`;
      }
      if (data.followUp.integration.commitmentStatus) {
        const statusLabels = {
          'following': 'Following through',
          'trying': 'Trying to follow through',
          'not-started': 'Haven\'t started yet',
          'reconsidered': 'Reconsidered the commitment',
          'forgot': 'Forgot about it',
        };
        text += `\nCommitment Status: ${statusLabels[data.followUp.integration.commitmentStatus] || data.followUp.integration.commitmentStatus}`;
      }
      if (data.followUp.integration.commitmentResponse) {
        text += `\nCommitment Response: ${data.followUp.integration.commitmentResponse}`;
      }
    }
  }

  // Journal Entries (ALL - session + manual)
  if (data.journalEntries?.length > 0) {
    text += `\n\n${subDivider}
JOURNAL ENTRIES
${subDivider}
`;
    data.journalEntries.forEach((entry) => {
      text += `\n[${formatDate(entry.timestamp)}]`;
      if (entry.moduleTitle) {
        text += ` — ${entry.moduleTitle}`;
      } else if (entry.source === 'manual') {
        text += ` — Personal Entry`;
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

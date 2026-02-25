/**
 * Session Data Download Utility
 * Generates and downloads session data in text or JSON format
 */

import { useSessionStore } from '../stores/useSessionStore';
import { useJournalStore } from '../stores/useJournalStore';
import { getProtectorName } from '../content/modules/protectorDialogueContent';
import { getImage } from './imageStorage';

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
      decisionAt: booster?.boosterDecisionAt,
      doseMg: booster?.boosterDoseMg || null,
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
      actualDuration: item.actualDuration,
      status: item.status,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
    })) : null,
    // Include follow-up module responses
    followUp: followUp?.modules ? {
      checkIn: followUp.modules.checkIn?.status === 'completed' ? {
        completedAt: followUp.modules.checkIn.completedAt,
        feeling: followUp.modules.checkIn.feeling,
        bodyFeeling: followUp.modules.checkIn.bodyFeeling,
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
    // Include pre-session module data
    preSessionModules: modules?.items?.filter((m) => m.phase === 'pre-session').length > 0
      ? modules.items.filter((m) => m.phase === 'pre-session').map((item) => ({
          title: item.title,
          duration: item.duration,
          status: item.status,
          startedAt: item.startedAt,
          completedAt: item.completedAt,
        }))
      : null,
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
  const W = 60;
  const border = '═'.repeat(W);

  function section(title) {
    const prefix = '─── ';
    const suffix = ' ';
    const fill = W - prefix.length - title.length - suffix.length;
    return `${prefix}${title}${suffix}${'─'.repeat(Math.max(3, fill))}`;
  }

  // ── Header ──────────────────────────────────────────────

  const frameBar = `╔${'═'.repeat(W - 2)}╗`;
  const frameEnd = `╚${'═'.repeat(W - 2)}╝`;

  function centerText(str) {
    return `${' '.repeat(Math.max(0, Math.floor((W - str.length) / 2)))}${str}`;
  }

  const exportDate = formatDate(new Date());

  let text = `${frameBar}

${centerText('┌┬┐    ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┬ ┌─┐ ┌─┐')}
${centerText('│││ ── └─┐ ├┤  └─┐ └─┐ │ │ │ │ │')}
${centerText('┴ ┴    └─┘ └─┘ └─┘ └─┘ ┴ └─┘ ┘ └')}

${frameEnd}

${centerText('SESSION RECORD')}
${centerText(`Exported ${exportDate}`)}

  Started:   ${formatDate(data.session.startedAt)}
  Ended:     ${formatDate(data.session.closedAt)}
  Duration:  ${formatDuration(data.session.finalDurationSeconds)}`;

  if (data.substanceChecklist.plannedDosageMg) {
    text += `\n  Dosage:    ${data.substanceChecklist.plannedDosageMg}mg`;
    if (data.substanceChecklist.dosageFeedback) {
      text += ` (${data.substanceChecklist.dosageFeedback})`;
    }
  }

  if (data.booster) {
    if (data.booster.status === 'taken') {
      text += `\n  Booster:   ${data.booster.doseMg ? data.booster.doseMg + 'mg taken' : 'Taken'} at ${formatDate(data.booster.takenAt)}`;
    } else if (data.booster.status === 'skipped') {
      text += `\n  Booster:   Skipped${data.booster.decisionAt ? ` at ${formatDate(data.booster.decisionAt)}` : ''}`;
    } else if (data.booster.status === 'expired') {
      text += `\n  Booster:   Expired (not taken within window)`;
    }
  }

  // ── Intention (pre-session) ─────────────────────────────

  if (data.intention.original || data.intention.touchstone) {
    text += `\n\n\n${section('INTENTION')}\n`;
    if (data.intention.original) {
      text += `\n  ${data.intention.original}`;
    }
    if (data.intention.touchstone) {
      text += `\n\n  Touchstone: ${data.intention.touchstone}`;
    }
  }

  // ── Come-up check-ins (onset phase) ─────────────────────

  if (data.comeUpCheckIn?.responses?.length > 0) {
    text += `\n\n\n${section('COME-UP CHECK-INS')}\n`;
    const labels = {
      'waiting': 'Still waiting',
      'starting': 'Starting to feel it',
      'fully-arrived': 'Fully arrived',
    };
    data.comeUpCheckIn.responses.forEach((r) => {
      text += `\n  [${r.minutesSinceIngestion} min]  ${labels[r.response] || r.response}`;
    });
  }

  // ── Peak transition ─────────────────────────────────────

  const peak = data.transitionCaptures?.peak;
  if (peak && (peak.bodySensations?.length || peak.oneWord)) {
    text += `\n\n\n${section('PEAK TRANSITION')}\n`;
    if (peak.oneWord) {
      text += `\n  One Word:         ${peak.oneWord}`;
    }
    if (peak.bodySensations?.length) {
      text += `\n  Body Sensations:  ${peak.bodySensations.join(', ')}`;
    }
  }

  // ── Booster check-in (during peak) ──────────────────────

  if (data.booster?.checkInResponses) {
    const r = data.booster.checkInResponses;
    if (r.experienceQuality || r.physicalState || r.trajectory) {
      text += `\n\n\n${section('BOOSTER CHECK-IN')}\n`;
      if (r.experienceQuality) text += `\n  Experience Quality:  ${r.experienceQuality}`;
      if (r.physicalState) text += `\n  Physical State:      ${r.physicalState}`;
      if (r.trajectory) text += `\n  Trajectory:          ${r.trajectory}`;
    }
  }

  // ── Activity captures (chronological by completedAt) ────
  // Protector Dialogue, Stay With It, Values Compass happen
  // during peak/integration activities — sorted by timestamp.

  const activityCaptures = [];

  const protector = data.transitionCaptures?.protectorDialogue;
  if (protector?.protectorName) {
    activityCaptures.push({ type: 'protector', at: protector.completedAt, data: protector });
  }

  const stayWithIt = data.transitionCaptures?.stayWithIt;
  if (stayWithIt?.checkInResponse) {
    activityCaptures.push({ type: 'stayWithIt', at: stayWithIt.completedAt, data: stayWithIt });
  }

  const valuesCompass = data.transitionCaptures?.valuesCompass;
  if (valuesCompass?.quadrants) {
    const hasChips = ['q1', 'q2', 'q3', 'q4'].some((q) => valuesCompass.quadrants[q]?.length > 0);
    if (hasChips) {
      activityCaptures.push({ type: 'valuesCompass', at: valuesCompass.completedAt, data: valuesCompass });
    }
  }

  activityCaptures.sort((a, b) => (a.at || Infinity) - (b.at || Infinity));

  for (const capture of activityCaptures) {
    if (capture.type === 'protector') {
      const p = capture.data;
      const label = getProtectorName(p.protectorName);
      text += `\n\n\n${section('PROTECTOR DIALOGUE')}\n`;
      text += `\n  Protector:      ${label}`;
      if (p.protectorDescription) text += `\n  Description:    ${p.protectorDescription}`;
      if (p.bodyLocation) text += `\n  Body Location:  ${p.bodyLocation}`;
      if (p.protectorMessage) text += `\n\n  Message to Protector:\n  ${p.protectorMessage}`;
    }

    if (capture.type === 'stayWithIt') {
      const responseLabels = {
        'lighter': 'Lighter, like something loosened',
        'still-processing': 'Still processing, not sure yet',
        'heavy': 'Heavy or weighed down',
        'numb': 'Blank or numb',
        'activated': 'Anxious, restless, or stirred up',
      };
      text += `\n\n\n${section('STAY WITH IT')}\n`;
      text += `\n  Response: ${responseLabels[capture.data.checkInResponse] || capture.data.checkInResponse}`;
    }

    if (capture.type === 'valuesCompass') {
      const qLabels = { q1: 'What Matters', q2: 'Inner Obstacles', q3: 'Away Moves', q4: 'Toward Moves' };
      text += `\n\n\n${section('VALUES COMPASS')}\n`;
      for (const qId of ['q1', 'q2', 'q3', 'q4']) {
        const chips = capture.data.quadrants[qId];
        if (chips?.length > 0) {
          text += `\n  ${qLabels[qId]}:`;
          chips.forEach((chip) => { text += `\n    - ${chip.text}`; });
        }
      }
    }
  }

  // ── Integration transition ──────────────────────────────

  const integration = data.transitionCaptures?.integration;
  if (integration && (integration.editedIntention || integration.tailoredActivityResponse)) {
    text += `\n\n\n${section('INTEGRATION TRANSITION')}\n`;
    if (integration.editedIntention) text += `\n  Intention Addition:  ${integration.editedIntention}`;
    if (integration.newFocus) text += `\n  Focus Changed To:    ${integration.newFocus}`;
    const ar = integration.tailoredActivityResponse;
    if (ar && typeof ar === 'object' && Object.keys(ar).length > 0) {
      text += `\n\n  Tailored Activity Response:`;
      Object.entries(ar).forEach(([key, value]) => {
        if (value) text += `\n    ${key}: ${value}`;
      });
    }
  }

  // ── Closing reflections ─────────────────────────────────

  const closing = data.transitionCaptures?.closing;
  if (closing && (closing.selfGratitude || closing.futureMessage || closing.commitment)) {
    text += `\n\n\n${section('CLOSING REFLECTIONS')}\n`;
    if (closing.selfGratitude) {
      text += `\n  One thing about myself I appreciate:\n  ${closing.selfGratitude}`;
    }
    if (closing.futureMessage) {
      text += `\n\n  Message to my future self:\n  ${closing.futureMessage}`;
    }
    if (closing.commitment) {
      text += `\n\n  One thing I want to do differently:\n  ${closing.commitment}`;
    }
  }

  // ── Session activities (full timeline) ──────────────────

  if (data.moduleHistory?.length > 0) {
    text += `\n\n\n${section('SESSION ACTIVITIES')}\n`;
    const phaseOrder = ['come-up', 'peak', 'integration'];
    const phaseLabels = { 'come-up': 'Come-Up Phase', 'peak': 'Peak Phase', 'integration': 'Integration Phase' };

    for (const phase of phaseOrder) {
      const phaseModules = data.moduleHistory.filter((m) => m.phase === phase);
      if (phaseModules.length === 0) continue;

      text += `\n  ${phaseLabels[phase] || phase}:\n`;
      phaseModules.forEach((module) => {
        text += `\n  • ${module.title}`;
        if (module.status === 'skipped') {
          text += ' [skipped]';
          if (module.completedAt) text += `\n    Skipped at:  ${formatDate(module.completedAt)}`;
        } else {
          if (module.startedAt) text += `\n    Started:     ${formatDate(module.startedAt)}`;
          if (module.completedAt) {
            text += `\n    Completed:   ${formatDate(module.completedAt)}`;
            if (module.actualDuration) text += ` (${formatDuration(module.actualDuration)})`;
          }
        }
      });
      text += '\n';
    }

    const ungrouped = data.moduleHistory.filter((m) => !phaseOrder.includes(m.phase));
    if (ungrouped.length > 0) {
      ungrouped.forEach((module) => {
        text += `\n  • ${module.title}`;
        if (module.status === 'skipped') text += ' [skipped]';
        if (module.startedAt) text += `\n    Started:     ${formatDate(module.startedAt)}`;
        if (module.completedAt) {
          text += `\n    Completed:   ${formatDate(module.completedAt)}`;
          if (module.actualDuration) text += ` (${formatDuration(module.actualDuration)})`;
        }
      });
    }
  }

  // ── Journal entries (chronological, excluding pre-session) ─────────────────────

  const PRE_SESSION_PREFIX = 'PRE-SESSION\n\n';
  const regularEntries = data.journalEntries?.filter((e) => !e.content.startsWith(PRE_SESSION_PREFIX)) || [];
  const preSessionEntries = data.journalEntries?.filter((e) => e.content.startsWith(PRE_SESSION_PREFIX)) || [];

  if (regularEntries.length > 0) {
    text += `\n\n\n${section('JOURNAL ENTRIES')}\n`;
    regularEntries.forEach((entry) => {
      text += `\n  [${formatDate(entry.timestamp)}]`;
      if (entry.moduleTitle) text += ` — ${entry.moduleTitle}`;
      else if (entry.source === 'manual') text += ` — Personal Entry`;
      text += `\n  ${entry.content}\n`;
    });
  }

  // ── Follow-up reflections (24-48h after) ────────────────

  const hasFollowUp = data.followUp?.checkIn || data.followUp?.revisit || data.followUp?.integration;
  if (hasFollowUp) {
    text += `\n\n\n${section('FOLLOW-UP REFLECTIONS')}\n`;
    if (data.followUp.checkIn) {
      text += `\n  [Check-In — ${formatDate(data.followUp.checkIn.completedAt)}]`;
      if (data.followUp.checkIn.feeling) {
        const fLabels = { 'settled': 'Settled', 'processing': 'Still processing', 'low': 'Low or flat', 'tender': 'Tender', 'energized': 'Energized', 'mixed': 'Mixed' };
        text += `\n  Feeling:       ${fLabels[data.followUp.checkIn.feeling] || data.followUp.checkIn.feeling}`;
      }
      if (data.followUp.checkIn.bodyFeeling) {
        const bLabels = { 'relaxed': 'Relaxed', 'heavy': 'Heavy', 'tense': 'Tense', 'normal': 'Normal' };
        text += `\n  Body Feeling:  ${bLabels[data.followUp.checkIn.bodyFeeling] || data.followUp.checkIn.bodyFeeling}`;
      }
      if (data.followUp.checkIn.note) text += `\n  Note:          ${data.followUp.checkIn.note}`;
    }
    if (data.followUp.revisit) {
      text += `\n\n  [Revisit — ${formatDate(data.followUp.revisit.completedAt)}]`;
      if (data.followUp.revisit.reflection) text += `\n  Reflection: ${data.followUp.revisit.reflection}`;
    }
    if (data.followUp.integration) {
      text += `\n\n  [Integration — ${formatDate(data.followUp.integration.completedAt)}]`;
      if (data.followUp.integration.emerged) text += `\n  What's Emerged: ${data.followUp.integration.emerged}`;
      if (data.followUp.integration.commitmentStatus) {
        const sLabels = { 'following': 'Following through', 'trying': 'Trying to follow through', 'not-started': "Haven't started yet", 'reconsidered': 'Reconsidered the commitment', 'forgot': 'Forgot about it' };
        text += `\n  Commitment Status:   ${sLabels[data.followUp.integration.commitmentStatus] || data.followUp.integration.commitmentStatus}`;
      }
      if (data.followUp.integration.commitmentResponse) text += `\n  Commitment Response: ${data.followUp.integration.commitmentResponse}`;
    }
  }

  // ── Pre-session activities addendum ─────────────────────

  const hasPreSession = data.preSessionModules?.length > 0 || preSessionEntries.length > 0;
  if (hasPreSession) {
    text += `\n\n\n${section('PRE-SESSION ACTIVITIES')}\n`;

    if (data.preSessionModules?.length > 0) {
      data.preSessionModules.forEach((mod) => {
        text += `\n  ${mod.title}`;
        text += `  (${mod.status})`;
        if (mod.startedAt) text += `  ${formatDate(mod.startedAt)}`;
        if (mod.completedAt) text += ` – ${formatDate(mod.completedAt)}`;
      });
      text += '\n';
    }

    if (preSessionEntries.length > 0) {
      text += '\n  Journal entries from pre-session:\n';
      preSessionEntries.forEach((entry) => {
        text += `\n  [${formatDate(entry.timestamp)}]`;
        if (entry.moduleTitle) text += ` — ${entry.moduleTitle}`;
        // Strip the PRE-SESSION prefix from display
        const content = entry.content.replace(PRE_SESSION_PREFIX, '');
        text += `\n  ${content}\n`;
      });
    }
  }

  // ── Footer ──────────────────────────────────────────────

  text += `\n\n\n${border}

  Generated by m-session  ·  m-session.com

  m-session is a free, open-source harm reduction tool.
  It is not a substitute for professional medical advice,
  therapy, or clinical supervision. Use at your own
  discretion and risk.

${border}
`;

  return text;
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
 * Download any session images (Values Compass PNG) as separate files.
 */
export async function downloadSessionImages() {
  const journalState = useJournalStore.getState();
  const imageEntries = journalState.entries.filter(
    (e) => e.hasImage && e.source === 'session'
  );

  for (const entry of imageEntries) {
    try {
      const blob = await getImage(entry.id);
      if (blob) {
        const label = (entry.moduleTitle || 'image')
          .toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const date = new Date().toISOString().split('T')[0];
        downloadFile(blob, `${label}-${date}.png`, 'image/png');
      }
    } catch (err) {
      console.warn('Failed to export image for entry', entry.id, err);
    }
  }
}

/**
 * Download session data as a text file
 */
export function downloadSessionData() {
  const content = generateTextExport();
  downloadFile(content, getFilename('txt'), 'text/plain');
}

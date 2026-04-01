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
 * Format a timestamp to short time (e.g., "2:30 PM")
 */
function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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
    timeline,
    lifeGraph,
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
    // Life Graph milestones
    lifeGraph: lifeGraph?.milestones?.length > 0 ? {
      milestones: lifeGraph.milestones,
      journalEntryId: lifeGraph.journalEntryId,
    } : null,
    // Follow-up modules added from library
    followUpModules: modules?.items?.filter((m) => m.phase === 'follow-up').map((item) => ({
      title: item.title,
      status: item.status,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
    })) || [],
    // Phase timestamps
    phaseTimestamps: {
      comeUp: { startedAt: timeline?.phases?.comeUp?.startedAt, endedAt: timeline?.phases?.comeUp?.endedAt },
      peak: { startedAt: timeline?.phases?.peak?.startedAt, endedAt: timeline?.phases?.peak?.endedAt },
      integration: { startedAt: timeline?.phases?.integration?.startedAt, endedAt: timeline?.phases?.integration?.endedAt },
    },
    // All module items (for timeline reconstruction including upcoming/skipped)
    moduleItems: modules?.items?.map((item) => ({
      title: item.title,
      phase: item.phase,
      status: item.status,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
      order: item.order,
    })) || [],
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

  // Session stats
  const preSessionCompleted = data.preSessionModules
    ? data.preSessionModules.filter((m) => m.status === 'completed').length
    : 0;
  const sessionCompleted = data.moduleHistory
    ? data.moduleHistory.filter((m) => m.phase !== 'pre-session' && m.phase !== 'follow-up' && m.status === 'completed').length
    : 0;
  const followUpCompleted = ['checkIn', 'revisit', 'integration'].filter(
    (id) => data.followUp?.[id]
  ).length;
  const longestModule = data.moduleHistory
    ? data.moduleHistory.reduce((longest, m) => {
        if (!m.actualDuration) return longest;
        return !longest || m.actualDuration > longest.actualDuration ? m : longest;
      }, null)
    : null;
  const longestText = longestModule
    ? `${longestModule.title} (${Math.round(longestModule.actualDuration / 60)}m)`
    : 'N/A';
  const journalCount = data.journalEntries ? data.journalEntries.length : 0;

  text += `\n\n  Pre-session activities:  ${preSessionCompleted}`;
  text += `\n  Session activities:      ${sessionCompleted}`;
  text += `\n  Follow-up activities:    ${followUpCompleted}`;
  text += `\n  Longest activity:        ${longestText}`;
  text += `\n  Journal entries:         ${journalCount}`;

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

  // ── Timeline (compact chronological view) ───────────────

  const timelinePhases = [
    { key: 'pre-session', label: 'Pre-Session', items: data.preSessionModules || [] },
    { key: 'come-up', label: 'Phase 1 — Come-Up', items: (data.moduleItems || []).filter((m) => m.phase === 'come-up').sort((a, b) => a.order - b.order), timestamps: data.phaseTimestamps?.comeUp },
    { key: 'peak', label: 'Phase 2 — Peak', items: (data.moduleItems || []).filter((m) => m.phase === 'peak').sort((a, b) => a.order - b.order), timestamps: data.phaseTimestamps?.peak },
    { key: 'integration', label: 'Phase 3 — Integration', items: (data.moduleItems || []).filter((m) => m.phase === 'integration').sort((a, b) => a.order - b.order), timestamps: data.phaseTimestamps?.integration },
  ];

  const hasTimelineData = timelinePhases.some((p) => p.items.length > 0);
  if (hasTimelineData) {
    text += `\n\n\n${section('TIMELINE')}\n`;

    for (const phase of timelinePhases) {
      if (phase.items.length === 0) continue;
      const phaseTime = phase.timestamps?.startedAt && phase.timestamps?.endedAt
        ? ` (${formatTime(phase.timestamps.startedAt)} – ${formatTime(phase.timestamps.endedAt)})`
        : '';
      text += `\n  ${phase.label}${phaseTime}:\n`;
      phase.items.forEach((mod) => {
        if (mod.status === 'skipped') {
          text += `    • ${mod.title}  [skipped]\n`;
        } else if (mod.status === 'completed' && mod.startedAt) {
          text += `    • ${mod.title}  ${formatTime(mod.startedAt)}${mod.completedAt ? ` – ${formatTime(mod.completedAt)}` : ''}\n`;
        } else if (mod.status === 'completed') {
          text += `    • ${mod.title}  [completed]\n`;
        } else {
          text += `    • ${mod.title}  [${mod.status || 'upcoming'}]\n`;
        }
      });
    }

    // Follow-up in timeline
    const defaultFollowUps = [
      { title: 'Check-In', data: data.followUp?.checkIn },
      { title: 'Revisit', data: data.followUp?.revisit },
      { title: 'Integration Reflection', data: data.followUp?.integration },
    ];
    const addedFollowUps = data.followUpModules || [];
    const allFollowUps = [
      ...defaultFollowUps.map((f) => ({ title: f.title, completed: !!f.data })),
      ...addedFollowUps.map((f) => ({ title: f.title, completed: f.status === 'completed' })),
    ];
    if (allFollowUps.length > 0) {
      text += `\n  Follow-Up:\n`;
      allFollowUps.forEach((f) => {
        text += `    • ${f.title}  [${f.completed ? 'completed' : 'not yet'}]\n`;
      });
    }
  }

  // ── Pre-session activities ──────────────────────────────

  const PRE_SESSION_PREFIX = 'PRE-SESSION\n\n';
  const preSessionEntries = data.journalEntries?.filter((e) => e.content.startsWith(PRE_SESSION_PREFIX)) || [];
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
        const content = entry.content.replace(PRE_SESSION_PREFIX, '');
        text += `\n  ${content}\n`;
      });
    }

    // Life Graph milestones
    if (data.lifeGraph?.milestones?.length > 0) {
      text += `\n  Life Graph:\n`;
      data.lifeGraph.milestones.forEach((m) => {
        text += `\n    • ${m.label}  (${m.rating}/10)`;
        if (m.note) text += `\n      ${m.note}`;
      });
      text += '\n';
    }
  }

  // ── Build activity captures lookup ──────────────────────
  // Collect all activity content keyed by type for rendering within phases

  const activityCaptures = {};

  const protector = data.transitionCaptures?.protectorDialogue;
  if (protector?.protectorName) activityCaptures.protector = protector;

  const stayWithIt = data.transitionCaptures?.stayWithIt;
  if (stayWithIt?.checkInResponse) activityCaptures.stayWithIt = stayWithIt;

  const valuesCompass = data.transitionCaptures?.valuesCompass;
  if (valuesCompass?.quadrants) {
    const hasChips = ['q1', 'q2', 'q3', 'q4'].some((q) => valuesCompass.quadrants[q]?.length > 0);
    if (hasChips) activityCaptures.valuesCompass = valuesCompass;
  }

  const feltSense = data.transitionCaptures?.feltSense;
  if (feltSense?.shiftCheckIn) activityCaptures.feltSense = feltSense;

  const theDescent = data.transitionCaptures?.theDescent;
  if (theDescent && (theDescent.quickCapture || theDescent.unsaidMessage || theDescent.primaryEmotion)) activityCaptures.theDescent = theDescent;

  const theCycle = data.transitionCaptures?.theCycle;
  if (theCycle && (theCycle.position || theCycle.friction || theCycle.journalResponses)) activityCaptures.theCycle = theCycle;

  const mappingTerritory = data.transitionCaptures?.mappingTerritory;
  if (mappingTerritory && (mappingTerritory.copingPattern || mappingTerritory.approachStyle)) activityCaptures.mappingTerritory = mappingTerritory;

  const pendulation = data.transitionCaptures?.pendulation;
  if (pendulation?.checkpoints?.length > 0) activityCaptures.pendulation = pendulation;

  const shakingTheTree = data.transitionCaptures?.shakingTheTree;
  if (shakingTheTree?.bodySensations?.length > 0) activityCaptures.shakingTheTree = shakingTheTree;

  // Helper: render activity capture content for a given type
  function renderCapture(type) {
    let out = '';
    if (type === 'protector' && activityCaptures.protector) {
      const p = activityCaptures.protector;
      const label = getProtectorName(p.protectorName);
      out += `\n\n  Protector Dialogue:`;
      out += `\n  Protector:      ${label}`;
      if (p.protectorDescription) out += `\n  Description:    ${p.protectorDescription}`;
      if (p.bodyLocation) out += `\n  Body Location:  ${p.bodyLocation}`;
      if (p.protectorMessage) out += `\n\n  Message to Protector:\n  ${p.protectorMessage}`;
    }
    if (type === 'stayWithIt' && activityCaptures.stayWithIt) {
      const responseLabels = { 'lighter': 'Lighter, like something loosened', 'still-processing': 'Still processing, not sure yet', 'heavy': 'Heavy or weighed down', 'numb': 'Blank or numb', 'activated': 'Anxious, restless, or stirred up' };
      out += `\n\n  Stay With It:`;
      out += `\n  Response: ${responseLabels[activityCaptures.stayWithIt.checkInResponse] || activityCaptures.stayWithIt.checkInResponse}`;
    }
    if (type === 'valuesCompass' && activityCaptures.valuesCompass) {
      const qLabels = { q1: 'What Matters', q2: 'Inner Obstacles', q3: 'Away Moves', q4: 'Toward Moves' };
      out += `\n\n  Values Compass:`;
      for (const qId of ['q1', 'q2', 'q3', 'q4']) {
        const chips = activityCaptures.valuesCompass.quadrants[qId];
        if (chips?.length > 0) {
          out += `\n  ${qLabels[qId]}:`;
          chips.forEach((chip) => { out += `\n    - ${chip.text}`; });
        }
      }
    }
    if (type === 'feltSense' && activityCaptures.feltSense) {
      out += `\n\n  Felt Sense:`;
      out += `\n  Shift Check-In: ${activityCaptures.feltSense.shiftCheckIn}`;
    }
    if (type === 'theDescent' && activityCaptures.theDescent) {
      const d = activityCaptures.theDescent;
      out += `\n\n  The Descent:`;
      if (d.quickCapture) out += `\n  Quick Capture:     ${d.quickCapture}`;
      if (d.primaryEmotion) out += `\n  Primary Emotion:   ${d.primaryEmotion}`;
      if (d.surfaceReaction) out += `\n  Surface Reaction:  ${d.surfaceReaction}`;
      if (d.unsaidMessage) out += `\n  Unsaid Message:    ${d.unsaidMessage}`;
    }
    if (type === 'theCycle' && activityCaptures.theCycle) {
      const c = activityCaptures.theCycle;
      out += `\n\n  The Cycle:`;
      if (c.position) out += `\n  Position:  ${c.position}`;
      if (c.friction) out += `\n  Friction:  ${c.friction}`;
      if (c.moves?.length > 0) out += `\n  Moves:     ${c.moves.join(', ')}`;
      if (c.emotions?.length > 0) out += `\n  Emotions:  ${c.emotions.join(', ')}`;
      if (c.journalResponses && typeof c.journalResponses === 'object') {
        Object.entries(c.journalResponses).forEach(([key, value]) => { if (value) out += `\n  ${key}: ${value}`; });
      }
    }
    if (type === 'mappingTerritory' && activityCaptures.mappingTerritory) {
      const m = activityCaptures.mappingTerritory;
      out += `\n\n  Mapping the Territory:`;
      if (m.copingPattern) out += `\n  Coping Pattern:  ${m.copingPattern}`;
      if (m.approachStyle) out += `\n  Approach Style:  ${m.approachStyle}`;
      if (m.journals && typeof m.journals === 'object') {
        Object.entries(m.journals).forEach(([key, value]) => { if (value) out += `\n  ${key}: ${value}`; });
      }
    }
    if (type === 'pendulation' && activityCaptures.pendulation) {
      out += `\n\n  Pendulation:`;
      activityCaptures.pendulation.checkpoints.forEach((cp, i) => {
        out += `\n  Checkpoint ${i + 1}: ${typeof cp === 'string' ? cp : JSON.stringify(cp)}`;
      });
    }
    if (type === 'shakingTheTree' && activityCaptures.shakingTheTree) {
      out += `\n\n  Shaking the Tree:`;
      if (activityCaptures.shakingTheTree.bodySensations?.length > 0) out += `\n  Body Sensations: ${activityCaptures.shakingTheTree.bodySensations.join(', ')}`;
      if (activityCaptures.shakingTheTree.responseKey) out += `\n  Response: ${activityCaptures.shakingTheTree.responseKey}`;
    }
    return out;
  }

  // Map libraryId to capture type for matching modules to their content
  const libraryIdToCaptureType = {
    'protector-dialogue-p1': 'protector', 'protector-dialogue-p2': 'protector',
    'stay-with-it': 'stayWithIt', 'values-compass': 'valuesCompass',
    'felt-sense': 'feltSense', 'the-descent': 'theDescent', 'the-cycle': 'theCycle',
    'mapping-territory': 'mappingTerritory', 'pendulation': 'pendulation',
    'shaking-the-tree': 'shakingTheTree',
  };

  // Track session journal entry IDs rendered inline (to exclude from final journal section)
  const renderedJournalIds = new Set();

  // Session journal entries sorted by time
  const sessionJournalEntries = (data.journalEntries || []).filter((e) => e.source === 'session');

  // Helper: render a phase's modules with their activity content + journal entries
  function renderPhaseModules(phase, phaseLabel) {
    const history = data.moduleHistory || [];
    const phaseModules = history.filter((m) => m.phase === phase);
    if (phaseModules.length === 0) return '';

    let out = `\n\n\n${section(phaseLabel)}\n`;
    const renderedCaptures = new Set();

    phaseModules.forEach((module) => {
      out += `\n  • ${module.title}`;
      if (module.status === 'skipped') {
        out += '  [skipped]';
      } else {
        if (module.startedAt) out += `  ${formatTime(module.startedAt)}`;
        if (module.completedAt) out += ` – ${formatTime(module.completedAt)}`;
        if (module.actualDuration) out += ` (${formatDuration(module.actualDuration)})`;
      }

      // Render any activity capture content for this module
      const captureType = libraryIdToCaptureType[module.libraryId];
      if (captureType && activityCaptures[captureType] && !renderedCaptures.has(captureType)) {
        out += renderCapture(captureType);
        renderedCaptures.add(captureType);
      }

      // Render any session journal entries for this module
      const moduleEntries = sessionJournalEntries.filter((e) => e.moduleTitle === module.title);
      moduleEntries.forEach((entry) => {
        out += `\n\n    ${entry.content}`;
        renderedJournalIds.add(entry.id);
      });
    });

    return out;
  }

  // ── Phase 1: Come-Up ───────────────────────────────────

  text += renderPhaseModules('come-up', 'PHASE 1 — COME-UP');

  // ── Come-up check-ins ──────────────────────────────────

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

  // ── Peak transition ────────────────────────────────────

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

  // ── Phase 2: Peak ──────────────────────────────────────

  text += renderPhaseModules('peak', 'PHASE 2 — PEAK');

  // ── Booster check-in ───────────────────────────────────

  if (data.booster?.checkInResponses) {
    const r = data.booster.checkInResponses;
    if (r.experienceQuality || r.physicalState || r.trajectory) {
      text += `\n\n\n${section('BOOSTER CHECK-IN')}\n`;
      if (r.experienceQuality) text += `\n  Experience Quality:  ${r.experienceQuality}`;
      if (r.physicalState) text += `\n  Physical State:      ${r.physicalState}`;
      if (r.trajectory) text += `\n  Trajectory:          ${r.trajectory}`;
    }
  }

  // ── Integration transition ─────────────────────────────

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

  // ── Phase 3: Integration ───────────────────────────────

  text += renderPhaseModules('integration', 'PHASE 3 — INTEGRATION');

  // ── Closing reflections ────────────────────────────────

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

  // ── Journal entries (manual + any session entries not rendered inline) ──────────

  const remainingEntries = (data.journalEntries || []).filter((e) =>
    !e.content.startsWith(PRE_SESSION_PREFIX) && !renderedJournalIds.has(e.id)
  );

  if (remainingEntries.length > 0) {
    text += `\n\n\n${section('JOURNAL ENTRIES')}\n`;
    remainingEntries.forEach((entry) => {
      text += `\n  [${formatDate(entry.timestamp)}]`;
      if (entry.moduleTitle) text += ` — ${entry.moduleTitle}`;
      else if (entry.source === 'manual') text += ` — Personal Entry`;
      text += `\n  ${entry.content}\n`;
    });
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

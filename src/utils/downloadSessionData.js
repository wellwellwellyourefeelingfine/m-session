/**
 * Session Data Download Utility
 * Generates and downloads session data in text or JSON format
 */

import { useSessionStore } from '../stores/useSessionStore';
import { useJournalStore } from '../stores/useJournalStore';
import { getProtectorName } from '../content/modules/master/protectorDialogueShared';
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
    sessionProfile,
    substanceChecklist,
    transitionCaptures,
    session,
    booster,
    comeUpCheckIn,
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
    // Export shape stays the same: `intake` holds the user's answers (now
    // sourced from sessionProfile, which is the v24 home for all user data),
    // `substanceChecklist` holds the dosage + ingestion event, `intention`
    // holds the intention text + touchstone.
    intake: sessionProfile || {},
    substanceChecklist: {
      plannedDosageMg: sessionProfile?.plannedDosageMg,
      dosageFeedback: sessionProfile?.dosageFeedback,
      ingestionTime: substanceChecklist?.ingestionTime,
    },
    booster: booster?.status !== 'pending' ? {
      status: booster?.status,
      takenAt: booster?.boosterTakenAt,
      decisionAt: booster?.boosterDecisionAt,
      doseMg: booster?.boosterDoseMg || null,
      checkInResponses: booster?.checkInResponses || null,
      snoozeCount: booster?.snoozeCount || 0,
      boosterPrepared: booster?.boosterPrepared,
    } : null,
    intention: {
      original: sessionProfile?.holdingQuestion || '',
      touchstone: sessionProfile?.touchstone || '',
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
    // Include follow-up module data (follow-up activities run as regular
    // library modules with phase='follow-up'; their responses flow through
    // the shared module history and journalEntries sections above).
    followUpModules: modules?.items?.filter((m) => m.phase === 'follow-up').length > 0
      ? modules.items.filter((m) => m.phase === 'follow-up').map((item) => ({
          title: item.title,
          libraryId: item.libraryId,
          duration: item.duration,
          status: item.status,
          startedAt: item.startedAt,
          completedAt: item.completedAt,
        }))
      : null,
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
  const followUpCompleted = (data.followUpModules || []).filter(
    (m) => m.status === 'completed'
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
    { key: 'integration', label: 'Phase 3 — Synthesis', items: (data.moduleItems || []).filter((m) => m.phase === 'integration').sort((a, b) => a.order - b.order), timestamps: data.phaseTimestamps?.integration },
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

    // Follow-up in timeline (library modules with phase='follow-up')
    const followUps = data.followUpModules || [];
    if (followUps.length > 0) {
      text += `\n  Follow-Up:\n`;
      followUps.forEach((f) => {
        const completed = f.status === 'completed';
        text += `    • ${f.title}  [${completed ? 'completed' : 'not yet'}]\n`;
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

  // Prefer the new identity-scoped sessionProfile.protector path. Fall back to
  // the legacy transitionCaptures.protectorDialogue slot for any session that
  // hasn't migrated yet (and for the test window before the legacy modules are
  // deleted). The fallback also normalizes field names so downstream renderers
  // see a single shape.
  const newProtector = data.sessionProfile?.protector;
  const legacyProtector = data.transitionCaptures?.protectorDialogue;
  if (newProtector?.name) {
    activityCaptures.protector = {
      protectorName: newProtector.name,
      protectorDescription: newProtector.description,
      bodyLocation: newProtector.bodyLocation,
      protectorMessage: newProtector.message,
    };
  } else if (legacyProtector?.protectorName) {
    activityCaptures.protector = legacyProtector;
  }

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

  if (data.booster) {
    const r = data.booster.checkInResponses;
    const hasCheckIn = r && (r.experienceQuality || r.physicalState || r.trajectory);

    if (hasCheckIn || data.booster.snoozeCount > 0) {
      text += `\n\n\n${section('BOOSTER CHECK-IN')}\n`;

      if (hasCheckIn) {
        const expLabels = { 'deep-meaningful': 'Deep and meaningful', 'pleasant-open': 'Pleasant and open', 'settled': 'Settled but ready to shift', 'intense': 'Intense', 'uncertain': 'Uncertain' };
        const physLabels = { 'comfortable': 'Comfortable', 'some-tension': 'Some tension', 'temperature': 'Temperature fluctuations', 'noticeable': 'Noticeable physical effects', 'uncomfortable': 'Uncomfortable' };
        const trajLabels = { 'more-to-explore': 'More to explore', 'middle-of-something': 'In the middle of something', 'complete': 'Feeling complete', 'ready-to-integrate': 'Ready to integrate' };

        if (r.experienceQuality) text += `\n  Experience Quality:  ${expLabels[r.experienceQuality] || r.experienceQuality}`;
        if (r.physicalState) text += `\n  Physical State:      ${physLabels[r.physicalState] || r.physicalState}`;
        if (r.trajectory) text += `\n  Trajectory:          ${trajLabels[r.trajectory] || r.trajectory}`;
      }

      if (data.booster.status === 'taken') {
        text += `\n\n  Decision:            Taken`;
        if (data.booster.doseMg) text += `\n  Booster Dose:        ${data.booster.doseMg}mg`;
        if (data.booster.takenAt) text += `\n  Taken At:            ${formatDate(data.booster.takenAt)}`;
      } else if (data.booster.status === 'skipped') {
        text += `\n\n  Decision:            Skipped`;
        if (data.booster.decisionAt) text += `\n  Decided At:          ${formatDate(data.booster.decisionAt)}`;
      } else if (data.booster.status === 'expired') {
        text += `\n\n  Decision:            Expired (not taken within window)`;
      }

      if (data.booster.snoozeCount > 0) {
        text += `\n  Times Snoozed:       ${data.booster.snoozeCount}`;
      }
    }
  }

  // ── Integration transition ─────────────────────────────
  // New source of truth: `transitionData` (store v26+). Falls back to the
  // legacy `transitionCaptures.integration` for pre-v26 archives.

  const td = data.transitionData || {};
  const integration = data.transitionCaptures?.integration || {};
  const intentionAddition = td.intentionAdditions?.integration || integration.editedIntention;
  const newFocus = td.newFocus || integration.newFocus;
  const focusSubtype = td.focusSubtype || td.newRelationshipType || integration.newRelationshipType;
  const tailoredActivityResponse = integration.tailoredActivityResponse;

  if (intentionAddition || newFocus || focusSubtype || tailoredActivityResponse) {
    text += `\n\n\n${section('SYNTHESIS TRANSITION')}\n`;
    if (intentionAddition) text += `\n  Intention Addition:  ${intentionAddition}`;
    if (newFocus) text += `\n  Focus Changed To:    ${newFocus}`;
    if (focusSubtype) text += `\n  Focus Detail:        ${focusSubtype}`;
    const ar = tailoredActivityResponse;
    if (ar && typeof ar === 'object' && Object.keys(ar).length > 0) {
      text += `\n\n  Tailored Activity Response:`;
      Object.entries(ar).forEach(([key, value]) => {
        if (value) text += `\n    ${key}: ${value}`;
      });
    }
  }

  // ── Phase 3: Integration ───────────────────────────────

  text += renderPhaseModules('integration', 'PHASE 3 — SYNTHESIS');

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

  // Follow-up activities are library modules (phase='follow-up') with their
  // own module entries in moduleHistory and journalEntries. Their completed
  // run metadata is rendered via the timeline/activity sections above, and
  // any user-written reflections live in the journalEntries section below —
  // no dedicated "FOLLOW-UP REFLECTIONS" section is needed.

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

  // ── Intake Form Responses ───────────────────────────────

  const intake = data.intake;
  if (intake && Object.keys(intake).length > 0) {
    const optionLabels = {
      experienceLevel: { 'first-time': 'First time', 'beginner': '1–3 sessions', 'experienced': '4+ sessions' },
      sessionMode: { 'solo': 'Solo', 'with-partner': 'With a partner', 'with-sitter': 'With a sitter', 'group': 'Group setting' },
      primaryFocus: { 'self-understanding': 'Self-understanding', 'healing': 'Emotional healing', 'relationship': 'Relationship exploration', 'creativity': 'Creativity & insight', 'open': 'Open exploration' },
      guidanceLevel: { 'full': 'Full guidance', 'moderate': 'Moderate guidance', 'minimal': 'Minimal — mostly open space' },
      hasTested: { 'yes': 'Yes', 'not-yet': 'Not yet' },
      considerBooster: { 'yes': 'Yes', 'no': 'No, just one dose', 'decide-later': 'Decide during session' },
      physicalPreparation: { 'yes': 'Yes', 'not-yet': 'Not yet' },
      lastMDMAUse: { 'first-time': 'First time', 'more-than-3-months': 'More than 3 months ago', '1-3-months': '1–3 months ago', 'less-than-1-month': 'Less than 1 month ago', 'unsure': 'Not sure' },
      emergencyContact: { 'yes': 'Yes', 'no-okay': 'No, but comfortable', 'no-fine': 'No' },
      contraindicatedMedications: { 'yes': 'Yes', 'no': 'No' },
      heartConditions: { 'yes': 'Yes', 'no': 'No' },
      psychiatricHistory: { 'yes': 'Yes', 'no': 'No' },
    };

    const fieldLabels = {
      experienceLevel: 'Experience Level',
      sessionMode: 'Session Mode',
      primaryFocus: 'Primary Focus',
      holdingQuestion: 'Intention',
      guidanceLevel: 'Guidance Level',
      activityPreferences: 'Activity Preferences',
      hasTested: 'Has Tested',
      considerBooster: 'Consider Booster',
      physicalPreparation: 'Physical Preparation',
      lastMDMAUse: 'Last MDMA Use',
      emergencyContact: 'Emergency Contact',
      emergencyContactDetails: 'Emergency Contact Details',
      contraindicatedMedications: 'Contraindicated Medications',
      heartConditions: 'Heart Conditions',
      psychiatricHistory: 'Psychiatric History',
      hasResearchedDosage: 'Researched Dosage',
    };

    text += `\n\n\n${section('INTAKE FORM')}\n`;

    for (const [key, value] of Object.entries(intake)) {
      if (value === null || value === undefined || value === '') continue;
      const label = fieldLabels[key] || key;
      if (Array.isArray(value)) {
        text += `\n  ${label}:  ${value.join(', ')}`;
      } else if (key === 'emergencyContactDetails' && typeof value === 'object') {
        const parts = [value.name, value.phone].filter(Boolean);
        if (parts.length > 0) text += `\n  ${label}:  ${parts.join(' — ')}`;
        if (value.notes && value.notes.trim()) {
          text += `\n  Emergency Contact Notes:  ${value.notes.trim()}`;
        }
      } else if (optionLabels[key]?.[value]) {
        text += `\n  ${label}:  ${optionLabels[key][value]}`;
      } else {
        text += `\n  ${label}:  ${value}`;
      }
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

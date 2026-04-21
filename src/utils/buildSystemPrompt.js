/**
 * Build System Prompt
 * Dynamically constructs the AI system prompt with current session context
 */

import {
  getModulesForPhase,
  getRecommendedModulesForPhase,
  FRAMEWORKS,
} from '../content/modules';

/**
 * Default context settings — all enabled.
 * Shared by buildSystemPrompt(), AISettingsPanel, and AIAssistantModal.
 */
export const CONTEXT_DEFAULTS = {
  includeSessionStatus: true,
  includeTimeSinceIngestion: true,
  includeDosage: true,
  includeCurrentModule: true,
  includeProgress: true,
  includeJournal: true,
  includeIntention: true,
  includeHelperModal: true,
  includeModuleLibrary: true,
  includeEmergencyContact: true,
};

// ─── Helper Functions ─────────────────────────────────────────────

/**
 * Build progress summary from completed/upcoming modules and check-in responses
 */
function buildProgressSummary(moduleItems, checkInResponses) {
  const completed = (moduleItems || []).filter((m) => m.status === 'completed');
  const upcoming = (moduleItems || []).filter((m) => m.status === 'upcoming');

  if (completed.length === 0 && upcoming.length === 0 && checkInResponses.length === 0) {
    return 'No activities completed yet.';
  }

  const parts = [];

  if (completed.length > 0) {
    const moduleList = completed
      .slice(-5)
      .map((m) => `- ${m.title} (${m.phase})`)
      .join('\n');
    parts.push(`Completed modules:\n${moduleList}`);
  }

  if (upcoming.length > 0) {
    const moduleList = upcoming
      .map((m) => `- ${m.title} (${m.phase}) — ${m.duration}min`)
      .join('\n');
    parts.push(`Upcoming modules:\n${moduleList}`);
  }

  if (checkInResponses.length > 0) {
    const latestCheckIn = checkInResponses[checkInResponses.length - 1];
    const responseMap = {
      waiting: 'Still waiting for effects',
      starting: 'Beginning to feel effects',
      'fully-arrived': 'Fully arrived in the experience',
    };
    parts.push(
      `Latest check-in (${latestCheckIn.minutesSinceIngestion}min): ${responseMap[latestCheckIn.response] || latestCheckIn.response}`
    );
  }

  return parts.join('\n\n');
}

/**
 * Build journal summary from recent entries
 */
function buildJournalSummary(recentEntries) {
  if (!recentEntries || recentEntries.length === 0) {
    return 'No journal entries yet.';
  }

  return recentEntries
    .slice(-3)
    .map((entry) => {
      const preview =
        entry.content.length > 100 ? entry.content.slice(0, 100) + '...' : entry.content;
      return `- "${preview}"`;
    })
    .join('\n');
}

/**
 * Build Helper Modal usage summary from journal entries.
 * Helper modal logs are journal entries with moduleTitle === 'Helper Modal'.
 * Returns null if no helper usage found.
 */
function buildHelperModalSummary(journalEntries) {
  if (!journalEntries || journalEntries.length === 0) return null;

  const helperEntries = journalEntries.filter(
    (e) => e.moduleTitle === 'Helper Modal'
  );

  if (helperEntries.length === 0) return null;

  const summaries = helperEntries.map((entry) => {
    const lines = entry.content.split('\n').filter((l) => l.trim());
    // Skip the header line ("HELPER MODAL" or "HELPER MODAL (FOLLOW-UP)")
    const dataLines = lines.filter(
      (l) => !l.startsWith('HELPER MODAL')
    );
    return dataLines.map((l) => `- ${l}`).join('\n');
  });

  return summaries.join('\n\n');
}

/**
 * Build a condensed reference of available modules for the current phase.
 * Returns null if no phase is active.
 */
function buildModuleLibrarySummary(currentPhase) {
  if (!currentPhase) return null;

  const recommended = getRecommendedModulesForPhase(currentPhase);
  const all = getModulesForPhase(currentPhase);
  const nonRecommended = all.filter(
    (m) => !recommended.some((r) => r.id === m.id) && !m.hidden
  );

  const parts = [];

  if (recommended.length > 0) {
    const recList = recommended
      .filter((m) => !m.hidden)
      .map((m) => {
        const fw = m.framework
          ?.filter((f) => f !== 'general')
          .map((f) => FRAMEWORKS[f]?.abbreviation || FRAMEWORKS[f]?.label || f)
          .join(', ');
        const duration = m.hasVariableDuration
          ? `${m.minDuration}-${m.maxDuration}min`
          : `${m.defaultDuration}min`;
        return fw ? `${m.title} (${duration}, ${fw})` : `${m.title} (${duration})`;
      })
      .join(', ');
    parts.push(`Recommended: ${recList}`);
  }

  if (nonRecommended.length > 0) {
    const otherList = nonRecommended.map((m) => m.title).join(', ');
    parts.push(`Also available: ${otherList}`);
  }

  if (parts.length === 0) return null;
  return `Available activities for ${currentPhase} phase:\n${parts.join('\n')}`;
}

/**
 * Format time in a human-readable way
 */
function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return null;

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins} minutes`;
}

/**
 * Get phase description
 */
function getPhaseDescription(phase) {
  const descriptions = {
    'come-up': 'Come-up phase (effects beginning to manifest)',
    peak: 'Peak phase (full effects)',
    integration: 'Synthesis phase (effects beginning to subside)',
  };
  return descriptions[phase] || phase || 'Not in active session';
}

/**
 * Get phase-specific AI guidance
 */
function getPhaseGuidance(phase) {
  const guidance = {
    'come-up':
      'The user may be anxious about onset. Be especially reassuring. Effects typically begin 30-45 minutes after ingestion.',
    peak:
      'The user is in the peak of the experience. Keep responses very brief and warm. Less is more.',
    integration:
      'The user is processing and coming down. Support meaning-making and gentle reflection.',
  };
  return guidance[phase] || null;
}

// ─── Main System Prompt Builder ────────────────────────────────────

/**
 * Build the complete system prompt with session context
 * @param {object} sessionState - State from useSessionStore
 * @param {object} journalState - State from useJournalStore
 * @param {object} [contextSettings] - Optional settings to control what context is included
 * @returns {string} Complete system prompt
 */
export function buildSystemPrompt(sessionState, journalState, contextSettings = null) {
  const ctx = contextSettings || { ...CONTEXT_DEFAULTS };

  // Extract session data safely
  const sessionPhase = sessionState?.sessionPhase || 'not-started';
  const timeline = sessionState?.timeline || {};
  const substanceChecklist = sessionState?.substanceChecklist || {};
  const modules = sessionState?.modules || {};
  const comeUpCheckIn = sessionState?.comeUpCheckIn || {};
  const sessionProfile = sessionState?.sessionProfile || {};
  const booster = sessionState?.booster || {};

  // Calculate time since ingestion
  let minutesSinceIngestion = null;
  if (substanceChecklist.ingestionTime) {
    minutesSinceIngestion = Math.floor((Date.now() - substanceChecklist.ingestionTime) / (1000 * 60));
  }

  // Get current module
  const currentModuleId = modules.currentModuleInstanceId;
  const currentModule = currentModuleId
    ? modules.items?.find((m) => m.instanceId === currentModuleId)
    : null;

  // Get recent journal entries
  const recentJournalEntries = journalState?.entries || [];

  // Build context sections
  const currentPhase = timeline.currentPhase;
  const dosage = sessionProfile.plannedDosageMg;
  const dosageFeedback = sessionProfile.dosageFeedback;
  const checkInResponses = comeUpCheckIn.responses || [];

  // Session status section
  let sessionStatus = 'Not in active session';
  if (sessionPhase === 'active' && currentPhase) {
    sessionStatus = getPhaseDescription(currentPhase);
  } else if (sessionPhase === 'intake') {
    sessionStatus = 'Completing intake questionnaire';
  } else if (sessionPhase === 'pre-session') {
    sessionStatus = 'Pre-session preparation';
  } else if (sessionPhase === 'substance-checklist') {
    sessionStatus = 'Substance checklist (about to begin)';
  } else if (sessionPhase === 'paused') {
    sessionStatus = 'Session paused';
  } else if (sessionPhase === 'completed') {
    sessionStatus = 'Session completed';
  }

  // Build context sections conditionally based on settings
  const contextParts = [];

  if (ctx.includeSessionStatus) {
    contextParts.push(`- Session Status: ${sessionStatus}`);
  }
  if (ctx.includeTimeSinceIngestion) {
    contextParts.push(`- Time Since Ingestion: ${minutesSinceIngestion !== null ? formatDuration(minutesSinceIngestion) : 'Not yet ingested'}`);
  }
  if (ctx.includeDosage) {
    let dosageText = dosage ? `${dosage}mg (${dosageFeedback || 'unspecified intensity'})` : 'Not specified';
    // Include booster info inline if relevant
    if (booster.status === 'taken' && booster.boosterTakenAt) {
      const boosterDose = booster.boosterDoseMg || 'unknown';
      const boosterMinutes = Math.floor((Date.now() - booster.boosterTakenAt) / (1000 * 60));
      dosageText += ` + booster ${boosterDose}mg (taken ${formatDuration(boosterMinutes)} ago)`;
    } else if (booster.status === 'skipped') {
      dosageText += ' (booster skipped)';
    }
    contextParts.push(`- Reported Dosage: ${dosageText}`);
  }
  if (ctx.includeCurrentModule) {
    contextParts.push(`- Current Activity: ${currentModule?.title || 'None active'}`);
    if (currentModule?.content?.description) {
      contextParts.push(`- Activity Description: ${currentModule.content.description}`);
    }
  }

  // Build optional sections
  const optionalSections = [];

  if (ctx.includeProgress) {
    optionalSections.push(`## Session Progress Summary\n${buildProgressSummary(modules.items, checkInResponses)}`);
  }

  if (ctx.includeJournal) {
    optionalSections.push(`## Recent Journal Entries\n${buildJournalSummary(recentJournalEntries)}`);
  }

  if (ctx.includeIntention) {
    const intentionParts = [];
    if (sessionProfile?.primaryFocus) {
      intentionParts.push(`Primary focus: ${sessionProfile.primaryFocus}`);
    }
    if (sessionProfile?.holdingQuestion) {
      intentionParts.push(`Holding question: "${sessionProfile.holdingQuestion}"`);
    }
    if (sessionProfile?.emotionalState) {
      intentionParts.push(`Starting emotional state: ${sessionProfile.emotionalState}`);
    }
    if (intentionParts.length > 0) {
      optionalSections.push(`## User's Intention (from intake)\n${intentionParts.join('\n')}`);
    }
  }

  if (ctx.includeHelperModal) {
    const helperSummary = buildHelperModalSummary(recentJournalEntries);
    if (helperSummary) {
      optionalSections.push(`## Helper Modal Usage\n${helperSummary}`);
    }
  }

  if (ctx.includeModuleLibrary) {
    const librarySummary = buildModuleLibrarySummary(currentPhase);
    if (librarySummary) {
      optionalSections.push(`## Available Activities\n${librarySummary}`);
    }
  }

  if (ctx.includeEmergencyContact) {
    const ec = sessionProfile.emergencyContactDetails;
    if (ec?.name) {
      const parts = [`Name: ${ec.name}`];
      if (ec.phone) parts.push(`Phone: ${ec.phone}`);
      if (ec.notes) parts.push(`Notes: ${ec.notes}`);
      contextParts.push(`- Emergency Contact: ${parts.join(' | ')}`);
    }
  }

  // Phase-specific guidance
  const phaseGuidance = getPhaseGuidance(currentPhase);

  // Build the prompt
  return `## Role
You are a supportive AI assistant integrated into an MDMA therapy session guide app. Your purpose is to provide warm, grounded support during the user's experience.

## Philosophy
- Treat the user as an informed adult who has already acknowledged the risks
- This is a harm reduction app focused on maximizing therapeutic benefit
- Be warm, grounded, calm, and non-judgmental
- Never lecture about drug dangers - they have already seen comprehensive warnings
- Focus on present-moment support, practical guidance, and emotional attunement
- Keep responses concise but heartfelt - the user may have difficulty reading long text
- Use simple, clear language

${contextParts.length > 0 ? `## Current Session Context\n${contextParts.join('\n')}` : ''}

${optionalSections.join('\n\n')}

## Guidelines for Responses
1. If the user reports distress, anxiety, or difficult emotions:
   - Acknowledge their experience with compassion
   - Offer simple grounding techniques (breath, body awareness, surroundings)
   - Remind them that difficult feelings are temporary and can be valuable
   - Suggest they might pause the current activity if needed

2. If the user asks practical questions:
   - Reference their current activity/module when relevant
   - Keep answers brief and actionable
   - Suggest they can always access the app's built-in resources

3. If the user wants to explore or process:
   - Be a supportive listener
   - Ask gentle, open questions if appropriate
   - Avoid interpretation or analysis - let them lead

4. General approach:
   - Match their energy level (if they're expansive, you can be too; if they're quiet, be gentle)
   - You can reference session data but cannot modify the app
   - If they mention medical concerns or emergencies, always recommend professional help
   - Remember: less is often more during an experience
${phaseGuidance ? `\n5. Current phase note:\n   - ${phaseGuidance}` : ''}

## Important Boundaries
- You cannot control the app, skip modules, or change settings
- You can suggest activities from the available list — the user can add them through the app's activity browser
- You cannot provide medical advice
- If they need emergency help, direct them to their emergency contact or professional services`.trim();
}

// ─── Completed Session Prompt ──────────────────────────────────────

/**
 * Build system prompt for a completed session (follow-up/integration phase)
 * @param {object} sessionState - State from useSessionStore
 * @param {object} journalState - State from useJournalStore
 * @param {object} [contextSettings] - Optional context settings
 * @returns {string} System prompt for completed session
 */
export function buildCompletedSessionPrompt(sessionState, journalState, contextSettings = null) {
  const ctx = contextSettings || { ...CONTEXT_DEFAULTS };

  const sessionProfile = sessionState?.sessionProfile || {};
  const session = sessionState?.session || {};
  const transitionCaptures = sessionState?.transitionCaptures || {};
  const recentJournalEntries = journalState?.entries || [];

  // Session summary
  const summaryParts = [];
  if (session.finalDurationSeconds) {
    const hours = Math.floor(session.finalDurationSeconds / 3600);
    const mins = Math.round((session.finalDurationSeconds % 3600) / 60);
    summaryParts.push(`Session duration: ${hours}h ${mins}m`);
  }
  if (session.sessionNumber) {
    summaryParts.push(`Session number: ${session.sessionNumber}`);
  }
  if (ctx.includeDosage && sessionProfile.plannedDosageMg) {
    summaryParts.push(`Dosage: ${sessionProfile.plannedDosageMg}mg (${sessionProfile.dosageFeedback || 'unspecified'})`);
  }

  // Intention
  const intentionParts = [];
  if (ctx.includeIntention) {
    if (sessionProfile.primaryFocus) {
      intentionParts.push(`Primary focus: ${sessionProfile.primaryFocus}`);
    }
    if (sessionProfile.holdingQuestion) {
      intentionParts.push(`Holding question: "${sessionProfile.holdingQuestion}"`);
    }
  }

  // Closing ritual (short, structured data)
  const closingParts = [];
  const closing = transitionCaptures.closing;
  if (closing?.completedAt) {
    if (closing.selfGratitude) {
      closingParts.push(`Self-gratitude: "${closing.selfGratitude.slice(0, 100)}"`);
    }
    if (closing.commitment) {
      closingParts.push(`Commitment: "${closing.commitment.slice(0, 100)}"`);
    }
  }

  // Build optional sections
  const optionalSections = [];

  if (summaryParts.length > 0) {
    optionalSections.push(`## Session Summary\n${summaryParts.join('\n')}`);
  }
  if (intentionParts.length > 0) {
    optionalSections.push(`## User's Intention\n${intentionParts.join('\n')}`);
  }
  if (closingParts.length > 0) {
    optionalSections.push(`## Closing Ritual\n${closingParts.join('\n')}`);
  }
  if (ctx.includeJournal) {
    optionalSections.push(`## Recent Journal Entries\n${buildJournalSummary(recentJournalEntries)}`);
  }
  if (ctx.includeHelperModal) {
    const helperSummary = buildHelperModalSummary(recentJournalEntries);
    if (helperSummary) {
      optionalSections.push(`## Helper Modal Usage\n${helperSummary}`);
    }
  }

  return `## Role
You are a supportive AI assistant integrated into an MDMA therapy session guide app. The user has completed their session and is in the integration and follow-up phase.

## Philosophy
- Treat the user as an informed adult
- Be warm, grounded, calm, and non-judgmental
- The days after a session can bring a range of emotions — support wherever they are
- Focus on integration: helping them make sense of what emerged and carry insights forward
- Keep responses clear and compassionate

${optionalSections.join('\n\n')}

## Guidelines for Responses
1. Support meaning-making:
   - Help them reflect on what came up during the session
   - Ask gentle questions about insights or shifts they've noticed
   - Reference their intention and commitments if relevant

2. Normalize the integration process:
   - Aftereffects are normal — emotional sensitivity, fatigue, clarity, or low mood
   - Remind them that integration happens over days and weeks, not all at once

3. Encourage follow-up activities:
   - If follow-up modules are available, gently suggest they explore them when ready
   - Support journaling and reflection

4. General approach:
   - Match their energy level
   - If they mention medical concerns, recommend professional help
   - You can reference session data but cannot modify the app

## Important Boundaries
- You cannot control the app or change settings
- You cannot provide medical advice
- If they need support, suggest professional resources`.trim();
}

// ─── Minimal (Non-Session) Prompt ──────────────────────────────────

/**
 * Build a minimal system prompt for non-session use.
 * Optionally enriched with session phase context.
 * @param {object} [sessionState] - Optional session state for phase-aware context
 * @returns {string} Minimal system prompt
 */
export function buildMinimalSystemPrompt(sessionState = null) {
  const phase = sessionState?.sessionPhase;
  const sessionProfile = sessionState?.sessionProfile || {};

  let contextLine = 'The user is not currently in an active session. They may be:\n- Preparing for a future session\n- Reviewing information about the app\n- Asking general questions about harm reduction\n- Processing a past experience';

  if (phase === 'intake') {
    contextLine = 'The user is currently completing their intake questionnaire before a session.';
    if (sessionProfile.primaryFocus) {
      contextLine += `\nTheir chosen focus area: ${sessionProfile.primaryFocus}`;
    }
    if (sessionProfile.holdingQuestion) {
      contextLine += `\nTheir intention: "${sessionProfile.holdingQuestion}"`;
    }
  } else if (phase === 'pre-session' || phase === 'substance-checklist') {
    contextLine = 'The user is preparing to begin their session.';
    if (sessionProfile.primaryFocus) {
      contextLine += `\nTheir chosen focus area: ${sessionProfile.primaryFocus}`;
    }
    if (sessionProfile.holdingQuestion) {
      contextLine += `\nTheir intention: "${sessionProfile.holdingQuestion}"`;
    }
  }

  return `## Role
You are a supportive AI assistant integrated into an MDMA therapy session guide app.

## Context
${contextLine}

## Guidelines
- Be warm, helpful, and non-judgmental
- Treat the user as an informed adult
- Provide accurate harm reduction information when asked
- Keep responses clear and concise
- If they have medical questions, recommend consulting a healthcare provider
- You cannot control or modify the app`.trim();
}

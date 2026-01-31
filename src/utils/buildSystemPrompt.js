/**
 * Build System Prompt
 * Dynamically constructs the AI system prompt with current session context
 */

/**
 * Build progress summary from completed modules and check-in responses
 */
function buildProgressSummary(completedModules, checkInResponses) {
  if (completedModules.length === 0 && checkInResponses.length === 0) {
    return 'No activities completed yet.';
  }

  const parts = [];

  // Completed modules
  if (completedModules.length > 0) {
    const moduleList = completedModules
      .slice(-5) // Last 5 modules
      .map((m) => `- ${m.title} (${m.phase})`)
      .join('\n');
    parts.push(`Completed modules:\n${moduleList}`);
  }

  // Check-in responses
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
    .slice(-3) // Last 3 entries
    .map((entry) => {
      const preview =
        entry.content.length > 100 ? entry.content.slice(0, 100) + '...' : entry.content;
      return `- "${preview}"`;
    })
    .join('\n');
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
    integration: 'Integration phase (effects beginning to subside)',
  };
  return descriptions[phase] || phase || 'Not in active session';
}

/**
 * Build the complete system prompt with session context
 * @param {object} sessionState - State from useSessionStore
 * @param {object} journalState - State from useJournalStore
 * @param {object} [contextSettings] - Optional settings to control what context is included
 * @returns {string} Complete system prompt
 */
export function buildSystemPrompt(sessionState, journalState, contextSettings = null) {
  // Default all context to enabled if no settings provided
  const ctx = contextSettings || {
    includeSessionStatus: true,
    includeTimeSinceIngestion: true,
    includeDosage: true,
    includeCurrentModule: true,
    includeProgress: true,
    includeJournal: true,
    includeIntention: true,
  };

  // Extract session data safely
  const sessionPhase = sessionState?.sessionPhase || 'not-started';
  const timeline = sessionState?.timeline || {};
  const substanceChecklist = sessionState?.substanceChecklist || {};
  const modules = sessionState?.modules || {};
  const comeUpCheckIn = sessionState?.comeUpCheckIn || {};
  const intake = sessionState?.intake || {};

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

  // Get completed modules
  const completedModules = (modules.items || []).filter((m) => m.status === 'completed');

  // Get recent journal entries
  const recentJournalEntries = journalState?.entries || [];

  // Build context sections
  const currentPhase = timeline.currentPhase;
  const dosage = substanceChecklist.plannedDosageMg;
  const dosageFeedback = substanceChecklist.dosageFeedback;
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
    contextParts.push(`- Reported Dosage: ${dosage ? `${dosage}mg (${dosageFeedback || 'unspecified intensity'})` : 'Not specified'}`);
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
    optionalSections.push(`## Session Progress Summary\n${buildProgressSummary(completedModules, checkInResponses)}`);
  }

  if (ctx.includeJournal) {
    optionalSections.push(`## Recent Journal Entries\n${buildJournalSummary(recentJournalEntries)}`);
  }

  if (ctx.includeIntention) {
    const intentionParts = [];
    if (intake.responses?.primaryFocus) {
      intentionParts.push(`Primary focus: ${intake.responses.primaryFocus}`);
    }
    if (intake.responses?.holdingQuestion) {
      intentionParts.push(`Holding question: "${intake.responses.holdingQuestion}"`);
    }
    if (intake.responses?.emotionalState) {
      intentionParts.push(`Starting emotional state: ${intake.responses.emotionalState}`);
    }
    if (intentionParts.length > 0) {
      optionalSections.push(`## User's Intention (from intake)\n${intentionParts.join('\n')}`);
    }
  }

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

## Important Boundaries
- You cannot control the app, skip modules, or change settings
- You cannot provide medical advice
- If they need emergency help, direct them to their emergency contact or professional services`.trim();
}

/**
 * Build a minimal system prompt for non-session use
 */
export function buildMinimalSystemPrompt() {
  return `## Role
You are a supportive AI assistant integrated into an MDMA therapy session guide app.

## Context
The user is not currently in an active session. They may be:
- Preparing for a future session
- Reviewing information about the app
- Asking general questions about harm reduction
- Processing a past experience

## Guidelines
- Be warm, helpful, and non-judgmental
- Treat the user as an informed adult
- Provide accurate harm reduction information when asked
- Keep responses clear and concise
- If they have medical questions, recommend consulting a healthcare provider
- You cannot control or modify the app`.trim();
}

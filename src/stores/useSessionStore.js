/**
 * Session Store
 * Central state management for session flow, intake, timeline, and modules
 * Refactored to support phase-based timeline with editable modules
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getModuleById } from '../content/modules';
import { TIMELINE_CONFIGS } from '../content/timeline/configurations';
import { useAppStore } from './useAppStore';
import { useJournalStore } from './useJournalStore';
import { precacheAudioForModule, precacheAudioForTimeline, precacheComposerAssets } from '../services/audioCacheService';

// Session store schema version — exported so useSessionHistoryStore stays in sync
export const SESSION_STORE_VERSION = 26;

// Helper to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

/**
 * Calculate recommended booster dose from initial dose
 * Returns dose rounded to nearest 5mg, clamped between 30-75mg
 */
export function calculateBoosterDose(initialDoseMg) {
  const raw = Number(initialDoseMg) * 0.5;
  const rounded = Math.round(raw / 5) * 5;
  return Math.max(30, Math.min(75, rounded));
}

/**
 * Determine if the booster prompt should be shown based on current state
 *
 * Timing logic: The booster prompt appears at whichever comes FIRST:
 * 1. 30 minutes after user reports "fully arrived"
 * 2. 90 minutes post-ingestion (floor)
 *
 * This accounts for individual variation while maintaining a sensible minimum.
 * Example: If user reports fully arrived at 30min, prompt appears at 60min.
 * If they report at 70min, prompt still appears at 90min (the floor).
 */
export function shouldShowBooster(booster, substanceChecklist, comeUpCheckIn) {
  if (!booster || !booster.considerBooster) return false;
  if (booster.status === 'taken' || booster.status === 'skipped' || booster.status === 'expired') return false;

  const ingestionTime = substanceChecklist?.ingestionTime;
  if (!ingestionTime) return false;

  const now = Date.now();
  const minutesSinceDose = (now - ingestionTime) / (1000 * 60);

  // Hard cutoff at 180 minutes - don't show at all
  if (minutesSinceDose >= 180) return false;

  // If snoozed, check if we've passed the next prompt time
  // (Allow showing past 150min so the "window closed" message can appear)
  if (booster.status === 'snoozed' && booster.nextPromptAt) {
    return now >= booster.nextPromptAt;
  }

  // Past 150 minutes without prior interaction - silently expire
  if (booster.status === 'pending' && minutesSinceDose >= 150) return false;

  // Calculate trigger time: 30 min after "fully arrived" OR 90 min floor, whichever is first
  let triggerMinutes = 90; // default floor

  if (comeUpCheckIn?.responses) {
    const fullyArrivedResponse = comeUpCheckIn.responses.find(
      r => r.response === 'fully-arrived'
    );
    if (fullyArrivedResponse) {
      // 30 minutes after they reported fully arrived
      const arrivedBasedTrigger = fullyArrivedResponse.minutesSinceIngestion + 30;
      triggerMinutes = Math.min(arrivedBasedTrigger, 90);
    }
  }

  // Initial trigger: dynamic based on fully-arrived timing or 90-min floor
  if (booster.status === 'pending' && minutesSinceDose < triggerMinutes) return false;

  return true;
}

export const useSessionStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // SESSION PHASE TRACKING
      // ============================================
      // 'not-started' | 'intake' | 'pre-session' | 'substance-checklist' | 'active' | 'paused' | 'completed'
      sessionPhase: 'not-started',

      // Unique session identifier — generated at intake start, used for archiving
      sessionId: null,

      // ============================================
      // SESSION PROFILE
      // ============================================
      // Single source of truth for every piece of user-entered data captured
      // during this session — regardless of which screen captured it. Replaces
      // the old intake.responses + substanceChecklist (user fields) +
      // preSubstanceActivity (intention artifacts) split. See
      // Technical-Spec-Docs-Temporary/Session-Profile-Spec-V1.md (and the V2
      // spec in ~/.claude/plans) for the full design.
      //
      // Lifecycle: born when a session starts, lives forever inside the session
      // (preserved across archive/restore), and is only destroyed when the
      // parent session is explicitly deleted via deleteSession().
      sessionProfile: {
        // Identity & context (Section A)
        experienceLevel: null,         // RESERVED — not currently read
        sessionMode: null,             // 'solo' | 'with-partner' | 'with-sitter' | 'group'
        hasPreparation: null,          // RESERVED

        // Intention & focus (Section B)
        primaryFocus: null,            // 'self-understanding' | 'healing' | 'relationship' | 'creativity' | 'open'
        relationshipType: null,
        holdingQuestion: '',           // The user's intention text
        // @deprecated emotionalState — removed from Opening Checklist (2026-04).
        //   Emotional check-in content now lives in the Opening Ritual. Field kept
        //   for archive-restore compatibility; no readers remain in the codebase.
        emotionalState: null,

        // Session preferences (Section C)
        guidanceLevel: null,           // 'full' | 'moderate' | 'minimal'
        activityPreferences: [],       // RESERVED
        considerBooster: null,         // 'yes' | 'no' | 'decide-later'
        promptFormat: null,            // RESERVED
        sessionDuration: null,         // '3-4h' | '4-6h' | '6+h'
        startTime: null,               // Optional scheduled timestamp

        // Safety & practicality (Section D)
        safeSpace: null,
        hasWaterSnacks: null,
        emergencyContact: null,        // RESERVED
        emergencyContactDetails: { name: '', phone: '', notes: '' },
        medications: { taking: false, details: '' },
        heartConditions: null,
        psychiatricHistory: null,
        contraindicatedMedications: null,  // RESERVED

        // Substance plan (from SubstanceChecklist screens 0-2)
        hasTested: null,               // RESERVED
        physicalPreparation: null,     // RESERVED
        lastMDMAUse: null,             // RESERVED
        hasSubstance: null,            // SubstanceChecklist Step 0
        hasTestedSubstance: null,      // SubstanceChecklist Step 1
        hasPreparedDosage: null,       // SubstanceChecklist Step 2 confirmation
        plannedDosageMg: null,         // SubstanceChecklist Step 2 input
        dosageFeedback: null,          // Derived from plannedDosageMg ('light'|'moderate'|'strong'|'heavy')

        // Intention artifacts (from PreSessionIntro intention sub-flow)
        touchstone: '',                // The word/phrase the user captured
        intentionJournalEntryId: null, // Pointer to the persisted intention journal entry
        focusJournalEntryId: null,     // Pointer to the persisted session focus entry
      },

      // ============================================
      // INTAKE QUESTIONNAIRE STATE
      // ============================================
      // Navigation + completion flags only. User answers live in sessionProfile.
      intake: {
        currentSection: 'A',
        currentQuestionIndex: 0,    // Track which question user is on
        isComplete: false,
        showSafetyWarnings: false,  // Derived flag, set by completeIntake()
        showMedicationWarning: false, // Derived flag, set by completeIntake()
      },

      // ============================================
      // SUBSTANCE CHECKLIST (Pre-Session)
      // ============================================
      // Ingestion event runtime state only. User answers live in sessionProfile.
      substanceChecklist: {
        hasTakenSubstance: false,    // boolean
        ingestionTime: null,         // Date - when user took substance
        ingestionTimeConfirmed: false,
      },

      // ============================================
      // PRE-SUBSTANCE ACTIVITY STATE
      // ============================================
      // Navigation + completion tracking only. Intention artifacts (touchstone,
      // journal entry IDs) live in sessionProfile.
      preSubstanceActivity: {
        // Sub-phase navigation within substance-checklist
        // 'part1' | 'pre-session-intro'
        substanceChecklistSubPhase: 'part1',
        // Track which activities have been completed
        completedActivities: [],    // ['intention', 'centering-breath']
      },

      // ============================================
      // TIMELINE STATE
      // ============================================
      timeline: {
        // Time configuration
        scheduledStartTime: null,     // From intake (optional)
        targetDuration: 240,          // Total session in minutes (default 4 hours)
        minDuration: 120,             // 2 hours minimum
        maxDuration: 480,             // 8 hours maximum

        // Current phase: 'come-up' | 'peak' | 'integration' | null
        currentPhase: null,

        // Phase configuration
        phases: {
          comeUp: {
            minDuration: 20,
            maxDuration: 60,
            allocatedDuration: 45,    // Max time for modules in this phase
            startedAt: null,
            endedAt: null,
            endedBy: null,            // 'user-checkin' | 'timeout'
          },
          peak: {
            estimatedDuration: 90,    // Soft estimate
            allocatedDuration: 90,
            startedAt: null,
            endedAt: null,
          },
          integration: {
            allocatedDuration: null,  // Calculated: targetDuration - comeUp - peak
            startedAt: null,
            endedAt: null,
          },
        },
      },

      // ============================================
      // MODULES STATE
      // ============================================
      modules: {
        // All modules in the timeline (editable in pre-session)
        items: [],
        // Currently active module instance ID
        currentModuleInstanceId: null,
        // Completed/skipped modules history
        history: [],
        // Flag to prevent auto-starting next module when in open space
        // Set to true when user is intentionally in open space (between modules)
        // Set to false when user explicitly clicks "Continue to Activity"
        inOpenSpace: false,
      },

      // ============================================
      // COME-UP CHECK-IN STATE
      // ============================================
      comeUpCheckIn: {
        isVisible: false,             // Is the check-in modal showing
        isMinimized: true,            // Is it in minimized state above tabs
        promptCount: 0,               // How many times we've asked
        lastPromptAt: null,
        responses: [],                // History of responses with timestamps
        currentResponse: null,        // 'waiting' | 'starting' | 'fully-arrived'
        introCompleted: true,         // No longer used for intro gating (PreSessionIntro handles pre-session)
        hasIndicatedFullyArrived: false, // User said fully-arrived but chose to remain in come-up
      },

      // ============================================
      // PEAK PHASE CHECK-IN STATE
      // ============================================
      peakCheckIn: {
        isVisible: false,               // Show the peak phase end-of-phase modal
      },

      // ============================================
      // BOOSTER DOSE STATE
      // ============================================
      booster: {
        considerBooster: false,       // From intake: user wants to consider a booster
        boosterPrepared: null,        // From substance checklist: booster is ready
        status: 'pending',            // 'pending' | 'prompted' | 'taken' | 'skipped' | 'snoozed' | 'expired'
        boosterTakenAt: null,         // Timestamp when booster was taken
        boosterDecisionAt: null,      // Timestamp when decision was made
        boosterDoseMg: null,          // User-edited booster dose in mg; null = use calculateBoosterDose()
        snoozeCount: 0,               // Number of times snoozed
        nextPromptAt: null,           // When to re-prompt after snooze
        checkInResponses: {           // Responses from booster check-in questions
          experienceQuality: null,
          physicalState: null,
          trajectory: null,
        },
        isModalVisible: false,        // Whether the booster modal is currently showing
        isMinimized: false,           // Whether the booster modal is minimized (bar above footer)
      },

      // ============================================
      // PHASE TRANSITIONS STATE
      // ============================================
      phaseTransitions: {
        // 'none' | 'come-up-to-peak' | 'peak-to-integration' | 'session-closing'
        activeTransition: null,
        // Tracks completion of transition steps
        transitionCompleted: false,
      },

      // ============================================
      // TRANSITION CAPTURES STATE
      // ============================================
      transitionCaptures: {
        // Peak Transition captures
        peak: {
          bodySensations: [],      // ['warmth', 'openness', ...]
          oneWord: '',             // 30 char max
          completedAt: null,
        },
        // Integration Transition captures
        integration: {
          intentionEdited: false,
          editedIntention: '',
          focusChanged: false,
          newFocus: null,
          newRelationshipType: null,  // If focus changed to relationship
          tailoredActivityFocus: null,
          tailoredActivityResponse: {},  // Object with activity-specific fields
          completedAt: null,
        },
        // Closing Ritual captures
        closing: {
          selfGratitude: '',
          futureMessage: '',
          commitment: '',
          completedAt: null,
        },
        // Protector Dialogue captures (Part 1 → Part 2 data contract)
        protectorDialogue: {
          protectorName: '',          // Free-text user-written name
          protectorDescription: '',   // Free-text description of the protector
          feelToward: { initial: null, recheck: null }, // 'curious' | 'warm' | 'open' | 'frustrated' | 'afraid' | 'numb'
          bodyLocation: '',           // Free text
          protectorMessage: '',       // Free text
          completedAt: null,
        },
        // Stay With It captures (check-in response)
        stayWithIt: {
          checkInResponse: null,    // 'lighter' | 'still-processing' | 'heavy' | 'numb' | 'activated'
          completedAt: null,
        },
        // Values Compass captures (ACT Matrix quadrant data)
        valuesCompass: {
          quadrants: null,    // { q1: [{id, text, x, y}], q2: [...], q3: [...], q4: [...] }
          completedAt: null,
          journalTowardMove: null,    // journal-e text (toward move commitment)
          journalMessageFromHere: null, // journal-h text (message to self)
        },
        // Felt Sense captures (shift check-in response)
        feltSense: {
          shiftCheckIn: null,   // 'softened' | 'changed-unclear' | 'stayed-same' | 'surprised' | 'lost-track' | 'not-sure'
          completedAt: null,
        },
        // The Deep Dive captures (Part 1 → Part 2 data contract)
        theDescent: {
          mode: null,              // 'solo' | 'couple'
          quickCapture: '',        // raw post-meditation notes
          checkInResponse: null,   // 'softened' | 'hurt' | 'clarity' | 'stuck' | 'unsure'
          surfaceReaction: '',
          primaryEmotion: '',
          unsaidMessage: '',
          completedAt: null,
        },
        // The Cycle captures (Part 2 → cycle mapping data)
        theCycle: {
          mode: null,              // 'solo' | 'couple'
          myPosition: null,        // 'pursuer' | 'withdrawer'
          friction: '',            // the recurring tension
          myMoveId: null,          // single move ID
          myMoveMotivation: '',    // "what are you hoping will happen"
          yourUnderneath: '',      // primary emotion underneath your move
          theirMoveId: null,       // solo: guessed move
          theirUnderneath: '',     // solo: imagined emotion
          partnerMoveId: null,     // couple: partner's actual move
          partnerUnderneath: '',   // couple: partner's actual emotion
          cycleName: '',
          meditationCapture: '',
          checkInResponse: null,   // 'softer'|'clearer'|'heavy'|'ready'|'processing'
          journalSurprise: '',
          journalOtherSide: '',
          journalStepOut: '',      // replaces closingIntention
          journeyReflection: '',
          completedAt: null,
        },
        // Mapping the Territory captures (pre-session educational module)
        mappingTerritory: {
          copingPattern: null,        // screen 7 choice
          approachStyle: null,        // screen 13 choice
          askingForAttention: '',     // screen 10 journal
          wordToSelf: '',             // screen 16 journal
          completedAt: null,
        },
        // Pendulation captures (Somatic Experiencing)
        pendulation: {
          checkpoint1Response: null,    // 'settled'|'move'|'activated'|'frozen'|'unsure'
          checkpoint2Response: null,    // 'released'|'processing'|'frozen'|'shaky'|null
          sectionsCompleted: [],        // ['a','b','c','d']
          completionSignals: [],        // multiSelect IDs from debrief
          dischargeCompletion: null,    // B-path choice
          thawExperience: null,         // C-path choice
          completedAt: null,
        },
        // Shaking the Tree captures (somatic movement)
        shakingTheTree: {
          bodySensations: [],           // Selected sensation IDs from check-in
          responseKey: null,            // Which tailored response was shown
          completedAt: null,
        },
      },

      // ============================================
      // TRANSITION DATA (TransitionModule system)
      // ============================================
      // All user-entered data from the four transitions (Opening Ritual, Peak,
      // Peak-to-Integration, Closing Ritual). Separate from `transitionCaptures`
      // which holds module-level captures (protectorDialogue, valuesCompass, etc.).
      transitionData: {
        // Body check-in selections, written immediately on every toggle
        somaticCheckIns: {
          opening: [],
          peak: [],
          integration: [],
          closing: [],
        },

        // Touchstones
        openingTouchstone: null,
        closingTouchstone: null,
        touchstoneArcReflection: null,

        // Peak transition
        oneWord: null,

        // Intention additions (preserved separately per transition)
        intentionAdditions: {
          opening: null,
          integration: null,
        },

        // Focus (peak-to-integration)
        focusChanged: false,
        newFocus: null,
        newRelationshipType: null,

        // Tailored activity (peak-to-integration)
        tailoredActivityFocus: null,
        tailoredActivityResponse: {},

        // Closing ritual captures
        selfGratitude: null,
        futureMessage: null,
        commitment: null,

        // Completion timestamps
        completedAt: {
          opening: null,
          peak: null,
          integration: null,
          closing: null,
        },

        // Persisted navigation state — allows mid-transition app closes to resume
        // where the user left off. Cleared on transition completion.
        activeNavigation: {
          transitionId: null,         // null when no transition active
          currentSectionIndex: 0,
          visitedSections: [],
          routeStack: [],
          sectionHistory: [],         // back-nav path; pops on Back
          screenIndex: 0,
          responses: {},
          selectorValues: {},
          selectorJournals: {},
          choiceValues: {},
          blockReadiness: {},         // custom block gating (§7.2)
        },
      },

      // ============================================
      // LIFE GRAPH STATE
      // ============================================
      lifeGraph: {
        milestones: [],           // Array of { id, label, rating, note }
        graphGenerated: false,
        journalEntryId: null,
      },

      // ============================================
      // CLOSING CHECK-IN STATE
      // ============================================
      closingCheckIn: {
        isVisible: false,           // Show the closing check-in modal
      },

      // ============================================
      // SESSION COMPLETION STATE
      // ============================================
      session: {
        closedAt: null,                // Timestamp when session was closed
        finalDurationSeconds: null,    // Final session duration in seconds
        dataExportedAt: null,          // Timestamp when session data was exported
        sessionNumber: null,           // Locked-in ordinal (e.g. 3 = third completed session)
      },

      // ============================================
      // FOLLOW-UP SESSION STATE
      // ============================================
      followUp: {
        // Unlock times calculated from session.closedAt
        unlockTimes: {
          checkIn: null,      // closedAt + 8 hours
          revisit: null,      // closedAt + 8 hours
          integration: null,  // closedAt + 8 hours
          valuesCompassFollowUp: null, // closedAt + 8 hours (only if VC completed)
        },
        modules: {
          checkIn: {
            status: 'locked', // 'locked' | 'available' | 'completed'
            completedAt: null,
            feeling: null,    // 'settled' | 'processing' | 'low' | 'tender' | 'energized' | 'mixed'
            bodyFeeling: null, // 'relaxed' | 'heavy' | 'tense' | 'normal'
            note: null,
          },
          revisit: {
            status: 'locked',
            completedAt: null,
            reflection: null,
          },
          integration: {
            status: 'locked',
            completedAt: null,
            emerged: null,
            commitmentStatus: null,  // 'following' | 'trying' | 'not-started' | 'reconsidered' | 'forgot'
            commitmentResponse: null,
          },
          valuesCompassFollowUp: {
            status: 'locked',
            completedAt: null,
            matrixEdited: false,
            editedQuadrants: null,
            matrixRevisit: null,
            noticingAway: null,
            noticingToward: null,
            stuckLoopCheckin: null,
            towardMoveStatus: { selection: null, response: null },
            timeSpent: { selection: null, response: null },
            messageResponse: null,
            currentScreen: null,
          },
        },
      },

      // Active follow-up module (renders in Active tab)
      activeFollowUpModule: null, // 'checkIn' | 'revisit' | 'integration' | 'valuesCompassFollowUp' | null

      // Active pre-session module (renders in Active tab before session starts)
      activePreSessionModule: null, // instanceId | null

      // ============================================
      // MEDITATION PLAYBACK STATE
      // ============================================
      meditationPlayback: {
        moduleInstanceId: null,       // Which module is playing
        isPlaying: false,             // Is meditation currently running
        hasStarted: false,            // Has user clicked Begin
      },

      // ============================================
      // INTAKE ACTIONS
      // ============================================

      startIntake: () => {
        set({
          sessionPhase: 'intake',
          sessionId: get().sessionId || generateId(),
          intake: { ...get().intake, currentSection: 'A' },
        });
      },

      // Universal user-data writer. Replaces updateIntakeResponse,
      // updateSubstanceChecklist (for the moved fields), setTouchstone,
      // setIntentionJournalEntryId, and setFocusJournalEntryId. Auto-derives
      // dosageFeedback whenever plannedDosageMg is written, mirroring the
      // logic that previously lived in updateSubstanceChecklist.
      updateSessionProfile: (field, value) => {
        const state = get();
        const updates = { [field]: value };

        // Auto-derive dosageFeedback when planned dose is written
        if (field === 'plannedDosageMg' && value !== null) {
          const mg = Number(value);
          let feedback = null;
          if (mg > 0 && mg <= 75) feedback = 'light';
          else if (mg <= 125) feedback = 'moderate';
          else if (mg <= 150) feedback = 'strong';
          else if (mg > 150) feedback = 'heavy';
          updates.dosageFeedback = feedback;
        }

        set({
          sessionProfile: {
            ...state.sessionProfile,
            ...updates,
          },
        });
      },

      setIntakeSection: (section) => {
        set({
          intake: { ...get().intake, currentSection: section },
        });
      },

      setIntakeQuestionIndex: (index) => {
        set({
          intake: { ...get().intake, currentQuestionIndex: index },
        });
      },

      completeIntake: () => {
        const state = get();
        const profile = state.sessionProfile;

        // Check for safety warnings
        const showSafetyWarnings =
          profile.safeSpace === 'no' ||
          profile.heartConditions === 'yes' ||
          profile.psychiatricHistory === 'yes';

        const showMedicationWarning = profile.medications?.taking;

        // Calculate target duration from intake
        let targetDuration = 240; // default 4 hours
        if (profile.sessionDuration === '3-4h') targetDuration = 210;
        else if (profile.sessionDuration === '4-6h') targetDuration = 300;
        else if (profile.sessionDuration === '6+h') targetDuration = 420;

        // Determine if user wants to consider a booster
        const considerBooster = profile.considerBooster === 'yes' || profile.considerBooster === 'decide-later';

        set({
          intake: {
            ...state.intake,
            isComplete: true,
            showSafetyWarnings,
            showMedicationWarning,
          },
          sessionPhase: 'pre-session',
          timeline: {
            ...state.timeline,
            targetDuration,
            scheduledStartTime: profile.startTime,
          },
          booster: {
            ...state.booster,
            considerBooster,
          },
        });

        // Generate timeline from session profile
        get().generateTimelineFromIntake();
      },

      // ============================================
      // TIMELINE GENERATION
      // ============================================

      generateTimelineFromIntake: () => {
        const state = get();
        const profile = state.sessionProfile;

        // Look up timeline configuration based on session profile
        const focus = profile.primaryFocus || 'open';
        const guidance = profile.guidanceLevel || 'full';
        const config = guidance === 'minimal'
          ? TIMELINE_CONFIGS.minimal
          : TIMELINE_CONFIGS[focus]?.[guidance] || TIMELINE_CONFIGS.open.full;

        // Build module instances from configuration
        const linkedGroupIds = {};
        let modules = [];
        const phaseMap = [
          { key: 'preSession', phase: 'pre-session' },
          { key: 'comeUp', phase: 'come-up' },
          { key: 'peak', phase: 'peak' },
          { key: 'integration', phase: 'integration' },
        ];

        for (const { key, phase } of phaseMap) {
          const specs = config[key] || [];
          specs.forEach((spec, index) => {
            const lib = getModuleById(spec.libraryId);
            const instance = {
              instanceId: generateId(),
              libraryId: spec.libraryId,
              phase,
              title: lib?.title || spec.libraryId,
              duration: lib?.defaultDuration || 10,
              status: 'upcoming',
              order: index,
              content: lib?.content || {},
              startedAt: null,
              completedAt: null,
            };

            // Linked modules (e.g., The Descent P1 / The Cycle P2)
            if (spec.linkedGroup) {
              if (!linkedGroupIds[spec.linkedGroup]) {
                linkedGroupIds[spec.linkedGroup] = generateId();
              }
              instance.linkedGroupId = linkedGroupIds[spec.linkedGroup];
              instance.linkedRole = spec.linkedRole;
            }

            modules.push(instance);
          });
        }

        // Booster check-in — insert after first peak module if applicable
        const considerBooster = profile.considerBooster === 'yes' || profile.considerBooster === 'decide-later';
        if (considerBooster) {
          modules = modules.map(m => {
            if (m.phase === 'peak' && m.order >= 1) {
              return { ...m, order: m.order + 1 };
            }
            return m;
          });

          modules.push({
            instanceId: generateId(),
            libraryId: 'booster-consideration',
            phase: 'peak',
            title: 'Booster Check-In',
            duration: 5,
            status: 'upcoming',
            order: 1,
            content: getModuleById('booster-consideration')?.content || {},
            isBoosterModule: true,
            startedAt: null,
            completedAt: null,
          });
        }

        // Phase durations
        const comeUpDuration = 45;
        const peakDuration = 90;
        const adjustedIntegrationDuration = state.timeline.targetDuration - comeUpDuration - peakDuration;

        set({
          modules: {
            ...state.modules,
            items: modules,
          },
          timeline: {
            ...state.timeline,
            phases: {
              comeUp: { ...state.timeline.phases.comeUp, allocatedDuration: comeUpDuration },
              peak: { ...state.timeline.phases.peak, allocatedDuration: peakDuration },
              integration: { ...state.timeline.phases.integration, allocatedDuration: adjustedIntegrationDuration },
            },
          },
        });

        // Precache audio for all modules in the generated timeline (non-blocking)
        precacheAudioForTimeline(modules);
        precacheComposerAssets();
      },

      // ============================================
      // MODULE EDITING (Pre-Session)
      // ============================================

      addModule: (libraryId, phase, position = null) => {
        const state = get();
        const libraryModule = getModuleById(libraryId);
        if (!libraryModule) return { success: false, error: 'Module not found' };

        // Prevent duplicate booster modules
        if (libraryId === 'booster-consideration') {
          const existingBooster = state.modules.items.find(m => m.libraryId === 'booster-consideration');
          if (existingBooster) {
            return { success: false, error: 'A Booster Check-In is already in your timeline.' };
          }
        }

        // ============================================
        // LINKED PARENT MODULES (e.g., Protector Dialogue)
        // Adding the parent creates both Part 1 and Part 2 as separate instances.
        // ============================================
        if (libraryModule.isLinkedParent && libraryModule.linkedParts) {
          const part1Lib = getModuleById(libraryModule.linkedParts[0].id);
          const part2Lib = getModuleById(libraryModule.linkedParts[1].id);
          if (!part1Lib || !part2Lib) return { success: false, error: 'Linked module parts not found' };

          const linkedGroupId = generateId();
          const part1Phase = phase;
          // Part 2 goes to integration unless both are in integration
          const part2Phase = (phase === 'integration') ? 'integration' : 'integration';

          // Calculate Part 1 order
          const part1PhaseModules = state.modules.items.filter(m => m.phase === part1Phase);
          const part1Order = position !== null ? position : part1PhaseModules.length;

          // Shift existing modules in Part 1's phase
          let updatedItems = state.modules.items.map(m => {
            if (m.phase === part1Phase && m.order >= part1Order) {
              return { ...m, order: m.order + 1 };
            }
            return m;
          });

          // Calculate Part 2 order
          let part2Order;
          if (part2Phase === part1Phase) {
            // Same phase (both in integration): Part 2 goes right after Part 1
            part2Order = part1Order + 1;
            updatedItems = updatedItems.map(m => {
              if (m.phase === part2Phase && m.order >= part2Order) {
                return { ...m, order: m.order + 1 };
              }
              return m;
            });
          } else {
            // Different phases: Part 2 goes at start of integration
            part2Order = 0;
            updatedItems = updatedItems.map(m => {
              if (m.phase === part2Phase && m.order >= part2Order) {
                return { ...m, order: m.order + 1 };
              }
              return m;
            });
          }

          const newPart1 = {
            instanceId: generateId(),
            libraryId: part1Lib.id,
            phase: part1Phase,
            title: libraryModule.linkedParts[0].title,
            duration: part1Lib.defaultDuration,
            status: 'upcoming',
            order: part1Order,
            content: part1Lib.content,
            linkedGroupId,
            linkedRole: 'part1',
            startedAt: null,
            completedAt: null,
          };

          const newPart2 = {
            instanceId: generateId(),
            libraryId: part2Lib.id,
            phase: part2Phase,
            title: libraryModule.linkedParts[1].title,
            duration: part2Lib.defaultDuration,
            status: 'upcoming',
            order: part2Order,
            content: part2Lib.content,
            linkedGroupId,
            linkedRole: 'part2',
            startedAt: null,
            completedAt: null,
          };

          set({
            modules: {
              ...state.modules,
              items: [...updatedItems, newPart1, newPart2],
            },
          });

          // Precache audio for parts that have meditation content
          if (part1Lib.meditationId) precacheAudioForModule(part1Lib.id);
          if (part2Lib.meditationId) precacheAudioForModule(part2Lib.id);

          return { success: true, module: newPart1 };
        }

        // ============================================
        // STANDARD MODULE (non-linked)
        // ============================================

        // Get modules in this phase to determine order
        const phaseModules = state.modules.items.filter((m) => m.phase === phase);

        // For booster modules, place after the first peak module as a visual indicator.
        // The actual trigger is time-based (90 min from ingestion), independent of position.
        let newOrder;
        if (libraryId === 'booster-consideration' && position === null) {
          newOrder = Math.min(1, phaseModules.length);
        } else {
          newOrder = position !== null ? position : phaseModules.length;
        }

        // Reorder existing modules if inserting
        const updatedItems = state.modules.items.map((m) => {
          if (m.phase === phase && m.order >= newOrder) {
            return { ...m, order: m.order + 1 };
          }
          return m;
        });

        const newModule = {
          instanceId: generateId(),
          libraryId,
          phase,
          title: libraryModule.title,
          duration: libraryModule.defaultDuration,
          status: 'upcoming',
          order: newOrder,
          content: libraryModule.content,
          isBoosterModule: libraryModule.isBoosterModule || false,
          startedAt: null,
          completedAt: null,
        };

        const updates = {
          modules: {
            ...state.modules,
            items: [...updatedItems, newModule],
          },
        };

        // If adding a booster module, also enable considerBooster
        if (libraryId === 'booster-consideration') {
          updates.booster = {
            ...state.booster,
            considerBooster: true,
          };
        }

        set(updates);

        // Precache audio for the newly added module (non-blocking)
        precacheAudioForModule(libraryId);

        return { success: true, module: newModule };
      },

      /**
       * Insert a module at the active position during a live session.
       * Creates a new module instance, places it at the current phase's active position,
       * pushes the current module and all subsequent modules down, and navigates to active tab.
       * Reusable by any feature that needs to inject a module mid-session.
       *
       * @param {string} libraryId - Module library ID from library.js
       * @returns {{ success: boolean, instanceId?: string, error?: string }}
       */
      insertAtActive: (libraryId) => {
        const state = get();
        // Determine which phase to insert into:
        //   - During an active session, use timeline.currentPhase (come-up,
        //     peak, or integration).
        //   - After session completion, the timeline phase is null, but the
        //     user is in the post-session 'completed' phase where modules
        //     live under phase: 'follow-up'. Treat that as the target.
        // This lets the helper modal insert activities into the follow-up
        // timeline when the user navigates a triage tree post-session.
        const currentPhase =
          state.timeline.currentPhase
          || (state.sessionPhase === 'completed' ? 'follow-up' : null);
        if (!currentPhase) return { success: false, error: 'No active phase' };

        const libraryModule = getModuleById(libraryId);
        if (!libraryModule) return { success: false, error: 'Module not found' };

        // Handle linked parent modules (e.g., protector-dialogue creates P1 + P2)
        if (libraryModule.isLinkedParent && libraryModule.linkedParts) {
          const part1Lib = getModuleById(libraryModule.linkedParts[0].id);
          const part2Lib = getModuleById(libraryModule.linkedParts[1].id);
          if (!part1Lib || !part2Lib) return { success: false, error: 'Linked module parts not found' };

          const linkedGroupId = generateId();
          const currentModuleId = state.modules.currentModuleInstanceId;

          // Part 1 inserts at order 0 in current phase; Part 2 at start of
          // integration (or follow-up, if we're in the post-session phase
          // — Part 2 should stay in the same conceptual segment as Part 1).
          const part2Phase = currentPhase === 'follow-up' ? 'follow-up' : 'integration';

          // Shift all modules in current phase: increment order by 1
          let updatedItems = state.modules.items.map(m => {
            if (m.phase === currentPhase) {
              const updates = { ...m, order: m.order + 1 };
              if (m.instanceId === currentModuleId && m.status === 'active') {
                updates.status = 'upcoming';
                updates.startedAt = null;
              }
              return updates;
            }
            return m;
          });

          // Shift integration modules for Part 2 (if different phase)
          if (part2Phase !== currentPhase) {
            updatedItems = updatedItems.map(m => {
              if (m.phase === part2Phase && m.order >= 0) {
                return { ...m, order: m.order + 1 };
              }
              return m;
            });
          }

          const newPart1 = {
            instanceId: generateId(),
            libraryId: part1Lib.id,
            phase: currentPhase,
            title: libraryModule.linkedParts[0].title,
            duration: part1Lib.defaultDuration,
            status: 'upcoming',
            order: 0,
            content: part1Lib.content,
            linkedGroupId,
            linkedRole: 'part1',
            startedAt: null,
            completedAt: null,
          };

          const newPart2 = {
            instanceId: generateId(),
            libraryId: part2Lib.id,
            phase: part2Phase,
            title: libraryModule.linkedParts[1].title,
            duration: part2Lib.defaultDuration,
            status: 'upcoming',
            order: 0,
            content: part2Lib.content,
            linkedGroupId,
            linkedRole: 'part2',
            startedAt: null,
            completedAt: null,
          };

          set({
            modules: {
              ...state.modules,
              items: [...updatedItems, newPart1, newPart2],
              currentModuleInstanceId: null,
              inOpenSpace: false,
            },
          });

          if (part1Lib.meditationId) precacheAudioForModule(part1Lib.id);
          if (part2Lib.meditationId) precacheAudioForModule(part2Lib.id);

          useAppStore.getState().setCurrentTab('active');
          return { success: true, instanceId: newPart1.instanceId };
        }

        // Standard (non-linked) module
        const currentModuleId = state.modules.currentModuleInstanceId;

        // Shift all modules in the current phase: increment their order by 1
        const updatedItems = state.modules.items.map((m) => {
          if (m.phase === currentPhase) {
            const updates = { ...m, order: m.order + 1 };
            // If this was the active module, reset it to upcoming
            if (m.instanceId === currentModuleId && m.status === 'active') {
              updates.status = 'upcoming';
              updates.startedAt = null;
            }
            return updates;
          }
          return m;
        });

        const newInstanceId = generateId();
        const newModule = {
          instanceId: newInstanceId,
          libraryId,
          phase: currentPhase,
          title: libraryModule.title,
          duration: libraryModule.defaultDuration,
          status: 'upcoming',
          order: 0,
          content: libraryModule.content || {},
          startedAt: null,
          completedAt: null,
        };

        set({
          modules: {
            ...state.modules,
            items: [...updatedItems, newModule],
            currentModuleInstanceId: null,
            inOpenSpace: false,
          },
        });

        // Navigate to active tab
        useAppStore.getState().setCurrentTab('active');

        // Precache audio (non-blocking)
        precacheAudioForModule(libraryId);

        return { success: true, instanceId: newInstanceId };
      },

      removeModule: (instanceId) => {
        const state = get();
        const moduleToRemove = state.modules.items.find((m) => m.instanceId === instanceId);
        if (!moduleToRemove) return;

        // Determine which instances to remove (cascade for linked modules)
        let idsToRemove = [instanceId];
        if (moduleToRemove.linkedGroupId) {
          idsToRemove = state.modules.items
            .filter(m => m.linkedGroupId === moduleToRemove.linkedGroupId)
            .map(m => m.instanceId);
        }

        // Remove all targeted modules
        let updatedItems = state.modules.items.filter(m => !idsToRemove.includes(m.instanceId));

        // Reorder each affected phase
        const affectedPhases = new Set(
          state.modules.items
            .filter(m => idsToRemove.includes(m.instanceId))
            .map(m => m.phase)
        );

        affectedPhases.forEach(phase => {
          const phaseItems = updatedItems
            .filter(m => m.phase === phase)
            .sort((a, b) => a.order - b.order);
          phaseItems.forEach((m, idx) => {
            m.order = idx;
          });
        });

        const updates = {
          modules: {
            ...state.modules,
            items: updatedItems,
          },
        };

        // If removing the booster module, disable considerBooster
        if (moduleToRemove.libraryId === 'booster-consideration') {
          updates.booster = {
            ...state.booster,
            considerBooster: false,
          };
        }

        set(updates);
      },

      reorderModule: (instanceId, newOrder) => {
        const state = get();
        const module = state.modules.items.find((m) => m.instanceId === instanceId);
        if (!module) return;

        const oldOrder = module.order;
        const phase = module.phase;

        const updatedItems = state.modules.items.map((m) => {
          if (m.phase !== phase) return m;
          if (m.instanceId === instanceId) {
            return { ...m, order: newOrder };
          }
          // Shift other modules
          if (newOrder < oldOrder) {
            // Moving up: shift modules in between down
            if (m.order >= newOrder && m.order < oldOrder) {
              return { ...m, order: m.order + 1 };
            }
          } else {
            // Moving down: shift modules in between up
            if (m.order > oldOrder && m.order <= newOrder) {
              return { ...m, order: m.order - 1 };
            }
          }
          return m;
        });

        set({
          modules: {
            ...state.modules,
            items: updatedItems,
          },
        });
      },

      /**
       * Swap module order with an adjacent module (for up/down reordering UI)
       * This is a simple swap between two adjacent positions
       */
      swapModuleOrder: (instanceId, newOrder) => {
        const state = get();
        const module = state.modules.items.find((m) => m.instanceId === instanceId);
        if (!module) return;

        const phase = module.phase;
        const oldOrder = module.order;

        // Find the module at the target position
        const targetModule = state.modules.items.find(
          (m) => m.phase === phase && m.order === newOrder
        );

        if (!targetModule) return;

        // Swap the orders
        const updatedItems = state.modules.items.map((m) => {
          if (m.instanceId === instanceId) {
            return { ...m, order: newOrder };
          }
          if (m.instanceId === targetModule.instanceId) {
            return { ...m, order: oldOrder };
          }
          return m;
        });

        set({
          modules: {
            ...state.modules,
            items: updatedItems,
          },
        });
      },

      updateModuleDuration: (instanceId, duration) => {
        const state = get();
        set({
          modules: {
            ...state.modules,
            items: state.modules.items.map((m) =>
              m.instanceId === instanceId ? { ...m, duration } : m
            ),
          },
        });
      },

      // ============================================
      // SUBSTANCE CHECKLIST ACTIONS
      // ============================================

      // updateSubstanceChecklist removed in v24 — the moved fields
      // (hasSubstance, hasTestedSubstance, hasPreparedDosage, plannedDosageMg,
      // dosageFeedback) are now written via updateSessionProfile, and the
      // remaining runtime fields (hasTakenSubstance, ingestionTime,
      // ingestionTimeConfirmed) are written by recordIngestionTime and
      // confirmIngestionTime below.

      recordIngestionTime: (time = Date.now()) => {
        set({
          substanceChecklist: {
            ...get().substanceChecklist,
            hasTakenSubstance: true,
            ingestionTime: time,
          },
        });
      },

      confirmIngestionTime: () => {
        set({
          substanceChecklist: {
            ...get().substanceChecklist,
            ingestionTimeConfirmed: true,
          },
        });
      },

      startSubstanceChecklist: () => {
        set({ sessionPhase: 'substance-checklist' });
      },

      // ============================================
      // PRE-SUBSTANCE ACTIVITY ACTIONS
      // ============================================

      setSubstanceChecklistSubPhase: (subPhase) => {
        set({
          preSubstanceActivity: {
            ...get().preSubstanceActivity,
            substanceChecklistSubPhase: subPhase,
          },
        });
      },

      completePreSubstanceActivity: (activityName) => {
        const state = get();
        const completed = state.preSubstanceActivity.completedActivities;
        if (!completed.includes(activityName)) {
          set({
            preSubstanceActivity: {
              ...state.preSubstanceActivity,
              completedActivities: [...completed, activityName],
            },
          });
        }
      },

      // setTouchstone, setIntentionJournalEntryId, and setFocusJournalEntryId
      // were removed in v24 — call sites now use updateSessionProfile directly:
      //   updateSessionProfile('touchstone', phrase)
      //   updateSessionProfile('intentionJournalEntryId', id)
      //   updateSessionProfile('focusJournalEntryId', id)

      // ── Life Graph Actions ──────────────────────────────────────

      addLifeGraphMilestone: (milestone) => {
        const state = get();
        set({
          lifeGraph: {
            ...state.lifeGraph,
            milestones: [...state.lifeGraph.milestones, { ...milestone, id: generateId() }],
          },
        });
      },

      updateLifeGraphMilestone: (id, updates) => {
        const state = get();
        set({
          lifeGraph: {
            ...state.lifeGraph,
            milestones: state.lifeGraph.milestones.map((m) =>
              m.id === id ? { ...m, ...updates } : m
            ),
          },
        });
      },

      removeLifeGraphMilestone: (id) => {
        const state = get();
        set({
          lifeGraph: {
            ...state.lifeGraph,
            milestones: state.lifeGraph.milestones.filter((m) => m.id !== id),
          },
        });
      },

      setLifeGraphGenerated: (journalEntryId) => {
        set({
          lifeGraph: {
            ...get().lifeGraph,
            graphGenerated: true,
            journalEntryId,
          },
        });
      },

      // setFocusJournalEntryId removed in v24 — see comment above
      // setIntentionJournalEntryId for the migration pattern.

      // ============================================
      // BOOSTER DOSE ACTIONS
      // ============================================

      updateBoosterPrepared: (value) => {
        const state = get();
        if (value === 'decided-not-to') {
          set({
            booster: {
              ...state.booster,
              considerBooster: false,
              boosterPrepared: false,
            },
          });
        } else {
          set({
            booster: {
              ...state.booster,
              boosterPrepared: value === 'yes',
            },
          });
        }
      },

      showBoosterModal: () => {
        const state = get();
        // Pause active module timer when booster modal appears
        if (state.meditationPlayback.isPlaying) {
          get().pauseMeditationPlayback();
        }
        // Switch to Active tab so the modal is visible
        useAppStore.getState().setCurrentTab('active');
        // Send notification if app is not focused (user has phone locked or in background)
        const { notificationsEnabled } = useAppStore.getState().preferences;
        if (notificationsEnabled && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            new Notification('Booster Check-In', {
              body: 'It\'s been about 90 minutes. Would you like to consider a supplemental dose?',
              tag: 'booster-check-in',
              renotify: true,
            });
          } catch (_e) {
            // Notification may fail in some contexts; non-critical
          }
        }
        set({
          booster: {
            ...get().booster,
            isModalVisible: true,
            isMinimized: false,
            status: 'prompted',
          },
        });
      },

      hideBoosterModal: () => {
        const state = get();
        set({
          booster: {
            ...state.booster,
            isModalVisible: false,
          },
        });
        // Resume module timer when modal is dismissed
        if (state.meditationPlayback.hasStarted && !state.meditationPlayback.isPlaying) {
          get().resumeMeditationPlayback();
        }
      },

      recordBoosterCheckIn: (field, value) => {
        const state = get();
        set({
          booster: {
            ...state.booster,
            checkInResponses: {
              ...state.booster.checkInResponses,
              [field]: value,
            },
          },
        });
      },

      setBoosterDose: (doseMg) => {
        const state = get();
        set({
          booster: {
            ...state.booster,
            boosterDoseMg: doseMg,
          },
        });
      },

      takeBooster: (timestamp = Date.now()) => {
        const state = get();
        // Resolve final dose: user-edited or calculated from initial
        const finalDose = state.booster.boosterDoseMg
          ?? calculateBoosterDose(state.sessionProfile.plannedDosageMg);
        set({
          booster: {
            ...state.booster,
            status: 'taken',
            boosterTakenAt: timestamp,
            boosterDecisionAt: Date.now(),
            boosterDoseMg: finalDose,
            // Keep modal visible — the confirmation page (step 5b) still needs to show.
            // hideBoosterModal() handles dismissal + playback resume when user clicks Continue.
          },
        });
      },

      confirmBoosterTime: (adjustedTime) => {
        if (adjustedTime) {
          set({
            booster: {
              ...get().booster,
              boosterTakenAt: adjustedTime,
            },
          });
        }
      },

      skipBooster: () => {
        const state = get();

        // Remove the booster module from the timeline
        const boosterIdx = state.modules.items.findIndex((m) => m.isBoosterModule);
        let updatedItems = state.modules.items;
        if (boosterIdx !== -1) {
          const boosterPhase = state.modules.items[boosterIdx].phase;
          updatedItems = state.modules.items.filter((_, i) => i !== boosterIdx);
          // Reorder remaining modules in that phase
          updatedItems
            .filter((m) => m.phase === boosterPhase)
            .sort((a, b) => a.order - b.order)
            .forEach((m, idx) => { m.order = idx; });
        }

        set({
          booster: {
            ...state.booster,
            status: 'skipped',
            boosterDecisionAt: Date.now(),
            isModalVisible: false,
          },
          modules: {
            ...state.modules,
            items: updatedItems,
          },
        });
        // Resume module timer
        if (state.meditationPlayback.hasStarted && !state.meditationPlayback.isPlaying) {
          get().resumeMeditationPlayback();
        }
      },

      // Silent snooze: closing the modal without an explicit decision.
      // Keeps the minimized bar visible so the user can re-open if they want.
      // Re-prompts automatically after 10 minutes.
      snoozeBooster: () => {
        const state = get();
        const newSnoozeCount = state.booster.snoozeCount + 1;
        const nextPromptAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

        set({
          booster: {
            ...state.booster,
            status: 'snoozed',
            snoozeCount: newSnoozeCount,
            nextPromptAt,
            isModalVisible: true,
            isMinimized: true,
          },
        });
        // Resume module timer
        if (state.meditationPlayback.hasStarted && !state.meditationPlayback.isPlaying) {
          get().resumeMeditationPlayback();
        }
      },

      // Active snooze: user explicitly clicked "Ask me again in 10 minutes".
      // Hides the bar entirely; the modal will fade back in after 10 minutes.
      snoozeBoosterActive: () => {
        const state = get();
        const newSnoozeCount = state.booster.snoozeCount + 1;
        const nextPromptAt = Date.now() + 10 * 60 * 1000;

        set({
          booster: {
            ...state.booster,
            status: 'snoozed',
            snoozeCount: newSnoozeCount,
            nextPromptAt,
            isModalVisible: false,
            isMinimized: false,
          },
        });
        if (state.meditationPlayback.hasStarted && !state.meditationPlayback.isPlaying) {
          get().resumeMeditationPlayback();
        }
      },

      minimizeBooster: () => {
        const state = get();
        set({
          booster: {
            ...state.booster,
            isMinimized: true,
          },
        });
      },

      maximizeBooster: () => {
        const state = get();
        // Pause module timer when expanding
        if (state.meditationPlayback.isPlaying) {
          get().pauseMeditationPlayback();
        }
        set({
          booster: {
            ...state.booster,
            isMinimized: false,
          },
        });
      },

      expireBooster: () => {
        const state = get();
        set({
          booster: {
            ...state.booster,
            status: 'expired',
            boosterDecisionAt: Date.now(),
            isModalVisible: false,
            isMinimized: false,
          },
        });
        // Resume module timer if it was paused by the booster modal
        if (state.meditationPlayback.hasStarted && !state.meditationPlayback.isPlaying) {
          get().resumeMeditationPlayback();
        }
      },

      // Re-open booster modal from timeline info popup (e.g. after accidental skip)
      reopenBoosterModal: () => {
        const state = get();
        // Pause active module timer
        if (state.meditationPlayback.isPlaying) {
          get().pauseMeditationPlayback();
        }
        // Switch to Active tab so the modal is visible
        useAppStore.getState().setCurrentTab('active');
        set({
          booster: {
            ...state.booster,
            status: 'prompted',
            isModalVisible: true,
            isMinimized: false,
            snoozeCount: 0,
            nextPromptAt: null,
            checkInResponses: {
              experienceQuality: null,
              physicalState: null,
              trajectory: null,
            },
          },
        });
      },

      // Check if snooze would push past the window
      isSnoozeAvailable: () => {
        const state = get();
        const ingestionTime = state.substanceChecklist.ingestionTime;
        if (!ingestionTime) return false;

        const nextPromptTime = Date.now() + 10 * 60 * 1000;
        const windowEnd = ingestionTime + 150 * 60 * 1000;
        return nextPromptTime < windowEnd;
      },

      // ============================================
      // SESSION CONTROL
      // ============================================

      startSession: () => {
        const state = get();
        if (state.modules.items.length === 0) {
          console.error('Cannot start session: no modules in timeline');
          return;
        }

        const now = Date.now();

        set({
          sessionPhase: 'active',
          timeline: {
            ...state.timeline,
            currentPhase: 'come-up',
            phases: {
              ...state.timeline.phases,
              comeUp: {
                ...state.timeline.phases.comeUp,
                startedAt: now,
              },
            },
          },
          comeUpCheckIn: {
            ...state.comeUpCheckIn,
            isVisible: false, // Hidden until first module completes or 10 min elapsed
            isMinimized: true,
            introCompleted: true,
            promptCount: 0,
            lastPromptAt: now,
          },
        });
      },

      // ============================================
      // COME-UP CHECK-IN ACTIONS
      // ============================================

      minimizeCheckIn: () => {
        set({
          comeUpCheckIn: {
            ...get().comeUpCheckIn,
            isMinimized: true,
          },
        });
      },

      maximizeCheckIn: () => {
        set({
          comeUpCheckIn: {
            ...get().comeUpCheckIn,
            isMinimized: false,
          },
        });
      },

      recordCheckInResponse: (response) => {
        const state = get();
        const now = Date.now();
        const ingestionTime = state.substanceChecklist.ingestionTime;
        const minutesSinceIngestion = ingestionTime
          ? Math.floor((now - ingestionTime) / (1000 * 60))
          : 0;

        // If "fully-arrived" and less than 20 minutes, we'll need confirmation
        // This is handled by the component showing a follow-up question

        const updates = {
          comeUpCheckIn: {
            ...state.comeUpCheckIn,
            currentResponse: response,
            responses: [
              ...state.comeUpCheckIn.responses,
              { response, timestamp: now, minutesSinceIngestion },
            ],
            // Don't auto-minimize here - let the component handle showing reassurance first
            // The component will call minimizeCheckIn() after the reassurance is dismissed
          },
        };

        if (response === 'fully-arrived') {
          updates.comeUpCheckIn.hasIndicatedFullyArrived = true;
        }

        set(updates);
      },

      // ============================================
      // PEAK PHASE CHECK-IN ACTIONS
      // ============================================

      showPeakCheckIn: () => {
        set({ peakCheckIn: { isVisible: true } });
      },

      dismissPeakCheckIn: () => {
        set({ peakCheckIn: { isVisible: false } });
      },

      // ============================================
      // MEDITATION PLAYBACK ACTIONS
      // ============================================

      startMeditationPlayback: (moduleInstanceId) => {
        set({
          meditationPlayback: {
            moduleInstanceId,
            isPlaying: true,
            hasStarted: true,
            startedAt: Date.now(),
            accumulatedTime: 0,
          },
        });
      },

      pauseMeditationPlayback: () => {
        const state = get();
        const pb = state.meditationPlayback;
        const currentSegment = pb.startedAt ? (Date.now() - pb.startedAt) / 1000 : 0;
        set({
          meditationPlayback: {
            ...pb,
            isPlaying: false,
            startedAt: null,
            accumulatedTime: (pb.accumulatedTime || 0) + currentSegment,
          },
        });
      },

      resumeMeditationPlayback: () => {
        const state = get();
        set({
          meditationPlayback: {
            ...state.meditationPlayback,
            isPlaying: true,
            startedAt: Date.now(),
          },
        });
      },

      resetMeditationPlayback: () => {
        set({
          meditationPlayback: {
            moduleInstanceId: null,
            isPlaying: false,
            hasStarted: false,
            startedAt: null,
            accumulatedTime: 0,
          },
        });
      },

      // ============================================
      // PHASE TRANSITIONS
      // ============================================

      // Begin the come-up to peak transition (shows transition component)
      beginPeakTransition: () => {
        const state = get();
        set({
          phaseTransitions: {
            ...state.phaseTransitions,
            activeTransition: 'come-up-to-peak',
            transitionCompleted: false,
          },
          comeUpCheckIn: {
            ...state.comeUpCheckIn,
            isVisible: false,
            isMinimized: true,
          },
        });
      },

      // Complete the come-up to peak transition (called after transition component finishes)
      transitionToPeak: () => {
        const state = get();
        const now = Date.now();

        // Find the first peak module to auto-start
        const firstPeakModule = state.modules.items
          .filter((m) => m.phase === 'peak' && m.status === 'upcoming')
          .sort((a, b) => a.order - b.order)[0];

        set({
          timeline: {
            ...state.timeline,
            currentPhase: 'peak',
            phases: {
              ...state.timeline.phases,
              comeUp: {
                ...state.timeline.phases.comeUp,
                endedAt: now,
                endedBy: 'user-checkin',
              },
              peak: {
                ...state.timeline.phases.peak,
                startedAt: now,
              },
            },
          },
          phaseTransitions: {
            ...state.phaseTransitions,
            activeTransition: null,
            transitionCompleted: true,
          },
          modules: {
            ...state.modules,
            // Auto-start first peak module if available
            currentModuleInstanceId: firstPeakModule?.instanceId || null,
            // Clear open space flag when transitioning to new phase
            inOpenSpace: false,
            items: firstPeakModule
              ? state.modules.items.map((m) =>
                  m.instanceId === firstPeakModule.instanceId
                    ? { ...m, status: 'active', startedAt: now }
                    : m
                )
              : state.modules.items,
          },
        });
      },

      // Begin the peak to integration transition (shows IntegrationTransition component)
      beginIntegrationTransition: () => {
        const state = get();
        set({
          phaseTransitions: {
            ...state.phaseTransitions,
            activeTransition: 'peak-to-integration',
            transitionCompleted: false,
          },
          peakCheckIn: { isVisible: false },
        });
      },

      // Complete the peak to integration transition (called after IntegrationTransition finishes)
      transitionToIntegration: () => {
        const state = get();
        const now = Date.now();

        // Find the first integration module to auto-start
        const firstIntegrationModule = state.modules.items
          .filter((m) => m.phase === 'integration' && m.status === 'upcoming')
          .sort((a, b) => a.order - b.order)[0];

        set({
          timeline: {
            ...state.timeline,
            currentPhase: 'integration',
            phases: {
              ...state.timeline.phases,
              peak: {
                ...state.timeline.phases.peak,
                endedAt: now,
              },
              integration: {
                ...state.timeline.phases.integration,
                startedAt: now,
              },
            },
          },
          phaseTransitions: {
            ...state.phaseTransitions,
            activeTransition: null,
            transitionCompleted: true,
          },
          modules: {
            ...state.modules,
            // Auto-start first integration module if available
            currentModuleInstanceId: firstIntegrationModule?.instanceId || null,
            // Clear open space flag when transitioning to new phase
            inOpenSpace: false,
            items: firstIntegrationModule
              ? state.modules.items.map((m) =>
                  m.instanceId === firstIntegrationModule.instanceId
                    ? { ...m, status: 'active', startedAt: now }
                    : m
                )
              : state.modules.items,
          },
          peakCheckIn: { isVisible: false },
        });
      },

      // ============================================
      // TRANSITION CAPTURE ACTIONS
      // ============================================

      updatePeakCapture: (field, value) => {
        const state = get();
        set({
          transitionCaptures: {
            ...state.transitionCaptures,
            peak: {
              ...state.transitionCaptures.peak,
              [field]: value,
            },
          },
        });
      },

      updateIntegrationCapture: (field, value) => {
        const state = get();
        set({
          transitionCaptures: {
            ...state.transitionCaptures,
            integration: {
              ...state.transitionCaptures.integration,
              [field]: value,
            },
          },
        });
      },

      updateClosingCapture: (field, value) => {
        const state = get();
        set({
          transitionCaptures: {
            ...state.transitionCaptures,
            closing: {
              ...state.transitionCaptures.closing,
              [field]: value,
            },
          },
        });
      },

      // Universal writer for the new transitionData slice (TransitionModule system).
      // Supports dot-path notation: updateTransitionData('somaticCheckIns.peak', [...])
      updateTransitionData: (path, value) => {
        set((state) => {
          const keys = path.split('.');
          const newData = { ...state.transitionData };
          let current = newData;
          for (let i = 0; i < keys.length - 1; i++) {
            current[keys[i]] = { ...current[keys[i]] };
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = value;
          return { transitionData: newData };
        });
      },

      updateProtectorCapture: (field, value) => {
        const state = get();
        set({
          transitionCaptures: {
            ...state.transitionCaptures,
            protectorDialogue: {
              ...state.transitionCaptures.protectorDialogue,
              [field]: value,
            },
          },
        });
      },

      updateStayWithItCapture: (field, value) => {
        const state = get();
        set({
          transitionCaptures: {
            ...state.transitionCaptures,
            stayWithIt: {
              ...state.transitionCaptures.stayWithIt,
              [field]: value,
            },
          },
        });
      },

      updateValuesCompassCapture: (field, value) => {
        const state = get();
        set({
          transitionCaptures: {
            ...state.transitionCaptures,
            valuesCompass: {
              ...state.transitionCaptures.valuesCompass,
              [field]: value,
            },
          },
        });
      },

      updateFeltSenseCapture: (field, value) => {
        const state = get();
        set({
          transitionCaptures: {
            ...state.transitionCaptures,
            feltSense: {
              ...state.transitionCaptures.feltSense,
              [field]: value,
            },
          },
        });
      },

      updateTheDescentCapture: (field, value) => {
        const state = get();
        set({
          transitionCaptures: {
            ...state.transitionCaptures,
            theDescent: {
              ...state.transitionCaptures.theDescent,
              [field]: value,
            },
          },
        });
      },

      updateTheCycleCapture: (field, value) => {
        const state = get();
        set({
          transitionCaptures: {
            ...state.transitionCaptures,
            theCycle: {
              ...state.transitionCaptures.theCycle,
              [field]: value,
            },
          },
        });
      },

      updateMappingTerritoryCapture: (field, value) => {
        const state = get();
        set({
          transitionCaptures: {
            ...state.transitionCaptures,
            mappingTerritory: {
              ...state.transitionCaptures.mappingTerritory,
              [field]: value,
            },
          },
        });
      },

      updatePendulationCapture: (field, value) => {
        const state = get();
        set({
          transitionCaptures: {
            ...state.transitionCaptures,
            pendulation: {
              ...state.transitionCaptures.pendulation,
              [field]: value,
            },
          },
        });
      },

      updateShakingTheTreeCapture: (field, value) => {
        const state = get();
        set({
          transitionCaptures: {
            ...state.transitionCaptures,
            shakingTheTree: {
              ...state.transitionCaptures.shakingTheTree,
              [field]: value,
            },
          },
        });
      },

      // ============================================
      // CLOSING RITUAL ACTIONS
      // ============================================

      showClosingCheckIn: () => {
        set({
          closingCheckIn: { isVisible: true },
        });
      },

      dismissClosingCheckIn: () => {
        set({
          closingCheckIn: { isVisible: false },
        });
      },

      beginClosingRitual: () => {
        const state = get();
        set({
          phaseTransitions: {
            ...state.phaseTransitions,
            activeTransition: 'session-closing',
            transitionCompleted: false,
          },
          closingCheckIn: { isVisible: false },
        });
      },

      completeSession: () => {
        const state = get();
        const now = Date.now();
        const HOUR_MS = 60 * 60 * 1000;
        const DAY_MS = 24 * HOUR_MS;

        // Calculate elapsed seconds
        const ingestionTime = state.substanceChecklist?.ingestionTime;
        const finalDurationSeconds = ingestionTime
          ? Math.floor((now - ingestionTime) / 1000)
          : null;

        // Check if Values Compass was completed during this session
        const vcCompleted = state.transitionCaptures.valuesCompass?.completedAt != null;

        // Auto-add integration reflection journal to follow-up phase
        const irLib = getModuleById('integration-reflection-journal');
        const followUpModule = {
          instanceId: generateId(),
          libraryId: 'integration-reflection-journal',
          phase: 'follow-up',
          title: irLib?.title || 'Integration Reflection',
          duration: irLib?.duration || 25,
          status: 'upcoming',
          order: 0,
          content: irLib?.content || {},
          startedAt: null,
          completedAt: null,
        };

        set({
          sessionPhase: 'completed',
          modules: {
            ...state.modules,
            items: [...state.modules.items, followUpModule],
          },
          phaseTransitions: {
            ...state.phaseTransitions,
            activeTransition: null,
            transitionCompleted: true,
          },
          transitionCaptures: {
            ...state.transitionCaptures,
            closing: {
              ...state.transitionCaptures.closing,
              completedAt: now,
            },
          },
          timeline: {
            ...state.timeline,
            phases: {
              ...state.timeline.phases,
              integration: {
                ...state.timeline.phases.integration,
                endedAt: now,
              },
            },
          },
          // Session completion data
          session: {
            closedAt: now,
            finalDurationSeconds,
            dataExportedAt: null,
          },
          // Follow-up phase unlock (single 8-hour lock on entire phase)
          followUp: {
            ...state.followUp,
            phaseUnlockTime: now + 8 * HOUR_MS,
            unlockTimes: {
              checkIn: now + 8 * HOUR_MS,
              revisit: now + 8 * HOUR_MS,
              integration: now + 8 * HOUR_MS,
              ...(vcCompleted ? { valuesCompassFollowUp: now + 8 * HOUR_MS } : {}),
            },
          },
        });
      },

      // Record that session data was exported
      recordDataExport: () => {
        set((state) => ({
          session: { ...state.session, dataExportedAt: Date.now() },
        }));
      },

      // ============================================
      // FOLLOW-UP SESSION ACTIONS
      // ============================================

      // Check and update follow-up module availability based on phase unlock time
      checkFollowUpAvailability: () => {
        const state = get();
        const now = Date.now();
        const { phaseUnlockTime, modules } = state.followUp;

        if (!phaseUnlockTime) return;
        if (now < phaseUnlockTime) return; // Phase still locked

        // Phase is unlocked — set all locked modules to available
        const updates = {};
        ['checkIn', 'revisit', 'integration', 'valuesCompassFollowUp'].forEach((moduleId) => {
          const module = modules[moduleId];
          if (module && module.status === 'locked') {
            updates[moduleId] = { ...module, status: 'available' };
          }
        });

        if (Object.keys(updates).length > 0) {
          set({
            followUp: {
              ...state.followUp,
              modules: {
                ...state.followUp.modules,
                ...updates,
              },
            },
          });
        }
      },

      // Update a follow-up module's data
      updateFollowUpModule: (moduleId, data) => {
        const state = get();
        set({
          followUp: {
            ...state.followUp,
            modules: {
              ...state.followUp.modules,
              [moduleId]: {
                ...state.followUp.modules[moduleId],
                ...data,
              },
            },
          },
        });
      },

      // Complete a follow-up module
      completeFollowUpModule: (moduleId, data) => {
        const state = get();
        set({
          followUp: {
            ...state.followUp,
            modules: {
              ...state.followUp.modules,
              [moduleId]: {
                ...state.followUp.modules[moduleId],
                ...data,
                status: 'completed',
                completedAt: Date.now(),
              },
            },
          },
          activeFollowUpModule: null,
        });
        // Navigate back to home
        useAppStore.getState().setCurrentTab('home');
      },

      // Start a follow-up module (renders in Active tab)
      startFollowUpModule: (moduleId) => {
        set({ activeFollowUpModule: moduleId });
        useAppStore.getState().setCurrentTab('active');
      },

      // Exit follow-up module without completing (return to Home)
      exitFollowUpModule: () => {
        set({ activeFollowUpModule: null });
        useAppStore.getState().setCurrentTab('home');
      },

      // ============================================
      // PRE-SESSION MODULE ACTIONS
      // ============================================

      // Helper: mark journal entries created during a module run with PRE-SESSION header
      _markPreSessionJournalEntries: (startedAt) => {
        const journalState = useJournalStore.getState();
        const now = Date.now();
        journalState.entries.forEach((entry) => {
          if (
            entry.createdAt >= startedAt &&
            entry.createdAt <= now &&
            !entry.content.startsWith('PRE-SESSION\n\n')
          ) {
            journalState.updateEntry(entry.id, `PRE-SESSION\n\n${entry.content}`);
          }
        });
      },

      // Start a pre-session module (renders in Active tab)
      startPreSessionModule: (instanceId) => {
        const state = get();
        const now = Date.now();
        set({
          activePreSessionModule: instanceId,
          modules: {
            ...state.modules,
            items: state.modules.items.map((m) =>
              m.instanceId === instanceId
                ? { ...m, status: 'active', startedAt: m.startedAt || now }
                : m
            ),
          },
        });
        useAppStore.getState().setCurrentTab('active');
      },

      // Complete a pre-session module
      // Clears activePreSessionModule and stays on Active tab (Pre-Session Active Page)
      completePreSessionModule: (instanceId) => {
        const state = get();
        const module = state.modules.items.find((m) => m.instanceId === instanceId);
        if (!module) return;

        const now = Date.now();

        // Mark journal entries with PRE-SESSION header
        if (module.startedAt) {
          get()._markPreSessionJournalEntries(module.startedAt);
        }

        // Mark module as completed, clear active module, stay on Active tab
        set({
          activePreSessionModule: null,
          modules: {
            ...state.modules,
            items: state.modules.items.map((m) =>
              m.instanceId === instanceId
                ? { ...m, status: 'completed', completedAt: now }
                : m
            ),
          },
          meditationPlayback: {
            moduleInstanceId: null,
            isPlaying: false,
            hasStarted: false,
            startedAt: null,
            accumulatedTime: 0,
          },
        });
      },


      // Exit pre-session module without completing (return to Home)
      exitPreSessionModule: () => {
        const state = get();
        const instanceId = state.activePreSessionModule;
        if (instanceId) {
          const module = state.modules.items.find((m) => m.instanceId === instanceId);
          if (module?.startedAt) {
            get()._markPreSessionJournalEntries(module.startedAt);
          }
        }
        set({
          activePreSessionModule: null,
          meditationPlayback: {
            moduleInstanceId: null,
            isPlaying: false,
            hasStarted: false,
            startedAt: null,
            accumulatedTime: 0,
          },
        });
        useAppStore.getState().setCurrentTab('home');
      },

      // Abandon a module in progress — reset to upcoming so the user can retry.
      // Used by pre-session and follow-up skip overrides (these phases don't
      // record skipped status; they just let the user come back later).
      abandonModule: (instanceId) => {
        const state = get();
        const module = state.modules.items.find((m) => m.instanceId === instanceId);
        if (!module) return;

        // Mark any journal entries written during the attempt
        if (module.startedAt) {
          get()._markPreSessionJournalEntries(module.startedAt);
        }

        const updates = {
          modules: {
            ...state.modules,
            items: state.modules.items.map((m) =>
              m.instanceId === instanceId
                ? { ...m, status: 'upcoming', startedAt: null, completedAt: null }
                : m
            ),
          },
          meditationPlayback: {
            moduleInstanceId: null,
            isPlaying: false,
            hasStarted: false,
            startedAt: null,
            accumulatedTime: 0,
          },
        };

        // Clear the appropriate active module pointer based on phase
        if (module.phase === 'pre-session') {
          updates.activePreSessionModule = null;
        } else {
          updates.modules.currentModuleInstanceId = null;
        }

        set(updates);
      },

      // ============================================
      // MODULE RUNTIME
      // ============================================

      startModule: (instanceId) => {
        const state = get();
        // Never start a booster module — it's purely a visual timeline indicator
        const module = state.modules.items.find((m) => m.instanceId === instanceId);
        if (!module || module.isBoosterModule) return;

        const updates = {
          modules: {
            ...state.modules,
            currentModuleInstanceId: instanceId,
            inOpenSpace: false, // Clear open space when user explicitly starts a module
            items: state.modules.items.map((m) =>
              m.instanceId === instanceId
                ? { ...m, status: 'active', startedAt: Date.now() }
                : m
            ),
          },
        };

        set(updates);
      },

      completeModule: (instanceId) => {
        const state = get();
        const module = state.modules.items.find((m) => m.instanceId === instanceId);
        if (!module) return;

        const now = Date.now();
        const currentPhase = state.timeline.currentPhase;

        // Add to history
        const historyEntry = {
          ...module,
          status: 'completed',
          completedAt: now,
          actualDuration: module.startedAt
            ? Math.floor((now - module.startedAt) / 1000)
            : module.duration * 60,
        };

        // Update the module items first (mark as completed)
        const updatedItems = state.modules.items.map((m) =>
          m.instanceId === instanceId
            ? { ...m, status: 'completed', completedAt: now }
            : m
        );

        // Find next module in current phase (skip booster - it's purely visual)
        const nextModule = updatedItems
          .filter((m) => m.phase === currentPhase && m.status === 'upcoming' && !m.isBoosterModule)
          .sort((a, b) => a.order - b.order)[0];

        // If in come-up phase, show check-in or end-of-phase choice
        if (currentPhase === 'come-up') {
          if (state.comeUpCheckIn.hasIndicatedFullyArrived) {
            // User already said fully-arrived: show end-of-phase choice
            set({
              modules: {
                ...state.modules,
                currentModuleInstanceId: null,
                inOpenSpace: !nextModule, // Enter open space if no more modules
                items: updatedItems,
                history: [...state.modules.history, historyEntry],
              },
              comeUpCheckIn: {
                ...state.comeUpCheckIn,
                isVisible: true,

                isMinimized: false,
              },
            });
          } else {
            // Normal check-in modal between modules
            set({
              modules: {
                ...state.modules,
                currentModuleInstanceId: null,
                inOpenSpace: !nextModule, // Enter open space if no more modules
                items: updatedItems,
                history: [...state.modules.history, historyEntry],
              },
              comeUpCheckIn: {
                ...state.comeUpCheckIn,
                isVisible: true,
                isMinimized: false,
                promptCount: state.comeUpCheckIn.promptCount + 1,
                lastPromptAt: now,
              },
            });
          }
        } else if (nextModule) {
          // For peak/integration phases, auto-start next module
          set({
            modules: {
              ...state.modules,
              currentModuleInstanceId: nextModule.instanceId,
              inOpenSpace: false, // Clear open space when starting a module
              items: updatedItems.map((m) =>
                m.instanceId === nextModule.instanceId
                  ? { ...m, status: 'active', startedAt: now }
                  : m
              ),
              history: [...state.modules.history, historyEntry],
            },
          });
        } else {
          // No more modules in this phase - enter open space
          const updates = {
            modules: {
              ...state.modules,
              currentModuleInstanceId: null,
              inOpenSpace: true, // User is now in open space mode
              items: updatedItems,
              history: [...state.modules.history, historyEntry],
            },
          };

          // Show phase check-in modal when phase has no more modules
          if (currentPhase === 'peak') {
            updates.peakCheckIn = { isVisible: true };
          } else if (currentPhase === 'integration') {
            updates.closingCheckIn = { isVisible: true };
          }

          set(updates);
        }
      },

      skipModule: (instanceId) => {
        console.log('[SessionStore] skipModule(%s) called', instanceId);
        const state = get();
        const module = state.modules.items.find((m) => m.instanceId === instanceId);
        if (!module) { console.warn('[SessionStore] skipModule — module not found!'); return; }

        const now = Date.now();
        const currentPhase = state.timeline.currentPhase;
        console.log('[SessionStore] skipModule — phase=%s, module=%s', currentPhase, module.libraryId);

        // Update the module items first (mark as skipped)
        const updatedItems = state.modules.items.map((m) =>
          m.instanceId === instanceId
            ? { ...m, status: 'skipped', completedAt: now }
            : m
        );

        // Find next module in current phase (skip booster - it's purely visual)
        const nextModule = updatedItems
          .filter((m) => m.phase === currentPhase && m.status === 'upcoming' && !m.isBoosterModule)
          .sort((a, b) => a.order - b.order)[0];

        const historyEntry = { ...module, status: 'skipped', completedAt: now };

        // If in come-up phase, show check-in or end-of-phase choice
        if (currentPhase === 'come-up') {
          if (state.comeUpCheckIn.hasIndicatedFullyArrived) {
            // User already said fully-arrived: show end-of-phase choice
            set({
              modules: {
                ...state.modules,
                currentModuleInstanceId: null,
                inOpenSpace: !nextModule, // Enter open space if no more modules
                items: updatedItems,
                history: [...state.modules.history, historyEntry],
              },
              comeUpCheckIn: {
                ...state.comeUpCheckIn,
                isVisible: true,

                isMinimized: false,
              },
            });
          } else {
            // Normal check-in modal between modules
            set({
              modules: {
                ...state.modules,
                currentModuleInstanceId: null,
                inOpenSpace: !nextModule, // Enter open space if no more modules
                items: updatedItems,
                history: [...state.modules.history, historyEntry],
              },
              comeUpCheckIn: {
                ...state.comeUpCheckIn,
                isVisible: true,
                isMinimized: false,
                promptCount: state.comeUpCheckIn.promptCount + 1,
                lastPromptAt: now,
              },
            });
          }
        } else if (nextModule) {
          // For peak/integration phases, auto-start next module
          set({
            modules: {
              ...state.modules,
              currentModuleInstanceId: nextModule.instanceId,
              inOpenSpace: false, // Clear open space when starting a module
              items: updatedItems.map((m) =>
                m.instanceId === nextModule.instanceId
                  ? { ...m, status: 'active', startedAt: now }
                  : m
              ),
              history: [...state.modules.history, historyEntry],
            },
          });
        } else {
          // No more modules in this phase - enter open space
          const updates = {
            modules: {
              ...state.modules,
              currentModuleInstanceId: null,
              inOpenSpace: true, // User is now in open space mode
              items: updatedItems,
              history: [...state.modules.history, historyEntry],
            },
          };

          // Show phase check-in modal when phase has no more modules
          if (currentPhase === 'peak') {
            updates.peakCheckIn = { isVisible: true };
          } else if (currentPhase === 'integration') {
            updates.closingCheckIn = { isVisible: true };
          }

          set(updates);
        }
      },

      // Get the next module to start in the current phase
      getNextModule: () => {
        const state = get();
        const currentPhase = state.timeline.currentPhase;
        if (!currentPhase) return null;

        const phaseModules = state.modules.items
          .filter((m) => m.phase === currentPhase && m.status === 'upcoming' && !m.isBoosterModule)
          .sort((a, b) => a.order - b.order);

        return phaseModules[0] || null;
      },

      // Get current active module (booster modules are never "active" — they're purely visual)
      getCurrentModule: () => {
        const state = get();
        if (!state.modules.currentModuleInstanceId) return null;
        const module = state.modules.items.find(
          (m) => m.instanceId === state.modules.currentModuleInstanceId
        );
        if (module?.isBoosterModule) return null;
        return module;
      },

      // Set open space mode (called when OpenSpace component mounts)
      // This prevents auto-starting modules when user is intentionally resting
      enterOpenSpace: () => {
        const state = get();
        if (!state.modules.inOpenSpace) {
          set({
            modules: {
              ...state.modules,
              inOpenSpace: true,
            },
          });
        }
      },

      // ============================================
      // SESSION CONTROL (Pause/Resume/End)
      // ============================================

      pauseSession: () => {
        set({
          sessionPhase: 'paused',
        });
      },

      resumeSession: () => {
        set({
          sessionPhase: 'active',
        });
      },

      endSession: () => {
        const state = get();
        set({
          sessionPhase: 'completed',
          timeline: {
            ...state.timeline,
            phases: {
              ...state.timeline.phases,
              integration: {
                ...state.timeline.phases.integration,
                endedAt: Date.now(),
              },
            },
          },
        });
      },

      // ============================================
      // COMPUTED VALUES / GETTERS
      // ============================================

      getModulesForPhase: (phase) => {
        const state = get();
        return state.modules.items
          .filter((m) => m.phase === phase)
          .sort((a, b) => a.order - b.order);
      },

      getPhaseDuration: (phase) => {
        const state = get();
        const modules = state.modules.items.filter((m) => m.phase === phase);
        return modules.reduce((sum, m) => sum + m.duration, 0);
      },

      getTotalDuration: () => {
        const state = get();
        return state.modules.items.reduce((sum, m) => sum + m.duration, 0);
      },

      getSessionProgress: () => {
        const state = get();
        const completed = state.modules.items.filter(
          (m) => m.status === 'completed' || m.status === 'skipped'
        ).length;
        const total = state.modules.items.length;
        return total > 0 ? (completed / total) * 100 : 0;
      },

      getElapsedMinutes: () => {
        const state = get();
        if (!state.substanceChecklist.ingestionTime) return 0;
        return Math.floor(
          (Date.now() - state.substanceChecklist.ingestionTime) / (1000 * 60)
        );
      },

      // Validate if modules can fit in phase
      validatePhaseModules: (phase) => {
        const state = get();
        const phaseModules = state.modules.items.filter((m) => m.phase === phase);
        const totalDuration = phaseModules.reduce((sum, m) => sum + m.duration, 0);
        const allocated = state.timeline.phases[phase === 'come-up' ? 'comeUp' : phase]?.allocatedDuration || 0;

        if (phase === 'come-up' && totalDuration > state.timeline.phases.comeUp.maxDuration) {
          return {
            valid: true,
            warning: true,
            totalDuration,
            maxDuration: state.timeline.phases.comeUp.maxDuration,
          };
        }

        return { valid: true, totalDuration, allocated };
      },

      // ============================================
      // RESET
      // ============================================

      /**
       * Return a clean snapshot of the current session state for archiving.
       * Strips transient UI state (same logic as the persist partialize config).
       */
      snapshotForArchive: () => {
        const state = get();
        const { meditationPlayback: _mp, activeFollowUpModule: _afu, activePreSessionModule: _aps, ...rest } = state;
        // Strip all function-valued keys (actions) — keep only data
        const snapshot = {};
        for (const [key, value] of Object.entries(rest)) {
          if (typeof value !== 'function') {
            snapshot[key] = value;
          }
        }
        // Reset transient flags (same as partialize)
        return {
          ...snapshot,
          comeUpCheckIn: {
            ...state.comeUpCheckIn,
            currentResponse: null,

          },
          peakCheckIn: { isVisible: false },
          closingCheckIn: { isVisible: false },
          booster: {
            ...state.booster,
            isModalVisible: state.booster.status === 'prompted' || state.booster.status === 'snoozed',
            isMinimized: state.booster.status === 'snoozed',
          },
          phaseTransitions: {
            ...state.phaseTransitions,
            activeTransition: null,
            transitionCompleted: false,
          },
          modules: {
            ...state.modules,
            inOpenSpace: false,
          },
        };
      },

      resetSession: () => {
        set({
          sessionPhase: 'not-started',
          sessionId: null,
          sessionProfile: {
            // Identity & context (Section A)
            experienceLevel: null,
            sessionMode: null,
            hasPreparation: null,
            // Intention & focus (Section B)
            primaryFocus: null,
            relationshipType: null,
            holdingQuestion: '',
            emotionalState: null,
            // Session preferences (Section C)
            guidanceLevel: null,
            activityPreferences: [],
            considerBooster: null,
            promptFormat: null,
            sessionDuration: null,
            startTime: null,
            // Safety & practicality (Section D)
            safeSpace: null,
            hasWaterSnacks: null,
            emergencyContact: null,
            emergencyContactDetails: { name: '', phone: '', notes: '' },
            medications: { taking: false, details: '' },
            heartConditions: null,
            psychiatricHistory: null,
            contraindicatedMedications: null,
            // Substance plan
            hasTested: null,
            physicalPreparation: null,
            lastMDMAUse: null,
            hasSubstance: null,
            hasTestedSubstance: null,
            hasPreparedDosage: null,
            plannedDosageMg: null,
            dosageFeedback: null,
            // Intention artifacts
            touchstone: '',
            intentionJournalEntryId: null,
            focusJournalEntryId: null,
          },
          intake: {
            currentSection: 'A',
            currentQuestionIndex: 0,
            isComplete: false,
            showSafetyWarnings: false,
            showMedicationWarning: false,
          },
          substanceChecklist: {
            hasTakenSubstance: false,
            ingestionTime: null,
            ingestionTimeConfirmed: false,
          },
          preSubstanceActivity: {
            substanceChecklistSubPhase: 'part1',
            completedActivities: [],
          },
          timeline: {
            scheduledStartTime: null,
            targetDuration: 240,
            minDuration: 120,
            maxDuration: 480,
            currentPhase: null,
            phases: {
              comeUp: {
                minDuration: 20,
                maxDuration: 60,
                allocatedDuration: 45,
                startedAt: null,
                endedAt: null,
                endedBy: null,
              },
              peak: {
                estimatedDuration: 90,
                allocatedDuration: 90,
                startedAt: null,
                endedAt: null,
              },
              integration: {
                allocatedDuration: null,
                startedAt: null,
                endedAt: null,
              },
            },
          },
          modules: {
            items: [],
            currentModuleInstanceId: null,
            history: [],
            inOpenSpace: false,
          },
          comeUpCheckIn: {
            isVisible: false,
            isMinimized: true,
            promptCount: 0,
            lastPromptAt: null,
            responses: [],
            currentResponse: null,
            introCompleted: false,

            hasIndicatedFullyArrived: false,
          },
          peakCheckIn: {
            isVisible: false,
          },
          phaseTransitions: {
            activeTransition: null,
            transitionCompleted: false,
          },
          booster: {
            considerBooster: false,
            boosterPrepared: null,
            status: 'pending',
            boosterTakenAt: null,
            boosterDecisionAt: null,
            boosterDoseMg: null,
            snoozeCount: 0,
            nextPromptAt: null,
            checkInResponses: {
              experienceQuality: null,
              physicalState: null,
              trajectory: null,
            },
            isModalVisible: false,
            isMinimized: false,
          },
          transitionCaptures: {
            peak: {
              bodySensations: [],
              oneWord: '',
              completedAt: null,
            },
            integration: {
              intentionEdited: false,
              editedIntention: '',
              focusChanged: false,
              newFocus: null,
              newRelationshipType: null,
              tailoredActivityFocus: null,
              tailoredActivityResponse: {},
              completedAt: null,
            },
            closing: {
              selfGratitude: '',
              futureMessage: '',
              commitment: '',
              completedAt: null,
            },
            protectorDialogue: {
              protectorType: null,
              customProtectorName: '',
              bodyLocation: '',
              protectorMessage: '',
              completedAt: null,
            },
            stayWithIt: {
              checkInResponse: null,
              completedAt: null,
            },
            valuesCompass: {
              quadrants: null,
              completedAt: null,
            },
            feltSense: {
              shiftCheckIn: null,
              completedAt: null,
            },
            theDescent: {
              mode: null,
              quickCapture: '',
              checkInResponse: null,
              surfaceReaction: '',
              primaryEmotion: '',
              unsaidMessage: '',
              completedAt: null,
            },
            theCycle: {
              mode: null,
              myPosition: null,
              friction: '',
              myMoveId: null,
              myMoveMotivation: '',
              yourUnderneath: '',
              theirMoveId: null,
              theirUnderneath: '',
              partnerMoveId: null,
              partnerUnderneath: '',
              cycleName: '',
              meditationCapture: '',
              checkInResponse: null,
              journalSurprise: '',
              journalOtherSide: '',
              journalStepOut: '',
              journeyReflection: '',
              completedAt: null,
            },
            mappingTerritory: {
              copingPattern: null,
              approachStyle: null,
              askingForAttention: '',
              wordToSelf: '',
              completedAt: null,
            },
            pendulation: {
              checkpoint1Response: null,
              checkpoint2Response: null,
              sectionsCompleted: [],
              completionSignals: [],
              dischargeCompletion: null,
              thawExperience: null,
              completedAt: null,
            },
            shakingTheTree: {
              bodySensations: [],
              responseKey: null,
              completedAt: null,
            },
          },
          transitionData: {
            somaticCheckIns: { opening: [], peak: [], integration: [], closing: [] },
            openingTouchstone: null,
            closingTouchstone: null,
            touchstoneArcReflection: null,
            oneWord: null,
            intentionAdditions: { opening: null, integration: null },
            focusChanged: false,
            newFocus: null,
            newRelationshipType: null,
            tailoredActivityFocus: null,
            tailoredActivityResponse: {},
            selfGratitude: null,
            futureMessage: null,
            commitment: null,
            completedAt: { opening: null, peak: null, integration: null, closing: null },
            activeNavigation: {
              transitionId: null,
              currentSectionIndex: 0,
              visitedSections: [],
              routeStack: [],
              sectionHistory: [],
              screenIndex: 0,
              responses: {},
              selectorValues: {},
              selectorJournals: {},
              choiceValues: {},
              blockReadiness: {},
            },
          },
          lifeGraph: {
            milestones: [],
            graphGenerated: false,
            journalEntryId: null,
          },
          closingCheckIn: {
            isVisible: false,
          },
          session: {
            closedAt: null,
            finalDurationSeconds: null,
            dataExportedAt: null,
            sessionNumber: null,
          },
          followUp: {
            unlockTimes: {
              checkIn: null,
              revisit: null,
              integration: null,
            },
            modules: {
              checkIn: {
                status: 'locked',
                completedAt: null,
                feeling: null,
                note: null,
              },
              revisit: {
                status: 'locked',
                completedAt: null,
                reflection: null,
              },
              integration: {
                status: 'locked',
                completedAt: null,
                emerged: null,
                commitmentStatus: null,
                commitmentResponse: null,
              },
            },
          },
          activeFollowUpModule: null,
          activePreSessionModule: null,
          meditationPlayback: {
            moduleInstanceId: null,
            isPlaying: false,
            hasStarted: false,
          },
        });
      },
    }),
    {
      name: 'mdma-guide-session-state',
      version: SESSION_STORE_VERSION,
      partialize: (state) => {
        // Exclude transient UI state and runtime playback from persistence
        const { meditationPlayback: _meditationPlayback, activeFollowUpModule: _activeFollowUpModule, activePreSessionModule: _activePreSessionModule, ...rest } = state;
        return {
          ...rest,
          // Reset transient flags within nested objects
          comeUpCheckIn: {
            ...state.comeUpCheckIn,
            currentResponse: null,      // Transient UI selection — safe to reset
          },
          peakCheckIn: { isVisible: false },
          closingCheckIn: { isVisible: false },
          booster: {
            ...state.booster,
            // Restore modal visibility from status so booster survives page refresh
            // (same pattern as comeUpCheckIn preserving isVisible)
            isModalVisible: state.booster.status === 'prompted' || state.booster.status === 'snoozed',
            isMinimized: state.booster.status === 'snoozed',
          },
          phaseTransitions: {
            ...state.phaseTransitions,
            activeTransition: null,
            transitionCompleted: false,
          },
          modules: {
            ...state.modules,
            inOpenSpace: false,
          },
        };
      },
      migrate: migrateSessionState,
    }
  )
);

/**
 * Session state migration function.
 * Exported so useSessionHistoryStore can migrate archived sessions on restore.
 */
export function migrateSessionState(persistedState, version) {
        // If coming from version 1 or no version, reset to fresh state
        if (version < 2) {
          return undefined; // Return undefined to use initial state
        }

        // Apply each migration step cumulatively (no early returns)
        let state = { ...persistedState };

        // Version 2 → 3: Add preSubstanceActivity
        if (version < 3) {
          state.preSubstanceActivity = {
            substanceChecklistSubPhase: 'part1',
            completedActivities: [],
            touchstone: '',
            intentionJournalEntryId: null,
            focusJournalEntryId: null,
          };
        }

        // Version 3 → 4: Add booster state
        if (version < 4) {
          state.booster = {
            considerBooster: false,
            boosterPrepared: null,
            status: 'pending',
            boosterTakenAt: null,
            boosterDecisionAt: null,
            snoozeCount: 0,
            nextPromptAt: null,
            checkInResponses: {
              experienceQuality: null,
              physicalState: null,
              trajectory: null,
            },
            isModalVisible: false,
            isMinimized: false,
          };
        }

        // Version 4 → 5: Add transitionCaptures and closingCheckIn
        if (version < 5) {
          state.transitionCaptures = {
            peak: {
              bodySensations: [],
              oneWord: '',
              completedAt: null,
            },
            integration: {
              intentionEdited: false,
              editedIntention: '',
              focusChanged: false,
              newFocus: null,
              newRelationshipType: null,
              tailoredActivityFocus: null,
              tailoredActivityResponse: {},
              completedAt: null,
            },
            closing: {
              selfGratitude: '',
              futureMessage: '',
              commitment: '',
              completedAt: null,
            },
          };
          state.closingCheckIn = {
            isVisible: false,
          };
        }

        // Version 5 → 6: Convert all Date/ISO-string timestamps to milliseconds
        if (version < 6) {
          const toMs = (v) => {
            if (v == null) return null;
            if (typeof v === 'number') return v;
            const ms = new Date(v).getTime();
            return isNaN(ms) ? null : ms;
          };

          // substanceChecklist
          if (state.substanceChecklist) {
            state.substanceChecklist = {
              ...state.substanceChecklist,
              ingestionTime: toMs(state.substanceChecklist.ingestionTime),
            };
          }

          // timeline phases
          if (state.timeline?.phases) {
            const phases = { ...state.timeline.phases };
            for (const key of Object.keys(phases)) {
              if (phases[key]) {
                phases[key] = {
                  ...phases[key],
                  startedAt: toMs(phases[key].startedAt),
                  endedAt: toMs(phases[key].endedAt),
                };
              }
            }
            state.timeline = { ...state.timeline, phases };
          }

          // booster
          if (state.booster) {
            state.booster = {
              ...state.booster,
              boosterTakenAt: toMs(state.booster.boosterTakenAt),
              boosterDecisionAt: toMs(state.booster.boosterDecisionAt),
              nextPromptAt: toMs(state.booster.nextPromptAt),
            };
          }

          // comeUpCheckIn
          if (state.comeUpCheckIn) {
            state.comeUpCheckIn = {
              ...state.comeUpCheckIn,
              lastPromptAt: toMs(state.comeUpCheckIn.lastPromptAt),
            };
          }

          // session
          if (state.session) {
            state.session = {
              ...state.session,
              closedAt: toMs(state.session.closedAt),
            };
          }

          // followUp.unlockTimes
          if (state.followUp?.unlockTimes) {
            state.followUp = {
              ...state.followUp,
              unlockTimes: {
                checkIn: toMs(state.followUp.unlockTimes.checkIn),
                revisit: toMs(state.followUp.unlockTimes.revisit),
                integration: toMs(state.followUp.unlockTimes.integration),
              },
            };
          }

          // followUp.modules completedAt
          if (state.followUp?.modules) {
            const modules = { ...state.followUp.modules };
            for (const key of Object.keys(modules)) {
              if (modules[key]?.completedAt) {
                modules[key] = { ...modules[key], completedAt: toMs(modules[key].completedAt) };
              }
            }
            state.followUp = { ...state.followUp, modules };
          }

          // transitionCaptures completedAt
          if (state.transitionCaptures) {
            const tc = { ...state.transitionCaptures };
            for (const key of Object.keys(tc)) {
              if (tc[key]?.completedAt) {
                tc[key] = { ...tc[key], completedAt: toMs(tc[key].completedAt) };
              }
            }
            state.transitionCaptures = tc;
          }

          // modules.items (startedAt, completedAt)
          if (state.modules?.items) {
            state.modules = {
              ...state.modules,
              items: state.modules.items.map((m) => ({
                ...m,
                startedAt: toMs(m.startedAt),
                completedAt: toMs(m.completedAt),
              })),
            };
          }

          // modules.history (startedAt, completedAt)
          if (state.modules?.history) {
            state.modules = {
              ...state.modules,
              history: state.modules.history.map((m) => ({
                ...m,
                startedAt: toMs(m.startedAt),
                completedAt: toMs(m.completedAt),
              })),
            };
          }
        }

        // Version 6 → 7: Add protectorDialogue to transitionCaptures
        if (version < 7) {
          if (!state.transitionCaptures) {
            state.transitionCaptures = {};
          }
          if (!state.transitionCaptures.protectorDialogue) {
            // Old schema — will be migrated to new shape in v10→v11
            state.transitionCaptures.protectorDialogue = {
              protectorType: null,
              customProtectorName: '',
              bodyLocation: '',
              protectorMessage: '',
              completedAt: null,
            };
          }
        }

        // Version 7 → 8: Add stayWithIt to transitionCaptures
        if (version < 8) {
          if (!state.transitionCaptures) {
            state.transitionCaptures = {};
          }
          if (!state.transitionCaptures.stayWithIt) {
            state.transitionCaptures.stayWithIt = {
              checkInResponse: null,
              completedAt: null,
            };
          }
        }

        // Version 8 → 9: Add valuesCompass to transitionCaptures
        if (version < 9) {
          if (!state.transitionCaptures) {
            state.transitionCaptures = {};
          }
          if (!state.transitionCaptures.valuesCompass) {
            state.transitionCaptures.valuesCompass = {
              quadrants: null,
              completedAt: null,
            };
          }
        }

        // Version 9 → 10: Add boosterDoseMg to booster state
        if (version < 10) {
          if (state.booster) {
            state.booster = {
              ...state.booster,
              boosterDoseMg: state.booster.boosterDoseMg ?? null,
            };
          }
        }

        // Version 10 → 11: Migrate protectorDialogue from grid selection to open naming
        if (version < 11) {
          const pd = state.transitionCaptures?.protectorDialogue;
          if (pd) {
            const OLD_LABELS = {
              critic: 'The Critic', controller: 'The Controller', pleaser: 'The Pleaser',
              achiever: 'The Achiever', avoider: 'The Avoider', worrier: 'The Worrier',
              caretaker: 'The Caretaker',
            };
            const oldName = pd.protectorType === 'other'
              ? (pd.customProtectorName || '')
              : (OLD_LABELS[pd.protectorType] || '');

            state.transitionCaptures.protectorDialogue = {
              protectorName: oldName,
              protectorDescription: '',
              feelToward: { initial: null, recheck: null },
              bodyLocation: pd.bodyLocation || '',
              protectorMessage: pd.protectorMessage || '',
              completedAt: pd.completedAt || null,
            };
          }
        }

        // Version 11 → 12: Add valuesCompassFollowUp and journal fields
        if (version < 12) {
          // Add journal fields to valuesCompass transitionCaptures
          if (state.transitionCaptures?.valuesCompass) {
            state.transitionCaptures.valuesCompass = {
              ...state.transitionCaptures.valuesCompass,
              journalTowardMove: state.transitionCaptures.valuesCompass.journalTowardMove ?? null,
              journalMessageFromHere: state.transitionCaptures.valuesCompass.journalMessageFromHere ?? null,
            };
          }

          // Add valuesCompassFollowUp to followUp.modules
          if (state.followUp?.modules && !state.followUp.modules.valuesCompassFollowUp) {
            state.followUp = {
              ...state.followUp,
              modules: {
                ...state.followUp.modules,
                valuesCompassFollowUp: {
                  status: 'locked',
                  completedAt: null,
                  matrixEdited: false,
                  editedQuadrants: null,
                  matrixRevisit: null,
                  noticingAway: null,
                  noticingToward: null,
                  stuckLoopCheckin: null,
                  towardMoveStatus: { selection: null, response: null },
                  timeSpent: { selection: null, response: null },
                  messageResponse: null,
                  currentScreen: null,
                },
              },
            };
          }

          // Ensure valuesCompassFollowUp exists in unlockTimes (as null if not set)
          if (state.followUp?.unlockTimes && !('valuesCompassFollowUp' in state.followUp.unlockTimes)) {
            state.followUp = {
              ...state.followUp,
              unlockTimes: {
                ...state.followUp.unlockTimes,
              },
            };
            // Don't add a valuesCompassFollowUp key — it stays absent for users who didn't use VC
          }
        }

        // Version 12 → 13: Add sessionId
        if (version < 13) {
          state.sessionId = state.sessionId || null;
        }

        // Version 13 → 14: Add feltSense to transitionCaptures
        if (version < 14) {
          if (!state.transitionCaptures) {
            state.transitionCaptures = {};
          }
          if (!state.transitionCaptures.feltSense) {
            state.transitionCaptures.feltSense = {
              shiftCheckIn: null,
              completedAt: null,
            };
          }
        }

        // Version 14 → 15: Add lifeGraph state
        if (version < 15) {
          if (!state.lifeGraph) {
            state.lifeGraph = { milestones: [], graphGenerated: false, journalEntryId: null };
          }
        }

        // Version 15 → 16: Add theDescent to transitionCaptures
        if (version < 16) {
          if (!state.transitionCaptures) {
            state.transitionCaptures = {};
          }
          if (!state.transitionCaptures.theDescent) {
            state.transitionCaptures.theDescent = {
              mode: null,
              surfaceReaction: '',
              primaryEmotion: '',
              unsaidMessage: '',
              completedAt: null,
            };
          }
        }

        // Version 16 → 17: Add theCycle to transitionCaptures
        if (version < 17) {
          if (!state.transitionCaptures) {
            state.transitionCaptures = {};
          }
          if (!state.transitionCaptures.theCycle) {
            state.transitionCaptures.theCycle = {
              myPosition: null,
              myMoves: [],
              partnerMoves: [],
              cycleName: '',
              reflectionChoice: null,
              reflectionText: '',
              closingIntention: '',
              completedAt: null,
            };
          }
        }

        // Version 17 → 18: Add quickCapture and checkInResponse to theDescent
        if (version < 18) {
          if (!state.transitionCaptures) {
            state.transitionCaptures = {};
          }
          if (!state.transitionCaptures.theDescent) {
            state.transitionCaptures.theDescent = {
              mode: null,
              quickCapture: '',
              checkInResponse: null,
              surfaceReaction: '',
              primaryEmotion: '',
              unsaidMessage: '',
              completedAt: null,
            };
          } else {
            if (state.transitionCaptures.theDescent.quickCapture === undefined) {
              state.transitionCaptures.theDescent.quickCapture = '';
            }
            if (state.transitionCaptures.theDescent.checkInResponse === undefined) {
              state.transitionCaptures.theDescent.checkInResponse = null;
            }
          }
        }

        // Version 18 → 19: Expand theCycle schema for mode-aware redesign
        if (version < 19) {
          if (!state.transitionCaptures) {
            state.transitionCaptures = {};
          }
          const tc = state.transitionCaptures.theCycle || {};
          state.transitionCaptures.theCycle = {
            mode: tc.mode || null,
            myPosition: tc.myPosition || null,
            friction: tc.friction || '',
            myMoveId: tc.myMoveId || (tc.myMoves && tc.myMoves[0]) || null,
            myMoveMotivation: tc.myMoveMotivation || '',
            yourUnderneath: tc.yourUnderneath || '',
            theirMoveId: tc.theirMoveId || (tc.partnerMoves && tc.partnerMoves[0]) || null,
            theirUnderneath: tc.theirUnderneath || '',
            partnerMoveId: tc.partnerMoveId || null,
            partnerUnderneath: tc.partnerUnderneath || '',
            cycleName: tc.cycleName || '',
            meditationCapture: tc.meditationCapture || '',
            checkInResponse: tc.checkInResponse || null,
            journalSurprise: tc.journalSurprise || '',
            journalOtherSide: tc.journalOtherSide || '',
            journalStepOut: tc.journalStepOut || tc.closingIntention || '',
            journeyReflection: tc.journeyReflection || '',
            completedAt: tc.completedAt || null,
          };
        }

        // Version 19 -> 20: Add mappingTerritory to transitionCaptures
        if (version < 20) {
          if (!state.transitionCaptures) {
            state.transitionCaptures = {};
          }
          if (!state.transitionCaptures.mappingTerritory) {
            state.transitionCaptures.mappingTerritory = {
              copingPattern: null,
              approachStyle: null,
              askingForAttention: '',
              wordToSelf: '',
              completedAt: null,
            };
          }
        }

        // Version 20 -> 21: Add pendulation to transitionCaptures
        if (version < 21) {
          if (!state.transitionCaptures) {
            state.transitionCaptures = {};
          }
          if (!state.transitionCaptures.pendulation) {
            state.transitionCaptures.pendulation = {
              checkpoint1Response: null,
              checkpoint2Response: null,
              sectionsCompleted: [],
              completionSignals: [],
              dischargeCompletion: null,
              thawExperience: null,
              completedAt: null,
            };
          }
        }

        // Version 21 -> 22: Add shakingTheTree to transitionCaptures
        if (version < 22) {
          if (!state.transitionCaptures) {
            state.transitionCaptures = {};
          }
          if (!state.transitionCaptures.shakingTheTree) {
            state.transitionCaptures.shakingTheTree = {
              bodySensations: [],
              responseKey: null,
              completedAt: null,
            };
          }
        }

        // Version 22 -> 23: Add emergencyContactDetails to intake responses
        if (version < 23) {
          if (!state.intake?.responses?.emergencyContactDetails) {
            state.intake = {
              ...state.intake,
              responses: {
                ...state.intake?.responses,
                emergencyContactDetails: { name: '', phone: '' },
              },
            };
          }
        }

        // Version 23 -> 24: Consolidate user-entered data into sessionProfile.
        // Pulls fields out of intake.responses, the user-data subset of
        // substanceChecklist, and the intention artifacts of preSubstanceActivity.
        // After migration, those old paths are deleted from the slices that
        // shrank. The function is pure (no set/get) so it can run in both the
        // live persist middleware and the archive load path.
        if (version < 24) {
          state.sessionProfile = {
            // Identity (from intake.responses)
            experienceLevel: state.intake?.responses?.experienceLevel ?? null,
            sessionMode: state.intake?.responses?.sessionMode ?? null,
            hasPreparation: state.intake?.responses?.hasPreparation ?? null,
            primaryFocus: state.intake?.responses?.primaryFocus ?? null,
            relationshipType: state.intake?.responses?.relationshipType ?? null,
            holdingQuestion: state.intake?.responses?.holdingQuestion ?? '',
            emotionalState: state.intake?.responses?.emotionalState ?? null,
            guidanceLevel: state.intake?.responses?.guidanceLevel ?? null,
            activityPreferences: state.intake?.responses?.activityPreferences ?? [],
            considerBooster: state.intake?.responses?.considerBooster ?? null,
            promptFormat: state.intake?.responses?.promptFormat ?? null,
            sessionDuration: state.intake?.responses?.sessionDuration ?? null,
            startTime: state.intake?.responses?.startTime ?? null,
            safeSpace: state.intake?.responses?.safeSpace ?? null,
            hasWaterSnacks: state.intake?.responses?.hasWaterSnacks ?? null,
            emergencyContact: state.intake?.responses?.emergencyContact ?? null,
            emergencyContactDetails: state.intake?.responses?.emergencyContactDetails ?? { name: '', phone: '', notes: '' },
            medications: state.intake?.responses?.medications ?? { taking: false, details: '' },
            heartConditions: state.intake?.responses?.heartConditions ?? null,
            psychiatricHistory: state.intake?.responses?.psychiatricHistory ?? null,
            contraindicatedMedications: state.intake?.responses?.contraindicatedMedications ?? null,
            hasTested: state.intake?.responses?.hasTested ?? null,
            physicalPreparation: state.intake?.responses?.physicalPreparation ?? null,
            lastMDMAUse: state.intake?.responses?.lastMDMAUse ?? null,

            // Substance plan (from substanceChecklist)
            hasSubstance: state.substanceChecklist?.hasSubstance ?? null,
            hasTestedSubstance: state.substanceChecklist?.hasTestedSubstance ?? null,
            hasPreparedDosage: state.substanceChecklist?.hasPreparedDosage ?? null,
            plannedDosageMg: state.substanceChecklist?.plannedDosageMg ?? null,
            dosageFeedback: state.substanceChecklist?.dosageFeedback ?? null,

            // Intention artifacts (from preSubstanceActivity)
            touchstone: state.preSubstanceActivity?.touchstone ?? '',
            intentionJournalEntryId: state.preSubstanceActivity?.intentionJournalEntryId ?? null,
            focusJournalEntryId: state.preSubstanceActivity?.focusJournalEntryId ?? null,
          };

          // Strip the moved fields from their old homes so consumers don't see
          // stale data and we don't double-store anything in the persisted blob.
          if (state.intake) {
            delete state.intake.responses;
          }
          if (state.substanceChecklist) {
            delete state.substanceChecklist.hasSubstance;
            delete state.substanceChecklist.hasTestedSubstance;
            delete state.substanceChecklist.hasPreparedDosage;
            delete state.substanceChecklist.plannedDosageMg;
            delete state.substanceChecklist.dosageFeedback;
          }
          if (state.preSubstanceActivity) {
            delete state.preSubstanceActivity.touchstone;
            delete state.preSubstanceActivity.intentionJournalEntryId;
            delete state.preSubstanceActivity.focusJournalEntryId;
          }
        }

        // Version 24 → 25: Add notes field to emergencyContactDetails so the
        // helper modal's contact view can persist free-form notes the user
        // wants their emergency contact to see (availability, address, etc.).
        // Defaults are spread first so existing name/phone are preserved.
        if (version < 25) {
          if (state.sessionProfile?.emergencyContactDetails) {
            state.sessionProfile.emergencyContactDetails = {
              name: '',
              phone: '',
              notes: '',
              ...state.sessionProfile.emergencyContactDetails,
            };
          } else if (state.sessionProfile) {
            state.sessionProfile.emergencyContactDetails = { name: '', phone: '', notes: '' };
          }
        }

        // Version 25 → 26: Introduce transitionData slice for the new TransitionModule system.
        // Reads old transitionCaptures.{peak, integration, closing} into the new shape
        // and then deletes only those three transition-component sub-slices. Module-level
        // captures (protectorDialogue, valuesCompass, stayWithIt, ...) remain in transitionCaptures.
        if (version < 26) {
          const oldTC = state.transitionCaptures || {};
          const oldPeak = oldTC.peak || {};
          const oldIntegration = oldTC.integration || {};
          const oldClosing = oldTC.closing || {};

          state.transitionData = {
            somaticCheckIns: {
              opening: [],
              peak: oldPeak.bodySensations || [],
              integration: [],
              closing: [],
            },
            openingTouchstone: null,
            closingTouchstone: null,
            touchstoneArcReflection: null,
            oneWord: oldPeak.oneWord || null,
            intentionAdditions: {
              opening: null,
              integration: oldIntegration.editedIntention || null,
            },
            focusChanged: oldIntegration.focusChanged || false,
            newFocus: oldIntegration.newFocus || null,
            newRelationshipType: oldIntegration.newRelationshipType || null,
            tailoredActivityFocus: oldIntegration.tailoredActivityFocus || null,
            tailoredActivityResponse: oldIntegration.tailoredActivityResponse || {},
            selfGratitude: oldClosing.selfGratitude || null,
            futureMessage: oldClosing.futureMessage || null,
            commitment: oldClosing.commitment || null,
            completedAt: {
              opening: null,
              peak: oldPeak.completedAt || null,
              integration: oldIntegration.completedAt || null,
              closing: oldClosing.completedAt || null,
            },
            activeNavigation: {
              transitionId: null,
              currentSectionIndex: 0,
              visitedSections: [],
              routeStack: [],
              sectionHistory: [],
              screenIndex: 0,
              responses: {},
              selectorValues: {},
              selectorJournals: {},
              choiceValues: {},
              blockReadiness: {},
            },
          };

          // Remove only the three transition-component sub-slices; keep module captures
          if (state.transitionCaptures) {
            const { peak: _p, integration: _i, closing: _c, ...rest } = state.transitionCaptures;
            state.transitionCaptures = rest;
          }
        }

        return state;
}

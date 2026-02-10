/**
 * Session Store
 * Central state management for session flow, intake, timeline, and modules
 * Refactored to support phase-based timeline with editable modules
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getModuleById } from '../content/modules';
import { useAppStore } from './useAppStore';
import { precacheAudioForModule, precacheAudioForTimeline, precacheComposerAssets } from '../services/audioCacheService';

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

      // ============================================
      // INTAKE QUESTIONNAIRE STATE
      // ============================================
      intake: {
        currentSection: 'A',
        currentQuestionIndex: 0,    // Track which question user is on
        responses: {
          // Section A: Experience & Context
          experienceLevel: null,
          sessionMode: null,
          hasPreparation: null,

          // Section B: Intention & Focus
          primaryFocus: null,
          relationshipType: null,
          holdingQuestion: '',
          emotionalState: null,

          // Section C: Session Preferences
          guidanceLevel: null,
          activityPreferences: [],
          considerBooster: null,
          promptFormat: null,
          sessionDuration: null,
          startTime: null,

          // Section D: Safety & Practicality
          safeSpace: null,
          hasWaterSnacks: null,
          emergencyContact: null,
          medications: { taking: false, details: '' },
          heartConditions: null,
          psychiatricHistory: null,
        },
        isComplete: false,
        showSafetyWarnings: false,
        showMedicationWarning: false,
      },

      // ============================================
      // SUBSTANCE CHECKLIST (Pre-Session)
      // ============================================
      substanceChecklist: {
        hasSubstance: null,          // boolean
        hasTestedSubstance: null,    // boolean
        hasPreparedDosage: null,     // boolean
        plannedDosageMg: null,       // number in mg
        dosageFeedback: null,        // 'light' | 'moderate' | 'strong' | 'heavy'
        hasTakenSubstance: false,    // boolean
        ingestionTime: null,         // Date - when user took substance
        ingestionTimeConfirmed: false,
      },

      // ============================================
      // PRE-SUBSTANCE ACTIVITY STATE
      // ============================================
      preSubstanceActivity: {
        // Sub-phase navigation within substance-checklist
        // 'part1' | 'pre-session-intro'
        substanceChecklistSubPhase: 'part1',
        // Track which activities have been completed
        completedActivities: [],    // ['intention', 'centering-breath']
        // Touchstone: word/phrase captured during intention review
        touchstone: '',             // Available throughout session
        // Journal entry ID for the persistent intention entry
        intentionJournalEntryId: null,
        // Journal entry ID for the session focus entry (separate)
        focusJournalEntryId: null,
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
        waitingForCheckIn: false,     // Is a module waiting for check-in before starting
        hasIndicatedFullyArrived: false, // User said fully-arrived but chose to remain in come-up
        showEndOfPhaseChoice: false,  // Show the end-of-phase choice page
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
      },

      // ============================================
      // FOLLOW-UP SESSION STATE
      // ============================================
      followUp: {
        // Unlock times calculated from session.closedAt
        unlockTimes: {
          checkIn: null,      // closedAt + 24 hours
          revisit: null,      // closedAt + 24 hours
          integration: null,  // closedAt + 48 hours
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
        },
      },

      // Active follow-up module (renders in Active tab)
      activeFollowUpModule: null, // 'checkIn' | 'revisit' | 'integration' | null

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
          intake: { ...get().intake, currentSection: 'A' },
        });
      },

      updateIntakeResponse: (_section, field, value) => {
        const state = get();
        set({
          intake: {
            ...state.intake,
            responses: {
              ...state.intake.responses,
              [field]: value,
            },
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
        const responses = state.intake.responses;

        // Check for safety warnings
        const showSafetyWarnings =
          responses.safeSpace === 'no' ||
          responses.emergencyContact === 'no-concerned' ||
          responses.heartConditions === 'yes' ||
          responses.psychiatricHistory === 'yes';

        const showMedicationWarning = responses.medications?.taking;

        // Calculate target duration from intake
        let targetDuration = 240; // default 4 hours
        if (responses.sessionDuration === '3-4h') targetDuration = 210;
        else if (responses.sessionDuration === '4-6h') targetDuration = 300;
        else if (responses.sessionDuration === '6+h') targetDuration = 420;

        // Determine if user wants to consider a booster
        const considerBooster = responses.considerBooster === 'yes' || responses.considerBooster === 'decide-later';

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
            scheduledStartTime: responses.startTime,
          },
          booster: {
            ...state.booster,
            considerBooster,
          },
        });

        // Generate timeline from intake responses
        get().generateTimelineFromIntake();
      },

      // ============================================
      // TIMELINE GENERATION
      // ============================================

      generateTimelineFromIntake: () => {
        const state = get();
        const responses = state.intake.responses;

        // Calculate phase durations
        const comeUpDuration = 45; // Max allocated
        const peakDuration = 90;

        // Fixed default timeline — same for all intake responses.
        // Intake preferences are collected for future use when more modules are available.
        let defaultModules = [];

        // === COME-UP MODULES ===
        defaultModules.push({
          instanceId: generateId(),
          libraryId: 'simple-grounding',
          phase: 'come-up',
          title: 'Simple Grounding',
          duration: 5,
          status: 'upcoming',
          order: 0,
          content: getModuleById('simple-grounding')?.content || {},
          startedAt: null,
          completedAt: null,
        });

        defaultModules.push({
          instanceId: generateId(),
          libraryId: 'music-listening',
          phase: 'come-up',
          title: 'Music Immersion',
          duration: 20,
          status: 'upcoming',
          order: 1,
          content: getModuleById('music-listening')?.content || {},
          startedAt: null,
          completedAt: null,
        });

        defaultModules.push({
          instanceId: generateId(),
          libraryId: 'open-space',
          phase: 'come-up',
          title: 'Open Space',
          duration: 20,
          status: 'upcoming',
          order: 2,
          content: getModuleById('open-space')?.content || {},
          startedAt: null,
          completedAt: null,
        });

        // === PEAK MODULES ===
        defaultModules.push({
          instanceId: generateId(),
          libraryId: 'body-scan',
          phase: 'peak',
          title: 'Body Scan',
          duration: 10,
          status: 'upcoming',
          order: 0,
          content: getModuleById('body-scan')?.content || {},
          startedAt: null,
          completedAt: null,
        });

        defaultModules.push({
          instanceId: generateId(),
          libraryId: 'self-compassion',
          phase: 'peak',
          title: 'Self-Compassion',
          duration: 11,
          status: 'upcoming',
          order: 1,
          content: getModuleById('self-compassion')?.content || {},
          startedAt: null,
          completedAt: null,
        });

        defaultModules.push({
          instanceId: generateId(),
          libraryId: 'letter-writing',
          phase: 'peak',
          title: 'Letter Writing',
          duration: 25,
          status: 'upcoming',
          order: 2,
          content: getModuleById('letter-writing')?.content || {},
          startedAt: null,
          completedAt: null,
        });

        defaultModules.push({
          instanceId: generateId(),
          libraryId: 'music-listening',
          phase: 'peak',
          title: 'Music Immersion',
          duration: 20,
          status: 'upcoming',
          order: 3,
          content: getModuleById('music-listening')?.content || {},
          startedAt: null,
          completedAt: null,
        });

        // Booster check-in — independent of other preferences
        const considerBooster = responses.considerBooster === 'yes' || responses.considerBooster === 'decide-later';
        if (considerBooster) {
          // Re-order peak modules to insert booster after the first module
          defaultModules = defaultModules.map(m => {
            if (m.phase === 'peak' && m.order >= 1) {
              return { ...m, order: m.order + 1 };
            }
            return m;
          });

          defaultModules.push({
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

        // === INTEGRATION MODULES ===
        defaultModules.push({
          instanceId: generateId(),
          libraryId: 'open-awareness',
          phase: 'integration',
          title: 'Open Awareness',
          duration: 15,
          status: 'upcoming',
          order: 0,
          content: getModuleById('open-awareness')?.content || {},
          startedAt: null,
          completedAt: null,
        });

        defaultModules.push({
          instanceId: generateId(),
          libraryId: 'parts-work',
          phase: 'integration',
          title: 'Parts Work',
          duration: 30,
          status: 'upcoming',
          order: 1,
          content: getModuleById('parts-work')?.content || {},
          startedAt: null,
          completedAt: null,
        });

        defaultModules.push({
          instanceId: generateId(),
          libraryId: 'music-listening',
          phase: 'integration',
          title: 'Music Immersion',
          duration: 20,
          status: 'upcoming',
          order: 2,
          content: getModuleById('music-listening')?.content || {},
          startedAt: null,
          completedAt: null,
        });

        // NOTE: Closing ritual is now handled as a transition flow (ClosingCheckIn + ClosingRitual)
        // triggered automatically when all integration modules complete

        const adjustedPeakDuration = peakDuration;
        const adjustedIntegrationDuration = state.timeline.targetDuration - comeUpDuration - adjustedPeakDuration;

        set({
          modules: {
            ...state.modules,
            items: defaultModules,
          },
          timeline: {
            ...state.timeline,
            phases: {
              comeUp: { ...state.timeline.phases.comeUp, allocatedDuration: comeUpDuration },
              peak: { ...state.timeline.phases.peak, allocatedDuration: adjustedPeakDuration },
              integration: { ...state.timeline.phases.integration, allocatedDuration: adjustedIntegrationDuration },
            },
          },
        });

        // Precache audio for all modules in the generated timeline (non-blocking)
        precacheAudioForTimeline(defaultModules);
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

      removeModule: (instanceId) => {
        const state = get();
        const moduleToRemove = state.modules.items.find((m) => m.instanceId === instanceId);
        if (!moduleToRemove) return;

        // Remove and reorder remaining modules in that phase
        const updatedItems = state.modules.items
          .filter((m) => m.instanceId !== instanceId)
          .map((m) => {
            if (m.phase === moduleToRemove.phase && m.order > moduleToRemove.order) {
              return { ...m, order: m.order - 1 };
            }
            return m;
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

      updateSubstanceChecklist: (field, value) => {
        const state = get();
        let updates = { [field]: value };

        // Calculate dosage feedback when dosage is entered
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
          substanceChecklist: {
            ...state.substanceChecklist,
            ...updates,
          },
        });
      },

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

      setTouchstone: (phrase) => {
        set({
          preSubstanceActivity: {
            ...get().preSubstanceActivity,
            touchstone: phrase,
          },
        });
      },

      setIntentionJournalEntryId: (id) => {
        set({
          preSubstanceActivity: {
            ...get().preSubstanceActivity,
            intentionJournalEntryId: id,
          },
        });
      },

      setFocusJournalEntryId: (id) => {
        set({
          preSubstanceActivity: {
            ...get().preSubstanceActivity,
            focusJournalEntryId: id,
          },
        });
      },

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
          } catch (e) {
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

      takeBooster: (timestamp = Date.now()) => {
        const state = get();
        set({
          booster: {
            ...state.booster,
            status: 'taken',
            boosterTakenAt: timestamp,
            boosterDecisionAt: Date.now(),
            isModalVisible: false,
          },
        });
        // Resume module timer
        if (state.meditationPlayback.hasStarted && !state.meditationPlayback.isPlaying) {
          get().resumeMeditationPlayback();
        }
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
        set({
          booster: {
            ...state.booster,
            status: 'skipped',
            boosterDecisionAt: Date.now(),
            isModalVisible: false,
          },
        });
        // Resume module timer
        if (state.meditationPlayback.hasStarted && !state.meditationPlayback.isPlaying) {
          get().resumeMeditationPlayback();
        }
      },

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
            isVisible: true,
            isMinimized: true, // Start minimized; expands after first module completes
            introCompleted: true,
            promptCount: 0, // Don't count initial minimized state as a prompt
            lastPromptAt: now,
          },
        });
      },

      // ============================================
      // COME-UP CHECK-IN ACTIONS
      // ============================================

      showCheckInModal: () => {
        const state = get();
        set({
          comeUpCheckIn: {
            ...state.comeUpCheckIn,
            isVisible: true,
            isMinimized: false,
            promptCount: state.comeUpCheckIn.promptCount + 1,
            lastPromptAt: Date.now(),
          },
        });
      },

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

        // If fully arrived, show end-of-phase choice instead of immediately transitioning
        if (response === 'fully-arrived') {
          updates.comeUpCheckIn.hasIndicatedFullyArrived = true;
          updates.comeUpCheckIn.showEndOfPhaseChoice = true;
        }

        set(updates);
      },

      setWaitingForCheckIn: (waiting) => {
        set({
          comeUpCheckIn: {
            ...get().comeUpCheckIn,
            waitingForCheckIn: waiting,
          },
        });
      },

      dismissEndOfPhaseChoice: () => {
        set({
          comeUpCheckIn: {
            ...get().comeUpCheckIn,
            showEndOfPhaseChoice: false,
            isMinimized: true,
          },
        });
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
        const DAY_MS = 24 * 60 * 60 * 1000;

        // Calculate elapsed seconds
        const ingestionTime = state.substanceChecklist?.ingestionTime;
        const finalDurationSeconds = ingestionTime
          ? Math.floor((now - ingestionTime) / 1000)
          : null;

        set({
          sessionPhase: 'completed',
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
          },
          // Follow-up unlock times (millisecond timestamps)
          followUp: {
            ...state.followUp,
            unlockTimes: {
              checkIn: now + DAY_MS,
              revisit: now + DAY_MS,
              integration: now + 2 * DAY_MS,
            },
          },
        });
      },

      // ============================================
      // FOLLOW-UP SESSION ACTIONS
      // ============================================

      // Check and update follow-up module availability based on current time
      checkFollowUpAvailability: () => {
        const state = get();
        const now = Date.now();
        const { unlockTimes, modules } = state.followUp;

        if (!unlockTimes.checkIn) return; // No unlock times set

        const updates = {};

        // Check each module's unlock status
        ['checkIn', 'revisit', 'integration'].forEach((moduleId) => {
          const unlockTime = unlockTimes[moduleId];
          const module = modules[moduleId];

          if (module.status === 'locked' && unlockTime && now >= unlockTime) {
            updates[moduleId] = { ...module, status: 'available' };
          }
        });

        // Only update if there are changes
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
      // MODULE RUNTIME
      // ============================================

      startModule: (instanceId) => {
        const state = get();
        // Never start a booster module — it's purely a visual timeline indicator
        const module = state.modules.items.find((m) => m.instanceId === instanceId);
        if (!module || module.isBoosterModule) return;

        set({
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
        });
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
                showEndOfPhaseChoice: true,
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
                showEndOfPhaseChoice: true,
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

      resetSession: () => {
        set({
          sessionPhase: 'not-started',
          intake: {
            currentSection: 'A',
            responses: {
              experienceLevel: null,
              sessionMode: null,
              hasPreparation: null,
              primaryFocus: null,
              relationshipType: null,
              holdingQuestion: '',
              emotionalState: null,
              guidanceLevel: null,
              activityPreferences: [],
              considerBooster: null,
              promptFormat: null,
              sessionDuration: null,
              startTime: null,
              safeSpace: null,
              hasWaterSnacks: null,
              emergencyContact: null,
              medications: { taking: false, details: '' },
              heartConditions: null,
              psychiatricHistory: null,
            },
            isComplete: false,
            showSafetyWarnings: false,
            showMedicationWarning: false,
          },
          substanceChecklist: {
            hasSubstance: null,
            hasTestedSubstance: null,
            hasPreparedDosage: null,
            plannedDosageMg: null,
            dosageFeedback: null,
            hasTakenSubstance: false,
            ingestionTime: null,
            ingestionTimeConfirmed: false,
          },
          preSubstanceActivity: {
            substanceChecklistSubPhase: 'part1',
            completedActivities: [],
            touchstone: '',
            intentionJournalEntryId: null,
            focusJournalEntryId: null,
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
            waitingForCheckIn: false,
            hasIndicatedFullyArrived: false,
            showEndOfPhaseChoice: false,
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
          },
          closingCheckIn: {
            isVisible: false,
          },
          session: {
            closedAt: null,
            finalDurationSeconds: null,
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
      version: 6, // Increment this when schema changes to force reset
      partialize: (state) => {
        // Exclude transient UI state and runtime playback from persistence
        const { meditationPlayback, activeFollowUpModule, ...rest } = state;
        return {
          ...rest,
          // Reset transient flags within nested objects
          comeUpCheckIn: {
            ...state.comeUpCheckIn,
            currentResponse: null,      // Transient UI selection — safe to reset
            waitingForCheckIn: false,    // Transient flag — safe to reset
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
      migrate: (persistedState, version) => {
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

        return state;
      },
    }
  )
);

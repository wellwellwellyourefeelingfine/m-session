/**
 * Session Store
 * Central state management for session flow, intake, timeline, and modules
 * Refactored to support phase-based timeline with editable modules
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getModuleById } from '../content/modules';

// Helper to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

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
      // TIMELINE STATE
      // ============================================
      timeline: {
        // Time configuration
        scheduledStartTime: null,     // From intake (optional)
        actualStartTime: null,        // When session truly began (after substance checklist)
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
        introCompleted: false,        // Has the intro phase completed
        waitingForCheckIn: false,     // Is a module waiting for check-in before starting
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
        const preferences = responses.activityPreferences || [];

        // Calculate phase durations
        const comeUpDuration = 45; // Max allocated
        const peakDuration = 90;
        const integrationDuration = state.timeline.targetDuration - comeUpDuration - peakDuration;

        // Build default modules based on preferences and experience
        const defaultModules = [];
        let moduleOrder = 0;

        // === COME-UP MODULES ===
        // Always start with grounding
        defaultModules.push({
          instanceId: generateId(),
          libraryId: 'grounding-basic',
          phase: 'come-up',
          title: 'Grounding Meditation',
          duration: 10,
          status: 'upcoming',
          order: moduleOrder++,
          content: getModuleById('grounding-basic')?.content || {},
          startedAt: null,
          completedAt: null,
        });

        // Add breathing if user likes it
        if (preferences.includes('breathing') || preferences.length === 0) {
          defaultModules.push({
            instanceId: generateId(),
            libraryId: 'breathing-4-7-8',
            phase: 'come-up',
            title: '4-7-8 Breathing',
            duration: 10,
            status: 'upcoming',
            order: moduleOrder++,
            content: getModuleById('breathing-4-7-8')?.content || {},
            startedAt: null,
            completedAt: null,
          });
        }

        // Add music or body scan
        if (preferences.includes('music')) {
          defaultModules.push({
            instanceId: generateId(),
            libraryId: 'music-listening',
            phase: 'come-up',
            title: 'Music Immersion',
            duration: 15,
            status: 'upcoming',
            order: moduleOrder++,
            content: getModuleById('music-listening')?.content || {},
            startedAt: null,
            completedAt: null,
          });
        } else {
          defaultModules.push({
            instanceId: generateId(),
            libraryId: 'body-scan-light',
            phase: 'come-up',
            title: 'Light Body Scan',
            duration: 15,
            status: 'upcoming',
            order: moduleOrder++,
            content: getModuleById('body-scan-light')?.content || {},
            startedAt: null,
            completedAt: null,
          });
        }

        // === PEAK MODULES ===
        moduleOrder = 0; // Reset for new phase

        defaultModules.push({
          instanceId: generateId(),
          libraryId: 'open-awareness',
          phase: 'peak',
          title: 'Open Awareness',
          duration: 30,
          status: 'upcoming',
          order: moduleOrder++,
          content: getModuleById('open-awareness')?.content || {},
          startedAt: null,
          completedAt: null,
        });

        if (preferences.includes('journaling')) {
          defaultModules.push({
            instanceId: generateId(),
            libraryId: 'light-journaling',
            phase: 'peak',
            title: 'Light Journaling',
            duration: 20,
            status: 'upcoming',
            order: moduleOrder++,
            content: getModuleById('light-journaling')?.content || {},
            startedAt: null,
            completedAt: null,
          });
        }

        defaultModules.push({
          instanceId: generateId(),
          libraryId: 'self-compassion',
          phase: 'peak',
          title: 'Self-Compassion Practice',
          duration: 15,
          status: 'upcoming',
          order: moduleOrder++,
          content: getModuleById('self-compassion')?.content || {},
          startedAt: null,
          completedAt: null,
        });

        // === INTEGRATION MODULES ===
        moduleOrder = 0;

        if (preferences.includes('journaling')) {
          defaultModules.push({
            instanceId: generateId(),
            libraryId: 'deep-journaling',
            phase: 'integration',
            title: 'Deep Journaling',
            duration: 30,
            status: 'upcoming',
            order: moduleOrder++,
            content: getModuleById('deep-journaling')?.content || {},
            startedAt: null,
            completedAt: null,
          });
        }

        if (preferences.includes('meditation')) {
          defaultModules.push({
            instanceId: generateId(),
            libraryId: 'body-scan-deep',
            phase: 'integration',
            title: 'Deep Body Exploration',
            duration: 25,
            status: 'upcoming',
            order: moduleOrder++,
            content: getModuleById('body-scan-deep')?.content || {},
            startedAt: null,
            completedAt: null,
          });
        }

        // Add letter writing for relationship focus
        if (responses.primaryFocus === 'relationship') {
          defaultModules.push({
            instanceId: generateId(),
            libraryId: 'letter-writing',
            phase: 'integration',
            title: 'Letter Writing',
            duration: 25,
            status: 'upcoming',
            order: moduleOrder++,
            content: getModuleById('letter-writing')?.content || {},
            startedAt: null,
            completedAt: null,
          });
        }

        // Always end with closing ritual
        defaultModules.push({
          instanceId: generateId(),
          libraryId: 'closing-ritual',
          phase: 'integration',
          title: 'Closing Ritual',
          duration: 15,
          status: 'upcoming',
          order: moduleOrder++,
          content: getModuleById('closing-ritual')?.content || {},
          startedAt: null,
          completedAt: null,
        });

        set({
          modules: {
            ...state.modules,
            items: defaultModules,
          },
          timeline: {
            ...state.timeline,
            phases: {
              comeUp: { ...state.timeline.phases.comeUp, allocatedDuration: comeUpDuration },
              peak: { ...state.timeline.phases.peak, allocatedDuration: peakDuration },
              integration: { ...state.timeline.phases.integration, allocatedDuration: integrationDuration },
            },
          },
        });
      },

      // ============================================
      // MODULE EDITING (Pre-Session)
      // ============================================

      addModule: (libraryId, phase, position = null) => {
        const state = get();
        const libraryModule = getModuleById(libraryId);
        if (!libraryModule) return { success: false, error: 'Module not found' };

        // Get modules in this phase to determine order
        const phaseModules = state.modules.items.filter((m) => m.phase === phase);
        const newOrder = position !== null ? position : phaseModules.length;

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
          startedAt: null,
          completedAt: null,
        };

        set({
          modules: {
            ...state.modules,
            items: [...updatedItems, newModule],
          },
        });

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

        set({
          modules: {
            ...state.modules,
            items: updatedItems,
          },
        });
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

      recordIngestionTime: (time = new Date()) => {
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
      // SESSION CONTROL
      // ============================================

      startSession: () => {
        const state = get();
        if (state.modules.items.length === 0) {
          console.error('Cannot start session: no modules in timeline');
          return;
        }

        const now = new Date();

        set({
          sessionPhase: 'active',
          timeline: {
            ...state.timeline,
            actualStartTime: now,
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
            isVisible: false,
            isMinimized: true,
            introCompleted: false,
          },
        });
      },

      // Complete the intro and show first check-in
      completeIntro: () => {
        const state = get();
        set({
          comeUpCheckIn: {
            ...state.comeUpCheckIn,
            introCompleted: true,
            isVisible: true,
            isMinimized: false,
            promptCount: 1,
            lastPromptAt: new Date(),
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
            lastPromptAt: new Date(),
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
        const now = new Date();
        const ingestionTime = state.substanceChecklist.ingestionTime;
        const minutesSinceIngestion = ingestionTime
          ? Math.floor((now - new Date(ingestionTime)) / (1000 * 60))
          : 0;

        // If "fully-arrived" and less than 20 minutes, we'll need confirmation
        // This is handled by the component showing a follow-up question

        set({
          comeUpCheckIn: {
            ...state.comeUpCheckIn,
            currentResponse: response,
            responses: [
              ...state.comeUpCheckIn.responses,
              { response, timestamp: now, minutesSinceIngestion },
            ],
            isMinimized: true,
            waitingForCheckIn: false,
          },
        });

        // If fully arrived, transition to peak phase
        if (response === 'fully-arrived') {
          get().transitionToPeak();
        }
      },

      setWaitingForCheckIn: (waiting) => {
        set({
          comeUpCheckIn: {
            ...get().comeUpCheckIn,
            waitingForCheckIn: waiting,
          },
        });
      },

      // ============================================
      // PHASE TRANSITIONS
      // ============================================

      transitionToPeak: () => {
        const state = get();
        const now = new Date();

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
          comeUpCheckIn: {
            ...state.comeUpCheckIn,
            isVisible: false,
            isMinimized: true,
          },
          modules: {
            ...state.modules,
            // Auto-start first peak module if available
            currentModuleInstanceId: firstPeakModule?.instanceId || null,
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

      transitionToIntegration: () => {
        const state = get();
        const now = new Date();

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
          modules: {
            ...state.modules,
            // Auto-start first integration module if available
            currentModuleInstanceId: firstIntegrationModule?.instanceId || null,
            items: firstIntegrationModule
              ? state.modules.items.map((m) =>
                  m.instanceId === firstIntegrationModule.instanceId
                    ? { ...m, status: 'active', startedAt: now }
                    : m
                )
              : state.modules.items,
          },
        });
      },

      // ============================================
      // MODULE RUNTIME
      // ============================================

      startModule: (instanceId) => {
        const state = get();
        set({
          modules: {
            ...state.modules,
            currentModuleInstanceId: instanceId,
            items: state.modules.items.map((m) =>
              m.instanceId === instanceId
                ? { ...m, status: 'active', startedAt: new Date() }
                : m
            ),
          },
        });
      },

      completeModule: (instanceId) => {
        const state = get();
        const module = state.modules.items.find((m) => m.instanceId === instanceId);
        if (!module) return;

        const now = new Date();
        const currentPhase = state.timeline.currentPhase;

        // Add to history
        const historyEntry = {
          ...module,
          status: 'completed',
          completedAt: now,
          actualDuration: module.startedAt
            ? Math.floor((now - new Date(module.startedAt)) / 1000)
            : module.duration * 60,
        };

        // Update the module items first (mark as completed)
        const updatedItems = state.modules.items.map((m) =>
          m.instanceId === instanceId
            ? { ...m, status: 'completed', completedAt: now }
            : m
        );

        // Find next module in current phase
        const nextModule = updatedItems
          .filter((m) => m.phase === currentPhase && m.status === 'upcoming')
          .sort((a, b) => a.order - b.order)[0];

        // If in come-up phase, set waiting for check-in before next module
        if (currentPhase === 'come-up') {
          set({
            modules: {
              ...state.modules,
              currentModuleInstanceId: null,
              items: updatedItems,
              history: [...state.modules.history, historyEntry],
            },
            comeUpCheckIn: {
              ...state.comeUpCheckIn,
              waitingForCheckIn: true,
              isMinimized: false,
              promptCount: state.comeUpCheckIn.promptCount + 1,
              lastPromptAt: now,
            },
          });
        } else if (nextModule) {
          // For peak/integration phases, auto-start next module
          set({
            modules: {
              ...state.modules,
              currentModuleInstanceId: nextModule.instanceId,
              items: updatedItems.map((m) =>
                m.instanceId === nextModule.instanceId
                  ? { ...m, status: 'active', startedAt: now }
                  : m
              ),
              history: [...state.modules.history, historyEntry],
            },
          });
        } else {
          // No more modules in this phase
          set({
            modules: {
              ...state.modules,
              currentModuleInstanceId: null,
              items: updatedItems,
              history: [...state.modules.history, historyEntry],
            },
          });
        }
      },

      skipModule: (instanceId) => {
        const state = get();
        const module = state.modules.items.find((m) => m.instanceId === instanceId);
        if (!module) return;

        const now = new Date();
        const currentPhase = state.timeline.currentPhase;

        // Update the module items first (mark as skipped)
        const updatedItems = state.modules.items.map((m) =>
          m.instanceId === instanceId
            ? { ...m, status: 'skipped', completedAt: now }
            : m
        );

        // Find next module in current phase
        const nextModule = updatedItems
          .filter((m) => m.phase === currentPhase && m.status === 'upcoming')
          .sort((a, b) => a.order - b.order)[0];

        const historyEntry = { ...module, status: 'skipped', completedAt: now };

        // If in come-up phase, set waiting for check-in before next module
        if (currentPhase === 'come-up') {
          set({
            modules: {
              ...state.modules,
              currentModuleInstanceId: null,
              items: updatedItems,
              history: [...state.modules.history, historyEntry],
            },
            comeUpCheckIn: {
              ...state.comeUpCheckIn,
              waitingForCheckIn: true,
              isMinimized: false,
              promptCount: state.comeUpCheckIn.promptCount + 1,
              lastPromptAt: now,
            },
          });
        } else if (nextModule) {
          // For peak/integration phases, auto-start next module
          set({
            modules: {
              ...state.modules,
              currentModuleInstanceId: nextModule.instanceId,
              items: updatedItems.map((m) =>
                m.instanceId === nextModule.instanceId
                  ? { ...m, status: 'active', startedAt: now }
                  : m
              ),
              history: [...state.modules.history, historyEntry],
            },
          });
        } else {
          // No more modules in this phase
          set({
            modules: {
              ...state.modules,
              currentModuleInstanceId: null,
              items: updatedItems,
              history: [...state.modules.history, historyEntry],
            },
          });
        }
      },

      // Get the next module to start in the current phase
      getNextModule: () => {
        const state = get();
        const currentPhase = state.timeline.currentPhase;
        if (!currentPhase) return null;

        const phaseModules = state.modules.items
          .filter((m) => m.phase === currentPhase && m.status === 'upcoming')
          .sort((a, b) => a.order - b.order);

        return phaseModules[0] || null;
      },

      // Get current active module
      getCurrentModule: () => {
        const state = get();
        if (!state.modules.currentModuleInstanceId) return null;
        return state.modules.items.find(
          (m) => m.instanceId === state.modules.currentModuleInstanceId
        );
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
                endedAt: new Date(),
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
        if (!state.timeline.actualStartTime) return 0;
        return Math.floor(
          (Date.now() - new Date(state.timeline.actualStartTime)) / (1000 * 60)
        );
      },

      getMinutesSinceIngestion: () => {
        const state = get();
        if (!state.substanceChecklist.ingestionTime) return 0;
        return Math.floor(
          (Date.now() - new Date(state.substanceChecklist.ingestionTime)) / (1000 * 60)
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
            valid: false,
            totalDuration,
            maxDuration: state.timeline.phases.comeUp.maxDuration,
            error: `Come-up modules exceed the maximum ${state.timeline.phases.comeUp.maxDuration} minutes for this phase.`,
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
          timeline: {
            scheduledStartTime: null,
            actualStartTime: null,
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
          },
        });
      },
    }),
    {
      name: 'mdma-guide-session-state',
      version: 2, // Increment this when schema changes to force reset
      migrate: (persistedState, version) => {
        // If coming from version 1 or no version, reset to fresh state
        if (version < 2) {
          return undefined; // Return undefined to use initial state
        }
        return persistedState;
      },
    }
  )
);

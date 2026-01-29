/**
 * SettingsTool Component
 * Accessibility and app preferences
 */

import { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useToolsStore } from '../../stores/useToolsStore';
import { getModuleById } from '../../content/modules';
import { downloadSessionData } from '../../utils/downloadSessionData';

export default function SettingsTool() {
  const darkMode = useAppStore((state) => state.darkMode);
  const toggleDarkMode = useAppStore((state) => state.toggleDarkMode);
  const preferences = useAppStore((state) => state.preferences);
  const setPreference = useAppStore((state) => state.setPreference);
  const resetSession = useSessionStore((state) => state.resetSession);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(null); // null | 'txt' | 'json'

  const handleReset = () => {
    resetSession();
    useJournalStore.setState({ entries: [], navigation: { currentView: 'editor', activeEntryId: null } });
    useToolsStore.setState({ openTools: [], timerDuration: 0, timerRemaining: 0, timerActive: false, timerStartTime: null });
    setShowResetConfirm(false);
  };

  const handleDownloadConfirm = (format) => {
    downloadSessionData(format);
    setShowDownloadConfirm(null);
  };

  return (
    <div className="py-6 px-6 max-w-xl mx-auto">
      <div className="space-y-6">
        {/* Dark Mode */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Appearance</span>
          <button
            onClick={toggleDarkMode}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {darkMode ? 'DARK' : 'LIGHT'}
          </button>
        </div>

        {/* Auto-Advance Modules */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Auto-Advance</span>
          <button
            onClick={() => setPreference('autoAdvance', !preferences.autoAdvance)}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {preferences.autoAdvance ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Notifications</span>
          <button
            onClick={async () => {
              if (!preferences.notificationsEnabled) {
                // Turning on: request permission
                if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
                  const permission = await Notification.requestPermission();
                  if (permission === 'granted') {
                    setPreference('notificationsEnabled', true);
                  }
                } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                  setPreference('notificationsEnabled', true);
                }
              } else {
                setPreference('notificationsEnabled', false);
              }
            }}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {preferences.notificationsEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Reduce Motion */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Reduce Motion</span>
          <button
            onClick={() => setPreference('reduceMotion', !preferences.reduceMotion)}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {preferences.reduceMotion ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Timer Sound */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Timer Sound</span>
          <button
            onClick={() => setPreference('timerSound', !preferences.timerSound)}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace' }}
          >
            {preferences.timerSound ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Download Data */}
        <div className="py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] uppercase tracking-wider">Download Data</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDownloadConfirm('txt')}
              className="flex-1 py-2 text-[11px] uppercase tracking-wider hover:opacity-70 transition-opacity border border-[var(--color-border)]"
              style={{ fontFamily: 'Azeret Mono, monospace' }}
            >
              Text File
            </button>
            <button
              onClick={() => setShowDownloadConfirm('json')}
              className="flex-1 py-2 text-[11px] uppercase tracking-wider hover:opacity-70 transition-opacity border border-[var(--color-border)]"
              style={{ fontFamily: 'Azeret Mono, monospace' }}
            >
              JSON File
            </button>
          </div>
        </div>

        {/* Reset Session */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Reset Session</span>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--accent)' }}
          >
            RESET
          </button>
        </div>

        {/* Debug: Come-Up Booster Test */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Come-Up Test (89 min)</span>
          <button
            onClick={() => {
              const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
              const now = new Date();
              const ingestionTime = new Date(now.getTime() - 89 * 60 * 1000);
              const sessionStart = ingestionTime;

              // Two 15-min calming breath meditations in come-up
              const breathModule1Id = generateId();
              const breathModule2Id = generateId();
              const boosterModuleId = generateId();
              const peakModuleId = generateId();

              const modules = [
                // Come-up: first breath meditation (completed)
                {
                  instanceId: breathModule1Id,
                  libraryId: 'breath-meditation-calm',
                  phase: 'come-up',
                  title: 'Calming Breath',
                  duration: 15,
                  status: 'completed',
                  order: 0,
                  content: getModuleById('breath-meditation-calm')?.content || {},
                  startedAt: new Date(sessionStart.getTime() + 1000),
                  completedAt: new Date(sessionStart.getTime() + 15 * 60 * 1000),
                },
                // Come-up: second breath meditation (active - currently in this one)
                {
                  instanceId: breathModule2Id,
                  libraryId: 'breath-meditation-calm',
                  phase: 'come-up',
                  title: 'Calming Breath',
                  duration: 15,
                  status: 'active',
                  order: 1,
                  content: getModuleById('breath-meditation-calm')?.content || {},
                  startedAt: new Date(now.getTime() - 5 * 60 * 1000),
                  completedAt: null,
                },
                // Peak: booster consideration (upcoming)
                {
                  instanceId: boosterModuleId,
                  libraryId: 'booster-consideration',
                  phase: 'peak',
                  title: 'Booster Check-In',
                  duration: 5,
                  status: 'upcoming',
                  order: 0,
                  content: getModuleById('booster-consideration')?.content || {},
                  isBoosterModule: true,
                  startedAt: null,
                  completedAt: null,
                },
                // Peak: another module (upcoming)
                {
                  instanceId: peakModuleId,
                  libraryId: 'open-awareness',
                  phase: 'peak',
                  title: 'Open Awareness',
                  duration: 30,
                  status: 'upcoming',
                  order: 1,
                  content: getModuleById('open-awareness')?.content || {},
                  startedAt: null,
                  completedAt: null,
                },
                // Integration: Closing ritual is now handled as a transition flow
              ];

              useSessionStore.setState({
                sessionPhase: 'active',
                intake: {
                  currentSection: 'D',
                  currentQuestionIndex: 0,
                  responses: {
                    experienceLevel: 'some',
                    sessionMode: 'solo',
                    hasPreparation: 'yes',
                    primaryFocus: 'self-exploration',
                    relationshipType: null,
                    holdingQuestion: '',
                    emotionalState: 'open',
                    guidanceLevel: 'moderate',
                    activityPreferences: ['meditation', 'breathing'],
                    considerBooster: 'yes',
                    promptFormat: null,
                    sessionDuration: '4-6h',
                    startTime: null,
                    safeSpace: 'yes',
                    hasWaterSnacks: 'yes',
                    emergencyContact: 'yes',
                    medications: { taking: false, details: '' },
                    heartConditions: 'no',
                    psychiatricHistory: 'no',
                  },
                  isComplete: true,
                  showSafetyWarnings: false,
                  showMedicationWarning: false,
                },
                substanceChecklist: {
                  hasSubstance: true,
                  hasTestedSubstance: true,
                  hasPreparedDosage: true,
                  plannedDosageMg: 120,
                  dosageFeedback: 'moderate',
                  hasTakenSubstance: true,
                  ingestionTime: ingestionTime,
                  ingestionTimeConfirmed: true,
                },
                preSubstanceActivity: {
                  substanceChecklistSubPhase: 'pre-session-intro',
                  completedActivities: ['intention', 'centering-breath'],
                  touchstone: 'openness',
                  intentionJournalEntryId: null,
                  focusJournalEntryId: null,
                },
                timeline: {
                  scheduledStartTime: null,
                  targetDuration: 300,
                  minDuration: 120,
                  maxDuration: 480,
                  currentPhase: 'come-up',
                  phases: {
                    comeUp: {
                      minDuration: 20,
                      maxDuration: 60,
                      allocatedDuration: 45,
                      startedAt: sessionStart,
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
                      allocatedDuration: 165,
                      startedAt: null,
                      endedAt: null,
                    },
                  },
                },
                modules: {
                  items: modules,
                  currentModuleInstanceId: breathModule2Id,
                  history: [],
                },
                comeUpCheckIn: {
                  isVisible: true,
                  isMinimized: false,
                  promptCount: 2,
                  lastPromptAt: new Date(now.getTime() - 30 * 60 * 1000),
                  responses: [
                    { response: 'waiting', timestamp: sessionStart, minutesSinceIngestion: 3 },
                    { response: 'starting', timestamp: new Date(now.getTime() - 30 * 60 * 1000), minutesSinceIngestion: 59 },
                  ],
                  currentResponse: 'starting',
                  introCompleted: true,
                  waitingForCheckIn: true,
                },
                phaseTransitions: {
                  activeTransition: null,
                  transitionCompleted: false,
                },
                booster: {
                  considerBooster: true,
                  boosterPrepared: true,
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
                },
              });

              // Switch to Active tab
              useAppStore.getState().setCurrentTab('active');
            }}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--accent)' }}
          >
            GO
          </button>
        </div>

        {/* Debug: Booster Test */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Booster Test (89 min)</span>
          <button
            onClick={() => {
              const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
              const now = new Date();
              const ingestionTime = new Date(now.getTime() - 89 * 60 * 1000);
              const sessionStart = ingestionTime; // Session starts at ingestion

              // Build a minimal peak-phase timeline with booster module
              const peakModule1Id = generateId();
              const boosterModuleId = generateId();
              const peakModule2Id = generateId();

              const modules = [
                // Come-up modules (completed)
                {
                  instanceId: generateId(),
                  libraryId: 'grounding-basic',
                  phase: 'come-up',
                  title: 'Grounding Meditation',
                  duration: 10,
                  status: 'completed',
                  order: 0,
                  content: getModuleById('grounding-basic')?.content || {},
                  startedAt: new Date(sessionStart.getTime() + 1000),
                  completedAt: new Date(sessionStart.getTime() + 10 * 60 * 1000),
                },
                {
                  instanceId: generateId(),
                  libraryId: 'breathing-4-7-8',
                  phase: 'come-up',
                  title: '4-7-8 Breathing',
                  duration: 10,
                  status: 'completed',
                  order: 1,
                  content: getModuleById('breathing-4-7-8')?.content || {},
                  startedAt: new Date(sessionStart.getTime() + 10 * 60 * 1000),
                  completedAt: new Date(sessionStart.getTime() + 20 * 60 * 1000),
                },
                // Peak modules
                {
                  instanceId: peakModule1Id,
                  libraryId: 'open-awareness',
                  phase: 'peak',
                  title: 'Open Awareness',
                  duration: 30,
                  status: 'completed',
                  order: 0,
                  content: getModuleById('open-awareness')?.content || {},
                  startedAt: new Date(now.getTime() - 60 * 60 * 1000),
                  completedAt: new Date(now.getTime() - 30 * 60 * 1000),
                },
                {
                  instanceId: boosterModuleId,
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
                },
                {
                  instanceId: peakModule2Id,
                  libraryId: 'open-space',
                  phase: 'peak',
                  title: 'Open Space',
                  duration: 15,
                  status: 'active',
                  order: 2,
                  content: getModuleById('open-space')?.content || {},
                  startedAt: new Date(now.getTime() - 5 * 60 * 1000),
                  completedAt: null,
                },
                // Integration: Closing ritual is now handled as a transition flow
              ];

              useSessionStore.setState({
                sessionPhase: 'active',
                intake: {
                  currentSection: 'D',
                  currentQuestionIndex: 0,
                  responses: {
                    experienceLevel: 'some',
                    sessionMode: 'solo',
                    hasPreparation: 'yes',
                    primaryFocus: 'self-exploration',
                    relationshipType: null,
                    holdingQuestion: '',
                    emotionalState: 'open',
                    guidanceLevel: 'moderate',
                    activityPreferences: ['meditation', 'breathing'],
                    considerBooster: 'yes',
                    promptFormat: null,
                    sessionDuration: '4-6h',
                    startTime: null,
                    safeSpace: 'yes',
                    hasWaterSnacks: 'yes',
                    emergencyContact: 'yes',
                    medications: { taking: false, details: '' },
                    heartConditions: 'no',
                    psychiatricHistory: 'no',
                  },
                  isComplete: true,
                  showSafetyWarnings: false,
                  showMedicationWarning: false,
                },
                substanceChecklist: {
                  hasSubstance: true,
                  hasTestedSubstance: true,
                  hasPreparedDosage: true,
                  plannedDosageMg: 120,
                  dosageFeedback: 'moderate',
                  hasTakenSubstance: true,
                  ingestionTime: ingestionTime,
                  ingestionTimeConfirmed: true,
                },
                preSubstanceActivity: {
                  substanceChecklistSubPhase: 'pre-session-intro',
                  completedActivities: ['intention', 'centering-breath'],
                  touchstone: 'openness',
                  intentionJournalEntryId: null,
                  focusJournalEntryId: null,
                },
                timeline: {
                  scheduledStartTime: null,
                  targetDuration: 300,
                  minDuration: 120,
                  maxDuration: 480,
                  currentPhase: 'peak',
                  phases: {
                    comeUp: {
                      minDuration: 20,
                      maxDuration: 60,
                      allocatedDuration: 45,
                      startedAt: sessionStart,
                      endedAt: new Date(now.getTime() - 60 * 60 * 1000),
                      endedBy: 'user-checkin',
                    },
                    peak: {
                      estimatedDuration: 90,
                      allocatedDuration: 90,
                      startedAt: new Date(now.getTime() - 60 * 60 * 1000),
                      endedAt: null,
                    },
                    integration: {
                      allocatedDuration: 165,
                      startedAt: null,
                      endedAt: null,
                    },
                  },
                },
                modules: {
                  items: modules,
                  currentModuleInstanceId: peakModule2Id,
                  history: [],
                },
                comeUpCheckIn: {
                  isVisible: false,
                  isMinimized: true,
                  promptCount: 3,
                  lastPromptAt: new Date(now.getTime() - 60 * 60 * 1000),
                  responses: [
                    { response: 'waiting', timestamp: sessionStart, minutesSinceIngestion: 3 },
                    { response: 'starting', timestamp: new Date(now.getTime() - 70 * 60 * 1000), minutesSinceIngestion: 19 },
                    { response: 'fully-arrived', timestamp: new Date(now.getTime() - 60 * 60 * 1000), minutesSinceIngestion: 29 },
                  ],
                  currentResponse: 'fully-arrived',
                  introCompleted: true,
                  waitingForCheckIn: false,
                },
                phaseTransitions: {
                  activeTransition: null,
                  transitionCompleted: true,
                },
                booster: {
                  considerBooster: true,
                  boosterPrepared: true,
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
                },
              });

              // Switch to Active tab
              useAppStore.getState().setCurrentTab('active');
            }}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--accent)' }}
          >
            GO
          </button>
        </div>

        {/* Debug: Early Booster Test - Tests 30-min-after-fully-arrived logic */}
        <div className="flex items-center justify-between py-3 border-b border-app-gray-200 dark:border-app-gray-800">
          <span className="text-[12px] uppercase tracking-wider">Early Booster (59 min)</span>
          <button
            onClick={() => {
              const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
              const now = new Date();
              // 59 minutes since ingestion - user reported fully arrived at 29 min
              // So booster should trigger at 59 min (29 + 30 = 59)
              const ingestionTime = new Date(now.getTime() - 59 * 60 * 1000);
              const sessionStart = ingestionTime;

              // Build a minimal peak-phase timeline
              const peakModule1Id = generateId();
              const peakModule2Id = generateId();

              const modules = [
                // Come-up modules (completed)
                {
                  instanceId: generateId(),
                  libraryId: 'grounding-basic',
                  phase: 'come-up',
                  title: 'Grounding Meditation',
                  duration: 10,
                  status: 'completed',
                  order: 0,
                  content: getModuleById('grounding-basic')?.content || {},
                  startedAt: new Date(sessionStart.getTime() + 1000),
                  completedAt: new Date(sessionStart.getTime() + 10 * 60 * 1000),
                },
                {
                  instanceId: generateId(),
                  libraryId: 'breathing-4-7-8',
                  phase: 'come-up',
                  title: '4-7-8 Breathing',
                  duration: 10,
                  status: 'completed',
                  order: 1,
                  content: getModuleById('breathing-4-7-8')?.content || {},
                  startedAt: new Date(sessionStart.getTime() + 10 * 60 * 1000),
                  completedAt: new Date(sessionStart.getTime() + 20 * 60 * 1000),
                },
                // Peak modules
                {
                  instanceId: peakModule1Id,
                  libraryId: 'open-awareness',
                  phase: 'peak',
                  title: 'Open Awareness',
                  duration: 30,
                  status: 'completed',
                  order: 0,
                  content: getModuleById('open-awareness')?.content || {},
                  startedAt: new Date(sessionStart.getTime() + 29 * 60 * 1000),
                  completedAt: new Date(now.getTime() - 5 * 60 * 1000),
                },
                {
                  instanceId: peakModule2Id,
                  libraryId: 'open-space',
                  phase: 'peak',
                  title: 'Open Space',
                  duration: 15,
                  status: 'active',
                  order: 1,
                  content: getModuleById('open-space')?.content || {},
                  startedAt: new Date(now.getTime() - 5 * 60 * 1000),
                  completedAt: null,
                },
              ];

              useSessionStore.setState({
                sessionPhase: 'active',
                intake: {
                  currentSection: 'D',
                  currentQuestionIndex: 0,
                  responses: {
                    experienceLevel: 'some',
                    sessionMode: 'solo',
                    hasPreparation: 'yes',
                    primaryFocus: 'self-exploration',
                    relationshipType: null,
                    holdingQuestion: '',
                    emotionalState: 'open',
                    guidanceLevel: 'moderate',
                    activityPreferences: ['meditation', 'breathing'],
                    considerBooster: 'yes',
                    promptFormat: null,
                    sessionDuration: '4-6h',
                    startTime: null,
                    safeSpace: 'yes',
                    hasWaterSnacks: 'yes',
                    emergencyContact: 'yes',
                    medications: { taking: false, details: '' },
                    heartConditions: 'no',
                    psychiatricHistory: 'no',
                  },
                  isComplete: true,
                  showSafetyWarnings: false,
                  showMedicationWarning: false,
                },
                substanceChecklist: {
                  hasSubstance: true,
                  hasTestedSubstance: true,
                  hasPreparedDosage: true,
                  plannedDosageMg: 120,
                  dosageFeedback: 'moderate',
                  hasTakenSubstance: true,
                  ingestionTime: ingestionTime,
                  ingestionTimeConfirmed: true,
                },
                preSubstanceActivity: {
                  substanceChecklistSubPhase: 'pre-session-intro',
                  completedActivities: ['intention', 'centering-breath'],
                  touchstone: 'openness',
                  intentionJournalEntryId: null,
                  focusJournalEntryId: null,
                },
                timeline: {
                  scheduledStartTime: null,
                  targetDuration: 300,
                  minDuration: 120,
                  maxDuration: 480,
                  currentPhase: 'peak',
                  phases: {
                    comeUp: {
                      minDuration: 20,
                      maxDuration: 60,
                      allocatedDuration: 29,
                      startedAt: sessionStart,
                      endedAt: new Date(sessionStart.getTime() + 29 * 60 * 1000),
                      endedBy: 'user-checkin',
                    },
                    peak: {
                      estimatedDuration: 90,
                      allocatedDuration: 90,
                      startedAt: new Date(sessionStart.getTime() + 29 * 60 * 1000),
                      endedAt: null,
                    },
                    integration: {
                      allocatedDuration: 165,
                      startedAt: null,
                      endedAt: null,
                    },
                  },
                },
                modules: {
                  items: modules,
                  currentModuleInstanceId: peakModule2Id,
                  history: [],
                },
                comeUpCheckIn: {
                  isVisible: false,
                  isMinimized: true,
                  promptCount: 3,
                  lastPromptAt: new Date(sessionStart.getTime() + 29 * 60 * 1000),
                  responses: [
                    { response: 'waiting', timestamp: sessionStart, minutesSinceIngestion: 3 },
                    { response: 'starting', timestamp: new Date(sessionStart.getTime() + 15 * 60 * 1000), minutesSinceIngestion: 15 },
                    // Key: fully-arrived at 29 minutes, so booster triggers at 59 min (29 + 30)
                    { response: 'fully-arrived', timestamp: new Date(sessionStart.getTime() + 29 * 60 * 1000), minutesSinceIngestion: 29 },
                  ],
                  currentResponse: 'fully-arrived',
                  introCompleted: true,
                  waitingForCheckIn: false,
                  hasIndicatedFullyArrived: true,
                  showEndOfPhaseChoice: false,
                },
                phaseTransitions: {
                  activeTransition: null,
                  transitionCompleted: true,
                },
                booster: {
                  considerBooster: true,
                  boosterPrepared: true,
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
              });

              // Switch to Active tab
              useAppStore.getState().setCurrentTab('active');
            }}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--accent)' }}
          >
            GO
          </button>
        </div>

        {/* Debug: Integration Test */}
        <div className="flex items-center justify-between py-3">
          <span className="text-[12px] uppercase tracking-wider">Integration Test (2 hr)</span>
          <button
            onClick={() => {
              const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
              const now = new Date();
              const ingestionTime = new Date(now.getTime() - 120 * 60 * 1000); // 2 hours ago
              const sessionStart = ingestionTime;

              // Create a journal entry for the intention
              const intentionEntryId = generateId();
              useJournalStore.setState({
                entries: [
                  {
                    id: intentionEntryId,
                    content: 'TO FIND GOD!',
                    createdAt: new Date(sessionStart.getTime() - 5 * 60 * 1000).toISOString(),
                    updatedAt: new Date(sessionStart.getTime() - 5 * 60 * 1000).toISOString(),
                    type: 'intention',
                    phase: 'pre-session',
                  },
                ],
                navigation: { currentView: 'editor', activeEntryId: null },
              });

              // Build integration phase timeline
              const integrationModule1Id = generateId();
              const integrationModule2Id = generateId();

              const modules = [
                // Come-up modules (completed)
                {
                  instanceId: generateId(),
                  libraryId: 'grounding-basic',
                  phase: 'come-up',
                  title: 'Grounding Meditation',
                  duration: 10,
                  status: 'completed',
                  order: 0,
                  content: getModuleById('grounding-basic')?.content || {},
                  startedAt: new Date(sessionStart.getTime() + 1000),
                  completedAt: new Date(sessionStart.getTime() + 10 * 60 * 1000),
                },
                {
                  instanceId: generateId(),
                  libraryId: 'breathing-4-7-8',
                  phase: 'come-up',
                  title: '4-7-8 Breathing',
                  duration: 10,
                  status: 'completed',
                  order: 1,
                  content: getModuleById('breathing-4-7-8')?.content || {},
                  startedAt: new Date(sessionStart.getTime() + 10 * 60 * 1000),
                  completedAt: new Date(sessionStart.getTime() + 20 * 60 * 1000),
                },
                // Peak modules (completed)
                {
                  instanceId: generateId(),
                  libraryId: 'open-awareness',
                  phase: 'peak',
                  title: 'Open Awareness',
                  duration: 30,
                  status: 'completed',
                  order: 0,
                  content: getModuleById('open-awareness')?.content || {},
                  startedAt: new Date(sessionStart.getTime() + 30 * 60 * 1000),
                  completedAt: new Date(sessionStart.getTime() + 60 * 60 * 1000),
                },
                {
                  instanceId: generateId(),
                  libraryId: 'open-space',
                  phase: 'peak',
                  title: 'Open Space',
                  duration: 30,
                  status: 'completed',
                  order: 1,
                  content: getModuleById('open-space')?.content || {},
                  startedAt: new Date(sessionStart.getTime() + 60 * 60 * 1000),
                  completedAt: new Date(sessionStart.getTime() + 90 * 60 * 1000),
                },
                // Integration modules
                {
                  instanceId: integrationModule1Id,
                  libraryId: 'gentle-reflection',
                  phase: 'integration',
                  title: 'Gentle Reflection',
                  duration: 15,
                  status: 'completed',
                  order: 0,
                  content: getModuleById('gentle-reflection')?.content || {},
                  startedAt: new Date(sessionStart.getTime() + 100 * 60 * 1000),
                  completedAt: new Date(sessionStart.getTime() + 115 * 60 * 1000),
                },
                {
                  instanceId: integrationModule2Id,
                  libraryId: 'grounding-basic',
                  phase: 'integration',
                  title: 'Grounding',
                  duration: 10,
                  status: 'active',
                  order: 1,
                  content: getModuleById('grounding-basic')?.content || {},
                  startedAt: new Date(now.getTime() - 5 * 60 * 1000),
                  completedAt: null,
                },
              ];

              useSessionStore.setState({
                sessionPhase: 'active',
                intake: {
                  currentSection: 'D',
                  currentQuestionIndex: 0,
                  responses: {
                    experienceLevel: 'some',
                    sessionMode: 'solo',
                    hasPreparation: 'yes',
                    primaryFocus: 'spiritual',
                    relationshipType: null,
                    holdingQuestion: 'What is the nature of the divine?',
                    emotionalState: 'open',
                    guidanceLevel: 'moderate',
                    activityPreferences: ['meditation', 'journaling'],
                    considerBooster: 'no',
                    promptFormat: null,
                    sessionDuration: '4-6h',
                    startTime: null,
                    safeSpace: 'yes',
                    hasWaterSnacks: 'yes',
                    emergencyContact: 'yes',
                    medications: { taking: false, details: '' },
                    heartConditions: 'no',
                    psychiatricHistory: 'no',
                  },
                  isComplete: true,
                  showSafetyWarnings: false,
                  showMedicationWarning: false,
                },
                substanceChecklist: {
                  hasSubstance: true,
                  hasTestedSubstance: true,
                  hasPreparedDosage: true,
                  plannedDosageMg: 125,
                  dosageFeedback: 'moderate',
                  hasTakenSubstance: true,
                  ingestionTime: ingestionTime,
                  ingestionTimeConfirmed: true,
                },
                preSubstanceActivity: {
                  substanceChecklistSubPhase: 'pre-session-intro',
                  completedActivities: ['intention', 'centering-breath'],
                  touchstone: 'divine connection',
                  intentionJournalEntryId: intentionEntryId,
                  focusJournalEntryId: null,
                },
                timeline: {
                  scheduledStartTime: null,
                  targetDuration: 300,
                  minDuration: 120,
                  maxDuration: 480,
                  currentPhase: 'integration',
                  phases: {
                    comeUp: {
                      minDuration: 20,
                      maxDuration: 60,
                      allocatedDuration: 30,
                      startedAt: sessionStart,
                      endedAt: new Date(sessionStart.getTime() + 30 * 60 * 1000),
                      endedBy: 'user-checkin',
                    },
                    peak: {
                      estimatedDuration: 60,
                      allocatedDuration: 60,
                      startedAt: new Date(sessionStart.getTime() + 30 * 60 * 1000),
                      endedAt: new Date(sessionStart.getTime() + 90 * 60 * 1000),
                    },
                    integration: {
                      allocatedDuration: 210,
                      startedAt: new Date(sessionStart.getTime() + 90 * 60 * 1000),
                      endedAt: null,
                    },
                  },
                },
                modules: {
                  items: modules,
                  currentModuleInstanceId: integrationModule2Id,
                  history: [],
                },
                comeUpCheckIn: {
                  isVisible: false,
                  isMinimized: true,
                  promptCount: 3,
                  lastPromptAt: new Date(sessionStart.getTime() + 25 * 60 * 1000),
                  responses: [
                    { response: 'waiting', timestamp: sessionStart, minutesSinceIngestion: 3 },
                    { response: 'starting', timestamp: new Date(sessionStart.getTime() + 15 * 60 * 1000), minutesSinceIngestion: 15 },
                    { response: 'fully-arrived', timestamp: new Date(sessionStart.getTime() + 25 * 60 * 1000), minutesSinceIngestion: 25 },
                  ],
                  currentResponse: 'fully-arrived',
                  introCompleted: true,
                  waitingForCheckIn: false,
                },
                phaseTransitions: {
                  activeTransition: null,
                  transitionCompleted: true,
                },
                booster: {
                  considerBooster: false,
                  boosterPrepared: false,
                  status: 'skipped',
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
                },
              });

              // Switch to Active tab
              useAppStore.getState().setCurrentTab('active');
            }}
            className="text-[12px] uppercase tracking-wider hover:opacity-70 transition-opacity"
            style={{ fontFamily: 'Azeret Mono, monospace', color: 'var(--accent)' }}
          >
            GO
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm p-6 space-y-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <p className="text-[12px] uppercase tracking-wider font-bold">Reset Session</p>
            <p style={{ color: 'var(--text-primary)' }}>
              This will reset the entire app and permanently delete all data, including your intake responses, session progress, and journal entries.
            </p>
            <p style={{ color: 'var(--text-tertiary)' }}>
              This action cannot be undone.
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={handleReset}
                className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                Yes, reset everything
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-70"
                style={{ border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Confirmation Modal */}
      {showDownloadConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm p-6 space-y-4" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
            <p className="text-[12px] uppercase tracking-wider font-bold">Download Session Data</p>
            <p style={{ color: 'var(--text-primary)' }}>
              Your download will include:
            </p>
            <ul className="text-[13px] space-y-1" style={{ color: 'var(--text-secondary)' }}>
              <li>• All journal entries (session & personal)</li>
              <li>• Intention and touchstone</li>
              <li>• Transition reflections (peak, integration, closing)</li>
              <li>• Check-in responses</li>
              <li>• Completed activities</li>
              <li>• Follow-up reflections (if completed)</li>
            </ul>
            <p className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
              {showDownloadConfirm === 'txt'
                ? 'Text format is human-readable.'
                : 'JSON format is useful for backup or import.'}
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleDownloadConfirm(showDownloadConfirm)}
                className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-80"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
              >
                Yes, download {showDownloadConfirm === 'txt' ? 'text file' : 'JSON file'}
              </button>
              <button
                onClick={() => setShowDownloadConfirm(null)}
                className="w-full py-3 text-[12px] uppercase tracking-wider transition-opacity hover:opacity-70"
                style={{ border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

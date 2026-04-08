/**
 * TimelineEditor Component
 * Unified timeline view for both pre-session editing and active session display
 * Each phase section includes its own timeline node that stays aligned with content
 * Shows three phases with module editing capabilities
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSessionStore, calculateBoosterDose } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useAppStore } from '../../stores/useAppStore';
import { getModuleById } from '../../content/modules';
import PhaseSection from './PhaseSection';
import ModuleCard from './ModuleCard';
import { CircleSkipIcon, CirclePlusIcon, LockIcon } from '../shared/Icons';
import ModuleLibraryDrawer from './ModuleLibraryDrawer';
import TimelineSummary from './TimelineSummary';

import AltSessionModuleModal from '../home/AltSessionModuleModal';
import ClockNoteModal from './ClockNoteModal';
import TimelineTutorial from './TimelineTutorial';
import { consumeRevealAnimationPending } from './tutorialRevealFlag';

export default function TimelineEditor({ isActiveSession = false, isCompletedSession = false, onBeginSession }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePhase, setActivePhase] = useState(null);
  const [warningModal, setWarningModal] = useState(null);
  const [errorModal, setErrorModal] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedAddedFollowUpModule, setSelectedAddedFollowUpModule] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Pre-session collapse state (mirrors PhaseSection pattern)
  const [preSessionCollapsed, setPreSessionCollapsed] = useState(false);
  const [preSessionContentVisible, setPreSessionContentVisible] = useState(true);
  const [preSessionHeightCollapsed, setPreSessionHeightCollapsed] = useState(false);

  const handleTogglePreSessionCollapse = () => {
    if (!preSessionCollapsed) {
      setPreSessionContentVisible(false);
      setTimeout(() => {
        setPreSessionHeightCollapsed(true);
        setPreSessionCollapsed(true);
      }, 250);
    } else {
      setPreSessionHeightCollapsed(false);
      setTimeout(() => {
        setPreSessionContentVisible(true);
        setPreSessionCollapsed(false);
      }, 600);
    }
  };
  const [selectedPreSessionModule, setSelectedPreSessionModule] = useState(null);
  const [preSessionExpanded, setPreSessionExpanded] = useState(true);
  const [clockNoteOpen, setClockNoteOpen] = useState(false);
  const [frozenTime, setFrozenTime] = useState('');

  // Get current tab to detect tab switches
  const currentTab = useAppStore((state) => state.currentTab);

  // Exit edit mode when switching away from home tab
  useEffect(() => {
    if (currentTab !== 'home' && isEditMode) {
      setIsEditMode(false);
    }
  }, [currentTab, isEditMode]);

  // Exit edit mode when app goes to background (page visibility change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isEditMode) {
        setIsEditMode(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEditMode]);

  // Auto-collapse pre-session section when session starts
  useEffect(() => {
    if (isActiveSession || isCompletedSession) {
      setPreSessionExpanded(false);
    }
  }, [isActiveSession, isCompletedSession]);

  // Function to enter edit mode (can be called from ModuleLibraryDrawer)
  const enterEditMode = useCallback(() => {
    setIsEditMode(true);
    setDrawerOpen(false);
    setActivePhase(null);
  }, []);

  // Refs for phase sections (for potential future use)
  const phase1Ref = useRef(null);
  const phase2Ref = useRef(null);
  const phase3Ref = useRef(null);

  const modules = useSessionStore((state) => state.modules);
  const timeline = useSessionStore((state) => state.timeline);
  const substanceChecklist = useSessionStore((state) => state.substanceChecklist);
  const booster = useSessionStore((state) => state.booster);
  const intake = useSessionStore((state) => state.intake);
  const preSubstanceActivity = useSessionStore((state) => state.preSubstanceActivity);
  const session = useSessionStore((state) => state.session);
  const followUp = useSessionStore((state) => state.followUp);
  const checkFollowUpAvailability = useSessionStore((state) => state.checkFollowUpAvailability);
  const getEntryById = useJournalStore((state) => state.getEntryById);
  const addModule = useSessionStore((state) => state.addModule);
  const updateModuleDuration = useSessionStore((state) => state.updateModuleDuration);
  const removeModule = useSessionStore((state) => state.removeModule);
  const swapModuleOrder = useSessionStore((state) => state.swapModuleOrder);
  const getPhaseDuration = useSessionStore((state) => state.getPhaseDuration);
  const getTotalDuration = useSessionStore((state) => state.getTotalDuration);
  const getCurrentModule = useSessionStore((state) => state.getCurrentModule);

  const currentModule = getCurrentModule();
  const currentPhase = timeline?.currentPhase;

  const moduleItems = modules?.items || [];
  const comeUpModules = moduleItems.filter((m) => m.phase === 'come-up').sort((a, b) => a.order - b.order);
  const integrationModules = moduleItems.filter((m) => m.phase === 'integration').sort((a, b) => a.order - b.order);
  const followUpModules = moduleItems.filter((m) => m.phase === 'follow-up').sort((a, b) => a.order - b.order);
  const preSessionModules = moduleItems.filter((m) => m.phase === 'pre-session').sort((a, b) => a.order - b.order);
  const startPreSessionModule = useSessionStore((state) => state.startPreSessionModule);

  const comeUpDuration = getPhaseDuration('come-up');
  const peakDuration = getPhaseDuration('peak');
  const integrationDuration = getPhaseDuration('integration');
  const totalDuration = getTotalDuration();

  // Dynamically position booster module in peak phase based on 90-minute mark
  const BOOSTER_TARGET_TIME = 90; // minutes from session start
  const peakModulesRaw = moduleItems.filter((m) => m.phase === 'peak').sort((a, b) => a.order - b.order);

  // Separate booster from other peak modules
  const boosterModule = peakModulesRaw.find((m) => m.isBoosterModule || m.libraryId === 'booster-consideration');
  const nonBoosterPeakModules = peakModulesRaw.filter((m) => !m.isBoosterModule && m.libraryId !== 'booster-consideration');

  // Calculate where booster should be inserted based on cumulative time
  let peakModules = nonBoosterPeakModules;
  if (boosterModule) {
    let cumulativeTime = comeUpDuration; // Start from end of come-up phase
    let boosterInsertIndex = 0;

    // Find the position where cumulative time first reaches or exceeds 90 minutes
    for (let i = 0; i < nonBoosterPeakModules.length; i++) {
      if (cumulativeTime >= BOOSTER_TARGET_TIME) {
        boosterInsertIndex = i;
        break;
      }
      cumulativeTime += nonBoosterPeakModules[i].duration;
      boosterInsertIndex = i + 1; // Insert after this module if we haven't hit 90 yet
    }

    // If come-up already >= 90 min, booster goes at the start of peak
    if (comeUpDuration >= BOOSTER_TARGET_TIME) {
      boosterInsertIndex = 0;
    }

    // Insert booster at the calculated position
    peakModules = [
      ...nonBoosterPeakModules.slice(0, boosterInsertIndex),
      boosterModule,
      ...nonBoosterPeakModules.slice(boosterInsertIndex),
    ];
  }

  // Safe access to phase durations with defaults
  const comeUpMaxDuration = timeline?.phases?.comeUp?.maxDuration || 60;
  const peakAllocatedDuration = timeline?.phases?.peak?.allocatedDuration || 90;
  const integrationAllocatedDuration = timeline?.phases?.integration?.allocatedDuration || 120;
  const targetDuration = timeline?.targetDuration || 240;

  // Update elapsed time every second during active session (for HH:MM:SS clock)
  // For completed sessions, use the frozen final duration
  useEffect(() => {
    // For completed sessions, use the final frozen duration
    if (isCompletedSession) {
      if (session?.finalDurationSeconds) {
        setElapsedSeconds(session.finalDurationSeconds);
      }
      return;
    }

    if (!isActiveSession) return;

    const updateElapsed = () => {
      const ingestionTime = substanceChecklist?.ingestionTime;
      if (ingestionTime) {
        const seconds = Math.floor((Date.now() - ingestionTime) / 1000);
        setElapsedSeconds(Math.max(0, seconds));
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [isActiveSession, isCompletedSession, substanceChecklist?.ingestionTime, session?.finalDurationSeconds]);

  // Check follow-up availability for completed sessions
  useEffect(() => {
    if (!isCompletedSession) return;
    checkFollowUpAvailability();
    const interval = setInterval(checkFollowUpAvailability, 60000);
    return () => clearInterval(interval);
  }, [isCompletedSession, checkFollowUpAvailability]);

  // Format elapsed time as HH:MM:SS
  const formatElapsedClock = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine if a phase is editable (can add/remove modules)
  const isPhaseEditable = (phase) => {
    // Follow-up phase is always editable for completed sessions
    if (phase === 'follow-up') {
      return isCompletedSession;
    }

    // Completed sessions are not editable (except follow-up)
    if (isCompletedSession) return false;

    if (!isActiveSession) return true; // Pre-session: all phases editable

    // During session: only future phases are editable
    const phaseOrder = { 'come-up': 0, peak: 1, integration: 2 };
    const currentPhaseOrder = phaseOrder[currentPhase] ?? -1;
    const targetPhaseOrder = phaseOrder[phase] ?? -1;

    // Can edit current phase (future modules) or future phases
    return targetPhaseOrder >= currentPhaseOrder;
  };

  // Check if a specific module can be removed (must be upcoming, not active or completed, and not current)
  const canRemoveModule = (module) => {
    if (!isActiveSession) return true;
    // During active session: must be upcoming AND not the current module
    const isCurrentModuleItem = module.instanceId === currentModule?.instanceId;
    return module.status === 'upcoming' && !isCurrentModuleItem;
  };

  const handleAddModuleClick = (phase) => {
    if (!isPhaseEditable(phase)) return;
    setActivePhase(phase);
    setDrawerOpen(true);
  };

  const handleModuleSelect = (libraryId, customDuration) => {
    // For come-up phase, check if adding this module would exceed 60 minutes
    if (activePhase === 'come-up') {
      const currentDuration = getPhaseDuration('come-up');
      const libraryModule = getModuleById(libraryId);
      const moduleDuration = customDuration || libraryModule?.defaultDuration || 0;
      const newTotal = currentDuration + moduleDuration;
      const maxDuration = timeline?.phases?.comeUp?.maxDuration || 60;

      if (newTotal > maxDuration) {
        setWarningModal({
          libraryId,
          phase: activePhase,
          message: `Adding this activity will bring the Come-Up phase to ${newTotal} minutes, which exceeds the recommended ${maxDuration} minutes. The come-up phase should generally not exceed ${maxDuration} minutes. Are you sure you want to add this activity?`,
          customDuration,
        });
        return;
      }
    }

    const result = addModule(libraryId, activePhase);
    if (!result.success) {
      setErrorModal({ message: result.error });
      return;
    }
    if (customDuration && customDuration !== result.module.duration) {
      updateModuleDuration(result.module.instanceId, customDuration);
    }
    // Drawer stays open — user can add more modules
  };

  const handleWarningConfirm = () => {
    const { libraryId, phase, customDuration } = warningModal;
    const result = addModule(libraryId, phase);
    if (result.success && customDuration && customDuration !== result.module.duration) {
      updateModuleDuration(result.module.instanceId, customDuration);
    }
    setWarningModal(null);
    // Drawer stays open
  };

  const handleRemoveModule = (instanceId) => {
    const module = moduleItems.find((m) => m.instanceId === instanceId);
    if (module && canRemoveModule(module)) {
      removeModule(instanceId);
    }
  };

  // Move module up (decrease order) within its phase
  const handleMoveModuleUp = (instanceId) => {
    const module = moduleItems.find((m) => m.instanceId === instanceId);
    if (!module) return;

    // Get all modules in this phase, sorted by order
    const phaseModules = moduleItems
      .filter((m) => m.phase === module.phase)
      .sort((a, b) => a.order - b.order);

    // Find current index in sorted array
    const currentIndex = phaseModules.findIndex((m) => m.instanceId === instanceId);
    if (currentIndex <= 0) return; // Already first

    // Get the module above (lower index = lower order)
    const targetModule = phaseModules[currentIndex - 1];
    if (!targetModule) return;

    // Linked module guard: Part 2 can't move above its Part 1 sibling
    if (module.linkedGroupId && module.linkedRole === 'part2'
        && targetModule.linkedGroupId === module.linkedGroupId && targetModule.linkedRole === 'part1') {
      return;
    }

    // Swap their order values
    swapModuleOrder(instanceId, targetModule.order);
  };

  // Move module down (increase order) within its phase
  const handleMoveModuleDown = (instanceId) => {
    const module = moduleItems.find((m) => m.instanceId === instanceId);
    if (!module) return;

    // Get all modules in this phase, sorted by order
    const phaseModules = moduleItems
      .filter((m) => m.phase === module.phase)
      .sort((a, b) => a.order - b.order);

    // Find current index in sorted array
    const currentIndex = phaseModules.findIndex((m) => m.instanceId === instanceId);
    if (currentIndex >= phaseModules.length - 1) return; // Already last

    // Get the module below (higher index = higher order)
    const targetModule = phaseModules[currentIndex + 1];
    if (!targetModule) return;

    // Linked module guard: Part 1 can't move below its Part 2 sibling
    if (module.linkedGroupId && module.linkedRole === 'part1'
        && targetModule.linkedGroupId === module.linkedGroupId && targetModule.linkedRole === 'part2') {
      return;
    }

    // Swap their order values
    swapModuleOrder(instanceId, targetModule.order);
  };

  // Get phase status for visual styling
  const getPhaseStatus = (phase) => {
    // Completed sessions show all phases as completed
    if (isCompletedSession) return 'completed';

    if (!isActiveSession) return 'upcoming';

    const phaseOrder = { 'come-up': 0, peak: 1, integration: 2 };
    const currentPhaseOrder = phaseOrder[currentPhase] ?? -1;
    const targetPhaseOrder = phaseOrder[phase] ?? -1;

    if (targetPhaseOrder < currentPhaseOrder) return 'completed';
    if (targetPhaseOrder === currentPhaseOrder) return 'active';
    return 'upcoming';
  };

  const formatTime = (date, { includeDate = false } = {}) => {
    if (!date) return '';
    const d = new Date(date);
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (!includeDate) return time;
    const month = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `${month}, ${time}`;
  };

  return (
    <div className="max-w-md mx-auto px-6 pt-4 pb-8">
      {/* Header */}
      <div className="mb-4 relative">
        <div className="flex items-start justify-between">
          <h2
            className="mb-2 font-serif text-2xl"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            My Timeline
          </h2>
        </div>

        {isActiveSession || isCompletedSession ? (
          <div className="space-y-1">
            <p className="text-[var(--color-text-secondary)]">
              Started at {formatTime(substanceChecklist?.ingestionTime)}
            </p>
            <p className="text-[var(--color-text-secondary)]">
              Dosage: {substanceChecklist?.plannedDosageMg || '—'}mg
            </p>
            {booster?.status === 'taken' && booster?.boosterTakenAt && (
              <p className="text-[var(--color-text-secondary)]">
                Booster: +{booster.boosterDoseMg || calculateBoosterDose(substanceChecklist?.plannedDosageMg)}mg at {formatTime(booster.boosterTakenAt)}
              </p>
            )}
            {(() => {
              // Try to get the intention from the journal entry (which may have been edited)
              // Fall back to intake.holdingQuestion if no journal entry exists
              const intentionEntry = preSubstanceActivity?.intentionJournalEntryId
                ? getEntryById(preSubstanceActivity.intentionJournalEntryId)
                : null;

              // Parse only the intention part (before any "---" separator for insights)
              let intentionText = null;
              if (intentionEntry?.content) {
                const contentBeforeSeparator = intentionEntry.content.split('\n\n---')[0];
                // Remove the "INTENTION:\n\n" prefix if present
                intentionText = contentBeforeSeparator.replace(/^INTENTION:\n\n/i, '').trim();
              }

              // Fall back to intake holdingQuestion if no journal entry or empty
              const displayIntention = intentionText || intake?.holdingQuestion;

              return displayIntention ? (
                <p className="text-[var(--color-text-secondary)]">
                  Intention: <span className="text-[var(--color-text-tertiary)]">{displayIntention}</span>
                </p>
              ) : null;
            })()}
            {/* Large elapsed time clock - tappable during active session to open clock note */}
            {isActiveSession && !isCompletedSession ? (
              <button
                type="button"
                onClick={() => {
                  setFrozenTime(formatElapsedClock(elapsedSeconds));
                  setClockNoteOpen(true);
                }}
                className="text-4xl tracking-wide text-[var(--color-text-primary)] active:opacity-60 transition-opacity"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                {formatElapsedClock(elapsedSeconds)}
              </button>
            ) : (
              <p
                className="text-4xl tracking-wide"
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                {formatElapsedClock(elapsedSeconds)}
              </p>
            )}
          </div>
        ) : (
          <p className="text-[var(--color-text-secondary)]">
            Review and customize your session. Add or remove activities to match your intentions.
          </p>
        )}
      </div>

      {/* Timeline with integrated nodes in each phase section */}
      <div>
        {/* Pre-Session Section — above Phase 1 (before session starts + completed session) */}
        {!isActiveSession && (
          <div className="mb-2">
            <div className="relative flex">
              {/* Timeline node and vertical bar */}
              <div className="flex flex-col items-center mr-4 flex-shrink-0" style={{ width: '12px' }}>
                <div className="w-3 h-3 rounded-full border-2 flex-shrink-0 mt-2 bg-[var(--color-bg)] border-[var(--color-text-primary)]" />
                <div className="w-0.5 flex-1 bg-[var(--color-text-primary)]" />
              </div>

              {/* Pre-session content */}
              <div className="flex-1 pb-2">
                <div data-tutorial="pre-session">
                  <div className="flex items-start justify-between">
                    <h3
                      className="flex items-baseline gap-2"
                      style={{ lineHeight: 1, marginBottom: '8px' }}
                    >
                      <span className="font-serif text-[22px]" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
                        Pre-Session
                      </span>
                    </h3>
                    {isCompletedSession ? (
                      <button
                        onClick={handleTogglePreSessionCollapse}
                        className="flex-shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                      >
                        {preSessionCollapsed
                          ? <CirclePlusIcon size={18} className="text-current" />
                          : <CircleSkipIcon size={18} className="text-current" />
                        }
                      </button>
                    ) : (
                      preSessionModules.length > 1 && (
                        <button
                          onClick={() => setIsEditMode(!isEditMode)}
                          className={`px-3 py-1 text-xs uppercase tracking-wider transition-colors flex-shrink-0 ${
                            isEditMode
                              ? 'bg-[var(--accent)] text-white'
                              : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                          }`}
                        >
                          {isEditMode ? 'Done' : 'Edit'}
                        </button>
                      )
                    )}
                  </div>
                  {!isCompletedSession && (
                    <p className="text-[var(--color-text-secondary)]" style={{ lineHeight: 1.3, marginBottom: '8px' }}>
                      Optional activities to prepare you for your session. You can also preview any activity from the main session timeline here.
                    </p>
                  )}
                </div>

                {/* Pre-session timestamp — always visible, outside collapsible content */}
                {isCompletedSession && (() => {
                  const startedTimes = preSessionModules.map((m) => m.startedAt).filter(Boolean);
                  const completedTimes = preSessionModules.map((m) => m.completedAt).filter(Boolean);
                  const earliest = startedTimes.length > 0 ? Math.min(...startedTimes) : null;
                  const latest = completedTimes.length > 0 ? Math.max(...completedTimes) : null;
                  return (
                    <p className="text-[var(--color-text-tertiary)] text-xs" style={{ lineHeight: 1, marginBottom: '6px' }}>
                      {earliest
                        ? <>
                            {new Date(earliest).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {latest && ` – ${new Date(latest).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          </>
                        : 'Activities prior to session'
                      }
                    </p>
                  );
                })()}

                {/* Collapsible content — staged animation matching PhaseSection */}
                <div
                  className="overflow-hidden ease-in-out"
                  style={{
                    maxHeight: preSessionHeightCollapsed ? 0 : '2000px',
                    transition: preSessionHeightCollapsed ? 'max-height 300ms ease-in-out' : 'max-height 500ms ease-in-out',
                  }}
                >
                  <div
                    className="transition-opacity duration-250 ease-in-out"
                    style={{ opacity: preSessionContentVisible ? 1 : 0 }}
                  >

                {/* Module cards */}
                {preSessionModules.length > 0 && (
                  <div className="space-y-2">
                    {preSessionModules.map((module, index) => {
                      const canMoveUp = index > 0;
                      const canMoveDown = index < preSessionModules.length - 1;

                      return (
                        <div key={module.instanceId} className="relative flex items-start">
                          {/* Reorder arrows — only in edit mode with multiple modules */}
                          {!isCompletedSession && isEditMode && preSessionModules.length > 1 && (
                            <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleMoveModuleUp(module.instanceId)}
                                disabled={!canMoveUp}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                                  !canMoveUp
                                    ? 'opacity-30 cursor-not-allowed text-[var(--color-text-tertiary)]'
                                    : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-95'
                                }`}
                                title="Move up"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveModuleDown(module.instanceId)}
                                disabled={!canMoveDown}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                                  !canMoveDown
                                    ? 'opacity-30 cursor-not-allowed text-[var(--color-text-tertiary)]'
                                    : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-95'
                                }`}
                                title="Move down"
                              >
                                ↓
                              </button>
                            </div>
                          )}

                          <ModuleCard
                            module={module}
                            onRemove={!isCompletedSession ? () => handleRemoveModule(module.instanceId) : undefined}
                            isEditMode={!isCompletedSession && isEditMode}
                            onClick={() => setSelectedPreSessionModule(module)}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Pre-Session Activity button — only before session */}
                {!isCompletedSession && (
                  <button
                    onClick={() => handleAddModuleClick('pre-session')}
                    className="mt-2 w-full py-3 border border-dashed border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)] transition-colors text-sm flex items-center justify-center"
                  >
                    + Add Pre-Session Activity
                  </button>
                )}

                  </div>
                </div>
              </div>
            </div>

            {/* Ending node for pre-session timeline */}
            <div className="relative flex">
              <div className="flex flex-col items-center mr-4 flex-shrink-0" style={{ width: '12px' }}>
                <div className="w-3 h-3 rounded-full border-2 flex-shrink-0 bg-[var(--color-bg)] border-[var(--color-text-primary)]" />
              </div>
            </div>
          </div>
        )}

        {/* Come-Up Phase */}
        <PhaseSection
          ref={phase1Ref}
          phase="come-up"
          modules={comeUpModules}
          duration={comeUpDuration}
          maxDuration={comeUpMaxDuration}
          isFirst={true}
          onAddModule={() => handleAddModuleClick('come-up')}
          onRemoveModule={handleRemoveModule}
          isActiveSession={isActiveSession}
          phaseStatus={getPhaseStatus('come-up')}
          currentModuleId={currentModule?.instanceId}
          canRemoveModule={canRemoveModule}
          isEditable={isPhaseEditable('come-up')}
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          isCompletedSession={isCompletedSession}
          onMoveModuleUp={handleMoveModuleUp}
          onMoveModuleDown={handleMoveModuleDown}
          phaseStartedAt={timeline?.phases?.comeUp?.startedAt}
          phaseEndedAt={timeline?.phases?.comeUp?.endedAt}
        />

        {/* Peak Phase */}
        <PhaseSection
          ref={phase2Ref}
          phase="peak"
          modules={peakModules}
          duration={peakDuration}
          maxDuration={peakAllocatedDuration}
          onAddModule={() => handleAddModuleClick('peak')}
          onRemoveModule={handleRemoveModule}
          isActiveSession={isActiveSession}
          phaseStatus={getPhaseStatus('peak')}
          previousPhaseCompleted={getPhaseStatus('come-up') === 'completed'}
          currentModuleId={currentModule?.instanceId}
          canRemoveModule={canRemoveModule}
          isEditable={isPhaseEditable('peak')}
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          isCompletedSession={isCompletedSession}
          onMoveModuleUp={handleMoveModuleUp}
          onMoveModuleDown={handleMoveModuleDown}
          phaseStartedAt={timeline?.phases?.peak?.startedAt}
          phaseEndedAt={timeline?.phases?.peak?.endedAt}
        />

        {/* Integration Phase */}
        <PhaseSection
          ref={phase3Ref}
          phase="integration"
          modules={integrationModules}
          duration={integrationDuration}
          maxDuration={integrationAllocatedDuration}
          onAddModule={() => handleAddModuleClick('integration')}
          onRemoveModule={handleRemoveModule}
          isActiveSession={isActiveSession}
          phaseStatus={getPhaseStatus('integration')}
          previousPhaseCompleted={getPhaseStatus('peak') === 'completed'}
          currentModuleId={currentModule?.instanceId}
          canRemoveModule={canRemoveModule}
          isEditable={isPhaseEditable('integration')}
          isEditMode={isEditMode}
          onToggleEditMode={() => setIsEditMode(!isEditMode)}
          isCompletedSession={isCompletedSession}
          onMoveModuleUp={handleMoveModuleUp}
          onMoveModuleDown={handleMoveModuleDown}
          phaseStartedAt={timeline?.phases?.integration?.startedAt}
          phaseEndedAt={timeline?.phases?.integration?.endedAt}
        />

        {/* Closing Ritual - final node on the main session timeline */}
        <div className="relative flex">
          {/* Timeline node - no vertical bar extending down (this is the end of the main timeline) */}
          <div className="flex flex-col items-center mr-4 flex-shrink-0" style={{ width: '12px' }}>
            <div className={`w-0.5 h-1 bg-[var(--color-text-primary)] ${isActiveSession && getPhaseStatus('integration') === 'completed' ? 'opacity-50' : ''}`} />
            <div className={`w-3 h-3 rounded-full border-2 ${
              isCompletedSession
                ? 'bg-[var(--color-text-primary)] border-[var(--color-text-primary)]'
                : 'bg-[var(--color-bg)] border-[var(--color-text-primary)]'
            }`} />
          </div>

          {/* Closing Ritual content */}
          <div className="flex-1">
            <h3
              className="font-serif text-[22px]"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none', lineHeight: 1, marginBottom: '8px' }}
            >
              Closing Ritual
            </h3>
            <p className="text-[var(--color-text-tertiary)] text-xs" style={{ lineHeight: 1, marginBottom: '6px' }}>
              {isCompletedSession ? 'Completed' : 'End of session'}
            </p>
            {!isCompletedSession && (
              <p className="text-[var(--color-text-secondary)]" style={{ lineHeight: 1.3 }}>
                A gentle way to mark the end of your journey and honor the experience.
              </p>
            )}
          </div>
        </div>

        {/* Phase 4: Follow-Up - only shown for completed sessions */}
        {/* Separated from main timeline with a visual gap */}
        {isCompletedSession && (
          <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
            <div className="relative flex">
              {/* Timeline node and vertical bar for Phase 4 */}
              <div className="flex flex-col items-center mr-4 flex-shrink-0" style={{ width: '12px' }}>
                {/* Starting node */}
                <div className="w-3 h-3 rounded-full border-2 flex-shrink-0 mt-2 bg-[var(--color-bg)] border-[var(--color-text-primary)]" />
                {/* Vertical bar extending down */}
                <div className="w-0.5 flex-1 bg-[var(--color-text-primary)]" />
              </div>

              {/* Phase 4 content */}
              <div className="flex-1">
                {/* Phase header - matching PhaseSection styling */}
                <div className="mb-4">
                  <h3
                    className="font-serif text-[22px]"
                    style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none', lineHeight: 1, marginBottom: '8px' }}
                  >
                    Follow-Up
                  </h3>

                  {/* Timing info */}
                  <p className="text-[var(--color-text-tertiary)] text-xs" style={{ lineHeight: 1, marginBottom: '6px' }}>
                    Available 8 hours after session
                  </p>

                  {/* Phase description */}
                  <p className="text-[var(--color-text-secondary)]" style={{ lineHeight: 1.3 }}>
                    Reflections and exercises to help you integrate your experience. Add more activities at any time.
                  </p>
                </div>

                {/* Follow-up module cards */}
                <div className="space-y-2">
                  {followUpModules.map((module) => {
                    const isCompleted = module.status === 'completed';
                    const isFollowUpLocked = followUp?.phaseUnlockTime && Date.now() < followUp.phaseUnlockTime;

                    return (
                      <ModuleCard
                        key={module.instanceId}
                        module={module}
                        onClick={() => setSelectedAddedFollowUpModule(module)}
                        statusText={isCompleted ? 'Completed' : undefined}
                        statusIcon={isFollowUpLocked && !isCompleted
                          ? <LockIcon size={24} className="text-[var(--accent)] flex-shrink-0 mt-px" />
                          : undefined
                        }
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ending row: timeline node centered with Add Activity button */}
            <div className="flex">
              <div className="flex flex-col items-center mr-4 flex-shrink-0" style={{ width: '12px' }}>
                <div className="w-0.5 flex-1 bg-[var(--color-text-primary)]" />
                <div className="w-3 h-3 rounded-full border-2 flex-shrink-0 bg-[var(--color-bg)] border-[var(--color-text-primary)]" />
                <div className="flex-1" />
              </div>
              <div className="flex-1 pt-3 pb-3">
                <button
                  onClick={() => handleAddModuleClick('follow-up')}
                  className="w-full py-3 border border-dashed border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)] transition-colors text-sm flex items-center justify-center"
                >
                  + Add Activity
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary + Begin Session — wrapped for tutorial spotlight */}
      <div data-tutorial="begin-session">
        {!isCompletedSession && (
          <TimelineSummary
            totalDuration={totalDuration}
            targetDuration={targetDuration}
            moduleCount={moduleItems.length}
            isActiveSession={isActiveSession}
          />
        )}

        {!isActiveSession && !isCompletedSession && onBeginSession && (
          <div className="mt-8 space-y-4">
            <p className="text-[var(--accent)] text-xs uppercase tracking-wider text-left leading-tight">
              Note: you&apos;ll be guided through everything, including when to take your substance. Don&apos;t take it yet. Press begin when you&apos;re ready.
            </p>
            <button
              onClick={onBeginSession}
              className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider hover:opacity-80 transition-opacity"
            >
              Begin Session
            </button>
          </div>
        )}
      </div>

      {/* Pre-Session Section — collapsed at bottom during active session (only if at least one activity was completed) */}
      {isActiveSession && !isCompletedSession && preSessionModules.length > 0 && preSessionModules.some((m) => m.status === 'completed') && (
        <div className="mt-6">
          <div className="relative flex">
            {/* Timeline node and vertical bar */}
            <div className="flex flex-col items-center mr-4 flex-shrink-0" style={{ width: '12px' }}>
              <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 mt-2 ${
                preSessionExpanded
                  ? 'bg-[var(--color-text-primary)] border-[var(--color-text-primary)]'
                  : 'bg-[var(--color-text-tertiary)] border-[var(--color-text-tertiary)]'
              }`} />
              {preSessionExpanded && (
                <div className="w-0.5 flex-1 bg-[var(--color-text-primary)]" />
              )}
            </div>

            {/* Pre-session content */}
            <div className="flex-1 pb-2">
              <button
                type="button"
                onClick={() => setPreSessionExpanded(!preSessionExpanded)}
                className="flex items-baseline gap-2 w-full text-left"
                style={{ lineHeight: 1, marginBottom: preSessionExpanded ? '8px' : '0' }}
              >
                <span className={`font-serif text-xl ${preSessionExpanded ? '' : 'text-[var(--color-text-tertiary)]'}`} style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
                  Pre-Session
                </span>
                <span className="text-[var(--color-text-tertiary)] text-xs">
                  {preSessionModules.length} {preSessionModules.length === 1 ? 'activity' : 'activities'}
                </span>
                <span className="text-[var(--color-text-tertiary)] text-xs ml-auto">
                  {preSessionExpanded ? '▾' : '▸'}
                </span>
              </button>

              {preSessionExpanded && (
                <div className="space-y-2">
                  {preSessionModules.map((module) => (
                    <ModuleCard
                      key={module.instanceId}
                      module={module}
                      isActiveSession={isActiveSession || isCompletedSession}
                      canRemove={false}
                      onClick={isCompletedSession ? () => setSelectedPreSessionModule(module) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ending node for pre-session timeline */}
          {preSessionExpanded && (
            <div className="relative flex">
              <div className="flex flex-col items-center mr-4 flex-shrink-0" style={{ width: '12px' }}>
                <div className="w-3 h-3 rounded-full border-2 flex-shrink-0 bg-[var(--color-text-primary)] border-[var(--color-text-primary)]" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active session: Go to Active tab prompt */}
      {isActiveSession && !isCompletedSession && (
        <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
          <p className="text-[var(--color-text-tertiary)] text-center">
            Go to the Active tab to engage with your current module
          </p>
        </div>
      )}

      {/* Module Library Drawer */}
      {drawerOpen && (
        <ModuleLibraryDrawer
          phase={activePhase}
          onSelect={handleModuleSelect}
          onClose={() => {
            setDrawerOpen(false);
            setActivePhase(null);
          }}
          onEnterEditMode={enterEditMode}
          isCompletedSession={isCompletedSession}
        />
      )}

      {/* Warning Modal */}
      {warningModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6">
          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-sm rounded-lg p-6 shadow-lg">
            <h3 className="mb-4">Note</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              {warningModal.message}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleWarningConfirm}
                className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider"
              >
                Add Anyway
              </button>
              <button
                onClick={() => setWarningModal(null)}
                className="w-full py-2 text-[var(--color-text-tertiary)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6">
          <div className="bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-sm rounded-lg p-6 shadow-lg">
            <h3 className="mb-4">Can't Add Module</h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              {errorModal.message}
            </p>
            <button
              onClick={() => setErrorModal(null)}
              className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Follow-Up Module Modal */}
      {selectedAddedFollowUpModule && (
        <AltSessionModuleModal
          module={selectedAddedFollowUpModule}
          mode="follow-up"
          onBegin={(mod) => {
            useSessionStore.getState().startModule(mod.instanceId);
            useAppStore.getState().setCurrentTab('active');
          }}
          onClose={() => setSelectedAddedFollowUpModule(null)}
        />
      )}

      {/* Pre-Session Module Modal */}
      {selectedPreSessionModule && (
        <AltSessionModuleModal
          module={selectedPreSessionModule}
          mode="pre-session"
          onBegin={(mod) => startPreSessionModule(mod.instanceId)}
          onClose={() => setSelectedPreSessionModule(null)}
        />
      )}

      {/* Clock Note Modal */}
      {clockNoteOpen && (
        <ClockNoteModal
          isOpen={clockNoteOpen}
          onClose={() => setClockNoteOpen(false)}
          frozenTime={frozenTime}
        />
      )}

      {/* Floating Done Button - shown in edit mode, positioned above footer */}
      {isEditMode && (
        <div className="fixed bottom-14 left-0 right-0 flex justify-center z-40 pointer-events-none">
          <button
            onClick={() => setIsEditMode(false)}
            className="pointer-events-auto px-8 py-3 bg-[var(--accent)] text-white uppercase tracking-wider text-xs rounded-full shadow-lg hover:bg-[var(--accent-hover)] active:scale-95 transition-all"
          >
            Done
          </button>
        </div>
      )}

      {/* Timeline Tutorial Overlay */}
      <TimelineTutorialTrigger />
    </div>
  );
}

/**
 * TimelineTutorialTrigger
 * Waits for the reveal animation to finish before showing the tutorial overlay.
 * On first mount (initial page load): 7.5s delay (reveal takes ~4.7s + buffer).
 * On re-trigger (from "Show Tutorial" menu): 500ms delay.
 */
function TimelineTutorialTrigger() {
  const dismissed = useAppStore((state) => state.dismissedBanners['timeline-tutorial']);
  const dismissBanner = useAppStore((state) => state.dismissBanner);
  const [showTutorial, setShowTutorial] = useState(false);

  // Consume the reveal-animation flag exactly once per component instance.
  // Using useRef + render-time init (rather than reading inside useEffect) is
  // critical: in StrictMode dev, effect setups run twice with a cleanup in
  // between, which would otherwise consume the module-level flag on the first
  // pass and see `false` on the second — collapsing the 7.5s delay to 50ms and
  // flashing the tutorial up during the moon overlay. The ref is preserved
  // across StrictMode's simulated remount, so the second render sees the
  // cached result and skips re-consuming.
  const needsLongDelayRef = useRef(null);
  if (needsLongDelayRef.current === null) {
    needsLongDelayRef.current = consumeRevealAnimationPending();
  }

  useEffect(() => {
    if (dismissed) return;
    // Only wait for reveal animation if Generate Timeline was just pressed.
    // Page refreshes, "Show Tutorial" menu clicks → near-instant.
    const delay = needsLongDelayRef.current ? 7500 : 50;
    const timer = setTimeout(() => setShowTutorial(true), delay);
    return () => clearTimeout(timer);
  }, [dismissed]);

  if (!showTutorial || dismissed) return null;

  return createPortal(
    <TimelineTutorial
      isActive={true}
      onDismiss={() => {
        setShowTutorial(false);
        dismissBanner('timeline-tutorial');
      }}
    />,
    document.body
  );
}

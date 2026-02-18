/**
 * TimelineEditor Component
 * Unified timeline view for both pre-session editing and active session display
 * Each phase section includes its own timeline node that stays aligned with content
 * Shows three phases with module editing capabilities
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSessionStore, calculateBoosterDose } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useAppStore } from '../../stores/useAppStore';
import { getModuleById } from '../../content/modules';
import PhaseSection from './PhaseSection';
import ModuleLibraryDrawer from './ModuleLibraryDrawer';
import TimelineSummary from './TimelineSummary';
import FollowUpModuleModal from '../home/FollowUpModuleModal';
import AddedFollowUpModuleModal from '../home/AddedFollowUpModuleModal';

export default function TimelineEditor({ isActiveSession = false, isCompletedSession = false, onBeginSession }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePhase, setActivePhase] = useState(null);
  const [warningModal, setWarningModal] = useState(null);
  const [errorModal, setErrorModal] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedFollowUpModule, setSelectedFollowUpModule] = useState(null);
  const [selectedAddedFollowUpModule, setSelectedAddedFollowUpModule] = useState(null);
  const [followUpCountdown, setFollowUpCountdown] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);

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

  // Calculate cumulative start times for each phase
  const phase1StartTime = 0;
  const phase2StartTime = comeUpDuration;
  const phase3StartTime = comeUpDuration + peakDuration;

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

  // Update follow-up countdowns for completed sessions
  useEffect(() => {
    if (!isCompletedSession) return;

    const formatCountdown = (unlockTime) => {
      if (!unlockTime) return '';
      const now = Date.now();
      const remaining = unlockTime - now;
      if (remaining <= 0) return 'Available now';
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      if (hours > 0) return `Available in ${hours}h ${minutes}m`;
      return `Available in ${minutes}m`;
    };

    const updateCountdowns = () => {
      checkFollowUpAvailability();
      setFollowUpCountdown({
        checkIn: formatCountdown(followUp?.unlockTimes?.checkIn),
        revisit: formatCountdown(followUp?.unlockTimes?.revisit),
        integration: formatCountdown(followUp?.unlockTimes?.integration),
      });
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 60000);
    return () => clearInterval(interval);
  }, [isCompletedSession, followUp?.unlockTimes, checkFollowUpAvailability]);

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

  const handleModuleSelect = (libraryId, warning) => {
    if (warning) {
      setWarningModal({
        libraryId,
        phase: activePhase,
        message: warning,
      });
      return;
    }

    // For come-up phase, check if adding this module would exceed 60 minutes
    if (activePhase === 'come-up') {
      const currentDuration = getPhaseDuration('come-up');
      const libraryModule = getModuleById(libraryId);
      const newTotal = currentDuration + (libraryModule?.defaultDuration || 0);
      const maxDuration = timeline?.phases?.comeUp?.maxDuration || 60;

      if (newTotal > maxDuration) {
        setWarningModal({
          libraryId,
          phase: activePhase,
          message: `Adding this activity will bring the Come-Up phase to ${newTotal} minutes, which exceeds the recommended ${maxDuration} minutes. The come-up phase should generally not exceed ${maxDuration} minutes. Are you sure you want to add this activity?`,
        });
        return;
      }
    }

    const result = addModule(libraryId, activePhase);
    if (!result.success) {
      setErrorModal({ message: result.error });
      return;
    }

    setDrawerOpen(false);
    setActivePhase(null);
  };

  const handleWarningConfirm = () => {
    const { libraryId, phase } = warningModal;
    addModule(libraryId, phase);
    setWarningModal(null);
    setDrawerOpen(false);
    setActivePhase(null);
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

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

          {/* Edit mode toggle - only show for pre-session or active session (not completed) */}
          {!isCompletedSession && (
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
                isEditMode
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {isEditMode ? 'Done' : 'Edit'}
            </button>
          )}
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
                Booster: +{calculateBoosterDose(substanceChecklist?.plannedDosageMg)}mg at {formatTime(booster.boosterTakenAt)}
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
            {/* Large elapsed time clock - frozen for completed sessions */}
            <p
              className="text-4xl tracking-wide"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
            >
              {formatElapsedClock(elapsedSeconds)}
            </p>
          </div>
        ) : (
          <p className="text-[var(--color-text-secondary)]">
            Review and customize your session. Add or remove activities to match your intentions.
          </p>
        )}
      </div>

      {/* Timeline with integrated nodes in each phase section */}
      <div>
        {/* Come-Up Phase */}
        <PhaseSection
          ref={phase1Ref}
          phase="come-up"
          modules={comeUpModules}
          duration={comeUpDuration}
          maxDuration={comeUpMaxDuration}
          onAddModule={() => handleAddModuleClick('come-up')}
          onRemoveModule={handleRemoveModule}
          isActiveSession={isActiveSession}
          phaseStatus={getPhaseStatus('come-up')}
          currentModuleId={currentModule?.instanceId}
          canRemoveModule={canRemoveModule}
          isEditable={isPhaseEditable('come-up')}
          cumulativeStartTime={phase1StartTime}
          isEditMode={isEditMode}
          onMoveModuleUp={handleMoveModuleUp}
          onMoveModuleDown={handleMoveModuleDown}
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
          currentModuleId={currentModule?.instanceId}
          canRemoveModule={canRemoveModule}
          isEditable={isPhaseEditable('peak')}
          cumulativeStartTime={phase2StartTime}
          isEditMode={isEditMode}
          onMoveModuleUp={handleMoveModuleUp}
          onMoveModuleDown={handleMoveModuleDown}
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
          currentModuleId={currentModule?.instanceId}
          canRemoveModule={canRemoveModule}
          isEditable={isPhaseEditable('integration')}
          cumulativeStartTime={phase3StartTime}
          isEditMode={isEditMode}
          onMoveModuleUp={handleMoveModuleUp}
          onMoveModuleDown={handleMoveModuleDown}
        />

        {/* Closing Ritual - final node on the main session timeline */}
        <div className="relative flex">
          {/* Timeline node - no vertical bar extending down (this is the end of the main timeline) */}
          <div className="flex flex-col items-center mr-4 flex-shrink-0" style={{ width: '12px' }}>
            <div className={`w-3 h-3 rounded-full border-2 ${
              isCompletedSession
                ? 'bg-[var(--color-text-primary)] border-[var(--color-text-primary)]'
                : 'bg-[var(--color-bg)] border-[var(--color-text-primary)]'
            }`} />
          </div>

          {/* Closing Ritual content */}
          <div className="flex-1">
            <h3
              className="font-serif text-lg"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none', lineHeight: 1, marginBottom: '8px' }}
            >
              Closing Ritual {isCompletedSession && <span className="text-[var(--color-text-tertiary)]">✓</span>}
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
                <div className="w-3 h-3 rounded-full border-2 flex-shrink-0 bg-[var(--color-bg)] border-[var(--color-text-primary)]" />
                {/* Vertical bar extending down to modules */}
                <div className="w-0.5 flex-1 bg-[var(--color-text-primary)]" />
              </div>

              {/* Phase 4 content */}
              <div className="flex-1 pb-4">
                {/* Phase header - matching PhaseSection styling */}
                <div className="mb-4">
                  <h3
                    className="flex items-baseline gap-2"
                    style={{ lineHeight: 1, marginBottom: '8px' }}
                  >
                    <span className="font-serif text-lg" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
                      Phase 4
                    </span>
                    <span className="text-[var(--color-text-primary)]">-</span>
                    <span className="text-[var(--color-text-primary)] text-[13px]">
                      Follow-Up
                    </span>
                  </h3>

                  {/* Timing info */}
                  <p className="text-[var(--color-text-tertiary)] text-xs" style={{ lineHeight: 1, marginBottom: '6px' }}>
                    Available 24-48 hours after session
                  </p>

                  {/* Phase description */}
                  <p className="text-[var(--color-text-secondary)]" style={{ lineHeight: 1.3 }}>
                    Short reflections to help you integrate what you experienced.
                  </p>
                </div>

                {/* Follow-up module cards - styled like ModuleCard */}
                <div className="space-y-2">
                  {['checkIn', 'revisit', 'integration'].map((moduleId) => {
                    const moduleState = followUp?.modules?.[moduleId];
                    const status = moduleState?.status || 'locked';
                    const isModuleCompleted = status === 'completed';
                    const isLocked = status === 'locked';
                    const isAvailable = status === 'available';

                    const moduleInfo = {
                      checkIn: { title: 'Check-In', description: 'A brief check-in on how you are feeling since your session.', duration: '5m' },
                      revisit: { title: 'Revisit', description: 'Read back what you wrote during your session.', duration: '10m' },
                      integration: { title: 'Integration Reflection', description: 'Deeper reflection on how insights are integrating into your life.', duration: '10m' },
                    };

                    const info = moduleInfo[moduleId];

                    return (
                      <button
                        key={moduleId}
                        type="button"
                        onClick={() => setSelectedFollowUpModule(moduleId)}
                        className={`group w-full text-left border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)] transition-colors ${
                          isModuleCompleted ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="pl-3 pr-2 py-3">
                          {/* Top row: Title, Duration */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-start flex-1 min-w-0">
                              {/* Status indicator */}
                              <div className="mr-3 w-4 flex-shrink-0 pt-0.5">
                                {isModuleCompleted && <span className="text-[var(--accent)]">✓</span>}
                                {isLocked && <span className="text-[var(--color-text-tertiary)]">🔒</span>}
                                {isAvailable && <span className="text-[var(--color-text-tertiary)]">○</span>}
                              </div>
                              {/* Title */}
                              <p className="text-[var(--color-text-primary)] flex-1 min-w-0">
                                {info.title}
                              </p>
                            </div>
                            {/* Duration */}
                            <span className="text-[var(--color-text-tertiary)] text-sm flex-shrink-0 ml-2">
                              {info.duration}
                            </span>
                          </div>
                          {/* Description */}
                          <p className="text-[var(--color-text-tertiary)] text-xs mt-1 ml-7 line-clamp-2">
                            {isLocked && followUpCountdown[moduleId]
                              ? followUpCountdown[moduleId]
                              : isAvailable
                                ? 'Available now'
                                : isModuleCompleted
                                  ? 'Completed'
                                  : info.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Added follow-up modules from library */}
                {followUpModules.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {followUpModules.map((module) => {
                      const libraryModule = getModuleById(module.libraryId);
                      const unlockDelayHours = libraryModule?.unlockDelay || 24;
                      const closedAt = session?.closedAt;
                      const unlockTime = closedAt
                        ? closedAt + unlockDelayHours * 60 * 60 * 1000
                        : null;
                      const isUnlocked = unlockTime ? Date.now() >= unlockTime : true;
                      const isModuleCompleted = module.status === 'completed';

                      // Calculate countdown for locked modules
                      let countdownText = '';
                      if (unlockTime && !isUnlocked) {
                        const remaining = unlockTime - Date.now();
                        const hours = Math.floor(remaining / (60 * 60 * 1000));
                        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
                        countdownText = hours > 0 ? `Available in ${hours}h ${minutes}m` : `Available in ${minutes}m`;
                      }

                      return (
                        <button
                          key={module.instanceId}
                          type="button"
                          onClick={() => setSelectedAddedFollowUpModule(module)}
                          className={`group w-full text-left border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)] transition-colors ${
                            isModuleCompleted ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="pl-3 pr-2 py-3">
                            {/* Top row: Title, Duration */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-start flex-1 min-w-0">
                                {/* Status indicator */}
                                <div className="mr-3 w-4 flex-shrink-0 pt-0.5">
                                  {isModuleCompleted && <span className="text-[var(--accent)]">✓</span>}
                                  {!isUnlocked && !isModuleCompleted && <span className="text-[var(--color-text-tertiary)]">🔒</span>}
                                  {isUnlocked && !isModuleCompleted && <span className="text-[var(--color-text-tertiary)]">○</span>}
                                </div>
                                {/* Title */}
                                <p className="text-[var(--color-text-primary)] flex-1 min-w-0">
                                  {module.title}
                                </p>
                              </div>
                              {/* Duration */}
                              <span className="text-[var(--color-text-tertiary)] text-sm flex-shrink-0 ml-2">
                                {module.duration}m
                              </span>
                            </div>
                            {/* Description/Status */}
                            <p className="text-[var(--color-text-tertiary)] text-xs mt-1 ml-7 line-clamp-2">
                              {!isUnlocked && !isModuleCompleted
                                ? countdownText
                                : isUnlocked && !isModuleCompleted
                                  ? 'Available now'
                                  : 'Completed'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Add Activity button for follow-up phase */}
                <button
                  onClick={() => handleAddModuleClick('follow-up')}
                  className="mt-3 w-full py-3 border border-dashed border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)] transition-colors text-sm flex items-center justify-center"
                >
                  + Add Activity
                </button>
              </div>
            </div>

            {/* Ending node for Phase 4 timeline */}
            <div className="relative flex">
              <div className="flex flex-col items-center mr-4 flex-shrink-0" style={{ width: '12px' }}>
                <div className="w-3 h-3 rounded-full border-2 flex-shrink-0 bg-[var(--color-bg)] border-[var(--color-text-primary)]" />
              </div>
              <div className="flex-1">
                <p className="text-[var(--color-text-tertiary)] text-xs" style={{ lineHeight: 1 }}>
                  End of follow-up
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary - hide for completed sessions */}
      {!isCompletedSession && (
        <TimelineSummary
          totalDuration={totalDuration}
          targetDuration={targetDuration}
          moduleCount={moduleItems.length}
          isActiveSession={isActiveSession}
        />
      )}

      {/* Begin Session Button (only show pre-session) */}
      {!isActiveSession && !isCompletedSession && onBeginSession && (
        <div className="mt-8 space-y-4">
          <button
            onClick={onBeginSession}
            className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider hover:opacity-80 transition-opacity"
          >
            Begin Session
          </button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
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

      {/* Follow-Up Module Modal (built-in modules) */}
      {selectedFollowUpModule && (
        <FollowUpModuleModal
          moduleId={selectedFollowUpModule}
          onClose={() => setSelectedFollowUpModule(null)}
        />
      )}

      {/* Added Follow-Up Module Modal (library modules) */}
      {selectedAddedFollowUpModule && (
        <AddedFollowUpModuleModal
          module={selectedAddedFollowUpModule}
          onClose={() => setSelectedAddedFollowUpModule(null)}
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
    </div>
  );
}

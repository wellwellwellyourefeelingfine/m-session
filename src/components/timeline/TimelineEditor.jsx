/**
 * TimelineEditor Component
 * Unified timeline view for both pre-session editing and active session display
 * Each phase section includes its own timeline node that stays aligned with content
 * Shows three phases with module editing capabilities
 */

import { useState, useEffect, useRef } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { getModuleById } from '../../content/modules';
import PhaseSection from './PhaseSection';
import ModuleLibraryDrawer from './ModuleLibraryDrawer';
import TimelineSummary from './TimelineSummary';

export default function TimelineEditor({ isActiveSession = false, onBeginSession }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePhase, setActivePhase] = useState(null);
  const [warningModal, setWarningModal] = useState(null);
  const [errorModal, setErrorModal] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Refs for phase sections (for potential future use)
  const phase1Ref = useRef(null);
  const phase2Ref = useRef(null);
  const phase3Ref = useRef(null);

  const modules = useSessionStore((state) => state.modules);
  const timeline = useSessionStore((state) => state.timeline);
  const substanceChecklist = useSessionStore((state) => state.substanceChecklist);
  const intake = useSessionStore((state) => state.intake);
  const preSubstanceActivity = useSessionStore((state) => state.preSubstanceActivity);
  const getEntryById = useJournalStore((state) => state.getEntryById);
  const addModule = useSessionStore((state) => state.addModule);
  const removeModule = useSessionStore((state) => state.removeModule);
  const getPhaseDuration = useSessionStore((state) => state.getPhaseDuration);
  const getTotalDuration = useSessionStore((state) => state.getTotalDuration);
  const getCurrentModule = useSessionStore((state) => state.getCurrentModule);

  const currentModule = getCurrentModule();
  const currentPhase = timeline?.currentPhase;

  const moduleItems = modules?.items || [];
  const comeUpModules = moduleItems.filter((m) => m.phase === 'come-up').sort((a, b) => a.order - b.order);
  const integrationModules = moduleItems.filter((m) => m.phase === 'integration').sort((a, b) => a.order - b.order);

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
  useEffect(() => {
    if (!isActiveSession) return;

    const updateElapsed = () => {
      const ingestionTime = substanceChecklist?.ingestionTime;
      if (ingestionTime) {
        const seconds = Math.floor((Date.now() - new Date(ingestionTime).getTime()) / 1000);
        setElapsedSeconds(Math.max(0, seconds));
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [isActiveSession, substanceChecklist?.ingestionTime]);

  // Format elapsed time as HH:MM:SS
  const formatElapsedClock = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine if a phase is editable (can add/remove modules)
  const isPhaseEditable = (phase) => {
    if (!isActiveSession) return true; // Pre-session: all phases editable

    // During session: only future phases are editable
    const phaseOrder = { 'come-up': 0, peak: 1, integration: 2 };
    const currentPhaseOrder = phaseOrder[currentPhase] ?? -1;
    const targetPhaseOrder = phaseOrder[phase] ?? -1;

    // Can edit current phase (future modules) or future phases
    return targetPhaseOrder >= currentPhaseOrder;
  };

  // Check if a specific module can be removed (must be upcoming, not active or completed)
  const canRemoveModule = (module) => {
    if (!isActiveSession) return true;
    return module.status === 'upcoming';
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

  // Get phase status for visual styling
  const getPhaseStatus = (phase) => {
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
      <div className="mb-4">
        <h2
          className="mb-2 font-serif text-2xl"
          style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
        >
          My Timeline
        </h2>

        {isActiveSession ? (
          <div className="space-y-1">
            <p className="text-[var(--color-text-secondary)]">
              Started at {formatTime(substanceChecklist?.ingestionTime)}
            </p>
            <p className="text-[var(--color-text-secondary)]">
              Dosage: {substanceChecklist?.plannedDosageMg || '—'}mg
            </p>
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
            {/* Large elapsed time clock */}
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
        />

        {/* Closing Ritual - final node on the timeline */}
        <div className="relative flex">
          {/* Timeline node - final endpoint */}
          <div className="flex flex-col items-center mr-4 flex-shrink-0" style={{ width: '12px' }}>
            <div className="w-3 h-3 rounded-full border-2 bg-[var(--color-bg)] border-[var(--color-text-primary)]" />
          </div>

          {/* Closing Ritual content */}
          <div className="flex-1 pb-2">
            <h3
              className="font-serif text-lg"
              style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none', lineHeight: 1, marginBottom: '8px' }}
            >
              Closing Ritual
            </h3>
            <p className="text-[var(--color-text-tertiary)] text-xs" style={{ lineHeight: 1, marginBottom: '6px' }}>
              End of session
            </p>
            <p className="text-[var(--color-text-secondary)]" style={{ lineHeight: 1.3 }}>
              A gentle way to mark the end of your journey and honor the experience.
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <TimelineSummary
        totalDuration={totalDuration}
        targetDuration={targetDuration}
        moduleCount={moduleItems.length}
        isActiveSession={isActiveSession}
      />

      {/* Begin Session Button (only show pre-session) */}
      {!isActiveSession && onBeginSession && (
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
      {isActiveSession && (
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
    </div>
  );
}

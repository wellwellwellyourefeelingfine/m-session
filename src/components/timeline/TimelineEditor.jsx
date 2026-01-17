/**
 * TimelineEditor Component
 * Unified timeline view for both pre-session editing and active session display
 * Shows three phases with bracket UI and module editing capabilities
 */

import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import PhaseSection from './PhaseSection';
import ModuleLibraryDrawer from './ModuleLibraryDrawer';
import TimelineSummary from './TimelineSummary';

export default function TimelineEditor({ isActiveSession = false, onBeginSession }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activePhase, setActivePhase] = useState(null);
  const [warningModal, setWarningModal] = useState(null);
  const [errorModal, setErrorModal] = useState(null);
  const [elapsedDisplay, setElapsedDisplay] = useState('0m');

  const modules = useSessionStore((state) => state.modules);
  const timeline = useSessionStore((state) => state.timeline);
  const addModule = useSessionStore((state) => state.addModule);
  const removeModule = useSessionStore((state) => state.removeModule);
  const validatePhaseModules = useSessionStore((state) => state.validatePhaseModules);
  const getPhaseDuration = useSessionStore((state) => state.getPhaseDuration);
  const getTotalDuration = useSessionStore((state) => state.getTotalDuration);
  const getElapsedMinutes = useSessionStore((state) => state.getElapsedMinutes);
  const getCurrentModule = useSessionStore((state) => state.getCurrentModule);

  const currentModule = getCurrentModule();
  const currentPhase = timeline?.currentPhase;

  const moduleItems = modules?.items || [];
  const comeUpModules = moduleItems.filter((m) => m.phase === 'come-up').sort((a, b) => a.order - b.order);
  const peakModules = moduleItems.filter((m) => m.phase === 'peak').sort((a, b) => a.order - b.order);
  const integrationModules = moduleItems.filter((m) => m.phase === 'integration').sort((a, b) => a.order - b.order);

  const comeUpDuration = getPhaseDuration('come-up');
  const peakDuration = getPhaseDuration('peak');
  const integrationDuration = getPhaseDuration('integration');
  const totalDuration = getTotalDuration();

  // Safe access to phase durations with defaults
  const comeUpMaxDuration = timeline?.phases?.comeUp?.maxDuration || 60;
  const peakAllocatedDuration = timeline?.phases?.peak?.allocatedDuration || 90;
  const integrationAllocatedDuration = timeline?.phases?.integration?.allocatedDuration || 120;
  const targetDuration = timeline?.targetDuration || 240;

  // Update elapsed time display during active session
  useEffect(() => {
    if (!isActiveSession) return;

    const updateElapsed = () => {
      const minutes = getElapsedMinutes();
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours > 0) {
        setElapsedDisplay(`${hours}h ${mins}m`);
      } else {
        setElapsedDisplay(`${mins}m`);
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 60000);
    return () => clearInterval(interval);
  }, [isActiveSession, getElapsedMinutes]);

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

    const result = addModule(libraryId, activePhase);
    if (!result.success) {
      setErrorModal({ message: result.error });
      return;
    }

    // Validate phase after adding
    const validation = validatePhaseModules(activePhase);
    if (!validation.valid) {
      // Remove the module we just added
      removeModule(result.module.instanceId);
      setErrorModal({ message: validation.error });
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
    <div className="max-w-md mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="mb-2">
          {isActiveSession ? 'Session Timeline' : 'Your Session Timeline'}
        </h2>

        {isActiveSession ? (
          <div className="space-y-2">
            <p className="text-[var(--color-text-secondary)]">
              Started at {formatTime(timeline?.actualStartTime)} · {elapsedDisplay} elapsed
            </p>
            {/* Phase progress indicator */}
            <div className="flex items-center space-x-2 text-sm">
              <PhaseIndicator label="Come-Up" status={getPhaseStatus('come-up')} />
              <span className="text-[var(--color-text-tertiary)]">→</span>
              <PhaseIndicator label="Peak" status={getPhaseStatus('peak')} />
              <span className="text-[var(--color-text-tertiary)]">→</span>
              <PhaseIndicator label="Integration" status={getPhaseStatus('integration')} />
            </div>
          </div>
        ) : (
          <p className="text-[var(--color-text-secondary)]">
            Review and customize your session. Add or remove activities to match your intentions.
          </p>
        )}
      </div>

      {/* Timeline with phase brackets */}
      <div className="relative">
        {/* Phase sections */}
        <div className="space-y-6">
          {/* Come-Up Phase */}
          <PhaseSection
            phase="come-up"
            title="Come-Up"
            subtitle="20-60 min"
            description="Settling in, grounding, gentle activities"
            modules={comeUpModules}
            duration={comeUpDuration}
            maxDuration={comeUpMaxDuration}
            onAddModule={() => handleAddModuleClick('come-up')}
            onRemoveModule={handleRemoveModule}
            isFirst
            isActiveSession={isActiveSession}
            phaseStatus={getPhaseStatus('come-up')}
            currentModuleId={currentModule?.instanceId}
            canRemoveModule={canRemoveModule}
            isEditable={isPhaseEditable('come-up')}
          />

          {/* Peak Phase */}
          <PhaseSection
            phase="peak"
            title="Peak"
            subtitle="~60-120 min"
            description="Open awareness, light exploration"
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
          />

          {/* Integration Phase */}
          <PhaseSection
            phase="integration"
            title="Integration"
            subtitle="Remaining time"
            description="Deeper work, journaling, closing"
            modules={integrationModules}
            duration={integrationDuration}
            maxDuration={integrationAllocatedDuration}
            onAddModule={() => handleAddModuleClick('integration')}
            onRemoveModule={handleRemoveModule}
            isLast
            isActiveSession={isActiveSession}
            phaseStatus={getPhaseStatus('integration')}
            currentModuleId={currentModule?.instanceId}
            canRemoveModule={canRemoveModule}
            isEditable={isPhaseEditable('integration')}
          />
        </div>
      </div>

      {/* Summary */}
      <TimelineSummary
        totalDuration={totalDuration}
        targetDuration={targetDuration}
        moduleCount={moduleItems.length}
        isActiveSession={isActiveSession}
        elapsedDisplay={elapsedDisplay}
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

function PhaseIndicator({ label, status }) {
  const getStyles = () => {
    switch (status) {
      case 'completed':
        return 'text-[var(--color-text-tertiary)]';
      case 'active':
        return 'text-[var(--color-text-primary)] font-medium';
      default:
        return 'text-[var(--color-text-tertiary)]';
    }
  };

  return (
    <span className={getStyles()}>
      {label}
      {status === 'active' && ' ●'}
      {status === 'completed' && ' ✓'}
    </span>
  );
}

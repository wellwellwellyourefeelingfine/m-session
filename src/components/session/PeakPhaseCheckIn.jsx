/**
 * PeakPhaseCheckIn Component
 * Modal that appears when the user finishes all scheduled peak activities.
 *
 * Shows:
 * - Session elapsed time
 * - Booster timing warning (if applicable)
 * - Option to add more peak activities (opens ModuleLibraryDrawer)
 * - Option to continue to next scheduled activity (after adding)
 * - Option to continue to integration phase
 */

import { useState } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import ModuleLibraryDrawer from '../timeline/ModuleLibraryDrawer';

// Format elapsed minutes as human-readable string
const formatElapsedTime = (minutes) => {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours !== 1 ? 's' : ''} and ${mins} minute${mins !== 1 ? 's' : ''}`;
};

export default function PeakPhaseCheckIn() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [warningModal, setWarningModal] = useState(null);

  // Store subscriptions
  const booster = useSessionStore((state) => state.booster);
  const addModule = useSessionStore((state) => state.addModule);
  const beginIntegrationTransition = useSessionStore((state) => state.beginIntegrationTransition);
  const dismissPeakCheckIn = useSessionStore((state) => state.dismissPeakCheckIn);
  const modules = useSessionStore((state) => state.modules);
  const getElapsedMinutes = useSessionStore((state) => state.getElapsedMinutes);

  // Computed values
  const elapsedMinutes = getElapsedMinutes();
  const boosterTaken = booster.status === 'taken';
  const minutesSinceBooster = boosterTaken && booster.boosterTakenAt
    ? Math.floor((Date.now() - new Date(booster.boosterTakenAt).getTime()) / (1000 * 60))
    : null;
  const showBoosterWarning = boosterTaken && minutesSinceBooster !== null && minutesSinceBooster < 45;

  // Check if there are upcoming peak modules (user may have just added one)
  const hasUpcomingPeakModules = modules.items
    .some((m) => m.phase === 'peak' && m.status === 'upcoming' && !m.isBoosterModule);

  // Handle module selection from drawer
  const handleModuleSelect = (libraryId, warning) => {
    if (warning) {
      setWarningModal({ libraryId, message: warning });
      return;
    }

    addModule(libraryId, 'peak');
    setDrawerOpen(false);
  };

  // Handle warning confirmation
  const handleWarningConfirm = () => {
    if (warningModal) {
      addModule(warningModal.libraryId, 'peak');
      setWarningModal(null);
      setDrawerOpen(false);
    }
  };

  // Handle continue to next scheduled activity
  const handleContinueToNext = () => {
    dismissPeakCheckIn();
  };

  // Handle continue to integration phase
  const handleContinueToIntegration = () => {
    beginIntegrationTransition();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fadeIn">
        <div className="bg-[var(--color-bg)] w-full max-w-md rounded-t-2xl p-6 pb-8 animate-slideUp">
          <h3 className="mb-4">End of Peak Phase</h3>

          <p className="text-[var(--color-text-secondary)] mb-4 leading-relaxed">
            You've finished all of your scheduled activities in the peak phase.
          </p>

          <p className="text-[var(--color-text-tertiary)] text-sm mb-6">
            {formatElapsedTime(elapsedMinutes)} have elapsed since you started your session.
          </p>

          {/* Booster timing warning */}
          {showBoosterWarning && (
            <div className="border border-[var(--accent)] bg-[var(--accent-bg)] p-4 mb-6">
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                It's been {minutesSinceBooster} minute{minutesSinceBooster !== 1 ? 's' : ''} since
                you took your booster. You may want to wait and experience the effects before
                moving into the integration phase.
              </p>
            </div>
          )}

          <p className="text-[var(--color-text-secondary)] text-sm mb-4">
            Would you like to add more activities to your peak phase?
          </p>

          <div className="space-y-3">
            {/* Add Activity button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-full py-3 border border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-sm"
            >
              + Add Activity
            </button>

            {/* Continue to next activity (only if modules were added) */}
            {hasUpcomingPeakModules && (
              <button
                onClick={handleContinueToNext}
                className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs"
              >
                Continue to My Next Scheduled Activity
              </button>
            )}

            {/* Continue to integration phase */}
            <button
              onClick={handleContinueToIntegration}
              className="w-full py-4 border border-[var(--color-border)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              Continue to Integration Phase
            </button>
          </div>

          <p className="text-[var(--color-text-tertiary)] text-xs mt-6 text-center">
            You can also add activities from the Home tab timeline.
          </p>
        </div>
      </div>

      {/* Module library drawer */}
      {drawerOpen && (
        <ModuleLibraryDrawer
          phase="peak"
          onSelect={handleModuleSelect}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      {/* Warning confirmation modal for deep-intensity modules */}
      {warningModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] px-6"
          onClick={() => setWarningModal(null)}
        >
          <div
            className="bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-xs p-6 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[var(--color-text-secondary)] text-sm mb-6 leading-relaxed">
              {warningModal.message}
            </p>
            <div className="space-y-3">
              <button
                onClick={handleWarningConfirm}
                className="w-full py-3 border border-[var(--color-border)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                Add Anyway
              </button>
              <button
                onClick={() => setWarningModal(null)}
                className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-xs hover:opacity-80 transition-opacity"
              >
                Choose Another
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * ModuleCard Component
 * Individual module card in the timeline editor
 * Displays module info with remove option
 * Supports clickable duration for variable-duration modules
 * Layout: Title top-left, description below, duration on right
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getModuleById } from '../../content/modules';
import { useSessionStore, calculateBoosterDose } from '../../stores/useSessionStore';
import DurationPicker from '../shared/DurationPicker';
import ModuleDetailModal from './ModuleDetailModal';
import AsciiDiamond from '../active/capabilities/animations/AsciiDiamond';

export default function ModuleCard({
  module,
  onRemove,
  isActiveSession = false,
  isCurrentModule = false,
  canRemove = true,
  isEditMode = false,
}) {
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBoosterInfo, setShowBoosterInfo] = useState(false);
  const [isBoosterInfoClosing, setIsBoosterInfoClosing] = useState(false);
  const updateModuleDuration = useSessionStore((state) => state.updateModuleDuration);

  const libraryModule = getModuleById(module.libraryId);

  // Check if this module supports variable duration
  const hasVariableDuration = libraryModule?.hasVariableDuration === true;
  const durationSteps = libraryModule?.durationSteps || [10, 15, 20, 25, 30];
  const canEditDuration = hasVariableDuration && !isActiveSession;

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  // Determine styling based on module status during active session
  const isBooster = module.isBoosterModule || module.libraryId === 'booster-consideration';
  const booster = useSessionStore((state) => state.booster);

  // For booster modules, gray-out is based on the booster decision status, not module status
  const isCompleted = isActiveSession && (isBooster
    ? booster.status === 'taken'
    : module.status === 'completed');
  const isSkipped = isActiveSession && (isBooster
    ? (booster.status === 'skipped' || booster.status === 'expired')
    : module.status === 'skipped');
  const isGrayedOut = isCompleted || isSkipped;
  const plannedDosageMg = useSessionStore((state) => state.substanceChecklist.plannedDosageMg);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const sessionPhase = useSessionStore((state) => state.sessionPhase);
  const reopenBoosterModal = useSessionStore((state) => state.reopenBoosterModal);
  const boosterDoseMg = booster.boosterDoseMg ?? (plannedDosageMg ? calculateBoosterDose(plannedDosageMg) : null);

  // Determine if "Go To Booster" button should show in the booster info modal
  const minutesSinceDose = ingestionTime ? (Date.now() - ingestionTime) / (1000 * 60) : 0;
  const isBoosterReopenAvailable =
    isActiveSession &&
    sessionPhase === 'active' &&
    booster.status !== 'taken' &&
    !!ingestionTime &&
    minutesSinceDose >= 90 &&
    minutesSinceDose < 150;

  const formatTimestamp = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getBorderClass = () => {
    // All states use border-2 to prevent layout jitter when toggling edit mode
    if (isEditMode && canRemove && !isCurrentModule) {
      return 'border-2 border-dashed border-[var(--accent)]';
    }
    if (isCurrentModule) return 'border-2 border-[var(--accent)]';
    if (isBooster && isGrayedOut) return 'border-2 border-[var(--accent)] opacity-80';
    if (isGrayedOut) return 'border-2 border-[var(--color-border)] opacity-50';
    if (isBooster) return 'border-2 border-[var(--accent)] bg-[var(--accent-bg)]';
    return 'border-2 border-[var(--color-border)]';
  };

  const getTextClass = () => {
    if (isGrayedOut) return 'text-[var(--color-text-tertiary)]';
    if (isCurrentModule) return 'text-[var(--color-text-primary)]';
    return 'text-[var(--color-text-primary)]';
  };

  // Handle card click to open detail modal
  const handleCardClick = () => {
    if (isBooster) {
      setShowBoosterInfo(true);
      return;
    }
    setShowDetailModal(true);
  };

  const handleCloseBoosterInfo = () => {
    setIsBoosterInfoClosing(true);
    setTimeout(() => {
      setIsBoosterInfoClosing(false);
      setShowBoosterInfo(false);
    }, 200);
  };

  const handleGoToBooster = () => {
    reopenBoosterModal();
    handleCloseBoosterInfo();
  };

  // Handle escape key for booster info modal
  useEffect(() => {
    if (!showBoosterInfo) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') handleCloseBoosterInfo();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showBoosterInfo]);

  return (
    <div
      className={`group relative bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)] transition-all duration-200 cursor-pointer flex-1 ${getBorderClass()} ${isBooster ? 'rounded-3xl' : ''}`}
      onClick={handleCardClick}
    >
      <div className={`${isBooster ? 'pl-6 pr-2 pt-2 pb-1' : 'pl-3 pr-2 py-3'}`}>
        {isBooster ? (
          // Booster module - left-aligned layout matching other modules
          <div className="w-full">
            <div className="flex items-start justify-between">
              <p
                className={`text-[1.05rem] normal-case ${isGrayedOut ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}
                style={{ fontFamily: 'DM Serif Text, serif', fontStyle: 'italic', lineHeight: 1 }}
              >
                {booster.status === 'taken' && booster.boosterTakenAt
                  ? `Booster of ${boosterDoseMg}mg taken at ${formatTimestamp(booster.boosterTakenAt)}`
                  : module.title}
              </p>
              <div className="flex items-start space-x-1 flex-shrink-0 ml-2">
                {!(booster.status === 'taken' && booster.boosterTakenAt) && (
                  <span className="text-[var(--color-text-tertiary)] text-xs" style={{ lineHeight: 1.2 }}>
                    ~5m
                  </span>
                )}
                {canRemove && isEditMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove();
                    }}
                    className="ml-2 w-7 h-7 rounded-full flex items-center justify-center text-sm
                               bg-[var(--color-bg)] border border-[var(--accent)] text-[var(--accent)]
                               hover:bg-[var(--accent)] hover:text-white transition-colors"
                    title="Remove"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            {!(booster.status === 'taken' && booster.boosterTakenAt) && (
              <p className="text-[var(--color-text-tertiary)] text-xs" style={{ lineHeight: 1.2, marginTop: '4px' }}>
                Optional re-dose of about half initial dose to extend peak phase
              </p>
            )}
          </div>
        ) : (
          // Regular module - new layout
          <>
            {/* Top row: Status (if active), Title, Duration, Remove button */}
            <div className="flex items-start justify-between">
              {/* Left side: Status indicator + Title */}
              <div className="flex items-start flex-1 min-w-0">
                {/* Status indicator for active session */}
                {isActiveSession && (
                  <div className="mr-3 w-4 flex-shrink-0 pt-0.5">
                    {isCompleted && <span className="text-[var(--accent)]">✓</span>}
                    {isSkipped && <span className="text-[var(--color-text-tertiary)]">—</span>}
                    {isCurrentModule && <span className="text-[var(--accent)]">●</span>}
                    {!isCompleted && !isSkipped && !isCurrentModule && <span className="text-[var(--color-text-tertiary)]">○</span>}
                  </div>
                )}

                {/* Title - top left aligned */}
                <p className={`${getTextClass()} flex-1 min-w-0`}>
                  {module.title}
                </p>
              </div>

              {/* Right side: Duration and Remove button - aligned to top-right */}
              <div className="flex items-start space-x-1 flex-shrink-0">
                {canEditDuration ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDurationPicker(true);
                    }}
                    className="text-[var(--color-text-secondary)] text-sm underline decoration-dotted underline-offset-2 hover:text-[var(--color-text-primary)] transition-colors"
                    title="Click to change duration"
                  >
                    {formatDuration(module.duration)}
                  </button>
                ) : (
                  <span className="text-[var(--color-text-tertiary)] text-sm">
                    {formatDuration(module.duration)}
                  </span>
                )}

                {/* Remove button - visible in edit mode, hidden otherwise (hover to show) */}
                {canRemove && isEditMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove();
                    }}
                    className="ml-2 w-7 h-7 rounded-full flex items-center justify-center text-sm
                               bg-[var(--color-bg)] border border-[var(--accent)] text-[var(--accent)]
                               hover:bg-[var(--accent)] hover:text-white transition-colors"
                    title="Remove"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Description or completion times */}
            {isActiveSession && (isCompleted || isSkipped) && module.startedAt ? (
              <p className={`text-[var(--color-text-tertiary)] text-xs mt-1 ml-7`}>
                {formatTimestamp(module.startedAt)}
                {module.completedAt && ` – ${formatTimestamp(module.completedAt)}`}
              </p>
            ) : (
              libraryModule?.description && (
                <p className={`text-[var(--color-text-tertiary)] text-xs mt-1 line-clamp-2 ${isActiveSession ? 'ml-7' : ''}`}>
                  {libraryModule.description}
                </p>
              )
            )}
          </>
        )}
      </div>

      {/* Duration Picker Modal */}
      {showDurationPicker && (
        <DurationPicker
          isOpen={showDurationPicker}
          onClose={() => setShowDurationPicker(false)}
          onSelect={(newDuration) => {
            updateModuleDuration(module.instanceId, newDuration);
          }}
          currentDuration={module.duration}
          durationSteps={durationSteps}
          minDuration={libraryModule?.minDuration || 10}
          maxDuration={libraryModule?.maxDuration || 30}
        />
      )}

      {/* Module Detail Modal */}
      {showDetailModal && (
        <ModuleDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          module={module}
          onDurationChange={(newDuration) => {
            updateModuleDuration(module.instanceId, newDuration);
          }}
          isActiveSession={isActiveSession}
        />
      )}

      {/* Booster Info Modal */}
      {showBoosterInfo && createPortal(
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 ${isBoosterInfoClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
          onClick={handleCloseBoosterInfo}
        >
          <div
            className={`bg-[var(--color-bg)] border border-[var(--color-border)] w-full max-w-sm shadow-lg max-h-[85vh] overflow-y-auto ${isBoosterInfoClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--color-border)] flex justify-between items-start">
              <div className="flex-1 min-w-0 pr-4">
                <h3
                  className="font-serif text-xl"
                  style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                >
                  Booster Check-In
                </h3>
                <p className="text-[var(--color-text-tertiary)] text-sm mt-1">
                  Optional • Peak Phase
                </p>
              </div>
              <button
                onClick={handleCloseBoosterInfo}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] p-1 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              <p className="text-[var(--color-text-secondary)]">
                A guided check-in to help you decide whether a supplemental dose is right for you at this point in your session.
              </p>

              <div className="flex justify-center py-1">
                <AsciiDiamond />
              </div>

              <div>
                <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider mb-2">
                  How it works
                </p>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  The booster check-in is automatically placed in the peak phase and will prompt you around the 90-minute mark after ingestion, or 30 minutes after you report feeling fully arrived — whichever comes first. You'll walk through a brief check-in about your experience, body, and trajectory before deciding.
                </p>
              </div>

              <div>
                <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider mb-2">
                  Timing window
                </p>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  The booster window opens as early as 60 minutes and closes at 150 minutes after ingestion. Taking a booster after this window mostly extends the comedown without meaningfully extending the peak.
                </p>
              </div>

              <div>
                <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider mb-2">
                  Dosage
                </p>
                <p className="text-[var(--color-text-secondary)] text-sm">
                  The recommended booster is approximately half your initial dose, in the range of 30–75mg. You can adjust this during the check-in. Most harm reduction guidance suggests keeping total session dosage under 200mg.
                </p>
              </div>

              <div>
                <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider mb-2">
                  Good to know
                </p>
                <ul className="text-[var(--color-text-secondary)] text-sm space-y-2">
                  <li>A booster extends the peak phase by approximately 1–2 hours.</li>
                  <li>It is entirely optional — many meaningful sessions happen with a single dose.</li>
                  <li>Not recommended for first-time experiences, where a single dose allows you to understand your individual response.</li>
                  <li>Weigh out your booster dose at the same time as your initial dose. It can be difficult to measure accurately under the effects of the initial dose, which may cloud judgment.</li>
                  <li>You can always skip the booster or snooze the check-in to decide later.</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--color-border)] space-y-2">
              {isBoosterReopenAvailable && (
                <button
                  onClick={handleGoToBooster}
                  className="w-full py-3 bg-[var(--accent)] text-white uppercase tracking-wider text-sm hover:opacity-80 transition-opacity"
                >
                  Go to Booster
                </button>
              )}
              <button
                onClick={handleCloseBoosterInfo}
                className="w-full py-3 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-sm hover:opacity-80 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/**
 * ModuleCard Component
 * Individual module card in the timeline editor
 * Displays module info with remove option
 * Supports clickable duration for variable-duration modules
 * Layout: Title top-left, description below, duration on right
 */

import { useState } from 'react';
import { getModuleById, CATEGORY_ICONS, MODULE_ICONS } from '../../content/modules';
import { useSessionStore, calculateBoosterDose } from '../../stores/useSessionStore';
import DurationPicker from '../shared/DurationPicker';
import ModuleDetailModal from './ModuleDetailModal';
import { SparkleIcon, CircleCheckIcon, CircleSkipIcon, CompassIcon, WavesIcon, BoatIcon, NotebookPenIcon, LeafIcon, MusicIcon, HeartHandshakeIcon, SnailIcon, ClockIcon, FireIcon } from '../shared/Icons';

// Resolve icon string keys to components
const ICON_MAP = {
  sparkle: SparkleIcon,
  compass: CompassIcon,
  waves: WavesIcon,
  boat: BoatIcon,
  'notebook-pen': NotebookPenIcon,
  leaf: LeafIcon,
  music: MusicIcon,
  'heart-handshake': HeartHandshakeIcon,
  snail: SnailIcon,
  clock: ClockIcon,
  fire: FireIcon,
};

function getModuleIcon(libraryId, category) {
  // Layer 3: individual override
  if (libraryId && MODULE_ICONS[libraryId]) return ICON_MAP[MODULE_ICONS[libraryId]] || SparkleIcon;
  // Layer 2: category override
  if (category && CATEGORY_ICONS[category]) return ICON_MAP[CATEGORY_ICONS[category]] || SparkleIcon;
  // Layer 1: default
  return SparkleIcon;
}

export default function ModuleCard({
  module,
  onRemove,
  isActiveSession = false,
  isCurrentModule = false,
  canRemove = true,
  isEditMode = false,
  dataTutorial,
  onClick,
  statusIcon,
  statusText,
  phaseCompleted = false,
}) {
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
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
  const plannedDosageMg = useSessionStore((state) => state.sessionProfile.plannedDosageMg);
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
    if (isGrayedOut) return `border-2 border-[var(--color-border)] ${phaseCompleted ? '' : 'opacity-50'}`;
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
    if (onClick) {
      onClick();
      return;
    }
    setShowDetailModal(true);
  };

  const handleGoToBooster = () => {
    reopenBoosterModal();
    setShowDetailModal(false);
  };

  return (
    <div
      className={`group relative bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)] transition-all duration-200 cursor-pointer flex-1 ${getBorderClass()} ${isBooster ? 'rounded-3xl' : ''}`}
      onClick={handleCardClick}
      data-tutorial={dataTutorial}
    >
      <div className={`${isBooster ? 'pl-3 pr-4 pt-3 pb-0.5' : isGrayedOut ? 'pl-3 pr-4 py-1.5' : 'pl-3 pr-4 pt-3 pb-0.5'}`}>
        {isBooster ? (
          // Booster module - mirrors the regular module layout
          <>
            {/* Top row: Title + Duration + Remove button */}
            <div className="flex items-start justify-between">
              <div className="flex items-start flex-1 min-w-0">
                <p className={`${getTextClass()} flex-1 min-w-0 text-[18px]`} style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
                  Booster Dose
                </p>
              </div>
              <div className="flex items-start space-x-1 flex-shrink-0">
                <span className="text-[var(--color-text-tertiary)] text-sm">
                  ~5m
                </span>
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

            {/* Description row: FireIcon + description text */}
            <div className="flex items-start gap-3.5 -mt-0.5">
              <FireIcon size={24} className="text-[var(--accent)] flex-shrink-0 mt-px" />
              <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider line-clamp-3 min-w-0">
                {booster.status === 'taken' && booster.boosterTakenAt
                  ? <>Booster of {boosterDoseMg}mg<br />taken at {formatTimestamp(booster.boosterTakenAt)}</>
                  : 'Optional supplemental dose at the peak to extend your session.'}
              </p>
            </div>
          </>
        ) : (
          // Regular module - new layout
          <>
            {/* Top row: Status (if active), Title, Duration, Remove button */}
            <div className="flex items-start justify-between">
              {/* Left side: Status indicator + Title */}
              <div className="flex items-start flex-1 min-w-0">
                {/* Title - top left aligned */}
                <p className={`${getTextClass()} flex-1 min-w-0 text-[18px]`} style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
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
              <div className="flex items-center gap-2 -mt-2 overflow-visible" style={{ height: '16px' }}>
                {isCompleted
                  ? <CircleCheckIcon size={24} className="text-[var(--accent)] flex-shrink-0 -mt-2.5" />
                  : <CircleSkipIcon size={24} className="text-[var(--color-text-tertiary)] flex-shrink-0 -mt-2.5" />
                }
                <p className="text-[var(--color-text-tertiary)] text-xs" style={{ transform: 'translateY(2.5px)' }}>
                  {formatTimestamp(module.startedAt)}
                  {module.completedAt && ` – ${formatTimestamp(module.completedAt)}`}
                </p>
              </div>
            ) : (
              (statusText || libraryModule?.description) && (
                <div className="flex items-start gap-3.5 -mt-0.5">
                  {statusIcon || (() => { const Icon = getModuleIcon(module.libraryId, libraryModule?.category); return <Icon size={24} className="text-[var(--accent)] flex-shrink-0 mt-px" />; })()}
                  <p className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider line-clamp-3 min-w-0">
                    {statusText || libraryModule.description}
                  </p>
                </div>
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
          mode={isBooster ? 'booster' : 'info'}
          isBoosterReopenAvailable={isBooster && isBoosterReopenAvailable}
          onGoToBooster={isBooster ? handleGoToBooster : undefined}
        />
      )}
    </div>
  );
}

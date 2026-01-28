/**
 * ModuleCard Component
 * Individual module card in the timeline editor
 * Displays module info with remove option
 * Supports clickable duration for variable-duration modules
 * Layout: Title top-left, description below, duration on right
 */

import { useState } from 'react';
import { getModuleById } from '../../content/modules';
import { useSessionStore, calculateBoosterDose } from '../../stores/useSessionStore';
import DurationPicker from '../shared/DurationPicker';
import ModuleDetailModal from './ModuleDetailModal';

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
  const boosterDoseMg = plannedDosageMg ? calculateBoosterDose(plannedDosageMg) : null;

  const formatTimestamp = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getBorderClass = () => {
    // Edit mode styling takes precedence (except for booster and current module)
    if (isEditMode && !isBooster && !isCurrentModule) {
      return 'border-2 border-dashed border-[var(--accent)]';
    }
    if (isCurrentModule) return 'border-2 border-[var(--accent)]';
    if (isBooster && isGrayedOut) return 'border-2 border-[var(--accent)] opacity-80';
    if (isGrayedOut) return 'border border-[var(--color-border)] opacity-50';
    if (isBooster) return 'border-2 border-[var(--accent)] bg-[var(--accent-bg)]';
    return 'border border-[var(--color-border)]';
  };

  const getTextClass = () => {
    if (isGrayedOut) return 'text-[var(--color-text-tertiary)]';
    if (isCurrentModule) return 'text-[var(--color-text-primary)]';
    return 'text-[var(--color-text-primary)]';
  };

  // Handle card click to open detail modal (not for booster modules)
  const handleCardClick = () => {
    if (isBooster) return;
    setShowDetailModal(true);
  };

  return (
    <div
      className={`group relative bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)] transition-all duration-200 cursor-pointer flex-1 ${getBorderClass()} ${isBooster ? 'rounded-3xl' : ''}`}
      onClick={handleCardClick}
    >
      <div className={`${isBooster ? 'px-6 pt-2 pb-1' : 'pl-3 pr-2 py-3'}`}>
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
              {!(booster.status === 'taken' && booster.boosterTakenAt) && (
                <span className="text-[var(--color-text-tertiary)] text-xs flex-shrink-0 ml-2" style={{ lineHeight: 1.2 }}>
                  ~5m
                </span>
              )}
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

            {/* Description - full width below title row */}
            {libraryModule?.description && (
              <p className={`text-[var(--color-text-tertiary)] text-xs mt-1 line-clamp-2 ${isActiveSession ? 'ml-7' : ''}`}>
                {libraryModule.description}
              </p>
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
    </div>
  );
}

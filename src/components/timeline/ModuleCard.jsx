/**
 * ModuleCard Component
 * Individual module card in the timeline editor
 * Displays module info with remove option
 * Supports clickable duration for variable-duration modules
 */

import { useState } from 'react';
import { getModuleById, MODULE_TYPES } from '../../content/modules';
import { useSessionStore, calculateBoosterDose } from '../../stores/useSessionStore';
import DurationPicker from '../shared/DurationPicker';

export default function ModuleCard({
  module,
  onRemove,
  isActiveSession = false,
  isCurrentModule = false,
  canRemove = true,
}) {
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const updateModuleDuration = useSessionStore((state) => state.updateModuleDuration);

  const libraryModule = getModuleById(module.libraryId);
  const moduleType = MODULE_TYPES[libraryModule?.type];

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

  // Convert intensity to dot count (1-3 dots)
  const getIntensityDots = (intensity) => {
    switch (intensity) {
      case 'gentle':
        return 1;
      case 'moderate':
        return 2;
      case 'deep':
        return 3;
      default:
        return 1;
    }
  };

  // Render intensity dots
  const renderIntensityDots = (intensity) => {
    const dotCount = getIntensityDots(intensity);
    return (
      <span className="flex items-center space-x-1">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i <= dotCount ? 'bg-[var(--accent)]' : 'bg-[var(--color-border)]'
            }`}
          />
        ))}
      </span>
    );
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

  return (
    <div className={`group relative bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)] transition-colors ${getBorderClass()} ${isBooster ? 'rounded-full' : ''}`}>
      <div className={`flex items-center ${isBooster ? 'pl-4 pr-2 py-2' : 'p-3'}`}>
        {/* Drag handle placeholder - only show when not in active session */}
        {!isActiveSession && (
          <div className="text-[var(--color-text-tertiary)] mr-3 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
            ⋮⋮
          </div>
        )}

        {/* Status indicator for active session (hidden for booster card) */}
        {isActiveSession && !isBooster && (
          <div className="mr-3 w-4 flex-shrink-0">
            {isCompleted && <span className="text-[var(--accent)]">✓</span>}
            {isSkipped && <span className="text-[var(--color-text-tertiary)]">—</span>}
            {isCurrentModule && <span className="text-[var(--accent)]">●</span>}
            {!isCompleted && !isSkipped && !isCurrentModule && <span className="text-[var(--color-text-tertiary)]">○</span>}
          </div>
        )}

        {/* Module info */}
        <div className="flex-1 min-w-0">
          {isBooster ? (
            <div className="flex flex-col items-center justify-center text-center w-full pt-3">
              <p
                className={`text-[1.05rem] normal-case ${isGrayedOut ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}
                style={{ fontFamily: 'DM Serif Text, serif', fontStyle: 'italic' }}
              >
                {booster.status === 'taken' && booster.boosterTakenAt
                  ? `Booster of ${boosterDoseMg}mg taken at ${formatTimestamp(booster.boosterTakenAt)}`
                  : module.title}
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0">
                  <p className={`truncate ${getTextClass()}`}>
                    {module.title}
                  </p>
                </div>
                {canEditDuration ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDurationPicker(true);
                    }}
                    className="text-[var(--color-text-secondary)] text-sm flex-shrink-0 underline decoration-dotted underline-offset-2 hover:text-[var(--color-text-primary)] transition-colors"
                    title="Click to change duration"
                  >
                    {formatDuration(module.duration)}
                  </button>
                ) : (
                  <span className="text-[var(--color-text-tertiary)] text-sm flex-shrink-0">
                    {formatDuration(module.duration)}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className={isGrayedOut ? 'opacity-50' : ''}>
                  {renderIntensityDots(libraryModule?.intensity)}
                </span>
                <span className="text-[var(--color-text-tertiary)] text-xs">
                  {moduleType?.label || module.libraryId}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Remove button - only show if canRemove is true */}
        {canRemove && (
          <button
            onClick={onRemove}
            className="ml-3 p-2 -m-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors opacity-0 group-hover:opacity-100"
            title="Remove"
          >
            ×
          </button>
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
    </div>
  );
}

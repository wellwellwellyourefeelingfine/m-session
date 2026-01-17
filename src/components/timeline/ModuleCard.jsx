/**
 * ModuleCard Component
 * Individual module card in the timeline editor
 * Displays module info with remove option
 * Supports clickable duration for variable-duration modules
 */

import { useState } from 'react';
import { getModuleById, MODULE_TYPES } from '../../content/modules';
import { useSessionStore } from '../../stores/useSessionStore';
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
  const isCompleted = isActiveSession && module.status === 'completed';
  const isSkipped = isActiveSession && module.status === 'skipped';
  const isGrayedOut = isCompleted || isSkipped;

  const getBorderClass = () => {
    if (isCurrentModule) return 'border-2 border-[var(--accent)]';
    if (isGrayedOut) return 'border border-[var(--color-border)] opacity-50';
    return 'border border-[var(--color-border)]';
  };

  const getTextClass = () => {
    if (isGrayedOut) return 'text-[var(--color-text-tertiary)]';
    if (isCurrentModule) return 'text-[var(--color-text-primary)]';
    return 'text-[var(--color-text-primary)]';
  };

  return (
    <div className={`group relative bg-[var(--color-bg)] hover:bg-[var(--color-bg-secondary)] transition-colors ${getBorderClass()}`}>
      <div className="flex items-center p-3">
        {/* Drag handle placeholder - only show when not in active session */}
        {!isActiveSession && (
          <div className="text-[var(--color-text-tertiary)] mr-3 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
            ⋮⋮
          </div>
        )}

        {/* Status indicator for active session */}
        {isActiveSession && (
          <div className="mr-3 w-4 flex-shrink-0">
            {isCompleted && <span className="text-[var(--accent)]">✓</span>}
            {isSkipped && <span className="text-[var(--color-text-tertiary)]">—</span>}
            {isCurrentModule && <span className="text-[var(--accent)]">●</span>}
            {!isCompleted && !isSkipped && !isCurrentModule && <span className="text-[var(--color-text-tertiary)]">○</span>}
          </div>
        )}

        {/* Module info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`truncate pr-2 ${getTextClass()}`}>
              {module.title}
            </p>
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

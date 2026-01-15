/**
 * ModuleCard Component
 * Individual module card in the timeline editor
 * Displays module info with remove option
 */

import { getModuleById, MODULE_TYPES } from '../../content/modules';

export default function ModuleCard({
  module,
  onRemove,
  isActiveSession = false,
  isCurrentModule = false,
  canRemove = true,
}) {
  const libraryModule = getModuleById(module.libraryId);
  const moduleType = MODULE_TYPES[libraryModule?.type];

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const getIntensityColor = (intensity) => {
    switch (intensity) {
      case 'gentle':
        return 'text-green-600 dark:text-green-400';
      case 'moderate':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'deep':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-[var(--color-text-tertiary)]';
    }
  };

  // Determine styling based on module status during active session
  const isCompleted = isActiveSession && module.status === 'completed';
  const isSkipped = isActiveSession && module.status === 'skipped';
  const isGrayedOut = isCompleted || isSkipped;

  const getBorderClass = () => {
    if (isCurrentModule) return 'border-2 border-green-500';
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
            {isCompleted && <span className="text-green-500">✓</span>}
            {isSkipped && <span className="text-[var(--color-text-tertiary)]">—</span>}
            {isCurrentModule && <span className="text-green-500">●</span>}
            {!isCompleted && !isSkipped && !isCurrentModule && <span className="text-[var(--color-text-tertiary)]">○</span>}
          </div>
        )}

        {/* Module info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className={`truncate pr-2 ${getTextClass()}`}>
              {module.title}
            </p>
            <span className="text-[var(--color-text-tertiary)] text-sm flex-shrink-0">
              {formatDuration(module.duration)}
            </span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`text-xs uppercase tracking-wider ${isGrayedOut ? 'text-[var(--color-text-tertiary)]' : getIntensityColor(libraryModule?.intensity)}`}>
              {libraryModule?.intensity || 'gentle'}
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
            className="ml-3 p-2 -m-2 text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            title="Remove"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

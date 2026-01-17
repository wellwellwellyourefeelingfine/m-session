/**
 * PhaseSection Component
 * Renders a single phase of the timeline with its modules
 * Shows bracket/claw UI to delineate phases
 * Supports both pre-session editing and active session display
 */

import ModuleCard from './ModuleCard';

export default function PhaseSection({
  phase,
  title,
  subtitle,
  description,
  modules,
  duration,
  maxDuration,
  onAddModule,
  onRemoveModule,
  isFirst = false,
  isLast = false,
  isActiveSession = false,
  phaseStatus = 'upcoming',
  currentModuleId = null,
  canRemoveModule = () => true,
  isEditable = true,
}) {
  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const progressPercent = maxDuration ? Math.min((duration / maxDuration) * 100, 100) : 0;
  const isOverLimit = phase === 'come-up' && duration > maxDuration;

  // Get phase styling based on status
  const getPhaseOpacity = () => {
    if (!isActiveSession) return 'opacity-100';
    if (phaseStatus === 'completed') return 'opacity-50';
    return 'opacity-100';
  };

  const getBracketColor = () => {
    if (!isActiveSession) return 'border-[var(--color-border)]';
    if (phaseStatus === 'active') return 'border-[var(--color-text-primary)]';
    if (phaseStatus === 'completed') return 'border-[var(--color-border)]';
    return 'border-[var(--color-border)]';
  };

  return (
    <div className={`relative pl-6 ${getPhaseOpacity()}`}>
      {/* Phase bracket - minimalist corner markers only */}
      <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between">
        {/* Top corner */}
        <div className={`w-3 h-3 border-t border-l ${isFirst ? 'rounded-tl-md' : ''} ${getBracketColor()}`} />
        {/* Bottom corner */}
        <div className={`w-3 h-3 border-b border-l ${isLast ? 'rounded-bl-md' : ''} ${getBracketColor()}`} />
      </div>

      {/* Phase content */}
      <div className="pb-4">
        {/* Phase header */}
        <div className="mb-4">
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className={`${phaseStatus === 'active' ? 'text-[var(--color-text-primary)]' : ''}`}>
                {title}
                {isActiveSession && phaseStatus === 'active' && (
                  <span className="ml-2 text-xs text-[var(--accent)] uppercase tracking-wider">Active</span>
                )}
              </h3>
              <p className="text-[var(--color-text-tertiary)] text-sm">{subtitle}</p>
            </div>
            <span className={`text-sm ${isOverLimit ? 'text-[var(--accent)]' : 'text-[var(--color-text-tertiary)]'}`}>
              {formatDuration(duration)}
              {maxDuration && phase === 'come-up' && ` / ${formatDuration(maxDuration)}`}
            </span>
          </div>

          {/* Duration progress bar for come-up phase */}
          {phase === 'come-up' && maxDuration && (
            <div className="mt-2 w-full h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${isOverLimit ? 'bg-[var(--accent)]' : 'bg-[var(--color-text-primary)]'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          <p className="text-[var(--color-text-secondary)] text-sm mt-2">
            {description}
          </p>
        </div>

        {/* Modules list */}
        <div className="space-y-2">
          {modules.length === 0 ? (
            <div className="py-4 border border-dashed border-[var(--color-border)] text-center">
              <p className="text-[var(--color-text-tertiary)] text-sm">
                No activities scheduled
              </p>
            </div>
          ) : (
            modules.map((module) => (
              <ModuleCard
                key={module.instanceId}
                module={module}
                onRemove={() => onRemoveModule(module.instanceId)}
                isActiveSession={isActiveSession}
                isCurrentModule={module.instanceId === currentModuleId}
                canRemove={canRemoveModule(module)}
              />
            ))
          )}
        </div>

        {/* Add module button - only show if phase is editable */}
        {isEditable && (
          <button
            onClick={onAddModule}
            className="mt-3 w-full py-3 border border-dashed border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)] transition-colors text-sm"
          >
            + Add Activity
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * PhaseSection Component
 * Renders a single phase of the timeline with its modules
 * Includes timeline node on the left that stays aligned with the phase header
 * Supports both pre-session editing and active session display
 */

import { forwardRef, useState, useRef } from 'react';
import ModuleCard from './ModuleCard';

// Phase descriptions - static text for each phase
const PHASE_DESCRIPTIONS = {
  'come-up': "This is a time to settle in, breathe, and let your body adjust. There's nothing to do yet but wait and receive.",
  'peak': "The door is open. Whatever you came here to explore, this is the time. Follow what feels important.",
  'integration': "Ease into the afterglow. The mind is still open, but clearer now — a good time to write, ask questions, and hold onto what matters.",
};

// Phase numbers
const PHASE_NUMBERS = {
  'come-up': 'Phase 1',
  'peak': 'Phase 2',
  'integration': 'Phase 3',
};

// Phase names (displayed in Azeret Mono)
const PHASE_NAMES = {
  'come-up': 'Come-Up',
  'peak': 'Peak',
  'integration': 'Integration',
};

/**
 * Format minutes into readable time label
 * 0 → "0 min", 45 → "45 min", 60 → "1H", 90 → "1H 30M"
 */
function formatTimeLabel(minutes) {
  if (minutes === 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}H`;
  return `${hours}H ${mins}M`;
}

const PhaseSection = forwardRef(function PhaseSection(
  {
    phase,
    modules,
    duration,
    maxDuration,
    onAddModule,
    onRemoveModule,
    isActiveSession = false,
    phaseStatus = 'upcoming',
    currentModuleId = null,
    canRemoveModule = () => true,
    isEditable = true,
    cumulativeStartTime = 0,
    isLast = false,
    isEditMode = false,
    onMoveModuleUp,
    onMoveModuleDown,
  },
  ref
) {
  // Track modules being deleted for fade-out animation
  const [deletingModuleId, setDeletingModuleId] = useState(null);
  // Track modules being swapped for smooth animation
  const [swappingModules, setSwappingModules] = useState(null); // { movingId, direction }
  // Refs for measuring module positions for FLIP animation
  const moduleRefs = useRef({});

  // Find the index of the current module (for preventing moves above it)
  const currentModuleIndex = modules.findIndex((m) => m.instanceId === currentModuleId);

  // Handle move with animation
  const handleMoveWithAnimation = (instanceId, direction) => {
    // Set swapping state to trigger animation
    setSwappingModules({ movingId: instanceId, direction });

    // Perform the actual move after a brief delay to let animation start
    setTimeout(() => {
      if (direction === 'up') {
        onMoveModuleUp(instanceId);
      } else {
        onMoveModuleDown(instanceId);
      }
      // Clear swapping state after move completes
      setTimeout(() => {
        setSwappingModules(null);
      }, 50);
    }, 150);
  };

  const progressPercent = maxDuration ? Math.min((duration / maxDuration) * 100, 100) : 0;
  const isOverLimit = phase === 'come-up' && duration > maxDuration;

  // Handle delete with animation
  const handleDeleteWithAnimation = (instanceId) => {
    setDeletingModuleId(instanceId);
    // Wait for animation to complete before actually removing
    setTimeout(() => {
      onRemoveModule(instanceId);
      setDeletingModuleId(null);
    }, 200);
  };

  // Format duration for the total display (e.g., "20M", "1H 30M")
  const formatTotalDuration = (minutes) => {
    if (minutes === 0) return '0M';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}M`;
    if (mins === 0) return `${hours}H`;
    return `${hours}H ${mins}M`;
  };

  // Get phase styling based on status
  const getPhaseOpacity = () => {
    if (!isActiveSession) return 'opacity-100';
    if (phaseStatus === 'completed') return 'opacity-50';
    return 'opacity-100';
  };

  // Determine if this phase's node should be filled (active or completed)
  const isNodeFilled = isActiveSession && (phaseStatus === 'active' || phaseStatus === 'completed');

  return (
    <div ref={ref} className={`relative flex ${getPhaseOpacity()}`}>
      {/* Timeline node and vertical bar segment */}
      <div className="flex flex-col items-center mr-4 flex-shrink-0" style={{ width: '12px' }}>
        {/* Node circle - aligned with phase header */}
        <div
          className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
            isNodeFilled
              ? 'bg-[var(--color-text-primary)] border-[var(--color-text-primary)]'
              : 'bg-[var(--color-bg)] border-[var(--color-text-primary)]'
          }`}
        />
        {/* Vertical bar extending down - no gap */}
        {!isLast && (
          <div className="w-0.5 flex-1 bg-[var(--color-text-primary)]" />
        )}
      </div>

      {/* Phase content */}
      <div className="flex-1 pb-6">
        {/* Phase header - new design with DM Serif font */}
        <div className="mb-4">
          <h3
            className="flex items-baseline gap-2"
            style={{ lineHeight: 1, marginBottom: '8px' }}
          >
            <span className="font-serif text-lg" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
              {PHASE_NUMBERS[phase]}
            </span>
            <span className="text-[var(--color-text-primary)]">-</span>
            <span className="text-[var(--color-text-primary)] text-[13px]">
              {PHASE_NAMES[phase]}
            </span>
          </h3>

          {/* Cumulative start time - tightly beneath header */}
          <p className="text-[var(--color-text-tertiary)] text-xs" style={{ lineHeight: 1, marginBottom: '6px' }}>
            {cumulativeStartTime === 0 ? 'Start of session' : `Starts at ${formatTimeLabel(cumulativeStartTime)}`}
          </p>

          {/* Duration progress bar for come-up phase */}
          {phase === 'come-up' && maxDuration && (
            <div className="mb-1 w-full h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${isOverLimit ? 'bg-[var(--accent)]' : 'bg-[var(--color-text-primary)]'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Phase description - compact styling */}
          <p className="text-[var(--color-text-secondary)]" style={{ lineHeight: 1.3 }}>
            {PHASE_DESCRIPTIONS[phase] || ''}
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
            modules.map((module, index) => {
              // Check if this is a booster module (should never show reorder buttons)
              const isBooster = module.isBoosterModule || module.libraryId === 'booster-consideration';

              // Check if this is the current module (should not be editable during active session)
              const isCurrentModuleItem = module.instanceId === currentModuleId;

              // Determine if this module can be edited (reordered/deleted)
              // Booster modules can never be reordered
              // Current module and completed/skipped modules cannot be edited during active session
              const canEditModule = isEditMode && !isBooster && (
                !isActiveSession || (module.status === 'upcoming' && !isCurrentModuleItem)
              );

              // Check position constraints
              const isFirst = index === 0;
              const isLastModule = index === modules.length - 1;

              // During active session, can't move modules above the current module
              // currentModuleIndex is -1 if current module is not in this phase
              const canMoveUp = isFirst ? false : (
                isActiveSession && currentModuleIndex >= 0
                  ? index > currentModuleIndex + 1 // Can only move up if we're at least 2 positions below current
                  : true
              );
              const canMoveDown = isLastModule ? false : true;

              // Count editable modules (non-booster, and upcoming during active session) to determine if arrows should show
              const editableModules = modules.filter((m) => {
                const mIsBooster = m.isBoosterModule || m.libraryId === 'booster-consideration';
                const mIsCurrentModule = m.instanceId === currentModuleId;
                if (mIsBooster) return false;
                if (isActiveSession) {
                  return m.status === 'upcoming' && !mIsCurrentModule;
                }
                return true;
              });
              const hasMultipleEditableModules = editableModules.length > 1;

              const isDeleting = deletingModuleId === module.instanceId;

              // Check if this module is involved in a swap animation
              const isSwapping = swappingModules?.movingId === module.instanceId;
              const swapDirection = isSwapping ? swappingModules.direction : null;

              // Get animation class for swapping
              const getSwapAnimationClass = () => {
                if (!isSwapping) return '';
                return swapDirection === 'up' ? 'animate-swap-up' : 'animate-swap-down';
              };

              return (
                <div
                  key={module.instanceId}
                  ref={(el) => { moduleRefs.current[module.instanceId] = el; }}
                  className={`relative flex items-start group/reorder transition-all duration-200 ${
                    isDeleting ? 'opacity-0 scale-95 -translate-x-4' : 'opacity-100 scale-100'
                  } ${getSwapAnimationClass()}`}
                >
                  {/* Reorder arrows - only in edit mode and when module can be edited */}
                  {canEditModule && hasMultipleEditableModules && !isDeleting && !swappingModules && (
                    <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleMoveWithAnimation(module.instanceId, 'up')}
                        disabled={!canMoveUp}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                          !canMoveUp
                            ? 'opacity-30 cursor-not-allowed text-[var(--color-text-tertiary)]'
                            : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-95'
                        }`}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveWithAnimation(module.instanceId, 'down')}
                        disabled={!canMoveDown}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                          !canMoveDown
                            ? 'opacity-30 cursor-not-allowed text-[var(--color-text-tertiary)]'
                            : 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-95'
                        }`}
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                  )}

                  <ModuleCard
                    module={module}
                    onRemove={() => handleDeleteWithAnimation(module.instanceId)}
                    isActiveSession={isActiveSession}
                    isCurrentModule={module.instanceId === currentModuleId}
                    canRemove={canRemoveModule(module)}
                    isEditMode={canEditModule}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Add module button with total time - only show if phase is editable */}
        {isEditable && (
          <button
            onClick={onAddModule}
            className="mt-3 w-full py-3 border border-dashed border-[var(--color-border)] text-[var(--color-text-tertiary)] hover:border-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)] transition-colors text-sm flex items-center justify-between px-4"
          >
            <span>+ Add Activity</span>
            <span className={`text-xs ${isOverLimit ? 'text-[var(--accent)]' : ''}`}>
              Total: {formatTotalDuration(duration)}
            </span>
          </button>
        )}
      </div>
    </div>
  );
});

export default PhaseSection;

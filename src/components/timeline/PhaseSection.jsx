/**
 * PhaseSection Component
 * Renders a single phase of the timeline with its modules
 * Includes timeline node on the left that stays aligned with the phase header
 * Supports both pre-session editing and active session display
 */

import { forwardRef, useState, useRef, useEffect } from 'react';
import ModuleCard from './ModuleCard';
import { CircleSkipIcon, CirclePlusIcon } from '../shared/Icons';

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
  'integration': 'Synthesis',
};


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
    isLast = false,
    isEditMode = false,
    onToggleEditMode,
    isCompletedSession = false,
    onMoveModuleUp,
    onMoveModuleDown,
    isFirst = false,
    previousPhaseCompleted = false,
    phaseStartedAt = null,
    phaseEndedAt = null,
  },
  ref
) {
  // Track collapse animation stages — completed phases default to collapsed
  const startCollapsed = phaseStatus === 'completed';
  const [isCollapsed, setIsCollapsed] = useState(startCollapsed);
  const [contentVisible, setContentVisible] = useState(!startCollapsed);
  const [heightCollapsed, setHeightCollapsed] = useState(startCollapsed);

  const handleToggleCollapse = () => {
    if (!isCollapsed) {
      // Collapsing: fade out content → collapse height
      setContentVisible(false);
      setTimeout(() => {
        setHeightCollapsed(true);
        setIsCollapsed(true);
      }, 250);
    } else {
      // Expanding: expand height → wait → fade in content
      setHeightCollapsed(false);
      setTimeout(() => {
        setContentVisible(true);
        setIsCollapsed(false);
      }, 600);
    }
  };

  // Auto-collapse when a phase transitions to completed (e.g., finishing phase 1 → phase 2).
  // Since Home tab stays mounted, initial state alone doesn't cover this transition.
  useEffect(() => {
    if (phaseStatus === 'completed' && !isCollapsed) {
      setContentVisible(false);
      const timer = setTimeout(() => {
        setHeightCollapsed(true);
        setIsCollapsed(true);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [phaseStatus]);
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

  // Top connector should match the previous phase's opacity, not this phase's
  const getPrevPhaseOpacity = () => {
    if (!isActiveSession) return 'opacity-100';
    if (previousPhaseCompleted) return 'opacity-50';
    return 'opacity-100';
  };

  return (
    <div ref={ref} className="relative flex">
      {/* Timeline node and vertical bar segment */}
      <div className="flex flex-col items-center mr-4 flex-shrink-0" style={{ width: '12px' }}>
        {/* Connecting bar from previous phase (invisible spacer when first) */}
        {isFirst
          ? <div className="h-2" />
          : <div className={`w-0.5 h-2 bg-[var(--color-text-primary)] ${getPrevPhaseOpacity()}`} />
        }
        {/* Node circle - aligned with phase header */}
        <div
          className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${getPhaseOpacity()} ${
            isNodeFilled
              ? 'bg-[var(--color-text-primary)] border-[var(--color-text-primary)]'
              : 'bg-[var(--color-bg)] border-[var(--color-text-primary)]'
          }`}
        />
        {/* Vertical bar extending down - no gap */}
        {!isLast && (
          <div className={`w-0.5 flex-1 bg-[var(--color-text-primary)] ${getPhaseOpacity()}`} />
        )}
      </div>

      {/* Phase content */}
      <div className={`flex-1 ${heightCollapsed ? 'pb-2' : 'pb-6'} ${getPhaseOpacity()} transition-all duration-300`}>
        {/* Phase header - new design with DM Serif font */}
        <div data-tutorial={`phase-${phase}`}>
          <div className="flex items-start justify-between">
            <h3
              className="flex items-baseline gap-2"
              style={{ lineHeight: 1, marginBottom: '8px' }}
            >
              <span className="font-serif text-[22px]" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
                {PHASE_NUMBERS[phase]}
              </span>
              <span className="text-[var(--color-text-primary)]">-</span>
              <span className="text-[var(--color-text-primary)] text-[15px]">
                {PHASE_NAMES[phase]}
              </span>
            </h3>
            {phaseStatus === 'completed' ? (
              <button
                onClick={handleToggleCollapse}
                className="flex-shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {isCollapsed
                  ? <CirclePlusIcon size={18} className="text-current" />
                  : <CircleSkipIcon size={18} className="text-current" />
                }
              </button>
            ) : (
              !isCompletedSession && onToggleEditMode && (
                <button
                  onClick={onToggleEditMode}
                  className={`px-3 py-1 text-xs uppercase tracking-wider transition-colors flex-shrink-0 ${
                    isEditMode
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {isEditMode ? 'Done' : 'Edit'}
                </button>
              )
            )}
          </div>

        </div>

        {/* Phase duration text or timestamp for completed phases — always visible */}
        <p className="text-[var(--color-text-tertiary)] text-xs" style={{ lineHeight: 1, marginBottom: '6px' }}>
          {phaseStatus === 'completed' && phaseStartedAt
            ? <>
                {new Date(phaseStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {phaseEndedAt && ` – ${new Date(phaseEndedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </>
            : phase === 'come-up' ? '0 to 1 hour in length' : 'About 2 hours in length'
          }
        </p>

        {/* Collapsible content — staged animation: fade content, then collapse height.
            Left padding + negative-margin inset reserves room for the reorder arrows
            (which sit at -left-8 on each module row) so overflow-hidden doesn't clip
            them in edit mode, while keeping module cards visually in their original
            position. */}
        <div
          className="overflow-hidden ease-in-out pl-8 -ml-8"
          style={{
            maxHeight: heightCollapsed ? 0 : '2000px',
            transition: heightCollapsed ? 'max-height 300ms ease-in-out' : 'max-height 500ms ease-in-out',
          }}
        >
          <div
            className="transition-opacity duration-250 ease-in-out"
            style={{ opacity: contentVisible ? 1 : 0 }}
          >

          {/* Phase description - compact styling */}
          <p className="text-[var(--color-text-secondary)]" style={{ lineHeight: 1.3, marginBottom: '16px' }}>
            {PHASE_DESCRIPTIONS[phase] || ''}
          </p>

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

              // Determine if this module can be reordered
              // Booster modules can never be reordered
              // Current module and completed/skipped modules cannot be edited during active session
              const canEditModule = isEditMode && !isBooster && (
                !isActiveSession || (module.status === 'upcoming' && !isCurrentModuleItem)
              );

              // Booster modules can be deleted (but not reordered), so pass edit mode through
              const canShowEditMode = isEditMode && (
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
                  data-tutorial={phase === 'come-up' && index === 0 ? 'module-card-spotlight' : undefined}
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
                    isEditMode={canShowEditMode}
                    dataTutorial={phase === 'come-up' && index === 0 ? 'module-card-first' : undefined}
                    phaseCompleted={phaseStatus === 'completed'}
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
            data-tutorial={phase === 'peak' ? 'add-activity-first' : undefined}
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
      </div>
    </div>
  );
});

export default PhaseSection;

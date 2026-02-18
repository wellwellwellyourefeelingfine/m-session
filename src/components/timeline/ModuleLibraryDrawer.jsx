/**
 * ModuleLibraryDrawer Component
 * Slide-up drawer showing available modules to add to the timeline
 * Filters modules based on the target phase
 */

import { useState } from 'react';
import { moduleLibrary, canAddModuleToPhase, MODULE_CATEGORIES } from '../../content/modules';

export default function ModuleLibraryDrawer({ phase, onSelect, onClose, onEnterEditMode, isCompletedSession = false }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'recommended' | intensity

  // Get modules that can be added to this phase
  const availableModules = moduleLibrary.filter((module) => {
    if (module.hidden) return false; // Hide linked parts (shown via parent entry)
    const check = canAddModuleToPhase(module.id, phase);
    return check.allowed || check.warning; // Include modules with warnings
  });

  // Apply additional filter
  const filteredModules = availableModules.filter((module) => {
    if (filter === 'all') return true;
    if (filter === 'recommended') return module.recommendedPhases?.includes(phase);
    return module.intensity === filter;
  });

  // Group by category for display, sorted by category order
  const groupedModules = filteredModules.reduce((acc, module) => {
    const category = module.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(module);
    return acc;
  }, {});

  const sortedCategories = Object.entries(groupedModules).sort(([a], [b]) => {
    const orderA = MODULE_CATEGORIES[a]?.order ?? 99;
    const orderB = MODULE_CATEGORIES[b]?.order ?? 99;
    return orderA - orderB;
  });

  const handleSelect = (module) => {
    const check = canAddModuleToPhase(module.id, phase);
    onSelect(module.id, check.warning);
  };

  const formatDuration = (minutes) => {
    return `${minutes} min`;
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

  const getPhaseName = (p) => {
    switch (p) {
      case 'come-up':
        return 'Come-Up';
      case 'peak':
        return 'Peak';
      case 'integration':
        return 'Integration';
      case 'follow-up':
        return 'Follow-Up';
      default:
        return p;
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute bottom-0 left-0 right-0 bg-[var(--color-bg)] border-t border-[var(--color-border)] rounded-t-2xl max-h-[80vh] flex flex-col animate-slideUp shadow-lg">
        {/* Close button - positioned in top-right corner of drawer */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center text-xl text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors z-10"
          aria-label="Close"
        >
          ×
        </button>

        {/* Edit Timeline button - below close button (only for non-completed sessions and non-follow-up phases) */}
        {onEnterEditMode && !isCompletedSession && phase !== 'follow-up' && (
          <button
            onClick={onEnterEditMode}
            className="absolute top-12 right-4 px-3 py-1.5 text-[10px] uppercase tracking-wider border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-secondary)] transition-colors z-10"
          >
            Edit Timeline
          </button>
        )}

        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 border-b border-[var(--color-border)]">
          <div className="mb-4 pr-24">
            <h3>Add Activity</h3>
            <p className="text-[var(--color-text-tertiary)] text-sm">
              Adding to {getPhaseName(phase)} phase
            </p>
          </div>

          {/* Filter buttons */}
          <div className="flex space-x-2 overflow-x-auto pb-1">
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All
            </FilterButton>
            <FilterButton
              active={filter === 'recommended'}
              onClick={() => setFilter('recommended')}
            >
              Recommended
            </FilterButton>
            <FilterButton
              active={filter === 'gentle'}
              onClick={() => setFilter('gentle')}
            >
              Gentle
            </FilterButton>
            <FilterButton
              active={filter === 'moderate'}
              onClick={() => setFilter('moderate')}
            >
              Moderate
            </FilterButton>
            {phase === 'integration' && (
              <FilterButton
                active={filter === 'deep'}
                onClick={() => setFilter('deep')}
              >
                Deep
              </FilterButton>
            )}
          </div>
        </div>

        {/* Module list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-[var(--color-bg)]">
          {sortedCategories.length === 0 ? (
            <p className="text-[var(--color-text-tertiary)] text-center py-8">
              No modules match this filter
            </p>
          ) : (
            sortedCategories.map(([category, modules]) => (
              <div key={category} className="mb-6">
                <h4 className="text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs mb-3">
                  {MODULE_CATEGORIES[category]?.label || category}
                </h4>
                <div className="space-y-2">
                  {modules.map((module) => {
                    const check = canAddModuleToPhase(module.id, phase);
                    const hasWarning = check.warning;

                    return (
                      <button
                        key={module.id}
                        onClick={() => handleSelect(module)}
                        className="w-full text-left p-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center space-x-2">
                              <p className="text-[var(--color-text-primary)] font-medium">
                                {module.title}
                              </p>
                              {hasWarning && (
                                <span className="text-[var(--accent)] text-xs">⚠</span>
                              )}
                            </div>
                            <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                              {module.description}
                            </p>
                            <div className="flex items-center space-x-3 mt-2">
                              {renderIntensityDots(module.intensity)}
                              <span className="text-[var(--color-text-tertiary)] text-xs">
                                {formatDuration(module.defaultDuration)}
                              </span>
                            </div>
                          </div>
                          <span className="text-[var(--color-text-tertiary)]">+</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function FilterButton({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
        active
          ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)]'
          : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      {children}
    </button>
  );
}

/**
 * ModuleLibraryDrawer Component
 * Slide-up drawer showing available modules to add to the timeline
 * Filters modules based on the target phase
 */

import { useState } from 'react';
import { moduleLibrary, canAddModuleToPhase, MODULE_TYPES } from '../../content/modules';

export default function ModuleLibraryDrawer({ phase, onSelect, onClose }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'recommended' | intensity

  // Get modules that can be added to this phase
  const availableModules = moduleLibrary.filter((module) => {
    const check = canAddModuleToPhase(module.id, phase);
    return check.allowed || check.warning; // Include modules with warnings
  });

  // Apply additional filter
  const filteredModules = availableModules.filter((module) => {
    if (filter === 'all') return true;
    if (filter === 'recommended') return module.recommendedPhases?.includes(phase);
    return module.intensity === filter;
  });

  // Group by type for display
  const groupedModules = filteredModules.reduce((acc, module) => {
    const type = module.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(module);
    return acc;
  }, {});

  const handleSelect = (module) => {
    const check = canAddModuleToPhase(module.id, phase);
    onSelect(module.id, check.warning);
  };

  const formatDuration = (minutes) => {
    return `${minutes} min`;
  };

  const getIntensityColor = (intensity) => {
    switch (intensity) {
      case 'gentle':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'deep':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPhaseName = (p) => {
    switch (p) {
      case 'come-up':
        return 'Come-Up';
      case 'peak':
        return 'Peak';
      case 'integration':
        return 'Integration';
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
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg">Add Activity</h3>
              <p className="text-[var(--color-text-tertiary)] text-sm">
                Adding to {getPhaseName(phase)} phase
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -m-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            >
              ×
            </button>
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
          {Object.entries(groupedModules).length === 0 ? (
            <p className="text-[var(--color-text-tertiary)] text-center py-8">
              No modules match this filter
            </p>
          ) : (
            Object.entries(groupedModules).map(([type, modules]) => (
              <div key={type} className="mb-6">
                <h4 className="text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs mb-3">
                  {MODULE_TYPES[type]?.label || type}
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
                                <span className="text-yellow-500 text-xs">⚠</span>
                              )}
                            </div>
                            <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                              {module.description}
                            </p>
                            <div className="flex items-center space-x-3 mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded ${getIntensityColor(module.intensity)}`}>
                                {module.intensity}
                              </span>
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

/**
 * ModuleLibraryDrawer Component
 * Slide-up drawer showing available modules to add to the timeline
 * Filters modules based on the target phase
 */

import { useState, useCallback, useEffect } from 'react';
import { moduleLibrary, canAddModuleToPhase, MODULE_CATEGORIES, FRAMEWORKS } from '../../content/modules';
import { CircleXIcon } from '../shared/Icons';
import ModuleDetailModal from './ModuleDetailModal';

export default function ModuleLibraryDrawer({ phase, onSelect, onClose, hideWarnings = false }) {
  const [filter, setFilter] = useState(phase === 'preview' ? 'all' : 'recommended'); // 'all' | 'recommended' | phase filter
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 300);
  }, [onClose]);

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
    // Phase-based filter: show modules allowed in the selected phase
    return module.allowedPhases?.includes(filter);
  });

  // Group by category for display, sorted by category order.
  // Pre-session modules shown under "Activity" when browsing non-pre-session phases.
  const groupedModules = filteredModules.reduce((acc, module) => {
    let category = module.category || 'other';
    if (category === 'pre-session' && phase !== 'pre-session') {
      category = 'activity';
    }
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
    setSelectedModule(module);
    setSelectedDuration(module.defaultDuration);
  };

  const handleAddFromDetail = () => {
    if (!selectedModule) return;
    const check = canAddModuleToPhase(selectedModule.id, phase);
    onSelect(selectedModule.id, check.warning, selectedDuration);
    // Don't clear selectedModule here — let the detail modal's onClose do it after animation
  };

  const formatDuration = (minutes) => {
    return `${minutes} min`;
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity duration-300 ${closing ? 'opacity-0' : mounted ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className={`absolute bottom-0 left-0 right-0 bg-[var(--color-bg)] border-t border-[var(--color-border)] rounded-t-2xl h-[80vh] flex flex-col shadow-lg ${closing ? 'animate-slideDownOut' : 'animate-slideUp'}`} data-tutorial="library-drawer">
        {/* Close button - positioned in top-right corner of drawer */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-4 text-[var(--color-text-tertiary)] opacity-70 hover:opacity-100 transition-opacity z-10"
          aria-label="Close"
          data-tutorial="library-close"
        >
          <CircleXIcon size={26} />
        </button>

        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
        </div>

        {/* Header */}
        <div className="pb-4 border-b border-[var(--color-border)]">
          <div className="mb-4 pr-24 px-6">
            <h3 className="text-3xl" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>Activity Library</h3>
          </div>

          {/* Filter buttons — scrolls edge-to-edge, inner padding for inset */}
          <div className="flex space-x-2 overflow-x-auto pb-1 pl-6" style={{ scrollPaddingInline: '1.5rem' }}>
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
              dataTutorial="filter-all"
            >
              All
            </FilterButton>
            <FilterButton
              active={filter === 'recommended'}
              onClick={() => setFilter('recommended')}
              dataTutorial="filter-recommended"
            >
              Recommended
            </FilterButton>
            <FilterButton
              active={filter === 'come-up'}
              onClick={() => setFilter('come-up')}
            >
              Phase 1
            </FilterButton>
            <FilterButton
              active={filter === 'peak'}
              onClick={() => setFilter('peak')}
            >
              Phase 2
            </FilterButton>
            <FilterButton
              active={filter === 'integration'}
              onClick={() => setFilter('integration')}
            >
              Phase 3
            </FilterButton>
            <FilterButton
              active={filter === 'pre-session'}
              onClick={() => setFilter('pre-session')}
            >
              Pre-Session
            </FilterButton>
            <FilterButton
              active={filter === 'follow-up'}
              onClick={() => setFilter('follow-up')}
            >
              Post-Session
            </FilterButton>
            <div className="flex-shrink-0 w-4" aria-hidden="true" />
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
                    const hasWarning = !hideWarnings && check.warning;

                    return (
                      <button
                        key={module.id}
                        onClick={() => handleSelect(module)}
                        className="w-full text-left px-4 pt-3 pb-1.5 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2 min-w-0">
                            <p className="text-[var(--color-text-primary)] text-lg leading-none" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>
                              {module.title}
                            </p>
                            {hasWarning && (
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                className="flex-shrink-0 -mt-4"
                              >
                                <circle cx="12" cy="12" r="10" stroke="var(--accent)" strokeWidth="2" fill="none" />
                                <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
                              </svg>
                            )}
                          </div>
                          <span className="text-[var(--color-text-tertiary)] text-xs flex-shrink-0 ml-3">
                            {formatDuration(module.defaultDuration)}
                          </span>
                        </div>
                        <p className="text-[var(--color-text-secondary)] text-sm -mt-px">
                          {module.description}
                        </p>
                        {(module.framework?.length > 0 || module.intensity != null) && (
                          <div className="flex items-center justify-between mt-0.5 mb-0.5">
                            {module.framework?.length > 0 ? (
                              <span className="text-[var(--color-text-tertiary)] text-[9px] uppercase tracking-wider leading-none">
                                {module.framework.map((f) => FRAMEWORKS[f]?.abbreviation || FRAMEWORKS[f]?.label || f).join(', ')}
                              </span>
                            ) : <span />}
                            {module.intensity != null && (
                              <span className="flex items-center space-x-0.5">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <span
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      i <= module.intensity ? 'bg-[var(--accent)]' : 'bg-[var(--color-border)]'
                                    }`}
                                  />
                                ))}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail modal — opens on top of drawer when a module is selected */}
      {selectedModule && (
        <ModuleDetailModal
          isOpen={true}
          onClose={() => setSelectedModule(null)}
          module={{
            libraryId: selectedModule.id,
            title: selectedModule.title,
            duration: selectedDuration,
            status: 'upcoming',
          }}
          onDurationChange={(newDuration) => setSelectedDuration(newDuration)}
          mode="add"
          onAdd={handleAddFromDetail}
        />
      )}
    </div>
  );
}

function FilterButton({ children, active, onClick, dataTutorial }) {
  return (
    <button
      onClick={onClick}
      data-tutorial={dataTutorial}
      className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
        active
          ? 'bg-[var(--color-text-primary)] text-[var(--color-bg)]'
          : 'border border-[var(--color-border)] text-[var(--color-border)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-primary)]'
      }`}
    >
      {children}
    </button>
  );
}

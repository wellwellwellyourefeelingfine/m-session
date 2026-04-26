/**
 * ModuleLibraryDrawer Component
 * Slide-up drawer showing available modules to add to the timeline
 * Filters modules based on the target phase
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { moduleLibrary, canAddModuleToPhase, MODULE_CATEGORIES, FRAMEWORKS } from '../../content/modules';
import { CircleXIcon, StarIcon, SearchIcon, BookHeartIcon } from '../shared/Icons';
import ModuleDetailModal from './ModuleDetailModal';
import { getModuleIcon } from './getModuleIcon';
import { useAppStore } from '../../stores/useAppStore';

// Check if query is an exact match for a framework abbreviation, label, or key
function getExactFrameworkMatch(query) {
  const q = query.toLowerCase().trim();
  if (!q) return null;
  for (const [key, fw] of Object.entries(FRAMEWORKS)) {
    if (key.toLowerCase() === q) return key;
    if (fw.abbreviation?.toLowerCase() === q) return key;
    if (fw.label?.toLowerCase() === q) return key;
  }
  return null;
}

function matchesSingleTerm(module, term) {
  if (module.title.toLowerCase().includes(term)) return true;
  if (module.description?.toLowerCase().includes(term)) return true;
  if (module.tags?.some(tag => tag.toLowerCase().includes(term))) return true;
  if (module.framework?.some(fKey => {
    if (fKey.toLowerCase().includes(term)) return true;
    const fw = FRAMEWORKS[fKey];
    if (!fw) return false;
    if (fw.label?.toLowerCase().includes(term)) return true;
    if (fw.abbreviation?.toLowerCase().includes(term)) return true;
    return false;
  })) return true;
  return false;
}

function matchesSearch(module, query) {
  const q = query.toLowerCase().trim();
  if (!q) return true;

  // If query exactly matches a phase name, show recommended modules for that phase
  const PHASE_ALIASES = {
    'phase 1': 'come-up', 'phase one': 'come-up', 'come-up': 'come-up', 'come up': 'come-up', comeup: 'come-up',
    'phase 2': 'peak', 'phase two': 'peak', peak: 'peak',
    'phase 3': 'integration', 'phase three': 'integration', synthesis: 'integration', 'synthesis phase': 'integration', integration: 'integration',
    'pre-session': 'pre-session', 'pre session': 'pre-session', presession: 'pre-session',
    'follow-up': 'follow-up', 'follow up': 'follow-up', followup: 'follow-up', 'post-session': 'follow-up', 'post session': 'follow-up',
  };
  const phaseMatch = PHASE_ALIASES[q];
  if (phaseMatch) {
    return module.recommendedPhases?.includes(phaseMatch) ?? false;
  }

  // If query exactly matches a framework, only show modules with that framework
  const exactFramework = getExactFrameworkMatch(q);
  if (exactFramework) {
    return module.framework?.includes(exactFramework) ?? false;
  }

  // Multi-word: every word must match somewhere across the module's fields
  const words = q.split(/\s+/).filter(Boolean);
  return words.every(word => matchesSingleTerm(module, word));
}

export default function ModuleLibraryDrawer({ phase, onSelect, onClose, externalClosing = false }) {
  const [filter, setFilter] = useState(phase === 'preview' ? 'all' : 'recommended'); // 'all' | 'recommended' | 'favorites'
  const favoriteModules = useAppStore((s) => s.favoriteModules || []);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const isClosing = isAnimatingOut || externalClosing;
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null);

  // Search
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  const collapseSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, []);

  const handleSearchBlur = useCallback(() => {
    if (!searchQuery) setIsSearchOpen(false);
  }, [searchQuery]);

  const handleClose = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(onClose, 350);
  }, [onClose]);

  // Get modules that can be added to this phase
  const availableModules = moduleLibrary.filter((module) => {
    if (module.hidden) return false; // Hide linked parts (shown via parent entry)
    // Search-only modules (e.g. dev test modules) only surface when the user
    // explicitly searches for them — never in All / Recommended / Favorites.
    if (module.searchOnly && !searchQuery) return false;
    return canAddModuleToPhase(module.id, phase).allowed;
  });

  // Apply search if active, otherwise apply filter
  const searchedModules = searchQuery
    ? availableModules.filter(m => matchesSearch(m, searchQuery))
    : availableModules;

  const filteredModules = searchQuery
    ? searchedModules
    : searchedModules.filter((module) => {
        if (filter === 'all') return true;
        if (filter === 'recommended') return module.recommendedPhases?.includes(phase);
        if (filter === 'favorites') return favoriteModules.includes(module.id);
        return true;
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
    onSelect(selectedModule.id, selectedDuration);
    // Don't clear selectedModule here — let the detail modal's onClose do it after animation
  };

  const formatDuration = (minutes) => {
    return `${minutes} min`;
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/25 ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className={`absolute bottom-0 left-0 right-0 bg-[var(--color-bg)] border-t border-[var(--color-border)] rounded-t-2xl h-[80vh] flex flex-col shadow-lg ${isClosing ? 'animate-slideDownOut' : 'animate-slideUp'}`} data-tutorial="library-drawer">
        {/* Close button - positioned in top-right corner of drawer */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-4 text-[var(--color-text-tertiary)] opacity-70 hover:opacity-100 transition-opacity z-10"
          aria-label="Close"
          data-tutorial="library-close"
        >
          <CircleXIcon size={26} />
        </button>

        {/* Library icon - positioned in top-left corner of drawer; tweak top/left to fine-tune alignment with the title */}
        <BookHeartIcon
          size={40}
          strokeWidth={2.5}
          className="absolute top-7 left-6 text-[var(--accent)] pointer-events-none z-10"
        />

        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
        </div>

        {/* Header */}
        <div className="pb-4 border-b border-[var(--color-border)]">
          <div className="mb-4 pl-18 pr-24">
            <h3 className="text-3xl" style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}>Activity Library</h3>
          </div>

          {/* Filter buttons — scrolls edge-to-edge, inner padding for inset */}
          <div className="flex space-x-2 overflow-x-auto pb-1 pl-6" style={{ scrollPaddingInline: '1.5rem' }}>
            {/* Search pill */}
            <div
              className={`flex items-center flex-shrink-0 rounded-full border border-[var(--color-border)] transition-all duration-300 ease-in-out overflow-hidden ${
                isSearchOpen
                  ? 'w-48 bg-[var(--color-bg-secondary)]/50 px-3'
                  : 'w-[34px] cursor-pointer hover:border-[var(--color-text-primary)]'
              }`}
              style={{ height: '34px' }}
              onClick={() => { if (!isSearchOpen) setIsSearchOpen(true); }}
              role={isSearchOpen ? undefined : 'button'}
              aria-label={isSearchOpen ? undefined : 'Search activities'}
            >
              <div className={`flex items-center justify-center flex-shrink-0 transition-opacity duration-200 ${
                isSearchOpen ? 'opacity-0 w-0' : 'opacity-100 w-full'
              }`}>
                <SearchIcon size={16} className="text-[var(--color-border)]" />
              </div>
              {isSearchOpen && (
                <>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') collapseSearch(); }}
                    onBlur={handleSearchBlur}
                    placeholder="Search..."
                    className="bg-transparent border-none outline-none text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] w-full animate-fadeIn"
                    autoComplete="off"
                  />
                  {searchQuery && (
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                      className="flex-shrink-0 text-[var(--color-text-tertiary)] opacity-50 hover:opacity-100 transition-opacity"
                      aria-label="Clear search"
                    >
                      <CircleXIcon size={20} />
                    </button>
                  )}
                </>
              )}
            </div>

            <FilterButton
              active={filter === 'all' && !searchQuery}
              onClick={() => { collapseSearch(); setFilter('all'); }}
              dataTutorial="filter-all"
            >
              All
            </FilterButton>
            <FilterButton
              active={filter === 'recommended' && !searchQuery}
              onClick={() => { collapseSearch(); setFilter('recommended'); }}
              dataTutorial="filter-recommended"
            >
              Recommended
            </FilterButton>
            <FilterButton
              active={filter === 'favorites' && !searchQuery}
              onClick={() => { collapseSearch(); setFilter('favorites'); }}
            >
              Favorites
            </FilterButton>
            <div className="flex-shrink-0 w-4" aria-hidden="true" />
          </div>
        </div>

        {/* Module list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-[var(--color-bg)]">
          {sortedCategories.length === 0 ? (
            <div className="text-center py-8">
              {searchQuery ? (
                <div className="max-w-xs mx-auto text-left">
                  <p className="text-[var(--color-text-secondary)] text-sm mb-4 text-center">
                    No activities match &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p
                    className="text-lg text-[var(--color-text-tertiary)] mb-2"
                    style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                  >
                    Suggestions
                  </p>
                  <ul className="text-[var(--color-text-secondary)] text-sm space-y-1.5 list-disc pl-4">
                    <li>Search by therapeutic framework (&ldquo;ACT&rdquo; or &ldquo;IFS&rdquo;)</li>
                    <li>Search by phase (&ldquo;Phase 2&rdquo;, &ldquo;synthesis&rdquo;, or &ldquo;pre-session&rdquo;)</li>
                    <li>Search by tags (&ldquo;somatic&rdquo;, &ldquo;guided&rdquo;, &ldquo;journaling&rdquo;, or &ldquo;breathing&rdquo;)</li>
                  </ul>
                </div>
              ) : filter === 'favorites' ? (
                <div className="max-w-xs mx-auto">
                  <p
                    className="text-2xl text-[var(--color-text-tertiary)] mb-4"
                    style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                  >
                    no favorites yet
                  </p>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    Save or unsave an activity by clicking the star icon (<StarIcon size={26} className="inline-block text-[var(--color-text-tertiary)] align-middle" style={{ marginTop: '-2px' }} />) in the activity detail card.
                  </p>
                </div>
              ) : (
                <p className="text-[var(--color-text-tertiary)]">No modules match this filter</p>
              )}
            </div>
          ) : (
            sortedCategories.map(([category, modules]) => (
              <div key={category} className="mb-6">
                <h4 className="text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs mb-3">
                  {MODULE_CATEGORIES[category]?.label || category}
                </h4>
                <div className="space-y-2">
                  {modules.map((module) => (
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
                        </div>
                        <span className="text-[var(--color-text-tertiary)] text-xs flex-shrink-0 ml-3">
                          {formatDuration(module.defaultDuration)}
                        </span>
                      </div>
                      <div className="flex items-start gap-3.5 -mt-px">
                        {(() => { const Icon = getModuleIcon(module.id, module.category); return <Icon size={24} className="text-[var(--accent)] flex-shrink-0 mt-px" />; })()}
                        <p className="text-[var(--color-text-secondary)] text-sm min-w-0 line-clamp-3 min-h-[60px]">
                          {module.description}
                        </p>
                      </div>
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
                  ))}
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

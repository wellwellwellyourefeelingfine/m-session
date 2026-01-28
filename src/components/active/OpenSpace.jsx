/**
 * OpenSpace Component
 * Shown when all modules in a phase are completed but time remains
 * Offers the user unstructured time or the option to add activities
 *
 * Features:
 * - Header font title with moon animation
 * - Phase-specific messages
 * - Add Activity button that opens module library drawer
 * - Integration phase: Continue to Closing Ritual button
 */

import { useState, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { getModuleById, moduleLibrary, canAddModuleToPhase } from '../../content/modules';
import AsciiMoon from './capabilities/animations/AsciiMoon';

const PHASE_MESSAGES = {
  'come-up': {
    title: 'Open Space',
    message: 'You\'ve completed the scheduled activities for the come-up. Continue to rest and allow the experience to unfold naturally.',
    suggestion: 'Simply be present. There\'s nothing you need to do right now.',
  },
  peak: {
    title: 'Open Space',
    message: 'You\'ve completed your planned peak activities. Take this time to rest, listen to music, or follow your inner guidance.',
    suggestion: 'This is a time for open exploration. Trust what arises.',
  },
  integration: {
    title: 'Open Space',
    message: 'You\'ve completed your planned integration activities. Continue to rest and allow insights to settle.',
    suggestion: 'When you\'re ready, continue to the closing ritual to complete your session.',
  },
};

export default function OpenSpace({ phase }) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const getNextModule = useSessionStore((state) => state.getNextModule);
  const startModule = useSessionStore((state) => state.startModule);
  const addModule = useSessionStore((state) => state.addModule);
  const beginClosingRitual = useSessionStore((state) => state.beginClosingRitual);
  const enterOpenSpace = useSessionStore((state) => state.enterOpenSpace);

  const nextModule = getNextModule();
  const phaseContent = PHASE_MESSAGES[phase] || PHASE_MESSAGES.integration;

  // Ensure we're in open space mode when this component mounts
  // This prevents auto-starting modules when user is intentionally resting
  useEffect(() => {
    enterOpenSpace();
  }, [enterOpenSpace]);

  // Fade in on mount
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle continuing to next module
  const handleContinueToActivity = () => {
    if (nextModule) {
      startModule(nextModule.instanceId);
    }
  };

  // Handle continuing to closing ritual
  const handleContinueToClosing = () => {
    beginClosingRitual();
  };

  // Handle module selection from library
  const handleModuleSelect = (libraryId, warning) => {
    // Add the module to the current phase
    const result = addModule(libraryId, phase);
    if (result.success) {
      setShowLibrary(false);
      // The module is now added - nextModule will update automatically
      // and the button will change to "Continue to Activity"
    }
  };

  // Get modules that can be added to this phase (for library)
  const getAvailableModules = () => {
    return moduleLibrary.filter((module) => {
      const check = canAddModuleToPhase(module.id, phase);
      return check.allowed || check.warning;
    });
  };

  return (
    <div className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="px-6 py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="max-w-md text-center">
          {/* Title in header font */}
          <h2
            className="text-2xl mb-6"
            style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
          >
            {phaseContent.title}
          </h2>

          {/* Moon animation */}
          <div className="flex justify-center mb-8">
            <AsciiMoon />
          </div>

          {/* Phase-specific message */}
          <p className="mb-4 text-[var(--color-text-primary)] leading-relaxed">
            {phaseContent.message}
          </p>

          {/* Suggestion text */}
          <p className="text-[var(--color-text-secondary)] mb-10">
            {phaseContent.suggestion}
          </p>

          {/* Action buttons */}
          <div className="space-y-3">
            {/* Continue to Activity button - shown when there's a next module */}
            {nextModule && (
              <button
                onClick={handleContinueToActivity}
                className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-sm hover:opacity-80 transition-opacity"
              >
                Continue to Activity
              </button>
            )}

            {/* Add Activity button - opens library drawer */}
            <button
              onClick={() => setShowLibrary(true)}
              className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors uppercase tracking-wider text-sm"
            >
              Add Activity
            </button>

            {/* Integration phase: Continue to Closing Ritual */}
            {phase === 'integration' && (
              <button
                onClick={handleContinueToClosing}
                className="w-full py-4 border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors uppercase tracking-wider text-sm text-[var(--color-text-secondary)]"
              >
                Continue to Closing Ritual
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Module Library Drawer */}
      {showLibrary && (
        <OpenSpaceLibraryDrawer
          phase={phase}
          onSelect={handleModuleSelect}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  );
}

/**
 * Simplified Library Drawer for OpenSpace
 * Shows available modules for the current phase
 */
function OpenSpaceLibraryDrawer({ phase, onSelect, onClose }) {
  const [filter, setFilter] = useState('all');

  // Get modules that can be added to this phase
  const availableModules = moduleLibrary.filter((module) => {
    const check = canAddModuleToPhase(module.id, phase);
    return check.allowed || check.warning;
  });

  // Apply filter
  const filteredModules = availableModules.filter((module) => {
    if (filter === 'all') return true;
    if (filter === 'recommended') return module.recommendedPhases?.includes(phase);
    return module.intensity === filter;
  });

  const handleSelect = (module) => {
    const check = canAddModuleToPhase(module.id, phase);
    onSelect(module.id, check.warning);
  };

  const formatDuration = (minutes) => `${minutes} min`;

  // Intensity dots
  const getIntensityDots = (intensity) => {
    switch (intensity) {
      case 'gentle': return 1;
      case 'moderate': return 2;
      case 'deep': return 3;
      default: return 1;
    }
  };

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
      case 'come-up': return 'Come-Up';
      case 'peak': return 'Peak';
      case 'integration': return 'Integration';
      default: return p;
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
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center text-xl text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors z-10"
          aria-label="Close"
        >
          ×
        </button>

        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 border-b border-[var(--color-border)]">
          <div className="mb-4 pr-12">
            <h3>Add Activity</h3>
            <p className="text-[var(--color-text-tertiary)] text-sm">
              Adding to {getPhaseName(phase)} phase
            </p>
          </div>

          {/* Filter buttons */}
          <div className="flex space-x-2 overflow-x-auto pb-1">
            <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
              All
            </FilterButton>
            <FilterButton active={filter === 'recommended'} onClick={() => setFilter('recommended')}>
              Recommended
            </FilterButton>
            <FilterButton active={filter === 'gentle'} onClick={() => setFilter('gentle')}>
              Gentle
            </FilterButton>
            <FilterButton active={filter === 'moderate'} onClick={() => setFilter('moderate')}>
              Moderate
            </FilterButton>
            {phase === 'integration' && (
              <FilterButton active={filter === 'deep'} onClick={() => setFilter('deep')}>
                Deep
              </FilterButton>
            )}
          </div>
        </div>

        {/* Module list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-[var(--color-bg)]">
          {filteredModules.length === 0 ? (
            <p className="text-[var(--color-text-tertiary)] text-center py-8">
              No activities match this filter
            </p>
          ) : (
            <div className="space-y-2">
              {filteredModules.map((module) => {
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

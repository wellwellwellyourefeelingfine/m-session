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
import AsciiMoon from './capabilities/animations/AsciiMoon';
import ModuleLibraryDrawer from '../timeline/ModuleLibraryDrawer';

const PHASE_MESSAGES = {
  'come-up': {
    title: 'Open Space',
    message: 'You\'ve completed the scheduled activities for the Come-Up phase. Take a moment to rest and check-in with yourself. When you\'re ready, proceed with one of the following:',
  },
  peak: {
    title: 'Open Space',
    message: 'You\'ve completed the scheduled activities for the Peak phase. Take a moment to rest and check-in with yourself. When you\'re ready, proceed with one of the following:',
  },
  integration: {
    title: 'Open Space',
    message: 'You\'ve completed the scheduled activities for the Integration phase. Take a moment to rest and check-in with yourself. When you\'re ready, proceed with one of the following:',
  },
};

export default function OpenSpace({ phase }) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const getNextModule = useSessionStore((state) => state.getNextModule);
  const startModule = useSessionStore((state) => state.startModule);
  const addModule = useSessionStore((state) => state.addModule);
  const beginClosingRitual = useSessionStore((state) => state.beginClosingRitual);
  const beginPeakTransition = useSessionStore((state) => state.beginPeakTransition);
  const beginIntegrationTransition = useSessionStore((state) => state.beginIntegrationTransition);
  const enterOpenSpace = useSessionStore((state) => state.enterOpenSpace);
  const comeUpCheckIn = useSessionStore((state) => state.comeUpCheckIn);

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

  // Handle continuing to peak phase (come-up open space)
  const handleContinueToPeak = () => {
    beginPeakTransition();
  };

  // Handle continuing to integration phase (peak open space)
  const handleContinueToIntegration = () => {
    beginIntegrationTransition();
  };

  // Handle module selection from library
  const handleModuleSelect = (libraryId, _warning) => {
    // Add the module to the current phase
    const result = addModule(libraryId, phase);
    if (result.success) {
      setShowLibrary(false);
      // The module is now added - nextModule will update automatically
      // and the button will change to "Continue to Activity"
    }
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
          <p className="mb-10 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {phaseContent.message}
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

            {/* Come-up phase: Continue to Peak Phase when fully arrived */}
            {phase === 'come-up' && comeUpCheckIn.hasIndicatedFullyArrived && (
              <button
                onClick={handleContinueToPeak}
                className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-sm hover:opacity-80 transition-opacity"
              >
                Continue to Peak Phase
              </button>
            )}

            {/* Peak phase: Continue to Integration Phase */}
            {phase === 'peak' && (
              <button
                onClick={handleContinueToIntegration}
                className="w-full py-4 bg-[var(--color-text-primary)] text-[var(--color-bg)] uppercase tracking-wider text-sm hover:opacity-80 transition-opacity"
              >
                Continue to Integration Phase
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
        <ModuleLibraryDrawer
          phase={phase}
          onSelect={handleModuleSelect}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  );
}
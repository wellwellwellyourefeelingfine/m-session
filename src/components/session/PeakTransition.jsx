/**
 * PeakTransition Component
 * Supportive transition experience from come-up to peak phase
 *
 * Flow:
 * 1. Congratulates user on completing come-up
 * 2. Sets expectations for peak (1-2 hours, trust intuition, no forcing)
 * 3. Reminds about timeline customization
 * 4. Prompts hydration
 * 5. Offers to show intention from intake (optional)
 * 6. If yes: displays intention, asks for insights, offers journal access
 * 7. Continue to peak phase
 */

import { useState, useCallback, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useAppStore } from '../../stores/useAppStore';
import { useJournalStore } from '../../stores/useJournalStore';

import ModuleControlBar from '../active/capabilities/ModuleControlBar';
import ModuleProgressBar from '../active/capabilities/ModuleProgressBar';
import AsciiMoon from '../active/capabilities/animations/AsciiMoon';

// Helper to format elapsed time nicely (for display)
const formatElapsedTime = (minutes) => {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours !== 1 ? 's' : ''} and ${mins} minute${mins !== 1 ? 's' : ''}`;
};

// Helper to format elapsed time as HH:MM (for journal)
const formatElapsedTimeShort = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const TRANSITION_STEPS = [
  {
    id: 'congratulations',
    duration: 0, // User clicks to continue
    content: {
      label: 'Transition',
      title: 'Well Done',
      body: "You've moved through the come-up phase. This initial period can sometimes feel intense or uncertain. You handled it beautifully.",
    },
  },
  {
    id: 'whats-ahead',
    duration: 0,
    content: {
      label: 'What\'s Ahead',
      title: 'The Peak',
      body: "For the next hour or two, you'll be in a heightened state of openness and connection. There's no need to force anything or make anything happen.",
    },
  },
  {
    id: 'trust-intuition',
    duration: 0,
    content: {
      label: 'Guidance',
      title: 'Trust Yourself',
      body: "Go with your intuition and how you feel. If something calls to you, follow it. If you need rest, rest. Your inner wisdom knows what it needs.",
    },
  },
  {
    id: 'flexibility',
    duration: 0,
    content: {
      label: 'Flexibility',
      title: 'Your Session, Your Way',
      body: "Remember: you can adjust your session anytime. On the Home tab, you can add, remove, or reorder activities to match what feels right in the moment.",
    },
  },
  {
    id: 'hydration',
    duration: 0,
    content: {
      label: 'Care',
      title: 'Hydrate',
      body: "Take a moment now to drink some water. Small sips are best. Staying hydrated helps your body process the experience smoothly.",
      isHydration: true,
    },
  },
  {
    id: 'intention-prompt',
    duration: 0,
    content: {
      label: 'Intention',
      title: 'Your Intention',
      body: "Before your session, you set an intention. Would you like to be reminded of what you wrote?",
      isIntentionPrompt: true,
    },
  },
  // The next steps are conditional based on user choice
];

const INTENTION_REFLECTION_STEP = {
  id: 'intention-reflection',
  duration: 0,
  content: {
    label: 'Reflection',
    title: 'Your Intention',
    isIntentionReflection: true,
  },
};

const READY_STEP = {
  id: 'ready',
  duration: 0,
  content: {
    label: 'Ready',
    title: 'Begin the Peak',
    body: "When you're ready, we'll move into the peak phase of your journey. Take your time.",
    isReady: true,
  },
};

export default function PeakTransition() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showIntentionReflection, setShowIntentionReflection] = useState(false);
  const [steps, setSteps] = useState(TRANSITION_STEPS);
  const [intentionJournalEntryId, setIntentionJournalEntryId] = useState(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const transitionToPeak = useSessionStore((state) => state.transitionToPeak);
  const intake = useSessionStore((state) => state.intake);
  const getElapsedMinutes = useSessionStore((state) => state.getElapsedMinutes);
  const setCurrentTab = useAppStore((state) => state.setCurrentTab);
  const addEntry = useJournalStore((state) => state.addEntry);
  const navigateToEditor = useJournalStore((state) => state.navigateToEditor);

  // Update elapsed time every minute
  useEffect(() => {
    setElapsedMinutes(getElapsedMinutes());
    const interval = setInterval(() => {
      setElapsedMinutes(getElapsedMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, [getElapsedMinutes]);

  // Get the user's intention from intake responses
  const userIntention = intake.responses?.holdingQuestion || '';
  const hasIntention = userIntention.trim().length > 0;

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const totalSteps = steps.length;

  // Progress percentage
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  const handleNext = useCallback(() => {
    if (isLastStep) {
      transitionToPeak();
      return;
    }

    setIsVisible(false);
    setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
      setIsVisible(true);
    }, 400);
  }, [isLastStep, transitionToPeak]);

  const handleIntentionChoice = useCallback((wantsToSee) => {
    setIsVisible(false);
    setTimeout(() => {
      if (wantsToSee && hasIntention) {
        // Insert the intention reflection step and ready step
        setSteps((prev) => {
          const baseSteps = prev.slice(0, currentStepIndex + 1);
          return [...baseSteps, INTENTION_REFLECTION_STEP, READY_STEP];
        });
        setShowIntentionReflection(true);
      } else {
        // Just add the ready step
        setSteps((prev) => {
          const baseSteps = prev.slice(0, currentStepIndex + 1);
          return [...baseSteps, READY_STEP];
        });
      }
      setCurrentStepIndex((prev) => prev + 1);
      setIsVisible(true);
    }, 400);
  }, [currentStepIndex, hasIntention]);

  const handleGoToJournal = useCallback(() => {
    // Create a journal entry with the intention if we haven't already
    if (!intentionJournalEntryId && hasIntention) {
      const currentElapsedMinutes = getElapsedMinutes();
      const elapsedTimeShort = formatElapsedTimeShort(currentElapsedMinutes);

      const journalContent = `INTENTION:

"${userIntention}"

---

INSIGHTS (${elapsedTimeShort}):

`;

      const newEntry = addEntry({
        content: journalContent,
        source: 'session',
        moduleTitle: 'Peak Transition - Intention Reflection',
        isEdited: true, // Skip confirmation modal since user is intentionally opening to edit
      });

      setIntentionJournalEntryId(newEntry.id);
      navigateToEditor(newEntry.id);
    } else if (intentionJournalEntryId) {
      // Already created an entry, just navigate to it
      navigateToEditor(intentionJournalEntryId);
    } else {
      // No intention, just open a blank entry
      navigateToEditor(null);
    }

    setCurrentTab('journal');
  }, [setCurrentTab, intentionJournalEntryId, hasIntention, userIntention, getElapsedMinutes, addEntry, navigateToEditor]);

  const handleSkip = useCallback(() => {
    transitionToPeak();
  }, [transitionToPeak]);

  // Render content based on step type
  const renderContent = () => {
    const { content } = currentStep;

    // Intention prompt - show yes/no buttons (only if user has an intention)
    if (content.isIntentionPrompt) {
      // If no intention was set, skip this step automatically
      if (!hasIntention) {
        return (
          <div className="text-center space-y-6 animate-fadeIn">
            <h2 className="text-[var(--color-text-primary)]">
              Ready to Continue
            </h2>
            <p className="leading-relaxed text-[var(--color-text-secondary)]">
              Take a moment to check in with yourself. When you're ready, we'll move into the peak phase.
            </p>
          </div>
        );
      }

      return (
        <div className="text-center space-y-6 animate-fadeIn">
          <h2 className="text-[var(--color-text-primary)]">
            {content.title}
          </h2>
          <p className="leading-relaxed text-[var(--color-text-secondary)]">
            {content.body}
          </p>
          <div className="space-y-3 pt-4">
            <button
              onClick={() => handleIntentionChoice(true)}
              className="w-full py-4 border border-[var(--color-border)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              Yes, remind me
            </button>
            <button
              onClick={() => handleIntentionChoice(false)}
              className="w-full py-3 text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs hover:text-[var(--color-text-secondary)] transition-colors"
            >
              No, continue without
            </button>
          </div>
        </div>
      );
    }

    // Intention reflection - show their intention and ask for insights
    if (content.isIntentionReflection) {
      return (
        <div className="text-center space-y-6 animate-fadeIn">
          <h2 className="text-[var(--color-text-primary)]">
            {content.title}
          </h2>

          {/* Display the user's intention */}
          <div className="border border-[var(--accent)] p-6 bg-[var(--accent-bg)]">
            <p className="text-[var(--color-text-primary)] leading-relaxed italic">
              "{userIntention}"
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              How does this intention feel to you now? Do you notice any new insights or feelings arising around it?
            </p>
            <p className="text-[var(--color-text-tertiary)] text-xs">
              If you'd like to write about it, you can access your journal anytime.
            </p>
          </div>

          <button
            onClick={handleGoToJournal}
            className="inline-block px-6 py-3 border border-[var(--color-border)] text-[var(--color-text-secondary)] uppercase tracking-wider text-xs hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            Open Journal
          </button>
        </div>
      );
    }

    // Hydration step - gentle reminder
    if (content.isHydration) {
      return (
        <div className="text-center space-y-6 animate-fadeIn">
          <h2 className="text-[var(--color-text-primary)]">
            {content.title}
          </h2>
          <p className="leading-relaxed text-[var(--color-text-secondary)]">
            {content.body}
          </p>
          <div className="py-4">
            <p className="text-[var(--color-text-tertiary)] text-xs">
              Take your time. Continue when ready.
            </p>
          </div>
        </div>
      );
    }

    // Ready step - final step before peak
    if (content.isReady) {
      return (
        <div className="text-center space-y-6 animate-fadeIn">
          <h2 className="text-[var(--color-text-primary)]">
            {content.title}
          </h2>
          <p className="leading-relaxed text-[var(--color-text-secondary)]">
            {content.body}
          </p>
        </div>
      );
    }

    // Regular informational step
    return (
      <div className="text-center space-y-6 animate-fadeIn">
        <h2 className="text-[var(--color-text-primary)]">
          {content.title}
        </h2>
        <p className="leading-relaxed text-[var(--color-text-secondary)]">
          {content.body}
        </p>
      </div>
    );
  };

  // Get primary button config
  const getPrimaryButton = () => {
    const { content } = currentStep;

    // Intention prompt step - no primary button if user has intention (uses custom buttons)
    // But show Continue if no intention was set
    if (content.isIntentionPrompt) {
      if (!hasIntention) {
        return {
          label: 'Continue',
          onClick: () => handleIntentionChoice(false),
        };
      }
      return null;
    }

    // Last step - "Begin Peak"
    if (isLastStep) {
      return {
        label: 'Begin Peak',
        onClick: handleNext,
      };
    }

    // Regular continue
    return {
      label: 'Continue',
      onClick: handleNext,
    };
  };

  return (
    <>
      {/* Progress bar at top */}
      <ModuleProgressBar
        progress={progress}
        visible={true}
        showTime={false}
      />

      {/* Fixed layout container - fills space between header and control bar */}
      <div className="fixed top-16 left-0 right-0 bottom-[68px] flex flex-col overflow-hidden">
        {/* Anchored header section - doesn't scroll */}
        <div className="flex-shrink-0 pt-8 pb-4">
          {/* Header: Transition + elapsed time */}
          <div className="text-center mb-4">
            <p className="uppercase tracking-widest text-[10px] text-[var(--color-text-tertiary)]">
              Transition
            </p>
            <p className="text-[var(--color-text-tertiary)] text-xs mt-1">
              {formatElapsedTime(elapsedMinutes)} into session
            </p>
          </div>

          {/* ASCII Moon animation - anchored */}
          <div className="flex justify-center">
            <AsciiMoon />
          </div>
        </div>

        {/* Content area - directly below animation, scrollable if needed */}
        <div className="flex-1 overflow-auto px-6">
          <div
            className={`w-full max-w-md mx-auto transition-opacity duration-400 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Fixed control bar above tab bar */}
      <ModuleControlBar
        phase={isLastStep ? 'completed' : 'active'}
        primary={getPrimaryButton()}
        showBack={false}
        showSkip={!isLastStep}
        onSkip={handleSkip}
        skipConfirmMessage="Skip the transition and go directly to peak?"
      />
    </>
  );
}

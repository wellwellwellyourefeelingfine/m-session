/**
 * IntegrationTransition Component
 * Supportive transition experience from peak to integration phase
 *
 * New Flow with Branching:
 * 1. "The Peak Is Softening" - Acknowledgment
 * 2. "Return to Your Intention" - Shows intention with edit option
 * 3. "Your Focus" - Shows focus with confirm/change option
 * 3B. "What Came Into Focus?" - Focus selection (conditional if user wants to change)
 * 3C. Relationship type selection (conditional if focus is 'relationship')
 * 4. "A Moment of Reflection" - Bridge text + tailored activity offer
 * 5. Tailored Activity - Based on focus (conditional if user accepts)
 * 6. "Nourish Yourself" - Hydration & nourishment
 * 7. "Enter Integration" - Final step with "Begin Integration" button
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';

import ModuleControlBar from '../active/capabilities/ModuleControlBar';
import ModuleStatusBar, { formatTime } from '../active/ModuleStatusBar';
import AsciiMoon from '../active/capabilities/animations/AsciiMoon';
import TransitionBuffer from './TransitionBuffer';

import { FocusSelector, TailoredActivity, TransitionTextarea } from './transitions/shared';
import {
  INTEGRATION_TRANSITION_STEPS,
  FOCUS_LABELS,
  getBridgeText,
} from './transitions/content/integrationTransitionContent';
import { getActivityForFocus } from './transitions/content/tailoredActivities';


export default function IntegrationTransition() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [sessionElapsed, setSessionElapsed] = useState('0:00');
  const [isFadingToBuffer, setIsFadingToBuffer] = useState(false);
  const [showPostBuffer, setShowPostBuffer] = useState(false);

  // Navigation history for back button
  const [_stepHistory, setStepHistory] = useState([0]);

  // Local state for captures
  const [intentionEdited, setIntentionEdited] = useState(false);
  const [editedIntention, setEditedIntention] = useState('');
  const [focusChanged, setFocusChanged] = useState(false);
  const [newFocus, setNewFocus] = useState(null);
  const [newRelationshipType, setNewRelationshipType] = useState(null);
  const [needsRelationshipType, setNeedsRelationshipType] = useState(false);
  const [wantsActivity, setWantsActivity] = useState(null); // null = not answered, true/false
  const [activityResponse, setActivityResponse] = useState({});

  // Store selectors
  const transitionToIntegration = useSessionStore((state) => state.transitionToIntegration);
  const updateIntegrationCapture = useSessionStore((state) => state.updateIntegrationCapture);
  const ingestionTime = useSessionStore((state) => state.substanceChecklist.ingestionTime);
  const intake = useSessionStore((state) => state.intake);
  const addEntry = useJournalStore((state) => state.addEntry);

  // Get user's original intention and focus from intake
  const originalIntention = intake?.responses?.holdingQuestion || '';
  const originalFocus = intake?.responses?.primaryFocus || 'open';

  // Current effective focus (original or changed)
  const effectiveFocus = focusChanged && newFocus ? newFocus : originalFocus;

  // Update session elapsed time every second
  useEffect(() => {
    if (!ingestionTime) return;
    const update = () => {
      const secs = Math.floor((Date.now() - ingestionTime) / 1000);
      setSessionElapsed(formatTime(secs));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [ingestionTime]);

  // Build dynamic step sequence based on user choices
  const steps = useMemo(() => {
    const baseSteps = INTEGRATION_TRANSITION_STEPS.filter((step) => {
      // Always include these core steps
      if (['acknowledgment', 'intention-checkin', 'focus-confirmation', 'hydration', 'ready'].includes(step.id)) {
        return true;
      }

      // Include focus-edit only if user wants to change focus
      if (step.id === 'focus-edit') {
        return focusChanged;
      }

      // Include relationship-type step only if user selected relationship focus
      if (step.id === 'relationship-type') {
        return needsRelationshipType;
      }

      // Include bridge only if we're going to offer the activity
      if (step.id === 'bridge') {
        return true; // Always show bridge - it has the activity offer
      }

      // Include tailored-activity only if user wants it
      if (step.id === 'tailored-activity') {
        return wantsActivity === true;
      }

      return false;
    });

    return baseSteps;
  }, [focusChanged, needsRelationshipType, wantsActivity]);

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const totalSteps = steps.length;

  // Progress percentage
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  // Save captures and create journal entry
  const saveCaptures = useCallback(() => {
    // Update store
    updateIntegrationCapture('intentionEdited', intentionEdited);
    updateIntegrationCapture('editedIntention', editedIntention);
    updateIntegrationCapture('focusChanged', focusChanged);
    updateIntegrationCapture('newFocus', newFocus);
    updateIntegrationCapture('newRelationshipType', newRelationshipType);
    updateIntegrationCapture('tailoredActivityFocus', wantsActivity ? effectiveFocus : null);
    updateIntegrationCapture('tailoredActivityResponse', activityResponse);
    updateIntegrationCapture('completedAt', new Date());

    // Create journal entry if there's meaningful content
    const hasIntentionEdit = intentionEdited && editedIntention.trim();
    const hasActivityContent = wantsActivity && Object.values(activityResponse).some((v) => v?.trim?.());

    if (hasIntentionEdit || hasActivityContent) {
      const activity = getActivityForFocus(effectiveFocus);
      let journalContent = 'SYNTHESIS TRANSITION\n\n';

      if (hasIntentionEdit) {
        journalContent += `Intention Addition:\n${editedIntention}\n\n`;
      }

      if (focusChanged && newFocus) {
        journalContent += `Focus shifted to: ${FOCUS_LABELS[newFocus] || newFocus}\n\n`;
      }

      if (hasActivityContent) {
        journalContent += `${activity.title}\n`;
        // Format activity response based on type
        Object.values(activityResponse).forEach((value) => {
          if (value?.trim?.()) {
            journalContent += `${value}\n\n`;
          }
        });
      }

      addEntry({
        content: journalContent.trim(),
        source: 'session',
        moduleTitle: 'Synthesis Transition',
        tags: hasActivityContent ? [activity.journalTag] : [],
      });
    }
  }, [
    intentionEdited,
    editedIntention,
    focusChanged,
    newFocus,
    newRelationshipType,
    wantsActivity,
    effectiveFocus,
    activityResponse,
    updateIntegrationCapture,
    addEntry,
  ]);

  const handleNext = useCallback(() => {
    if (isLastStep) {
      // Save captures, then fade out entire screen before showing buffer
      saveCaptures();
      setIsFadingToBuffer(true);
      // Wait for fade-out animation to complete before showing buffer
      setTimeout(() => {
        setShowPostBuffer(true);
      }, 500);
      return;
    }

    setIsVisible(false);
    setTimeout(() => {
      setCurrentStepIndex((prev) => {
        const nextIndex = prev + 1;
        setStepHistory((history) => [...history, nextIndex]);
        return nextIndex;
      });
      setIsVisible(true);
    }, 400);
  }, [isLastStep, saveCaptures]);

  const handleBack = useCallback(() => {
    if (currentStepIndex === 0) return;

    setIsVisible(false);
    setTimeout(() => {
      setStepHistory((history) => {
        if (history.length <= 1) return history;
        const newHistory = history.slice(0, -1);
        setCurrentStepIndex(newHistory[newHistory.length - 1]);
        return newHistory;
      });
      setIsVisible(true);
    }, 400);
  }, [currentStepIndex]);

  const handleSkip = useCallback(() => {
    saveCaptures();
    transitionToIntegration();
  }, [saveCaptures, transitionToIntegration]);

  // Handle "Edit Intention" action
  const handleEditIntention = useCallback(() => {
    setIntentionEdited(true);
    // Stay on current step - the UI will show the textarea
  }, []);

  // Handle "Change Focus" action
  const handleChangeFocus = useCallback(() => {
    setFocusChanged(true);
    // Move to focus-edit step (which will be inserted)
    setIsVisible(false);
    setTimeout(() => {
      // Find the focus-edit step index in the new step array
      const newSteps = INTEGRATION_TRANSITION_STEPS.filter((step) => {
        if (['acknowledgment', 'intention-checkin', 'focus-confirmation', 'focus-edit', 'bridge', 'hydration', 'ready'].includes(step.id)) {
          return true;
        }
        return false;
      });
      const focusEditIndex = newSteps.findIndex((s) => s.id === 'focus-edit');
      setCurrentStepIndex(focusEditIndex);
      setStepHistory((history) => [...history, focusEditIndex]);
      setIsVisible(true);
    }, 400);
  }, []);

  // Handle focus selection (on continue, check if relationship needs type)
  const handleFocusSelect = useCallback((focus) => {
    setNewFocus(focus);
    // Reset relationship type when focus changes
    if (focus !== 'relationship') {
      setNeedsRelationshipType(false);
      setNewRelationshipType(null);
    }
  }, []);

  // Handle relationship type selection
  const handleRelationshipTypeSelect = useCallback((type) => {
    setNewRelationshipType(type);
  }, []);

  // Handle continuing from focus-edit step
  const handleFocusEditContinue = useCallback(() => {
    if (newFocus === 'relationship') {
      // Need to show relationship type step
      setNeedsRelationshipType(true);
      setIsVisible(false);
      setTimeout(() => {
        // Find the relationship-type step index
        const newSteps = INTEGRATION_TRANSITION_STEPS.filter((step) => {
          if (['acknowledgment', 'intention-checkin', 'focus-confirmation', 'focus-edit', 'relationship-type', 'bridge', 'hydration', 'ready'].includes(step.id)) {
            return true;
          }
          return false;
        });
        const relationshipTypeIndex = newSteps.findIndex((s) => s.id === 'relationship-type');
        setCurrentStepIndex(relationshipTypeIndex);
        setStepHistory((history) => [...history, relationshipTypeIndex]);
        setIsVisible(true);
      }, 400);
    } else {
      // Regular continue
      handleNext();
    }
  }, [newFocus, handleNext]);

  // Handle activity offer response
  const handleActivityOffer = useCallback((wantsIt) => {
    setWantsActivity(wantsIt);
    // Advance to next step
    handleNext();
  }, [handleNext]);

  // Render content based on step type
  const renderContent = () => {
    const { content } = currentStep;

    // Acknowledgment step
    if (currentStep.id === 'acknowledgment') {
      return (
        <div className="text-center space-y-4 animate-fadeIn">
          <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
            {content.title}
          </h2>
          <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {content.body}
          </p>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {content.bodySecondary}
          </p>
        </div>
      );
    }

    // Intention check-in step
    if (content.isIntentionCheckIn) {
      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
          </div>

          {/* Show original intention - accent styled box */}
          <div className="py-4 px-4 border border-[var(--accent)] bg-[var(--accent-bg)]">
            <p className="text-[var(--color-text-primary)] text-sm italic leading-relaxed">
              "{originalIntention || 'No intention was set'}"
            </p>
          </div>

          <p className="text-center text-[var(--color-text-secondary)] text-sm">
            {content.bodyAfterIntention}
          </p>

          {/* Show edit textarea if user chose to edit */}
          {intentionEdited && (
            <div className="space-y-2">
              <p className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">
                Add to your intention
              </p>
              <TransitionTextarea
                value={editedIntention}
                onChange={setEditedIntention}
                placeholder="What I'd like to add..."
              />
            </div>
          )}

          {/* Edit button if not already editing */}
          {!intentionEdited && originalIntention && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleEditIntention}
                className="text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider hover:text-[var(--color-text-secondary)]"
              >
                + Add to this
              </button>
            </div>
          )}
        </div>
      );
    }

    // Focus confirmation step
    if (content.isFocusConfirmation) {
      const focusLabel = FOCUS_LABELS[originalFocus] || 'Open exploration';

      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
          </div>

          {/* Show original focus - accent styled box */}
          <div className="py-4 px-4 border border-[var(--accent)] bg-[var(--accent-bg)]">
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed text-center">
              {focusLabel}
            </p>
          </div>

          <p className="text-center text-[var(--color-text-secondary)] text-sm">
            {content.bodyAfterFocus}
          </p>

          {/* Choice buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleNext}
              className="w-full py-4 px-4 border border-[var(--color-border)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:bg-[var(--color-bg-secondary)]"
            >
              This still feels right
            </button>
            <button
              type="button"
              onClick={handleChangeFocus}
              className="w-full py-3 text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs hover:text-[var(--color-text-secondary)]"
            >
              Something else came into focus
            </button>
          </div>
        </div>
      );
    }

    // Focus edit step (conditional) - just focus selection, relationship type is separate step
    if (content.isFocusEdit) {
      return (
        <div className="space-y-6 animate-fadeIn pb-4">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
            <p className="text-[var(--color-text-tertiary)] text-xs">
              {content.instruction}
            </p>
          </div>

          <FocusSelector
            selectedFocus={newFocus}
            onFocusChange={handleFocusSelect}
          />
        </div>
      );
    }

    // Relationship type step (conditional) - separate from focus selection
    if (content.isRelationshipType) {
      return (
        <div className="space-y-6 animate-fadeIn pb-4">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.body}
            </p>
          </div>

          <FocusSelector
            selectedRelationshipType={newRelationshipType}
            onRelationshipTypeChange={handleRelationshipTypeSelect}
            showRelationshipTypes={true}
          />
        </div>
      );
    }

    // Bridge step (activity offer)
    if (content.isBridge) {
      const bridgeText = getBridgeText(effectiveFocus);

      return (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2">
            <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
              {content.title}
            </h2>
          </div>

          <div className="text-center space-y-4">
            <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
              {bridgeText.body}
            </p>
            {bridgeText.bodySecondary && (
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                {bridgeText.bodySecondary}
              </p>
            )}
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {bridgeText.question}
            </p>
          </div>

          {/* Choice buttons */}
          <div className="space-y-3 pt-4">
            <button
              type="button"
              onClick={() => handleActivityOffer(true)}
              className="w-full py-4 px-4 border border-[var(--color-border)] text-[var(--color-text-primary)] uppercase tracking-wider text-xs hover:bg-[var(--color-bg-secondary)]"
            >
              {bridgeText.yesLabel || "Yes, I'd like to"}
            </button>
            <button
              type="button"
              onClick={() => handleActivityOffer(false)}
              className="w-full py-3 text-[var(--color-text-tertiary)] uppercase tracking-wider text-xs hover:text-[var(--color-text-secondary)]"
            >
              {bridgeText.noLabel || 'No, continue without'}
            </button>
          </div>
        </div>
      );
    }

    // Tailored activity step (conditional)
    if (content.isTailoredActivity) {
      return (
        <div className="animate-fadeIn pb-8">
          <TailoredActivity
            focus={effectiveFocus}
            response={activityResponse}
            onChange={setActivityResponse}
          />
        </div>
      );
    }

    // Hydration step
    if (content.isHydration) {
      return (
        <div className="text-center space-y-6 animate-fadeIn">
          <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
            {content.title}
          </h2>
          <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {content.body}
          </p>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {content.bodySecondary}
          </p>
        </div>
      );
    }

    // Ready step (final)
    if (content.isReady) {
      return (
        <div className="text-center space-y-4 animate-fadeIn">
          <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
            {content.title}
          </h2>
          <p className="text-[var(--color-text-primary)] text-sm leading-relaxed">
            {content.body}
          </p>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {content.bodySecondary}
          </p>
          {content.bodyTertiary && (
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {content.bodyTertiary}
            </p>
          )}
        </div>
      );
    }

    // Default text-only step
    return (
      <div className="text-center space-y-4 animate-fadeIn">
        <h2 className="font-serif text-lg text-[var(--color-text-primary)]">
          {content.title}
        </h2>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
          {content.body}
        </p>
      </div>
    );
  };

  // Get primary button config
  const getPrimaryButton = () => {
    // Focus confirmation step - handled by inline buttons
    if (currentStep.content.isFocusConfirmation) {
      return null;
    }

    // Bridge step (activity offer) - handled by inline buttons
    if (currentStep.content.isBridge) {
      return null;
    }

    // Focus edit step - need a selection first, then handle relationship separately
    if (currentStep.content.isFocusEdit) {
      if (!newFocus) return null;

      return {
        label: 'Continue',
        onClick: handleFocusEditContinue,
      };
    }

    // Relationship type step - need a selection first
    if (currentStep.content.isRelationshipType) {
      if (!newRelationshipType) return null;

      return {
        label: 'Continue',
        onClick: handleNext,
      };
    }

    // Last step
    if (isLastStep) {
      return {
        label: 'Begin',
        onClick: handleNext,
      };
    }

    // Regular continue
    return {
      label: 'Continue',
      onClick: handleNext,
    };
  };

  // Determine if skip should be shown
  const showSkipButton = () => {
    // Don't show skip on steps with inline choice buttons
    if (currentStep.content.isFocusConfirmation) return false;
    if (currentStep.content.isBridge) return false;
    // Don't show on focus/relationship selection steps
    if (currentStep.content.isFocusEdit) return false;
    if (currentStep.content.isRelationshipType) return false;
    // Don't show on last step
    if (isLastStep) return false;
    return true;
  };

  // Determine if back button should be shown
  const showBackButton = () => {
    return currentStepIndex > 0;
  };

  // Called when TransitionBuffer completes
  const handleBufferComplete = useCallback(() => {
    transitionToIntegration();
  }, [transitionToIntegration]);

  // Determine if moon should be shown
  const showMoon = () => {
    // Hide on tailored activity
    if (currentStep.content.isTailoredActivity) return false;
    // Hide on steps that set hidesMoon flag (focus selection pages)
    if (currentStep.content.hidesMoon) return false;
    return true;
  };

  // Post-transition buffer screen using TransitionBuffer component
  if (showPostBuffer) {
    return (
      <div className="fixed inset-0 bg-[var(--color-bg-primary)]">
        <TransitionBuffer onComplete={handleBufferComplete} holdDuration={2500} />
      </div>
    );
  }

  return (
    <div
      className={`transition-opacity duration-500 ${
        isFadingToBuffer ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Status bar at top */}
      <ModuleStatusBar
        progress={progress}
        leftLabel="Transition"
        centerContent={
          <span className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider whitespace-nowrap">
            {sessionElapsed}
          </span>
        }
      />

      {/* Fixed layout container - fills space between header and tab bar */}
      <div className="fixed left-0 right-0 flex flex-col overflow-hidden" style={{ top: 'var(--header-plus-status)', bottom: 'var(--tabbar-height)' }}>
        {/* Anchored header section - doesn't scroll */}
        <div className="flex-shrink-0 pt-4 pb-4">
          {/* ASCII Moon animation - anchored (hide on selection steps and tailored activity) */}
          {showMoon() && (
            <div className="flex justify-center">
              <AsciiMoon />
            </div>
          )}
        </div>

        {/* Content area - directly below animation, scrollable if needed */}
        <div className="flex-1 overflow-auto px-6">
          <div
            className={`w-full max-w-md mx-auto pb-24 transition-opacity duration-[400ms] ${
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
        showBack={showBackButton()}
        onBack={handleBack}
        backConfirmMessage={null}
        showSkip={showSkipButton()}
        onSkip={handleSkip}
        skipConfirmMessage="Skip the transition and go directly to the synthesis phase?"
      />
    </div>
  );
}

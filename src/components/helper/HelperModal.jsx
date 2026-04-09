/**
 * HelperModal
 * Top-anchored sheet modal for the "What's Happening?" support overlay.
 *
 * Mounted conditionally by the parent (AppShell) only when useHelperStore.isOpen
 * is true — exactly the same pattern as ModuleLibraryDrawer and BoosterModal.
 * Each open is a fresh mount with fresh state, so there are no leftover-state bugs.
 *
 * Layout (mirrors ModuleLibraryDrawer, just inverted to anchor at the top):
 *   <fixed inset-0 wrapper>          ← non-animating, just positions children
 *     <backdrop>                     ← fades in/out independently (animate-fadeIn / animate-fadeOut)
 *     <panel>                        ← slides in/out independently (animate-slideDownIn / animate-slideUpOut)
 *   </>
 *
 * The backdrop and panel are SIBLINGS so the backdrop's opacity transition doesn't
 * affect the panel's visual opacity.
 *
 * V5: the per-category rating + result flow has been replaced by a phase-aware
 * decision tree managed by TriageStepRunner. The modal owns the major view
 * state machine ('initial' / 'triage' / 'emergency-contact'), `selectedCategory`,
 * and the runner's "has the rating been committed" flag (which drives the
 * default → expanded height transition). Triage state itself lives inside the
 * runner — fresh on every category open, discarded on back-out.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useHelperStore } from '../../stores/useHelperStore';
import { helperCategories } from '../../content/helper/categories';
import { formatHelperModalLog, buildStepResponses } from '../../content/helper/formatLog';
import { classifyPhaseWindow } from '../../content/helper/resolverUtils';
import { getModuleById } from '../../content/modules';
import HelperTopBar from './HelperTopBar';
import PreSessionContent from './PreSessionContent';
import CategoryGrid from './CategoryGrid';
import EmergencyContactView from './EmergencyContactView';
import TriageStepRunner from './TriageStepRunner';
import PlaceholderCategory from './PlaceholderCategory';

const CLOSE_ANIMATION_MS = 350;

// Default modal height. Fixed pixels (not vh) so the modal opens to the same
// size on every device. Tuned to fit the 6 category cards + emergency contact
// card + top bar without scroll. Adjust if the initial-step content changes.
const DEFAULT_MODAL_HEIGHT_PX = 550;

export default function HelperModal() {
  const sessionPhase = useSessionStore((state) => state.sessionPhase);
  const emergencyContactDetails = useSessionStore((state) => state.sessionProfile?.emergencyContactDetails);
  const sessionId = useSessionStore((state) => state.sessionId);
  const insertAtActive = useSessionStore((state) => state.insertAtActive);

  const closeHelper = useHelperStore((state) => state.closeHelper);

  const [isClosing, setIsClosing] = useState(false);
  const [currentStep, setCurrentStep] = useState('initial');
  const [stepHistory, setStepHistory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isContentVisible, setIsContentVisible] = useState(true);
  // Lifted from EmergencyContactView so the modal can react to edit-mode for
  // its height transition. Reset on back/exit so re-entering the view always
  // shows the default (non-edit) state.
  const [isEditingContact, setIsEditingContact] = useState(false);
  // Lifted from EmergencyContactView so the modal expands when the user
  // taps "I need more help" inside the contact view, mirroring how it
  // expands when they tap Edit.
  const [isContactEmergencyExpanded, setIsContactEmergencyExpanded] = useState(false);
  // Has the user committed to a rating value inside the current triage flow?
  // Drives the modal height: stays at default until this flips true, then
  // expands and stays expanded until the user backs out past the rating
  // (or navigates away from 'triage').
  const [hasRatedInTriage, setHasRatedInTriage] = useState(false);

  // Imperative ref to the active TriageStepRunner so the top bar's back
  // button can pop a triage step without prop-drilling state.
  const triageRunnerRef = useRef(null);

  // Build session context once on mount. The modal is unmounted/remounted on
  // every open, so this captures a snapshot of the relevant store fields at
  // the moment the user opens the helper.
  const sessionContext = useMemo(() => {
    const state = useSessionStore.getState();
    const ingestionTime = state.substanceChecklist?.ingestionTime;
    const ingestionMs =
      ingestionTime instanceof Date ? ingestionTime.getTime() : ingestionTime || null;
    const minutesSinceIngestion = ingestionMs
      ? Math.floor((Date.now() - ingestionMs) / 60000)
      : null;
    return {
      minutesSinceIngestion,
      timelinePhase: state.timeline?.currentPhase || null,
      phaseWindow: classifyPhaseWindow(minutesSinceIngestion),
      hasEmergencyContact: Boolean(state.sessionProfile?.emergencyContactDetails?.phone),
    };
  }, []);

  // Close handler — mirrors ModuleLibraryDrawer's handleClose pattern.
  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(closeHelper, CLOSE_ANIMATION_MS);
  }, [closeHelper, isClosing]);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // Fade transition helper for major view changes (back/forward between pages
  // inside the modal). Used for initial ↔ triage ↔ emergency-contact transitions.
  // Triage internal step transitions are handled by the runner itself.
  const fadeTransition = useCallback((callback) => {
    setIsContentVisible(false);
    setTimeout(() => {
      callback();
      setIsContentVisible(true);
    }, 200);
  }, []);

  // Push a new major view onto the stack with a fade transition.
  const pushStep = useCallback((nextStep) => {
    fadeTransition(() => {
      setStepHistory((prev) => [...prev, currentStep]);
      setCurrentStep(nextStep);
    });
  }, [currentStep, fadeTransition]);

  // Back handler. Inside the triage flow, first try to pop a triage step
  // via the runner's imperative goBack. Only if that returns false (no more
  // steps to pop) do we fall through to the major-view back logic.
  const handleBack = useCallback(() => {
    // Inside triage: delegate to the runner first.
    if (currentStep === 'triage' && triageRunnerRef.current) {
      const handled = triageRunnerRef.current.goBack();
      if (handled) return;
    }

    // Major view back navigation.
    if (stepHistory.length === 0) return;
    fadeTransition(() => {
      const prev = stepHistory[stepHistory.length - 1];
      setStepHistory((h) => h.slice(0, -1));
      setCurrentStep(prev);
      // Clear triage and contact flags when leaving those views so the next
      // entry starts fresh and the modal shrinks back to default height.
      if (currentStep === 'triage') {
        setSelectedCategory(null);
        setHasRatedInTriage(false);
      }
      if (currentStep === 'emergency-contact') {
        setIsEditingContact(false);
        setIsContactEmergencyExpanded(false);
      }
    });
  }, [currentStep, stepHistory, fadeTransition]);

  // Category selection handler. Always navigates to the triage view (the
  // runner handles whether the category has a step tree or is a placeholder).
  // No journal entry is created here — entries are created on action only.
  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category);
    setHasRatedInTriage(false);
    pushStep('triage');
  }, [pushStep]);

  // Activity selection handler.
  // Creates a journal entry capturing the full triage path, inserts the module
  // at the active position, and closes the modal.
  // The runner passes us its triageState and the currently-resolved result so
  // we can build the entry from the full context at action time.
  const handleActivitySelect = useCallback((activity, triageState) => {
    if (selectedCategory) {
      const libraryModule = getModuleById(activity.id);
      const activityTitle = libraryModule?.title || activity.id;
      useJournalStore.getState().addEntry({
        content: formatHelperModalLog({
          categoryLabel: selectedCategory.label,
          stepResponses: buildStepResponses(selectedCategory, triageState),
          phaseWindow: sessionContext.phaseWindow,
          minutesSinceIngestion: sessionContext.minutesSinceIngestion,
          activityChosen: activityTitle,
          emergencyActionTaken: null,
        }),
        source: 'session',
        sessionId,
        moduleTitle: 'Helper Modal',
      });
    }

    insertAtActive(activity.id);
    handleClose();
  }, [selectedCategory, sessionContext, sessionId, insertAtActive, handleClose]);

  // Emergency action handler.
  // Called when the user taps any button representing a real emergency action:
  //   - Call/Text on the saved contact (from EmergencyFlow inside triage,
  //     OR from the dedicated EmergencyContactView reachable from the initial step)
  //   - 911/112 (from EmergencyFlow only)
  //   - Fireside Project Call/Text (from EmergencyFlow only)
  // When called from the dedicated contact view (no triageState), the category
  // and step responses are omitted from the entry by formatHelperModalLog.
  const handleEmergencyAction = useCallback((actionLabel, triageState) => {
    useJournalStore.getState().addEntry({
      content: formatHelperModalLog({
        categoryLabel: selectedCategory?.label ?? null,
        stepResponses: triageState
          ? buildStepResponses(selectedCategory, triageState)
          : null,
        phaseWindow: sessionContext.phaseWindow,
        minutesSinceIngestion: sessionContext.minutesSinceIngestion,
        activityChosen: null,
        emergencyActionTaken: actionLabel,
      }),
      source: 'session',
      sessionId,
      moduleTitle: 'Helper Modal',
    });
  }, [selectedCategory, sessionContext, sessionId]);

  // Emergency contact card on the initial step — pushes to the dedicated view/edit page.
  const handleEmergencyContactSelect = useCallback(() => {
    pushStep('emergency-contact');
  }, [pushStep]);

  // Determine which categories to show based on session phase. Categories
  // declare a `phases` array — a category can be eligible for `'active'`,
  // `'follow-up'`, or both. The 4 core categories (Intense Feeling, Trauma,
  // Resistance, Grief) are eligible for both, so they appear in the
  // follow-up grid alongside the two follow-up-only stubs.
  const phaseKey = sessionPhase === 'completed' ? 'follow-up' : 'active';
  const activeCategories = helperCategories.filter((c) => c.phases?.includes(phaseKey));

  // Modal height — single rule:
  //   - Default (DEFAULT_MODAL_HEIGHT_PX): everywhere EXCEPT after the rating
  //     step has been committed inside the triage flow, OR while editing the
  //     emergency contact, OR while the contact view's "I need more help"
  //     emergency block is expanded.
  //   - Expanded (95vh): triggered by any of the above three states.
  const isExpanded =
    (currentStep === 'triage' && hasRatedInTriage) ||
    (currentStep === 'emergency-contact' &&
      (isEditingContact || isContactEmergencyExpanded));
  const modalHeightCss = isExpanded
    ? `min(95vh, calc(100vh - var(--tabbar-height) - 12px))`
    : `min(${DEFAULT_MODAL_HEIGHT_PX}px, calc(100vh - var(--tabbar-height) - 12px))`;

  // Render content based on current major view.
  const renderContent = () => {
    // The pre-active phases ('not-started', 'intake', 'pre-session',
    // 'substance-checklist') all show the dimmed preview + explanatory
    // overlay so the user gets a feel for what tools will be available
    // once the session begins. The user CAN still navigate from this view
    // into the emergency contact page to set up their contact details
    // ahead of time — that case falls through to the switch statement
    // below since `currentStep` would have changed to 'emergency-contact'.
    const isPreActivePhase =
      sessionPhase === 'not-started'
      || sessionPhase === 'intake'
      || sessionPhase === 'pre-session'
      || sessionPhase === 'substance-checklist';
    if (isPreActivePhase && currentStep === 'initial') {
      return (
        <PreSessionContent
          emergencyContact={emergencyContactDetails}
          onSelectEmergencyContact={handleEmergencyContactSelect}
        />
      );
    }

    switch (currentStep) {
      case 'initial':
        return (
          <CategoryGrid
            categories={activeCategories}
            onSelect={handleCategorySelect}
            emergencyContact={emergencyContactDetails}
            onSelectEmergencyContact={handleEmergencyContactSelect}
          />
        );

      case 'triage':
        // Categories without a `steps` array (the follow-up stubs) render
        // a Placeholder rather than the runner.
        if (!selectedCategory?.steps) {
          return <PlaceholderCategory category={selectedCategory} />;
        }
        return (
          <TriageStepRunner
            ref={triageRunnerRef}
            category={selectedCategory}
            sessionContext={sessionContext}
            onActivitySelect={handleActivitySelect}
            onEmergencyAction={handleEmergencyAction}
            onRatingCommittedChange={setHasRatedInTriage}
          />
        );

      case 'emergency-contact':
        return (
          <EmergencyContactView
            isEditing={isEditingContact}
            onEditToggle={setIsEditingContact}
            onContactAction={handleEmergencyAction}
            onEmergencyExpandedChange={setIsContactEmergencyExpanded}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Support menu"
    >
      {/* Backdrop — sibling of the panel so its opacity transition doesn't affect the panel */}
      <div
        className={`absolute inset-0 bg-black/25 ${isClosing ? 'animate-fadeOut' : 'animate-fadeIn'}`}
        onClick={handleClose}
      />

      {/* Panel — slides down from above, fully opaque the entire time */}
      <div
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] bg-[var(--bg-primary)] rounded-b-2xl flex flex-col overflow-hidden ${isClosing ? 'animate-slideUpOut' : 'animate-slideDownIn'}`}
        style={{
          height: modalHeightCss,
          transition: 'height 350ms cubic-bezier(0.65, 0, 0.35, 1)',
        }}
      >
        {/* Top bar — back button, header, close button */}
        <div style={{ marginBottom: '-2px' }}>
          <HelperTopBar
            canGoBack={stepHistory.length > 0 || (currentStep === 'triage' && hasRatedInTriage)}
            onBack={handleBack}
            onClose={handleClose}
          />
        </div>

        {/* Content area — scroll is enabled only on views where it's actually
            needed (triage and emergency-contact). The initial category grid
            and pre-session content are sized to fit exactly, so scroll is
            disabled there to prevent the bouncy "jiggle room" feeling.
            pt-0 keeps the gap between the header subtitle and the content
            below it as tight as possible. */}
        <div
          className={`flex-1 px-5 pt-0 pb-6 ${
            currentStep === 'triage' || currentStep === 'emergency-contact'
              ? 'overflow-y-auto'
              : 'overflow-y-hidden'
          }`}
        >
          <div
            className="transition-opacity duration-200"
            style={{ opacity: isContentVisible ? 1 : 0 }}
          >
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

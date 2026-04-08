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
 */

import { useState, useCallback, useEffect } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { useHelperStore } from '../../stores/useHelperStore';
import { helperCategories, getRouteForRating } from '../../content/helper/categories';
import { formatHelperModalLog } from '../../content/helper/formatLog';
import HelperTopBar from './HelperTopBar';
import PreSessionContent from './PreSessionContent';
import CategoryGrid from './CategoryGrid';
import CategoryHeader from './CategoryHeader';
import RatingScale from './RatingScale';
import ActivitySuggestions from './ActivitySuggestions';
import EmergencyFlow from './EmergencyFlow';
import AcknowledgeClose from './AcknowledgeClose';
import EmergencyContactView from './EmergencyContactView';

const CLOSE_ANIMATION_MS = 350;

// Default modal height (initial category grid step). Fixed pixels — not vh —
// so the modal opens to the same size on every device. Tuned to fit the
// 6 category cards + emergency contact card + top bar exactly without scroll.
// Adjust this single number if the initial-step content ever changes.
const DEFAULT_MODAL_HEIGHT_PX = 570;

export default function HelperModal() {
  const sessionPhase = useSessionStore((state) => state.sessionPhase);
  const emergencyContactDetails = useSessionStore((state) => state.intake?.responses?.emergencyContactDetails);
  const sessionId = useSessionStore((state) => state.sessionId);
  const insertAtActive = useSessionStore((state) => state.insertAtActive);

  const closeHelper = useHelperStore((state) => state.closeHelper);

  const [isClosing, setIsClosing] = useState(false);
  const [currentStep, setCurrentStep] = useState('initial');
  const [stepHistory, setStepHistory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [isContentVisible, setIsContentVisible] = useState(true);
  const [journalEntryId, setJournalEntryId] = useState(null);
  // displayedRating drives the result content shown beneath the rating scale.
  // It cross-fades when selectedRating changes (for inline result transitions).
  const [displayedRating, setDisplayedRating] = useState(null);
  const [isResultVisible, setIsResultVisible] = useState(true);

  // Close handler — mirrors ModuleLibraryDrawer's handleClose pattern.
  // Triggers exit animation, waits for it to complete, then unmounts via the store.
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

  // Fade transition helper for step navigation (back/forward between pages inside the modal)
  const fadeTransition = useCallback((callback) => {
    setIsContentVisible(false);
    setTimeout(() => {
      callback();
      setIsContentVisible(true);
    }, 200);
  }, []);

  // Navigation helpers
  const pushStep = useCallback((nextStep) => {
    fadeTransition(() => {
      setStepHistory((prev) => [...prev, currentStep]);
      setCurrentStep(nextStep);
    });
  }, [currentStep, fadeTransition]);

  const handleBack = useCallback(() => {
    if (stepHistory.length === 0) return;
    fadeTransition(() => {
      const prev = stepHistory[stepHistory.length - 1];
      setStepHistory((h) => h.slice(0, -1));
      setCurrentStep(prev);
      // Clear rating if going back from rating step
      if (currentStep === 'category') {
        setSelectedCategory(null);
        setSelectedRating(null);
        setDisplayedRating(null);
      }
    });
  }, [stepHistory, currentStep, fadeTransition]);

  // Category selection handler
  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category);

    // Create journal entry on category selection
    const entry = useJournalStore.getState().addEntry({
      content: formatHelperModalLog({
        categoryLabel: category.label,
        rating: null,
        route: null,
        activityChosen: null,
        escalatedToEmergency: false,
      }),
      source: 'session',
      sessionId,
      moduleTitle: 'Helper Modal',
    });
    setJournalEntryId(entry.id);

    // If category skips scale, go directly to its skipScaleTo route
    if (!category.showScale && category.skipScaleTo) {
      pushStep(category.skipScaleTo);
    } else {
      pushStep('category');
    }
  }, [sessionId, pushStep]);

  // Rating selection handler
  // Stays on the category page and cross-fades the result content beneath the rating scale.
  const handleRatingSelect = useCallback((rating) => {
    setSelectedRating(rating);

    const route = getRouteForRating(selectedCategory, rating);

    // Update journal entry with rating and route
    if (journalEntryId) {
      const store = useJournalStore.getState();
      store.updateEntry(journalEntryId, formatHelperModalLog({
        categoryLabel: selectedCategory.label,
        rating,
        route,
        activityChosen: null,
        escalatedToEmergency: route === 'emergency',
      }));
    }

    // Cross-fade the inline result content. If something is already showing, fade it out first.
    if (displayedRating !== null && displayedRating !== rating) {
      setIsResultVisible(false);
      setTimeout(() => {
        setDisplayedRating(rating);
        setIsResultVisible(true);
      }, 200);
    } else {
      setDisplayedRating(rating);
      setIsResultVisible(true);
    }
  }, [selectedCategory, journalEntryId, displayedRating]);

  // Activity selection handler
  const handleActivitySelect = useCallback((activity) => {
    // Update journal entry with chosen activity
    if (journalEntryId) {
      const store = useJournalStore.getState();
      const route = selectedRating !== null ? getRouteForRating(selectedCategory, selectedRating) : selectedCategory.skipScaleTo;
      store.updateEntry(journalEntryId, formatHelperModalLog({
        categoryLabel: selectedCategory.label,
        rating: selectedRating,
        route,
        activityChosen: activity.label,
        escalatedToEmergency: false,
      }));
    }

    // Insert module at active position and close modal
    insertAtActive(activity.id);
    handleClose();
  }, [selectedCategory, selectedRating, journalEntryId, insertAtActive, handleClose]);

  // "I need more help" escalation — triggers the emergency rating inline
  // by selecting rating 10, which cross-fades the emergency content into the result slot.
  const handleNeedMoreHelp = useCallback(() => {
    handleRatingSelect(10);
  }, [handleRatingSelect]);

  // Emergency contact card on the initial step — pushes to the dedicated view/edit page.
  const handleEmergencyContactSelect = useCallback(() => {
    pushStep('emergency-contact');
  }, [pushStep]);

  // Determine which categories to show
  const phaseKey = sessionPhase === 'completed' ? 'follow-up' : 'active';
  const activeCategories = helperCategories.filter((c) => c.phase === phaseKey);

  // Modal height:
  //   - Default (initial category grid): fixed pixel height so the modal opens
  //     to the same size on every device, sized to fit the content exactly.
  //     Clamped on small viewports so it never overflows the screen.
  //   - Expanded (after picking a rating): vh-based so result content can
  //     breathe and the modal grows with the device.
  const isExpanded = currentStep === 'category' && selectedRating !== null;
  const modalHeightCss = isExpanded
    ? `min(95vh, calc(100vh - var(--tabbar-height) - 12px))`
    : `min(${DEFAULT_MODAL_HEIGHT_PX}px, calc(100vh - var(--tabbar-height) - 12px))`;

  // Determine what result content to show beneath the rating scale based on the current rating.
  const getResultRoute = (rating) => {
    if (rating === null || !selectedCategory) return null;
    return getRouteForRating(selectedCategory, rating);
  };

  const getActivitiesForRoute = (route) => {
    if (!selectedCategory) return [];
    if (route === 'max-activity') return selectedCategory.maxActivitySuggestions;
    if (route === 'gentle-activity') return selectedCategory.gentleActivitySuggestions;
    return [];
  };

  const getActivityIntroForRoute = (route) => {
    if (!selectedCategory) return '';
    if (route === 'max-activity') return selectedCategory.maxActivityIntro;
    if (route === 'gentle-activity') return selectedCategory.gentleActivityIntro;
    return '';
  };

  // Render the inline result block beneath the rating scale.
  const renderInlineResult = () => {
    const route = getResultRoute(displayedRating);
    if (!route) return null;

    if (route === 'acknowledge-close') {
      return (
        <AcknowledgeClose text={selectedCategory?.acknowledgeText} />
      );
    }

    if (route === 'max-activity' || route === 'gentle-activity') {
      return (
        <ActivitySuggestions
          introText={getActivityIntroForRoute(route)}
          activities={getActivitiesForRoute(route)}
          onSelectActivity={handleActivitySelect}
          onNeedMoreHelp={handleNeedMoreHelp}
        />
      );
    }

    if (route === 'emergency') {
      return (
        <EmergencyFlow emergencyContact={emergencyContactDetails} />
      );
    }

    return null;
  };

  // Render content based on current step
  const renderContent = () => {
    // Pre-session: informational only
    if (sessionPhase === 'pre-session') {
      return <PreSessionContent />;
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

      case 'emergency-contact':
        return <EmergencyContactView />;

      case 'category':
      case 'max-activity':
      case 'gentle-activity':
      case 'acknowledge-close':
        return (
          <div className="space-y-5">
            <div style={{ marginTop: '1px' }}>
              <CategoryHeader category={selectedCategory} />
            </div>
            {selectedCategory?.prompt && (
              <p
                className="text-lg leading-snug"
                style={{
                  fontFamily: "'DM Serif Text', serif",
                  textTransform: 'none',
                  color: 'var(--color-text-primary)',
                }}
              >
                {selectedCategory.prompt}
              </p>
            )}
            <RatingScale
              value={selectedRating}
              onChange={handleRatingSelect}
            />
            {/* Inline result content beneath the rating scale, cross-fading on rating change */}
            <div
              className="transition-opacity duration-200"
              style={{ opacity: isResultVisible ? 1 : 0 }}
            >
              {renderInlineResult()}
            </div>
          </div>
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
            canGoBack={stepHistory.length > 0}
            onBack={handleBack}
            onClose={handleClose}
          />
        </div>

        {/* Scrollable content area — inner fade for step navigation cross-fades */}
        <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6">
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

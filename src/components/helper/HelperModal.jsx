/**
 * HelperModal
 * Root component for the "What's Happening?" support overlay.
 * Always rendered when session phase is valid; positioned off-screen via translateY when closed.
 * Manages the full multi-step flow: categories → rating → activity/emergency/acknowledge.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { useJournalStore } from '../../stores/useJournalStore';
import { helperCategories, getRouteForRating } from '../../content/helper/categories';
import { formatHelperModalLog } from '../../content/helper/formatLog';
import HelperModalShape from './HelperModalShape';
import { TAB_DEPTH, CORNER_RADIUS } from './buildModalPath';
import HelperTopBar from './HelperTopBar';
import PreSessionContent from './PreSessionContent';
import CategoryGrid from './CategoryGrid';
import RatingScale from './RatingScale';
import ActivitySuggestions from './ActivitySuggestions';
import EmergencyFlow from './EmergencyFlow';
import AcknowledgeClose from './AcknowledgeClose';

const VALID_PHASES = ['pre-session', 'active', 'completed'];

export default function HelperModal() {
  const sessionPhase = useSessionStore((state) => state.sessionPhase);
  const emergencyContactDetails = useSessionStore((state) => state.intake?.responses?.emergencyContactDetails);
  const sessionId = useSessionStore((state) => state.sessionId);
  const insertAtActive = useSessionStore((state) => state.insertAtActive);

  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState('initial');
  const [stepHistory, setStepHistory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRating, setSelectedRating] = useState(null);
  const [isContentVisible, setIsContentVisible] = useState(true);
  const [journalEntryId, setJournalEntryId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [showTopBar, setShowTopBar] = useState(false);
  const [staggerCards, setStaggerCards] = useState(false);

  const modalRef = useRef(null);
  const contentRef = useRef(null);

  // Determine if the helper should be shown at all
  const isValidPhase = VALID_PHASES.includes(sessionPhase);

  // Compute closed translateY on mount and resize
  useEffect(() => {
    if (!modalRef.current || !isValidPhase) return;

    const computeClosedY = () => {
      const modal = modalRef.current;
      if (!modal) return;
      const modalHeight = modal.offsetHeight;
      const headerHeight = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--header-height')
      ) || 64;
      // Logo baseline is 8px above the header bottom edge.
      // The tab bottom should align with this baseline.
      // The shape div has marginTop: -CORNER_RADIUS, so offsetHeight already
      // accounts for the overlap. But the shape's visible tab extends TAB_DEPTH
      // below the main line. We want:
      //   modal top + modalHeight + closedY = logoBaseline
      //   closedY = logoBaseline - modalHeight
      // Then subtract CORNER_RADIUS to compensate for the negative margin overlap
      // that offsetHeight doesn't fully capture at the seam.
      const logoBaseline = headerHeight - 8;
      const closedY = logoBaseline - modalHeight - CORNER_RADIUS - 9;
      modal.style.setProperty('--helper-closed-y', `${closedY}px`);
    };

    computeClosedY();
    // Enable transitions only after the first position is computed,
    // so the modal doesn't visibly slide from its default position.
    requestAnimationFrame(() => setIsReady(true));

    const observer = new ResizeObserver(computeClosedY);
    observer.observe(modalRef.current);

    window.addEventListener('resize', computeClosedY);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', computeClosedY);
    };
  }, [isValidPhase]);

  // Fade transition helper
  const fadeTransition = useCallback((callback) => {
    setIsContentVisible(false);
    setTimeout(() => {
      callback();
      setIsContentVisible(true);
    }, 200);
  }, []);

  const resetState = useCallback(() => {
    setCurrentStep('initial');
    setStepHistory([]);
    setSelectedCategory(null);
    setSelectedRating(null);
    setIsContentVisible(true);
    setJournalEntryId(null);
    setShowTopBar(false);
    setStaggerCards(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setShowTopBar(false);
    setStaggerCards(false);
    // Reset remaining state after close animation completes
    setTimeout(resetState, 300);
  }, [resetState]);

  // Auto-close if phase becomes invalid while open
  useEffect(() => {
    if (isOpen && !isValidPhase) {
      handleClose();
    }
  }, [sessionPhase, isValidPhase, isOpen, handleClose]);

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
      }
    });
  }, [stepHistory, currentStep, fadeTransition]);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      handleClose();
    } else {
      setIsOpen(true);
      // Open sequence: slide down (300ms CSS transition), then top bar fades in, then cards stagger
      setTimeout(() => setShowTopBar(true), 300);
      setTimeout(() => setStaggerCards(true), 450);
    }
  }, [isOpen, handleClose]);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Category selection handler
  const handleCategorySelect = useCallback((category) => {
    setSelectedCategory(category);

    // Create journal entry on category selection
    const entry = useJournalStore.getState().addEntry({
      content: formatHelperModalLog({
        categoryId: category.id,
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
  const handleRatingSelect = useCallback((rating) => {
    setSelectedRating(rating);

    const route = getRouteForRating(selectedCategory, rating);

    // Update journal entry with rating and route
    if (journalEntryId) {
      const store = useJournalStore.getState();
      store.updateEntry(journalEntryId, formatHelperModalLog({
        categoryId: selectedCategory.id,
        categoryLabel: selectedCategory.label,
        rating,
        route,
        activityChosen: null,
        escalatedToEmergency: route === 'emergency',
      }));
    }

    // Route after 400ms delay (as specified)
    setTimeout(() => {
      pushStep(route);
    }, 400);
  }, [selectedCategory, journalEntryId, pushStep]);

  // Activity selection handler
  const handleActivitySelect = useCallback((activity) => {
    // Update journal entry with chosen activity
    if (journalEntryId) {
      const store = useJournalStore.getState();
      const route = selectedRating !== null ? getRouteForRating(selectedCategory, selectedRating) : selectedCategory.skipScaleTo;
      store.updateEntry(journalEntryId, formatHelperModalLog({
        categoryId: selectedCategory.id,
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

  // "I need more help" escalation
  const handleNeedMoreHelp = useCallback(() => {
    pushStep('emergency');
  }, [pushStep]);

  // Emergency grounding fallback
  const handleGroundingFallback = useCallback(() => {
    // Route to gentle-activity suggestions for current category
    pushStep('gentle-activity');
  }, [pushStep]);

  if (!isValidPhase) return null;

  // Determine which categories to show
  const phaseKey = sessionPhase === 'completed' ? 'follow-up' : 'active';
  const activeCategories = helperCategories.filter((c) => c.phase === phaseKey);

  // Determine current activity suggestions
  const getActivities = () => {
    if (!selectedCategory) return [];
    if (currentStep === 'max-activity') return selectedCategory.maxActivitySuggestions;
    if (currentStep === 'gentle-activity') return selectedCategory.gentleActivitySuggestions;
    return [];
  };

  const getActivityIntro = () => {
    if (!selectedCategory) return '';
    if (currentStep === 'max-activity') return selectedCategory.maxActivityIntro;
    if (currentStep === 'gentle-activity') return selectedCategory.gentleActivityIntro;
    return '';
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
            stagger={staggerCards}
          />
        );

      case 'category':
        return (
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
              {selectedCategory?.subheader}
            </p>
            {selectedCategory?.prompt && (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                {selectedCategory.prompt}
              </p>
            )}
            <RatingScale
              value={selectedRating}
              onChange={handleRatingSelect}
            />
          </div>
        );

      case 'acknowledge-close':
        return (
          <div className="space-y-5">
            <RatingScale value={selectedRating} onChange={() => {}} />
            <AcknowledgeClose
              text={selectedCategory?.acknowledgeText}
              onClose={handleClose}
            />
          </div>
        );

      case 'max-activity':
      case 'gentle-activity':
        return (
          <div className="space-y-5">
            {selectedRating !== null && (
              <RatingScale value={selectedRating} onChange={() => {}} />
            )}
            <ActivitySuggestions
              introText={getActivityIntro()}
              activities={getActivities()}
              onSelectActivity={handleActivitySelect}
              onNeedMoreHelp={handleNeedMoreHelp}
            />
          </div>
        );

      case 'emergency':
        return (
          <EmergencyFlow
            emergencyContact={emergencyContactDetails}
            onGroundingFallback={handleGroundingFallback}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Backdrop overlay — only when open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 animate-fadeIn"
          style={{ zIndex: 55 }}
          onClick={handleClose}
        />
      )}

      {/* Modal container — always rendered, positioned via translateY */}
      <div
        ref={modalRef}
        className={`helper-modal-container ${isReady ? 'ready' : ''} ${isOpen ? 'open' : 'closed'}`}
        style={{ zIndex: 60 }}
        role="dialog"
        aria-modal={isOpen}
        aria-label="Support menu"
      >
        {/* Modal body — fills from top to manila envelope line */}
        <div
          className="flex flex-col"
          style={{
            height: `calc(100vh - var(--tabbar-height) - 12px)`,
            backgroundColor: 'var(--bg-primary)',
          }}
        >
          {/* Top bar — fades in after slide completes */}
          <div
            className="transition-opacity duration-200"
            style={{ opacity: showTopBar ? 1 : 0 }}
          >
            <HelperTopBar
              canGoBack={stepHistory.length > 0}
              onBack={handleBack}
              onClose={handleClose}
            />
          </div>

          {/* Scrollable content area */}
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto px-5 pb-4"
          >
            <div
              className="transition-opacity duration-200"
              style={{ opacity: isContentVisible ? 1 : 0 }}
            >
              {renderContent()}
            </div>
          </div>
        </div>

        {/* Manila envelope bottom edge with tab */}
        <HelperModalShape
          onClick={handleToggle}
          isOpen={isOpen}
        />
      </div>
    </>
  );
}

/**
 * TimelineTutorial Component
 *
 * 11-step interactive tutorial overlay for the session timeline.
 * Uses box-shadow haze with blur for a diffuse "cloud parting" effect.
 * Interactive steps let users click real UI (module cards, library, filters)
 * with a "Next does it for you" fallback via programmatic .click().
 *
 * Rendered via createPortal onto document.body (escapes the scrollable <main>).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../../stores/useAppStore';

// ─── Step Definitions ───────────────────────────────────────────────────────

const TUTORIAL_STEPS = [
  {
    id: 'overview',
    target: null,
    position: 'bottom-third',
    noHaze: true,
    title: 'Your Session Timeline',
    description:
      'This is your personalized session plan. It maps out the full arc of your experience with guided activities across three distinct phases. You can customize everything before you begin.',
  },
  {
    id: 'pre-session',
    target: '[data-tutorial="pre-session"]',
    position: 'below',
    title: 'Pre-Session',
    description:
      'These are optional preparation activities you can complete before your session begins. Breathwork, journaling, intention-setting — anything that helps you arrive feeling grounded.',
  },
  {
    id: 'phase-come-up',
    target: '[data-tutorial="phase-come-up"]',
    position: 'below',
    title: 'Phase 1 — Come-Up',
    description:
      'Your session is divided into three phases. Each one matches a different stage of the experience. Phase 1 covers the onset — gentle, grounding activities while the effects begin.',
  },
  {
    id: 'phase-peak',
    target: '[data-tutorial="phase-peak"]',
    position: 'below',
    spotlightAdjust: { top: -6 },
    title: 'Phase 2 — Peak',
    description:
      'The heart of the experience. This is where the deeper explorations happen — activities aligned with whatever you came here to work on.',
  },
  {
    id: 'phase-integration',
    target: '[data-tutorial="phase-integration"]',
    position: 'above',
    spotlightAdjust: { top: -6 },
    title: 'Phase 3 — Integration',
    description:
      'The reflective close. As the intensity eases, these activities help you capture what surfaced and bring the session to a gentle end.',
  },
  {
    id: 'module-card',
    target: '[data-tutorial="module-card-first"]',
    position: 'below',
    title: 'Activity Cards',
    description:
      'Each card is a guided activity scheduled into your timeline. Tap one to see what it involves and adjust its duration. Try tapping this one now.',
    interactive: true,
    nextClick: '[data-tutorial="module-card-first"]',
    advanceOnAppear: '[data-tutorial="module-detail-modal"]',
  },
  {
    id: 'module-detail',
    target: null,
    position: 'screen-bottom',
    title: 'Activity Detail',
    description:
      'Here you can read about what the activity involves, how it works, and adjust its duration. Close this whenever you\'re ready to continue.',
    interactive: true,
    tooltipZ: 110,
    waitFor: '[data-tutorial="module-detail-modal"]',
    nextClick: '[data-tutorial="module-detail-close"]',
    advanceOnDisappear: '[data-tutorial="module-detail-modal"]',
    cleanupClick: '[data-tutorial="module-detail-close"]',
  },
  {
    id: 'add-activity',
    target: '[data-tutorial="add-activity-first"]',
    position: 'above',
    title: 'Add Activities',
    description:
      'You can add new activities to any phase from the library. Try opening it now.',
    interactive: true,
    nextClick: '[data-tutorial="add-activity-first"]',
    advanceOnAppear: '[data-tutorial="library-drawer"]',
  },
  {
    id: 'library',
    target: null,
    position: 'screen-top',
    noHaze: true,
    title: 'Activity Library',
    description:
      'Browse all available activities. Tap Recommended to see what fits this phase.',
    interactive: true,
    tooltipZ: 110,
    waitFor: '[data-tutorial="library-drawer"]',
    nextClick: '[data-tutorial="filter-recommended"]',
    advanceOnClick: '[data-tutorial="filter-recommended"]',
    cleanupClick: '[data-tutorial="library-close"]',
  },
  {
    id: 'library-recommended',
    target: null,
    position: 'screen-top',
    noHaze: true,
    title: 'Recommended',
    description:
      'Activities curated for this phase. Add any that feel right, or close when you\'re done.',
    interactive: true,
    tooltipZ: 110,
    waitFor: '[data-tutorial="library-drawer"]',
    nextClick: '[data-tutorial="library-close"]',
    advanceOnDisappear: '[data-tutorial="library-drawer"]',
    cleanupClick: '[data-tutorial="library-close"]',
  },
  {
    id: 'begin-session',
    target: '[data-tutorial="begin-session"]',
    position: 'screen-top',
    title: 'Begin When Ready',
    description:
      'We recommend scheduling enough activities to fill about 3 to 5 hours, though you can add as much or as little as feels right. When you\'re ready, press Begin Session — you\'ll be guided through everything step by step.',
  },
];

// ─── Constants ──────────────────────────────────────────────────────────────

const SPOTLIGHT_PADDING = 12;
const TOOLTIP_GAP = 28;
const BLUR_RADIUS = 14;
const TRANSITION_MS = 400;
const SCROLL_SETTLE_MS = 400;
const FADE_OUT_MS = 500;
const TOP_SAFE_ZONE = 60;
const BOTTOM_SAFE_ZONE = 100;
const MIN_TOOLTIP_SPACE = 120;
const CLEANUP_DELAY_MS = 350;

// ─── Component ──────────────────────────────────────────────────────────────

export default function TimelineTutorial({ isActive, onDismiss }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState('entering'); // 'entering' | 'visible' | 'exiting'
  const [spotlightRect, setSpotlightRect] = useState(null);
  const [textKey, setTextKey] = useState(0);
  const [stepReady, setStepReady] = useState(true);

  const reduceMotion = useAppStore((state) => state.preferences?.reduceMotion);
  const currentTab = useAppStore((state) => state.currentTab);
  const darkMode = useAppStore((state) => state.darkMode);

  const scrollContainerRef = useRef(null);
  const dismissedRef = useRef(false);
  const clickCleanupRef = useRef(null);
  const advancingRef = useRef(false);

  const fadeDuration = reduceMotion ? '0ms' : `${FADE_OUT_MS}ms`;

  // Haze color: app background at ~78% opacity
  const hazeColor = darkMode ? 'rgba(26, 26, 26, 0.78)' : 'rgba(245, 245, 240, 0.78)';

  // Safe advancement: prevents multiple observer/listener callbacks from
  // incrementing currentStep past array bounds within a single React batch.
  const safeAdvance = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setCurrentStep((s) => {
      const next = s + 1;
      return next < TUTORIAL_STEPS.length ? next : s;
    });
  }, []);

  // Reset guard when step changes
  useEffect(() => {
    advancingRef.current = false;
  }, [currentStep]);

  // ─── Refs & Setup ───────────────────────────────────────────────────────

  useEffect(() => {
    scrollContainerRef.current = document.querySelector('main');
  }, []);

  // ─── Measurement ────────────────────────────────────────────────────────

  const measureTarget = useCallback((selector, adjust) => {
    if (!selector) return null;
    const el = document.querySelector(selector);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      top: rect.top - SPOTLIGHT_PADDING + (adjust?.top || 0),
      left: rect.left - SPOTLIGHT_PADDING + (adjust?.left || 0),
      width: rect.width + SPOTLIGHT_PADDING * 2 + (adjust?.width || 0),
      height: rect.height + SPOTLIGHT_PADDING * 2 + (adjust?.height || 0),
    };
  }, []);

  // ─── Fade-In ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isActive) return;
    let raf1, raf2;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setPhase('visible');
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [isActive]);

  // ─── Dismiss ────────────────────────────────────────────────────────────

  const handleDismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setPhase('exiting');
    setTimeout(() => {
      onDismiss();
    }, reduceMotion ? 0 : FADE_OUT_MS);
  }, [onDismiss, reduceMotion]);

  // Dismiss on tab switch
  useEffect(() => {
    if (currentTab !== 'home') handleDismiss();
  }, [currentTab, handleDismiss]);

  // Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleDismiss(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleDismiss]);

  // ─── Scroll Lock ────────────────────────────────────────────────────────

  useEffect(() => {
    const main = scrollContainerRef.current;
    if (!main) return;
    const prev = main.style.overflow;
    main.style.overflow = 'hidden';
    return () => { main.style.overflow = prev; };
  }, []);

  // ─── Scroll-into-View & Measure ─────────────────────────────────────────

  useEffect(() => {
    const step = TUTORIAL_STEPS[currentStep];
    setTextKey((k) => k + 1);

    if (!step.target) {
      setSpotlightRect(null);
      return;
    }

    const el = document.querySelector(step.target);
    if (!el) {
      setSpotlightRect(null);
      return;
    }

    const main = scrollContainerRef.current;
    if (main) main.style.overflow = 'auto';

    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });

    const timer = setTimeout(() => {
      if (main) main.style.overflow = 'hidden';
      setSpotlightRect(measureTarget(step.target, step.spotlightAdjust));
    }, reduceMotion ? 50 : SCROLL_SETTLE_MS);

    return () => clearTimeout(timer);
  }, [currentStep, measureTarget, reduceMotion]);

  // ─── Re-measure on Resize ──────────────────────────────────────────────

  useEffect(() => {
    const handleResize = () => {
      const step = TUTORIAL_STEPS[currentStep];
      if (step.target) setSpotlightRect(measureTarget(step.target, step.spotlightAdjust));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentStep, measureTarget]);

  // ─── Interactive: waitFor Polling ──────────────────────────────────────

  useEffect(() => {
    const step = TUTORIAL_STEPS[currentStep];
    if (!step.waitFor) {
      setStepReady(true);
      return;
    }
    setStepReady(false);

    let rafId;
    const check = () => {
      if (document.querySelector(step.waitFor)) {
        setStepReady(true);
        return;
      }
      rafId = requestAnimationFrame(check);
    };
    rafId = requestAnimationFrame(check);
    return () => cancelAnimationFrame(rafId);
  }, [currentStep]);

  // ─── Interactive: advanceOnAppear / advanceOnDisappear ─────────────────

  useEffect(() => {
    const step = TUTORIAL_STEPS[currentStep];
    if (!step.advanceOnAppear && !step.advanceOnDisappear) return;

    const observer = new MutationObserver(() => {
      if (step.advanceOnAppear && document.querySelector(step.advanceOnAppear)) {
        safeAdvance();
        return;
      }
      if (step.advanceOnDisappear && !document.querySelector(step.advanceOnDisappear)) {
        safeAdvance();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [currentStep]);

  // ─── Interactive: advanceOnClick ──────────────────────────────────────

  useEffect(() => {
    const step = TUTORIAL_STEPS[currentStep];
    if (!step.advanceOnClick) return;

    // Small delay for DOM to settle after step transition
    const timerId = setTimeout(() => {
      const el = document.querySelector(step.advanceOnClick);
      if (!el) return;
      const handler = () => safeAdvance();
      el.addEventListener('click', handler, { once: true });
      clickCleanupRef.current = () => el.removeEventListener('click', handler);
    }, 100);

    return () => {
      clearTimeout(timerId);
      if (clickCleanupRef.current) {
        clickCleanupRef.current();
        clickCleanupRef.current = null;
      }
    };
  }, [currentStep]);

  // ─── Navigation Handlers ──────────────────────────────────────────────

  const handleNext = useCallback(() => {
    const step = TUTORIAL_STEPS[currentStep];

    if (step.nextClick) {
      const el = document.querySelector(step.nextClick);
      if (el) {
        el.click();
        // If there's an observer-based advancement, let it handle the step change
        if (step.advanceOnAppear || step.advanceOnDisappear || step.advanceOnClick) {
          return;
        }
      }
    }

    // Default: just advance
    safeAdvance();
  }, [currentStep, safeAdvance]);

  const handleBack = useCallback(() => {
    const step = TUTORIAL_STEPS[currentStep];

    // If this step has a cleanup action (close modal/drawer), do it first
    if (step.cleanupClick) {
      const closeEl = document.querySelector(step.cleanupClick);
      if (closeEl) {
        closeEl.click();
        setTimeout(() => {
          setCurrentStep((s) => s - 1);
        }, CLEANUP_DELAY_MS);
        return;
      }
    }

    setCurrentStep((s) => s - 1);
  }, [currentStep]);

  // ─── Early Return ─────────────────────────────────────────────────────

  if (!isActive) return null;

  // ─── Derived State ────────────────────────────────────────────────────

  const clampedStep = Math.min(currentStep, TUTORIAL_STEPS.length - 1);
  const step = TUTORIAL_STEPS[clampedStep];
  const isFirst = clampedStep === 0;
  const isLast = clampedStep === TUTORIAL_STEPS.length - 1;
  const isCenter = !step.target || step.position === 'center';
  const overlayOpacity = phase === 'visible' ? 1 : 0;
  const isInteractive = !!step.interactive;

  // ─── Tooltip Positioning ──────────────────────────────────────────────

  const getTooltipStyle = () => {
    const zIndex = step.tooltipZ || 57;

    if (step.position === 'bottom-third') {
      return { position: 'fixed', top: '60%', left: '50%', transform: 'translateX(-50%)', zIndex };
    }

    if (step.position === 'screen-top') {
      return {
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex,
      };
    }

    if (step.position === 'screen-bottom') {
      return {
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex,
      };
    }

    if (isCenter || !spotlightRect) {
      return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex };
    }

    // above / below with auto-flip
    const vh = window.innerHeight;
    const base = { position: 'fixed', left: '50%', transform: 'translateX(-50%)', zIndex, overflowY: 'auto' };

    const topBelow = spotlightRect.top + spotlightRect.height + TOOLTIP_GAP;
    const spaceBelow = vh - topBelow - BOTTOM_SAFE_ZONE;
    const spaceAbove = spotlightRect.top - TOOLTIP_GAP - TOP_SAFE_ZONE;

    const wantsBelow = step.position === 'below';
    const useBelow = wantsBelow ? spaceBelow >= MIN_TOOLTIP_SPACE : spaceAbove < MIN_TOOLTIP_SPACE;

    if (useBelow) {
      return { ...base, top: topBelow, maxHeight: Math.max(vh - topBelow - BOTTOM_SAFE_ZONE, MIN_TOOLTIP_SPACE) };
    }
    const bottomVal = vh - spotlightRect.top + TOOLTIP_GAP;
    return { ...base, bottom: bottomVal, maxHeight: Math.max(spaceAbove, MIN_TOOLTIP_SPACE) };
  };

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 55,
        opacity: overlayOpacity,
        transition: `opacity ${fadeDuration} var(--ease-default)`,
        pointerEvents: phase === 'exiting' ? 'none' : isInteractive ? 'none' : 'auto',
      }}
    >
      {/* Click absorber — only for non-interactive steps */}
      {!isInteractive && (
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 55 }}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Haze overlay with diffuse spotlight — hidden for noHaze steps */}
      {!step.noHaze && (
        <div
          style={{
            position: 'fixed',
            top: isCenter || !spotlightRect ? window.innerHeight / 2 : spotlightRect.top,
            left: isCenter || !spotlightRect ? window.innerWidth / 2 : spotlightRect.left,
            width: isCenter || !spotlightRect ? 0 : spotlightRect.width,
            height: isCenter || !spotlightRect ? 0 : spotlightRect.height,
            borderRadius: '24px',
            boxShadow: `0 0 0 9999px ${hazeColor}`,
            filter: reduceMotion ? 'none' : `blur(${BLUR_RADIUS}px)`,
            transition: reduceMotion ? 'none' : `top ${TRANSITION_MS}ms var(--ease-default), left ${TRANSITION_MS}ms var(--ease-default), width ${TRANSITION_MS}ms var(--ease-default), height ${TRANSITION_MS}ms var(--ease-default)`,
            zIndex: 55,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tooltip card — self-contained navigation unit */}
      {stepReady && (
        <div
          style={{ ...getTooltipStyle(), pointerEvents: 'auto' }}
          className="w-[calc(100%-3rem)] max-w-sm"
        >
          {/* Skip button — floats above card */}
          <div className="flex justify-end mb-1 pr-1">
            <button
              onClick={handleDismiss}
              className="uppercase tracking-wider text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              style={{ fontFamily: 'Azeret Mono, monospace' }}
            >
              Skip
            </button>
          </div>

          <div
            key={textKey}
            className={reduceMotion ? '' : 'animate-tutorial-text-in'}
            style={{ opacity: reduceMotion ? 1 : 0 }}
          >
            <div
              className="bg-[var(--color-bg)] rounded-2xl px-5 pt-4 pb-3"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06), 0 0 24px 12px var(--color-bg)' }}
            >
              {/* Title row with step counter */}
              <div className="flex items-baseline justify-between mb-1">
                <h3
                  className="text-lg text-[var(--accent)]"
                  style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider flex-shrink-0 ml-3"
                  style={{ fontFamily: 'Azeret Mono, monospace' }}
                >
                  {clampedStep + 1} of {TUTORIAL_STEPS.length}
                </p>
              </div>

              {/* Description — accent color */}
              <p
                className="text-[var(--accent)] text-sm leading-relaxed"
                style={{ textTransform: 'none' }}
              >
                {step.description}
              </p>

              {/* Navigation: Back / dots / Next — inside card */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--color-border)]">
                <button
                  onClick={handleBack}
                  disabled={isFirst}
                  className={`px-2 py-1 uppercase tracking-wider text-[10px] transition-opacity ${
                    isFirst ? 'opacity-0 pointer-events-none' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]'
                  }`}
                  style={{ fontFamily: 'Azeret Mono, monospace' }}
                >
                  Back
                </button>

                <div className="flex gap-1">
                  {TUTORIAL_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                        i === clampedStep ? 'bg-[var(--accent)]' : 'bg-[var(--color-text-tertiary)] opacity-30'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={isLast ? handleDismiss : handleNext}
                  className="px-2 py-1 uppercase tracking-wider text-[10px] text-[var(--color-text-primary)] hover:text-[var(--color-text-secondary)] transition-opacity"
                  style={{ fontFamily: 'Azeret Mono, monospace' }}
                >
                  {isLast ? 'Done' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

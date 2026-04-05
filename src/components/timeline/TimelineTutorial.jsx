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

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { useSessionStore } from '../../stores/useSessionStore';

// ─── Step Definitions ───────────────────────────────────────────────────────

const TUTORIAL_STEPS = [
  {
    id: 'overview',
    target: null,
    position: 'bottom-third',
    noHaze: true,
    title: 'Your Session Timeline',
    description:
      'This is your session plan, organized into three phases that follow the natural arc of the experience. Everything here can be customized before you begin.',
  },
  {
    id: 'pre-session',
    target: '[data-tutorial="pre-session"]',
    position: 'below',
    title: 'Pre-Session',
    description:
      'These are optional activities you can do before the session starts. Things like breathwork, journaling, or intention-setting to help you settle in.',
  },
  {
    id: 'phase-come-up',
    target: '[data-tutorial="phase-come-up"]',
    position: 'below',
    title: 'Phase 1 — Come-Up',
    description:
      'The session is split into three phases, each matching a different stage of the experience. This first phase covers the onset with gentle, grounding activities.',
  },
  {
    id: 'phase-peak',
    target: '[data-tutorial="phase-peak"]',
    position: 'below',
    spotlightAdjust: { top: -6 },
    title: 'Phase 2 — Peak',
    description:
      'This is where the deeper work happens, with activities aligned to whatever you came here to explore.',
  },
  {
    id: 'phase-integration',
    target: '[data-tutorial="phase-integration"]',
    position: 'above',
    spotlightAdjust: { top: -6 },
    title: 'Phase 3 — Synthesis',
    description:
      'As things wind down, these activities help you process what came up and bring the session to a close.',
  },
  {
    id: 'module-card',
    target: '[data-tutorial="module-card-spotlight"]',
    position: 'below',
    title: 'Activity Cards',
    description:
      'Each card is a guided activity in your timeline. Tap one to see what it involves and adjust its duration. Try tapping this one.',
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
      'From here you can read about the activity, see how it works, and adjust its duration. Close this when you\'re ready to move on.',
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
      'You can add new activities to any phase from the library. Try opening it.',
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
      'When you open the library, you first see activities recommended for this phase. Tap All to browse everything available.',
    interactive: true,
    tooltipZ: 110,
    waitFor: '[data-tutorial="library-drawer"]',
    nextClick: '[data-tutorial="filter-all"]',
    fallbackClick: '[data-tutorial="add-activity-first"]',
    advanceOnClick: '[data-tutorial="filter-all"]',
    cleanupClick: '[data-tutorial="library-close"]',
  },
  {
    id: 'library-all',
    target: null,
    position: 'screen-top',
    noHaze: true,
    title: 'All Activities',
    description:
      'Here you can see all available activities. Add any that interest you, or close the library when you\'re done.',
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
      'A typical session runs 4 to 6 hours, but add as much or as little as feels right. When you\'re ready, press Begin Session and you\'ll be guided through everything.',
  },
];

// ─── Constants ──────────────────────────────────────────────────────────────

const SPOTLIGHT_PADDING = 12;
const TOOLTIP_GAP = 28;
const BLUR_RADIUS = 14;
const TRANSITION_MS = 400;
const SCROLL_START_DELAY_MS = 300; // let scrollIntoView begin before polling
const SCROLL_STABLE_FRAMES = 3;    // consecutive stable rAF frames before measuring
const SCROLL_MAX_WAIT_MS = 2000;   // safety cap
const FADE_OUT_MS = 500;
const TOP_SAFE_ZONE = 60;
const BOTTOM_SAFE_ZONE = 100;
const MIN_TOOLTIP_SPACE = 120;
const CLEANUP_DELAY_MS = 350;
const TEXT_FADE_OUT_MS = 200;

// ─── Component ──────────────────────────────────────────────────────────────

export default function TimelineTutorial({ isActive, onDismiss }) {
  const sessionPhase = useSessionStore((state) => state.sessionPhase);

  const steps = useMemo(() =>
    sessionPhase === 'pre-session'
      ? TUTORIAL_STEPS
      : TUTORIAL_STEPS.filter(s => s.id !== 'pre-session'),
    [sessionPhase]
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState('entering'); // 'entering' | 'visible' | 'exiting'
  const [spotlightRect, setSpotlightRect] = useState(null);
  const [textFading, setTextFading] = useState(false);
  const [displayedDesc, setDisplayedDesc] = useState(TUTORIAL_STEPS[0].description);
  const [positionSettled, setPositionSettled] = useState(true);
  const [stepReady, setStepReady] = useState(true);

  const reduceMotion = useAppStore((state) => state.preferences?.reduceMotion);
  const currentTab = useAppStore((state) => state.currentTab);
  const darkMode = useAppStore((state) => state.darkMode);

  const scrollContainerRef = useRef(null);
  const dismissedRef = useRef(false);
  const advancingRef = useRef(false);

  const fadeDuration = reduceMotion ? '0ms' : `${FADE_OUT_MS}ms`;

  // Haze color: app background at ~78% opacity
  const hazeColor = darkMode ? 'rgba(26, 26, 26, 0.78)' : 'rgba(245, 245, 240, 0.78)';

  // Safe advancement: prevents multiple observer/listener callbacks from
  // incrementing currentStep past array bounds within a single React batch.
  const safeAdvance = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setTextFading(true);
    setPositionSettled(false);
    setCurrentStep((s) => {
      const next = s + 1;
      return next < steps.length ? next : s;
    });
  }, [steps.length]);

  // Reset guard when step changes
  useEffect(() => {
    advancingRef.current = false;
  }, [currentStep]);

  // ─── Text Fade Out / In ────────────────────────────────────────────────
  // textFading is set to true synchronously by safeAdvance/handleBack
  // (same event handler as setCurrentStep, so React batches them — no flash).
  // This effect waits for fade-out + position settled + stepReady, then fades in.

  useEffect(() => {
    if (!textFading) return;
    if (!positionSettled) return; // wait for tooltip to reach final position
    if (!stepReady) return;       // wait for interactive element to appear

    const newDesc = steps[Math.min(currentStep, steps.length - 1)].description;

    if (reduceMotion) {
      setDisplayedDesc(newDesc);
      setTextFading(false);
      return;
    }

    // Wait for CSS fade-out to finish, swap text, then let card resize
    // before starting the fade-in (one rAF separates resize from opacity)
    const timer = setTimeout(() => {
      setDisplayedDesc(newDesc);
      requestAnimationFrame(() => setTextFading(false));
    }, TEXT_FADE_OUT_MS);
    return () => clearTimeout(timer);
  }, [textFading, currentStep, positionSettled, stepReady, reduceMotion]);

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

  // ─── Scroll to Top & Lock ──────────────────────────────────────────────

  useEffect(() => {
    const main = scrollContainerRef.current;
    if (!main) return;
    // Always start tutorial from top of timeline
    main.scrollTop = 0;
    const prev = main.style.overflow;
    main.style.overflow = 'hidden';
    return () => { main.style.overflow = prev; };
  }, []);

  // ─── Scroll-into-View & Measure ─────────────────────────────────────────
  // Instead of a fixed timeout, poll the element's position via rAF until it
  // stabilises for SCROLL_STABLE_FRAMES consecutive frames. This guarantees
  // we only measure *after* smooth-scroll finishes, regardless of duration.

  useEffect(() => {
    const step = steps[currentStep];

    if (!step.target) {
      setSpotlightRect(null);
      setPositionSettled(true);
      return;
    }

    const el = document.querySelector(step.target);
    if (!el) {
      setSpotlightRect(null);
      setPositionSettled(true);
      return;
    }

    setPositionSettled(false);
    const main = scrollContainerRef.current;
    if (main) main.style.overflow = 'auto';

    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });

    // Wait for scroll to begin, then poll until position stabilises.
    // The initial delay prevents false "stable" detection before scroll starts.
    let cancelled = false;
    const delay = reduceMotion ? 50 : SCROLL_START_DELAY_MS;

    const delayTimer = setTimeout(() => {
      if (cancelled) return;
      let lastTop = el.getBoundingClientRect().top;
      let stableFrames = 0;
      const startTime = Date.now();

      const checkStable = () => {
        if (cancelled) return;
        const top = el.getBoundingClientRect().top;

        if (Math.abs(top - lastTop) < 1) {
          stableFrames++;
        } else {
          stableFrames = 0;
        }
        lastTop = top;

        if (stableFrames >= SCROLL_STABLE_FRAMES || Date.now() - startTime > SCROLL_MAX_WAIT_MS) {
          if (main) main.style.overflow = 'hidden';
          setSpotlightRect(measureTarget(step.target, step.spotlightAdjust));
          setPositionSettled(true);
          return;
        }

        requestAnimationFrame(checkStable);
      };
      requestAnimationFrame(checkStable);
    }, delay);

    return () => { cancelled = true; clearTimeout(delayTimer); };
  }, [currentStep, measureTarget, reduceMotion]);

  // ─── Re-measure on Resize ──────────────────────────────────────────────

  useEffect(() => {
    const handleResize = () => {
      const step = steps[currentStep];
      if (step.target) setSpotlightRect(measureTarget(step.target, step.spotlightAdjust));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentStep, measureTarget]);

  // ─── Interactive: waitFor Polling ──────────────────────────────────────

  useEffect(() => {
    const step = steps[currentStep];
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
    const step = steps[currentStep];
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

    // Immediate check — catches elements that appeared in the same React commit
    // (before the observer was connected, so it wouldn't see the mutation).
    if (step.advanceOnAppear && document.querySelector(step.advanceOnAppear)) {
      safeAdvance();
    }
    if (step.advanceOnDisappear && !document.querySelector(step.advanceOnDisappear)) {
      safeAdvance();
    }

    // Polling backup for advanceOnDisappear — catches cases where MutationObserver
    // misses the portal removal (e.g. React batching the unmount across frames).
    let pollId;
    if (step.advanceOnDisappear) {
      pollId = setInterval(() => {
        if (!document.querySelector(step.advanceOnDisappear)) {
          safeAdvance();
        }
      }, 300);
    }

    return () => {
      observer.disconnect();
      if (pollId) clearInterval(pollId);
    };
  }, [currentStep, safeAdvance]);

  // ─── Interactive: advanceOnClick ──────────────────────────────────────

  useEffect(() => {
    const step = steps[currentStep];
    if (!step.advanceOnClick) return;

    // Use event delegation so it works even if the target element is
    // destroyed and recreated (e.g. library modal closed and reopened).
    const handler = (e) => {
      if (e.target.closest(step.advanceOnClick)) {
        safeAdvance();
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [currentStep, safeAdvance]);

  // ─── Navigation Handlers ──────────────────────────────────────────────

  const handleNext = useCallback(() => {
    const step = steps[currentStep];

    if (step.nextClick) {
      const el = document.querySelector(step.nextClick);
      if (el) {
        el.click();
        // If there's an observer-based advancement, let it handle the step change
        if (step.advanceOnAppear || step.advanceOnDisappear || step.advanceOnClick) {
          return;
        }
      } else if (step.fallbackClick) {
        // Target not in DOM (e.g. library closed) — reopen via fallback,
        // then click the target once it appears.
        const fallback = document.querySelector(step.fallbackClick);
        if (fallback) {
          fallback.click();
          const waitAndClick = () => {
            const target = document.querySelector(step.nextClick);
            if (target) { target.click(); return; }
            requestAnimationFrame(waitAndClick);
          };
          requestAnimationFrame(waitAndClick);
        }
        return;
      } else {
        // nextClick target is gone and no fallbackClick — try to pre-trigger the
        // next step's action so the transition is seamless (e.g. module-detail
        // modal already closed → open the library before advancing).
        const nextStep = steps[currentStep + 1];
        if (nextStep?.nextClick) {
          const nextEl = document.querySelector(nextStep.nextClick);
          if (nextEl) nextEl.click();
        }
      }
    }

    // Default: just advance
    safeAdvance();
  }, [currentStep, steps, safeAdvance]);

  const handleBack = useCallback(() => {
    const step = steps[currentStep];

    // If this step has a cleanup action (close modal/drawer), do it first
    if (step.cleanupClick) {
      const closeEl = document.querySelector(step.cleanupClick);
      if (closeEl) {
        closeEl.click();
        setTimeout(() => {
          setTextFading(true);
          setPositionSettled(false);
          setCurrentStep((s) => s - 1);
        }, CLEANUP_DELAY_MS);
        return;
      }
    }

    setTextFading(true);
    setPositionSettled(false);
    setCurrentStep((s) => s - 1);
  }, [currentStep]);

  // ─── Early Return ─────────────────────────────────────────────────────

  if (!isActive) return null;

  // ─── Derived State ────────────────────────────────────────────────────

  const clampedStep = Math.min(currentStep, steps.length - 1);
  const step = steps[clampedStep];
  const isFirst = clampedStep === 0;
  const isLast = clampedStep === steps.length - 1;
  const isCenter = !step.target || step.position === 'center';
  const overlayOpacity = phase === 'visible' ? 1 : 0;
  const isInteractive = !!step.interactive;

  // ─── Tooltip Positioning ──────────────────────────────────────────────

  const getTooltipStyle = () => {
    const zIndex = step.tooltipZ || 110;

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
    <>
      {/* Overlay layer — haze + click absorber (z-55, below modals) */}
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
        {!isInteractive && (
          <div
            style={{ position: 'absolute', inset: 0, zIndex: 55 }}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        <div
          style={{
            position: 'fixed',
            top: isCenter || !spotlightRect ? window.innerHeight / 2 : spotlightRect.top,
            left: isCenter || !spotlightRect ? window.innerWidth / 2 : spotlightRect.left,
            width: isCenter || !spotlightRect ? 0 : spotlightRect.width,
            height: isCenter || !spotlightRect ? 0 : spotlightRect.height,
            borderRadius: '24px',
            opacity: step.noHaze ? 0 : 1,
            boxShadow: `0 0 0 9999px ${hazeColor}`,
            filter: reduceMotion ? 'none' : `blur(${BLUR_RADIUS}px)`,
            transition: reduceMotion ? 'none' : `opacity ${TRANSITION_MS}ms var(--ease-default), top ${TRANSITION_MS}ms var(--ease-default), left ${TRANSITION_MS}ms var(--ease-default), width ${TRANSITION_MS}ms var(--ease-default), height ${TRANSITION_MS}ms var(--ease-default)`,
            zIndex: 55,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Tooltip card — independent stacking context above modals (z-110) */}
      <div
        style={{
          ...getTooltipStyle(),
          pointerEvents: 'auto',
          opacity: overlayOpacity,
          transition: `opacity ${fadeDuration} var(--ease-default)`,
        }}
        className="w-[calc(100%-3rem)] max-w-sm"
      >
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
          className="bg-[var(--color-bg)] rounded-2xl px-5 pt-3 pb-3"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06), 0 0 24px 12px var(--color-bg)' }}
        >
          <p
            className="text-[var(--accent)] text-sm leading-relaxed"
            style={{
              textTransform: 'none',
              opacity: textFading ? 0 : 1,
              visibility: textFading ? 'hidden' : 'visible',
              transition: reduceMotion ? 'none' : `opacity ${TEXT_FADE_OUT_MS}ms ease, visibility ${TEXT_FADE_OUT_MS}ms`,
            }}
          >
            {displayedDesc}
          </p>

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
              {steps.map((_, i) => (
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
    </>
  );
}

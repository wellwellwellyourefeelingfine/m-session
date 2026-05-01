/**
 * SEE FIRST: ../MasterModuleStyleSheet.md
 *   Conventions for headers, prompt slots, animations & transitions, smooth
 *   scroll, header/animation continuity within a section, and the persistBlocks
 *   pattern are all documented there. Read it before changing renderer behavior
 *   that affects how authors write content configs.
 *
 * ScreensSection — Step-through screen sequence with block-based rendering
 *
 * Each screen is a vertical stack of blocks. Shorthand screen types
 * (text, prompt, selector, etc.) auto-expand into a header block + content block.
 * Explicit `blocks` arrays allow free composition of any block combination.
 *
 * Supports conditional rendering:
 * - Blocks with a `condition` field are filtered based on module state
 * - Screens with a `condition` field are skipped during navigation
 *
 * Fade behavior:
 * - Content fades in on mount (section entry)
 * - Body blocks fade on screen transitions
 * - Header fades out with body when the next screen has no header
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ModuleLayout from '../../../capabilities/ModuleLayout';
import ModuleControlBar, { SlotButton } from '../../../capabilities/ModuleControlBar';
import { ViewImageIcon } from '../../../capabilities/ImageViewerModal';
import {
  TextBlock, PromptBlock, SelectorBlock,
  ChoiceBlock, AnimationBlock, AlarmBlock, ReviewBlock,
  DotSeparatorBlock,
} from '../blockRenderers';
import { ANIMATION_MAP } from '../blockRenderers/HeaderBlock';
import { renderLineWithMarkup } from '../utils/renderContentLines';
import resolveAnimationKey from '../utils/resolveAnimationKey';
import expandScreenToBlocks from '../utils/expandScreenToBlocks';
import evaluateCondition from '../utils/evaluateCondition';
import { smoothScrollToElement } from '../../../../../utils/smoothScroll';

// Fade speeds: default (snappy) for most content, ritual (slower, more intentional)
// for sections with `ritualFade: true` in their config.
const FADE_DEFAULT = 400;
const FADE_RITUAL = 700;

export default function ScreensSection({
  section,
  accentTerms,
  moduleTitle,
  // Data state (owned by parent useMasterModuleState)
  responses,
  selectorValues,
  selectorJournals,
  choiceValues,
  visitedSections,
  allBlocksWithPromptIndex,
  onSetPromptResponse,
  onToggleSelector,
  onSetSelectorJournal,
  onChoiceSelect,
  // Navigation callbacks
  onSectionComplete,
  onSkip,
  // Back navigation across section boundaries
  canGoBackToPreviewSection,
  onBackToPreviousSection,
  // Optional further fallback — when there are no previous screens AND no
  // previous section to return to, Back drops the user on the module's
  // idle screen. MasterModule wires this to its goBackToIdle action.
  onBackToIdle,
  // Last-section flag — when true, ScreensSection labels the primary
  // "Continue" button "Complete" on the section's last visible screen so
  // the user knows they're at the end of the module.
  isLastSection = false,
  // Generated images (for right-slot viewer)
  generatedImages,
  onOpenViewer,
  // Cross-section routing (called when a choice with a route is confirmed)
  onRouteToSection,
  // Progress reporting (called when screen position changes)
  onScreenChange,
  // Persistent-header bridge — when provided, ScreensSection suppresses its
  // own title/animation render and reports the current screen's header to
  // the parent (MasterModule) on every screen change. The parent owns the
  // crossfade so the header survives section unmounts. When ABSENT (e.g.
  // TransitionModule), ScreensSection renders its own header inline as before.
  onHeaderChange,
  // Peek the destination section's first-screen header for the next
  // transition (sequential advance with `null`, or a routeConfig). Lets
  // ScreensSection eagerly tell the parent about the future header at t=0
  // for cross-section transitions, so the persistent header's crossfade
  // runs in parallel with the body fade instead of lagging by FADE_MS.
  peekNextSectionHeader,
  // ── Transition-module extensions (absent when used by MasterModule) ──
  customBlockRegistry,        // { blockType: Component } — custom block renderers
  sessionData,                // derived session-level data (passed to condition evaluator + custom blocks)
  storeState,                 // full session store snapshot (for storeValue conditions)
  skipEnabled = true,         // transition configs can disable Skip entirely
  skipConfirmMessage = 'Skip this activity?',
}) {
  const headerExternal = typeof onHeaderChange === 'function';
  const screens = useMemo(() => section.screens || [], [section.screens]);
  const FADE_MS = section.ritualFade ? FADE_RITUAL : FADE_DEFAULT;
  const [screenIndex, setScreenIndex] = useState(0);
  const [isTitleVisible, setIsTitleVisible] = useState(false);
  const [isAnimationVisible, setIsAnimationVisible] = useState(false);
  const [isBodyVisible, setIsBodyVisible] = useState(false);

  // Fade in on mount (section entry).
  // Also reset the main scroll container to the top — section transitions
  // unmount and remount this component, but the browser scroll position
  // persists across renders. Without this, advancing into a new section
  // while scrolled to the bottom of the previous one lands the user
  // mid-page on the new section's body.
  useEffect(() => {
    document.querySelector('main')?.scrollTo(0, 0);
    const raf = requestAnimationFrame(() => {
      setIsTitleVisible(true);
      setIsAnimationVisible(true);
      setIsBodyVisible(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Block readiness map (for custom blocks that gate Continue via reportReady)
  const [blockReadiness, setBlockReadiness] = useState({});

  const reportReady = useCallback((blockKey, isReady) => {
    setBlockReadiness((prev) => {
      if (prev[blockKey] === isReady) return prev;
      return { ...prev, [blockKey]: isReady };
    });
  }, []);

  // Primary-button override (for custom blocks that want to relabel and
  // intercept Continue — e.g., IngestionTimeBlock swapping Continue to
  // "Confirm time" so the modal fires before advance). Null = use defaults.
  const [primaryOverride, setPrimaryOverrideState] = useState(null);

  const setPrimaryOverride = useCallback((next) => {
    setPrimaryOverrideState((prev) => {
      if (prev === next) return prev;
      if (prev == null && next == null) return prev;
      if (prev != null && next != null
        && prev.label === next.label
        && prev.onClick === next.onClick) return prev;
      return next;
    });
  }, []);

  // Note: blockReadiness and primaryOverride are cleared synchronously alongside
  // setScreenIndex in handleNext / handleBack — NOT via a reactive useEffect.
  // Using an effect here races with newly-mounted blocks' reportReady calls
  // (child effects fire before parent effects), which briefly flipped Continue
  // enabled→disabled→enabled during screen transitions. Clearing in the same
  // state-update batch as setScreenIndex keeps the handoff clean.

  // Condition evaluation context (includes sessionData + storeState when provided)
  const conditionContext = useMemo(() => ({
    choiceValues,
    selectorValues,
    visitedSections: visitedSections || [],
    sessionData,
    storeState,
  }), [choiceValues, selectorValues, visitedSections, sessionData, storeState]);

  const isScreenVisible = useCallback((screen) => {
    return evaluateCondition(screen.condition, conditionContext);
  }, [conditionContext]);

  const currentScreen = screens[screenIndex];

  // Find next/previous visible screen
  const findNextVisibleScreen = useCallback((fromIndex) => {
    for (let i = fromIndex; i < screens.length; i++) {
      if (isScreenVisible(screens[i])) return i;
    }
    return -1;
  }, [screens, isScreenVisible]);

  const findPrevVisibleScreen = useCallback((fromIndex) => {
    for (let i = fromIndex; i >= 0; i--) {
      if (isScreenVisible(screens[i])) return i;
    }
    return -1;
  }, [screens, isScreenVisible]);

  // Count visible screens and current position among them (1-based)
  const visibleScreenInfo = useMemo(() => {
    let totalVisible = 0;
    let currentPosition = 0;
    for (let i = 0; i < screens.length; i++) {
      if (isScreenVisible(screens[i])) {
        totalVisible++;
        if (i <= screenIndex) currentPosition = totalVisible;
      }
    }
    return { currentPosition, totalVisible };
  }, [screens, screenIndex, isScreenVisible]);

  // Report screen position to parent for progress bar
  useEffect(() => {
    onScreenChange?.(visibleScreenInfo.currentPosition, visibleScreenInfo.totalVisible);
  }, [visibleScreenInfo.currentPosition, visibleScreenInfo.totalVisible, onScreenChange]);

  // Expand current screen to blocks and filter by condition
  const currentBlocks = useMemo(() => {
    if (!currentScreen) return [];
    return expandScreenToBlocks(currentScreen, moduleTitle);
  }, [currentScreen, moduleTitle]);

  // Split into header block and body blocks
  const headerBlock = currentBlocks[0]?.type === 'header'
    ? (evaluateCondition(currentBlocks[0].condition, conditionContext) ? currentBlocks[0] : null)
    : null;

  // Resolve the animation component for the header (stable reference for rendering).
  // animation: undefined → defaults to ascii-moon. animation: null → no animation
  // at all (text-heavy beat where the title alone is enough).
  const headerAnimationKey = resolveAnimationKey(headerBlock);
  const HeaderAnimationComp = headerAnimationKey ? ANIMATION_MAP[headerAnimationKey] : null;
  const headerAnimationProps = headerBlock?.animationProps || {};

  // Report current screen's header up to the parent (MasterModule) when the
  // parent is managing the persistent header. Fires on mount and whenever the
  // current screen's title or animation key changes — including remount after
  // a section transition (the new section's first screen reasserts its header
  // here, and MasterModule decides whether to crossfade or persist).
  //
  // For within-section advance/back, handleNext/handleBack ALSO report the
  // future screen's header BEFORE the body-fade timeout so the parent's
  // crossfade runs in parallel with the body fade. This effect catches the
  // initial mount and any state-driven header recomputation that handleNext
  // doesn't pre-announce.
  const reportedTitleRef = useRef(null);
  const reportedAnimRef = useRef(null);
  useEffect(() => {
    if (!headerExternal) return;
    const title = headerBlock?.title || null;
    const anim = headerAnimationKey || null;
    if (reportedTitleRef.current === title && reportedAnimRef.current === anim) return;
    reportedTitleRef.current = title;
    reportedAnimRef.current = anim;
    onHeaderChange({ title, animationKey: anim, durationMs: FADE_MS });
  }, [headerExternal, headerBlock?.title, headerAnimationKey, onHeaderChange, FADE_MS]);

  const bodyBlocks = useMemo(() => {
    const rawBody = currentBlocks[0]?.type === 'header' ? currentBlocks.slice(1) : currentBlocks;
    return rawBody.filter((block) => evaluateCondition(block.condition, conditionContext));
  }, [currentBlocks, conditionContext]);

  // Get a screen's header block (or null)
  const getScreenHeader = useCallback((idx) => {
    if (idx < 0 || idx >= screens.length) return null;
    const blocks = expandScreenToBlocks(screens[idx], moduleTitle);
    return blocks[0]?.type === 'header' ? blocks[0] : null;
  }, [screens, moduleTitle]);

  // Ordered list of unique `promptIndex` values visible across this section.
  // Counts each prompt ONCE even if it appears on multiple screens (the
  // progressive-reveal pattern in `persistBlocks` sections spreads a single
  // prompt across several screens so it stays on page as the user advances).
  // Without this dedupe the "X of Y" counter below each prompt inflates to
  // the sum of appearances — e.g. the inner-dialogue activity reported "20 of
  // 20" instead of "5 of 5".
  const orderedUniquePromptIndices = useMemo(() => {
    const seen = new Set();
    const order = [];
    for (const screen of screens) {
      if (!isScreenVisible(screen)) continue;
      const blocks = expandScreenToBlocks(screen, moduleTitle);
      for (const b of blocks) {
        if (b.type !== 'prompt') continue;
        if (!evaluateCondition(b.condition, conditionContext)) continue;
        const idx = b.promptIndex;
        if (idx == null || seen.has(idx)) continue;
        seen.add(idx);
        order.push(idx);
      }
    }
    return order;
  }, [screens, moduleTitle, isScreenVisible, conditionContext]);

  const totalVisiblePrompts = orderedUniquePromptIndices.length;

  // Detect "this Continue press will end the section." Combined with
  // isLastSection, that's the moment to swap "Continue" → "Complete" so the
  // user knows the next press finishes the module. Section authors can
  // override the default with `section.primaryLabel`.
  const isOnLastVisibleScreen = useMemo(() => {
    return findNextVisibleScreen(screenIndex + 1) === -1;
  }, [findNextVisibleScreen, screenIndex]);

  const getPrimaryLabel = () => {
    if (section.primaryLabel) return section.primaryLabel;
    if (isLastSection && isOnLastVisibleScreen) return 'Complete';
    return 'Continue';
  };

  const handleNext = useCallback(() => {
    // Check if the current screen has a choice block with a route selected
    const selectedRoute = (() => {
      for (const block of bodyBlocks) {
        if (block.type === 'choice' && choiceValues[block.key]) {
          const selectedOption = block.options?.find((o) => o.id === choiceValues[block.key]);
          if (selectedOption?.route) return selectedOption.route;
        }
      }
      return null;
    })();

    // Persisted choices are durable — if the user back-navigates to a choice
    // screen, their prior selection is visible and pressing Continue re-fires
    // it. This is deliberate: the button contract is honest, and gate patterns
    // (Opening Ritual Crossroads) depend on re-selection working every time.
    const shouldFireRoute = selectedRoute && onRouteToSection;

    if (shouldFireRoute) {
      // Eagerly tell the parent about the route destination's first-screen
      // header so its crossfade runs in PARALLEL with the body fade. Without
      // this, the destination section would mount FADE_MS later and only
      // then reassert its header — visible as the title/animation lagging
      // the body by a full fade cycle.
      if (headerExternal && peekNextSectionHeader) {
        const futureHeader = peekNextSectionHeader(selectedRoute);
        onHeaderChange({
          title: futureHeader?.title || null,
          animationKey: futureHeader?.animationKey || null,
          durationMs: FADE_MS,
        });
      }
      setIsBodyVisible(false);
      setIsTitleVisible(false);
      setIsAnimationVisible(false);
      setTimeout(() => {
        onRouteToSection(selectedRoute);
      }, FADE_MS);
      return;
    }
    // If the route target is already visited, fall through to normal sequential advance.

    const nextVisible = findNextVisibleScreen(screenIndex + 1);

    if (nextVisible === -1) {
      // No more visible screens — fade everything and complete section.
      // Eagerly tell the parent about the next section's first-screen header
      // for parallel crossfade (same rationale as the route branch above).
      if (headerExternal && peekNextSectionHeader) {
        const futureHeader = peekNextSectionHeader(null);
        onHeaderChange({
          title: futureHeader?.title || null,
          animationKey: futureHeader?.animationKey || null,
          durationMs: FADE_MS,
        });
      }
      setIsBodyVisible(false);
      setIsTitleVisible(false);
      setIsAnimationVisible(false);
      setTimeout(() => {
        onSectionComplete();
      }, FADE_MS);
    } else {
      // Compare current and next header to decide what fades
      const nextHeader = getScreenHeader(nextVisible);
      const sameTitle = headerBlock?.title && nextHeader?.title && headerBlock.title === nextHeader.title;
      const sameAnimation = headerBlock && nextHeader
        && resolveAnimationKey(headerBlock) === resolveAnimationKey(nextHeader);

      // Eagerly tell the parent about the next screen's header so its
      // crossfade runs IN PARALLEL with the body fade. Without this, the
      // useEffect on `headerBlock?.title`/`headerAnimationKey` would fire only
      // after `setScreenIndex(nextVisible)` re-renders — i.e. one full
      // FADE_MS later — which would stagger the title/animation fade behind
      // the body. Same-value reports are deduped by the parent.
      if (headerExternal) {
        onHeaderChange({
          title: nextHeader?.title || null,
          animationKey: resolveAnimationKey(nextHeader),
          durationMs: FADE_MS,
        });
      }

      // persistBlocks: keep the body mounted across screens in this section.
      // React's keyed reconciliation reuses DOM for blocks at matching indexes,
      // so shared blocks stay untouched; newly-mounted blocks auto-fade via
      // `animate-fade-in`. We skip the hard scroll-to-top (the user stays
      // anchored) but if any new block appears below the fold, smooth-scroll
      // to bring its top into view.
      if (section.persistBlocks) {
        // Count the visible body blocks the next screen will render so we can
        // detect a "new block appears" case. Uses the same expand + condition
        // filter as `bodyBlocks`.
        const nextAllBlocks = expandScreenToBlocks(screens[nextVisible], moduleTitle);
        const nextBodyBlocks = (nextAllBlocks[0]?.type === 'header' ? nextAllBlocks.slice(1) : nextAllBlocks)
          .filter((b) => evaluateCondition(b.condition, conditionContext));
        const firstNewIndex = bodyBlocks.length;
        const hasNewBlock = nextBodyBlocks.length > bodyBlocks.length;

        if (!sameTitle) setIsTitleVisible(false);
        if (!sameAnimation) setIsAnimationVisible(false);
        setTimeout(() => {
          // Batched with setScreenIndex — see note near `reportReady` above.
          setBlockReadiness({});
          setPrimaryOverrideState(null);
          setScreenIndex(nextVisible);
          if (nextHeader) {
            setIsTitleVisible(true);
            setIsAnimationVisible(true);
          }
          // After React commits the new DOM, smooth-scroll the newly-mounted
          // block into view. Uses smoothScrollToElement's defaults
          // (sinusoidal ease-in-out, 900ms) — see smoothScroll.js for why
          // sine instead of cubic. The non-persistBlocks branch still does a
          // hard scrollTo(0, 0); this only runs for persistBlocks
          // transitions where existing content stays in place.
          if (hasNewBlock) {
            // Skip leading dot-separator blocks as scroll targets — the user
            // should land on the new TEXT, with the freshly-drawing dots in
            // peripheral view rather than at the top of the viewport. The
            // separator's SVG draw-in still plays as the eye tracks down.
            requestAnimationFrame(() => {
              let scrollIndex = firstNewIndex;
              while (
                scrollIndex < nextBodyBlocks.length - 1
                && nextBodyBlocks[scrollIndex].type === 'dot-separator'
              ) {
                scrollIndex++;
              }
              const target = document.querySelector(`[data-block-index="${scrollIndex}"]`);
              smoothScrollToElement(target);
            });
          }
        }, (sameTitle && sameAnimation) ? 0 : FADE_MS);
        return;
      }

      // Fade out body always; fade title/animation only if they change
      setIsBodyVisible(false);
      if (!sameTitle) setIsTitleVisible(false);
      if (!sameAnimation) setIsAnimationVisible(false);

      setTimeout(() => {
        document.querySelector('main')?.scrollTo(0, 0);
        // Batched with setScreenIndex — see note near `reportReady` above.
        setBlockReadiness({});
        setPrimaryOverrideState(null);
        setScreenIndex(nextVisible);
        setIsBodyVisible(true);
        // Fade in title/animation for the new screen
        if (nextHeader) {
          setIsTitleVisible(true);
          setIsAnimationVisible(true);
        }
      }, FADE_MS);
    }
  }, [screenIndex, bodyBlocks, choiceValues, headerBlock, findNextVisibleScreen, onSectionComplete, onRouteToSection, getScreenHeader, FADE_MS, section.persistBlocks, screens, moduleTitle, conditionContext, headerExternal, onHeaderChange, peekNextSectionHeader]);

  const handleBack = useCallback(() => {
    const prevVisible = findPrevVisibleScreen(screenIndex - 1);

    if (prevVisible === -1) {
      // Back chain: previous section (if any) → module idle (if available).
      // Always-show-Back is a MasterModule UX rule — there's never a screen
      // a user can land on without a way back.
      if (canGoBackToPreviewSection) {
        onBackToPreviousSection();
      } else if (typeof onBackToIdle === 'function') {
        onBackToIdle();
      }
      return;
    }

    const prevHeader = getScreenHeader(prevVisible);
    const sameTitle = headerBlock?.title && prevHeader?.title && headerBlock.title === prevHeader.title;
    const sameAnimation = headerBlock && prevHeader
      && resolveAnimationKey(headerBlock) === resolveAnimationKey(prevHeader);

    // Eagerly tell the parent about the previous screen's header so its
    // crossfade runs in parallel with the body fade — same rationale as
    // the eager call in handleNext.
    if (headerExternal) {
      onHeaderChange({
        title: prevHeader?.title || null,
        animationKey: resolveAnimationKey(prevHeader),
        durationMs: FADE_MS,
      });
    }

    // persistBlocks: same rationale as handleNext — keep the body mounted.
    if (section.persistBlocks) {
      if (!sameTitle) setIsTitleVisible(false);
      if (!sameAnimation) setIsAnimationVisible(false);
      setTimeout(() => {
        // Batched with setScreenIndex — see note near `reportReady` above.
        setBlockReadiness({});
        setPrimaryOverrideState(null);
        setScreenIndex(prevVisible);
        if (prevHeader) {
          setIsTitleVisible(true);
          setIsAnimationVisible(true);
        }
      }, (sameTitle && sameAnimation) ? 0 : FADE_MS);
      return;
    }

    setIsBodyVisible(false);
    if (!sameTitle) setIsTitleVisible(false);
    if (!sameAnimation) setIsAnimationVisible(false);

    setTimeout(() => {
      document.querySelector('main')?.scrollTo(0, 0);
      // Batched with setScreenIndex — see note near `reportReady` above.
      setBlockReadiness({});
      setPrimaryOverrideState(null);
      setScreenIndex(prevVisible);
      setIsBodyVisible(true);
      if (prevHeader) {
        setIsTitleVisible(true);
        setIsAnimationVisible(true);
      }
    }, FADE_MS);
  }, [screenIndex, headerBlock, findPrevVisibleScreen, canGoBackToPreviewSection, onBackToPreviousSection, getScreenHeader, FADE_MS, section.persistBlocks, onBackToIdle, headerExternal, onHeaderChange]);

  const handleChoiceSelect = useCallback((key, optionId) => {
    onChoiceSelect(key, optionId);
  }, [onChoiceSelect]);

  // Render a single block by type
  const renderBlock = (block, _blockIndex) => {
    switch (block.type) {
      case 'text':
        return <TextBlock screen={block} accentTerms={accentTerms} />;

      case 'prompt': {
        // Position in the ordered list of unique visible prompts for this
        // section — stable across screens, so a prompt that persists through
        // a progressive reveal keeps the same number.
        const uniquePos = orderedUniquePromptIndices.indexOf(block.promptIndex);
        const promptNumber = uniquePos >= 0 ? uniquePos + 1 : null;

        return (
          <PromptBlock
            screen={block}
            value={responses[block.promptIndex]}
            onChange={(value) => onSetPromptResponse(block.promptIndex, value)}
            promptNumber={promptNumber}
            totalPrompts={totalVisiblePrompts}
            accentTerms={accentTerms}
          />
        );
      }

      case 'selector':
        return (
          <SelectorBlock
            screen={block}
            selectedValue={selectorValues[block.key]}
            onToggle={onToggleSelector}
            journalValue={selectorJournals[block.key]}
            onJournalChange={onSetSelectorJournal}
          />
        );

      case 'choice': {
        // Filter options by per-option `condition` so content authors can gate
        // which options appear based on session state (e.g. show "keep —
        // relationship" only when effectiveFocus === 'relationship'). Mirrors
        // the block-level filter in `bodyBlocks` above.
        const visibleOptions = (block.options || [])
          .filter((opt) => evaluateCondition(opt.condition, conditionContext));
        if (visibleOptions.length === 0) return null;
        return (
          <ChoiceBlock
            screen={{ ...block, options: visibleOptions }}
            selectedValue={choiceValues[block.key]}
            onChoiceSelect={handleChoiceSelect}
            visitedSections={visitedSections}
            accentTerms={accentTerms}
          />
        );
      }

      case 'animation':
        return <AnimationBlock screen={block} accentTerms={accentTerms} />;

      case 'dot-separator':
        return <DotSeparatorBlock screen={block} />;

      case 'alarm':
        return <AlarmBlock screen={block} />;

      case 'review':
        return (
          <ReviewBlock
            screen={block}
            responses={responses}
            onSetPromptResponse={onSetPromptResponse}
            allBlocksWithPromptIndex={allBlocksWithPromptIndex || []}
            conditionContext={conditionContext}
          />
        );

      default: {
        // Custom block registry fallback (transition-only)
        const CustomBlock = customBlockRegistry?.[block.type];
        if (CustomBlock) {
          return (
            <CustomBlock
              block={block}
              context={{
                // State reads
                responses,
                selectorValues,
                choiceValues,
                selectorJournals,
                visitedSections: visitedSections || [],
                sessionData,
                storeState,
                conditionContext,
                // State writers
                setPromptResponse: onSetPromptResponse,
                toggleSelector: onToggleSelector,
                setSelectorJournal: onSetSelectorJournal,
                setChoiceValue: onChoiceSelect,
                // Navigation
                advanceSection: onSectionComplete,
                routeToSection: onRouteToSection,
                // Readiness gating
                reportReady,
                // Primary-button override (label + onClick)
                setPrimaryOverride,
                // Utility
                accentTerms,
              }}
            />
          );
        }
        return null;
      }
    }
  };

  // Check if any visible body block is a choice
  const hasChoiceBlock = bodyBlocks.some((b) => b.type === 'choice');
  const allChoicesSelected = bodyBlocks
    .filter((b) => b.type === 'choice')
    .every((b) => choiceValues[b.key]);

  // Readiness gating — any block reporting ready: false disables Continue + Skip
  const anyBlockNotReady = Object.values(blockReadiness).some((r) => r === false);

  const hasPreviousVisible = findPrevVisibleScreen(screenIndex - 1) !== -1;

  return (
    <>
      <ModuleLayout layout={{ centered: false, maxWidth: 'sm', padding: 'normal' }}>
        <div className={headerExternal ? '' : 'pt-2'}>
          {/* Header title — fades independently. Suppressed when the parent
              owns the persistent header (MasterModule path). */}
          {!headerExternal && headerBlock?.title && (
            <div
              className={`transition-opacity ${isTitleVisible ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDuration: `${FADE_MS}ms` }}
            >
              <h2
                className={headerBlock.titleClassName || 'text-xl font-light mb-2 text-center'}
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                {renderLineWithMarkup(headerBlock.title, accentTerms)}
              </h2>
            </div>
          )}

          {/* Header animation — fades independently. Suppressed when the parent
              owns the persistent header (MasterModule path). */}
          {!headerExternal && HeaderAnimationComp && (
            <div
              className={`transition-opacity ${isAnimationVisible ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDuration: `${FADE_MS}ms` }}
            >
              <div className="flex justify-center mb-4">
                <HeaderAnimationComp {...headerAnimationProps} />
              </div>
            </div>
          )}

          {/* Body blocks — fade together on screen transition, unless
              `section.persistBlocks` is set, in which case the wrapper stays
              opaque across screens and newly-mounted blocks fade themselves in
              via `animate-fade-in`. React's keyed reconciliation preserves
              DOM for blocks at matching indexes, so unchanged blocks don't
              re-animate. */}
          <div
            className={`transition-opacity ${isBodyVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDuration: `${FADE_MS}ms`, paddingBottom: '6rem' }}
          >
            {bodyBlocks.map((block, i) => {
              const topSpacing = i === 0
                ? ''
                : (block.tightAbove ? 'mt-2' : 'mt-4');
              // Dot-separator blocks self-animate via stroke-dashoffset and
              // must NOT inherit the wrapper's 6px-translateY fade-in. The
              // SVG handles its own draw-in entry. See MasterModuleStyleSheet
              // §6 (the persistBlocks reveal pattern).
              const isStaticEntry = block.type === 'dot-separator';
              const fadeClass = (section.persistBlocks && !isStaticEntry) ? ' animate-fade-in' : '';
              return (
                <div
                  key={i}
                  data-block-index={i}
                  className={`${topSpacing}${fadeClass}`}
                >
                  {renderBlock(block, i)}
                </div>
              );
            })}
          </div>
        </div>
      </ModuleLayout>

      <ModuleControlBar
        phase="active"
        primary={(() => {
          const isDisabled = (hasChoiceBlock && !allChoicesSelected) || anyBlockNotReady;
          if (primaryOverride) {
            return {
              label: primaryOverride.label,
              onClick: primaryOverride.onClick,
              disabled: isDisabled,
            };
          }
          return { label: getPrimaryLabel(), onClick: handleNext, disabled: isDisabled };
        })()}
        showBack={hasPreviousVisible || canGoBackToPreviewSection || typeof onBackToIdle === 'function'}
        onBack={handleBack}
        backConfirmMessage={null}
        showSkip={skipEnabled && !anyBlockNotReady}
        onSkip={onSkip}
        skipConfirmMessage={skipConfirmMessage}
        rightSlot={
          section.rightSlotViewer && generatedImages?.[section.rightSlotViewer]
            ? <SlotButton icon={<ViewImageIcon />} label="View image" onClick={() => onOpenViewer?.(section.rightSlotViewer)} />
            : undefined
        }
      />
    </>
  );
}

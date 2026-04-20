/**
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

import { useState, useCallback, useMemo, useEffect } from 'react';
import ModuleLayout from '../../../capabilities/ModuleLayout';
import ModuleControlBar, { SlotButton } from '../../../capabilities/ModuleControlBar';
import { ViewImageIcon } from '../../../capabilities/ImageViewerModal';
import {
  TextBlock, PromptBlock, SelectorBlock,
  ChoiceBlock, AnimationBlock, AlarmBlock, ReviewBlock,
} from '../blockRenderers';
import { ANIMATION_MAP } from '../blockRenderers/HeaderBlock';
import expandScreenToBlocks from '../utils/expandScreenToBlocks';
import evaluateCondition from '../utils/evaluateCondition';

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
  // Generated images (for right-slot viewer)
  generatedImages,
  onOpenViewer,
  // Cross-section routing (called when a choice with a route is confirmed)
  onRouteToSection,
  // Progress reporting (called when screen position changes)
  onScreenChange,
  // ── Transition-module extensions (absent when used by MasterModule) ──
  customBlockRegistry,        // { blockType: Component } — custom block renderers
  sessionData,                // derived session-level data (passed to condition evaluator + custom blocks)
  storeState,                 // full session store snapshot (for storeValue conditions)
  skipEnabled = true,         // transition configs can disable Skip entirely
  skipConfirmMessage = 'Skip this activity?',
}) {
  const screens = section.screens || [];
  const FADE_MS = section.ritualFade ? FADE_RITUAL : FADE_DEFAULT;
  const [screenIndex, setScreenIndex] = useState(0);
  const [isTitleVisible, setIsTitleVisible] = useState(false);
  const [isAnimationVisible, setIsAnimationVisible] = useState(false);
  const [isBodyVisible, setIsBodyVisible] = useState(false);

  // Fade in on mount (section entry)
  useEffect(() => {
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

  // Resolve the animation component for the header (stable reference for rendering)
  const HeaderAnimationComp = headerBlock ? ANIMATION_MAP[headerBlock.animation || 'ascii-moon'] : null;
  const headerAnimationProps = headerBlock?.animationProps || {};

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

  // Count all visible prompt blocks across all visible screens
  const totalVisiblePrompts = useMemo(() => {
    return screens.reduce((count, screen) => {
      if (!isScreenVisible(screen)) return count;
      const blocks = expandScreenToBlocks(screen, moduleTitle);
      return count + blocks.filter((b) =>
        b.type === 'prompt' && evaluateCondition(b.condition, conditionContext)
      ).length;
    }, 0);
  }, [screens, moduleTitle, isScreenVisible, conditionContext]);

  const getPrimaryLabel = () => {
    return section.primaryLabel || 'Continue';
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
      // No more visible screens — fade everything and complete section
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
        && (headerBlock.animation || 'ascii-moon') === (nextHeader.animation || 'ascii-moon');

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
          // block into view. The non-persistBlocks branch still does a hard
          // scrollTo(0, 0); this only runs for persistBlocks transitions where
          // the user expects existing content to remain in place.
          if (hasNewBlock) {
            requestAnimationFrame(() => {
              const target = document.querySelector(`[data-block-index="${firstNewIndex}"]`);
              target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  }, [screenIndex, bodyBlocks, choiceValues, visitedSections, headerBlock, findNextVisibleScreen, onSectionComplete, onRouteToSection, getScreenHeader, FADE_MS, section.persistBlocks, screens, moduleTitle, conditionContext]);

  const handleBack = useCallback(() => {
    const prevVisible = findPrevVisibleScreen(screenIndex - 1);

    if (prevVisible === -1) {
      if (canGoBackToPreviewSection) {
        onBackToPreviousSection();
      }
      return;
    }

    const prevHeader = getScreenHeader(prevVisible);
    const sameTitle = headerBlock?.title && prevHeader?.title && headerBlock.title === prevHeader.title;
    const sameAnimation = headerBlock && prevHeader
      && (headerBlock.animation || 'ascii-moon') === (prevHeader.animation || 'ascii-moon');

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
  }, [screenIndex, headerBlock, findPrevVisibleScreen, canGoBackToPreviewSection, onBackToPreviousSection, getScreenHeader, FADE_MS, section.persistBlocks]);

  const handleChoiceSelect = useCallback((key, optionId) => {
    onChoiceSelect(key, optionId);
  }, [onChoiceSelect]);

  // Render a single block by type
  const renderBlock = (block, blockIndex) => {
    switch (block.type) {
      case 'text':
        return <TextBlock screen={block} accentTerms={accentTerms} />;

      case 'prompt': {
        const visiblePromptsBeforeThisScreen = (() => {
          let count = 0;
          for (let i = 0; i < screenIndex; i++) {
            if (!isScreenVisible(screens[i])) continue;
            const blocks = expandScreenToBlocks(screens[i], moduleTitle);
            count += blocks.filter((b) =>
              b.type === 'prompt' && evaluateCondition(b.condition, conditionContext)
            ).length;
          }
          return count;
        })();
        const promptsBeforeThisBlock = bodyBlocks
          .slice(0, blockIndex)
          .filter((b) => b.type === 'prompt').length;
        const promptNumber = visiblePromptsBeforeThisScreen + promptsBeforeThisBlock + 1;

        return (
          <PromptBlock
            screen={block}
            value={responses[block.promptIndex]}
            onChange={(value) => onSetPromptResponse(block.promptIndex, value)}
            promptNumber={promptNumber}
            totalPrompts={totalVisiblePrompts}
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

      case 'choice':
        return (
          <ChoiceBlock
            screen={block}
            selectedValue={choiceValues[block.key]}
            onChoiceSelect={handleChoiceSelect}
            visitedSections={visitedSections}
          />
        );

      case 'animation':
        return <AnimationBlock screen={block} accentTerms={accentTerms} />;

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
        <div className="pt-2">
          {/* Header title — fades independently */}
          {headerBlock?.title && (
            <div
              className={`transition-opacity ${isTitleVisible ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDuration: `${FADE_MS}ms` }}
            >
              <h2
                className={headerBlock.titleClassName || 'text-xl font-light mb-2 text-center'}
                style={{ fontFamily: 'DM Serif Text, serif', textTransform: 'none' }}
              >
                {headerBlock.title}
              </h2>
            </div>
          )}

          {/* Header animation — fades independently */}
          {HeaderAnimationComp && (
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
              const fadeClass = section.persistBlocks ? ' animate-fade-in' : '';
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
        showBack={hasPreviousVisible || canGoBackToPreviewSection}
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
